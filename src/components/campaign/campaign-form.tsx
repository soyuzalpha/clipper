"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCampaign } from "@/app/(dashboard)/campaigns/actions";

// Form schema — mirrors server action validation.
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  creator: z.string().optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  reward: z.string().optional(),
  deadline: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  format: z.string().optional(),
  audience: z.string().optional(),
  minDurationSec: z.coerce.number().int().positive().optional(),
  maxDurationSec: z.coerce.number().int().positive().optional(),
  requiredCta: z.string().optional(),
  hashtags: z.string().optional(),
  mentions: z.string().optional(),
  prohibitedTopics: z.string().optional(),
  guidelines: z.string().optional(),
  submissionProcedure: z.string().optional(),
  rewardConditions: z.string().optional(),
  sourceMaterial: z.string().optional(),
  campaignUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reels", label: "Instagram Reels" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
];

export function CampaignForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { platforms: [] },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (value: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const splitList = (s?: string) =>
    s
      ? s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    // Split comma lists before submit.
    const payload = {
      ...values,
      platforms: selectedPlatforms,
      hashtags: splitList(values.hashtags),
      mentions: splitList(values.mentions),
    };
    const result = await createCampaign(payload);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Essentials */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="NovaPhone 7 Launch" {...register("name")} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="NovaTech" {...register("brand")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="creator">Creator / person</Label>
            <Input id="creator" placeholder="Marcus Chen" {...register("creator")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reward">Reward</Label>
            <Input id="reward" placeholder="$500 flat + $2 per 1k views" {...register("reward")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="datetime-local" {...register("deadline")} />
          </div>
        </div>
      </section>

      {/* Platforms + targeting */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selectedPlatforms.includes(opt.value)}
                onClick={() => togglePlatform(opt.value)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedPlatforms.includes(opt.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="format">Format</Label>
            <Input id="format" placeholder="talking-head + unboxing" {...register("format")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">Target audience</Label>
            <Input id="audience" placeholder="tech enthusiasts, 18-35" {...register("audience")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="minDurationSec">Min duration (s)</Label>
            <Input id="minDurationSec" type="number" min="0" {...register("minDurationSec")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxDurationSec">Max duration (s)</Label>
            <Input id="maxDurationSec" type="number" min="0" {...register("maxDurationSec")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} placeholder="What the campaign is about" {...register("description")} />
        </div>
      </section>

      {/* Requirements */}
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Required hashtags (comma-separated)</Label>
            <Input id="hashtags" placeholder="#NovaPhone7, #TechReview" {...register("hashtags")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mentions">Required mentions (comma-separated)</Label>
            <Input id="mentions" placeholder="@novatech" {...register("mentions")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="requiredCta">Required CTA</Label>
          <Input id="requiredCta" placeholder="Link in bio" {...register("requiredCta")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prohibitedTopics">Prohibited topics</Label>
          <Input id="prohibitedTopics" placeholder="no competitor mentions" {...register("prohibitedTopics")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guidelines">Content guidelines</Label>
          <Textarea id="guidelines" rows={2} placeholder="Show the device clearly in the first 3 seconds…" {...register("guidelines")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="submissionProcedure">Submission procedure</Label>
            <Input id="submissionProcedure" placeholder="Upload, then submit URLs" {...register("submissionProcedure")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rewardConditions">Reward conditions</Label>
            <Input id="rewardConditions" placeholder="Minimum 50k views for payout" {...register("rewardConditions")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sourceMaterial">Source material</Label>
            <Input id="sourceMaterial" placeholder="Press kit + sample device" {...register("sourceMaterial")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaignUrl">Campaign URL</Label>
            <Input id="campaignUrl" type="url" placeholder="https://…" {...register("campaignUrl")} />
          </div>
        </div>
      </section>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}