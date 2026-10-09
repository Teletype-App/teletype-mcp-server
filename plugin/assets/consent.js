const messages = JSON.parse(document.querySelector("[data-messages]").dataset.messages);
const controls = document.querySelectorAll("[data-locale]");

function changeLanguage(locale) {
  if (!Object.hasOwn(messages, locale)) return;
  const copy = messages[locale];
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = copy[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", copy[element.dataset.i18nPlaceholder]);
  });
  document.querySelectorAll("[data-i18n-href]").forEach((element) => {
    element.href = copy[element.dataset.i18nHref];
  });
  document.querySelectorAll("[data-i18n-label]").forEach((element) => {
    element.setAttribute("aria-label", copy[element.dataset.i18nLabel]);
  });
  controls.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.locale === locale));
  });
  document.getElementById("language-status").textContent = copy.languageChanged;
  document.cookie =
    `teletype_oauth_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax` +
    (location.protocol === "https:" ? "; Secure" : "");
}

controls.forEach((button) => {
  button.disabled = false;
  button.addEventListener("click", () => changeLanguage(button.dataset.locale));
});
