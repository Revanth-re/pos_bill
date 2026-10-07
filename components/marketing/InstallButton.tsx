"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, Share, X, PlusSquare, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/marketing/site";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { InstallHelpSheet } from "@/components/pwa/InstallHelpSheet";

/**
 * "Get Billo" — the website and the billing app now live on the SAME address,
 * so this installs the real Billo app directly:
 *  • Android / desktop Chrome & Edge → native install prompt on the first tap
 *  • iPhone → "Share → Add to Home Screen" steps
 *  • Already installed / not installable here → opens the app
 */
export function InstallButton({ className = "", label = "Get Billo", iconClass = "h-4 w-4" }: { className?: string; label?: string; iconClass?: string }) {
  const { installed, canPromptNatively, promptInstall } = usePwaInstall();
  const [help, setHelp] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (installed) {
      window.location.href = SITE.loginUrl;
      return;
    }
    if (canPromptNatively) {
      // Chrome already allowed install → native prompt on this very tap.
      const outcome = await promptInstall();
      if (outcome === "accepted") setDone(true);
      if (outcome !== "unavailable") return;
    }
    // Not allowed yet / iPhone / in-app browser → guided sheet (waits for Chrome + manual steps).
    setHelp(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <Download className={iconClass} /> {label}
      </button>

      <InstallHelpSheet open={help} onClose={() => setHelp(false)} onInstalled={() => { setHelp(false); setDone(true); }} />
      {done && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setDone(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rise w-full max-w-sm rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src="/brand/billo-icon.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl ring-1 ring-border" />
                <div>
                  <p className="text-lg font-extrabold text-ink">{done ? "Billo installed" : "Install Billo"}</p>
                  <p className="text-sm text-muted">{done ? "Find it on your home screen" : "Add to your iPhone home screen"}</p>
                </div>
              </div>
              <button onClick={() => setDone(false)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-paper" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {done ? (
              <>
                <p className="mt-5 flex items-center gap-2 rounded-xl bg-brand-soft/60 p-3 text-sm font-semibold text-brand-dark">
                  <CheckCircle2 className="h-5 w-5 text-success" /> Tap the Billo icon anytime to start billing.
                </p>
                <a href={SITE.loginUrl} className="btn btn-primary mt-4 w-full">Open Billo now</a>
                <p className="mt-3 text-center text-xs text-muted">Next time, open Billo from the icon on your home screen.</p>
              </>
            ) : (
              <ol className="mt-5 space-y-3 text-[15px] text-ink">
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">1</span> Tap <Share className="mx-1 inline h-5 w-5 text-brand" /> <b>Share</b> in Safari</li>
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">2</span> Choose <PlusSquare className="mx-1 inline h-5 w-5 text-brand" /> <b>Add to Home Screen</b></li>
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">3</span> Tap <b>Add</b> — done!</li>
              </ol>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
