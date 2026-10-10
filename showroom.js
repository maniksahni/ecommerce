/* Homepage choreography only. Commerce remains owned by script.js. */
(() => {
  if (!document.body.classList.contains("light-on-gold")) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const economical =
    navigator.connection?.saveData ||
    navigator.deviceMemory <= 4 ||
    navigator.hardwareConcurrency <= 4;
  if (economical) document.body.classList.add("gold-economical");
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const icon = (kind = "diamond") =>
    `<svg class="gold-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{ heart: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 0 9 8 15 8-6 12-11 8-15Z"/>', diamond: '<path d="m3 8 4-5h10l4 5-9 13L3 8Z M3 8h18M7 3l5 18 5-18"/>', box: '<path d="M3 7h18v14H3zM2 3h20v4H2zM12 3v18"/>', truck: '<path d="M2 4h12v13H2zM14 9h4l4 5v3h-8M7 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>', user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>', chat: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z M8 10h8M8 14h5"/>', bag: '<path d="M4 7h16l1 14H3L4 7ZM8 7V5a4 4 0 0 1 8 0v2"/>', arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>' }[kind]}</svg>`;
  document
    .querySelectorAll(".reassurance-card__icon")
    .forEach((el) => (el.innerHTML = icon()));
  document
    .querySelectorAll(".atelier-story-badge-icon")
    .forEach((el) => (el.innerHTML = icon()));
  const eyebrow = document.querySelector(".watch-buy-eyebrow");
  if (eyebrow) eyebrow.textContent = "LIVE ATELIER FEED";
  document
    .querySelectorAll(".trust-icon-box")
    .forEach(
      (el, i) => (el.innerHTML = icon(["diamond", "box", "truck", "chat"][i])),
    );
  const trust = document.querySelector(".trust-grid");
  if (trust && !reduced) {
    const copy = trust.cloneNode(true);
    copy.querySelectorAll("a,button").forEach((el) => (el.tabIndex = -1));
    [...copy.children].forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      trust.append(el);
    });
    const pause = document.createElement("button");
    pause.className = "gold-marquee-pause";
    pause.type = "button";
    pause.textContent = "Pause";
    pause.setAttribute("aria-label", "Pause trust strip animation");
    pause.setAttribute("aria-pressed", "false");
    trust.parentElement.append(pause);
    pause.addEventListener("click", () => {
      const paused = pause.getAttribute("aria-pressed") !== "true";
      pause.setAttribute("aria-pressed", String(paused));
      pause.textContent = paused ? "Play" : "Pause";
      pause.setAttribute(
        "aria-label",
        paused ? "Play trust strip animation" : "Pause trust strip animation",
      );
      trust.style.animationPlayState = paused ? "paused" : "running";
    });
    trust.addEventListener(
      "mouseenter",
      () => (trust.style.animationPlayState = "paused"),
    );
    trust.addEventListener(
      "mouseleave",
      () =>
        (trust.style.animationPlayState =
          pause.getAttribute("aria-pressed") === "true" ? "paused" : "running"),
    );
  }
  const decorateHeader = () => {
    const menu = document.querySelector(".menu-icon");
    if (menu && !menu.dataset.goldIcon) {
      menu.dataset.goldIcon = "1";
      menu.innerHTML = icon("menu");
    }
    const search = document.querySelector("[data-search-open]");
    if (search && !search.dataset.goldIcon) {
      search.dataset.goldIcon = "1";
      search.innerHTML = icon("search");
    }
    const wish = document.querySelector(".stable-header__btn--wish");
    if (wish && !wish.dataset.goldIcon) {
      wish.dataset.goldIcon = "1";
      wish.firstChild.textContent = "";
      wish.insertAdjacentHTML("afterbegin", icon("heart"));
    }
    const account = document.querySelector("[data-account-open]");
    if (account && !account.dataset.goldIcon) {
      account.dataset.goldIcon = "1";
      account.firstChild.textContent = "";
      account.insertAdjacentHTML("afterbegin", icon("user"));
    }
    document
      .querySelector(".stable-header__btn--bag")
      ?.removeAttribute("aria-label");
    document
      .querySelectorAll('a[href="/collections/neckwear"]')
      .forEach((a) => a.setAttribute("href", "/collections/necklaces"));
  };
  decorateHeader();
  new MutationObserver(decorateHeader).observe(
    document.querySelector("#shared-header"),
    { childList: true, subtree: true },
  );
  document
    .querySelector("#storefront-filter-toggle")
    .setAttribute("aria-label", "Filters by category");
  const decorateReels = () =>
    document
      .querySelectorAll(".reel-quick-add-btn")
      .forEach((el) => el.removeAttribute("aria-label"));
  decorateReels();
  new MutationObserver(decorateReels).observe(
    document.querySelector("#watch-and-buy-container"),
    { childList: true, subtree: true },
  );
  const bottom = document.createElement("nav");
  bottom.className = "gold-bottom-bar";
  bottom.setAttribute("aria-label", "Shop and concierge");
  bottom.innerHTML = `<a href="/collections/all">${icon("bag")}Shop</a><a href="https://wa.me/919457041215" target="_blank" rel="noreferrer">${icon("chat")}WhatsApp</a>`;
  document.body.append(bottom);
  try {
    if (!localStorage.getItem("shivara-showroom-seen") && !reduced) {
      const loader = document.createElement("div");
      loader.className = "gold-loader";
      loader.setAttribute("aria-hidden", "true");
      loader.innerHTML = "<span>Shivara</span>";
      document.body.append(loader);
      setTimeout(() => loader.remove(), 950);
      localStorage.setItem("shivara-showroom-seen", "1");
    }
  } catch {}
  const gallery = document.querySelector("#commerce-category-grid");
  if (gallery) {
    const controls = document.createElement("div");
    controls.className = "gold-gallery-controls";
    controls.innerHTML = `<button aria-label="Previous categories" type="button" data-direction="-1">←</button><button aria-label="Next categories" type="button" data-direction="1">${icon("arrow")}</button>`;
    gallery.after(controls);
    controls.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (button)
        gallery.scrollBy({
          left: Number(button.dataset.direction) * gallery.clientWidth * 0.8,
          behavior: reduced ? "instant" : "smooth",
        });
    });
    if (!reduced && !economical) {
      let previous = gallery.scrollLeft,
        reset;
      gallery.addEventListener(
        "scroll",
        () => {
          const delta = gallery.scrollLeft - previous;
          previous = gallery.scrollLeft;
          gallery
            .querySelectorAll("a")
            .forEach(
              (el) =>
                (el.style.transform = `skewX(${Math.max(-3, Math.min(3, delta * 0.06))}deg)`),
            );
          clearTimeout(reset);
          reset = setTimeout(
            () =>
              gallery
                .querySelectorAll("a")
                .forEach((el) => (el.style.transform = "")),
            100,
          );
        },
        { passive: true },
      );
    }
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.2 },
  );
  document
    .querySelectorAll(".gold-craft")
    .forEach((el) => observer.observe(el));
  const decorateCards = () => {
    document
      .querySelectorAll("main .stable-card__wish:not([data-gold-icon])")
      .forEach((button) => {
        button.dataset.goldIcon = "1";
        button.innerHTML = icon("heart");
      });
    document
      .querySelectorAll(
        "main .stable-card__quick>span[aria-hidden]:not([data-gold-icon])",
      )
      .forEach((span) => {
        span.dataset.goldIcon = "1";
        span.innerHTML = icon("search");
      });
  };
  decorateCards();
  new MutationObserver(decorateCards).observe(document.querySelector("main"), {
    childList: true,
    subtree: true,
  });
  fetch("/assets/showroom/media.json")
    .then((r) => r.json())
    .then((manifest) => {
      const optimize = () =>
        document
          .querySelectorAll("main img:not([data-gold-optimized])")
          .forEach((img) => {
            img.dataset.goldOptimized = "true";
            const path = new URL(img.getAttribute("src") || "", location.href)
              .pathname;
            const media = manifest[path];
            if (media) {
              img.srcset = `${media.small} 480w, ${media.large} 960w`;
              img.sizes = img.closest(".atelier-split-media")
                ? "(max-width:600px) 90vw, 50vw"
                : "(max-width:600px) 50vw, 30vw";
              img.src = media.small;
            }
            if (!img.hasAttribute("data-hero-image")) {
              img.loading = "lazy";
              img.fetchPriority = "low";
            }
          });
      optimize();
      let queued = false;
      new MutationObserver(() => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            optimize();
          });
        }
      }).observe(document.querySelector("main"), {
        childList: true,
        subtree: true,
      });
    })
    .catch(() => {});
  if (fine && !reduced && !economical) {
    const glow = document.querySelector(".stable-hero__glow");
    const hero = document.querySelector(".stable-hero");
    hero?.addEventListener(
      "pointermove",
      (e) => {
        const box = hero.getBoundingClientRect();
        glow.style.animation = "none";
        glow.style.transform = `translate(${e.clientX - box.left - 180}px,${e.clientY - box.top - 180}px)`;
      },
      { passive: true },
    );
    document.querySelectorAll(".gold-magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const box = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - box.left - box.width / 2) * 0.1}px,${(e.clientY - box.top - box.height / 2) * 0.15}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest(
          ".gold-bento .stable-card,.atelier-edit-card",
        );
        if (!card) return;
        const box = card.getBoundingClientRect(),
          x = (e.clientX - box.left) / box.width - 0.5,
          y = (e.clientY - box.top) / box.height - 0.5;
        card.style.transform = `perspective(1200px) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
        let glare = card.querySelector(".gold-card-glare");
        if (!glare) {
          glare = document.createElement("span");
          glare.className = "gold-card-glare";
          card.append(glare);
        }
        glare.style.opacity = "1";
        glare.style.transform = `translate(${x * 15}%,${y * 15}%)`;
      },
      { passive: true },
    );
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest(
        ".gold-bento .stable-card,.atelier-edit-card",
      );
      if (card && !card.contains(e.relatedTarget)) {
        card.style.transform = "";
        const glare = card.querySelector(".gold-card-glare");
        if (glare) glare.style.opacity = "0";
      }
    });
  }
  const load = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  if (!reduced && !economical) {
    const motion = async () => {
      try {
        await load("/vendor/showroom/gsap.min.js");
        await load("/vendor/showroom/ScrollTrigger.min.js");
        gsap.registerPlugin(ScrollTrigger);
        const story = document.querySelector(".atelier-split-showcase");
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: story,
            start: "top top+=75",
            end: () => `+=${innerWidth < 600 ? 450 : 750}`,
            pin: innerWidth >= 900,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        timeline.fromTo(
          story.querySelector("img"),
          { scale: 1, rotation: 0 },
          { scale: 1.08, rotation: 2, duration: 3 },
          0,
        );
        timeline.fromTo(
          story.querySelectorAll(".atelier-split-highlights span"),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, stagger: 0.7, duration: 1 },
          0.2,
        );
        if (fine) {
          await load("/vendor/showroom/lenis.min.js");
          const lenis = new Lenis({
            duration: 1.05,
            autoRaf: false,
            prevent: (node) =>
              Boolean(
                node.closest(
                  '[role="dialog"],.stable-cart-drawer,.stable-quick-view',
                ),
              ),
          });
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add((time) => lenis.raf(time * 1000));
          gsap.ticker.lagSmoothing(0);
        }
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      } catch {
        /* Fully readable native scroll fallback. */
      }
    };
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      motion();
    };
    addEventListener("wheel", start, { once: true, passive: true });
    addEventListener("touchstart", start, { once: true, passive: true });
    addEventListener("keydown", start, { once: true });
  }
})();
