"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GalleryImage {
  imageUrl: string;
  name: string;
}

export function ImagePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

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
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/products/gallery");
      const body = await res.json();
      setGallery(body.images ?? []);
    } finally {
      setGalleryLoading(false);
    }
  }

  return (
    <div>
      <label className="field-label">Product photo</label>

      {value ? (
        <div className="relative inline-block border-2 border-border">
          {/* Uploaded/gallery images are same-origin static files, so a plain
             <Image> with a fixed size is simplest and avoids remote-pattern
             config for what is, functionally, local storage. */}
          <Image src={value} alt="Product" width={120} height={120} className="h-[120px] w-[120px] object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white touch-target"
            style={{ minHeight: "auto" }}
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="inline-flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload Photo"}
            </span>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={openGallery}>
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" />
              Choose Existing
            </span>
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      <p className="mt-1 text-sm text-muted">JPG, PNG, or WEBP — up to 5MB. Optional, but helps cashiers pick the right item fast.</p>

      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-bold text-ink">Choose a photo</h3>
              <button
                onClick={() => setGalleryOpen(false)}
                className="touch-target rounded-full p-2 hover:bg-paper"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {galleryLoading && <p className="text-sm text-muted">Loading…</p>}
              {!galleryLoading && gallery.length === 0 && (
                <p className="text-sm text-muted">No photos uploaded yet — upload one from the previous screen.</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <button
                    key={img.imageUrl}
                    type="button"
                    onClick={() => {
                      onChange(img.imageUrl);
                      setGalleryOpen(false);
                    }}
                    className="border-2 border-border hover:border-brand touch-target"
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.name}
                      width={100}
                      height={100}
                      className="h-[100px] w-full object-cover"
                     
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
