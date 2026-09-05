"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type PreviewAsset = {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

function downloadUrl(id: string) {
  return `/api/content/${id}/download`;
}

function MediaBody({ asset }: { asset: PreviewAsset }) {
  const mime = asset.mimeType ?? "";
  const src = `/api/content/${asset.id}/preview`;

  if (mime.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={asset.name} className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" />;
  }
  if (mime.startsWith("video/")) {
    return (
      <video controls playsInline preload="metadata" className="mx-auto max-h-[70vh] max-w-full rounded-lg">
        <source src={src} type={mime} />
        Your browser does not support video playback.
      </video>
    );
  }
  if (mime.startsWith("audio/")) {
    return (
      <div className="py-6">
        <audio controls preload="metadata" className="w-full" src={src}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }
  if (mime === "application/pdf") {
    return <iframe src={src} title={asset.name} className="h-[70vh] w-full rounded-lg border border-border" />;
  }
  return null;
}

export function PreviewDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: PreviewAsset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mime = asset.mimeType ?? "";
  const unsupported = !(
    mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/") || mime === "application/pdf"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="break-words pr-8">{asset.name}</DialogTitle>
          {unsupported ? (
            <DialogDescription>
              This file type cannot be previewed in the browser.
            </DialogDescription>
          ) : (
            <DialogDescription>
              {asset.mimeType ?? "Unknown type"}
              {asset.sizeBytes != null ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
            </DialogDescription>
          )}
        </DialogHeader>
        {unsupported ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>{asset.name}</p>
            <p className="mt-1">
              {asset.mimeType ?? "Unknown type"}
              {asset.sizeBytes != null ? ` · ${formatBytes(asset.sizeBytes)}` : ""}
            </p>
          </div>
        ) : (
          <MediaBody asset={asset} />
        )}
        <div className="flex justify-end">
          <Button size="sm" variant="outline" render={<a href={downloadUrl(asset.id)} />}>
            <Download className="size-3.5" aria-hidden />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(n: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
