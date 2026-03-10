import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Waveform data generation ---

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface WaveformPeaks {
  heights: number[];
  spectral: [number, number, number][];
}

function generateRealisticWaveform(
  count: number,
  seed: number,
  character: "vocal" | "full" | "instrumental"
): WaveformPeaks {
  const rng = seededRandom(seed);
  const heights: number[] = [];
  const spectral: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const t = i / count;

    // Musical envelope: intro → build → chorus → breakdown → chorus → outro
    let env =
      0.3 +
      0.45 * Math.sin(t * Math.PI) +
      0.15 * Math.sin(t * Math.PI * 4) * Math.sin(t * Math.PI) +
      0.1 * Math.sin(t * Math.PI * 8) * Math.max(0, Math.sin(t * Math.PI * 2));
    env = Math.max(0.08, Math.min(1, env));

    const noise = 0.12 * (rng() - 0.5);
    const transient = rng() > 0.93 ? 0.12 * rng() : 0;
    let h = env + noise + transient;

    // Character-specific adjustments
    if (character === "vocal") {
      h *= 0.7 + 0.3 * Math.abs(Math.sin(t * Math.PI * 6));
    } else if (character === "instrumental") {
      h *= 0.8 + 0.2 * Math.abs(Math.sin(t * Math.PI * 3));
    }

    heights.push(Math.max(0.04, Math.min(1, h)));

    // Spectral content
    let bass: number, mid: number, high: number;
    switch (character) {
      case "vocal":
        bass = 0.08 + 0.08 * rng();
        mid = 0.55 + 0.35 * rng();
        high = 0.25 + 0.25 * rng();
        break;
      case "instrumental":
        bass = 0.45 + 0.35 * rng();
        mid = 0.2 + 0.2 * rng();
        high = 0.15 + 0.25 * rng();
        break;
      default:
        bass = 0.3 + 0.35 * rng();
        mid = 0.25 + 0.35 * rng();
        high = 0.15 + 0.3 * rng();
        if (Math.sin(t * Math.PI * 8) > 0.5) bass *= 1.3;
        break;
    }
    const total = bass + mid + high;
    spectral.push([bass / total, mid / total, high / total]);
  }

  return { heights, spectral };
}

// Rekordbox-style spectral → RGB
function spectralToRgb(
  bass: number,
  mid: number,
  high: number
): [number, number, number] {
  const b = Math.pow(bass, 4);
  const m = Math.pow(mid, 4);
  const h = Math.pow(high, 4);
  const total = b + m + h || 1;
  const nb = b / total;
  const nm = m / total;
  const nh = h / total;

  return [
    Math.min(255, nb * 255 + nm * 20 + nh * 45),
    Math.min(255, nb * 20 + nm * 235 + nh * 65),
    Math.min(255, nb * 20 + nm * 35 + nh * 255),
  ];
}

// --- Canvas waveform renderer ---

function renderWaveform(
  canvas: HTMLCanvasElement,
  peaks: WaveformPeaks,
  opts: {
    opacity?: number;
    colorOverride?: string;
    glow?: boolean;
    glowColor?: string;
  } = {}
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = rect.width;
  const h = rect.height;
  const midY = (h * dpr) / 2;
  const colWidth = (w * dpr) / peaks.heights.length;
  const gap = colWidth > 2.5 ? 0.5 : 0;
  const opacity = opts.opacity ?? 0.9;

  if (opts.glow && opts.glowColor) {
    ctx.shadowColor = opts.glowColor;
    ctx.shadowBlur = 10 * dpr;
  }

  for (let i = 0; i < peaks.heights.length; i++) {
    const x = i * colWidth;
    const barH = peaks.heights[i] * midY * 0.82;

    if (opts.colorOverride) {
      ctx.fillStyle = opts.colorOverride;
      ctx.globalAlpha = opacity;
    } else {
      const [r, g, b] = spectralToRgb(...peaks.spectral[i]);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.globalAlpha = opacity;
    }

    // Mirrored waveform
    ctx.fillRect(x, midY - barH, colWidth - gap, barH);
    ctx.fillRect(x, midY, colWidth - gap, barH);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// Section color strip data
const SECTIONS = [
  { flex: 1, color: "#7C8BFF" },
  { flex: 1, color: "#E8A54F" },
  { flex: 2, color: "#F06858" },
  { flex: 1, color: "#36D9CA" },
  { flex: 2, color: "#F06858" },
  { flex: 1, color: "#B78EE0" },
];

// --- Track Panel ---

interface TrackPanelProps {
  label: string;
  sublabel: string;
  peaks: WaveformPeaks;
  vocalPeaks?: WaveformPeaks;
  vocalOpacity: number;
}

function TrackPanel({
  label,
  sublabel,
  peaks,
  vocalPeaks,
  vocalOpacity,
}: TrackPanelProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const vocalCanvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    if (mainCanvasRef.current) {
      renderWaveform(mainCanvasRef.current, peaks);
    }
    if (vocalCanvasRef.current && vocalPeaks && vocalOpacity > 0.01) {
      renderWaveform(vocalCanvasRef.current, vocalPeaks, {
        opacity: vocalOpacity * 0.75,
        colorOverride: "rgba(149, 128, 255, 0.7)",
        glow: true,
        glowColor: "#9580FF",
      });
    } else if (vocalCanvasRef.current) {
      const ctx = vocalCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, vocalCanvasRef.current.width, vocalCanvasRef.current.height);
    }
  }, [peaks, vocalPeaks, vocalOpacity]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] font-medium tracking-wider text-zinc-400 uppercase md:text-xs">
            {label}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-600 md:text-xs">
          {sublabel}
        </span>
      </div>

      <div className="relative h-[64px] overflow-hidden rounded-lg border border-white/[0.06] bg-black/50 md:h-[80px]">
        <canvas ref={mainCanvasRef} className="absolute inset-0 h-full w-full" />
        <canvas
          ref={vocalCanvasRef}
          className="absolute inset-0 h-full w-full"
        />

        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-[2px]"
          style={{
            background: "rgba(255,255,255,0.7)",
            boxShadow: "0 0 6px rgba(255,255,255,0.4)",
          }}
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        {/* Section color strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-[3px]">
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              style={{
                flex: s.flex,
                backgroundColor: s.color,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Animation phases ---

type Phase =
  | "idle"
  | "highlight"
  | "extract"
  | "transfer"
  | "fuse"
  | "result";

// --- Main component ---

export function MashupAnimation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [vocalAOpacity, setVocalAOpacity] = useState(0);
  const [vocalBOpacity, setVocalBOpacity] = useState(0);

  const trackAPeaks = useMemo(
    () => generateRealisticWaveform(300, 42, "full"),
    []
  );
  const trackBPeaks = useMemo(
    () => generateRealisticWaveform(300, 91, "instrumental"),
    []
  );
  const vocalPeaks = useMemo(
    () => generateRealisticWaveform(300, 42, "vocal"),
    []
  );

  // Animation loop
  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(resolve, ms);
        if (cancelled) clearTimeout(id);
      });

    // Smooth interpolation helper
    const animateValue = (
      setter: (v: number) => void,
      from: number,
      to: number,
      duration: number
    ) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        function tick(now: number) {
          if (cancelled) return resolve();
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          // easeInOutCubic
          const eased =
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setter(from + (to - from) * eased);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(tick);
      });

    async function loop() {
      while (!cancelled) {
        // Idle: both tracks playing normally
        setPhase("idle");
        setVocalAOpacity(0);
        setVocalBOpacity(0);
        await wait(3000);
        if (cancelled) break;

        // Highlight vocals in Track A
        setPhase("highlight");
        await animateValue(setVocalAOpacity, 0, 1, 1200);
        if (cancelled) break;
        await wait(800);
        if (cancelled) break;

        // Extract: vocals start leaving A
        setPhase("extract");
        await animateValue(setVocalAOpacity, 1, 0.2, 1500);
        if (cancelled) break;

        // Transfer: visual indicator moves down
        setPhase("transfer");
        await wait(1800);
        if (cancelled) break;

        // Fuse: vocals appear in B
        setPhase("fuse");
        await animateValue(setVocalBOpacity, 0, 1, 1200);
        await animateValue(setVocalAOpacity, 0.2, 0, 600);
        if (cancelled) break;

        // Result: hold
        setPhase("result");
        await wait(2500);
        if (cancelled) break;

        // Reset
        await animateValue(setVocalBOpacity, 1, 0, 800);
        if (cancelled) break;
        await wait(500);
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, []);

  const showIndicator =
    phase === "extract" || phase === "transfer" || phase === "fuse";

  return (
    <div className="card relative w-full overflow-hidden p-3 md:p-5">
      {/* Title bar */}
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]/70" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 md:text-xs">
            spectra — mashup studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] text-accent/70 md:text-xs">
            live preview
          </span>
        </div>
      </div>

      {/* Track A */}
      <TrackPanel
        label="Track A"
        sublabel="Full Mix — Vocals + Instruments"
        peaks={trackAPeaks}
        vocalPeaks={vocalPeaks}
        vocalOpacity={vocalAOpacity}
      />

      {/* Transfer indicator */}
      <div className="relative flex h-8 items-center justify-center md:h-10">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.04]" />
        <AnimatePresence>
          {showIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 flex items-center gap-1.5 rounded-full border border-[#9580FF]/30 bg-[#9580FF]/10 px-2.5 py-0.5 backdrop-blur-sm"
            >
              <div className="h-1 w-1 rounded-full bg-[#9580FF] animate-pulse" />
              <span className="font-mono text-[9px] font-medium text-[#9580FF] uppercase tracking-widest md:text-[10px]">
                {phase === "fuse" || phase === "transfer"
                  ? "Fusing Vocals"
                  : "Extracting Vocals"}
              </span>
              <motion.svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className="text-[#9580FF]"
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <path
                  d="M5 1 L5 9 M2 6 L5 9 L8 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Track B */}
      <TrackPanel
        label="Track B"
        sublabel="Instrumental"
        peaks={trackBPeaks}
        vocalPeaks={vocalPeaks}
        vocalOpacity={vocalBOpacity}
      />
    </div>
  );
}
