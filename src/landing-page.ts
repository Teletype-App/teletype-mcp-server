const repository = "https://github.com/Teletype-App/teletype-mcp-server";

const messages = {
  ru: {
    description:
      "Подключите Teletype к Claude, Cursor или Codex. Работайте с переписками и данными клиентов обычными запросами.",
    examplesTitle: "Что можно поручить ассистенту",
    examples: [
      {
        title: "Разобрать очередь",
        prompt: "Найди диалоги без ответа и кратко опиши, что нужно каждому клиенту.",
      },
      {
        title: "Собрать контекст",
        prompt: "Посмотри последние обращения клиента и составь резюме переписки.",
      },
      {
        title: "Подготовить ответ",
        prompt: "Подготовь ответ клиенту. Перед отправкой покажи мне текст.",
      },
    ],
    setupTitle: "Начните с вашего проекта",
    setupDescription: "Нужен проект Teletype с доступом к Public API.",
    setupToken: "Возьмите токен в настройках проекта.",
    setupGuide: "Откройте инструкцию для своего приложения на GitHub.",
    setupConnect: "Добавьте MCP-сервер в приложение и подключите проект по инструкции.",
    support: "Помощь",
    privacy: "Политика конфиденциальности",
    privacyUrl: "https://teletype.app/files/policy.pdf",
    address: "Адрес MCP-сервера",
    copy: "Скопировать",
    copied: "Скопировано",
    copying: "Копирование…",
    copyFallback: "Скопируйте выделенный адрес.",
    connect: "Как подключить",
    website: "Сайт Teletype",
    links: "Подключение и исходный код",
    newTab: " (откроется в новой вкладке)",
    languageChanged: "Язык страницы: русский.",
    guide: `${repository}/blob/main/docs/ru/CLIENTS.md`,
  },
  en: {
    description:
      "Connect Teletype to Claude, Cursor, or Codex. Work with conversations and customer records using everyday requests.",
    examplesTitle: "What you can ask your assistant",
    examples: [
      {
        title: "Triage the inbox",
        prompt: "Find unanswered conversations and summarize what each customer needs.",
      },
      {
        title: "Gather context",
        prompt: "Read the customer’s recent conversations and summarize their history.",
      },
      {
        title: "Draft a reply",
        prompt: "Draft a reply to the customer. Show me the text before sending it.",
      },
    ],
    setupTitle: "Start with your project",
    setupDescription: "You need a Teletype project with Public API access.",
    setupToken: "Get a token from your project settings.",
    setupGuide: "Open the GitHub guide for your app.",
    setupConnect: "Add the MCP server to your app and connect your project using the guide.",
    support: "Support",
    privacy: "Privacy policy",
    privacyUrl: "https://teletype.app/android/policy.html",
    address: "MCP server URL",
    copy: "Copy URL",
    copied: "Copied",
    copying: "Copying…",
    copyFallback: "Copy the selected URL.",
    connect: "How to connect",
    website: "Teletype website",
    links: "Connection guide and source code",
    newTab: " (opens in a new tab)",
    languageChanged: "Page language: English.",
    guide: `${repository}/blob/main/docs/CLIENTS.md`,
  },
} as const;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

export function landingPage(publicBaseUrl: string, locale: "ru" | "en"): string {
  const copy = messages[locale];
  const endpoint = escapeHtml(new URL("/mcp", publicBaseUrl).href);
  const canonical = escapeHtml(new URL("/", publicBaseUrl).href);
  const external = (href: string, label: string, className = "", key?: string) =>
    `<a class="${className}" href="${href}"${href === copy.guide ? ' data-i18n-href="guide"' : href === copy.privacyUrl ? ' data-i18n-href="privacyUrl"' : ""} target="_blank" rel="noopener noreferrer">${key ? `<span data-i18n="${key}">${escapeHtml(label)}</span>` : escapeHtml(label)}<span class="sr-only" data-i18n="newTab">${copy.newTab}</span></a>`;

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Teletype MCP</title>
  <meta name="description" content="${copy.description}">
  <meta property="og:title" content="Teletype MCP">
  <meta property="og:description" content="${copy.description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${escapeHtml(new URL("/assets/icon.png", publicBaseUrl).href)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/landing.css">
  <link rel="preload" href="/assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
  <script src="/assets/landing.js" defer></script>
</head>
<body>
  <div class="page" data-translations="${escapeHtml(JSON.stringify(messages))}">
    <header class="page-header">
      <a class="brand" href="https://teletype.app" target="_blank" rel="noopener noreferrer" aria-label="${copy.website}${copy.newTab}">
        <img src="/assets/logo.svg" width="184" height="42" alt="Teletype App">
      </a>
      <nav class="languages" aria-label="Язык / Language" hidden>
        <button type="button" lang="ru" data-locale="ru" aria-pressed="${locale === "ru"}">Русский</button>
        <button type="button" lang="en" data-locale="en" aria-pressed="${locale === "en"}">English</button>
      </nav>
    </header>
    <span class="sr-only" role="status" id="language-status"></span>
    <main class="landing" aria-labelledby="page-title">
      <h1 id="page-title">Teletype MCP</h1>
      <p class="description" data-i18n="description">${copy.description}</p>
      <div class="connection">
        <label for="mcp-url" data-i18n="address">${copy.address}</label>
        <div class="address">
          <input id="mcp-url" type="text" value="${endpoint}" readonly spellcheck="false" autocapitalize="none">
          <button type="button" id="copy-url" title="${copy.copy}" data-copy="${copy.copy}" data-copied="${copy.copied}" data-copying="${copy.copying}" data-fallback="${copy.copyFallback}" hidden>
            <svg class="copy-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <g class="copy-document"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path></g>
              <path class="copy-check" d="m5 12 4 4L19 6"></path>
            </svg>
            <span class="copy-label">${copy.copy}</span>
          </button>
        </div>
        <span class="sr-only" role="status" id="copy-status"></span>
      </div>
      <nav class="actions" aria-label="${copy.links}">
        ${external(copy.guide, copy.connect, "button", "connect")}
        ${external(repository, "GitHub", "source")}
      </nav>
      <section class="examples" aria-labelledby="examples-title">
        <h2 id="examples-title" data-i18n="examplesTitle">${copy.examplesTitle}</h2>
        <dl>
          ${copy.examples
            .map(
              (example, index) => `<div class="example">
            <dt data-i18n="examples.${index}.title">${example.title}</dt>
            <dd><q data-i18n="examples.${index}.prompt">${example.prompt}</q></dd>
          </div>`,
            )
            .join("")}
        </dl>
      </section>
      <section class="setup" aria-labelledby="setup-title">
        <h2 id="setup-title" data-i18n="setupTitle">${copy.setupTitle}</h2>
        <p data-i18n="setupDescription">${copy.setupDescription}</p>
        <ol>
          <li>${external("https://panel.teletype.app/settings/public-api", copy.setupToken, "", "setupToken")}</li>
          <li>${external(copy.guide, copy.setupGuide, "", "setupGuide")}</li>
          <li data-i18n="setupConnect">${copy.setupConnect}</li>
        </ol>
      </section>
    </main>
    <footer>
      ${external("https://help.teletype.app", copy.support, "", "support")}
      ${external(copy.privacyUrl, copy.privacy, "", "privacy")}
    </footer>
  </div>
</body>
</html>`;
}
