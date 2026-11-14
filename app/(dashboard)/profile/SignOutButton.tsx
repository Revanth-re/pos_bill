"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { logoutEverywhere } from "@/lib/auth/deviceData";

export function SignOutButton() {
  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => {
        // Uploads offline bills, then removes this login's saved data (menu, cart, sales, screens).
        logoutEverywhere(signOut);
      }}
    >
      <span className="inline-flex items-center gap-2">
        <LogOut className="h-4 w-4" /> Sign Out
      </span>
    </Button>
  );
}
