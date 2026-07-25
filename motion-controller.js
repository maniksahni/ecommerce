(() => {
  "use strict";
  if (window.SHIVARA_MOTION) return;

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const effects = new Map();
  const visibleSections = new WeakSet();
  const frameCallbacks = new Set();
  let frameId = 0;
  let modalOpen = document.body.classList.contains("stable-modal-open");

  function automaticTier() {
    if (reducedQuery.matches || navigator.connection?.saveData) return "lite";
    const memory = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);
    if (!pointerQuery.matches || innerWidth < 768 || memory <= 2 || cores <= 2) return "lite";
    if (memory >= 8 && cores >= 8 && innerWidth >= 1180) return "high";
    return "balanced";
  }

  function normalizeTier(value) {
    return ["high", "balanced", "lite"].includes(value) ? value : automaticTier();
  }

  const state = {
    tier: normalizeTier(window.SHIVARA_VISUAL_TIER || "auto"),
    reduced: reducedQuery.matches,
    precisionPointer: pointerQuery.matches,
    pageVisible: !document.hidden,
    modalOpen
  };

  function shouldRun(effect) {
    return state.pageVisible && !state.modalOpen && !state.reduced && state.tier !== "lite" && (!effect.element || visibleSections.has(effect.element));
  }

  function syncEffect(effect) {
    if (shouldRun(effect)) {
      if (!effect.initialized) {
        effect.initialize?.();
        effect.initialized = true;
      }
      if (effect.paused) effect.resume?.();
      effect.paused = false;
    } else if (effect.initialized && !effect.paused) {
      effect.pause?.();
      effect.paused = true;
    }
  }

  function syncAll() {
    document.documentElement.dataset.visualTier = state.tier;
    document.documentElement.classList.toggle("motion-reduced", state.reduced);
    effects.forEach(syncEffect);
    if (frameCallbacks.size && !frameId) frameId = requestAnimationFrame(runFrames);
  }

  function runFrames(time) {
    frameId = 0;
    if (!state.pageVisible || state.modalOpen || state.reduced || state.tier === "lite") return;
    frameCallbacks.forEach((callback) => callback(time));
    if (frameCallbacks.size) frameId = requestAnimationFrame(runFrames);
  }

  const sectionObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
        effects.forEach((effect) => {
          if (effect.element === entry.target) syncEffect(effect);
        });
      });
    }, { rootMargin: "120px 0px", threshold: 0.05 })
    : null;

  function register(name, lifecycle) {
    if (!name || effects.has(name)) return effects.get(name);
    const effect = { initialized: false, paused: true, ...lifecycle };
    effects.set(name, effect);
    if (effect.element) {
      visibleSections.add(effect.element);
      sectionObserver?.observe(effect.element);
    }
    syncEffect(effect);
    return effect;
  }

  function unregister(name) {
    const effect = effects.get(name);
    if (!effect) return;
    if (effect.element) sectionObserver?.unobserve(effect.element);
    effect.destroy?.();
    effects.delete(name);
  }

  function addFrameCallback(callback) {
    frameCallbacks.add(callback);
    if (!frameId) frameId = requestAnimationFrame(runFrames);
    return () => frameCallbacks.delete(callback);
  }

  function setTier(tier) {
    state.tier = normalizeTier(tier);
    syncAll();
  }

  function onVisibility() {
    state.pageVisible = !document.hidden;
    syncAll();
  }

  function onModal(event) {
    modalOpen = Boolean(event.detail?.open);
    state.modalOpen = modalOpen;
    syncAll();
  }

  function onPreference() {
    state.reduced = reducedQuery.matches;
    state.precisionPointer = pointerQuery.matches;
    if (!window.SHIVARA_VISUAL_TIER || window.SHIVARA_VISUAL_TIER === "auto") state.tier = automaticTier();
    syncAll();
  }

  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("shivara:modal-change", onModal);
  reducedQuery.addEventListener?.("change", onPreference);
  pointerQuery.addEventListener?.("change", onPreference);

  window.SHIVARA_MOTION = Object.freeze({
    state,
    register,
    unregister,
    addFrameCallback,
    setTier,
    pause() {
      state.pageVisible = false;
      syncAll();
    },
    resume() {
      state.pageVisible = !document.hidden;
      syncAll();
    },
    destroy() {
      if (frameId) cancelAnimationFrame(frameId);
      frameCallbacks.clear();
      effects.forEach((effect) => effect.destroy?.());
      effects.clear();
      sectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("shivara:modal-change", onModal);
      reducedQuery.removeEventListener?.("change", onPreference);
      pointerQuery.removeEventListener?.("change", onPreference);
      delete window.SHIVARA_MOTION;
    }
  });

  syncAll();
  document.dispatchEvent(new CustomEvent("shivara:motion-ready", { detail: { tier: state.tier } }));
})();
