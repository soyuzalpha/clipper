"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAsset } from "@/app/(dashboard)/library/actions";
import { PreviewDialog, type PreviewAsset } from "./preview-dialog";
import { Eye, Trash2, Loader2, Download } from "lucide-react";

/** Per-card actions: preview (dialog), download (route), delete (action). */
export function AssetCardActions({ asset }: { asset: PreviewAsset }) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!window.confirm(`Delete "${asset.name}"? The stored file will be removed.`)) return;
    setDeleting(true);
    const result = await deleteAsset(asset.id);
    setDeleting(false);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => setPreviewOpen(true)}
        aria-label={`Preview ${asset.name}`}
        title="Preview"
      >
        <Eye className="size-3" aria-hidden />
      </Button>
      <Button
        size="xs"
        variant="ghost"
        render={<a href={`/api/content/${asset.id}/download`} aria-label={`Download ${asset.name}`} title="Download" />}
      >
        <Download className="size-3" aria-hidden />
      </Button>
      <Button
        size="xs"
        variant="ghost"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${asset.name}`}
        title="Delete"
        className="text-destructive hover:text-destructive"
      >
        {deleting ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Trash2 className="size-3" aria-hidden />}
      </Button>
      <PreviewDialog asset={asset} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
