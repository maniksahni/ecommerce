(() => {
  "use strict";
  if (window.SHIVARA_MOTION) return;

  const state = {
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    visible: !document.hidden
  };

  function updateVisibility() {
    state.visible = !document.hidden;
    document.documentElement.classList.toggle("motion-paused", !state.visible);
  }

  document.addEventListener("visibilitychange", updateVisibility);
  window.SHIVARA_MOTION = {
    state,
    destroy() {
      document.removeEventListener("visibilitychange", updateVisibility);
      delete window.SHIVARA_MOTION;
    }
  };
})();
