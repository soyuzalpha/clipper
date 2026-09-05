"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importAssetFromUrl } from "@/app/(dashboard)/library/actions";
import { Link2 } from "lucide-react";

const formSchema = z.object({
  url: z.string().trim().url("Enter a valid URL"),
  name: z.string().trim().max(200).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** Import a media file from a direct URL (downloaded server-side). */
export function ImportUrlDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "", name: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await importAssetFromUrl({ url: values.url, name: values.name || undefined });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Link2 className="size-3.5" aria-hidden />
            Import URL
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from URL</DialogTitle>
          <DialogDescription>
            Paste a direct link to a video, image, audio file, or PDF. The file is downloaded
            and stored on your server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asset-url">File URL *</Label>
            <Input
              id="asset-url"
              placeholder="https://example.com/clip.mp4"
              type="url"
              {...register("url")}
            />
            {errors.url ? <p className="text-xs text-destructive">{errors.url.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input id="asset-name" placeholder="Optional — defaults to the file name" {...register("name")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Downloading…" : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
