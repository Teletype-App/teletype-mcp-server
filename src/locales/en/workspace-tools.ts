import type { MessageValue } from "../types.js";

export const workspaceMessages = {
  "workspace.common.unknownError": "unknown error",
  "workspace.listWorkspaceMetadata.useNamesNotIDsWhen":
    "Use names (not IDs) when calling other tools - they will be resolved automatically.",
  "workspace.getProjectStatus.failedGetBalance": ({ error }: { error: MessageValue }) =>
    `Failed to get balance: ${error}`,
  "workspace.getProjectStatus.failedGetTariff": ({ tariffError }: { tariffError: MessageValue }) =>
    `Failed to get tariff: ${tariffError}`,
  "workspace.getProjectStatus.failedGetProjectInformation": ({
    detailsError,
  }: {
    detailsError: MessageValue;
  }) => `Failed to get project information: ${detailsError}`,
  "workspace.getProjectStatus.balanceIsEnoughDaysTop": ({
    daysRemaining,
  }: {
    daysRemaining: MessageValue;
  }) => `The balance is enough for ${daysRemaining} days. Top up the project balance now.`,
  "workspace.getProjectStatus.balanceIsEnoughDaysPlan": ({
    daysRemaining,
  }: {
    daysRemaining: MessageValue;
  }) => `The balance is enough for ${daysRemaining} days. Plan a top-up.`,
  "workspace.getProjectStatus.thereAreNoOperatorsStatus":
    "There are no operators with the status “available”.",
  "workspace.getProjectStatus.failedGetListOperators": ({ error }: { error: MessageValue }) =>
    `Failed to get list of operators: ${error}`,
  "workspace.getProjectStatus.teletypePublicAPIUnavailable": ({ error }: { error: MessageValue }) =>
    `Teletype public API unavailable: ${error}`,
  "workspace.getProjectStatus.webhookErrorsRecorded": ({
    webhookErrorsCount,
  }: {
    webhookErrorsCount: MessageValue;
  }) => `Webhook errors recorded: ${webhookErrorsCount}.`,
  "workspace.getProjectStatus.channelIsInactiveClientsMay": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `Channel '${value1}' is inactive. Clients may not receive replies.`,
  "workspace.getProjectStatus.projectHasWarningsCheckWarnings":
    "The project has warnings. Check the warnings field.",
  "workspace.getProjectStatus.noProjectWarningsFound": "No project warnings found.",
  "workspace.manageOperatorGroup.actionGroupOperatorsRequiresExplicit":
    "An action on a group of operators requires explicit confirmation.",
  "workspace.manageOperatorGroup.specifyConfirmTrueUserConfirms":
    "Specify confirm: true after the user confirms.",
  "workspace.manageOperatorGroup.groupParameterIsRequiredGroup":
    "The 'group' parameter is required (group name or ID).",
  "workspace.manageOperatorGroup.groupHint":
    "Pass group as the name or ID from list_workspace_metadata(resource='groups'), for example group: 'Support'.",
  "workspace.manageOperatorGroup.groupWasNotUniquelyFound": ({
    groupQuery,
  }: {
    groupQuery: MessageValue;
  }) => `The group '${groupQuery}' was not uniquely found.`,
  "workspace.manageOperatorGroup.noGroupsFoundHint":
    "No groups found. The list is available via list_workspace_metadata with resource='groups'.",
  "workspace.removeMember.actionRequiresOperatorParameter": ({
    action,
  }: {
    action: MessageValue;
  }) => `The action '${action}' requires the 'operator' parameter.`,
  "workspace.removeMember.operatorHint":
    "Pass operator as the name or ID from list_workspace_metadata(resource='operators').",
  "workspace.removeMember.operatorWasNotUniquelyFound": ({ opQuery }: { opQuery: MessageValue }) =>
    `The operator '${opQuery}' was not uniquely found.`,
  "workspace.removeMember.operatorHasBeenAddedGroup": "The operator has been added to the group.",
  "workspace.removeMember.operatorHasBeenRemovedGroup":
    "The operator has been removed from the group.",
  "workspace.removeChannel.actionRequiresChannelParameter": ({
    action,
  }: {
    action: MessageValue;
  }) => `The action '${action}' requires the 'channel' parameter.`,
  "workspace.removeChannel.channelHint":
    "Pass channel as the name or ID from list_workspace_metadata(resource='channels').",
  "workspace.removeChannel.channelWasNotUniquelyFound": ({ chQuery }: { chQuery: MessageValue }) =>
    `Channel '${chQuery}' was not uniquely found.`,
  "workspace.removeChannel.channelIsLinkedGroup": "The channel is linked to a group.",
  "workspace.removeChannel.channelIsUnlinkedGroup": "The channel is unlinked from the group.",
  "workspace.setSupervisor.setSupervisorRequiresOperatorParameter":
    "set_supervisor requires the 'operator' parameter.",
  "workspace.setSupervisor.supervisorRightsHaveBeenGranted": "Supervisor rights have been granted.",
  "workspace.setSupervisor.supervisorRightsHaveBeenRemoved": "Supervisor rights have been removed.",
  "workspace.setChannelVisibility.setChannelVisibilityRequiresChannel":
    "set_channel_visibility requires the 'channel' parameter.",
  "workspace.setChannelVisibility.visibilityOtherOperatorsConversationsChannel":
    "Visibility of other operators' conversations in the channel was updated for the group.",
  "workspace.manageOperatorGroup.unknownAction": ({ action }: { action: MessageValue }) =>
    `Unknown action: '${action}'.`,
  "workspace.manageOperatorGroup.validActionsAddMemberRemove":
    "Valid actions: add_member, remove_member, add_channel, remove_channel, set_supervisor, set_channel_visibility.",
  "workspace.configureProjectWebhook.settingUpProjectSPublic":
    "Setting up a project's public webhook requires explicit confirmation.",
  "workspace.configureProjectWebhook.webhookIsSetActiveEvents": ({
    webhookUrl,
    activeEventsCount,
  }: {
    webhookUrl: MessageValue;
    activeEventsCount: MessageValue;
  }) => `The webhook is set to ${webhookUrl}, active events: ${activeEventsCount}.`,
  "workspace.configureProjectWebhook.projectWebhookHasBeenCleared":
    "The project webhook has been cleared/disabled.",
  "workspace.getCapabilities.readOnlyMode":
    "The server runs in read-only mode: write tools are not registered.",
  "workspace.getCapabilities.onlyToolsetsActive": ({ toolsets }: { toolsets: MessageValue }) =>
    `Only these toolsets are active: ${toolsets}.`,
  "workspace.getCapabilities.markSeenNeedsConfirm":
    "read_conversation_thread can mark a conversation as read only with mark_seen=true and confirm=true.",
  "workspace.getCapabilities.useThisMapBeforeFilters":
    "Check this map before calls that depend on optional features (WABA templates, webhooks, operator groups).",
} as const;
