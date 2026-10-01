interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ChatToolCall[];
}

export interface ChatTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export interface ModelResponse {
  content: string;
  toolCalls: ChatToolCall[];
  assistantMessage: ChatMessage;
}

export interface ToolCallingModel {
  complete(messages: ChatMessage[], tools: ChatTool[]): Promise<ModelResponse>;
}

export class OpenAiCompatibleModel implements ToolCallingModel {
  public constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  public async complete(messages: ChatMessage[], tools: ChatTool[]): Promise<ModelResponse> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
      choices?: { message?: ChatMessage }[];
    };
    if (!response.ok) {
      throw new Error(
        `Model API returned HTTP ${response.status}: ${body.error?.message || "unknown error"}`,
      );
    }
    const message = body.choices?.[0]?.message;
    if (!message) throw new Error("Model API returned no assistant message.");
    return {
      content: message.content || "",
      toolCalls: message.tool_calls ?? [],
      assistantMessage: message,
    };
  }
}
