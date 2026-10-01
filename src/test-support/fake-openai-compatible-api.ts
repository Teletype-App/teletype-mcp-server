import type { Server } from "node:http";
import express from "express";

export interface FakeOpenAiCompatibleApi {
  baseUrl: string;
  requests: Record<string, unknown>[];
  close(): Promise<void>;
}

export async function startFakeOpenAiCompatibleApi(): Promise<FakeOpenAiCompatibleApi> {
  const app = express();
  const requests: Record<string, unknown>[] = [];
  app.use(express.json());
  app.post("/v1/chat/completions", (req, res) => {
    requests.push(req.body as Record<string, unknown>);
    const body = req.body as { messages: { role: string }[] };
    const messages = body.messages;
    const hasToolResult = messages.at(-1)?.role === "tool";
    res.json({
      id: `fake-${requests.length}`,
      choices: [
        {
          index: 0,
          finish_reason: hasToolResult ? "stop" : "tool_calls",
          message: hasToolResult
            ? { role: "assistant", content: "Ответ нужен клиенту Ивану." }
            : {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call-find",
                    type: "function",
                    function: {
                      name: "find_conversations",
                      arguments: JSON.stringify({ status: "unanswered" }),
                    },
                  },
                ],
              },
        },
      ],
    });
  });
  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => {
      resolve(listener);
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fake model API did not bind.");
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        }),
      ),
  };
}
