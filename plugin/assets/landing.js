const button = document.getElementById("copy-url");
const input = document.getElementById("mcp-url");
const status = document.getElementById("copy-status");
const label = button.querySelector(".copy-label");
const translations = JSON.parse(document.querySelector(".page").dataset.translations);
const languages = document.querySelectorAll(".languages [data-locale]");
let reset;
let feedback;

function showFeedback(key) {
  feedback = key;
  status.textContent = key ? button.dataset[key] : "";
}

function setState(state) {
  label.textContent = button.dataset[state];
  button.title = button.dataset[state];
  button.dataset.state = state;
}

button.hidden = false;
button.addEventListener("click", async () => {
  clearTimeout(reset);
  showFeedback();
  button.disabled = true;
  setState("copying");
  try {
    await navigator.clipboard.writeText(input.value);
    setState("copied");
    showFeedback("copied");
    reset = setTimeout(() => {
      setState("copy");
    }, 2000);
  } catch {
    input.focus();
    input.select();
    setState("copy");
    showFeedback("fallback");
  } finally {
    button.disabled = false;
  }
});

function changeLanguage(locale, announce = false) {
  if (locale !== "ru" && locale !== "en") return;
  const copy = translations[locale];
  if (!copy) return;
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = element.dataset.i18n.split(".").reduce((value, key) => value[key], copy);
  });
  document.querySelectorAll("[data-i18n-href]").forEach((element) => {
    element.href = copy[element.dataset.i18nHref];
  });
  document.querySelector(".brand").setAttribute("aria-label", copy.website + copy.newTab);
  document.querySelector(".actions").setAttribute("aria-label", copy.links);
  document
    .querySelectorAll('meta[name="description"], meta[property="og:description"]')
    .forEach((element) => element.setAttribute("content", copy.description));
  for (const key of ["copy", "copied", "copying", "copyFallback"]) {
    button.dataset[key === "copyFallback" ? "fallback" : key] = copy[key];
  }
  setState(button.dataset.state || "copy");
  showFeedback(feedback);
  languages.forEach((link) => {
    link.setAttribute("aria-pressed", String(link.dataset.locale === locale));
  });
  document.cookie = `teletype_oauth_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (announce) document.getElementById("language-status").textContent = copy.languageChanged;
}

languages.forEach((link) => {
  link.addEventListener("click", () => {
    const locale = link.dataset.locale;
    if (locale === document.documentElement.lang) return;
    changeLanguage(locale, true);
  });
});

document.querySelector(".languages").hidden = false;
const url = new URL(location.href);
if (url.searchParams.has("lang")) {
  url.searchParams.delete("lang");
  history.replaceState(history.state, "", url);
}
