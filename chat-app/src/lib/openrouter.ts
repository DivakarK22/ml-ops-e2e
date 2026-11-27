const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export function getOpenRouterKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim() || undefined;
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChatOptions {
  model: string;
  messages: ChatCompletionMessage[];
  signal?: AbortSignal;
}

export async function fetchOpenRouterModels(apiKey: string) {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter models error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.data as Array<{
    id: string;
    name?: string;
    description?: string;
    context_length?: number;
    pricing?: { prompt: string; completion: string };
  }>;
}

export async function streamChatCompletion(
  apiKey: string,
  options: StreamChatOptions
): Promise<Response> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "OpenRouter Chat",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
    signal: options.signal,
  });
  return res;
}

export async function chatCompletionNonStream(
  apiKey: string,
  model: string,
  messages: ChatCompletionMessage[],
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "OpenRouter Chat",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Parse SSE chunks from OpenRouter stream into text deltas */
export async function* iterateStreamTokens(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        /* ignore partial JSON */
      }
    }
  }
}