import type { MessageValue } from "../types.js";

export const evalFixtureMessages = {
  "evalFixture.createEvalFixture.thisIsLocalTeletypeTest":
    "Это локальный тестовый проект Teletype. Все инструменты работают с имитацией API. Для проверки вызови eval_list_cases, затем eval_start_case с выбранным case_id. Выполни полученное задание инструментами Teletype и передай итоговый ответ в eval_grade_case. Покажи пользователю оценку и проваленные проверки. Выполняй по одному заданию за раз.",
  "evalFixture.createEvalFixture.listEvaluationCasesLocalTeletype":
    "Список проверочных задач на тестовых данных Teletype.",
  "evalFixture.createEvalFixture.selectCaseEvalStartCase": "Выберите задачу через eval_start_case.",
  "evalFixture.createEvalFixture.startCaseAndClearCall":
    "Начать проверочную задачу и очистить историю вызовов на тестовом проекте.",
  "evalFixture.createEvalFixture.unknownCase": ({ caseId }: { caseId: MessageValue }) =>
    `Неизвестная задача '${caseId}'.`,
  "evalFixture.createEvalFixture.gradeToolCallsAndFinal":
    "Проверить вызовы инструментов и ответ после выполнения текущей задачи.",
  "evalFixture.createEvalFixture.callEvalStartCaseFirst": "Сначала вызовите eval_start_case.",
} as const;
