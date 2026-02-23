"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: "⚡",
    title: "Real-time Collaboration",
    desc: "Edit documents with your team simultaneously. See cursors, selections, and changes in real-time.",
  },
  {
    icon: "🤖",
    title: "AI Assistant",
    desc: "Powered by Groq & Llama 3. Summarize, rewrite, brainstorm, and generate content instantly.",
  },
  {
    icon: "🔒",
    title: "Secure & Cloud-native",
    desc: "Built on Supabase with row-level security. Your data, always protected and accessible.",
  },
  {
    icon: "🎨",
    title: "Beautiful & Fast",
    desc: "Crafted with Next.js 15 and Framer Motion. Buttery animations and instant navigation.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-accent-500/10 blur-[100px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute left-1/2 top-2/3 h-[300px] w-[300px] rounded-full bg-brand-400/5 blur-[80px] animate-pulse-glow"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-accent-500">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">
              Sync<span className="gradient-text">Canvas</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-linear-to-r from-brand-600 to-accent-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-brand-500/25 hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-700 bg-surface-800/50 px-4 py-1.5 text-sm text-text-secondary">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Now in Beta — Join the waitlist
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
            Create Together with <span className="gradient-text">AI Power</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            SyncCanvas is a real-time collaborative workspace where your team
            writes, edits, and brainstorms — with an AI assistant that
            understands your context.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl transition-all hover:shadow-2xl hover:shadow-brand-500/20 hover:scale-105 active:scale-95">
              <span className="relative z-10">Start Creating — Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="glass-light flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium text-text-secondary transition-all hover:text-text-primary hover:scale-105 active:scale-95">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Editor Mockup */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glow-brand mx-auto mt-16 w-full max-w-5xl overflow-hidden rounded-2xl border border-surface-700/50">
          <div className="flex items-center gap-2 border-b border-surface-700/50 bg-surface-900/80 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <div className="ml-4 flex-1 rounded-md bg-surface-800 px-3 py-1 text-xs text-text-muted">
              synccanvas.app / workspace / my-project
            </div>
          </div>
          <div className="grid grid-cols-12 bg-surface-950/60">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-surface-700/30 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Pages
              </div>
              {[
                "📄 Getting Started",
                "📋 Project Plan",
                "🎯 Sprint Goals",
                "💡 Ideas",
              ].map((item, i) => (
                <div
                  key={i}
                  className={`mb-1 rounded-lg px-3 py-2 text-sm ${
                    i === 0
                      ? "bg-brand-600/15 text-brand-300"
                      : "text-text-secondary hover:bg-surface-800/50"
                  }`}>
                  {item}
                </div>
              ))}
            </div>
            {/* Editor area */}
            <div className="col-span-6 p-6">
              <div className="mb-4 text-2xl font-bold text-text-primary">
                Getting Started
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
                <p>
                  Welcome to your collaborative workspace. Start typing to
                  create your first document.
                </p>
                <p>
                  Use{" "}
                  <kbd className="rounded bg-surface-700 px-1.5 py-0.5 font-mono text-xs text-text-primary">
                    /
                  </kbd>{" "}
                  to access commands, or press{" "}
                  <kbd className="rounded bg-surface-700 px-1.5 py-0.5 font-mono text-xs text-text-primary">
                    Ctrl+K
                  </kbd>{" "}
                  to summon the AI assistant.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">
                    2 collaborators online
                  </span>
                </div>
              </div>
            </div>
            {/* AI Panel */}
            <div className="col-span-3 border-l border-surface-700/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <span>🤖</span> AI Assistant
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-surface-800/60 p-3 text-xs text-text-secondary">
                  <span className="font-medium text-accent-400">AI:</span> I can
                  help you summarize, rewrite, or brainstorm ideas. Just ask!
                </div>
                <div className="rounded-lg bg-brand-600/10 p-3 text-xs text-brand-300">
                  <span className="font-medium">You:</span> Summarize this
                  document in 3 bullet points
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need to{" "}
              <span className="gradient-text">create together</span>
            </h2>
            <p className="mx-auto max-w-xl text-text-secondary">
              A powerful workspace that combines real-time collaboration, AI
              intelligence, and beautiful design.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass group rounded-2xl p-6 transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 text-2xl transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-sm text-text-muted">
            © 2026 SyncCanvas. Built with ❤️ and AI.
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-brand-500 to-accent-500">
              <span className="text-[10px] font-bold text-white">S</span>
            </div>
            <span className="text-sm font-medium text-text-secondary">
              SyncCanvas
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
