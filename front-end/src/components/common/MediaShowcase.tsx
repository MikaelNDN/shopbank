import { cn } from "@/lib/utils";

type MediaSource =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string }
  | { type: "gif"; src: string; alt: string };

interface MediaShowcaseProps {
  media: MediaSource;
  className?: string;
}

/**
 * Reusable media wrapper for hero sections.
 * Accepts image / gif / mp4, so the page can swap media without touching layout.
 *
 * Future replacement examples:
 *   <MediaShowcase media={{ type: "gif", src: "/shopbank.gif", alt: "ShopBank" }} />
 *   <MediaShowcase media={{ type: "video", src: "/shopbank.mp4" }} />
 */
export function MediaShowcase({ media, className }: MediaShowcaseProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-[0_30px_80px_-20px_rgba(99,102,241,0.45)]",
        "transition-transform duration-500 ease-out hover:scale-[1.02]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl",
        "before:bg-[radial-gradient(120%_80%_at_50%_0%,rgba(168,85,247,0.25),transparent_60%)]",
        className,
      )}
    >
      {/* Glow ring */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-fuchsia-400/30 via-transparent to-cyan-400/20" />

      <div className="relative aspect-square w-full">
        {media.type === "video" ? (
          <video
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={media.src}
            alt={"alt" in media ? media.alt : ""}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
