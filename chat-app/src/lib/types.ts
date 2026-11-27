export type ChatMode = "chat" | "agent";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  /** Agent mode: steps shown inline */
  agentSteps?: AgentStep[];
}

export interface AgentStep {
  id: string;
  title: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  mode: ChatMode;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface StreamEvent {
  type: "token" | "step" | "step_update" | "error" | "done";
  content?: string;
  step?: AgentStep;
}