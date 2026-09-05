"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;

function typeAllowed(type: string): boolean {
  return (
    type.startsWith("video/") ||
    type.startsWith("image/") ||
    type.startsWith("audio/") ||
    type === "application/pdf"
  );
}

/** Client-side pre-check mirrors the server; the server stays authoritative. */
function clientErrorFor(file: File): string | null {
  if (file.size === 0) return "Empty files can't be uploaded.";
  if (file.size > MAX_UPLOAD_BYTES) return "File exceeds the 512 MB limit.";
  if (!typeAllowed(file.type)) return "File type not supported.";
  return null;
}

type UploadState = { busy: boolean; progress: number; error: string | null };

function useUpload() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ busy: false, progress: 0, error: null });
  const seq = useRef(0);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      for (const file of files) {
        const clientError = clientErrorFor(file);
        if (clientError) {
          setState({ busy: false, progress: 0, error: clientError });
          continue;
        }
        const id = ++seq.current;
        setState({ busy: true, progress: 0, error: null });

        const result = await new Promise<string | null>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/content");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              if (seq.current === id) setState((s) => ({ ...s, progress: pct }));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(null);
            } else {
              let msg = "Upload failed.";
              try {
                const body = JSON.parse(xhr.responseText);
                if (typeof body.error === "string") msg = body.error;
              } catch {
                /* keep default */
              }
              resolve(msg);
            }
          };
          xhr.onerror = () => resolve("Upload failed — is the server reachable?");
          const form = new FormData();
          form.append("file", file);
          xhr.send(form);
        });

        if (seq.current !== id) return; // superseded by a newer run
        if (result) {
          setState({ busy: false, progress: 0, error: result });
          return;
        }
        setState({ busy: false, progress: 0, error: null });
        router.refresh();
      }
    },
    [router]
  );

  return { state, upload };
}

export function UploadButton({ className }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, upload } = useUpload();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = ""; // allow re-selecting the same file
          if (files.length) void upload(files);
        }}
      />
      <Button
        size="sm"
        disabled={state.busy}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        <Upload className="size-3.5" aria-hidden />
        {state.busy ? `Uploading… ${state.progress}%` : "Upload"}
      </Button>
    </>
  );
}

/** Full-bleed drag-and-drop zone for empty states and page-level drops. */
export function UploadDropTarget({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { state, upload } = useUpload();
  const dragDepth = useRef(0);

  return (
    <div
      className={cn("relative", dragOver && "rounded-lg ring-2 ring-primary/40", className)}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current++;
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current--;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter(
          (f) => !clientErrorFor(f) // silently ignore invalid drops
        );
        if (files.length) void upload(files);
      }}
    >
      {state.busy || state.error ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs shadow-sm">
          {state.error ? (
            <span className="text-destructive">{state.error}</span>
          ) : (
            <>
              <span className="text-muted-foreground">Uploading…</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </>
          )}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          if (files.length) void upload(files);
        }}
      />
      {children}
    </div>
  );
}
