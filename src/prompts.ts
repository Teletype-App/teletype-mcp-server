import { t } from "./i18n.js";
import type { Prompt, PromptMessage } from "@modelcontextprotocol/server";

export const PROMPT_DEFINITIONS: Prompt[] = [
  {
    name: "triage-inbox",
    description: t("prompts.triageInbox.description"),
    arguments: [
      {
        name: "channel_id",
        description: t("prompts.triageInbox.channelId.description"),
        required: false,
      },
      {
        name: "limit",
        description: t("prompts.triageInbox.limit.description"),
        required: false,
      },
    ],
  },
  {
    name: "draft-reply",
    description: t("prompts.draftReply.description"),
    arguments: [
      {
        name: "dialog_id",
        description: t("prompts.draftReply.dialogId.description"),
        required: true,
      },
      {
        name: "instructions",
        description: t("prompts.draftReply.instructions.description"),
        required: false,
      },
    ],
  },
  {
    name: "client-summary",
    description: t("prompts.clientSummary.description"),
    arguments: [
      {
        name: "client",
        description: t("prompts.clientSummary.client.description"),
        required: true,
      },
    ],
  },
  {
    name: "escalate-issue",
    description: t("prompts.escalateIssue.description"),
    arguments: [
      {
        name: "dialog_id",
        description: t("prompts.escalateIssue.dialogId.description"),
        required: true,
      },
      {
        name: "component",
        description: t("prompts.escalateIssue.component.description"),
        required: false,
      },
    ],
  },
  {
    name: "shift-handover",
    description: t("prompts.shiftHandover.description"),
    arguments: [
      {
        name: "channel_id",
        description: t("prompts.shiftHandover.channelId.description"),
        required: false,
      },
    ],
  },
];

export function handleGetPrompt(
  name: string,
  args?: Record<string, string>,
): { description?: string; messages: PromptMessage[] } {
  switch (name) {
    case "triage-inbox": {
      const channelText = args?.channel_id
        ? t("prompts.triageInbox.channel", { channelId: args.channel_id })
        : "";
      const limit = args?.limit || "10";
      return {
        description: t("prompts.triageInbox.triagePlanQueueUnansweredRequests"),
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: t("prompts.triageInbox.step1CallFindConversationsStatus", {
                channelText: channelText,
                limit: limit,
              }),
            },
          },
        ],
      };
    }

    case "draft-reply": {
      const dialogId = args?.dialog_id || "";
      const extra = args?.instructions
        ? t("prompts.draftReply.additionalOperatorInstructions", {
            instructions: args.instructions,
          })
        : "";
      return {
        description: t("prompts.draftReply.preparingResponseConversation", { dialogId: dialogId }),
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: t("prompts.draftReply.step1CallReadConversationThread", {
                dialogId: dialogId,
                extra: extra,
              }),
            },
          },
        ],
      };
    }

    case "client-summary": {
      const client = args?.client || "";
      return {
        description: t("prompts.clientSummary.clientSummary", { client: client }),
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: t("prompts.clientSummary.step1CallLookupClientProfile", { client: client }),
            },
          },
        ],
      };
    }

    case "escalate-issue": {
      const dialogId = args?.dialog_id || "";
      const comp = args?.component
        ? t("prompts.escalateIssue.component", { component: args.component })
        : "";
      return {
        description: t("prompts.escalateIssue.escalationConversation", { dialogId: dialogId }),
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: t("prompts.escalateIssue.step1CallReadConversationThread", {
                dialogId: dialogId,
                comp: comp,
              }),
            },
          },
        ],
      };
    }

    case "shift-handover": {
      const channelText = args?.channel_id
        ? t("prompts.shiftHandover.focusChannel", { channelId: args.channel_id })
        : "";
      return {
        description: t("prompts.shiftHandover.supportShiftReport", { channelText: channelText }),
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: t("prompts.shiftHandover.step1CallGetProjectStatus", {
                value1: args?.channel_id ? `, channel='${args.channel_id}'` : "",
              }),
            },
          },
        ],
      };
    }

    default:
      throw new Error(
        t("prompts.handleGetPrompt.unknownPromptAvailable", {
          name: name,
          value2: PROMPT_DEFINITIONS.map((p) => p.name).join(", "),
        }),
      );
  }
}
