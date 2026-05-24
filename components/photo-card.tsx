import Image from "next/image";
import { Button } from "@/components/ui/button";
import { thumb } from "@/lib/cloudinary-thumb";

export function PhotoCard({
  url,
  alt,
  hookable = false,
  onHook
}: {
  url: string;
  alt: string;
  hookable?: boolean;
  onHook?: () => void;
}) {
  return (
    <figure className="card-line overflow-hidden">
      <div className="relative aspect-[4/5] bg-tint">
        <Image
          src={thumb(url, 600)}
          alt={alt}
          fill
          sizes="(min-width:1024px) 480px, 90vw"
          className="object-cover"
        />
      </div>
      {hookable && (
        <figcaption className="flex items-center justify-between px-5 py-4 border-t border-hairline">
          <span className="text-xs text-muted">Hook this photo</span>
          <Button variant="ink" onClick={onHook}>Hook</Button>
        </figcaption>
      )}
    </figure>
  );
}
