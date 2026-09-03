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
import { createVideo } from "@/app/(dashboard)/clips/actions";
import { Plus } from "lucide-react";

const formSchema = z.object({
  sourceUrl: z.string().url("Enter a valid video URL"),
  title: z.string().trim().max(200).optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function ImportVideoDialog() {
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
    defaultValues: { sourceUrl: "", title: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await createVideo({
      sourceUrl: values.sourceUrl,
      title: values.title || undefined,
    });
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
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Import video
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import a source video</DialogTitle>
          <DialogDescription>
            Paste a link to a long-form video. Detection is mocked for now — no real processing happens.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sourceUrl">Video URL *</Label>
            <Input
              id="sourceUrl"
              placeholder="https://youtube.com/watch?v=…"
              type="url"
              {...register("sourceUrl")}
            />
            {errors.sourceUrl ? (
              <p className="text-xs text-destructive">{errors.sourceUrl.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Ep. 42 — Full interview" {...register("title")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Importing…" : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
