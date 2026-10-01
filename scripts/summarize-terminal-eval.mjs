#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_CATALOG } from "../dist/tool-catalog.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = resolve(
  process.env.TERMINAL_EVAL_OUTPUT_DIR || join(root, "eval-results/raw/current"),
);
const resultDir = join(root, "eval-results");
const reviewPath = join(resultDir, "terminal-review.json");
const reviews = existsSync(reviewPath) ? JSON.parse(await readFile(reviewPath, "utf8")) : {};
const writeTools = new Set(
  TOOL_CATALOG.filter(({ writesData }) => writesData).map(({ name }) => name),
);

const rates = {
  "codex-luna": { input: 0.1, cached: 0.01, write: 0.125, output: 0.5 },
  "codex-sol": { input: 2, cached: 0.2, write: 2.5, output: 10 },
  "claude-glm": { input: 0.15, cached: 0.03, write: 0.15, output: 0.5 },
  "opencode-deepseek": { input: 0.15, cached: 0.003, write: 0.15, output: 0.6 },
  "agy-gemini": { input: 0.75, cached: 0.075, write: 0.75, output: 3.75 },
};

for (const kind of ["complete", "selection"]) {
  const rows = [];
  const kindDir = join(rawDir, kind);
  if (!existsSync(kindDir)) continue;
  for (const client of await readdir(kindDir)) {
    for (const file of await readdir(join(kindDir, client))) {
      if (!file.endsWith(".json")) continue;
      const result = JSON.parse(await readFile(join(kindDir, client, file), "utf8"));
      const reviewed = reviews[`${kind}/${client}/${result.case_id}`] ?? {};
      const { uncached, cached, write, output } = tokenCounts(result);
      const price = rateFor(result);
      const estimatedCost =
        (uncached * price.input +
          cached * price.cached +
          write * price.write +
          output * price.output) /
        1_000_000;
      const gradeIndex = result.tool_calls.findIndex(({ name }) => name === "eval_grade_case");
      const postGradeCalls = gradeIndex < 0 ? [] : result.tool_calls.slice(gradeIndex + 1);
      rows.push({
        case: result.case_id,
        client,
        model: result.model,
        reasoning_effort: result.reasoning_effort ?? "",
        server_sha256: result.server_sha256,
        auto_passed:
          kind === "complete"
            ? Boolean(result.grade?.passed && result.grade?.metrics?.outcome_passed)
            : Boolean(result.selection?.passed),
        outcome_passed: result.grade?.metrics?.outcome_passed ?? "",
        first_target_call_passed: result.grade?.metrics?.first_target_call_passed ?? "",
        answer_passed: result.grade?.metrics?.answer_passed ?? "",
        safety_passed: result.grade?.metrics?.safety_passed ?? "",
        tool_errors: result.grade?.metrics?.tool_errors ?? "",
        post_grade_write_calls: postGradeCalls.filter(
          ({ name, arguments: args }) => writeTools.has(name) && args?.dry_run !== true,
        ).length,
        repeated_case_starts: postGradeCalls.filter(({ name }) => name === "eval_start_case")
          .length,
        expected_first_tool: result.selection?.expected ?? "",
        actual_first_tool: result.selection?.actual ?? "",
        human_verdict: reviewed.verdict ?? "unreviewed",
        human_note: reviewed.note ?? "",
        wall_seconds: result.duration_seconds,
        uncached_input_tokens: uncached,
        cache_read_tokens: cached,
        cache_write_tokens: write,
        output_tokens: output,
        total_tokens: uncached + cached + write + output,
        estimated_api_cost_usd: Number(estimatedCost.toFixed(6)),
        client_reported_cost_usd: result.client_reported_cost_usd ?? "",
        exit_code: result.exit_code ?? "",
        timed_out: result.timed_out,
      });
    }
  }
  rows.sort((a, b) => a.case.localeCompare(b.case) || a.client.localeCompare(b.client));
  const columns = Object.keys(rows[0] ?? {});
  const csv =
    [columns.join(","), ...rows.map((row) => columns.map((key) => cell(row[key])).join(","))].join(
      "\n",
    ) + "\n";
  const filename =
    kind === "complete"
      ? "terminal-agents-current.csv"
      : "tool-selection-terminal-agents-current.csv";
  await writeFile(join(resultDir, filename), csv);
  process.stdout.write(
    `${filename}: ${rows.length} rows, ${rows.filter(({ human_verdict }) => human_verdict !== "unreviewed").length} reviewed\n`,
  );
}

function tokenCounts(result) {
  const usage = result.usage ?? {};
  if (result.client === "codex-luna" || result.client === "codex-sol") {
    const cached = usage.cached_input_tokens ?? 0;
    const write = usage.cache_write_input_tokens ?? 0;
    return {
      uncached: Math.max(0, (usage.input_tokens ?? 0) - cached - write),
      cached,
      write,
      output: usage.output_tokens ?? 0,
    };
  }
  if (result.client === "agy-gemini") {
    const cached = usage.cache_read_tokens ?? 0;
    return {
      uncached: usage.input_tokens ?? 0,
      cached,
      write: 0,
      output: usage.output_tokens ?? 0,
    };
  }
  if (result.client === "claude-glm") {
    return {
      uncached: usage.input_tokens ?? 0,
      cached: usage.cache_read_input_tokens ?? 0,
      write: usage.cache_creation_input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
    };
  }
  return {
    uncached: usage.input_tokens ?? 0,
    cached: usage.cached_input_tokens ?? 0,
    write: usage.cache_write_input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
  };
}

function rateFor(result) {
  const base = rates[result.client];
  if (!base) throw new Error(`No rates for ${result.client}`);
  if (result.client !== "opencode-deepseek") return base;
  const started = new Date(result.started_at);
  const weekday = started.getUTCDay();
  const hour = started.getUTCHours();
  const peak =
    weekday >= 1 && weekday <= 5 && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10));
  return peak ? { ...base, input: 0.3, cached: 0.006, write: 0.3, output: 1.2 } : base;
}

function cell(value) {
  const string = String(value ?? "");
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}
