"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeProvider";
import { logout } from "@/app/(auth)/actions";

interface SidebarProps {
  user: { email: string; fullName: string };
}

const NAV_ITEMS = [
  {
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 9a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zm10-1a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z"
        />
      </svg>
    ),
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    label: "Documents",
    href: "/documents",
  },
  {
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
    label: "AI Assistant",
    href: "/ai-assistant",
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/20">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <span className="text-base font-semibold text-text-primary">
              Sync<span className="gradient-text">Canvas</span>
            </span>
            <p className="text-[10px] text-text-muted">AI Workspace</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-text-muted hover:bg-surface-800 hover:text-text-primary transition-colors lg:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Main Nav */}
      <div className="px-3 mt-2">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Main
        </p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-600/15 text-brand-300 shadow-sm"
                    : "text-text-secondary hover:bg-surface-800/50 hover:text-text-primary"
                }`}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom — User & Theme */}
      <div className="border-t border-surface-700/50 px-3 py-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-800 hover:text-text-primary">
          <span className="flex items-center gap-3">
            {theme === "dark" ? "🌙" : "☀️"}
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </span>
          <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-surface-700 transition duration-300">
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-300 ${
                theme === "dark" ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </div>
        </button>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
            {(user.fullName || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {user.fullName || user.email.split("@")[0]}
            </p>
            <p className="truncate text-[10px] text-text-muted">{user.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sign Out">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-xl bg-surface-900/90 backdrop-blur p-2 text-text-muted shadow-lg border border-surface-700/50 hover:text-text-primary transition-colors lg:hidden"
        aria-label="Open menu">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop: always visible */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex w-60 flex-col border-r border-surface-700/50 bg-surface-950 lg:z-40">
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile: spring slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-50 flex w-60 flex-col border-r border-surface-700/50 bg-surface-950 lg:hidden">
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
