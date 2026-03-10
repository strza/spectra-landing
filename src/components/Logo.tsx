interface LogoProps {
  size?: "sm" | "lg";
}

export function Logo({ size = "sm" }: LogoProps) {
  const barCount = size === "lg" ? 12 : 5;
  const barHeight = size === "lg" ? 40 : 20;
  const barWidth = size === "lg" ? 4 : 3;
  const gap = size === "lg" ? 3 : 2;
  const textClass =
    size === "lg"
      ? "font-display text-6xl font-black uppercase tracking-wide"
      : "font-display text-lg font-bold tracking-wider";

  const bars = Array.from({ length: barCount }, (_, i) => {
    const normalized = i / (barCount - 1);
    const height = 0.4 + 0.6 * Math.sin(normalized * Math.PI);
    return height;
  });

  const totalWidth = barCount * barWidth + (barCount - 1) * gap;

  return (
    <div className="flex items-center gap-3">
      <svg
        width={totalWidth}
        height={barHeight}
        viewBox={`0 0 ${totalWidth} ${barHeight}`}
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C8BFF" />
            <stop offset="50%" stopColor="#9A86D8" />
            <stop offset="100%" stopColor="#B78EE0" />
          </linearGradient>
        </defs>
        {bars.map((height, i) => {
          const h = height * barHeight;
          const x = i * (barWidth + gap);
          const y = (barHeight - h) / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={barWidth / 2}
              fill="url(#barGradient)"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "2s",
              }}
            />
          );
        })}
      </svg>
      <span className={`${textClass} text-gradient`}>SPECTRA</span>
    </div>
  );
}
