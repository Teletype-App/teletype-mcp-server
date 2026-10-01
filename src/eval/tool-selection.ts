#!/usr/bin/env node
import { TOOL_DEFINITIONS } from "../tools.js";
import {
  OpenAiCompatibleModel,
  type ChatTool,
  type ToolCallingModel,
} from "./openai-compatible.js";

interface SelectionCase {
  id: string;
  prompt: string;
  expected: string;
}

export const SELECTION_CASES: readonly SelectionCase[] = [
  {
    id: "channel-inventory",
    prompt: "Какие каналы подключены к проекту и какие из них сейчас активны?",
    expected: "list_workspace_metadata",
  },
  {
    id: "channel-health",
    prompt: "Есть ли технические проблемы у каналов или Public API проекта?",
    expected: "get_project_status",
  },
  {
    id: "draft-without-send",
    prompt: "Прочитай dialog-open и предложи ответ клиенту. Ничего не отправляй.",
    expected: "read_conversation_thread",
  },
  {
    id: "edit-existing-message",
    prompt:
      "Исправь уже отправленное сообщение message-operator на «Заказ приедет завтра». Подтверждаю.",
    expected: "manage_sent_message",
  },
  {
    id: "whatsapp-template",
    prompt:
      "Отправь одобренный WABA-шаблон tpl-welcome в dialog-whatsapp через channel-whatsapp. Подтверждаю.",
    expected: "send_whatsapp_template",
  },
  {
    id: "close-without-reply",
    prompt: "Закрой dialog-open как решённый, ничего клиенту не отправляй. Подтверждаю.",
    expected: "resolve_conversation",
  },
  {
    id: "phone-lookup-without-dialog",
    prompt: "Найди клиента по телефону +79990000002. Диалог не создавай.",
    expected: "list_clients",
  },
  {
    id: "message-text-search",
    prompt: "Найди старое сообщение клиента client-ivan с номером заказа 777.",
    expected: "find_messages",
  },
  {
    id: "confirmed-phone-dialog",
    prompt:
      "Создай диалог в канале channel-whatsapp с номером +79990000003 без отправки сообщения. Подтверждаю.",
    expected: "create_dialog_by_phone",
  },
];

const SYSTEM_PROMPT =
  "Ты оператор поддержки Teletype. Выбери первый инструмент для запроса пользователя. Не выдумывай состояние проекта.";

export async function evaluateToolSelection(
  model: ToolCallingModel,
  cases: readonly SelectionCase[] = SELECTION_CASES,
): Promise<{
  score: number;
  cases: { id: string; expected: string; actual: string | null; passed: boolean }[];
}> {
  if (!cases.length) throw new Error("No tool selection cases were provided.");
  const tools: ChatTool[] = TOOL_DEFINITIONS.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
  const results = [];
  for (const testCase of cases) {
    const answer = await model.complete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: testCase.prompt },
      ],
      tools,
    );
    const actual = answer.toolCalls[0]?.function.name ?? null;
    results.push({
      id: testCase.id,
      expected: testCase.expected,
      actual,
      passed: actual === testCase.expected,
    });
  }
  return {
    score: results.filter((result) => result.passed).length / results.length,
    cases: results,
  };
}

async function main(): Promise<void> {
  const modelName = process.env.EVAL_MODEL_NAME;
  const baseUrl = process.env.EVAL_MODEL_BASE_URL;
  if (!modelName || !baseUrl) {
    throw new Error("EVAL_MODEL_NAME and EVAL_MODEL_BASE_URL are required.");
  }
  const model = new OpenAiCompatibleModel(baseUrl, modelName, process.env.EVAL_MODEL_API_KEY);
  const result = await evaluateToolSelection(model);
  process.stdout.write(`${JSON.stringify({ model: modelName, ...result }, null, 2)}\n`);
  if (result.score < 1) process.exitCode = 2;
}

if (process.argv[1]?.endsWith("/tool-selection.js")) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
