import { createHash } from "node:crypto";
import { resolveAuthToken } from "./request-context.js";
import {
  decodeIdList,
  decodeTagList,
  decodeChannelPage,
  decodeClientPage,
  decodeClientLookup,
  decodeOperatorList,
  decodeCategoryList,
  decodeProjectDetails,
} from "./api-contract.js";
import { teletypeRequest } from "./teletype-api.js";
import type {
  ApiDate,
  Tag,
  ChannelItem,
  CategoryItem,
  OperatorItem,
  ClientItem,
  ChannelListResponse,
  ClientListResponse,
} from "./types.js";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Hashing the token keeps tenant credentials out of cache keys and isolates cached metadata.
const cacheByToken = new Map<string, Map<string, CacheEntry<unknown>>>();
const CACHE_TTL_MS = 60_000;
const MAX_TENANTS_IN_CACHE = 256;

export function clearEntityCacheForCurrentToken(): void {
  const key = createHash("sha256").update(resolveAuthToken()).digest("hex");
  cacheByToken.delete(key);
}

function getTokenCache(): Map<string, CacheEntry<unknown>> {
  const cacheKey = createHash("sha256").update(resolveAuthToken()).digest("hex");
  let bucket = cacheByToken.get(cacheKey);
  if (!bucket) {
    if (cacheByToken.size >= MAX_TENANTS_IN_CACHE) {
      const oldest = cacheByToken.keys().next().value;
      if (oldest !== undefined) cacheByToken.delete(oldest);
    }
    bucket = new Map();
    cacheByToken.set(cacheKey, bucket);
  }
  return bucket;
}

async function getCached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = CACHE_TTL_MS,
): Promise<T> {
  const bucket = getTokenCache();
  const entry = bucket.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  const value = await loader();
  bucket.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function loadTags(): Promise<Tag[]> {
  return getCached("tags", async () => {
    const data = await teletypeRequest<Tag[]>("/tag/list", { decode: decodeTagList });
    return Array.isArray(data) ? data : [];
  });
}

export async function loadChannels(): Promise<ChannelItem[]> {
  return getCached("channels", async () => {
    const channels: ChannelItem[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const data = await teletypeRequest<ChannelListResponse>("/channels", {
        query: { page, pageSize: 100, onlyActive: 0 },
        decode: decodeChannelPage,
      });
      channels.push(...(data?.items ?? []));
      if (!data?.items || data.items.length < 100) break;
    }
    return channels;
  });
}

export async function loadCategories(): Promise<CategoryItem[]> {
  return getCached("categories", async () => {
    const data = await teletypeRequest<CategoryItem[]>("/appeal-categories/list", {
      decode: decodeCategoryList,
    });
    return Array.isArray(data) ? data : [];
  });
}

export async function loadOperators(): Promise<OperatorItem[]> {
  return getCached("operators", async () => {
    const data = await teletypeRequest<OperatorItem[]>("/project/operators", {
      decode: decodeOperatorList,
    });
    return Array.isArray(data) ? data : [];
  });
}

export interface GroupItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  color?: string;
  operatorIds?: string[];
  supervisorIds?: string[];
  channels?: { channelId: string; canViewOtherDialogs?: boolean }[];
  operators?: { id: string; name?: string }[];
}

export async function loadGroups(): Promise<GroupItem[]> {
  return getCached("groups", async () => {
    try {
      const data = await teletypeRequest<GroupItem[]>("/groups", {
        decode: decodeIdList,
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });
}

export async function resolveGroup(
  query: string,
): Promise<{ group?: GroupItem; candidates: GroupItem[] }> {
  const groups = await loadGroups();
  const q = query.trim().toLowerCase();

  const byId = groups.find((g) => g.id === query.trim());
  if (byId) return { group: byId, candidates: [] };

  const byName = groups.filter((g) => (g.name || g.title || "").toLowerCase() === q);
  if (byName.length === 1) return { group: byName[0], candidates: [] };

  const partial = groups.filter((g) => (g.name || g.title || "").toLowerCase().includes(q));
  if (partial.length === 1) return { group: partial[0], candidates: [] };

  return { candidates: partial.length ? partial : byName };
}

export async function loadProjectDetails(): Promise<
  { name?: string; domain?: string } | undefined
> {
  return getCached(
    "project-details",
    async () => {
      try {
        return await teletypeRequest("/project/details", { decode: decodeProjectDetails });
      } catch {
        return undefined;
      }
    },
    600_000,
  );
}

// An inaccurate fallback domain is worse than omitting the link.
export async function loadProjectDomain(): Promise<string | undefined> {
  const details = await loadProjectDetails();
  const d = (details?.domain || "").trim();
  return /^[a-z0-9-]+$/i.test(d) ? d : undefined;
}

export function operatorDisplayName(op: OperatorItem): string {
  return op.name || [op.firstName, op.lastName || op.last_name].filter(Boolean).join(" ") || op.id;
}

export const OPERATOR_STATUS: Record<number, string> = {
  10: "awaiting_confirmation",
  15: "profile_setup",
  20: "available",
  30: "busy",
  40: "hidden",
  50: "blocked",
  60: "frozen",
};

// The channel-list endpoint exposes activity through `active`, not `status`.
export function isChannelActive(c: ChannelItem): boolean {
  return c.active === true;
}

export function categoryDisplayName(c: CategoryItem): string {
  return c.name || c.title || c.id;
}

export function apiDate(value: string | ApiDate | undefined): string | undefined {
  return typeof value === "string" ? value : value?.date;
}

export async function resolveTagIds(
  names: string[],
): Promise<{ resolved: string[]; missing: string[] }> {
  if (!names?.length) return { resolved: [], missing: [] };
  const tags = await loadTags();
  const resolved: string[] = [];
  const missing: string[] = [];
  for (const n of names) {
    const found = tags.find((t) => t.tag?.toLowerCase() === n.toLowerCase());
    if (found) resolved.push(found.id);
    else missing.push(n);
  }
  return { resolved, missing };
}

export async function resolveChannel(
  query: string,
): Promise<{ channel?: ChannelItem; candidates: ChannelItem[] }> {
  const channels = await loadChannels();
  const q = query.toLowerCase();

  const byId = channels.find((c) => c.id === query);
  if (byId) return { channel: byId, candidates: [] };

  const byType = channels.filter((c) => (c.channelType || c.type || "").toLowerCase() === q);
  const byName = channels.filter((c) => (c.name || "").toLowerCase() === q);
  const byPartial = channels.filter((c) => (c.name || "").toLowerCase().includes(q));

  const candidates = byType.length > 0 ? byType : byName.length > 0 ? byName : byPartial;
  if (candidates.length === 1) return { channel: candidates[0], candidates: [] };
  return { candidates };
}

export async function resolveOperator(
  query: string,
): Promise<{ operator?: OperatorItem; candidates: OperatorItem[] }> {
  const operators = await loadOperators();
  const q = query.toLowerCase();

  const byId = operators.find((o) => o.id === query);
  if (byId) return { operator: byId, candidates: [] };

  const matches = operators.filter((o) => operatorDisplayName(o).toLowerCase().includes(q));
  if (matches.length === 1) return { operator: matches[0], candidates: [] };
  return { candidates: matches };
}

export async function resolveCategoryId(
  query: string,
): Promise<{ id?: string; candidates: CategoryItem[] }> {
  const cats = await loadCategories();
  const q = query.toLowerCase();

  const byId = cats.find((c) => c.id === query);
  if (byId) return { id: byId.id, candidates: [] };

  const exact = cats.filter((c) => categoryDisplayName(c).toLowerCase() === q);
  if (exact.length === 1) return { id: exact[0]?.id, candidates: [] };

  const partial = cats.filter((c) => categoryDisplayName(c).toLowerCase().includes(q));
  if (partial.length === 1) return { id: partial[0]?.id, candidates: [] };

  return { candidates: partial };
}

export async function resolveClient(args: {
  client?: string;
  clientId?: string;
}): Promise<{ client?: ClientItem; candidates: ClientItem[] }> {
  const raw = (args.clientId || args.client || "").trim();
  if (!raw) return { candidates: [] };

  // Public IDs are opaque, so try an exact lookup before fuzzy fields.
  try {
    const data = await teletypeRequest<ClientItem | ClientListResponse>("/clients", {
      query: { clientId: raw, pageSize: 1 },
      decode: decodeClientLookup,
    });
    if ("items" in data && data.items?.[0]) return { client: data.items[0], candidates: [] };
    if ("id" in data && data.id) return { client: data, candidates: [] };
  } catch {
    // A non-ID query may produce 500 in the current Public API; continue with supported filters.
  }

  const digitsOnly = raw.replace(/[^\d+]/g, "");
  if (digitsOnly.length >= 7 && /\d/.test(raw)) {
    const data = await teletypeRequest<ClientListResponse>("/clients", {
      query: { clientPhone: digitsOnly, pageSize: 20 },
      decode: decodeClientPage,
    });
    const items = data?.items ?? [];
    if (items.length === 1) return { client: items[0], candidates: [] };
    if (items.length > 1) return { candidates: items };
  }

  // The API has no name/email filter, so scan a bounded window explicitly.
  const items: ClientItem[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const data = await teletypeRequest<ClientListResponse>("/clients", {
      query: { page, pageSize: 100 },
      decode: decodeClientPage,
    });
    items.push(...(data?.items ?? []));
    if (!data?.items || data.items.length < 100) break;
  }
  const q = raw.toLowerCase();
  const matches = items.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q),
  );
  if (matches.length === 1) return { client: matches[0], candidates: [] };
  return { candidates: matches };
}
