#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_EVAL_CASES } from "../dist/eval/cases.js";
import { SELECTION_CASES } from "../dist/eval/tool-selection.js";
import { TOOL_CATALOG } from "../dist/tool-catalog.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = join(root, "dist/index.js");
const outputDir = resolve(
  process.env.TERMINAL_EVAL_OUTPUT_DIR || join(root, "eval-results/raw/current"),
);
const allModels = ["codex-luna", "codex-sol", "claude-glm", "opencode-deepseek", "agy-gemini"];
const model = argument("--model");
const caseId = argument("--case");
const promptOverride = argument("--prompt");
const selection = process.argv.includes("--selection");
const fixtureMode = selection ? "--eval-selection-fixture" : "--eval-fixture";
const activeCases = selection ? SELECTION_CASES : MODEL_EVAL_CASES;
const force = process.argv.includes("--force");
const concurrency = Number(argument("--concurrency") || 2);
const bridgeCode = `import { createConnection } from "node:net";
const socket = createConnection(process.argv[2]);
socket.on("connect", () => { process.stdin.pipe(socket); socket.pipe(process.stdout); });
socket.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
`;

if (model && !allModels.includes(model)) throw new Error(`Unknown model: ${model}`);
if (caseId && !activeCases.some(({ id }) => id === caseId)) {
  throw new Error(`Unknown case: ${caseId}`);
}
if (promptOverride && !caseId) throw new Error("--prompt requires --case");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) {
  throw new Error("--concurrency must be between 1 and 5");
}
if (!existsSync(fixturePath)) throw new Error("Run npm run build before the terminal eval");
if (process.platform !== "linux" || !existsSync("/usr/bin/bwrap")) {
  throw new Error("The terminal eval requires Linux bubblewrap to hide its cases and grader");
}

const serverHash = createHash("sha256");
await hashJavaScript(join(root, "dist"));
const serverSha256 = serverHash.digest("hex");
const jobs = activeCases
  .filter(({ id }) => !caseId || id === caseId)
  .flatMap((testCase) => (model ? [model] : allModels).map((client) => ({ client, testCase })));
let cursor = 0;
await mkdir(outputDir, { recursive: true });
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

async function hashJavaScript(directory, relative = "") {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(directory, entry.name);
    const name = join(relative, entry.name);
    if (entry.isDirectory()) await hashJavaScript(path, name);
    else if (entry.isFile() && entry.name.endsWith(".js")) {
      serverHash.update(name);
      serverHash.update(await readFile(path));
    }
  }
}

async function worker() {
  while (cursor < jobs.length) {
    const { client, testCase } = jobs[cursor++];
    const resultPath = join(
      outputDir,
      selection ? "selection" : "complete",
      client,
      `${testCase.id}.json`,
    );
    if (!force && !promptOverride && existsSync(resultPath)) {
      const previous = JSON.parse(await readFile(resultPath, "utf8"));
      if (
        previous.server_sha256 === serverSha256 &&
        previous.isolation_version === 2 &&
        (previous.grade || previous.selection)
      ) {
        process.stdout.write(`skip ${client} ${testCase.id}\n`);
        continue;
      }
    }
    try {
      const result = await runCase(client, testCase);
      await mkdir(dirname(resultPath), { recursive: true });
      await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
      process.stdout.write(
        `${selection ? (result.selection?.passed ? "ok" : "review") : result.grade?.metrics?.outcome_passed && result.grade?.metrics?.safety_passed ? "ok" : "review"} ${client} ${testCase.id} ${result.duration_seconds.toFixed(1)}s\n`,
      );
    } catch (error) {
      process.stderr.write(`error ${client} ${testCase.id}: ${String(error)}\n`);
    }
  }
}

async function runCase(client, testCase) {
  const workDir = await mkdtemp(join(tmpdir(), "teletype-terminal-eval-"));
  try {
    return await runCaseInWorkDir(client, testCase, workDir);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function runCaseInWorkDir(client, testCase, workDir) {
  const bridgePath = join(workDir, "mcp-bridge.mjs");
  const socketPath = join(workDir, `mcp-${randomUUID().slice(0, 8)}.sock`);
  await writeFile(bridgePath, bridgeCode);
  const casePrompt = promptOverride ?? testCase.prompt;
  const prompt = selection
    ? `Сделай только первый вызов инструмента Teletype для этой задачи: ${casePrompt}`
    : `Вызови eval_start_case для ${testCase.id}, выполни задачу${promptOverride ? ` с такой формулировкой пользователя: ${casePrompt}` : ""}, потом eval_grade_case с ответом.`;
  const [command, args] = await clientCommand(client, workDir, prompt, bridgePath, socketPath);
  const fixtureServer = createServer((socket) => {
    const fixture = spawn(process.execPath, [fixturePath, fixtureMode], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });
    socket.pipe(fixture.stdin);
    fixture.stdout.pipe(socket);
    fixture.stderr.on("data", (chunk) => process.stderr.write(chunk));
    fixture.on("error", (error) => socket.destroy(error));
    fixture.on("close", () => socket.end());
    socket.on("error", () => fixture.kill());
    socket.on("close", () => fixture.kill());
  });
  await new Promise((resolveListen, reject) => {
    fixtureServer.once("error", reject);
    fixtureServer.listen(socketPath, resolveListen);
  });
  const startedAt = new Date();
  const start = performance.now();
  const tmpAncestors = [];
  let parent = tmpdir();
  for (const segment of relative(tmpdir(), workDir).split(sep).slice(0, -1)) {
    parent = join(parent, segment);
    tmpAncestors.push("--dir", parent);
  }
  let run;
  try {
    run = await execute(
      "bwrap",
      [
        "--die-with-parent",
        "--unshare-pid",
        "--bind",
        "/",
        "/",
        "--dev-bind",
        "/dev",
        "/dev",
        "--proc",
        "/proc",
        "--tmpfs",
        root,
        "--tmpfs",
        tmpdir(),
        ...tmpAncestors,
        "--bind",
        workDir,
        workDir,
        "--chdir",
        workDir,
        "--",
        command,
        ...args,
      ],
      workDir,
      client === "opencode-deepseek" ? 120_000 : 300_000,
    );
  } finally {
    fixtureServer.close();
  }
  const { stdout, stderr, exitCode, timedOut } = run;
  const parsed = parseRun(client, stdout);
  const rawDir = join(outputDir, "transcripts", selection ? "selection" : "complete", client);
  await mkdir(rawDir, { recursive: true });
  await writeFile(join(rawDir, `${testCase.id}.stdout.jsonl`), stdout);
  await writeFile(join(rawDir, `${testCase.id}.stderr.log`), stderr);
  const result = {
    client,
    eval_type: selection ? "selection" : "complete",
    model: modelId(client),
    reasoning_effort: client.startsWith("codex-") ? "high" : null,
    case_id: testCase.id,
    prompt: casePrompt,
    sandboxed: true,
    isolation_version: 2,
    server_sha256: serverSha256,
    started_at: startedAt.toISOString(),
    duration_seconds: (performance.now() - start) / 1000,
    exit_code: exitCode,
    timed_out: timedOut,
    answer: parsed.answer,
    final_message: parsed.finalMessage,
    grade: parsed.grade,
    selection: selection
      ? {
          expected: testCase.expected,
          actual:
            parsed.toolCalls.find(({ name }) => TOOL_CATALOG.some((tool) => tool.name === name))
              ?.name ?? null,
          passed:
            parsed.toolCalls.find(({ name }) => TOOL_CATALOG.some((tool) => tool.name === name))
              ?.name === testCase.expected,
        }
      : null,
    usage: parsed.usage,
    client_reported_cost_usd: parsed.reportedCost,
    tool_calls: parsed.toolCalls,
    parse_error: parsed.parseError,
  };
  return result;
}

async function clientCommand(client, workDir, prompt, bridgePath, socketPath) {
  const bridgeArgs = [bridgePath, socketPath];
  if (client.startsWith("codex-")) {
    const modelName = modelId(client);
    return [
      "codex",
      [
        "exec",
        "--ignore-user-config",
        "--skip-git-repo-check",
        "--ephemeral",
        "-C",
        workDir,
        "--json",
        "-m",
        modelName,
        "-c",
        'model_reasoning_effort="high"',
        "-c",
        `mcp_servers.teletype_eval={command="node",args=["${bridgePath}","${socketPath}"],default_tools_approval_mode="approve"}`,
        prompt,
      ],
    ];
  }
  if (client === "claude-glm") {
    const configPath = join(workDir, "mcp.json");
    await writeFile(
      configPath,
      JSON.stringify({
        mcpServers: { teletype_eval: { command: "node", args: bridgeArgs } },
      }),
    );
    return [
      "claude",
      [
        "-p",
        "--no-session-persistence",
        "--mcp-config",
        configPath,
        "--strict-mcp-config",
        "--tools",
        "",
        "--dangerously-skip-permissions",
        "--output-format",
        "stream-json",
        "--verbose",
        "--model",
        modelId(client),
        prompt,
      ],
    ];
  }
  if (client === "opencode-deepseek") {
    await writeFile(
      join(workDir, "opencode.json"),
      JSON.stringify({
        $schema: "https://opencode.ai/config.json",
        mcp: {
          teletype_eval: { type: "local", command: ["node", ...bridgeArgs] },
        },
        tools: {
          bash: false,
          read: false,
          write: false,
          edit: false,
          glob: false,
          grep: false,
          webfetch: false,
          websearch: false,
          skill: false,
          task: false,
        },
        permission: {
          bash: "deny",
          read: "deny",
          edit: "deny",
          glob: "deny",
          grep: "deny",
          webfetch: "deny",
          websearch: "deny",
          task: "deny",
          skill: "deny",
          "teletype_eval_*": "allow",
        },
      }),
    );
    return [
      "opencode",
      [
        "run",
        "--pure",
        "--print-logs",
        "--log-level",
        "WARN",
        "--format",
        "json",
        "-m",
        modelId(client),
        prompt,
      ],
    ];
  }
  const configDir = join(workDir, ".agents");
  await mkdir(configDir, { recursive: true });
  const eagerTools = Object.fromEntries(
    [
      ...(selection ? [] : ["eval_list_cases", "eval_start_case", "eval_grade_case"]),
      ...TOOL_CATALOG.map(({ name }) => name),
    ].map((name) => [name, { eager: true }]),
  );
  await writeFile(
    join(configDir, "mcp_config.json"),
    JSON.stringify({
      mcpServers: {
        teletype_eval: {
          command: "node",
          args: bridgeArgs,
          env: { TELETYPE_MCP_LOCALE: "ru" },
          tools: eagerTools,
        },
      },
    }),
  );
  return [
    "agy",
    [
      "--print",
      prompt,
      "--model",
      modelId(client),
      "--output-format",
      "stream-json",
      "--dangerously-skip-permissions",
      "--new-project",
    ],
  ];
}

function modelId(client) {
  return {
    "codex-luna": "gpt-6-luna",
    "codex-sol": "gpt-6-sol",
    "claude-glm": "glm-5.3-flash",
    "opencode-deepseek": "opencode-go/deepseek-v4-flash",
    "agy-gemini": "gemini-3.8-flash-medium",
  }[client];
}

function execute(command, args, cwd, timeoutMs) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, PWD: cwd },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (exitCode) => {
      clearTimeout(timer);
      resolveRun({ stdout, stderr, exitCode, timedOut });
    });
  });
}

function parseRun(client, stdout) {
  const events = stdout
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  if (!events.length)
    return {
      answer: null,
      finalMessage: null,
      grade: null,
      usage: null,
      toolCalls: [],
      parseError: "No JSON events",
    };
  if (client.startsWith("codex-")) return parseCodex(events);
  if (client === "claude-glm") return parseClaude(events);
  if (client === "opencode-deepseek") return parseOpenCode(events);
  return parseAgy(events);
}

function parseCodex(events) {
  const calls = events
    .filter((event) => event.type === "item.completed" && event.item?.type === "mcp_tool_call")
    .map(({ item }) => ({
      name: item.tool,
      arguments: item.arguments,
      output: item.result?.structured_content ?? item.result?.content?.[0]?.text,
      error: item.error,
    }));
  return parsedResult(
    calls,
    events
      .filter((event) => event.type === "item.completed" && event.item?.type === "agent_message")
      .at(-1)?.item?.text,
    events.findLast(({ type }) => type === "turn.completed")?.usage,
  );
}

function parseClaude(events) {
  const uses = events.flatMap((event) =>
    event.type === "assistant"
      ? (event.message?.content ?? []).filter(({ type }) => type === "tool_use")
      : [],
  );
  const results = new Map(
    events.flatMap((event) =>
      event.type === "user"
        ? (event.message?.content ?? [])
            .filter(({ type }) => type === "tool_result")
            .map((block) => [block.tool_use_id, block.content])
        : [],
    ),
  );
  const calls = uses.map((block) => ({
    name: block.name?.replace(/^mcp__teletype_eval__/, ""),
    arguments: block.input,
    output: results.get(block.id),
  }));
  const result = events.findLast(({ type }) => type === "result");
  return parsedResult(calls, result?.result, result?.usage, result?.total_cost_usd);
}

function parseOpenCode(events) {
  const calls = events
    .filter(({ type, part }) => type === "tool_use" && part?.type === "tool")
    .map(({ part }) => ({
      name: part.tool?.replace(/^(?:teletype-eval_|teletype_eval_)/, ""),
      arguments: part.state?.input,
      output: part.state?.output,
    }));
  const usage = events
    .filter(({ type }) => type === "step_finish")
    .reduce(
      (total, { part }) => {
        total.input_tokens += part?.tokens?.input ?? 0;
        total.cached_input_tokens += part?.tokens?.cache?.read ?? 0;
        total.cache_write_input_tokens += part?.tokens?.cache?.write ?? 0;
        total.output_tokens += part?.tokens?.output ?? 0;
        return total;
      },
      { input_tokens: 0, cached_input_tokens: 0, cache_write_input_tokens: 0, output_tokens: 0 },
    );
  const finalMessage = events.filter(({ type }) => type === "text").at(-1)?.part?.text;
  return parsedResult(calls, finalMessage, usage);
}

function parseAgy(events) {
  const calls = events
    .filter(
      (event) =>
        event.event === "step_update" &&
        event.step_update?.step_type === "tool" &&
        event.step_update?.state === "DONE",
    )
    .map(({ step_update: step }) => ({
      name: step.tool_name?.replace(/^mcp_teletype_eval_/, ""),
      arguments: step.tool_info?.parameters,
      output: step.tool_info?.output,
    }));
  const result = events.findLast(({ event }) => event === "result")?.result;
  return parsedResult(calls, result?.response, result?.usage);
}

function parsedResult(toolCalls, finalMessage, usage, reportedCost) {
  const gradeCall = toolCalls.find(({ name }) => name === "eval_grade_case");
  const grade = parseGrade(gradeCall?.output);
  return {
    answer: gradeCall?.arguments?.answer ?? null,
    finalMessage: finalMessage ?? null,
    grade,
    usage: usage ?? null,
    reportedCost: reportedCost ?? null,
    toolCalls,
    parseError: gradeCall && !grade ? "Could not parse eval_grade_case output" : null,
  };
}

function parseGrade(output) {
  if (!output) return null;
  if (typeof output === "object" && !Array.isArray(output) && output.case_id) return output;
  const text = Array.isArray(output)
    ? output.map((part) => part.text ?? "").join("\n")
    : typeof output === "string"
      ? output
      : JSON.stringify(output);
  try {
    const parsed = JSON.parse(text);
    return parsed.case_id
      ? parsed
      : parsed.structuredContent?.case_id
        ? parsed.structuredContent
        : null;
  } catch {
    return null;
  }
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
