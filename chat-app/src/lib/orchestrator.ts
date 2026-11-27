import {
  chatCompletionNonStream,
  type ChatCompletionMessage,
} from "./openrouter";

export interface OrchestratorPlan {
  steps: Array<{ title: string; assignee: "worker" | "orchestrator"; task: string }>;
  summaryGoal: string;
}

const PLANNER_SYSTEM = `You are an agent orchestrator. Given the user's request and conversation context, output ONLY valid JSON (no markdown fences) with this shape:
{
  "summaryGoal": "one line goal",
  "steps": [
    { "title": "short step name", "assignee": "worker" or "orchestrator", "task": "what to do in this step" }
  ]
}
Use 1-4 steps. Use "worker" for research, drafting, coding, or detail work; "orchestrator" only for final synthesis when multiple worker outputs must merge. Keep tasks specific.`;

export async function createPlan(
  apiKey: string,
  orchestratorModel: string,
  userRequest: string,
  history: ChatCompletionMessage[],
  signal?: AbortSignal
): Promise<OrchestratorPlan> {
  const messages: ChatCompletionMessage[] = [
    { role: "system", content: PLANNER_SYSTEM },
    ...history.slice(-8),
    { role: "user", content: `Create an execution plan for:\n\n${userRequest}` },
  ];
  const raw = await chatCompletionNonStream(
    apiKey,
    orchestratorModel,
    messages,
    signal
  );
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summaryGoal: userRequest,
      steps: [{ title: "Respond", assignee: "worker", task: userRequest }],
    };
  }
  try {
    return JSON.parse(jsonMatch[0]) as OrchestratorPlan;
  } catch {
    return {
      summaryGoal: userRequest,
      steps: [{ title: "Respond", assignee: "worker", task: userRequest }],
    };
  }
}

export async function runWorkerStep(
  apiKey: string,
  workerModel: string,
  task: string,
  context: string,
  signal?: AbortSignal
): Promise<string> {
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content:
        "You are a specialist agent. Complete the assigned task thoroughly. Be concise unless detail is required.",
    },
  ];
  if (context) {
    messages.push({
      role: "user",
      content: `Overall context:\n${context}\n\nYour task:\n${task}`,
    });
  } else {
    messages.push({ role: "user", content: task });
  }
  return chatCompletionNonStream(apiKey, workerModel, messages, signal);
}

export async function synthesizeFinal(
  apiKey: string,
  orchestratorModel: string,
  userRequest: string,
  stepOutputs: string[],
  signal?: AbortSignal
): Promise<string> {
  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content:
        "Synthesize the worker step results into one cohesive answer for the user. Do not mention internal orchestration unless helpful.",
    },
    {
      role: "user",
      content: `User request: ${userRequest}\n\nStep results:\n${stepOutputs.map((o, i) => `--- Step ${i + 1} ---\n${o}`).join("\n\n")}`,
    },
  ];
  return chatCompletionNonStream(apiKey, orchestratorModel, messages, signal);
}