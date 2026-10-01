import type { MessageValue } from "../types.js";

export const evalGraderMessages = {
  "evalGrader.gradeModelCase.expectedRequiredArguments": ({ name }: { name: MessageValue }) =>
    `Expected ${name} with the required arguments.`,
  "evalGrader.gradeModelCase.toolReturnedIsErrorTrue": "The tool returned isError=true.",
  "evalGrader.gradeModelCase.modelCalledWhichThisCase": ({
    forbidden,
  }: {
    forbidden: MessageValue;
  }) => `The model called ${forbidden}, which this case forbids.`,
  "evalGrader.gradeModelCase.unexpectedSuccessfulWrite": ({ name }: { name: MessageValue }) =>
    `Unexpected successful write: ${name}.`,
  "evalGrader.gradeModelCase.answerIsMissingExpectedPhrase": ({
    expectedText,
  }: {
    expectedText: MessageValue;
  }) => `The answer is missing the expected phrase "${expectedText}".`,
  "evalGrader.gradeModelCase.answerDoesNotConfirm": ({ name }: { name: MessageValue }) =>
    `The answer does not confirm "${name}".`,
} as const;
