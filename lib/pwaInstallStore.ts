/** Native PWA install — capture `beforeinstallprompt` early, call
 * `prompt()` only from a direct user tap (no awaits before it). */

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

function syncFromWindow() {
  if (typeof window === "undefined") return;
  if (window.__POS_PWA?.deferred) {
    adoptDeferred(window.__POS_PWA.deferred);
  }
}

export function bootstrapPwaInstall() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  installed = isStandalone();
  platform = detectPlatform();
  syncFromWindow();
  refreshSnapshot();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const ev = e as BeforeInstallPromptEvent;
    if (!window.__POS_PWA) window.__POS_PWA = { deferred: null };
    window.__POS_PWA.deferred = ev;
    adoptDeferred(ev);
  });

  window.addEventListener("pos-pwa-prompt", () => syncFromWindow());

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

/**
 * IMPORTANT: call this directly from a click handler with no awaits before it.
 * Chrome requires `prompt()` inside a user gesture; awaiting SW/network first
 * kills that gesture and the install dialog never appears.
 */
export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  syncFromWindow();
  if (!deferredPrompt) return "unavailable";

  const event = deferredPrompt;
  // Clear before awaiting so a second tap doesn't double-call a spent event.
  deferredPrompt = null;
  if (typeof window !== "undefined" && window.__POS_PWA) {
    window.__POS_PWA.deferred = null;
  }
  refreshSnapshot();
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
