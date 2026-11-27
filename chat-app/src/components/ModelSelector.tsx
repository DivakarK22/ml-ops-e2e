"use client";

import type { OpenRouterModel } from "@/lib/types";
import { ChevronDown } from "lucide-react";

interface ModelSelectorProps {
  models: OpenRouterModel[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}

export function ModelSelector({
  models,
  value,
  onChange,
  disabled,
  label,
  compact,
}: ModelSelectorProps) {
  return (
    <label className={`flex flex-col gap-1 ${compact ? "min-w-0" : ""}`}>
      {label && !compact && (
        <span className="text-xs text-zinc-500">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          disabled={disabled || models.length === 0}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-lg border border-[#333] bg-[#1a1a1a] pr-8 text-white outline-none focus:border-emerald-600 disabled:opacity-50 ${
            compact ? "py-1.5 pl-2 text-xs" : "py-2 pl-3 text-sm"
          }`}
        >
          {models.length === 0 ? (
            <option value={value}>{value || "Loading models…"}</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    </label>
  );
}