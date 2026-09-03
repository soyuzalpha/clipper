import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  Lightbulb,
  CalendarDays,
  Clapperboard,
  Scissors,
  FolderOpen,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function GuidePage() {
  return (
    <div className="py-6">
      <PageHeader
        title="User Guide"
        description="How to use Clipper OS to create content that performs"
      />

      {/* Flow Diagram */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Workflow Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This is the end-to-end loop of how Clipper OS works. Each step feeds
            the next, and the final output tells you what to improve for the
            next campaign.
          </p>
          <FlowChain
            steps={[
              { icon: <Target className="size-4" />, label: "Campaign" },
              { icon: <Lightbulb className="size-4" />, label: "Ideas" },
              { icon: <CalendarDays className="size-4" />, label: "Plan" },
              { icon: <Clapperboard className="size-4" />, label: "Produce" },
              { icon: <Scissors className="size-4" />, label: "Clip" },
              { icon: <FolderOpen className="size-4" />, label: "Library" },
              { icon: <BarChart3 className="size-4" />, label: "Analytics" },
              { icon: <Sparkles className="size-4" />, label: "Optimize" },
            ]}
          />
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            <FlowStep
              icon={<Target className="size-4" />}
              title="Campaign"
              description="Join a brand campaign and capture its rules"
            />
            <FlowStep
              icon={<Lightbulb className="size-4" />}
              title="Ideas"
              description="Generate content ideas that satisfy the brief"
            />
            <FlowStep
              icon={<CalendarDays className="size-4" />}
              title="Plan"
              description="Schedule the winners on your publishing calendar"
            />
            <FlowStep
              icon={<Clapperboard className="size-4" />}
              title="Produce"
              description="Script, shoot, and edit in a tracked pipeline"
            />
            <FlowStep
              icon={<Scissors className="size-4" />}
              title="Clip"
              description="Pull the strongest moments from long-form video"
            />
            <FlowStep
              icon={<FolderOpen className="size-4" />}
              title="Library"
              description="Organize your assets, filter and favorite them"
            />
            <FlowStep
              icon={<BarChart3 className="size-4" />}
              title="Analytics"
              description="See views, engagement, and per-platform splits"
            />
            <FlowStep
              icon={<Sparkles className="size-4" />}
              title="Optimize"
              description="AI turns the data into next steps for the next campaign"
            />
          </div>
        </CardContent>
      </Card>

      {/* Module Documentation */}
      <div className="space-y-6">
        <ModuleCard
          icon={<Target className="size-5" />}
          title="Campaigns"
          description="Manage brand campaigns and their requirements"
          whenToUse="When you join a new campaign or need to track campaign deadlines"
          howToUse={[
            "Click 'New Campaign' to add a campaign",
            "Fill in campaign details: name, brand, deadline, opportunity score",
            "Add requirements (must-do, must-include, must-avoid)",
            "Click 'Analyze' to get AI insights on the campaign",
          ]}
          outputs={["Campaign requirements", "AI analysis with key facts and guidelines"]}
        />

        <ModuleCard
          icon={<Lightbulb className="size-5" />}
          title="Content Ideas"
          description="Generate and evaluate content ideas from campaigns"
          whenToUse="When you need fresh content ideas or want to brainstorm angles"
          howToUse={[
            "Open a campaign and click 'Generate Ideas'",
            "AI creates ideas based on campaign requirements",
            "Review each idea's hook, angle, and platform",
            "Select the best ideas to move to production",
          ]}
          outputs={["Content ideas with hooks and angles", "Selected ideas ready for scripting"]}
        />

        <ModuleCard
          icon={<CalendarDays className="size-5" />}
          title="Planner"
          description="Weekly publishing calendar"
          whenToUse="When you want to schedule when content goes live"
          howToUse={[
            "Select an idea from the dropdown",
            "Set a publish date",
            "Click 'Plan' to add it to your calendar",
            "View your week at a glance",
          ]}
          outputs={["Publishing schedule", "Overdue alerts for missed deadlines"]}
        />

        <ModuleCard
          icon={<Clapperboard className="size-5" />}
          title="Production"
          description="Kanban-style pipeline for ideas in progress"
          whenToUse="When you're actively producing content and need to track progress"
          howToUse={[
            "Ideas move through stages: Selected → Scripted → Production → Editing → Ready",
            "Click an idea to open its detail page",
            "Generate a script from the idea",
            "Update the idea status as you work",
          ]}
          outputs={["Scripts for each idea", "Production pipeline visibility"]}
        />

        <ModuleCard
          icon={<Scissors className="size-5" />}
          title="Clip Maker"
          description="Import videos and detect interesting moments"
          whenToUse="When you have long-form video and want to find the best clips"
          howToUse={[
            "Click 'Import Video' and paste a YouTube URL",
            "Click 'Detect Clips' to analyze the video",
            "AI identifies moments with viral potential",
            "Review clips ranked by viral score",
            "Update clip status: detected → exported → published",
          ]}
          outputs={["Detected clips with timestamps", "Viral scores for each clip", "Hooks and reasons why each moment works"]}
        />

        <ModuleCard
          icon={<FolderOpen className="size-5" />}
          title="Content Library"
          description="Asset management with favorites and tags"
          whenToUse="When you need to organize and find your content assets"
          howToUse={[
            "Browse all assets by kind (video, clip, script, etc.)",
            "Filter by favorites or tags",
            "Search by title",
            "Click an asset to view details",
          ]}
          outputs={["Organized asset library", "Quick access to favorites"]}
        />

        <ModuleCard
          icon={<BarChart3 className="size-5" />}
          title="Analytics"
          description="Performance metrics and insights"
          whenToUse="When you want to see what's working and what's not"
          howToUse={[
            "View total views and engagement",
            "See platform breakdown (TikTok, Instagram, YouTube)",
            "Check recent publications",
            "Identify top-performing content",
          ]}
          outputs={["Performance metrics", "Platform insights", "Engagement trends"]}
        />

        <ModuleCard
          icon={<Sparkles className="size-5" />}
          title="AI Assistant"
          description="Context-aware help for your workspace"
          whenToUse="When you need guidance or want to understand your data"
          howToUse={[
            "Ask questions like 'What should I work on next?'",
            "Ask about campaigns, ideas, or clips",
            "Get contextual advice based on your workspace",
            "Use starter prompts for common questions",
          ]}
          outputs={["Answers to your questions", "Workspace insights", "Next-step suggestions"]}
        />
      </div>

      {/* Quick Start */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <QuickStartStep
              number={1}
              title="Create a campaign"
              description="Go to Campaigns and add your first brand campaign with requirements"
            />
            <QuickStartStep
              number={2}
              title="Generate ideas"
              description="Open the campaign and generate content ideas from the requirements"
            />
            <QuickStartStep
              number={3}
              title="Select and plan"
              description="Pick the best ideas and schedule them on your calendar"
            />
            <QuickStartStep
              number={4}
              title="Produce content"
              description="Generate scripts, produce the content, and track progress in Production"
            />
            <QuickStartStep
              number={5}
              title="Find clips"
              description="Import videos to Clip Maker and detect the best moments"
            />
            <QuickStartStep
              number={6}
              title="Track performance"
              description="Check Analytics to see what's working and optimize"
            />
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function FlowStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FlowChain({
  steps,
}: {
  steps: { icon: React.ReactNode; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
            <span className="text-primary">{step.icon}</span>
            {step.label}
          </span>
          {i < steps.length - 1 ? (
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  whenToUse,
  howToUse,
  outputs,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  whenToUse: string;
  howToUse: string[];
  outputs: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            When to use
          </p>
          <p className="text-sm text-foreground">{whenToUse}</p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How to use
          </p>
          <ol className="space-y-1.5 text-sm text-foreground">
            {howToUse.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            What you get
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            {outputs.map((output, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                <span>{output}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStartStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
