import { getOpenRouterKey, iterateStreamTokens, streamChatCompletion } from "@/lib/openrouter";

export const runtime = "nodejs";

interface ChatBody {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export async function POST(req: Request) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not set on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { model, messages } = body;
  if (!model || !messages?.length) {
    return new Response(JSON.stringify({ error: "model and messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = await streamChatCompletion(apiKey, {
    model,
    messages,
    signal: req.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(
      JSON.stringify({ error: `OpenRouter: ${upstream.status} ${text}` }),
      { status: upstream.status || 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of iterateStreamTokens(upstream.body!)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: msg })}\n\n`)
        );
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