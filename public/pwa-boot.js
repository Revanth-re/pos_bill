/* Runs before the app JS. Registers the SW and captures Chrome's install event. */
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

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(function (reg) {
          window.__POS_PWA.swReady = true;
          window.dispatchEvent(new Event("pos-pwa-sw-ready"));
          return navigator.serviceWorker.ready.then(function () {
            return reg.update();
          });
        })
        .catch(function () {});
    }
  } catch (e) {}
})();
