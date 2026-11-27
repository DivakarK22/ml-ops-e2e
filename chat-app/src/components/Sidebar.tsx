"use client";

import type { Conversation } from "@/lib/types";
import { MessageSquarePlus, PanelLeftClose, Trash2 } from "lucide-react";

interface SidebarProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}

export function Sidebar({
  open,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onToggle,
}: SidebarProps) {
  if (!open) return null;

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
  <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#2a2a2a] bg-[#121212]">
    <div className="flex items-center justify-between p-3">
      <button
        type="button"
        onClick={onNew}
        className="flex flex-1 items-center gap-2 rounded-lg border border-[#333] px-3 py-2 text-sm text-white transition hover:bg-[#1f1f1f]"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="ml-2 rounded-lg p-2 text-zinc-400 hover:bg-[#1f1f1f] hover:text-white md:hidden"
        aria-label="Close sidebar"
      >
        <PanelLeftClose className="h-5 w-5" />
      </button>
    </div>
    <nav className="flex-1 overflow-y-auto px-2 pb-4">
      {sorted.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-zinc-500">No conversations yet</p>
      ) : (
        sorted.map((c) => (
          <div
            key={c.id}
            className={`group mb-0.5 flex items-center gap-1 rounded-lg ${
              activeId === c.id ? "bg-[#2a2a2a]" : "hover:bg-[#1f1f1f]"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex-1 truncate px-3 py-2 text-left text-sm text-zinc-300"
            >
              {c.title}
            </button>
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              className="shrink-0 rounded p-2 text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))
      )}
    </nav>
    <footer className="border-t border-[#2a2a2a] p-3 text-xs text-zinc-500">
      OpenRouter · Chat &amp; Agent
    </footer>
  </aside>
  );
}