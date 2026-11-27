"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createConversation,
  loadConversations,
  loadSettings,
  saveConversations,
  saveSettings,
  type AppSettings,
} from "@/lib/storage";
import { consumeEventStream } from "@/lib/stream-client";
import type { AgentStep, ChatMessage, Conversation, OpenRouterModel } from "@/lib/types";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { ModelSelector } from "./ModelSelector";
import { Sidebar } from "./Sidebar";
import { Menu, Settings2, Sparkles, MessageCircle } from "lucide-react";

function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const t = first.content.trim().slice(0, 40);
  return t.length < first.content.length ? `${t}…` : t;
}

export function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAgentModels, setShowAgentModels] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  useEffect(() => {
    const list = loadConversations();
    const initialSettings = loadSettings();
    setConversations(list);
    if (list.length) setActiveId(list[0].id);
    else {
      const c = createConversation(
        initialSettings.defaultModel,
        initialSettings.mode
      );
      setConversations([c]);
      setActiveId(c.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  useEffect(() => {
    if (conversations.length) saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setModelsError(data.error);
        else setModels(data.models ?? []);
      })
      .catch(() => setModelsError("Could not load models"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, loading]);

  const patchActive = useCallback(
    (updater: (c: Conversation) => Conversation) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? updater(c) : c))
      );
    },
    [activeId]
  );

  const handleNewChat = () => {
    const c = createConversation(
      active?.model ?? settings.defaultModel,
      settings.mode
    );
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setInput("");
  };

  const handleDelete = (id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        const c = next[0] ?? createConversation(settings.defaultModel, settings.mode);
        if (!next.length) next.push(c);
        setActiveId(c.id);
      }
      return next;
    });
  };

  const updateAssistant = (
    assistantId: string,
    patch: Partial<ChatMessage>
  ) => {
    patchActive((c) => ({
      ...c,
      updatedAt: Date.now(),
      messages: c.messages.map((m) =>
        m.id === assistantId ? { ...m, ...patch } : m
      ),
    }));
  };

  const mergeStep = (assistantId: string, step: AgentStep) => {
    patchActive((c) => ({
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== assistantId) return m;
        const steps = [...(m.agentSteps ?? [])];
        const idx = steps.findIndex((s) => s.id === step.id);
        if (idx >= 0) steps[idx] = { ...steps[idx], ...step };
        else steps.push(step);
        return { ...m, agentSteps: steps };
      }),
    }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !active || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      agentSteps: settings.mode === "agent" ? [] : undefined,
    };

    patchActive((c) => ({
      ...c,
      model: settings.mode === "chat" ? c.model : c.model,
      mode: settings.mode,
      title: c.messages.length ? c.title : deriveTitle([userMsg]),
      updatedAt: Date.now(),
      messages: [...c.messages, userMsg, assistantMsg],
    }));
    setInput("");
    setLoading(true);
    abortRef.current = new AbortController();

    const history = [...(active.messages ?? []), userMsg]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      if (settings.mode === "agent") {
        const res = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: text,
            history,
            orchestratorModel: settings.orchestratorModel,
            workerModel: settings.workerModel,
          }),
          signal: abortRef.current.signal,
        });

        await consumeEventStream(res, {
          onToken: (chunk) => {
            updateAssistant(assistantId, { content: chunk });
          },
          onStep: (step) => mergeStep(assistantId, step),
          onStepUpdate: (step) => mergeStep(assistantId, step),
          onError: (msg) =>
            updateAssistant(assistantId, { content: `**Error:** ${msg}` }),
          onDone: () => {},
        });
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: active.model,
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        let acc = "";
        await consumeEventStream(res, {
          onToken: (t) => {
            acc += t;
            updateAssistant(assistantId, { content: acc });
          },
          onError: (msg) =>
            updateAssistant(assistantId, { content: `**Error:** ${msg}` }),
          onDone: () => {},
        });
      }

      patchActive((c) => ({
        ...c,
        title: deriveTitle(c.messages),
      }));
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        updateAssistant(assistantId, {
          content: `**Error:** ${(e as Error).message}`,
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const setMode = (mode: "chat" | "agent") => {
    setSettings((s) => ({ ...s, mode }));
    if (active) patchActive((c) => ({ ...c, mode }));
  };

  const setChatModel = (model: string) => {
    if (active) patchActive((c) => ({ ...c, model }));
  };

  return (
    <div className="flex h-dvh bg-[#0d0d0d] text-white">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onToggle={() => setSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-[#2a2a2a] px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-[#1f1f1f]"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-zinc-300">OpenRouter Chat</h1>
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <div className="flex rounded-lg border border-[#333] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("chat")}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${
                  settings.mode === "chat"
                    ? "bg-[#2f2f2f] text-white"
                    : "text-zinc-500"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setMode("agent")}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${
                  settings.mode === "agent"
                    ? "bg-emerald-800/50 text-white"
                    : "text-zinc-500"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Agent
              </button>
            </div>
            {settings.mode === "chat" ? (
              <ModelSelector
                models={models}
                value={active?.model ?? settings.defaultModel}
                onChange={(id) => {
                  setSettings((s) => ({ ...s, defaultModel: id }));
                  setChatModel(id);
                }}
                disabled={loading}
                label="Model"
                compact
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAgentModels((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-[#333] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#1f1f1f]"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Models
              </button>
            )}
          </div>
        </header>

        {showAgentModels && settings.mode === "agent" && (
          <div className="grid gap-3 border-b border-[#2a2a2a] bg-[#141414] px-4 py-3 md:grid-cols-2">
            <ModelSelector
              models={models}
              value={settings.orchestratorModel}
              onChange={(id) =>
                setSettings((s) => ({ ...s, orchestratorModel: id }))
              }
              label="Orchestrator"
            />
            <ModelSelector
              models={models}
              value={settings.workerModel}
              onChange={(id) => setSettings((s) => ({ ...s, workerModel: id }))}
              label="Worker"
            />
          </div>
        )}

        {modelsError && (
          <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300">
            {modelsError}. Set <code className="text-red-200">OPENROUTER_API_KEY</code> in{" "}
            <code className="text-red-200">chat-app/.env.local</code> and restart the dev server.
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!active?.messages.length ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <div className="mb-4 rounded-2xl border border-[#333] bg-[#1a1a1a] p-4">
                <Sparkles className="mx-auto h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">
                {settings.mode === "agent" ? "Agent orchestration" : "How can I help?"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                {settings.mode === "agent"
                  ? "The orchestrator plans steps, workers execute them, then results are synthesized into one answer."
                  : "Pick any OpenRouter model and chat with streaming responses."}
              </p>
            </div>
          ) : (
            active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#2a2a2a] bg-[#0d0d0d] px-4 pb-4 pt-3 md:px-8">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onStop={() => abortRef.current?.abort()}
              loading={loading}
              placeholder={
                settings.mode === "agent"
                  ? "Ask the agent team…"
                  : "Send a message…"
              }
            />
            <p className="mt-2 text-center text-xs text-zinc-600">
              Models served via OpenRouter. API key stays on the server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}