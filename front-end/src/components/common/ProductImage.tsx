import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  images: string[];
  alt: string;
  /** Enable hover-swap to second image (desktop). */
  hoverSwap?: boolean;
  className?: string;
  aspect?: "square" | "portrait";
}

/**
 * Premium product image with:
 * - Loading skeleton
 * - Error fallback
 * - Smooth fade hover-swap to secondary image
 * - Subtle zoom on hover
 */
export function ProductImage({
  images,
  alt,
  hoverSwap = true,
  className,
  aspect = "square",
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const main = images[0];
  const alt2 = images[1] ?? images[0];
  const hasImage = typeof main === "string" && main.trim().length > 0;
  const hasAlt = hasImage && hoverSwap && images.length > 1;

  return (
    <div
      className={cn(
        "group/img relative overflow-hidden bg-muted",
        aspect === "square" ? "aspect-square" : "aspect-[4/5]",
        className,
      )}
    >
      {!loaded && !error && <Skeleton className="absolute inset-0" />}
      {error || !hasImage ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
          <ImageOff className="h-6 w-6" />
          <span className="text-xs">Imagem indisponível</span>
        </div>
      ) : (
        <>
          <img
            src={main}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
              loaded ? "opacity-100" : "opacity-0",
              hasAlt && "group-hover/img:opacity-0 group-hover/img:scale-105",
              !hasAlt && "group-hover/img:scale-105",
            )}
          />
          {hasAlt && (
            <img
              src={alt2}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 scale-105 transition-all duration-700 ease-out group-hover/img:opacity-100 group-hover/img:scale-100"
            />
          )}
        </>
      )}
    </div>
  );
}
