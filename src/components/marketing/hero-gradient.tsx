export function HeroGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] overflow-hidden"
    >
      {/* radial glow — picks up lane wayfinding hue inside .lane-* wrappers,
          falls back to brand amber on non-lane pages */}
      <div className="absolute left-1/2 top-0 h-[40rem] w-[72rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--lane-glow)_24%,transparent)_0%,transparent_60%)] blur-3xl" />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--fg) 1px, transparent 1px), linear-gradient(to bottom, var(--fg) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center top, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center top, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}
