import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">C L I P P E R</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your content operating system
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}