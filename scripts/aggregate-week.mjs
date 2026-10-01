import { readFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("/tmp/teletype-week.json", "utf8"));
const WEEK_START = new Date(raw.week_start);

function tsOf(x) {
  if (!x) return null;
  if (typeof x === "string") {
    const d = new Date(x);
    return isNaN(d) ? null : d;
  }
  if (x.date) {
    const d = new Date(x.date);
    return isNaN(d) ? null : d;
  }
  return null;
}

const dialogs = raw.dialogs;

const byChannel = new Map();
const byDay = new Map();
const byOperator = new Map();
let groupCount = 0;
let unanswered = 0;
let openCount = 0;

for (const d of dialogs) {
  if (d.isGroupChat) groupCount++;
  if (d.isUnanswered) unanswered++;
  if (d.statusName === "open") openCount++;

  const ch = d.channel?.name || "—";
  byChannel.set(ch, (byChannel.get(ch) || 0) + 1);

  const last = tsOf(d.lastMessageAt);
  if (last) {
    const day = last.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  const op = d.operator?.name || "—unassigned—";
  byOperator.set(op, (byOperator.get(op) || 0) + 1);
}

// Measure latency from the first message in a consecutive client run to the operator reply.
const opStats = new Map();

for (const d of dialogs) {
  const msgs = (d.messages || [])
    .map((m) => ({ ...m, _t: tsOf(m.sentAt) || tsOf(m.createdAt) }))
    .filter((m) => m._t)
    .sort((a, b) => a._t - b._t);

  let lastClientMsg = null;
  for (const m of msgs) {
    if (m._t < WEEK_START) continue;
    if (m.isItClient) {
      if (!lastClientMsg) lastClientMsg = m;
    } else {
      if (lastClientMsg && m.operator?.name) {
        const delta = (m._t - lastClientMsg._t) / 1000;
        if (delta >= 0 && delta < 7 * 24 * 3600) {
          const name = m.operator.name;
          let s = opStats.get(name);
          if (!s) {
            s = { count: 0, total: 0, max: 0, samples: [] };
            opStats.set(name, s);
          }
          s.count++;
          s.total += delta;
          if (delta > s.max) s.max = delta;
          s.samples.push(delta);
        }
        lastClientMsg = null;
      }
    }
  }
}

function fmtDur(s) {
  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${(s / 60).toFixed(1)}m`;
  if (s < 24 * 3600) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const opRows = [...opStats.entries()]
  .map(([name, s]) => ({
    name,
    replies: s.count,
    avg: s.total / s.count,
    median: median(s.samples),
    max: s.max,
  }))
  .filter((r) => r.replies >= 5)
  .sort((a, b) => b.median - a.median);

const opAll = [...opStats.entries()]
  .map(([name, s]) => ({
    name,
    replies: s.count,
    avg: s.total / s.count,
    median: median(s.samples),
    max: s.max,
  }))
  .sort((a, b) => b.median - a.median);

const lines = [];
const p = (s) => lines.push(s);

p(`# Teletype: срез за неделю`);
p(`extracted_at: ${raw.extracted_at}`);
p(`window: ${raw.week_start} → ${new Date().toISOString()}`);
p(`total_in_project: ${raw.total_dialogs_in_project}`);
p(`dialogs_in_window: ${raw.dialog_count}`);
p(`  • групповых: ${groupCount}`);
p(`  • неотвеченных сейчас: ${unanswered}`);
p(`  • open сейчас: ${openCount}`);
p(``);

p(`## Объём по дням (UTC, по lastMessageAt)`);
[...byDay.entries()].sort().forEach(([d, n]) => p(`  ${d}: ${n}`));
p(``);

p(`## Объём по каналам (top 15)`);
[...byChannel.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([c, n]) => p(`  ${n.toString().padStart(4)} ${c}`));
p(``);

p(`## Диалоги по операторам (top 15)`);
[...byOperator.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([o, n]) => p(`  ${n.toString().padStart(4)} ${o}`));
p(``);

p(`## Скорость ответа операторов (≥5 ответов за неделю)`);
p(`  ${"оператор".padEnd(28)}  ответов   медиана      ср.        max`);
opRows.forEach((r) =>
  p(
    `  ${r.name.padEnd(28)}  ${String(r.replies).padStart(7)}  ${fmtDur(r.median).padStart(8)}  ${fmtDur(
      r.avg,
    ).padStart(8)}  ${fmtDur(r.max).padStart(8)}`,
  ),
);
p(``);

p(`## Все операторы (включая <5 ответов) — для контекста`);
opAll.forEach((r) =>
  p(
    `  ${r.name.padEnd(28)}  ${String(r.replies).padStart(7)}  ${fmtDur(r.median).padStart(8)}  ${fmtDur(
      r.avg,
    ).padStart(8)}  ${fmtDur(r.max).padStart(8)}`,
  ),
);

console.log(lines.join("\n"));
