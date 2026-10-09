import {
  TOOL_CATALOG,
  TOOLSET_NAMES,
  toolsetOf,
  type ToolName,
  type ToolsetName,
} from "./tool-catalog.js";
import { requestContext } from "./request-context.js";

export const TOOLSETS = TOOLSET_NAMES;
export type { ToolsetName };

export interface ToolPolicy {
  // Read-only deployments never register write tools, mirroring the GitHub MCP flag
  // that takes priority even over explicit tool selection.
  readOnly: boolean;
  // null means every toolset is active; get_capabilities ("meta") always stays active.
  toolsets: ToolsetName[] | null;
}

// Derived from the catalog so writesData stays the single source of truth.
const WRITE_TOOL_NAMES = new Set<ToolName>(
  TOOL_CATALOG.filter((contract) => contract.writesData).map((contract) => contract.name),
);

export function parseToolsetList(value: string | undefined): ToolsetName[] | null {
  if (value === undefined || value.trim() === "") return null;
  const requested = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!requested.length) return null;
  for (const item of requested) {
    if (!TOOLSETS.includes(item as ToolsetName)) {
      throw new Error(`Unknown toolset '${item}'. Available toolsets: ${TOOLSETS.join(", ")}.`);
    }
  }
  return [...new Set(requested as ToolsetName[])];
}

export function loadToolPolicy(env: NodeJS.ProcessEnv = process.env): ToolPolicy {
  const scopedPolicy = requestContext.getStore()?.toolPolicy;
  if (scopedPolicy) return scopedPolicy;
  return {
    readOnly: env.TELETYPE_MCP_READ_ONLY === "true",
    toolsets: parseToolsetList(env.TELETYPE_MCP_TOOLSETS),
  };
}

// Lenient variant for in-band reporting: bad env values surface as notes
// instead of failing the get_capabilities call.
export function inspectToolPolicy(env: NodeJS.ProcessEnv = process.env): {
  policy: ToolPolicy;
  notes: string[];
} {
  const scopedPolicy = requestContext.getStore()?.toolPolicy;
  if (scopedPolicy) return { policy: scopedPolicy, notes: [] };
  const notes: string[] = [];
  let toolsets: ToolsetName[] | null = null;
  try {
    toolsets = parseToolsetList(env.TELETYPE_MCP_TOOLSETS);
  } catch (error) {
    notes.push(error instanceof Error ? error.message : String(error));
  }
  return {
    policy: { readOnly: env.TELETYPE_MCP_READ_ONLY === "true", toolsets },
    notes,
  };
}

export function policyAllows(policy: ToolPolicy, name: ToolName): boolean {
  if (policy.readOnly && WRITE_TOOL_NAMES.has(name)) return false;
  if (policy.toolsets && toolsetOf(name) !== "meta") {
    return policy.toolsets.includes(toolsetOf(name));
  }
  return true;
}
