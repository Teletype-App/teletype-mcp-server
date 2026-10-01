import { toolCatalogMessages } from "./tool-catalog.js";
import { promptsMessages } from "./prompts.js";
import { serverMessages } from "./server.js";
import { resourcesMessages } from "./resources.js";
import { completionsMessages } from "./completions.js";
import { presentationMessages } from "./tool-presentation.js";
import { helpersMessages } from "./tool-helpers.js";
import { messagingMessages } from "./messaging-tools.js";
import { conversationMessages } from "./conversation-tools.js";
import { workspaceMessages } from "./workspace-tools.js";
import { apiMessages } from "./teletype-api.js";
import { evalGraderMessages } from "./grader.js";
import { evalFixtureMessages } from "./fixture-server.js";

export const enMessages = {
  ...toolCatalogMessages,
  ...promptsMessages,
  ...serverMessages,
  ...resourcesMessages,
  ...completionsMessages,
  ...presentationMessages,
  ...helpersMessages,
  ...messagingMessages,
  ...conversationMessages,
  ...workspaceMessages,
  ...apiMessages,
  ...evalGraderMessages,
  ...evalFixtureMessages,
} as const;
