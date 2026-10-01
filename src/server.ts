import { t } from "./i18n.js";
import { McpServer, fromJsonSchema, type JsonSchemaType } from "@modelcontextprotocol/server";
import Ajv, { type ValidateFunction } from "ajv";

import { TOOL_REGISTRY, TeletypeApiError, errorResult } from "./tools.js";
import { loadToolPolicy, policyAllows, type ToolPolicy } from "./tool-policy.js";
import { PROMPT_DEFINITIONS, handleGetPrompt } from "./prompts.js";
import { RESOURCE_DEFINITIONS, RESOURCE_TEMPLATES, handleReadResource } from "./resources.js";
import { handleComplete } from "./completions.js";
import { log } from "./log.js";
import { requestContext } from "./request-context.js";
import { presentToolResult } from "./tool-presentation.js";
import { SERVER_VERSION } from "./version.js";

export const SERVER_INSTRUCTIONS = t("server.instructions");

export interface ToolCallObservation {
  name: string;
  arguments: Record<string, unknown>;
  isError: boolean;
}

export function buildServer(
  options: {
    name?: string;
    instructions?: string;
    policy?: ToolPolicy;
    onToolResult?: (entry: ToolCallObservation) => void;
  } = {},
): McpServer {
  const policy = options.policy ?? loadToolPolicy();
  const activeTools = TOOL_REGISTRY.filter((tool) => policyAllows(policy, tool.name));
  const server = new McpServer(
    {
      name: options.name ?? "teletype-mcp-server",
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
        completions: {},
      },
      instructions: options.instructions ?? SERVER_INSTRUCTIONS,
      // tools/list is policy-filtered per token, so the result stays private.
      // 2025-era requests ignore the hint per SDK docs.
      cacheHints: {
        "tools/list": { ttlMs: 60_000, cacheScope: "private" },
        // Prompt, resource and template listings are static for the process
        // lifetime and the locale is fixed at startup.
        "prompts/list": { ttlMs: 300_000, cacheScope: "private" },
        "resources/list": { ttlMs: 300_000, cacheScope: "private" },
        "resources/templates/list": { ttlMs: 300_000, cacheScope: "private" },
      },
    },
  );

  server.server.setRequestHandler("prompts/list", () => ({
    prompts: PROMPT_DEFINITIONS,
  }));

  server.server.setRequestHandler("prompts/get", (req) => {
    return handleGetPrompt(req.params.name, req.params.arguments);
  });

  server.server.setRequestHandler("resources/list", () => ({
    resources: RESOURCE_DEFINITIONS,
  }));

  server.server.setRequestHandler("resources/templates/list", () => ({
    resourceTemplates: RESOURCE_TEMPLATES,
  }));

  server.server.setRequestHandler("resources/read", async (req) => {
    return handleReadResource(req.params.uri);
  });

  server.server.setRequestHandler("completion/complete", async (req) => {
    return handleComplete(req.params);
  });

  for (const tool of activeTools) {
    const name = tool.name;
    const fn = tool.handler as (
      args: Record<string, unknown>,
    ) => Promise<import("./types.js").ToolResult>;
    if (!tool.outputSchema) throw new Error(`Incomplete tool registration: ${name}`);
    server.registerTool(
      name,
      {
        title: tool.annotations?.title,
        description: tool.description,
        inputSchema: fromJsonSchema<Record<string, unknown>>(tool.inputSchema as JsonSchemaType),
        outputSchema: fromJsonSchema<Record<string, unknown>>(tool.outputSchema),
        annotations: tool.annotations,
      },
      async (args, ctx) => {
        const startedAt = performance.now();
        let isError = true;
        try {
          const parentContext = requestContext.getStore();
          const result = parentContext
            ? await requestContext.run({ ...parentContext, signal: ctx.mcpReq.signal }, () =>
                fn(args),
              )
            : await fn(args);
          if (!result.isError) {
            const validateOutput = outputValidators.get(name);
            if (!validateOutput?.(result.structuredContent)) {
              log("error", "tool_output_validation_failed", {
                tool: name,
                issues: validateOutput?.errors?.map((error) => error.instancePath || "/"),
              });
              return errorResult(
                t("server.buildServer.toolResponseDoesNotMatch", { name: name }),
                t("server.buildServer.actionCouldBeCompletedCheck"),
              );
            }
          }
          const presented = presentToolResult(name, result, args);
          isError = presented.isError === true;
          log(isError ? "warn" : "info", "tool_call_completed", {
            tool: name,
            outcome: isError ? "tool_error" : "success",
            duration_ms: Math.round(performance.now() - startedAt),
          });
          return presented;
        } catch (e: unknown) {
          if (e instanceof TeletypeApiError) {
            log("warn", "tool_call_failed", {
              tool: name,
              retryable: e.retryable,
              duration_ms: Math.round(performance.now() - startedAt),
            });
            return errorResult(
              e.llmMessage,
              e.retryable
                ? t("server.buildServer.apiErrorRetryableHint")
                : e.status === 401 || e.status === 403
                  ? t("server.buildServer.apiErrorAuthHint")
                  : undefined,
            );
          }
          log("error", "tool_call_crashed", {
            tool: name,
            error: e instanceof Error ? e.message : String(e),
            duration_ms: Math.round(performance.now() - startedAt),
          });
          return errorResult(
            t("server.buildServer.internalToolError", { name: name }),
            t("server.buildServer.provideDevelopersRequestIDX"),
          );
        } finally {
          options.onToolResult?.({ name, arguments: args, isError });
        }
      },
    );
  }

  return server;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const outputValidators = new Map<string, ValidateFunction>(
  TOOL_REGISTRY.flatMap((tool) =>
    tool.outputSchema ? [[tool.name, ajv.compile(tool.outputSchema)] as const] : [],
  ),
);
