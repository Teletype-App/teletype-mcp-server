const externalLinkIcon = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4 10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg>`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

const messages = {
  en: {
    title: "Connect Teletype",
    clientDefault: "MCP client",
    website: "Teletype website (opens in a new tab)",
    requester: "wants to connect to your Teletype project.",
    destination: "After connecting, you’ll return to",
    access: "The app can read conversations and customer profiles.",
    tokenLabel: "Project token",
    tokenPlaceholder: "Paste your Public API token",
    tokenHint: "Copy the token from your project’s Public API settings.",
    tokenHelp: "Where to get a token",
    permission:
      "Also allow the app to send messages and edit customer records and project settings",
    lifetimeOffline:
      "Access renews automatically. Disconnect Teletype in the app to revoke access.",
    lifetime: "This connection lasts up to one hour.",
    connect: "Connect project",
    cancel: "Cancel",
    helpNavigation: "Help and privacy",
    support: "Support",
    privacy: "Privacy policy",
    privacyUrl: "https://teletype.app/android/policy.html",
    newTab: " (opens in a new tab)",
    languageChanged: "Page language: English.",
  },
  ru: {
    title: "Подключить Teletype",
    clientDefault: "MCP-клиент",
    website: "Сайт Teletype (откроется в новой вкладке)",
    requester: "хочет подключиться к вашему проекту Teletype.",
    destination: "После подключения вы вернётесь на",
    access: "Приложение сможет читать переписки и данные клиентов.",
    tokenLabel: "Токен проекта",
    tokenPlaceholder: "Вставьте токен Public API",
    tokenHint: "Скопируйте токен из настроек Public API вашего проекта.",
    tokenHelp: "Где взять токен",
    permission: "Также разрешить отправлять сообщения, менять данные клиентов и настройки проекта",
    lifetimeOffline:
      "Доступ продлевается автоматически. Чтобы отозвать его, отключите Teletype в приложении.",
    lifetime: "Подключение действует до часа.",
    connect: "Подключить проект",
    cancel: "Отмена",
    helpNavigation: "Помощь и конфиденциальность",
    support: "Помощь",
    privacy: "Политика конфиденциальности",
    privacyUrl: "https://teletype.app/files/policy.pdf",
    newTab: " (откроется в новой вкладке)",
    languageChanged: "Язык страницы: русский.",
  },
} as const;

const styles = `
@font-face {
  font-family: Manrope;
  src: url('/oauth/assets/fonts/manrope.woff2') format('woff2');
  font-weight: 200 800;
  font-style: normal;
  font-display: swap;
}
:root {
  color-scheme: light;
  --surface: #fff;
  --background: #f8f8f8;
  --ink: #1c1c1c;
  --muted: #555;
  --line: #d8d8d8;
  --blue: #006de5;
  --blue-hover: #005fc9;
  --focus: #0079ff;
  font-family: Manrope, sans-serif;
  color: var(--ink);
  background: var(--background);
  font-synthesis: none;
}
* { box-sizing: border-box; }
body { margin: 0; font-size: 15px; line-height: 1.6; }
::selection { color: var(--ink); background: #dcecff; }
button, input { font: inherit; }
button, a, input { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
.page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 24px;
}
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 520px; margin-bottom: 24px; }
.brand { display: inline-flex; align-items: center; min-height: 44px; }
.brand img { display: block; width: 184px; height: 42px; }
.languages { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--line); border-radius: 10px; }
.languages button { min-height: 44px; padding: 8px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.languages button:hover { color: var(--ink); background: #eee; }
.languages button[aria-pressed="true"] { color: var(--blue-hover); background: var(--surface); font-weight: 700; box-shadow: 0 1px 4px rgb(0 0 0 / 8%); }
.languages button:disabled { cursor: default; }
.consent {
  width: 100%;
  max-width: 520px;
  padding: 36px 40px;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgb(0 0 0 / 6%);
}
h1 { font-size: 28px; font-weight: 750; letter-spacing: -.035em; line-height: 1.25; margin: 0 0 14px; }
p { margin: 0; overflow-wrap: anywhere; }
strong { font-weight: 700; }
.requester { margin-bottom: 6px; }
.destination { color: var(--muted); font-size: 13px; margin-bottom: 24px; }
.access { margin-bottom: 24px; }
.token-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0 12px; margin-bottom: 8px; }
.token-label { font-size: 14px; font-weight: 700; }
.token-help { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; color: var(--blue-hover); font-size: 13px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.token-help:hover { color: #004ca3; }
.token-help svg { flex: 0 0 14px; }
.token-input {
  display: block;
  width: 100%;
  min-height: 50px;
  font-size: 16px;
  padding: 12px 14px;
  border: 1px solid #a8a8a8;
  border-radius: 8px;
  color: var(--ink);
  background: var(--surface);
  caret-color: var(--blue);
  transition: border-color 160ms ease-out;
}
.token-input::placeholder { color: #666; opacity: 1; }
.token-input:hover { border-color: #777; }
.token-input:focus-visible { border-color: var(--blue); outline-offset: 3px; }
.token-input:user-invalid { border-color: #b42318; }
.token-hint { color: var(--muted); font-size: 13px; line-height: 1.65; margin-top: 8px; }
.permission {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 0;
  margin-top: 24px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  font-size: 14px;
  line-height: 1.65;
}
.permission input { width: 19px; height: 19px; flex: 0 0 19px; margin: 2px 0 0; accent-color: var(--blue); cursor: pointer; }
.lifetime { font-size: 13px; color: var(--muted); line-height: 1.65; margin-top: 20px; }
.actions { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 28px; }
.button {
  min-height: 48px;
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: background-color 160ms ease-out, color 160ms ease-out;
}
.button-primary { background: var(--blue); color: #fff; }
.button-primary:hover { background: var(--blue-hover); }
.button-primary:active { background: #0052b0; }
.button-secondary { background: transparent; color: var(--muted); }
.button-secondary:hover { background: #f3f3f3; color: var(--ink); }
.button-secondary:active { background: #eaeaea; }
.button:disabled { background: #eaeaea; color: #666; cursor: not-allowed; }
.links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 24px; margin-top: 16px; }
.links a { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--muted); font-size: 13px; text-decoration: none; text-underline-offset: 4px; }
.links a:hover { color: var(--blue-hover); text-decoration: underline; }
.links svg { flex: 0 0 14px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 560px) {
  body { font-size: 16px; }
  .page { justify-content: flex-start; padding: 24px 16px 16px; }
  .page-header { margin-bottom: 20px; gap: 8px; }
  .consent { padding: 28px 24px; border-radius: 12px; }
  .permission { font-size: 15px; }
  h1 { font-size: 26px; }
}
@media (max-width: 380px) {
  .page-header { flex-direction: column; gap: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }
}
`;

export function consentPage(
  clientName: string,
  destination: string,
  id: string,
  scopes: string[],
  locale: "ru" | "en" = "en",
): string {
  const copy = messages[locale];
  const text = (key: keyof typeof copy) =>
    `<span data-i18n="${key}">${escapeHtml(copy[key])}</span>`;
  const lifetime = scopes.includes("offline_access") ? "lifetimeOffline" : "lifetime";
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title data-i18n="title">${copy.title}</title>
  <link rel="icon" href="/oauth/assets/icon.svg" type="image/svg+xml">
  <style>${styles}</style>
  <script src="/oauth/assets/consent.js" defer></script>
</head>
<body>
  <div class="page" data-messages="${escapeHtml(JSON.stringify(messages))}">
    <header class="page-header">
      <a class="brand" href="https://teletype.app" target="_blank" rel="noopener noreferrer" data-i18n-label="website" aria-label="${escapeHtml(copy.website)}">
        <img src="/oauth/assets/logo.svg" width="184" height="42" alt="Teletype App">
      </a>
      <div class="languages" role="group" aria-label="Язык / Language">
        <button type="button" lang="ru" data-locale="ru" aria-pressed="${locale === "ru"}" disabled>Русский</button>
        <button type="button" lang="en" data-locale="en" aria-pressed="${locale === "en"}" disabled>English</button>
      </div>
      <span class="sr-only" role="status" id="language-status"></span>
    </header>
    <main class="consent" aria-labelledby="connection-title">
      <h1 id="connection-title" data-i18n="title">${copy.title}</h1>
      <p class="requester"><strong>${clientName ? escapeHtml(clientName) : text("clientDefault")}</strong> ${text("requester")}</p>
      <p class="destination">${text("destination")} ${escapeHtml(destination)}</p>
      <p class="access">${text("access")}</p>
      <form action="/oauth/consent" method="post">
        <input type="hidden" name="request_id" value="${escapeHtml(id)}">
        <div class="token-heading">
          <label class="token-label" for="api-token">${text("tokenLabel")}</label>
          <a class="token-help" href="https://panel.teletype.app/settings/public-api" target="_blank" rel="noopener noreferrer">${text("tokenHelp")} ${externalLinkIcon}<span class="sr-only" data-i18n="newTab">${copy.newTab}</span></a>
        </div>
        <input class="token-input" id="api-token" name="api_token" type="password" required maxlength="2048" autocomplete="off" spellcheck="false" autocapitalize="none" aria-describedby="token-hint" data-i18n-placeholder="tokenPlaceholder" placeholder="${escapeHtml(copy.tokenPlaceholder)}">
        <p class="token-hint" id="token-hint">${text("tokenHint")}</p>
        ${scopes.includes("write") ? `<label class="permission"><input type="checkbox" name="allow_write" value="yes">${text("permission")}</label>` : ""}
        <p class="lifetime">${text(lifetime)}</p>
        <div class="actions">
          <button class="button button-primary" type="submit" name="action" value="connect">${text("connect")}</button>
          <button class="button button-secondary" type="submit" name="action" value="cancel" formnovalidate>${text("cancel")}</button>
        </div>
      </form>
    </main>
    <nav class="links" data-i18n-label="helpNavigation" aria-label="${escapeHtml(copy.helpNavigation)}">
      <a href="https://help.teletype.app" target="_blank" rel="noopener noreferrer">${text("support")} ${externalLinkIcon}<span class="sr-only" data-i18n="newTab">${copy.newTab}</span></a>
      <a href="${copy.privacyUrl}" data-i18n-href="privacyUrl" target="_blank" rel="noopener noreferrer">${text("privacy")} ${externalLinkIcon}<span class="sr-only" data-i18n="newTab">${copy.newTab}</span></a>
    </nav>
  </div>
</body>
</html>`;
}
