export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-950 px-4">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/4 h-[400px] w-[400px] rounded-full bg-brand-600/8 blur-[100px] animate-pulse-glow" />
        <div
          className="absolute right-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-accent-500/8 blur-[90px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
