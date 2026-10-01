import type { MessageValue } from "../types.js";

export const helpersMessages = {
  "helpers.errorResult.hint": ({
    message,
    hint,
  }: {
    message: MessageValue;
    hint: MessageValue;
  }) => `${message}

Hint: ${hint}`,
} as const;
