import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { InstallAppCard } from "@/components/dashboard/InstallAppCard";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="mb-4 text-center">
          <img src="/brand/billo-logo.png" alt="Billo" className="mx-auto mb-4 h-14 w-auto" />
          <h1 className="text-xl font-extrabold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Billing, inventory &amp; sales for your shop</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <div className="card p-4">
          <p className="mb-3 text-sm font-bold text-ink">Install on this phone</p>
          <InstallAppCard compact />
        </div>
      </div>
    </div>
  );
}
