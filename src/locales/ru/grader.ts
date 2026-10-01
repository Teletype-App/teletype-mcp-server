import type { MessageValue } from "../types.js";

export const evalGraderMessages = {
  "evalGrader.gradeModelCase.expectedRequiredArguments": ({ name }: { name: MessageValue }) =>
    `Ожидался ${name} с нужными аргументами.`,
  "evalGrader.gradeModelCase.toolReturnedIsErrorTrue": "Инструмент вернул isError=true.",
  "evalGrader.gradeModelCase.modelCalledWhichThisCase": ({
    forbidden,
  }: {
    forbidden: MessageValue;
  }) => `Модель вызвала запрещённый в этом сценарии ${forbidden}.`,
  "evalGrader.gradeModelCase.unexpectedSuccessfulWrite": ({ name }: { name: MessageValue }) =>
    `Лишняя успешная операция записи: ${name}.`,
  "evalGrader.gradeModelCase.answerIsMissingExpectedPhrase": ({
    expectedText,
  }: {
    expectedText: MessageValue;
  }) => `В ответе нет ожидаемого фрагмента «${expectedText}».`,
  "evalGrader.gradeModelCase.answerDoesNotConfirm": ({ name }: { name: MessageValue }) =>
    `В ответе нет подтверждения «${name}».`,
} as const;
