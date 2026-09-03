import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIProvider } from "@/lib/ai/provider";
import type { ProviderId } from "@/lib/ai/provider";

const date = (d: Date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);

export default async function SettingsPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const user = await prisma.user.findFirst({
    where: { workspaceId: workspace.id },
  });

  const provider = getAIProvider();
  const providerId = (process.env.AI_PROVIDER ?? "mock") as ProviderId;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="flex h-full flex-col py-6">
      <PageHeader
        title="Settings"
        description="Workspace configuration and AI provider status."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">Name</span>
              <span className="font-medium">{workspace.name}</span>
            </div>
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">Created</span>
              <span className="font-medium">{date(workspace.createdAt)}</span>
            </div>
            {user && (
              <div className="grid gap-0.5">
                <span className="text-xs text-muted-foreground">
                  Primary user
                </span>
                <span className="font-medium">
                  {user.name} &lt;{user.email}&gt;
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Provider</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="font-medium">
                {provider.name}{" "}
                <code className="ml-1 text-xs text-muted-foreground">
                  ({providerId})
                </code>
              </span>
            </div>
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">API keys</span>
              <ul className="space-y-1">
                {[
                  { label: "OpenAI", key: hasOpenAIKey },
                  { label: "Anthropic", key: hasAnthropicKey },
                ].map(({ label, key }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${key ? "bg-emerald-500" : "bg-muted"}`}
                      aria-hidden
                    />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {key ? "configured" : "not configured"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Select the active provider with the{" "}
              <code className="text-xs">AI_PROVIDER</code> env var
              (<code className="text-xs">mock</code>,{" "}
              <code className="text-xs">openai</code>, or{" "}
              <code className="text-xs">anthropic</code>). Mock needs no
              credentials.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Theme is set with the toggle in the top-right header — light and
            dark mode follow your system unless overridden.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
