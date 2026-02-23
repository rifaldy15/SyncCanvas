"use client";

import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-950">
        <main>{children}</main>
      </div>
    </ToastProvider>
  );
}
