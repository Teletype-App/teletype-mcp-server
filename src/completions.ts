import { t } from "./i18n.js";
import type { CompleteResult } from "@modelcontextprotocol/server";
import { loadChannels } from "./tools.js";
import { RESOURCE_DEFINITIONS, RESOURCE_TEMPLATES } from "./resources.js";

export interface CompleteParams {
  ref: { type: "ref/prompt"; name: string } | { type: "ref/resource"; uri: string };
  argument: { name: string; value: string };
}

export async function handleComplete(params: CompleteParams): Promise<CompleteResult> {
  const { ref, argument } = params;
  const val = (argument.value || "").trim().toLowerCase();

  if (ref.type === "ref/prompt") {
    switch (ref.name) {
      case "triage-inbox":
      case "shift-handover": {
        if (argument.name === "channel_id") {
          try {
            const channels = await loadChannels();
            const candidates: string[] = [];
            for (const ch of channels) {
              if (
                !val ||
                ch.id.toLowerCase().includes(val) ||
                ch.name?.toLowerCase().includes(val)
              ) {
                candidates.push(ch.id);
              }
            }
            return {
              completion: {
                values: candidates.slice(0, 20),
                total: candidates.length,
                hasMore: candidates.length > 20,
              },
            };
          } catch {
            return { completion: { values: [] } };
          }
        }
        if (argument.name === "limit") {
          const limits = ["5", "10", "20", "50"].filter((l) => !val || l.startsWith(val));
          return {
            completion: {
              values: limits,
              total: limits.length,
              hasMore: false,
            },
          };
        }
        break;
      }

      case "escalate-issue": {
        if (argument.name === "component") {
          const components = [
            t("completions.escalateIssue.payment"),
            t("completions.escalateIssue.authorization"),
            t("completions.escalateIssue.mobileApplication"),
            t("completions.escalateIssue.notifications"),
            t("completions.escalateIssue.cRMIntegration"),
            t("completions.escalateIssue.personalAccount"),
            t("completions.escalateIssue.webhooks"),
          ].filter((c) => !val || c.toLowerCase().includes(val));
          return {
            completion: {
              values: components,
              total: components.length,
              hasMore: false,
            },
          };
        }
        break;
      }

      case "draft-reply": {
        if (argument.name === "instructions") {
          const suggestions = [
            t("completions.draftReply.refundAgreed"),
            t("completions.draftReply.offer10Discount"),
            t("completions.draftReply.requestScreenshotError"),
            t("completions.draftReply.specifyOrderNumber"),
            t("completions.draftReply.notifyAboutDeliveryTimes"),
          ].filter((s) => !val || s.toLowerCase().includes(val));
          return {
            completion: {
              values: suggestions,
              total: suggestions.length,
              hasMore: false,
            },
          };
        }
        break;
      }
    }
  }

  if (ref.type === "ref/resource") {
    const candidates = [
      ...RESOURCE_DEFINITIONS.map((r) => r.uri),
      ...RESOURCE_TEMPLATES.map((r) => r.uriTemplate),
    ].filter((uri) => !val || uri.toLowerCase().startsWith(val));
    return {
      completion: {
        values: candidates.slice(0, 20),
        total: candidates.length,
        hasMore: candidates.length > 20,
      },
    };
  }

  return { completion: { values: [] } };
}
