"use client";

import { ArrowUp, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  loading,
  placeholder,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSend();
    }
  };

  return (
    <div className="relative flex items-end rounded-2xl border border-[#333] bg-[#1a1a1a] shadow-lg">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Message…"}
        disabled={loading}
        className="max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-white outline-none placeholder:text-zinc-500"
      />
      {loading ? (
        <button
          type="button"
          onClick={onStop}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-600 text-white hover:bg-zinc-500"
          aria-label="Stop"
        >
          <Square className="h-4 w-4 fill-current" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim()}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black disabled:opacity-30"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}