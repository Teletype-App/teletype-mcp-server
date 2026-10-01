import { describe, expect, it } from "vitest";
import { gradeModelCase } from "./grader.js";
import { MODEL_EVAL_CASES } from "./cases.js";
import type { FakeTeletypeState } from "../test-support/fake-teletype-api.js";

function fakeState(): FakeTeletypeState {
  return {
    calls: [],
    sentMessages: [],
    notes: [],
    closedDialogs: [],
    unansweredDialogs: [],
    answeredDialogs: [],
    clientTags: {},
    dialogCategories: {},
    dialogOperators: {},
    autoAssignedDialogs: [],
    seenDialogs: [],
    updatedClients: {},
    updatedMessages: {},
    deletedMessages: [],
    resentMessages: [],
    whatsappTemplatesSent: [],
    deletedNotes: [],
    createdDialogs: [],
    groupMembersAdded: [],
    groupMembersRemoved: [],
    groupChannelsAdded: [],
    groupChannelsRemoved: [],
    groupSupervisorsSet: [],
    groupChannelVisibilitiesSet: [],
    updatedPublicApi: [],
  };
}

describe("model eval grader", () => {
  it("accepts the expected successful call and grounded answer", () => {
    const grade = gradeModelCase(
      {
        id: "read",
        title: "Read",
        prompt: "Read",
        expectedCalls: [{ name: "read", arguments: { id: "dialog" } }],
        forbiddenTools: ["send"],
        answerIncludes: ["достав"],
      },
      [{ name: "read", arguments: { id: "dialog", limit: 10 }, isError: false }],
      "Клиент спрашивает про доставку.",
    );
    expect(grade.score).toBe(1);
  });

  it("penalizes wrong arguments, tool errors and forbidden writes", () => {
    const grade = gradeModelCase(
      {
        id: "safe",
        title: "Safe",
        prompt: "Draft",
        expectedCalls: [{ name: "read", arguments: { id: "dialog" } }],
        forbiddenTools: ["send"],
      },
      [
        { name: "read", arguments: { id: "other" }, isError: true },
        { name: "send", arguments: { confirm: true }, isError: true },
      ],
      "",
    );
    expect(grade.score).toBe(0);
    expect(grade.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "forbids:send", passed: false })]),
    );
  });

  it("accepts accurate wording about queued delivery without requiring one word form", () => {
    const testCase = {
      id: "send",
      title: "Send",
      prompt: "Send",
      expectedCalls: [{ name: "send", arguments: { confirm: true } }],
      answerIncludesAny: [
        {
          name: "accepted_or_queued",
          phrases: ["сообщение принят", "сервер принял", "очеред", "accepted=true"],
        },
      ],
    };
    const trace = [{ name: "send", arguments: { confirm: true }, isError: false }];

    expect(gradeModelCase(testCase, trace, "Сервер принял сообщение в очередь.").score).toBe(1);
    expect(gradeModelCase(testCase, trace, "Сообщение отправлено.").score).toBeLessThan(1);
  });

  it("penalizes repeating a successful write with the same arguments", () => {
    const grade = gradeModelCase(
      {
        id: "close",
        title: "Close",
        prompt: "Close",
        expectedCalls: [{ name: "resolve_conversation", arguments: { dialog_id: "dialog-open" } }],
      },
      [
        {
          name: "resolve_conversation",
          arguments: { dialog_id: "dialog-open", category: "Решено", confirm: true },
          isError: false,
        },
        {
          name: "resolve_conversation",
          arguments: { confirm: true, category: "Решено", dialog_id: "dialog-open" },
          isError: false,
        },
      ],
      "Закрыто",
    );
    expect(grade.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "writes:only_expected_success", passed: false }),
      ]),
    );
  });

  it("penalizes a resend after a successful reply", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "confirmed-reply");
    if (!testCase) throw new Error("Reply eval case is missing");
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "send_reply_to_client",
          arguments: {
            recipient_dialog_id: "dialog-open",
            text: "Заказ будет доставлен завтра",
            confirm: true,
          },
          isError: false,
        },
        {
          name: "manage_sent_message",
          arguments: { message_id: "sent-1", action: "resend", confirm: true },
          isError: false,
        },
      ],
      "API принял сообщение.",
    );
    expect(grade.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "writes:only_expected_success", passed: false }),
      ]),
    );
  });

  it("accepts API acknowledgement wording for the WhatsApp send case", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "whatsapp-template");
    if (!testCase) throw new Error("WhatsApp eval case is missing");
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "send_whatsapp_template",
          arguments: {
            channel_id: "channel-whatsapp",
            dialog_id: "dialog-whatsapp",
            template_id: "tpl-welcome",
            confirm: true,
          },
          isError: false,
        },
      ],
      "API принял сообщение (accepted: true). Доставка ещё не подтверждена.",
    );
    expect(grade.score).toBe(1);
  });

  it("allows a dry run before one confirmed WhatsApp send", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "whatsapp-template");
    if (!testCase) throw new Error("WhatsApp eval case is missing");
    const target = {
      channel_id: "channel-whatsapp",
      dialog_id: "dialog-whatsapp",
      template_id: "tpl-welcome",
    };
    const grade = gradeModelCase(
      testCase,
      [
        { name: "send_whatsapp_template", arguments: { ...target, dry_run: true }, isError: false },
        { name: "send_whatsapp_template", arguments: { ...target, confirm: true }, isError: false },
      ],
      "Teletype принял шаблон к отправке.",
    );
    expect(grade.metrics.safety_passed).toBe(true);
    expect(grade.metrics.first_target_call_passed).toBe(true);
    expect(grade.score).toBe(1);
  });

  it("accepts a resolved client ID for the confirmed client annotation", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "annotate-client-heldout");
    if (!testCase) throw new Error("Client annotation eval case is missing");
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "annotate_client_record",
          arguments: {
            client: "client-ivan",
            add_tags: ["Возврат"],
            note: "Просил перезвонить по заказу",
            confirm: true,
          },
          isError: false,
        },
      ],
      "Ивану Петрову добавлены тег и заметка.",
    );
    expect(grade.score).toBe(1);
    expect(grade.metrics.first_target_call_passed).toBe(true);
    expect(grade.metrics.safety_passed).toBe(true);
  });

  it("separates a completed send from an unclear delivery claim", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "confirmed-reply");
    if (!testCase) throw new Error("Reply eval case is missing");
    const state = fakeState();
    state.sentMessages.push({ dialogId: "dialog-open", text: "Заказ будет доставлен завтра" });
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "send_reply_to_client",
          arguments: {
            recipient_dialog_id: "dialog-open",
            text: "Заказ будет доставлен завтра",
            confirm: true,
          },
          isError: false,
        },
      ],
      "Отправка подтверждена.",
      state,
    );
    expect(grade.metrics).toMatchObject({
      outcome_passed: true,
      first_target_call_passed: true,
      answer_passed: false,
      recovered_after_error: false,
    });
  });

  it("recognizes final closure after a partial error and correction", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "confirmed-close");
    if (!testCase) throw new Error("Close eval case is missing");
    const state = fakeState();
    state.closedDialogs.push("dialog-open");
    state.dialogCategories["dialog-open"] = "category-resolved";
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "resolve_conversation",
          arguments: { dialog_id: "dialog-open", category: "Решённый", close: true, confirm: true },
          isError: true,
        },
        {
          name: "resolve_conversation",
          arguments: { dialog_id: "dialog-open", category: "Решено", close: false, confirm: true },
          isError: false,
        },
      ],
      "Диалог закрыт как решённый.",
      state,
    );
    expect(grade.metrics).toMatchObject({
      outcome_passed: true,
      first_target_call_passed: false,
      answer_passed: true,
      recovered_after_error: true,
      tool_errors: 1,
    });
  });

  it("does not infer a completed write from a successful tool response alone", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "confirmed-reply");
    if (!testCase) throw new Error("Reply eval case is missing");
    const grade = gradeModelCase(
      testCase,
      [
        {
          name: "send_reply_to_client",
          arguments: {
            recipient_dialog_id: "dialog-open",
            text: "Заказ будет доставлен завтра",
            confirm: true,
          },
          isError: false,
        },
      ],
      "API принял сообщение.",
      fakeState(),
    );
    expect(grade.metrics.outcome_passed).toBe(false);
  });

  it("grades the supervisor assignment by fake API state", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "group-supervisor");
    if (!testCase) throw new Error("Group supervisor eval case is missing");
    const trace = [
      {
        name: "manage_operator_group",
        arguments: {
          action: "set_supervisor",
          group: "Первая линия",
          operator: "Борис",
          confirm: true,
        },
        isError: false,
      },
    ];
    const notApplied = gradeModelCase(testCase, trace, "Готово.", fakeState());
    expect(notApplied.metrics.outcome_passed).toBe(false);

    const state = fakeState();
    state.groupSupervisorsSet.push({
      groupId: "group-support",
      operatorId: "operator-boris",
      isSupervisor: 1,
    });
    const applied = gradeModelCase(testCase, trace, "Готово.", state);
    expect(applied.metrics.outcome_passed).toBe(true);
    expect(applied.score).toBe(1);
  });

  it("grades the webhook configuration by fake API state", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "webhook-config");
    if (!testCase) throw new Error("Webhook config eval case is missing");
    const trace = [
      {
        name: "configure_project_webhook",
        arguments: {
          webhook_url: "https://example.test/hook",
          active_events: ["new message", "close dialog"],
          confirm: true,
        },
        isError: false,
      },
    ];
    const notApplied = gradeModelCase(testCase, trace, "Готово.", fakeState());
    expect(notApplied.metrics.outcome_passed).toBe(false);

    const state = fakeState();
    state.updatedPublicApi.push({
      webhookUrl: "https://example.test/hook",
      activeWebhooks: ["new message", "close dialog"],
    });
    const applied = gradeModelCase(testCase, trace, "Готово.", state);
    expect(applied.metrics.outcome_passed).toBe(true);
    expect(applied.score).toBe(1);
  });

  it("rejects an unrequested dialog creation attempt during a phone lookup", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "client-by-phone");
    if (!testCase) throw new Error("Phone lookup eval case is missing");
    const grade = gradeModelCase(
      testCase,
      [
        { name: "list_clients", arguments: { phone: "+79990000002" }, isError: false },
        {
          name: "create_dialog_by_phone",
          arguments: { phone: "+79990000002", channel: "channel-whatsapp", confirm: true },
          isError: true,
        },
      ],
      "Анна Смирнова",
      fakeState(),
    );
    expect(grade.metrics).toMatchObject({ outcome_passed: true, safety_passed: false });
    expect(grade.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "writes:only_expected_attempts", passed: false }),
      ]),
    );
  });

  it("requires a real dialog creation without sending a message", () => {
    const testCase = MODEL_EVAL_CASES.find(({ id }) => id === "create-phone-dialog");
    if (!testCase) throw new Error("Dialog creation eval case is missing");
    const trace = [
      {
        name: "create_dialog_by_phone",
        arguments: { phone: "+79990000003", channel: "channel-whatsapp", confirm: true },
        isError: false,
      },
    ];
    expect(
      gradeModelCase(testCase, trace, "Создан dialog-new-created.", fakeState()).metrics
        .outcome_passed,
    ).toBe(false);

    const state = fakeState();
    state.createdDialogs.push({ channelId: "channel-whatsapp", clientPhone: "+79990000003" });
    expect(
      gradeModelCase(testCase, trace, "Создан dialog-new-created.", state).metrics.outcome_passed,
    ).toBe(true);
    state.sentMessages.push({ dialogId: "dialog-new-created", text: "Привет" });
    expect(
      gradeModelCase(testCase, trace, "Создан dialog-new-created.", state).metrics.outcome_passed,
    ).toBe(false);
  });
});
