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

// ── Language Toggle ────────────────────────────────────────────────────────
// Public API: call setLanguage('en') or setLanguage('ar') from anywhere.
// Future: add site-wide content translation inside setLanguage() below.

const LANG_KEY = 'rm-lang';

function setLanguage(lang) {
  const code = lang === 'ar' ? 'ar' : 'en';
  localStorage.setItem(LANG_KEY, code);

  document.querySelectorAll('[data-lang-toggle]').forEach(toggle => {
    toggle.dataset.active = code;
    toggle.querySelectorAll('.lang-opt').forEach(opt => {
      opt.setAttribute('aria-pressed', String(opt.dataset.lang === code));
    });
  });

  // ── Future: wire full site translation here ──────────────────────────────
  // document.documentElement.lang = code;
  // document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  // translatePageContent(code); // ← your i18n function goes here
  // ─────────────────────────────────────────────────────────────────────────
}

function initLangToggle() {
  const saved = localStorage.getItem(LANG_KEY) || 'en';

  document.querySelectorAll('[data-lang-toggle]').forEach(toggle => {
    toggle.querySelectorAll('.lang-opt').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
  });

  setLanguage(saved);
}

requestAnimationFrame(initLangToggle);

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      if (formStatus) formStatus.textContent = "Please fill in the required details.";
      contactForm.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(contactForm).entries());
    const firstName = String(data.name).trim().split(" ")[0] || "there";

    if (formStatus) formStatus.textContent = `Thanks, ${firstName}. Your inquiry is ready to wire into a backend.`;
    contactForm.reset();
  });
}
