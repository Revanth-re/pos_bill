"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, ImageIcon, X, Search, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { FOOD_LIBRARY, suggestLibraryImage } from "@/lib/foodLibrary";
import { cn } from "@/lib/utils";

interface GalleryImage {
  imageUrl: string;
  name: string;
}

export function ImagePicker({
  value,
  onChange,
  productName = "",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Used to suggest a matching photo from the Billo food library. */
  productName?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mine, setMine] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [search, setSearch] = useState("");

  const suggestion = useMemo(() => suggestLibraryImage(productName), [productName]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/products/upload-image", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Upload failed.");
        return;
      }
      onChange(body.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function openGallery() {
    setGalleryOpen(true);
    setSearch(productName.trim().split(/\s+/).slice(-1)[0] ?? "");
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/products/gallery");
      const body = await res.json();
      setMine(body.images ?? []);
    } catch {
      /* library still works offline — it ships with the app */
    } finally {
      setGalleryLoading(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filterFn = (img: GalleryImage) => !q || img.name.toLowerCase().includes(q);
  const mineShown = mine.filter(filterFn);
  const libraryShown = FOOD_LIBRARY.filter((img) => !q || img.name.toLowerCase().includes(q) || img.keywords.some((k) => k.includes(q)));

  function pick(url: string) {
    onChange(url);
    setGalleryOpen(false);
  }

  return (
    <div>
      <label className="field-label">Product photo</label>

      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative">
            <ProductImage src={value} alt="Product" width={128} height={80} className="h-20 w-32 rounded-xl object-cover ring-1 ring-border" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow-sm"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={openGallery}>
            <ImageIcon className="h-4 w-4" /> Change
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestion && (
            <button
              type="button"
              onClick={() => onChange(suggestion.imageUrl)}
              className="flex w-full items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft/50 p-2 text-left transition-colors hover:bg-brand-soft"
            >
              <ProductImage src={suggestion.imageUrl} alt={suggestion.name} width={64} height={40} className="h-10 w-16 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-xs font-semibold text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> Suggested photo
                </span>
                <span className="block truncate text-sm font-semibold text-ink">{suggestion.name}</span>
              </span>
              <span className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Use</span>
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={openGallery}>
              <ImageIcon className="h-4 w-4" /> Choose photo
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {!value && <p className="mt-1.5 text-xs text-muted">Pick from {FOOD_LIBRARY.length}+ ready food photos, or upload your own (JPG/PNG/WEBP, up to 5MB).</p>}

      {galleryOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => setGalleryOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="toast-enter flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-surface shadow-lg sm:max-w-[640px] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="text-lg font-bold text-ink">Choose a photo</h3>
              <button type="button" onClick={() => setGalleryOpen(false)} className="touch-target rounded-full p-2 hover:bg-paper" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand-soft">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dosa, biryani, tea…"
                  className="min-h-11 flex-1 bg-transparent text-sm outline-none"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-xs font-semibold text-brand">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {(galleryLoading || mineShown.length > 0) && (
                <Section title="Your photos">
                  {galleryLoading ? (
                    <p className="col-span-full text-sm text-muted">Loading…</p>
                  ) : (
                    mineShown.map((img) => <Tile key={img.imageUrl} img={img} selected={value === img.imageUrl} onPick={pick} />)
                  )}
                </Section>
              )}
              <Section title="Billo food library">
                {libraryShown.length === 0 ? (
                  <p className="col-span-full text-sm text-muted">No match — try another word or upload your own photo.</p>
                ) : (
                  libraryShown.map((img) => <Tile key={img.imageUrl} img={img} selected={value === img.imageUrl} onPick={pick} />)
                )}
              </Section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

function Tile({ img, selected, onPick }: { img: GalleryImage; selected: boolean; onPick: (url: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(img.imageUrl)}
      className={cn(
        "group relative overflow-hidden rounded-xl text-left ring-1 transition-all duration-150 hover:shadow-md active:scale-[0.98]",
        selected ? "ring-2 ring-brand" : "ring-border hover:ring-brand/50"
      )}
    >
      <ProductImage src={img.imageUrl} alt={img.name} width={200} height={125} className="aspect-[16/10] h-auto w-full object-cover" />
      <span className="block truncate px-2 py-1.5 text-xs font-semibold text-ink">{img.name}</span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
