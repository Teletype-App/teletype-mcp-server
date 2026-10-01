import type { MessageValue } from "../types.js";

export const evalFixtureMessages = {
  "evalFixture.createEvalFixture.thisIsLocalTeletypeTest":
    "This is a local Teletype test project. All tools use a fake API. Run eval_list_cases, then eval_start_case with a case_id. Complete the task with Teletype tools and pass your final answer to eval_grade_case. Show the score and failed checks. Run one case at a time.",
  "evalFixture.createEvalFixture.listEvaluationCasesLocalTeletype":
    "List evaluation cases for the local Teletype test project.",
  "evalFixture.createEvalFixture.selectCaseEvalStartCase": "Select a case with eval_start_case.",
  "evalFixture.createEvalFixture.startCaseAndClearCall":
    "Start a case and clear the call trace in the test project.",
  "evalFixture.createEvalFixture.unknownCase": ({ caseId }: { caseId: MessageValue }) =>
    `Unknown case '${caseId}'.`,
  "evalFixture.createEvalFixture.gradeToolCallsAndFinal":
    "Grade tool calls and the final answer for the current case.",
  "evalFixture.createEvalFixture.callEvalStartCaseFirst": "Call eval_start_case first.",
} as const;
