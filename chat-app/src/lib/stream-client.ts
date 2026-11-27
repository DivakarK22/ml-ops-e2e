"use client";

import type { AgentStep } from "./types";

export interface StreamHandlers {
  onToken: (text: string) => void;
  onStep?: (step: AgentStep) => void;
  onStepUpdate?: (step: AgentStep) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export async function consumeEventStream(
  response: Response,
  handlers: StreamHandlers
): Promise<void> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const j = await response.json();
      if (j.error) message = j.error;
    } catch {
      /* ignore */
    }
    handlers.onError(message);
    handlers.onDone();
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError("No response body");
    handlers.onDone();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as {
          type: string;
          content?: string;
          step?: AgentStep;
        };
        switch (event.type) {
          case "token":
            if (event.content) handlers.onToken(event.content);
            break;
          case "step":
            if (event.step) handlers.onStep?.(event.step);
            break;
          case "step_update":
            if (event.step) handlers.onStepUpdate?.(event.step);
            break;
          case "error":
            handlers.onError(event.content || "Unknown error");
            break;
          case "done":
            handlers.onDone();
            break;
        }
      } catch {
        /* ignore */
      }
    }
  }
  handlers.onDone();
}