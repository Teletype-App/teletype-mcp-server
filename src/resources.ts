import { t } from "./i18n.js";
import type {
  Resource,
  ListResourceTemplatesResult,
  TextResourceContents,
} from "@modelcontextprotocol/server";
import { TeletypeTools } from "./tools.js";

export const RESOURCE_DEFINITIONS: Resource[] = [
  {
    uri: "teletype://workspace/metadata",
    name: t("resources.workspaceMetadata.name"),
    description: t("resources.workspaceMetadata.description"),
    mimeType: "application/json",
  },
  {
    uri: "teletype://project/status",
    name: t("resources.projectStatus.name"),
    description: t("resources.projectStatus.description"),
    mimeType: "application/json",
  },
  {
    uri: "teletype://dialogs/unanswered",
    name: t("resources.dialogsUnanswered.name"),
    description: t("resources.dialogsUnanswered.description"),
    mimeType: "application/json",
  },
];

export const RESOURCE_TEMPLATES: ListResourceTemplatesResult["resourceTemplates"] = [
  {
    uriTemplate: "teletype://dialogs/{dialogId}",
    name: t("resources.dialogsItem.name"),
    description: t("resources.dialogsItem.description"),
    mimeType: "application/json",
  },
  {
    uriTemplate: "teletype://clients/{clientId}",
    name: t("resources.clientsItem.name"),
    description: t("resources.clientsItem.description"),
    mimeType: "application/json",
  },
];

export async function handleReadResource(
  uri: string,
): Promise<{ contents: TextResourceContents[] }> {
  switch (uri) {
    case "teletype://workspace/metadata": {
      const data = await TeletypeTools.listWorkspaceMetadata({ resource: "all" });
      const text = data.content[0]?.text ?? JSON.stringify(data);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text,
          },
        ],
      };
    }

    case "teletype://project/status": {
      const data = await TeletypeTools.getProjectStatus({ aspect: "all" });
      const text = data.content[0]?.text ?? JSON.stringify(data);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text,
          },
        ],
      };
    }

    case "teletype://dialogs/unanswered": {
      const data = await TeletypeTools.findConversations({ status: "unanswered", limit: 20 });
      const text = data.content[0]?.text ?? JSON.stringify(data);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text,
          },
        ],
      };
    }

    default: {
      if (uri.startsWith("teletype://dialogs/")) {
        const dialogId = uri.slice("teletype://dialogs/".length).trim();
        if (dialogId) {
          const data = await TeletypeTools.readConversationThread({ dialog_id: dialogId });
          const text = data.content[0]?.text ?? JSON.stringify(data);
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text,
              },
            ],
          };
        }
      }

      if (uri.startsWith("teletype://clients/")) {
        const clientId = uri.slice("teletype://clients/".length).trim();
        if (clientId) {
          const data = await TeletypeTools.lookupClientProfile({ client: clientId });
          const text = data.content[0]?.text ?? JSON.stringify(data);
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text,
              },
            ],
          };
        }
      }

      throw new Error(
        t("resources.handleReadResource.unknownResourceAvailableOrTemplates", {
          uri: uri,
          value2: RESOURCE_DEFINITIONS.map((r) => r.uri).join(", "),
          value3: RESOURCE_TEMPLATES.map((t) => t.uriTemplate).join(", "),
        }),
      );
    }
  }
}
