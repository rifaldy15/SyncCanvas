export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-950 px-4">
      {/* Dynamic Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent-500/20 blur-[100px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
