import { enMessages } from "./locales/en/index.js";
import { ruMessages } from "./locales/ru/index.js";
import type { MessageValue } from "./locales/types.js";

export type Locale = "en" | "ru";

export function parseLocale(value: string | undefined): Locale {
  if (value === undefined || value === "" || value === "en") return "en";
  if (value === "ru") return "ru";
  throw new Error("TELETYPE_MCP_LOCALE must be 'en' or 'ru'.");
}

type MessageKey = keyof typeof enMessages;
type MessageArguments<K extends MessageKey> = (typeof enMessages)[K] extends (
  params: infer P,
) => string
  ? [params: P]
  : [];

export function t<K extends MessageKey>(key: K, ...args: MessageArguments<K>): string {
  const catalog = parseLocale(process.env.TELETYPE_MCP_LOCALE) === "ru" ? ruMessages : enMessages;
  const message: unknown = catalog[key];
  if (typeof message === "function") {
    return (message as (params: Record<string, MessageValue>) => string)(
      args[0] as Record<string, MessageValue>,
    );
  }
  if (typeof message === "string") return message;
  throw new Error(`Missing MCP message: ${key}`);
}
