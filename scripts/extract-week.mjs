import { writeFileSync } from "node:fs";

const TOKEN = process.env.TT_TOKEN;
if (!TOKEN) {
  console.error("TT_TOKEN env required");
  process.exit(1);
}

const API = "https://api.teletype.app/public/api/v1";
const RATE_MS = 1100;
const NOW = new Date();
const WEEK_START = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let reqCount = 0;
async function api(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  reqCount++;
  await sleep(RATE_MS);
  const r = await fetch(url, {
    headers: { "X-Auth-Token": TOKEN, Accept: "application/json" },
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${path} :: ${body.slice(0, 300)}`);
  }
  const j = await r.json();
  if (!j.success) {
    throw new Error(`API err ${path} :: ${JSON.stringify(j.errors).slice(0, 300)}`);
  }
  return j.data;
}

function tsOf(x) {
  // The API's `date` already includes its UTC offset.
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

console.error(`[${new Date().toISOString()}] week_start=${WEEK_START.toISOString()}`);
console.error("Fetching dialog list...");

const dialogs = [];
let page = 1;
let total;
let stop = false;
while (!stop) {
  const data = await api("/dialogs", { status: "all", page });
  total = data.totalItems;
  const items = data.items || [];
  if (items.length === 0) break;

  for (const d of items) {
    const last = tsOf(d.lastMessageAt) || tsOf(d.createdAt);
    if (last && last < WEEK_START) {
      stop = true;
      break;
    }
    dialogs.push(d);
  }
  console.error(
    `  page ${page}/${data.totalPages}  collected=${dialogs.length}  oldest_seen=${
      tsOf(items[items.length - 1]?.lastMessageAt)?.toISOString() || "?"
    }`,
  );
  page++;
  if (page > data.totalPages) break;
  if (page > 200) {
    console.error("safety stop at page 200");
    break;
  }
}
console.error(`Got ${dialogs.length} dialogs touched in last 7d (project total=${total}).`);

console.error("Fetching messages...");
let i = 0;
for (const d of dialogs) {
  i++;
  const out = [];
  let mp = 1;
  let cap = 0;
  while (true) {
    cap++;
    const data = await api("/messages", { dialogId: d.id, page: mp });
    const items = data.items || [];
    if (items.length === 0) break;

    let stopMsg = false;
    for (const m of items) {
      const t = tsOf(m.sentAt) || tsOf(m.createdAt);
      if (t && t < WEEK_START) {
        stopMsg = true;
        break;
      }
      out.push(m);
    }
    if (stopMsg) break;
    mp++;
    if (mp > data.totalPages) break;
    if (cap > 50) {
      console.error(`  [${i}/${dialogs.length}] ${d.id} cap reached at page ${mp}`);
      break;
    }
  }
  d.messages = out;
  if (i % 10 === 0 || i === dialogs.length) {
    console.error(`  [${i}/${dialogs.length}] reqs=${reqCount}  last_dialog_msgs=${out.length}`);
  }
}

const result = {
  extracted_at: NOW.toISOString(),
  week_start: WEEK_START.toISOString(),
  total_dialogs_in_project: total,
  dialog_count: dialogs.length,
  total_requests: reqCount,
  dialogs,
};
const outPath = "/tmp/teletype-week.json";
writeFileSync(outPath, JSON.stringify(result));
console.error(`Done. ${reqCount} requests. Wrote ${outPath}`);
