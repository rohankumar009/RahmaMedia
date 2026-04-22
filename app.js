const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const counters = [...document.querySelectorAll("[data-count]")];
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const formSubmitBtn = document.querySelector("[data-submit-btn]");
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

const translateByKey = (key, fallback, replacements = {}) => {
  if (window.RM_I18N?.t) return window.RM_I18N.t(key, fallback, replacements);

  return Object.entries(replacements).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement),
    fallback
  );
};

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      if (formStatus) {
        formStatus.textContent = translateByKey(
          "index.contact.form.required_status",
          "Please fill in the required details."
        );
      }
      contactForm.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(contactForm).entries());
    data.lang = document.documentElement.lang || "en";
    const firstName = String(data.name).trim().split(/\s+/)[0] || "there";
    const btnLabel = formSubmitBtn?.querySelector("span") ?? formSubmitBtn;

    if (formSubmitBtn) formSubmitBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = "Sending\u2026";
    if (formStatus) formStatus.textContent = "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Request failed");

      if (formStatus) {
        formStatus.textContent = translateByKey(
          "index.contact.form.success_status",
          "Thanks, {firstName}! We\u2019ll be in touch shortly.",
          { firstName }
        );
      }
      contactForm.reset();
    } catch {
      if (formStatus) {
        formStatus.textContent = translateByKey(
          "index.contact.form.error_status",
          "Something went wrong. Please try again or email us directly."
        );
      }
    } finally {
      if (formSubmitBtn) formSubmitBtn.disabled = false;
      if (btnLabel) {
        btnLabel.textContent = translateByKey(
          "index.contact.form.submit",
          "Send Inquiry"
        );
      }
    }
  });
}
