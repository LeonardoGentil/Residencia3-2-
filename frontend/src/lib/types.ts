// ─── Provider ──────────────────────────────────────────────────────────────────

export interface ProviderModel {
  id: string;
  label: string;
  notes?: string;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: ProviderModel[];
  signupUrl: string;
  description: string;
}

// ─── MCP ──────────────────────────────────────────────────────────────────────

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpPrompt {
  name: string;
  description: string;
}

export interface McpConnection {
  url: string;
  sessionId: string;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
}

export interface McpToolResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

// OpenAI-compatible payload types

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIChoiceMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: OpenAIChoiceMessage;
    finish_reason: string;
  }>;
}

export interface LLMRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{
    role: MessageRole;
    content: string | null;
    tool_calls?: OpenAIToolCall[];
    tool_call_id?: string;
    name?: string;
  }>;
  tools?: OpenAITool[];
  signal?: AbortSignal;
}

export interface LLMResponse {
  content: string;
  toolCalls: OpenAIToolCall[];
  finishReason: string;
}
