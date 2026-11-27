"use client";

import type { AgentStep } from "@/lib/types";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

function StatusIcon({ status }: { status: AgentStep["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-amber-400" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Circle className="h-4 w-4 text-zinc-500" />;
  }
}

export function AgentStepsPanel({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="rounded-lg border border-[#333] bg-[#141414] p-3 text-sm">
      <p className="mb-2 font-medium text-zinc-300">Agent orchestration</p>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-2 text-zinc-400">
            <StatusIcon status={step.status} />
            <div className="min-w-0 flex-1">
              <p className="text-zinc-200">{step.title}</p>
              {step.model && (
                <p className="text-xs text-zinc-500">{step.model}</p>
              )}
              {step.detail && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-3">{step.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}