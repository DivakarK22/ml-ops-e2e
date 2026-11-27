"use client";

import type { Conversation } from "./types";

const STORAGE_KEY = "openrouter-chat-conversations";
const SETTINGS_KEY = "openrouter-chat-settings";

export interface AppSettings {
  defaultModel: string;
  orchestratorModel: string;
  workerModel: string;
  mode: "chat" | "agent";
}

const defaultSettings: AppSettings = {
  defaultModel: "openai/gpt-4o-mini",
  orchestratorModel: "openai/gpt-4o",
  workerModel: "anthropic/claude-3.5-sonnet",
  mode: "chat",
};

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createConversation(
  model: string,
  mode: "chat" | "agent"
): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
    model,
    mode,
  };
}