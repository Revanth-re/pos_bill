import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/brand/billo-logo.png" alt="Billo" className="mx-auto mb-4 h-14 w-auto" />
          <h1 className="text-xl font-extrabold text-ink">Set up your business</h1>
          <p className="mt-1 text-sm text-muted">Takes under a minute — you can bill your first order right after</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
