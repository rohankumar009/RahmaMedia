const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const counters = [...document.querySelectorAll("[data-count]")];
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const year = document.querySelector("[data-year]");
const navThemeSections = [...document.querySelectorAll("[data-nav-theme]")];

if (year) year.textContent = new Date().getFullYear();

const homePaths = new Set(["/", "/index", "/index.html"]);

const setCleanHomeUrl = () => {
  if (!homePaths.has(window.location.pathname)) return;

  window.history.replaceState(null, "", "/");
};

const scrollToSection = (id, behavior = "smooth") => {
  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior, block: "start" });
  setCleanHomeUrl();

  return true;
};

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(link instanceof HTMLAnchorElement)) return;

  const href = link.getAttribute("href") ?? "";

  // Logo / Home links on the home page: scroll to top, no reload
  if (href === "/" && homePaths.has(window.location.pathname)) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCleanHomeUrl();
    return;
  }

  if ((!href.startsWith("#") && !href.startsWith("/#")) || href === "#main") return;

  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin || !url.hash) return;

  const sectionId = decodeURIComponent(url.hash.slice(1));
  if (!sectionId || !document.getElementById(sectionId)) return;

  event.preventDefault();
  scrollToSection(sectionId);
});

if (window.location.hash) {
  const sectionId = decodeURIComponent(window.location.hash.slice(1));

  requestAnimationFrame(() => {
    scrollToSection(sectionId, "auto");
  });
}

const getCurrentNavTheme = () => {
  const probeY = 1;
  const activeSection = navThemeSections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= probeY && rect.bottom > probeY;
  });

  return activeSection?.dataset.navTheme ?? navThemeSections[0]?.dataset.navTheme;
};

const setNavTheme = (theme = "light") => {
  if (!header) return;

  const nextTheme = theme === "dark" ? "dark" : "light";
  header.classList.toggle("nav-theme-dark", nextTheme === "dark");
  header.classList.toggle("nav-theme-light", nextTheme === "light");
};

const updateNavTheme = () => setNavTheme(getCurrentNavTheme());

if (header) updateNavTheme();

if (header && navThemeSections.length) {
  const navThemeObserver = new IntersectionObserver(
    () => updateNavTheme(),
    {
      rootMargin: "-1px 0px -99% 0px",
      threshold: 0,
    }
  );

  navThemeSections.forEach((section) => navThemeObserver.observe(section));
}

// Pill navbar: show glass pill once hero is 80% scrolled past
const heroSection = document.querySelector("[data-hero]");

const updateScrolledState = () => {
  if (!header) return;

  if (!heroSection) {
    // No hero on this page (e.g. Portfolio) — show pill immediately
    header.classList.add("is-scrolled");
    return;
  }
  const trigger = heroSection.offsetTop + heroSection.offsetHeight * 0.8;
  header.classList.toggle("is-scrolled", window.scrollY >= trigger);
};

window.addEventListener("scroll", updateScrolledState, { passive: true });
updateScrolledState();

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("hidden", isOpen);
  });

  mobileMenu.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return;

    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.classList.add("hidden");
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const animateCounter = (counter) => {
  const endValue = Number(counter.dataset.count);
  const duration = 950;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(endValue * eased).toLocaleString();

    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));

// ---- Language toggle + CSV translations ----------------------------------
const LANG_KEY = "rm-lang";
const TRANSLATION_CSV_URL = "/translation_temp.csv";
const SKIPPED_I18N_PARENTS = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "title", "placeholder"];
const PAGE_META_KEYS = {
  "/": {
    title: "index.meta.title",
    description: "index.meta.description",
  },
  "/index": {
    title: "index.meta.title",
    description: "index.meta.description",
  },
  "/index.html": {
    title: "index.meta.title",
    description: "index.meta.description",
  },
  "/portfolio": {
    title: "portfolio.meta.title",
    description: "portfolio.meta.description",
  },
  "/portfolio.html": {
    title: "portfolio.meta.title",
    description: "portfolio.meta.description",
  },
  "/process": {
    title: "process.meta.title",
    description: "process.meta.description",
  },
  "/process.html": {
    title: "process.meta.title",
    description: "process.meta.description",
  },
  "/portfolio-detail": {
    title: "project.meta.title",
    description: "project.meta.description",
  },
  "/portfolio-detail.html": {
    title: "project.meta.title",
    description: "project.meta.description",
  },
};

const translationState = {
  byKey: new Map(),
  byEnglish: new Map(),
  textTargets: [],
  attributeTargets: [],
  activeTextOwners: new Set(),
  ownerDefaults: new WeakMap(),
  metaDefaults: {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
  },
  current: "en",
};

const repairCsvText = (value = "") =>
  value
    .replace(/^\uFEFF/, "")
    .replaceAll("‚Äî", "—")
    .replaceAll("‚Äì", "–")
    .replaceAll("‚Äô", "'")
    .replaceAll("‚Äú", '"')
    .replaceAll("‚Äù", '"')
    .replaceAll("¬†", " ");

const normalizeI18nText = (value = "") => repairCsvText(value).replace(/\s+/g, " ").trim();

const splitOuterWhitespace = (value) => {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length);

  return { leading, core, trailing };
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function loadTranslationRows(rows) {
  translationState.byKey.clear();
  translationState.byEnglish.clear();

  rows.slice(1).forEach((row) => {
    const key = repairCsvText(row[1] ?? "").trim();
    const english = repairCsvText(row[2] ?? "").trim();
    const arabic = repairCsvText(row[3] ?? "").trim();

    if (!key && !english) return;

    translationState.byKey.set(key, { en: english, ar: arabic });

    if (english && arabic) {
      translationState.byEnglish.set(normalizeI18nText(english), arabic);
    }
  });
}

async function loadTranslations() {
  try {
    const response = await fetch(TRANSLATION_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Translation CSV returned ${response.status}`);

    loadTranslationRows(parseCsv(await response.text()));
  } catch (error) {
    console.warn("Could not load translation_temp.csv. Falling back to English.", error);
  }
}

function getStoredLanguage() {
  try {
    return localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function saveLanguage(code) {
  try {
    localStorage.setItem(LANG_KEY, code);
  } catch {
    // Private browsing can block localStorage; the toggle should still work.
  }
}

function translateString(source, lang, key) {
  if (lang !== "ar") return source;

  const keyed = key ? translationState.byKey.get(key)?.ar : "";
  if (keyed) return keyed;

  return translationState.byEnglish.get(normalizeI18nText(source)) || source;
}

function translateByKey(key, fallback, replacements = {}) {
  let value = translateString(fallback, translationState.current, key);

  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, replacement);
  });

  return value;
}

function rememberTextOwner(element) {
  if (translationState.ownerDefaults.has(element)) return;

  translationState.ownerDefaults.set(element, {
    dir: element.getAttribute("dir"),
    lang: element.getAttribute("lang"),
    active: element.dataset.i18nActive,
  });
}

function resetTextOwners() {
  translationState.activeTextOwners.forEach((element) => {
    const defaults = translationState.ownerDefaults.get(element);
    if (!defaults) return;

    if (defaults.dir === null) element.removeAttribute("dir");
    else element.setAttribute("dir", defaults.dir);

    if (defaults.lang === null) element.removeAttribute("lang");
    else element.setAttribute("lang", defaults.lang);

    if (defaults.active === undefined) delete element.dataset.i18nActive;
    else element.dataset.i18nActive = defaults.active;
  });

  translationState.activeTextOwners.clear();
}

function markTextOwner(element, lang) {
  rememberTextOwner(element);
  element.dataset.i18nActive = "true";
  element.setAttribute("lang", lang);
  element.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  translationState.activeTextOwners.add(element);
}

function collectTranslationTargets() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIPPED_I18N_PARENTS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-lang-toggle], [data-no-i18n]")) return NodeFilter.FILTER_REJECT;
      if (!normalizeI18nText(node.nodeValue ?? "")) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  translationState.textTargets = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const { leading, core, trailing } = splitOuterWhitespace(node.nodeValue ?? "");

    translationState.textTargets.push({
      node,
      parent: node.parentElement,
      leading,
      core,
      trailing,
    });
  }

  translationState.attributeTargets = [];

  document.querySelectorAll(TRANSLATABLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(",")).forEach((element) => {
    TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;

      translationState.attributeTargets.push({
        element,
        attr,
        original: element.getAttribute(attr) ?? "",
      });
    });
  });
}

function applyPageMeta(lang) {
  const metaKeys = PAGE_META_KEYS[window.location.pathname] ?? PAGE_META_KEYS["/"];
  const description = document.querySelector('meta[name="description"]');

  document.title =
    lang === "ar"
      ? translateString(translationState.metaDefaults.title, lang, metaKeys.title)
      : translationState.metaDefaults.title;

  if (description) {
    description.setAttribute(
      "content",
      lang === "ar"
        ? translateString(translationState.metaDefaults.description, lang, metaKeys.description)
        : translationState.metaDefaults.description
    );
  }
}

function applyTranslations(lang) {
  resetTextOwners();

  translationState.textTargets.forEach((target) => {
    const translated = translateString(target.core, lang);
    target.node.nodeValue = `${target.leading}${translated}${target.trailing}`;

    if (lang === "ar" && translated !== target.core && target.parent) {
      markTextOwner(target.parent, lang);
    }
  });

  translationState.attributeTargets.forEach(({ element, attr, original }) => {
    element.setAttribute(attr, translateString(original, lang));
  });

  applyPageMeta(lang);
}

function setLanguage(lang, options = {}) {
  const code = lang === "ar" ? "ar" : "en";
  translationState.current = code;

  if (options.persist !== false) saveLanguage(code);

  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-lang-toggle]").forEach((toggle) => {
    toggle.dataset.active = code;
    toggle.querySelectorAll(".lang-opt").forEach((opt) => {
      opt.setAttribute("aria-pressed", String(opt.dataset.lang === code));
    });
  });

  applyTranslations(code);
}

function initLangToggle() {
  document.querySelectorAll("[data-lang-toggle]").forEach((toggle) => {
    toggle.querySelectorAll(".lang-opt").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });
  });
}

requestAnimationFrame(() => {
  collectTranslationTargets();
  initLangToggle();
  setLanguage(getStoredLanguage(), { persist: false });

  loadTranslations().then(() => {
    setLanguage(getStoredLanguage(), { persist: false });
  });
});

window.setLanguage = setLanguage;

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      if (formStatus) {
        formStatus.textContent = translateByKey(
          "index.form.required_status",
          "Please fill in the required details."
        );
      }
      contactForm.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(contactForm).entries());
    const firstName = String(data.name).trim().split(" ")[0] || "there";

    if (formStatus) {
      formStatus.textContent = translateByKey(
        "index.form.success_status",
        "Thanks, {firstName}. Your inquiry is ready to wire into a backend.",
        { firstName }
      );
    }
    contactForm.reset();
  });
}
