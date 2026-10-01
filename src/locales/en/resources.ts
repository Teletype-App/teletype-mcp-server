import type { MessageValue } from "../types.js";

export const resourcesMessages = {
  "resources.workspaceMetadata.name": "Teletype Workspace Metadata",
  "resources.workspaceMetadata.description":
    "Teletype Project Directory: channels, tags, categories, templates, operators and groups.",
  "resources.projectStatus.name": "Teletype Project Status",
  "resources.projectStatus.description":
    "Teletype project status summary: balance, operator availability and API errors.",
  "resources.dialogsUnanswered.name": "Teletype Unanswered Dialogs",
  "resources.dialogsUnanswered.description":
    "The current queue of unanswered customer requests with links to conversations.",
  "resources.dialogsItem.name": "Teletype Dialog Thread",
  "resources.dialogsItem.description": "History of Teletype dialog messages by dialog ID.",
  "resources.clientsItem.name": "Teletype Client Profile",
  "resources.clientsItem.description":
    "Teletype client profile (contacts, tags, notes) by client ID.",
  "resources.handleReadResource.unknownResourceAvailableOrTemplates": ({
    uri,
    value2,
    value3,
  }: {
    uri: MessageValue;
    value2: MessageValue;
    value3: MessageValue;
  }) => `Unknown resource '${uri}'. Available: ${value2} or ${value3} templates`,
} as const;
