"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAssetFavorite } from "@/app/(dashboard)/library/actions";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  assetId,
  favorite,
}: {
  assetId: string;
  favorite: boolean;
}) {
  const [isFav, setIsFav] = useState(favorite);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      aria-pressed={isFav}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setIsFav((v) => !v);
        const result = await toggleAssetFavorite(assetId);
        setBusy(false);
        if (!result.ok) {
          setIsFav((v) => !v);
          return;
        }
        router.refresh();
      }}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      <Star
        className={cn("size-4", isFav && "fill-amber-400 text-amber-400")}
        aria-hidden
      />
    </button>
  );
}
