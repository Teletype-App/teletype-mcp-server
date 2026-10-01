import { t } from "./i18n.js";
import { categoryDisplayName, operatorDisplayName } from "./entity-resolver.js";
import type { GroupItem } from "./entity-resolver.js";
import type { CategoryItem, ClientItem, OperatorItem } from "./types.js";

interface ChannelLike {
  name?: string;
  channelType?: string;
  type?: string;
}

// Every helper formats the same way: at most five "name (context)" entries,
// then either the candidate list or a pointer to the workspace metadata
// resource that lists the entities.

export function channelCandidatesHint(candidates: ChannelLike[]): string {
  const list = candidates
    .slice(0, 5)
    .map(
      (c) =>
        `${c.name || t("conversation.findConversations.unnamed")} [${c.channelType || c.type || "?"}]`,
    )
    .join(", ");
  return list
    ? t("conversation.findConversations.candidatesFoundSpecifyNameOr", { list: list })
    : t("conversation.findConversations.thereAreNoChannelsThis");
}

export function operatorCandidatesHint(candidates: OperatorItem[]): string {
  const list = candidates.slice(0, 5).map(operatorDisplayName).join(", ");
  return list
    ? t("conversation.findConversations.candidates", { list: list })
    : t("conversation.findConversations.listOperatorsListWorkspaceMetadata");
}

export function clientCandidatesHint(candidates: ClientItem[]): string {
  const list = candidates
    .slice(0, 5)
    .map((c) => `${c.name || c.phone || c.email || c.id} (${c.id})`)
    .join(", ");
  return list
    ? t("conversation.findConversations.candidatesPassClientIdOr", { cands: list })
    : t("conversation.findConversations.usePhoneEmailOrClient");
}

export function categoryCandidatesHint(candidates: CategoryItem[]): string {
  const list = candidates.slice(0, 5).map(categoryDisplayName).join(", ");
  return list
    ? t("conversation.findConversations.candidates", { list: list })
    : t("conversation.findConversations.listCategoriesListWorkspaceMetadata");
}

export function groupCandidatesHint(candidates: GroupItem[]): string {
  const list = candidates
    .slice(0, 5)
    .map((g) => g.name || g.title || g.id)
    .join(", ");
  return list
    ? t("conversation.findConversations.candidates", { list: list })
    : t("workspace.manageOperatorGroup.noGroupsFoundHint");
}
