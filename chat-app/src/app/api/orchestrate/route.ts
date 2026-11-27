import { getOpenRouterKey } from "@/lib/openrouter";
import {
  createPlan,
  runWorkerStep,
  synthesizeFinal,
  type OrchestratorPlan,
} from "@/lib/orchestrator";
import type { AgentStep } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface OrchestrateBody {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  orchestratorModel: string;
  workerModel: string;
}

function sseLine(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not set on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: OrchestrateBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { userMessage, history, orchestratorModel, workerModel } = body;
  if (!userMessage) {
    return new Response(JSON.stringify({ error: "userMessage required" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(sseLine(obj)));

      try {
        const planStep: AgentStep = {
          id: "plan",
          title: "Planning",
          status: "running",
        };
        send({ type: "step", step: planStep });

        const plan: OrchestratorPlan = await createPlan(
          apiKey,
          orchestratorModel || "openai/gpt-4o",
          userMessage,
          history,
          req.signal
        );

        send({
          type: "step_update",
          step: { ...planStep, status: "done", detail: plan.summaryGoal },
        });

        const outputs: string[] = [];
        const contextParts = [`Goal: ${plan.summaryGoal}`];

        for (let i = 0; i < plan.steps.length; i++) {
          const def = plan.steps[i];
          const stepId = `step-${i}`;
          const step: AgentStep = {
            id: stepId,
            title: def.title,
            status: "running",
            model: def.assignee === "worker" ? workerModel : orchestratorModel,
          };
          send({ type: "step", step });

          const model = def.assignee === "worker" ? workerModel : orchestratorModel;
          const context = contextParts.join("\n");
          let result: string;

          if (def.assignee === "orchestrator" && i === plan.steps.length - 1 && outputs.length > 0) {
            result = await synthesizeFinal(
              apiKey,
              orchestratorModel,
              userMessage,
              outputs,
              req.signal
            );
          } else {
            result = await runWorkerStep(
              apiKey,
              model,
              def.task,
              context,
              req.signal
            );
          }

          outputs.push(result);
          contextParts.push(`${def.title}: ${result.slice(0, 500)}`);

          send({
            type: "step_update",
            step: { ...step, status: "done", detail: result.slice(0, 280) + (result.length > 280 ? "…" : "") },
          });
        }

        let finalText = outputs[outputs.length - 1] ?? "";
        const lastStep = plan.steps[plan.steps.length - 1];
        const needsSynth =
          plan.steps.length > 1 && lastStep?.assignee !== "orchestrator";

        if (needsSynth) {
          const synthStep: AgentStep = {
            id: "synth",
            title: "Final answer",
            status: "running",
            model: orchestratorModel,
          };
          send({ type: "step", step: synthStep });
          finalText = await synthesizeFinal(
            apiKey,
            orchestratorModel,
            userMessage,
            outputs,
            req.signal
          );
          send({
            type: "step_update",
            step: { ...synthStep, status: "done" },
          });
        }

        send({ type: "token", content: finalText });
        send({ type: "done" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Orchestration failed";
        send({ type: "error", content: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}