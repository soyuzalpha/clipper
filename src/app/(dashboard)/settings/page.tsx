import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIConnectionTest } from "@/components/settings/ai-connection-test";
import { getAIProvider } from "@/lib/ai/provider";
import { getAIConfigStatus } from "@/lib/ai/config";

const date = (d: Date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);

export default async function SettingsPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const user = await prisma.user.findFirst({
    where: { workspaceId: workspace.id },
  });

  const provider = getAIProvider();
  const config = getAIConfigStatus();

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
                  ({config.provider})
                </code>
              </span>
            </div>
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">Gateway</span>
              <ul className="space-y-1">
                {[
                  { label: "HematToken", on: config.provider === "hemattoken" },
                  { label: "Mock (local, no keys)", on: config.provider === "mock" },
                ].map(({ label, on }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${on ? "bg-emerald-500" : "bg-muted"}`}
                      aria-hidden
                    />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {on ? "active" : "inactive"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {config.provider === "hemattoken" ? (
              <div className="grid gap-0.5">
                <span className="text-xs text-muted-foreground">Model</span>
                <span className="font-medium">
                  {config.model ?? "—"}
                  {config.gatewayConfigured ? null : (
                    <span className="ml-2 text-xs text-destructive">
                      missing: {config.missingVars.join(", ")}
                    </span>
                  )}
                </span>
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">
                Live check
              </span>
              <AIConnectionTest />
            </div>
            <p className="text-xs text-muted-foreground">
              Select the layer with the{" "}
              <code className="text-xs">AI_PROVIDER</code> env var
              (<code className="text-xs">mock</code> or{" "}
              <code className="text-xs">hemattoken</code>). In hemattoken mode,
              traffic goes through the HematToken gateway — never to a vendor
              API directly. Mock needs no credentials.
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
