/** Module-level PWA install prompt capture.
 * `beforeinstallprompt` often fires once on first page load — long before
 * the user opens Profile. Keeping the deferred event here (not in a
 * component) means Install still works whenever they tap it. */

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

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let platform: InstallPlatform = "unsupported";
let bootstrapped = false;
const listeners = new Set<Listener>();

/** Cached snapshot — useSyncExternalStore requires a stable Object.is
 * result when nothing changed, or Profile (and any Install card) will
 * infinite-re-render and never paint. */
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
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  if (isIOS && isSafari) return "ios-safari";
  return deferredPrompt ? "chromium" : "unsupported";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
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

export function bootstrapPwaInstall() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  installed = isStandalone();
  platform = detectPlatform();
  refreshSnapshot();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    platform = "chromium";
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
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
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  await event.prompt();
  const choice = await event.userChoice;
  deferredPrompt = null;
  notify();
  return choice.outcome;
}
