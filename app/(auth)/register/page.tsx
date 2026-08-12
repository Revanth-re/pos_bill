import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-ink/20 bg-brand text-xl font-black text-white">
            ₹
          </div>
          <h1 className="text-xl font-extrabold text-ink">Set up your business</h1>
          <p className="mt-1 text-sm text-muted">Takes under a minute — you can bill your first order right after</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
