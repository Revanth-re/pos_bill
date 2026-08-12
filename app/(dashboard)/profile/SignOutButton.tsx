"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <span className="inline-flex items-center gap-2">
        <LogOut className="h-4 w-4" /> Sign Out
      </span>
    </Button>
  );
}
