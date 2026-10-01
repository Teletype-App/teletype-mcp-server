import { t, parseLocale } from "./i18n.js";
import { inspectToolPolicy, policyAllows, TOOLSETS } from "./tool-policy.js";
import { TOOL_CATALOG } from "./tool-catalog.js";
import { teletypeRequest } from "./teletype-api.js";
import {
  loadChannels,
  loadTags,
  loadCategories,
  loadOperators,
  loadGroups,
  loadProjectDetails,
  resolveGroup,
  operatorDisplayName,
  OPERATOR_STATUS,
  isChannelActive,
  categoryDisplayName,
  resolveChannel,
  resolveOperator,
} from "./entity-resolver.js";
import { errorMessage, textArg, jsonResult, errorResult } from "./tool-helpers.js";
import {
  channelCandidatesHint,
  operatorCandidatesHint,
  groupCandidatesHint,
} from "./candidate-hints.js";
import type { ChannelItem, ToolResult } from "./types.js";
import type { ToolArgs } from "./tool-catalog.js";
import {
  decodeGroupView,
  decodeProjectApiStatus,
  decodeProjectBalance,
  decodeProjectDetails,
  decodeProjectTariff,
  decodeTemplateDirectories,
  decodeTemplateList,
} from "./api-contract.js";

export async function listWorkspaceMetadata(
  args: ToolArgs<"list_workspace_metadata">,
): Promise<ToolResult> {
  const resource = (args.resource as string) || "all";
  const wantAll = resource === "all";
  const result: Record<string, unknown> = {};
  const resourceErrors: Record<string, string> = {};

  if (wantAll || resource === "channels") {
    let ch = await loadChannels();
    if (typeof args.channel_type === "string" && args.channel_type.trim()) {
      const ct = args.channel_type.trim().toLowerCase();
      ch = ch.filter((c) => (c.channelType || c.type || "").toLowerCase() === ct);
    }
    if (args.only_active === true) {
      ch = ch.filter((c) => isChannelActive(c));
    }
    result.channels = ch.slice(0, 50).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.channelType || c.type,
      active: isChannelActive(c),
    }));
  }

  if (wantAll || resource === "tags") {
    const t = await loadTags();
    result.tags = t.slice(0, 100).map((x) => ({
      id: x.id,
      name: x.tag,
      color: x.color,
    }));
  }

  if (wantAll || resource === "categories") {
    const c = await loadCategories();
    result.categories = c.slice(0, 100).map((x) => ({
      id: x.id,
      name: categoryDisplayName(x),
    }));
  }

  if (wantAll || resource === "templates") {
    try {
      const tpls = await teletypeRequest("/template-message/list", { decode: decodeTemplateList });
      const flat = [
        ...(tpls?.withoutDirectories?.templates ?? []).map((t) => ({
          ...t,
          directory: null as string | null,
        })),
        ...(tpls?.directories ?? []).flatMap((d) =>
          (d.templates ?? []).map((t) => ({ ...t, directory: d.name || null })),
        ),
      ];
      result.templates = flat.slice(0, 100).map((t) => ({
        id: t.id,
        name: t.name || t.key,
        directory: t.directory,
        for_channel: t.forChannel ?? undefined,
        type: t.typeName,
        preview: (t.message || t.text || "").slice(0, 80),
      }));
    } catch (error) {
      resourceErrors.templates =
        error instanceof Error ? error.message : t("workspace.common.unknownError");
    }
  }

  if (wantAll || resource === "template_directories") {
    try {
      const dirs = await teletypeRequest("/template-message/directories", {
        decode: decodeTemplateDirectories,
      });
      result.template_directories = (dirs ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        project_id: d.projectId,
      }));
    } catch (error) {
      resourceErrors.template_directories =
        error instanceof Error ? error.message : t("workspace.common.unknownError");
    }
  }

  if (wantAll || resource === "operators") {
    const ops = await loadOperators();
    result.operators = ops.slice(0, 50).map((o) => ({
      id: o.id,
      name: operatorDisplayName(o),
      status_code: o.status,
      status: o.status ? OPERATOR_STATUS[o.status] || "unknown" : "unknown",
    }));
  }

  if (wantAll || resource === "groups") {
    try {
      const grps = await loadGroups();
      result.groups = grps.slice(0, 50).map((g) => ({
        id: g.id,
        name: g.name || g.title || g.id,
        description: g.description,
        operators_count: Array.isArray(g.operatorIds)
          ? g.operatorIds.length
          : Array.isArray(g.operators)
            ? g.operators.length
            : undefined,
        channels_count: Array.isArray(g.channels) ? g.channels.length : undefined,
      }));
    } catch (error) {
      resourceErrors.groups =
        error instanceof Error ? error.message : t("workspace.common.unknownError");
    }
  }

  if (args.group_id) {
    try {
      const query = textArg(args.group_id);
      const resolved = await resolveGroup(query);
      const targetId = resolved.group?.id || query;
      const grp = await teletypeRequest(`/group/view/${encodeURIComponent(targetId)}`, {
        decode: decodeGroupView,
      });
      result.group = {
        id: grp.id,
        name: grp.name,
        description: grp.description,
        color: grp.color,
        operator_ids: grp.operatorIds ?? [],
        supervisor_ids: grp.supervisorIds ?? [],
        channels: grp.channels ?? [],
      };
    } catch (error) {
      resourceErrors.group =
        error instanceof Error ? error.message : t("workspace.common.unknownError");
    }
  }

  return jsonResult({
    ...result,
    resource_errors: resourceErrors,
    hint: t("workspace.listWorkspaceMetadata.useNamesNotIDsWhen"),
  });
}

export async function getProjectStatus(args: ToolArgs<"get_project_status">): Promise<ToolResult> {
  const aspect = (args.aspect as string) || "all";
  const include_warnings = args.include_warnings !== false;
  const operator_details = args.operator_details === true;
  const wantAll = aspect === "all";

  const out: Record<string, unknown> = {};
  const warnings: {
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    message: string;
  }[] = [];

  const tasks: Promise<unknown>[] = [];

  if (wantAll || aspect === "financial") {
    tasks.push(
      Promise.all([
        teletypeRequest("/project/balance", { decode: decodeProjectBalance }).catch(
          (e: unknown) => ({ _error: errorMessage(e) }),
        ),
        teletypeRequest("/project/tariff", { decode: decodeProjectTariff }).catch(
          (error: unknown) => ({ _error: errorMessage(error) }),
        ),
        teletypeRequest("/project/details", { decode: decodeProjectDetails }).catch(
          (error: unknown) => ({
            _error: errorMessage(error),
          }),
        ),
      ]).then(([balance, tariff, details]) => {
        const bAny = balance as Record<string, unknown> & { _error?: string };
        const balanceRub = typeof bAny.balance === "number" ? bAny.balance / 100 : null;
        const paidUntil = bAny.paidUntilDate as string | undefined;
        let daysRemaining: number | null = null;
        if (paidUntil) {
          const diffMs = new Date(paidUntil).getTime() - Date.now();
          daysRemaining = Math.max(0, Math.floor(diffMs / 86_400_000));
        }
        out.financial = {
          balance_rub: balanceRub,
          paid_until: paidUntil,
          days_remaining: daysRemaining,
          trial_days_left: (bAny.promoDaysRemain as number) ?? 0,
          promised_payment_rub:
            typeof bAny.promisedPayment === "number" ? bAny.promisedPayment / 100 : 0,
          project_active: (tariff as { active?: boolean }).active,
          project_paid: (tariff as { paid?: boolean }).paid,
          daily_payment_rub:
            typeof (tariff as { dailyPayment?: number }).dailyPayment === "number"
              ? (tariff as { dailyPayment: number }).dailyPayment / 100
              : null,
          project_name: (details as { name?: string }).name,
        };
        if (bAny._error) {
          warnings.push({
            severity: "medium",
            category: "balance",
            message: t("workspace.getProjectStatus.failedGetBalance", { error: bAny._error }),
          });
        }
        const tariffError = (tariff as { _error?: string })._error;
        if (tariffError) {
          warnings.push({
            severity: "medium",
            category: "tariff",
            message: t("workspace.getProjectStatus.failedGetTariff", { tariffError: tariffError }),
          });
        }
        const detailsError = (details as { _error?: string })._error;
        if (detailsError) {
          warnings.push({
            severity: "low",
            category: "project",
            message: t("workspace.getProjectStatus.failedGetProjectInformation", {
              detailsError: detailsError,
            }),
          });
        }
        if (daysRemaining !== null) {
          if (daysRemaining < 2) {
            warnings.push({
              severity: "high",
              category: "balance",
              message: t("workspace.getProjectStatus.balanceIsEnoughDaysTop", {
                daysRemaining: daysRemaining,
              }),
            });
          } else if (daysRemaining < 7) {
            warnings.push({
              severity: "medium",
              category: "balance",
              message: t("workspace.getProjectStatus.balanceIsEnoughDaysPlan", {
                daysRemaining: daysRemaining,
              }),
            });
          }
        }
      }),
    );
  }

  if (wantAll || aspect === "team") {
    tasks.push(
      loadOperators()
        .then((ops) => {
          const total = ops.length;
          const available = ops.filter((o) => o.status === 20).length;
          const teamData: Record<string, unknown> = {
            operators_total: total,
            operators_available: available,
          };
          if (operator_details) {
            teamData.operators = ops.map((o) => ({
              name: operatorDisplayName(o),
              status_code: o.status,
              status: o.status ? OPERATOR_STATUS[o.status] || "unknown" : "unknown",
            }));
          }
          out.team = teamData;
          if (available === 0 && total > 0) {
            warnings.push({
              severity: "medium",
              category: "team",
              message: t("workspace.getProjectStatus.thereAreNoOperatorsStatus"),
            });
          }
        })
        .catch((e: unknown) => {
          warnings.push({
            severity: "medium",
            category: "team",
            message: t("workspace.getProjectStatus.failedGetListOperators", {
              error: errorMessage(e),
            }),
          });
        }),
    );
  }

  if (wantAll || aspect === "technical") {
    tasks.push(
      Promise.all([
        teletypeRequest("/project/api-status", { decode: decodeProjectApiStatus }).catch(
          (e: unknown) => ({ _error: errorMessage(e) }),
        ),
        loadChannels().catch(() => [] as ChannelItem[]),
      ]).then(([apiStatusRaw, channels]) => {
        const apiStatus = apiStatusRaw as Record<string, unknown> & {
          _error?: string;
          webhookErrorsCount?: number;
        };
        const total = channels.length;
        const issues = channels.filter((c) => !isChannelActive(c));
        out.technical = {
          api_status: apiStatus._error ? "unreachable" : "ok",
          webhook_errors_count: apiStatus.webhookErrorsCount,
          channels_total: total,
          channels_active: total - issues.length,
          channels_with_issues: issues.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.channelType || c.type,
            status: c.status,
            active: c.active,
          })),
        };
        if (apiStatus._error) {
          warnings.push({
            severity: "critical",
            category: "api",
            message: t("workspace.getProjectStatus.teletypePublicAPIUnavailable", {
              error: apiStatus._error,
            }),
          });
        }
        if ((apiStatus.webhookErrorsCount || 0) > 0) {
          warnings.push({
            severity: "medium",
            category: "webhook",
            message: t("workspace.getProjectStatus.webhookErrorsRecorded", {
              webhookErrorsCount: apiStatus.webhookErrorsCount,
            }),
          });
        }
        for (const ch of issues) {
          warnings.push({
            severity: "high",
            category: "channel",
            message: t("workspace.getProjectStatus.channelIsInactiveClientsMay", {
              value1: ch.name || ch.id,
            }),
          });
        }
      }),
    );
  }

  await Promise.all(tasks);

  if (include_warnings) out.warnings = warnings;

  return jsonResult({
    ...out,
    hint: warnings.length
      ? t("workspace.getProjectStatus.projectHasWarningsCheckWarnings")
      : t("workspace.getProjectStatus.noProjectWarningsFound"),
  });
}

export async function manageOperatorGroup(
  args: ToolArgs<"manage_operator_group">,
): Promise<ToolResult> {
  if (!args.confirm) {
    return errorResult(
      t("workspace.manageOperatorGroup.actionGroupOperatorsRequiresExplicit"),
      t("workspace.manageOperatorGroup.specifyConfirmTrueUserConfirms"),
    );
  }

  const action = textArg(args.action);
  const groupQuery = textArg(args.group);
  if (!groupQuery) {
    return errorResult(
      t("workspace.manageOperatorGroup.groupParameterIsRequiredGroup"),
      t("workspace.manageOperatorGroup.groupHint"),
    );
  }

  const resolvedGroup = await resolveGroup(groupQuery);
  if (!resolvedGroup.group) {
    // Fail closed: loadGroups swallows transport errors into an empty list,
    // so an unresolved group must stop the write instead of sending the raw
    // query as an ID.
    return errorResult(
      t("workspace.manageOperatorGroup.groupWasNotUniquelyFound", { groupQuery: groupQuery }),
      groupCandidatesHint(resolvedGroup.candidates),
    );
  }
  const groupId = resolvedGroup.group.id;

  switch (action) {
    case "add_member":
    case "remove_member": {
      const opQuery = textArg(args.operator);
      if (!opQuery) {
        return errorResult(
          t("workspace.removeMember.actionRequiresOperatorParameter", { action: action }),
          t("workspace.removeMember.operatorHint"),
        );
      }
      const resolvedOp = await resolveOperator(opQuery);
      if (!resolvedOp.operator) {
        return errorResult(
          t("workspace.removeMember.operatorWasNotUniquelyFound", { opQuery: opQuery }),
          operatorCandidatesHint(resolvedOp.candidates),
        );
      }
      const endpoint = action === "add_member" ? "add-member" : "remove-member";
      await teletypeRequest(`/group/${endpoint}/${encodeURIComponent(groupId)}`, {
        method: "POST",
        body: { operatorId: resolvedOp.operator.id },
        bodyType: "form",
      });
      return jsonResult({
        success: true,
        action,
        group_id: groupId,
        operator_id: resolvedOp.operator.id,
        operator_name: operatorDisplayName(resolvedOp.operator),
        hint:
          action === "add_member"
            ? t("workspace.removeMember.operatorHasBeenAddedGroup")
            : t("workspace.removeMember.operatorHasBeenRemovedGroup"),
      });
    }

    case "add_channel":
    case "remove_channel": {
      const chQuery = textArg(args.channel);
      if (!chQuery) {
        return errorResult(
          t("workspace.removeChannel.actionRequiresChannelParameter", { action: action }),
          t("workspace.removeChannel.channelHint"),
        );
      }
      const resolvedCh = await resolveChannel(chQuery);
      if (!resolvedCh.channel) {
        return errorResult(
          t("workspace.removeChannel.channelWasNotUniquelyFound", { chQuery: chQuery }),
          channelCandidatesHint(resolvedCh.candidates),
        );
      }
      const endpoint = action === "add_channel" ? "add-channel" : "remove-channel";
      await teletypeRequest(`/group/${endpoint}/${encodeURIComponent(groupId)}`, {
        method: "POST",
        body: { channelId: resolvedCh.channel.id },
        bodyType: "form",
      });
      return jsonResult({
        success: true,
        action,
        group_id: groupId,
        channel_id: resolvedCh.channel.id,
        channel_name: resolvedCh.channel.name,
        hint:
          action === "add_channel"
            ? t("workspace.removeChannel.channelIsLinkedGroup")
            : t("workspace.removeChannel.channelIsUnlinkedGroup"),
      });
    }

    case "set_supervisor": {
      const opQuery = textArg(args.operator);
      if (!opQuery) {
        return errorResult(
          t("workspace.setSupervisor.setSupervisorRequiresOperatorParameter"),
          t("workspace.removeMember.operatorHint"),
        );
      }
      const resolvedOp = await resolveOperator(opQuery);
      if (!resolvedOp.operator) {
        return errorResult(
          t("workspace.removeMember.operatorWasNotUniquelyFound", { opQuery: opQuery }),
          operatorCandidatesHint(resolvedOp.candidates),
        );
      }
      const isSupervisor = args.is_supervisor !== false ? 1 : 0;
      await teletypeRequest(`/group/set-supervisor/${encodeURIComponent(groupId)}`, {
        method: "POST",
        body: { operatorId: resolvedOp.operator.id, isSupervisor },
        bodyType: "form",
      });
      return jsonResult({
        success: true,
        action,
        group_id: groupId,
        operator_id: resolvedOp.operator.id,
        is_supervisor: Boolean(isSupervisor),
        hint: isSupervisor
          ? t("workspace.setSupervisor.supervisorRightsHaveBeenGranted")
          : t("workspace.setSupervisor.supervisorRightsHaveBeenRemoved"),
      });
    }

    case "set_channel_visibility": {
      const chQuery = textArg(args.channel);
      if (!chQuery) {
        return errorResult(
          t("workspace.setChannelVisibility.setChannelVisibilityRequiresChannel"),
          t("workspace.removeChannel.channelHint"),
        );
      }
      const resolvedCh = await resolveChannel(chQuery);
      if (!resolvedCh.channel) {
        return errorResult(
          t("workspace.removeChannel.channelWasNotUniquelyFound", { chQuery: chQuery }),
          channelCandidatesHint(resolvedCh.candidates),
        );
      }
      const canViewOtherDialogs = args.can_view_other_dialogs !== false ? 1 : 0;
      await teletypeRequest(`/group/set-channel-visibility/${encodeURIComponent(groupId)}`, {
        method: "POST",
        body: { channelId: resolvedCh.channel.id, canViewOtherDialogs },
        bodyType: "form",
      });
      return jsonResult({
        success: true,
        action,
        group_id: groupId,
        channel_id: resolvedCh.channel.id,
        can_view_other_dialogs: Boolean(canViewOtherDialogs),
        hint: t("workspace.setChannelVisibility.visibilityOtherOperatorsConversationsChannel"),
      });
    }

    default:
      return errorResult(
        t("workspace.manageOperatorGroup.unknownAction", { action: action }),
        t("workspace.manageOperatorGroup.validActionsAddMemberRemove"),
      );
  }
}

export async function configureProjectWebhook(
  args: ToolArgs<"configure_project_webhook">,
): Promise<ToolResult> {
  if (!args.confirm) {
    return errorResult(
      t("workspace.configureProjectWebhook.settingUpProjectSPublic"),
      t("workspace.manageOperatorGroup.specifyConfirmTrueUserConfirms"),
    );
  }

  const webhookUrl = typeof args.webhook_url === "string" ? args.webhook_url.trim() : "";
  const activeEvents = Array.isArray(args.active_events) ? (args.active_events as string[]) : [];

  const body: Record<string, unknown> = {
    api_webhook: webhookUrl,
    "active_webhooks[]": activeEvents,
  };

  await teletypeRequest("/project/update-public-api", {
    method: "POST",
    body,
    bodyType: "form",
  });

  return jsonResult({
    success: true,
    webhook_url: webhookUrl || null,
    active_events: activeEvents,
    hint: webhookUrl
      ? t("workspace.configureProjectWebhook.webhookIsSetActiveEvents", {
          webhookUrl: webhookUrl,
          activeEventsCount: activeEvents.length,
        })
      : t("workspace.configureProjectWebhook.projectWebhookHasBeenCleared"),
  });
}

export async function getCapabilities(_args: ToolArgs<"get_capabilities">): Promise<ToolResult> {
  const { policy, notes } = inspectToolPolicy();
  const active = TOOL_CATALOG.filter((contract) => policyAllows(policy, contract.name));
  const disabled = TOOL_CATALOG.filter((contract) => !policyAllows(policy, contract.name));

  if (policy.readOnly) {
    notes.push(t("workspace.getCapabilities.readOnlyMode"));
  }
  if (policy.toolsets) {
    notes.push(
      t("workspace.getCapabilities.onlyToolsetsActive", {
        toolsets: policy.toolsets.join(", "),
      }),
    );
  }
  notes.push(t("workspace.getCapabilities.markSeenNeedsConfirm"));

  // Degrade quietly: capabilities are still useful without the project identity.
  const project = await loadProjectDetails().catch(() => undefined);
  const projectDetails =
    project?.name || project?.domain ? { name: project?.name, domain: project?.domain } : undefined;

  return jsonResult({
    read_only: policy.readOnly,
    active_toolsets: policy.toolsets ?? [...TOOLSETS],
    available_toolsets: [...TOOLSETS],
    ...(projectDetails ? { project: projectDetails } : {}),
    locale: parseLocale(process.env.TELETYPE_MCP_LOCALE),
    local_uploads: process.env.ENABLE_LOCAL_UPLOADS === "true",
    tools: active.map((contract) => ({
      name: contract.name,
      title: contract.title,
      toolset: contract.toolset,
      writes_data: contract.writesData,
    })),
    disabled_tools: disabled.map((contract) => contract.name),
    notes,
    hint: t("workspace.getCapabilities.useThisMapBeforeFilters"),
  });
}
