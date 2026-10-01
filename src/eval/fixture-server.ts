import { fromJsonSchema, type McpServer } from "@modelcontextprotocol/server";
import type { FakeTeletypeApi } from "../test-support/fake-teletype-api.js";
import { buildServer, SERVER_INSTRUCTIONS } from "../server.js";
import { errorResult, jsonResult } from "../tool-helpers.js";
import { clearEntityCacheForCurrentToken } from "../entity-resolver.js";
import { MODEL_EVAL_CASES, type ModelEvalCase } from "./cases.js";
import { gradeModelCase, type ToolTraceEntry } from "./grader.js";
import { t } from "../i18n.js";

export function createEvalFixture(
  fakeApi: FakeTeletypeApi,
  selectionOnly = false,
): () => McpServer {
  let activeCase: ModelEvalCase | undefined;
  const trace: ToolTraceEntry[] = [];

  return () => {
    const server = buildServer({
      name: "teletype-mcp-eval",
      instructions: selectionOnly
        ? SERVER_INSTRUCTIONS
        : `${SERVER_INSTRUCTIONS}

${t("evalFixture.createEvalFixture.thisIsLocalTeletypeTest")}`,
      onToolResult(entry) {
        if (activeCase) trace.push(entry);
      },
    });

    if (selectionOnly) return server;

    server.registerTool(
      "eval_list_cases",
      {
        description: t("evalFixture.createEvalFixture.listEvaluationCasesLocalTeletype"),
        annotations: { readOnlyHint: true, openWorldHint: false },
        inputSchema: fromJsonSchema({
          type: "object",
          properties: {},
          additionalProperties: false,
        }),
        outputSchema: fromJsonSchema({
          type: "object",
          properties: {
            cases: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, title: { type: "string" } },
                required: ["id", "title"],
              },
            },
            hint: { type: "string" },
          },
          required: ["cases", "hint"],
        }),
      },
      () =>
        jsonResult({
          cases: MODEL_EVAL_CASES.map(({ id, title }) => ({ id, title })),
          hint: t("evalFixture.createEvalFixture.selectCaseEvalStartCase"),
        }),
    );

    server.registerTool(
      "eval_start_case",
      {
        description: t("evalFixture.createEvalFixture.startCaseAndClearCall"),
        annotations: { idempotentHint: true, openWorldHint: false },
        inputSchema: fromJsonSchema<{ case_id: string }>({
          type: "object",
          properties: { case_id: { type: "string" } },
          required: ["case_id"],
          additionalProperties: false,
        }),
        outputSchema: fromJsonSchema({
          type: "object",
          properties: { case_id: { type: "string" }, prompt: { type: "string" } },
          required: ["case_id", "prompt"],
        }),
      },
      ({ case_id }) => {
        const found = MODEL_EVAL_CASES.find(({ id }) => id === case_id);
        if (!found)
          return errorResult(t("evalFixture.createEvalFixture.unknownCase", { caseId: case_id }));
        fakeApi.reset();
        clearEntityCacheForCurrentToken();
        trace.length = 0;
        activeCase = found;
        return jsonResult({ case_id, prompt: found.prompt });
      },
    );

    server.registerTool(
      "eval_grade_case",
      {
        description: t("evalFixture.createEvalFixture.gradeToolCallsAndFinal"),
        annotations: { readOnlyHint: true, openWorldHint: false },
        inputSchema: fromJsonSchema<{ answer: string }>({
          type: "object",
          properties: { answer: { type: "string" } },
          required: ["answer"],
          additionalProperties: false,
        }),
        outputSchema: fromJsonSchema({
          type: "object",
          properties: {
            case_id: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 1 },
            passed: { type: "boolean" },
            metrics: {
              type: "object",
              properties: {
                outcome_passed: { type: "boolean" },
                first_target_call_passed: { type: "boolean" },
                answer_passed: { type: "boolean" },
                safety_passed: { type: "boolean" },
                recovered_after_error: { type: "boolean" },
                tool_errors: { type: "integer", minimum: 0 },
              },
              required: [
                "outcome_passed",
                "first_target_call_passed",
                "answer_passed",
                "safety_passed",
                "recovered_after_error",
                "tool_errors",
              ],
            },
            checks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  passed: { type: "boolean" },
                  details: { type: "string" },
                },
                required: ["name", "passed"],
              },
            },
            trace: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  arguments: { type: "object" },
                  isError: { type: "boolean" },
                },
                required: ["name", "arguments", "isError"],
              },
            },
          },
          required: ["case_id", "score", "passed", "metrics", "checks", "trace"],
        }),
      },
      ({ answer }) => {
        if (!activeCase)
          return errorResult(t("evalFixture.createEvalFixture.callEvalStartCaseFirst"));
        const grade = gradeModelCase(activeCase, trace, answer, fakeApi.state);
        return jsonResult({
          case_id: activeCase.id,
          score: grade.score,
          passed: grade.score === 1,
          metrics: grade.metrics,
          checks: grade.checks,
          trace,
        });
      },
    );

    return server;
  };
}
