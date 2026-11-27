"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import { Bot, User } from "lucide-react";
import { AgentStepsPanel } from "./AgentStepsPanel";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`group flex w-full gap-4 px-4 py-6 md:px-8 ${
        isUser ? "bg-transparent" : "bg-[#1a1a1a]/60"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
          isUser ? "bg-[#2f2f2f]" : "bg-emerald-700"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" aria-hidden />
        ) : (
          <Bot className="h-4 w-4 text-white" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {message.agentSteps && message.agentSteps.length > 0 && (
          <AgentStepsPanel steps={message.agentSteps} />
        )}
        {message.content ? (
          <div className="prose prose-invert prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-[#333]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : message.role === "assistant" ? (
          <span className="inline-block h-4 w-2 animate-pulse rounded-sm bg-white/40" />
        ) : null}
      </div>
    </div>
  );
}