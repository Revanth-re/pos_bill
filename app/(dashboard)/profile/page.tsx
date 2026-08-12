import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { SignOutButton } from "./SignOutButton";
import { InstallAppCard } from "@/components/dashboard/InstallAppCard";
import { T } from "@/components/i18n/T";
import { User, Building2, ShieldCheck, Mail } from "lucide-react";

export default async function ProfilePage() {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.businessId } });

  const roleLabel = session.role.charAt(0) + session.role.slice(1).toLowerCase();

  return (
    <div className="p-4 lg:p-6 max-w-lg space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          {session.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-ink">{session.name}</p>
          <p className="truncate text-sm text-muted">{session.email}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
        <InfoRow icon={Building2} label="Business" value={business.name} />
        <InfoRow icon={ShieldCheck} label="Role" value={roleLabel} />
        <InfoRow icon={Mail} label="Email" value={session.email} />
        <InfoRow icon={User} label="Staff ID" value={session.staffId} mono />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-ink">
          <T k="settings.installTitle" />
        </h2>
        <p className="mb-4 text-sm text-muted">
          <T k="settings.installSubtitle" />
        </p>
        <InstallAppCard />
      </section>

      <SignOutButton />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <Icon className="h-5 w-5 shrink-0 text-ink-soft" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className={`truncate font-bold text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
