"use client";

import { logout } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
      Sign Out
    </button>
  );
}
