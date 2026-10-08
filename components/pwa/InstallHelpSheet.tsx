"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share, PlusSquare, MoreVertical, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export const LOGIN_PATH = "/login";

/** After install → straight to the app's login page (same domain, relative = never an old URL). */
export function goToLogin() {
  window.location.assign(LOGIN_PATH);
}

/**
 * One install sheet for the whole product. Opens only when Chrome hasn't handed us the
 * install prompt yet: it shows "Preparing…" and fires the native install dialog by itself
 * the moment Chrome allows it (or the user taps "Install now"). On install → /login.
 */
export function InstallHelpSheet({ open, onClose, onInstalled }: { open: boolean; onClose: () => void; onInstalled?: () => void }) {
  const { installed, canPromptNatively, platform, secureContext, promptInstall } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);
  const [env, setEnv] = useState<{ ios: boolean; inApp: boolean }>({ ios: false, inApp: false });

  useEffect(() => {
    if (!open) {
      tried.current = false;
      return;
    }
    const ua = navigator.userAgent;
    const id = setTimeout(
      () =>
        setEnv({
          ios: /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document),
          inApp: /FBAN|FBAV|Instagram|Line\/|; wv\)|WhatsApp/i.test(ua),
        }),
      0
    );
    return () => clearTimeout(id);
  }, [open]);

  async function install() {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        onInstalled?.();
        goToLogin();
      }
    } finally {
      setBusy(false);
    }
  }

  // Chrome just became ready while the sheet is open → show the native dialog automatically.
  useEffect(() => {
    if (!open || !canPromptNatively || tried.current) return;
    tried.current = true;
    const id = setTimeout(() => void install(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canPromptNatively]);

  if (!open || typeof document === "undefined") return null;

  const ios = env.ios || platform === "ios-safari";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="toast-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-left shadow-2xl sm:max-w-[420px] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/brand/billo-icon.png" alt="" width={52} height={52} className="h-13 w-13 rounded-2xl ring-1 ring-[#E5E7E7]" />
            <div>
              <p className="text-lg font-extrabold text-[#172020]">Install Billo</p>
              <p className="text-sm text-[#647474]">Full-screen app on your home screen</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#FAFAF7]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {installed ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#D9F0EF] p-3 text-sm font-semibold text-[#06484C]">
            <CheckCircle2 className="h-5 w-5 text-[#16803C]" /> Billo is installed — open it from your home screen.
          </p>
        ) : !secureContext ? (
          <p className="mt-5 rounded-xl bg-[#fbe9e9] p-3 text-sm text-[#C62828]">Open this site with https:// to install.</p>
        ) : env.inApp ? (
          <div className="mt-5 space-y-3 text-[15px] text-[#172020]">
            <p className="rounded-xl bg-[#fdf6cc] p-3 text-sm font-medium">This page is open inside another app. Open it in Chrome to install Billo.</p>
            <Step n={1}>Tap <MoreVertical className="mx-0.5 inline h-4 w-4" /> or <ExternalLink className="mx-0.5 inline h-4 w-4" /> at the top</Step>
            <Step n={2}>Choose <b>Open in Chrome</b></Step>
            <Step n={3}>Tap <b>Get Billo</b> again</Step>
          </div>
        ) : ios ? (
          <div className="mt-5 space-y-3 text-[15px] text-[#172020]">
            <p className="rounded-xl bg-[#fdf6cc] p-3 text-sm font-medium">iPhone doesn&apos;t allow one-tap install. 3 quick taps:</p>
            <Step n={1}>Tap <Share className="mx-0.5 inline h-5 w-5 text-[#075E63]" /> <b>Share</b> in Safari</Step>
            <Step n={2}>Choose <PlusSquare className="mx-0.5 inline h-5 w-5 text-[#075E63]" /> <b>Add to Home Screen</b></Step>
            <Step n={3}>Tap <b>Add</b> — done!</Step>
          </div>
        ) : (
          <>
            <button
              onClick={install}
              disabled={!canPromptNatively || busy}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#075E63] px-4 text-base font-bold text-white shadow-md transition-colors hover:bg-[#06484C] disabled:bg-[#D9F0EF] disabled:text-[#06484C] disabled:shadow-none"
            >
              {canPromptNatively ? (
                busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Download className="h-5 w-5" /> Install now</>
              ) : (
                <><Loader2 className="h-5 w-5 animate-spin" /> Preparing install…</>
              )}
            </button>
            {!canPromptNatively && (
              <p className="mt-2 text-center text-xs text-[#647474]">The install popup opens by itself in a few seconds.</p>
            )}
          </>
        )}

        <a href={LOGIN_PATH} className="mt-4 block text-center text-sm font-semibold text-[#075E63] hover:underline">
          Already installed? Continue to login →
        </a>
      </div>
    </div>,
    document.body
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075E63] text-sm font-bold text-white">{n}</span>
      <span>{children}</span>
    </p>
  );
}
