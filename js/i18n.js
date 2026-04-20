const RM_LANG_KEY = "rm-lang";
const RM_SUPPORTED_LANGS = new Set(["en", "ar"]);
const RM_TRANSLATABLE_ATTRIBUTES = {
  "data-i18n-alt": "alt",
  "data-i18n-aria-label": "aria-label",
  "data-i18n-placeholder": "placeholder",
  "data-i18n-title": "title",
  "data-i18n-content": "content",
};

const rmI18nState = {
  current: "en",
  dictionaries: {},
};

const getStoredLanguage = () => {
  try {
    const saved = localStorage.getItem(RM_LANG_KEY);
    return RM_SUPPORTED_LANGS.has(saved) ? saved : "en";
  } catch {
    return "en";
  }
};

const saveLanguage = (lang) => {
  try {
    localStorage.setItem(RM_LANG_KEY, lang);
  } catch {
    // Storage can be unavailable in private browsing; language still changes.
  }
};

const getDirection = (lang) => (lang === "ar" ? "rtl" : "ltr");

const interpolate = (text, replacements = {}) =>
  Object.entries(replacements).reduce(
    (value, [name, replacement]) => value.replaceAll(`{${name}}`, replacement),
    text
  );

async function loadDictionary(lang) {
  if (rmI18nState.dictionaries[lang]) return rmI18nState.dictionaries[lang];

  const response = await fetch(`/i18n/${lang}.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load /i18n/${lang}.json`);

  const dictionary = await response.json();
  rmI18nState.dictionaries[lang] = dictionary;
  return dictionary;
}

function translate(key, fallback = "", replacements = {}) {
  const dictionary = rmI18nState.dictionaries[rmI18nState.current] ?? {};
  const value = dictionary[key] ?? fallback;

  return interpolate(value, replacements);
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;

    element.textContent = translate(key, element.textContent);
  });

  Object.entries(RM_TRANSLATABLE_ATTRIBUTES).forEach(([dataAttribute, attribute]) => {
    document.querySelectorAll(`[${dataAttribute}]`).forEach((element) => {
      const key = element.getAttribute(dataAttribute);
      if (!key) return;

      element.setAttribute(attribute, translate(key, element.getAttribute(attribute) ?? ""));
    });
  });
}

function updateLanguageToggle(lang) {
  document.querySelectorAll("[data-lang-toggle]").forEach((toggle) => {
    toggle.dataset.active = lang;

    toggle.querySelectorAll("[data-lang]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
    });
  });
}

async function setLanguage(lang) {
  const code = RM_SUPPORTED_LANGS.has(lang) ? lang : "en";

  try {
    await loadDictionary(code);
  } catch (error) {
    console.warn(`Falling back to English because ${code} translations could not be loaded.`, error);
    if (code !== "en") return setLanguage("en");
  }

  rmI18nState.current = code;
  document.documentElement.lang = code;
  document.documentElement.dir = getDirection(code);
  saveLanguage(code);
  updateLanguageToggle(code);
  applyTranslations();

  window.dispatchEvent(
    new CustomEvent("i18n:change", {
      detail: { lang: code, dir: getDirection(code) },
    })
  );

  return code;
}

function initLanguageToggle() {
  document.querySelectorAll("[data-lang-toggle] [data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.lang);
    });
  });
}

async function initI18n() {
  initLanguageToggle();
  await setLanguage(getStoredLanguage());
}

window.RM_I18N = {
  setLanguage,
  getLanguage: () => rmI18nState.current,
  t: translate,
};
window.setLanguage = setLanguage;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initI18n);
} else {
  initI18n();
}
