"use client";

import { useState } from "react";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product photo with browser-friendly caching. No photo (or a broken one) → a clean food icon,
 * so owners can skip photos completely — uploading one is their choice.
 */
export function ProductImage({
  src,
  alt = "",
  width,
  height,
  className,
  sizes,
}: {
  src: string | null | undefined;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    // Let the caller's classes size it (e.g. w-full + aspect ratio); fixed size only when none are given.
    const sizedByClass = /\b(w-|h-|aspect-|inset-)/.test(className ?? "");
    return (
      <div
        role="img"
        aria-label={alt || "No photo"}
        className={cn("flex items-center justify-center bg-brand-soft/60 text-brand/70", className)}
        style={sizedByClass ? undefined : { width, height }}
      >
        <UtensilsCrossed className="h-2/5 w-2/5 max-h-10 max-w-10" strokeWidth={1.75} />
      </div>
    );
  }

  const isRemote = /^https?:\/\//i.test(src);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      // Local /uploads paths and some CDNs are fine unoptimized; Cloudinary
      // still goes through the optimizer when remote.
      unoptimized={!isRemote}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
