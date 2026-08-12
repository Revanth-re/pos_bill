"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product photo with broken-URL fallback and browser-friendly caching. */
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
    return (
      <div
        className={cn("flex items-center justify-center bg-paper text-muted", className)}
        style={{ width, height }}
      >
        <Package className="h-1/3 w-1/3 max-h-8 max-w-8" />
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
