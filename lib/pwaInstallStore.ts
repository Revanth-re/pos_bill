/** Native PWA install prompt store.
 * Chrome only shows the system install dialog via beforeinstallprompt → prompt().
 * We capture that event early (public/pwa-boot.js) and call prompt() on tap. */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "chromium" | "ios-safari" | "unsupported";

export interface PwaInstallSnapshot {
  installed: boolean;
  canPromptNatively: boolean;
  platform: InstallPlatform;
  secureContext: boolean;
}

type Listener = () => void;

declare global {
  interface Window {
    __POS_PWA?: {
      deferred: BeforeInstallPromptEvent | null;
      swReady?: boolean;
    };
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let platform: InstallPlatform = "unsupported";
let secureContext = true;
let bootstrapped = false;
const listeners = new Set<Listener>();

let snapshot: PwaInstallSnapshot = {
  installed: false,
  canPromptNatively: false,
  platform: "unsupported",
  secureContext: true,
};

export const SERVER_PWA_SNAPSHOT: PwaInstallSnapshot = {
  installed: false,
  canPromptNatively: false,
  platform: "unsupported",
  secureContext: true,
};

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);
  if (isIOS && isSafari) return "ios-safari";

  const isChromium =
    (/Chrome|CriOS|Edg|EdgiOS|SamsungBrowser/i.test(ua) && !/OPR|Opera|Firefox/i.test(ua)) ||
    !!deferredPrompt;
  return isChromium ? "chromium" : "unsupported";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function refreshSnapshot() {
  snapshot = {
    installed,
    canPromptNatively: !!deferredPrompt,
    platform,
    secureContext,
  };
}

function notify() {
  refreshSnapshot();
  listeners.forEach((l) => l());
}

function adoptDeferred(e: BeforeInstallPromptEvent | null) {
  if (!e) return;
  deferredPrompt = e;
  platform = "chromium";
  notify();
}

export function syncDeferredFromWindow() {
  if (typeof window === "undefined") return;
  if (window.__POS_PWA?.deferred) {
    adoptDeferred(window.__POS_PWA.deferred);
  }
}

export function bootstrapPwaInstall() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  secureContext = window.isSecureContext;
  installed = isStandalone();
  platform = detectPlatform();
  syncDeferredFromWindow();
  refreshSnapshot();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const ev = e as BeforeInstallPromptEvent;
    if (!window.__POS_PWA) window.__POS_PWA = { deferred: null };
    window.__POS_PWA.deferred = ev;
    adoptDeferred(ev);
  });

  window.addEventListener("pos-pwa-prompt", () => syncDeferredFromWindow());
  window.addEventListener("pos-pwa-installed", () => {
    installed = true;
    deferredPrompt = null;
    if (window.__POS_PWA) window.__POS_PWA.deferred = null;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    if (window.__POS_PWA) window.__POS_PWA.deferred = null;
    notify();
  });

  // Keep SW alive / claimed so Chrome considers the app installable.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async (reg) => {
        await navigator.serviceWorker.ready;
        syncDeferredFromWindow();
        void reg.update();
      })
      .catch(() => {});
  }
}

export function getPwaInstallSnapshot(): PwaInstallSnapshot {
  return snapshot;
}

export function getServerPwaSnapshot(): PwaInstallSnapshot {
  return SERVER_PWA_SNAPSHOT;
}

export function subscribePwaInstall(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Wait until Chrome has given us beforeinstallprompt (or timeout). */
export function waitForInstallPrompt(timeoutMs = 20000): Promise<boolean> {
  syncDeferredFromWindow();
  if (deferredPrompt) return Promise.resolve(true);
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    const onPrompt = () => {
      syncDeferredFromWindow();
      if (deferredPrompt) done(true);
    };

    const interval = window.setInterval(() => {
      syncDeferredFromWindow();
      if (deferredPrompt) done(true);
    }, 300);

    const timer = window.setTimeout(() => done(!!deferredPrompt), timeoutMs);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("pos-pwa-prompt", onPrompt);

    function cleanup() {
      window.clearInterval(interval);
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("pos-pwa-prompt", onPrompt);
    }
  });
}

/**
 * Call ONLY from a click handler — no awaits before this.
 * Opens the system install dialog.
 */
export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  syncDeferredFromWindow();
  if (!deferredPrompt) return "unavailable";

  const event = deferredPrompt;
  deferredPrompt = null;
  if (typeof window !== "undefined" && window.__POS_PWA) {
    window.__POS_PWA.deferred = null;
  }
  notify();

  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") {
      installed = true;
      notify();
    }
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}
