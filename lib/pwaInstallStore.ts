/** Module-level PWA install prompt capture.
 * `beforeinstallprompt` often fires once on first page load — long before
 * React mounts. An inline head script stores it on window; this module
 * picks that up so Profile → Install still works. */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "chromium" | "ios-safari" | "unsupported";

export interface PwaInstallSnapshot {
  installed: boolean;
  canPromptNatively: boolean;
  platform: InstallPlatform;
}

type Listener = () => void;

declare global {
  interface Window {
    __POS_PWA?: { deferred: BeforeInstallPromptEvent | null };
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let platform: InstallPlatform = "unsupported";
let bootstrapped = false;
const listeners = new Set<Listener>();

let snapshot: PwaInstallSnapshot = {
  installed: false,
  canPromptNatively: false,
  platform: "unsupported",
};

export const SERVER_PWA_SNAPSHOT: PwaInstallSnapshot = {
  installed: false,
  canPromptNatively: false,
  platform: "unsupported",
};

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);
  if (isIOS && isSafari) return "ios-safari";

  // Chrome / Edge / Android WebView Chromium — even if the native prompt
  // hasn't fired yet (engagement heuristics), treat as chromium so we show
  // Install steps instead of "open in Chrome".
  const isChromium =
    (/Chrome|CriOS|Edg|EdgiOS|SamsungBrowser/i.test(ua) && !/OPR|Opera|Firefox/i.test(ua)) ||
    !!deferredPrompt;
  if (isChromium) return "chromium";
  return "unsupported";
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

export function bootstrapPwaInstall() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  installed = isStandalone();
  platform = detectPlatform();

  // Pick up prompt captured by the head script before React loaded.
  if (window.__POS_PWA?.deferred) {
    adoptDeferred(window.__POS_PWA.deferred);
  }

  refreshSnapshot();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const ev = e as BeforeInstallPromptEvent;
    if (window.__POS_PWA) window.__POS_PWA.deferred = ev;
    adoptDeferred(ev);
  });

  window.addEventListener("pos-pwa-prompt", () => {
    if (window.__POS_PWA?.deferred) adoptDeferred(window.__POS_PWA.deferred);
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    if (window.__POS_PWA) window.__POS_PWA.deferred = null;
    notify();
  });
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

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  // Re-check window in case the head script got it after our last snapshot.
  if (!deferredPrompt && typeof window !== "undefined" && window.__POS_PWA?.deferred) {
    deferredPrompt = window.__POS_PWA.deferred;
  }
  if (!deferredPrompt) return "unavailable";

  const event = deferredPrompt;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    deferredPrompt = null;
    if (window.__POS_PWA) window.__POS_PWA.deferred = null;
    if (choice.outcome === "accepted") {
      installed = true;
    }
    notify();
    return choice.outcome;
  } catch {
    deferredPrompt = null;
    if (typeof window !== "undefined" && window.__POS_PWA) window.__POS_PWA.deferred = null;
    notify();
    return "unavailable";
  }
}
