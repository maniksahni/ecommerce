(() => {
  if (window.SHIVARA_MOTION) return;

  const FORCE_TIER = window.SHIVARA_MOTION_FORCE || "auto";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisionPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const saveData = Boolean(navigator.connection?.saveData);
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;

  function chooseTier() {
    if (["high", "balanced", "lite"].includes(FORCE_TIER)) return FORCE_TIER;
    if (reducedMotion.matches || saveData || cores <= 2 || memory <= 2) return "lite";
    if (precisionPointer.matches && innerWidth >= 1100 && cores >= 6 && devicePixelRatio <= 2.5) return "high";
    return "balanced";
  }

  const state = {
    tier: chooseTier(),
    visible: !document.hidden,
    covered: false,
    pointer: precisionPointer.matches,
    cursorFrame: 0
  };
  const abortController = new AbortController();
  const signal = abortController.signal;

  function applyState() {
    document.documentElement.dataset.motionTier = state.tier;
    document.documentElement.classList.toggle("motion-paused", !state.visible || state.covered || state.tier === "lite");
    document.documentElement.classList.toggle("has-precision-pointer", state.pointer && state.tier !== "lite");
    window.dispatchEvent(new CustomEvent("shivara:motion-change", { detail: { ...state } }));
  }

  document.querySelectorAll(".atelier-hero, .shivara-deck, .signature-stage, .evil-orbit, .stack-builder, .ring-constellation, .lookbook__visual, .motion-shop__rail, .pdp-gallery").forEach((section) => {
    section.dataset.motionSection = "";
  });
  document.querySelectorAll(".atelier-hero, .shivara-deck, .lookbook__visual, .motion-shop__rail, .pdp-images, .quick-view-v2__gallery").forEach((region) => {
    region.dataset.cursor = region.matches(".motion-shop__rail, .shivara-deck") ? "DRAG" : region.matches(".pdp-images, .quick-view-v2__gallery") ? "ZOOM" : "VIEW";
  });
  document.querySelectorAll(".signature-stage__active, .shivara-deck__card, .finish-navigator__visual, .look-popover, .ring-constellation__active").forEach((card) => {
    card.dataset.depthCard = "";
  });
  document.querySelectorAll(".atelier-hero__actions a, .signature-stage__active-actions button, .concierge__trigger").forEach((button) => {
    button.dataset.magnetic = "";
  });

  const sectionObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-motion-active", entry.isIntersecting && entry.intersectionRatio > 0.16)),
        { threshold: [0, 0.16, 0.6] }
      )
    : null;
  document.querySelectorAll("[data-motion-section]").forEach((section) => sectionObserver?.observe(section));

  let cursor = null;
  let cursorX = 0;
  let cursorY = 0;
  let cursorLabel = "";

  function ensureCursor() {
    if (cursor || !state.pointer || state.tier === "lite") return cursor;
    cursor = document.createElement("div");
    cursor.className = "product-trail-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = "<span>VIEW</span>";
    document.body.append(cursor);
    return cursor;
  }

  function paintCursor() {
    state.cursorFrame = 0;
    const element = ensureCursor();
    if (!element) return;
    element.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    element.querySelector("span").textContent = cursorLabel;
  }

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!state.pointer || state.tier === "lite" || !state.visible || state.covered) return;
      const interactive = event.target.closest("button, input, select, textarea, [contenteditable]");
      const cursorRegion = interactive ? null : event.target.closest("[data-cursor]");
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursorLabel = cursorRegion?.dataset.cursor || "";
      ensureCursor()?.classList.toggle("is-visible", Boolean(cursorRegion));
      if (!state.cursorFrame) state.cursorFrame = requestAnimationFrame(paintCursor);

      const depthCard = event.target.closest("[data-depth-card]");
      if (depthCard && state.tier === "high") {
        const rect = depthCard.getBoundingClientRect();
        depthCard.style.setProperty("--depth-x", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
        depthCard.style.setProperty("--depth-y", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
        depthCard.classList.add("is-depth-active");
      }

      const magnetic = event.target.closest("[data-magnetic]");
      if (magnetic && state.tier === "high") {
        const rect = magnetic.getBoundingClientRect();
        magnetic.style.setProperty("--magnet-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 5}px`);
        magnetic.style.setProperty("--magnet-y", `${((event.clientY - rect.top) / rect.height - 0.5) * 4}px`);
      }
    },
    { passive: true, signal }
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      const depthCard = event.target.closest?.("[data-depth-card]");
      if (depthCard && !depthCard.contains(event.relatedTarget)) {
        depthCard.classList.remove("is-depth-active");
        depthCard.style.removeProperty("--depth-x");
        depthCard.style.removeProperty("--depth-y");
      }
      const magnetic = event.target.closest?.("[data-magnetic]");
      if (magnetic && !magnetic.contains(event.relatedTarget)) {
        magnetic.style.removeProperty("--magnet-x");
        magnetic.style.removeProperty("--magnet-y");
      }
    },
    { passive: true, signal }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      state.visible = !document.hidden;
      applyState();
      cursor?.classList.remove("is-visible");
    },
    { signal }
  );

  const coverObserver = new MutationObserver(() => {
    state.covered = document.body.classList.contains("commerce-modal-open") && !document.querySelector("#quick-view.is-open");
    applyState();
  });
  coverObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  let lastY = scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const dock = document.querySelector(".mobile-dock");
      if (!dock) return;
      const currentY = scrollY;
      dock.classList.toggle("is-minimised", currentY > lastY && currentY > innerHeight);
      dock.classList.toggle("is-floating", currentY > innerHeight * 0.85);
      lastY = currentY;
    },
    { passive: true, signal }
  );

  reducedMotion.addEventListener("change", () => {
    state.tier = chooseTier();
    applyState();
  }, { signal });
  precisionPointer.addEventListener("change", () => {
    state.pointer = precisionPointer.matches;
    state.tier = chooseTier();
    applyState();
  }, { signal });

  window.SHIVARA_MOTION = {
    get tier() {
      return state.tier;
    },
    force(tier = "auto") {
      window.SHIVARA_MOTION_FORCE = tier;
      state.tier = tier === "auto" ? chooseTier() : tier;
      applyState();
    },
    destroy() {
      abortController.abort();
      sectionObserver?.disconnect();
      coverObserver.disconnect();
      if (state.cursorFrame) cancelAnimationFrame(state.cursorFrame);
      cursor?.remove();
      delete window.SHIVARA_MOTION;
    }
  };

  applyState();
})();
