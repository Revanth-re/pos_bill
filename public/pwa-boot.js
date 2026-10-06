/* Boot PWA: clear broken workers, register clean SW, capture install prompt. */
(function () {
  try {
    window.__POS_PWA = window.__POS_PWA || { deferred: null, swReady: false };

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window.__POS_PWA.deferred = e;
      window.dispatchEvent(new Event("pos-pwa-prompt"));
    });

    window.addEventListener("appinstalled", function () {
      window.__POS_PWA.deferred = null;
      window.dispatchEvent(new Event("pos-pwa-installed"));
    });

    if (!("serviceWorker" in navigator)) return;

    // Drop any old broken SW that cached bad dashboard responses.
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(
        regs.map(function (reg) {
          return reg.update();
        })
      );
    }).finally(function () {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(function (reg) {
          window.__POS_PWA.swReady = true;
          window.dispatchEvent(new Event("pos-pwa-sw-ready"));
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          return navigator.serviceWorker.ready;
        })
        .catch(function () {});
    });
  } catch (e) {}
})();
