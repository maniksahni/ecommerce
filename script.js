const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const progressBar = document.querySelector(".scroll-progress");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.body.classList.add("is-loaded");

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  }
});

const revealTargets = document.querySelectorAll(
  ".showcase-copy, .intro > *, .product-edit article, .section-heading, .feed-card, .custom-copy, .custom-list div, .order-band > *"
);

revealTargets.forEach((target, index) => {
  target.classList.add("reveal");
  target.style.transitionDelay = `${Math.min((index % 8) * 65, 390)}ms`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
);

revealTargets.forEach((target) => revealObserver.observe(target));

let ticking = false;

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  progressBar?.style.setProperty("--scroll-progress", progress.toFixed(4));
  document.documentElement.style.setProperty("--scroll-y", window.scrollY.toFixed(0));
  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollProgress);
      ticking = true;
    }
  },
  { passive: true }
);

updateScrollProgress();

document.querySelectorAll(".hero-card, .product-edit article, .feed-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(max-width: 680px)").matches) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".button, .header-action, .mobile-shop-bar a").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (!finePointer || reducedMotion) {
      return;
    }

    const bounds = item.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    item.style.transform = `translate(${(x * 0.12).toFixed(1)}px, ${(y * 0.18).toFixed(1)}px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

let lastSpark = 0;

window.addEventListener(
  "pointermove",
  (event) => {
    if (!finePointer || reducedMotion) {
      return;
    }

    const now = performance.now();
    if (now - lastSpark < 42) {
      return;
    }
    lastSpark = now;

    const spark = document.createElement("span");
    spark.className = "pointer-spark";
    spark.style.left = `${event.clientX}px`;
    spark.style.top = `${event.clientY}px`;
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), 780);
  },
  { passive: true }
);
