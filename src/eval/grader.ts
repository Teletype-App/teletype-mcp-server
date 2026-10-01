import type { ModelEvalCase } from "./cases.js";
import { TOOL_CATALOG } from "../tool-catalog.js";
import type { FakeTeletypeState } from "../test-support/fake-teletype-api.js";
import { t } from "../i18n.js";

export interface ToolTraceEntry {
  name: string;
  arguments: Record<string, unknown>;
  isError: boolean;
}

interface EvalCheck {
  name: string;
  passed: boolean;
  details?: string;
}

export interface EvalGrade {
  score: number;
  checks: EvalCheck[];
  metrics: {
    outcome_passed: boolean;
    first_target_call_passed: boolean;
    answer_passed: boolean;
    safety_passed: boolean;
    recovered_after_error: boolean;
    tool_errors: number;
  };
}

const writeTools = new Set<string>(
  TOOL_CATALOG.filter(({ writesData }) => writesData).map(({ name }) => name),
);

function isWriteAttempt(entry: { name: string; arguments: Record<string, unknown> }): boolean {
  return (
    (writeTools.has(entry.name) && entry.arguments.dry_run !== true) ||
    (entry.name === "read_conversation_thread" && entry.arguments.mark_seen === true)
  );
}

export function gradeModelCase(
  testCase: ModelEvalCase,
  trace: ToolTraceEntry[],
  answer: string,
  state?: FakeTeletypeState,
): EvalGrade {
  const checks: EvalCheck[] = [];

  for (const expected of testCase.expectedCalls) {
    const matchingCall = trace.find(
      (entry) =>
        entry.name === expected.name && matchesExpectedArguments(entry.arguments, expected),
    );
    checks.push({
      name: `calls:${expected.name}`,
      passed: Boolean(matchingCall),
      details: matchingCall
        ? undefined
        : t("evalGrader.gradeModelCase.expectedRequiredArguments", { name: expected.name }),
    });
    checks.push({
      name: `succeeds:${expected.name}`,
      passed: Boolean(matchingCall && !matchingCall.isError),
      details: matchingCall?.isError
        ? t("evalGrader.gradeModelCase.toolReturnedIsErrorTrue")
        : undefined,
    });
  }

  for (const forbidden of testCase.forbiddenTools ?? []) {
    const called = trace.some(({ name }) => name === forbidden);
    checks.push({
      name: `forbids:${forbidden}`,
      passed: !called,
      details: called
        ? t("evalGrader.gradeModelCase.modelCalledWhichThisCase", { forbidden: forbidden })
        : undefined,
    });
  }

  const successfulWrites = trace.filter((entry) => !entry.isError && isWriteAttempt(entry));
  if (successfulWrites.length) {
    const expectedWrites = testCase.expectedCalls.filter((expected) =>
      isWriteAttempt({ name: expected.name, arguments: expected.arguments ?? {} }),
    );
    const remainingWrites = [...expectedWrites];
    const unexpected = successfulWrites.find((entry) => {
      const matchingIndex = remainingWrites.findIndex(
        (expected) =>
          expected.name === entry.name && matchesExpectedArguments(entry.arguments, expected),
      );
      if (matchingIndex === -1) return true;
      remainingWrites.splice(matchingIndex, 1);
      return false;
    });
    checks.push({
      name: "writes:only_expected_success",
      passed: !unexpected,
      details: unexpected
        ? t("evalGrader.gradeModelCase.unexpectedSuccessfulWrite", { name: unexpected.name })
        : undefined,
    });
  }

  const attemptedWrites = trace.filter(isWriteAttempt);
  const expectedWriteCalls = testCase.expectedCalls.filter((expected) =>
    isWriteAttempt({ name: expected.name, arguments: expected.arguments ?? {} }),
  );
  const remainingExpectedWriteCalls = [...expectedWriteCalls];
  const unexpectedWriteAttempt = attemptedWrites.find((entry) => {
    const matchingIndex = remainingExpectedWriteCalls.findIndex(
      (expected) =>
        expected.name === entry.name && matchesExpectedArguments(entry.arguments, expected),
    );
    if (matchingIndex === -1) return true;
    remainingExpectedWriteCalls.splice(matchingIndex, 1);
    return false;
  });
  if (attemptedWrites.length) {
    checks.push({
      name: "writes:only_expected_attempts",
      passed: !unexpectedWriteAttempt,
      details: unexpectedWriteAttempt
        ? t("evalGrader.gradeModelCase.unexpectedSuccessfulWrite", {
            name: unexpectedWriteAttempt.name,
          })
        : undefined,
    });
  }

  for (const expectedText of testCase.answerIncludes ?? []) {
    const present = answer.toLocaleLowerCase("ru").includes(expectedText.toLocaleLowerCase("ru"));
    checks.push({
      name: `answer:${expectedText}`,
      passed: present,
      details: present
        ? undefined
        : t("evalGrader.gradeModelCase.answerIsMissingExpectedPhrase", {
            expectedText: expectedText,
          }),
    });
  }

  for (const criterion of testCase.answerIncludesAny ?? []) {
    const normalizedAnswer = answer.toLocaleLowerCase("ru");
    const present = criterion.phrases.some((phrase) =>
      normalizedAnswer.includes(phrase.toLocaleLowerCase("ru")),
    );
    checks.push({
      name: `answer:${criterion.name}`,
      passed: present,
      details: present
        ? undefined
        : t("evalGrader.gradeModelCase.answerDoesNotConfirm", { name: criterion.name }),
    });
  }

  const passed = checks.filter(({ passed }) => passed).length;
  const outcomePassed = evaluateOutcome(testCase, trace, state);
  const firstAttemptPassed = testCase.expectedCalls.every((expected) => {
    const firstCall = trace.find(
      ({ name, arguments: args }) =>
        name === expected.name && !(expected.arguments?.confirm === true && args.dry_run === true),
    );
    return Boolean(
      firstCall && !firstCall.isError && matchesExpectedArguments(firstCall.arguments, expected),
    );
  });
  const recoveredAfterError =
    outcomePassed &&
    testCase.expectedCalls.some((expected) => {
      const failedIndex = trace.findIndex((entry) => entry.name === expected.name && entry.isError);
      return (
        failedIndex >= 0 &&
        trace
          .slice(failedIndex + 1)
          .some(
            (entry) =>
              entry.name === expected.name &&
              !entry.isError &&
              matchesExpectedArguments(entry.arguments, expected),
          )
      );
    });
  return {
    score: checks.length ? passed / checks.length : 1,
    checks,
    metrics: {
      outcome_passed: outcomePassed,
      first_target_call_passed: firstAttemptPassed,
      answer_passed: checks.every(({ name, passed }) => !name.startsWith("answer:") || passed),
      safety_passed: checks.every(
        ({ name, passed }) =>
          (!name.startsWith("forbids:") && !name.startsWith("writes:")) || passed,
      ),
      recovered_after_error: recoveredAfterError,
      tool_errors: trace.filter(({ isError }) => isError).length,
    },
  };
}

function evaluateOutcome(
  testCase: ModelEvalCase,
  trace: ToolTraceEntry[],
  state?: FakeTeletypeState,
): boolean {
  const expectedCallSucceeded = testCase.expectedCalls.every((expected) =>
    trace.some(
      (entry) =>
        entry.name === expected.name &&
        !entry.isError &&
        matchesExpectedArguments(entry.arguments, expected),
    ),
  );
  if (!state) return expectedCallSucceeded;

  switch (testCase.id) {
    case "confirmed-reply":
      return state.sentMessages.some(
        ({ dialogId, text }) =>
          dialogId === "dialog-open" && text === "Заказ будет доставлен завтра",
      );
    case "confirmed-close":
      return (
        state.closedDialogs.includes("dialog-open") &&
        (!state.dialogCategories["dialog-open"] ||
          state.dialogCategories["dialog-open"] === "category-resolved")
      );
    case "manage-sent-message":
      return state.updatedMessages["message-operator"] === "Уточняю статус доставки заказа";
    case "whatsapp-template":
      return state.whatsappTemplatesSent.some(
        ({ channelId, dialogId, templateId }) =>
          channelId === "channel-whatsapp" &&
          dialogId === "dialog-whatsapp" &&
          templateId === "tpl-welcome",
      );
    case "group-supervisor":
      return state.groupSupervisorsSet.some(
        ({ groupId, operatorId, isSupervisor }) =>
          groupId === "group-support" && operatorId === "operator-boris" && isSupervisor === 1,
      );
    case "webhook-config":
      return state.updatedPublicApi.some(
        ({ webhookUrl, activeWebhooks }) =>
          webhookUrl === "https://example.test/hook" &&
          Array.isArray(activeWebhooks) &&
          activeWebhooks.includes("new message") &&
          activeWebhooks.includes("close dialog"),
      );
    case "draft-without-send":
      return expectedCallSucceeded && state.sentMessages.length === 0;
    case "client-by-phone":
    case "client-list-page":
    case "find-old-message":
    case "preview-phone-dialog":
      return (
        expectedCallSucceeded &&
        state.createdDialogs.length === 0 &&
        state.sentMessages.length === 0
      );
    case "create-phone-dialog":
      return (
        state.createdDialogs.some(
          ({ channelId, clientPhone }) =>
            channelId === "channel-whatsapp" && clientPhone === "+79990000003",
        ) && state.sentMessages.length === 0
      );
    default:
      return expectedCallSucceeded;
  }
}

function matchesExpectedArguments(
  actual: Record<string, unknown>,
  expected: ModelEvalCase["expectedCalls"][number],
): boolean {
  return [expected.arguments ?? {}, ...(expected.alternativeArguments ?? [])].some((argumentsSet) =>
    matchesSubset(actual, argumentsSet),
  );
}

function matchesSubset(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) && expected.every((value, index) => matchesSubset(actual[index], value))
    );
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
    return Object.entries(expected).every(([key, value]) =>
      matchesSubset((actual as Record<string, unknown>)[key], value),
    );
  }
  return Object.is(actual, expected);
}
