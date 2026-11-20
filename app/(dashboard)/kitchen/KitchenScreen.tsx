"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChefHat, Check, Flame, Maximize2, Minimize2, Volume2, VolumeX, Undo2, WifiOff, Clock, LogOut, HandPlatter, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";
import { kt } from "./kitchenText";
import { logoutEverywhere } from "@/lib/auth/deviceData";

type Status = "NEW" | "COOKING" | "READY" | "SERVED";
type Order = {
  id: string;
  token: number;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";
  label: string | null;
  items: { name: string; alias: string | null; qty: number }[];
  status: Status;
  statusAt: string | null;
};

const POLL_MS = 4000;
const LANG_KEY = "billo-kitchen-lang";
const LANES: Status[] = ["NEW", "COOKING", "READY"];
const NEXT: Record<Status, Status | null> = { NEW: "COOKING", COOKING: "READY", READY: "SERVED", SERVED: null };
const PREV: Record<Status, Status | null> = { NEW: null, COOKING: "NEW", READY: "COOKING", SERVED: "READY" };

/**
 * Kitchen Display. Bills appear as orders: New → Cooking → Ready → Served.
 * Kitchen staff (KITCHEN role) see only this screen; owners/cashiers open it from the menu.
 */
export function KitchenScreen({ kitchenOnly, userName }: { kitchenOnly: boolean; userName: string }) {
  const { language: shopLang } = useLanguage();
  const [lang, setLang] = useState<LanguageCode>(shopLang);
  const t = useMemo(() => kt(lang), [lang]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [served, setServed] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sound, setSound] = useState(false);
  const [full, setFull] = useState(false);
  const [tab, setTab] = useState<Status>("NEW");
  const [now, setNow] = useState(() => Date.now());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [struck, setStruck] = useState<Record<string, boolean>>({});
  const seen = useRef<Set<string> | null>(null);
  const pendingSave = useRef<Map<string, Status>>(new Map());
  const audio = useRef<AudioContext | null>(null);
  const soundOn = useRef(false);

  // The chef's own language choice (this device only).
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {
      /* private mode */
    }
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      const id = setTimeout(() => setLang(saved as LanguageCode), 0);
      return () => clearTimeout(id);
    }
  }, []);
  function pickLang(code: LanguageCode) {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* ignore */
    }
  }

  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx || !soundOn.current) return;
    const t0 = ctx.currentTime;
    [0, 0.22].forEach((d, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = i ? 1175 : 880;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.22);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login?callbackUrl=/kitchen";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data: { orders: Order[]; served: Order[] } = await res.json();
      // Keep taps that are still saving, so a poll never flips a card back.
      const apply = (o: Order): Order => (pendingSave.current.has(o.id) ? { ...o, status: pendingSave.current.get(o.id)! } : o);
      const all = [...data.orders, ...data.served].map(apply);
      setOrders(all.filter((o) => o.status !== "SERVED"));
      setServed(all.filter((o) => o.status === "SERVED").slice(0, 15));

      if (seen.current) {
        const added = data.orders.filter((o) => !seen.current!.has(o.id)).map((o) => o.id);
        if (added.length) {
          beep();
          setFresh(new Set(added));
          setTimeout(() => setFresh(new Set()), 8000);
        }
      }
      seen.current = new Set(all.map((o) => o.id));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoaded(true);
    }
  }, [beep]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 15000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  // Keep the kitchen screen awake.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const get = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen");
      } catch {
        /* not supported */
      }
    };
    get();
    document.addEventListener("visibilitychange", get);
    return () => {
      document.removeEventListener("visibilitychange", get);
      lock?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleSound() {
    if (!audio.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) audio.current = new AC();
    }
    audio.current?.resume().catch(() => {});
    soundOn.current = !sound;
    setSound(!sound);
    if (!sound) setTimeout(beep, 50);
  }

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  async function move(order: Order, status: Status) {
    pendingSave.current.set(order.id, status);
    const moved = { ...order, status, statusAt: new Date().toISOString() };
    if (status === "SERVED") {
      setOrders((o) => o.filter((x) => x.id !== order.id));
      setServed((s) => [moved, ...s.filter((x) => x.id !== order.id)].slice(0, 15));
    } else {
      setServed((s) => s.filter((x) => x.id !== order.id));
      setOrders((o) => [...o.filter((x) => x.id !== order.id), moved].sort((a, b) => a.token - b.token));
    }
    try {
      const res = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: order.id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOffline(true);
    } finally {
      pendingSave.current.delete(order.id);
      load();
    }
  }

  const byLane = (s: Status) => orders.filter((o) => o.status === s);
  const counts = { NEW: byLane("NEW").length, COOKING: byLane("COOKING").length, READY: byLane("READY").length, SERVED: 0 };

  // Total of each item still to make (New + Cooking) — the chef's prep list.
  const summary = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) if (o.status === "NEW" || o.status === "COOKING") for (const it of o.items) m.set(it.name, (m.get(it.name) ?? 0) + it.qty);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const mins = (iso: string) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

  const laneStyle: Record<Status, { title: string; dot: string }> = {
    NEW: { title: t("new"), dot: "bg-sky-400" },
    COOKING: { title: t("cooking"), dot: "bg-amber-400" },
    READY: { title: t("ready"), dot: "bg-emerald-400" },
    SERVED: { title: t("served"), dot: "bg-white/40" },
  };

  function renderCard(o: Order) {
    const m = mins(o.createdAt);
    const tone = m >= 15 ? "bg-red-600" : m >= 8 ? "bg-amber-500" : "bg-emerald-600";
    const next = NEXT[o.status];
    const prev = PREV[o.status];
    const action =
      o.status === "NEW"
        ? { label: t("startCooking"), icon: Flame, cls: "bg-amber-500 text-white" }
        : o.status === "COOKING"
          ? { label: t("markReady"), icon: Check, cls: "bg-emerald-600 text-white" }
          : { label: t("served"), icon: HandPlatter, cls: "bg-brand text-white" };
    const Ico = action.icon;
    return (
      <div key={o.id} className={`flex flex-col overflow-hidden rounded-2xl bg-white text-ink shadow-lg ${fresh.has(o.id) ? "ring-4 ring-accent" : ""}`}>
        <div className={`flex items-center justify-between px-4 py-2 text-white ${o.status === "READY" ? "bg-emerald-700" : tone}`}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{t("token")}</p>
            <p className="text-4xl font-black leading-none tabular">{o.token}</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-lg font-extrabold tabular">
              <Clock className="h-4 w-4" /> {m} {t("min")}
            </p>
            <p className="text-xs font-bold opacity-95">
              {o.type === "DINE_IN" ? t("dineIn") : t("takeaway")}
              {o.label ? ` · ${o.label}` : ""}
            </p>
          </div>
        </div>
        <ul className="flex-1 divide-y divide-border px-2">
          {o.items.map((it, i) => {
            const k = `${o.id}:${i}`;
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setStruck((s) => ({ ...s, [k]: !s[k] }))}
                  className={`flex w-full items-center gap-3 px-2 py-2 text-left ${struck[k] ? "opacity-40 line-through" : ""}`}
                >
                  <span className="min-w-10 rounded-lg bg-brand-soft px-2 py-0.5 text-center text-xl font-black text-brand-dark tabular">{fmtQty(it.qty)}</span>
                  <span className="leading-tight">
                    <span className="block text-xl font-bold">{it.name}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2 border-t border-border p-2">
          {prev && (
            <button
              type="button"
              onClick={() => move(o, prev)}
              className="flex min-h-12 items-center justify-center rounded-xl border border-border px-3 text-muted active:scale-95"
              aria-label={t("back")}
              title={t("back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {next && (
            <button type="button" onClick={() => move(o, next)} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl text-lg font-extrabold active:scale-95 ${action.cls}`}>
              <Ico className="h-6 w-6" /> {action.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderLane(s: Status, wide?: boolean) {
    const list = byLane(s);
    return list.length === 0 ? (
      <p className="py-10 text-center text-sm text-white/40">{t("empty")}</p>
    ) : (
      <div className={`grid gap-3 ${wide ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {list.map((o) => renderCard(o))}
      </div>
    );
  }

  return (
    <div
      // Full screen for everyone: covers the app menus, so the kitchen sees only orders.
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto text-white"
      // Inline so the dark kitchen background never depends on a generated CSS class.
      style={{ backgroundColor: "#0f1716", color: "#fff" }}
    >
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        {!kitchenOnly && (
          <a href="/dashboard" className="flex min-h-10 items-center rounded-xl bg-white/10 px-3" aria-label={t("back")} title={t("back")}>
            <ArrowLeft className="h-4 w-4" />
          </a>
        )}
        <ChefHat className="h-6 w-6 text-accent" />
        <h1 className="text-lg font-extrabold">{t("kitchen")}</h1>
        <span className="rounded-lg bg-accent px-2.5 py-0.5 text-sm font-extrabold text-brand-deep">
          {counts.NEW + counts.COOKING} {t("toCook")}
        </span>
        {offline && (
          <span className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-200">
            <WifiOff className="h-3.5 w-3.5" /> {t("reconnecting")}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={lang}
            onChange={(e) => pickLang(e.target.value as LanguageCode)}
            aria-label="Language"
            className="min-h-10 rounded-xl border-0 bg-white/10 px-2 text-sm font-bold text-white [&>option]:text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSound}
            className={`flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold ${sound ? "bg-accent text-brand-deep" : "bg-white/10 text-white ring-1 ring-accent/60"}`}
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{sound ? t("soundOn") : t("soundOff")}</span>
          </button>
          <button type="button" onClick={toggleFull} className="flex min-h-10 items-center rounded-xl bg-white/10 px-3" aria-label="Full screen">
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {kitchenOnly && (
            <button
              type="button"
              onClick={() => logoutEverywhere(signOut)}
              className="flex min-h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-bold"
              title={userName}
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t("logout")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Prep list: total of each item to make */}
      {summary.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 px-3 py-2 sm:px-4">
          <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-white/60">{t("itemsToMake")}</span>
          {summary.map(([name, qty]) => (
            <span key={name} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-base font-bold">
              <span className="text-accent tabular">{fmtQty(qty)}×</span> {name}
            </span>
          ))}
        </div>
      )}

      {!loaded ? (
        <p className="py-20 text-center text-white/60">{t("loading")}</p>
      ) : orders.length === 0 ? (
        <div className="flex-1 py-20 text-center">
          <ChefHat className="mx-auto h-14 w-14 text-white/25" />
          <p className="mt-3 text-xl font-bold">{t("noOrders")}</p>
          <p className="mt-1 text-white/60">{t("noOrdersSub")}</p>
        </div>
      ) : (
        <>
          {/* Phone / small tablet: tabs */}
          <div className="flex gap-1 px-3 pt-3 lg:hidden">
            {LANES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTab(s)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold ${tab === s ? "bg-white text-ink" : "bg-white/10 text-white"}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${laneStyle[s].dot}`} />
                {laneStyle[s].title}
                <span className="tabular">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 lg:hidden">
            {renderLane(tab, true)}
          </div>

          {/* Big screen: 3 columns */}
          <div className="hidden min-h-0 flex-1 grid-cols-3 gap-4 p-4 lg:grid">
            {LANES.map((s) => (
              <section key={s} className="flex min-h-0 flex-col rounded-2xl bg-white/5">
                <h2 className="flex items-center gap-2 px-4 py-3 text-base font-extrabold">
                  <span className={`h-3 w-3 rounded-full ${laneStyle[s].dot}`} /> {laneStyle[s].title}
                  <span className="ml-auto rounded-lg bg-white/10 px-2 py-0.5 tabular">{counts[s]}</span>
                </h2>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                  {renderLane(s)}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* Served today — tap to bring back */}
      {served.length > 0 && (
        <div className="border-t border-white/10 px-3 py-2.5 sm:px-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/60">{t("servedRecent")}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {served.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => move(o, "READY")}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-lg font-black tabular text-white hover:bg-white/15"
              >
                {o.token} <Undo2 className="h-4 w-4 text-white/60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function fmtQty(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(q < 1 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
}
