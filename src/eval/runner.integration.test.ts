import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  startFakeOpenAiCompatibleApi,
  type FakeOpenAiCompatibleApi,
} from "../test-support/fake-openai-compatible-api.js";

const execFileAsync = promisify(execFile);

describe("model eval CLI", () => {
  let modelApi: FakeOpenAiCompatibleApi;

  beforeAll(async () => {
    modelApi = await startFakeOpenAiCompatibleApi();
  });

  afterAll(async () => modelApi.close());

  it("runs a real MCP tool loop and emits a machine-readable score", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", "src/eval/runner.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          EVAL_MODEL_NAME: "fake-tool-model",
          EVAL_MODEL_BASE_URL: modelApi.baseUrl,
          EVAL_CASES: "triage-unanswered",
          EVAL_THRESHOLD: "1",
        },
        timeout: 15_000,
      },
    );
    const report = JSON.parse(stdout) as {
      passed: boolean;
      score: number;
      metrics: { outcome_rate: number; first_target_call_rate: number };
      cases: { trace: { name: string }[]; metrics: { outcome_passed: boolean } }[];
    };
    expect(report).toMatchObject({ passed: true, score: 1 });
    expect(report.metrics).toMatchObject({ outcome_rate: 1, first_target_call_rate: 1 });
    expect(report.cases[0]?.trace).toEqual([
      expect.objectContaining({ name: "find_conversations" }),
    ]);
    expect(report.cases[0]?.metrics.outcome_passed).toBe(true);
    expect(modelApi.requests).toHaveLength(2);
  });
});
