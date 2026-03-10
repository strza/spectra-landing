import { useRef, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Config ────────────────────────────────────────────────────────

const DATA_POINTS = 400;
const CYCLE_DURATION = 13; // seconds

// Phase timings (seconds)
const P1_END = 2.5; // Track
const P2_END = 5.5; // Spectral reveal
const P3_END = 8.5; // Separation
const P4_END = 11; // Remix
const P5_END = 13; // Recombine

// Stem colors
const STEM_COLORS = {
  vocals: { r: 149, g: 128, b: 255 }, // #9580FF
  drums: { r: 255, g: 107, b: 74 }, // #FF6B4A
  instruments: { r: 61, g: 220, b: 132 }, // #3DDC84
};

// Section structure colors (matching main app)
const SECTION_COLORS = [
  { flex: 1, color: "#7C8BFF", label: "Intro" },
  { flex: 1.5, color: "#E8A54F", label: "Build" },
  { flex: 2, color: "#F06858", label: "Drop" },
  { flex: 1, color: "#36D9CA", label: "Break" },
  { flex: 2, color: "#F06858", label: "Drop" },
  { flex: 1, color: "#B78EE0", label: "Outro" },
];

// ─── Easing ────────────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// ─── Data Generation ───────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface TrackData {
  envelope: Float32Array;
  bass: Float32Array;
  mid: Float32Array;
  high: Float32Array;
}

interface StemData {
  vocals: Float32Array;
  drums: Float32Array;
  instruments: Float32Array;
}

function generateTrackData(count: number, seed: number): TrackData {
  const rng = seededRng(seed);
  const envelope = new Float32Array(count);
  const bass = new Float32Array(count);
  const mid = new Float32Array(count);
  const high = new Float32Array(count);

  // Build musical envelope
  for (let i = 0; i < count; i++) {
    const t = i / count;

    // Musical structure: intro → build → chorus → break → chorus → outro
    let env =
      0.15 +
      0.5 * Math.sin(t * Math.PI) +
      0.2 * Math.pow(Math.sin(t * Math.PI * 2), 2) +
      0.15 * Math.max(0, Math.sin(t * Math.PI * 4)) * Math.sin(t * Math.PI);

    // Add micro-dynamics
    env += 0.08 * (rng() - 0.5);
    // Transients
    if (rng() > 0.94) env += 0.1 * rng();

    envelope[i] = Math.max(0.03, Math.min(1, env));

    // Frequency distribution varies with song structure
    const chorusness = Math.max(0, Math.sin(t * Math.PI * 4));
    const buildness = Math.max(0, Math.sin(t * Math.PI * 2 - Math.PI / 4));

    let b = 0.3 + 0.25 * chorusness + 0.12 * rng();
    let m = 0.3 + 0.15 * buildness + 0.12 * rng();
    let h = 0.2 + 0.1 * (1 - chorusness) + 0.12 * rng();

    const total = b + m + h;
    bass[i] = b / total;
    mid[i] = m / total;
    high[i] = h / total;
  }

  // Smooth the envelope
  const smoothed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(count - 1, i + 2); j++) {
      sum += envelope[j];
      n++;
    }
    smoothed[i] = sum / n;
  }

  return { envelope: smoothed, bass, mid, high };
}

function generateStemData(track: TrackData): StemData {
  const count = track.envelope.length;
  const vocals = new Float32Array(count);
  const drums = new Float32Array(count);
  const instruments = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const e = track.envelope[i];
    // Each stem gets its frequency band portion of the envelope
    vocals[i] = e * track.mid[i] * 1.4; // Boost mids for vocals
    drums[i] = e * track.bass[i] * 1.3; // Boost bass for drums
    instruments[i] = e * (track.high[i] + track.mid[i] * 0.3) * 1.1;

    // Clamp
    vocals[i] = Math.min(1, vocals[i]);
    drums[i] = Math.min(1, drums[i]);
    instruments[i] = Math.min(1, instruments[i]);
  }

  return { vocals, drums, instruments };
}

// Remix segment offsets (which segments shift during remix phase)
const SEGMENT_COUNT = 6;
function getSegmentIndex(col: number, total: number): number {
  return Math.min(SEGMENT_COUNT - 1, Math.floor((col / total) * SEGMENT_COUNT));
}
// Only some segments move, and by different amounts
const REMIX_SHIFTS = [0, 0.08, -0.06, 0.1, -0.04, 0]; // as fraction of total width

// ─── Canvas Renderer ───────────────────────────────────────────────

function render(
  canvas: HTMLCanvasElement,
  time: number,
  track: TrackData,
  stems: StemData
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width * dpr;
  const H = rect.height * dpr;

  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  ctx.clearRect(0, 0, W, H);

  const t = time % CYCLE_DURATION;
  const midY = H / 2;
  const colW = W / DATA_POINTS;
  const maxBarH = midY * 0.8;

  // ── Phase 1: White waveform ──

  if (t < P1_END) {
    const pulse = 1 + 0.02 * Math.sin(time * 2.5);
    ctx.fillStyle = "rgba(220, 220, 230, 0.85)";

    for (let i = 0; i < DATA_POINTS; i++) {
      const x = i * colW;
      const h = track.envelope[i] * maxBarH * pulse;
      ctx.fillRect(x, midY - h, Math.max(1, colW - 0.5), h * 2);
    }
    return;
  }

  // ── Phase 2: Spectral reveal (scan line sweeps L→R) ──

  if (t < P2_END) {
    const progress = (t - P1_END) / (P2_END - P1_END);
    const scanX = easeOutQuart(progress) * W;

    // Draw waveform: spectral left of scan, white right of scan
    for (let i = 0; i < DATA_POINTS; i++) {
      const x = i * colW;
      const h = track.envelope[i] * maxBarH;

      if (x + colW < scanX) {
        // Spectral colored — stacked frequency bars
        const bassH = h * track.bass[i];
        const midH = h * track.mid[i];
        const highH = h * track.high[i];

        // Draw from center outward (mirrored)
        // Bass (bottom of spectrum = center of waveform)
        ctx.fillStyle = `rgba(255, 80, 50, 0.85)`;
        ctx.fillRect(x, midY - bassH, Math.max(1, colW - 0.5), bassH * 2);

        // Mid (above/below bass)
        ctx.fillStyle = `rgba(100, 210, 120, 0.8)`;
        ctx.fillRect(
          x,
          midY - bassH - midH,
          Math.max(1, colW - 0.5),
          midH
        );
        ctx.fillRect(x, midY + bassH, Math.max(1, colW - 0.5), midH);

        // High (outermost)
        ctx.fillStyle = `rgba(130, 140, 255, 0.75)`;
        ctx.fillRect(
          x,
          midY - bassH - midH - highH,
          Math.max(1, colW - 0.5),
          highH
        );
        ctx.fillRect(
          x,
          midY + bassH + midH,
          Math.max(1, colW - 0.5),
          highH
        );
      } else {
        // White waveform (not yet scanned)
        ctx.fillStyle = "rgba(220, 220, 230, 0.85)";
        ctx.fillRect(x, midY - h, Math.max(1, colW - 0.5), h * 2);
      }
    }

    // Scan line with glow
    ctx.save();
    ctx.shadowColor = "#7C8BFF";
    ctx.shadowBlur = 20 * dpr;
    ctx.strokeStyle = "rgba(124, 139, 255, 0.9)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, H);
    ctx.stroke();
    ctx.restore();

    // Second glow pass for intensity
    ctx.save();
    ctx.shadowColor = "#B78EE0";
    ctx.shadowBlur = 40 * dpr;
    ctx.strokeStyle = "rgba(183, 142, 224, 0.4)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, H);
    ctx.stroke();
    ctx.restore();

    return;
  }

  // ── Phase 3: Separation ──

  if (t < P3_END) {
    const progress = easeInOutCubic((t - P2_END) / (P3_END - P2_END));
    const separation = progress * H * 0.28; // How far apart stems spread
    const colorBlend = progress; // 0 = spectral, 1 = stem color

    // Three stem positions: vocals up, drums center, instruments down
    const stemYOffsets = [
      -separation, // vocals (up)
      0, // drums (center)
      separation, // instruments (down)
    ];
    const stemEnvelopes = [stems.vocals, stems.drums, stems.instruments];
    const stemColors = [
      STEM_COLORS.vocals,
      STEM_COLORS.drums,
      STEM_COLORS.instruments,
    ];
    // Source spectral colors for each stem
    const spectralBase = [
      { r: 100, g: 210, b: 120 }, // mids → vocals
      { r: 255, g: 80, b: 50 }, // bass → drums
      { r: 130, g: 140, b: 255 }, // highs → instruments
    ];

    for (let s = 0; s < 3; s++) {
      const yOff = stemYOffsets[s];
      const env = stemEnvelopes[s];
      const sc = stemColors[s];
      const sp = spectralBase[s];

      // Lerp color from spectral to stem color
      const r = Math.round(sp.r + (sc.r - sp.r) * colorBlend);
      const g = Math.round(sp.g + (sc.g - sp.g) * colorBlend);
      const b = Math.round(sp.b + (sc.b - sp.b) * colorBlend);

      const alpha = 0.75 + 0.15 * colorBlend;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      // Glow during separation
      if (progress > 0.3) {
        ctx.shadowColor = `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0.3)`;
        ctx.shadowBlur = 6 * dpr * progress;
      }

      for (let i = 0; i < DATA_POINTS; i++) {
        const x = i * colW;
        const h = env[i] * maxBarH * 0.85;
        ctx.fillRect(
          x,
          midY + yOff - h,
          Math.max(1, colW - 0.5),
          h * 2
        );
      }

      ctx.shadowBlur = 0;
    }

    return;
  }

  // ── Phase 4: Remix (segments shift) ──

  if (t < P4_END) {
    const progress = easeInOutCubic((t - P3_END) / (P4_END - P3_END));
    const separation = H * 0.28;

    const stemYOffsets = [-separation, 0, separation];
    const stemEnvelopes = [stems.vocals, stems.drums, stems.instruments];
    const stemColors = [
      STEM_COLORS.vocals,
      STEM_COLORS.drums,
      STEM_COLORS.instruments,
    ];

    for (let s = 0; s < 3; s++) {
      const yOff = stemYOffsets[s];
      const env = stemEnvelopes[s];
      const sc = stemColors[s];

      ctx.fillStyle = `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0.9)`;

      for (let i = 0; i < DATA_POINTS; i++) {
        const seg = getSegmentIndex(i, DATA_POINTS);
        const shift = REMIX_SHIFTS[seg] * W * progress;
        const x = i * colW + shift;
        const h = env[i] * maxBarH * 0.85;

        // Glow on moving segments
        if (REMIX_SHIFTS[seg] !== 0) {
          ctx.shadowColor = `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${0.4 * progress})`;
          ctx.shadowBlur = 8 * dpr * progress;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(
          x,
          midY + yOff - h,
          Math.max(1, colW - 0.5),
          h * 2
        );
      }

      ctx.shadowBlur = 0;
    }

    // Draw segment boundaries on each stem
    if (progress > 0.2) {
      ctx.globalAlpha = progress * 0.3;
      for (let s = 0; s < 3; s++) {
        const yOff = stemYOffsets[s];
        for (let seg = 1; seg < SEGMENT_COUNT; seg++) {
          const x = (seg / SEGMENT_COUNT) * W;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1 * dpr;
          ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.beginPath();
          ctx.moveTo(x, midY + yOff - maxBarH);
          ctx.lineTo(x, midY + yOff + maxBarH);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    return;
  }

  // ── Phase 5: Recombine ──

  {
    const progress = easeInOutCubic((t - P4_END) / (P5_END - P4_END));
    const separation = H * 0.28 * (1 - progress);

    const stemYOffsets = [-separation, 0, separation];
    const stemEnvelopes = [stems.vocals, stems.drums, stems.instruments];
    const stemColors = [
      STEM_COLORS.vocals,
      STEM_COLORS.drums,
      STEM_COLORS.instruments,
    ];

    for (let s = 0; s < 3; s++) {
      const yOff = stemYOffsets[s];
      const env = stemEnvelopes[s];
      const sc = stemColors[s];

      // As stems merge, reduce individual opacity
      const alpha = 0.9 - 0.3 * progress;

      for (let i = 0; i < DATA_POINTS; i++) {
        // Undo remix shifts
        const seg = getSegmentIndex(i, DATA_POINTS);
        const shift = REMIX_SHIFTS[seg] * W * (1 - progress);
        const x = i * colW + shift;
        const h = env[i] * maxBarH * 0.85;

        // Blend toward gradient
        const gradientT = i / DATA_POINTS;
        let gr: number, gg: number, gb: number;
        if (gradientT < 0.33) {
          const lt = gradientT / 0.33;
          gr = STEM_COLORS.vocals.r + (STEM_COLORS.drums.r - STEM_COLORS.vocals.r) * lt;
          gg = STEM_COLORS.vocals.g + (STEM_COLORS.drums.g - STEM_COLORS.vocals.g) * lt;
          gb = STEM_COLORS.vocals.b + (STEM_COLORS.drums.b - STEM_COLORS.vocals.b) * lt;
        } else if (gradientT < 0.66) {
          const lt = (gradientT - 0.33) / 0.33;
          gr = STEM_COLORS.drums.r + (STEM_COLORS.instruments.r - STEM_COLORS.drums.r) * lt;
          gg = STEM_COLORS.drums.g + (STEM_COLORS.instruments.g - STEM_COLORS.drums.g) * lt;
          gb = STEM_COLORS.drums.b + (STEM_COLORS.instruments.b - STEM_COLORS.drums.b) * lt;
        } else {
          const lt = (gradientT - 0.66) / 0.34;
          gr = STEM_COLORS.instruments.r + (STEM_COLORS.vocals.r - STEM_COLORS.instruments.r) * lt;
          gg = STEM_COLORS.instruments.g + (STEM_COLORS.vocals.g - STEM_COLORS.instruments.g) * lt;
          gb = STEM_COLORS.instruments.b + (STEM_COLORS.vocals.b - STEM_COLORS.instruments.b) * lt;
        }

        const r = Math.round(sc.r + (gr - sc.r) * progress);
        const g = Math.round(sc.g + (gg - sc.g) * progress);
        const b = Math.round(sc.b + (gb - sc.b) * progress);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(
          x,
          midY + yOff - h,
          Math.max(1, colW - 0.5),
          h * 2
        );
      }
    }
  }
}

// ─── Phase labels ──────────────────────────────────────────────────

function getPhaseLabel(
  t: number
): { text: string; sub?: string } | null {
  if (t < P1_END) return null;
  if (t < P2_END) return { text: "Analyzing frequency spectrum", sub: "FFT" };
  if (t < P3_END) return { text: "Separating stems" };
  if (t < P4_END) return { text: "Remixing" };
  if (t < P5_END) return { text: "New track created" };
  return null;
}

// Stem labels shown during separation & remix
function getStemLabels(t: number): boolean {
  return t >= P2_END + 1 && t < P5_END - 0.5;
}

// ─── Component ─────────────────────────────────────────────────────

export function SpectralAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState(0);

  const trackData = useMemo(() => generateTrackData(DATA_POINTS, 42), []);
  const stemData = useMemo(() => generateStemData(trackData), [trackData]);

  useEffect(() => {
    startRef.current = performance.now();

    function loop(now: number) {
      const elapsed = (now - startRef.current) / 1000;
      setCurrentTime(elapsed);

      const canvas = canvasRef.current;
      if (canvas) {
        render(canvas, elapsed, trackData, stemData);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [trackData, stemData]);

  const t = currentTime % CYCLE_DURATION;
  const phaseLabel = getPhaseLabel(t);
  const showStems = getStemLabels(t);

  return (
    <div className="card relative w-full overflow-hidden p-0">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 md:px-5 md:py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]/70" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 md:text-xs">
            spectra
          </span>
        </div>

        {/* Phase indicator */}
        <AnimatePresence mode="wait">
          {phaseLabel && (
            <motion.div
              key={phaseLabel.text}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              {phaseLabel.sub && (
                <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary md:text-[10px]">
                  {phaseLabel.sub}
                </span>
              )}
              <span className="font-mono text-[10px] text-zinc-400 md:text-xs">
                {phaseLabel.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Canvas area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-[200px] w-full md:h-[280px]"
        />

        {/* Stem labels */}
        <AnimatePresence>
          {showStems && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.4 }}
                className="absolute top-3 left-3 flex items-center gap-1.5 md:top-4 md:left-4"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#9580FF]" />
                <span className="font-mono text-[9px] font-medium text-[#9580FF]/80 uppercase tracking-wider md:text-[10px]">
                  Vocals
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="absolute top-1/2 left-3 -translate-y-1/2 flex items-center gap-1.5 md:left-4"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B4A]" />
                <span className="font-mono text-[9px] font-medium text-[#FF6B4A]/80 uppercase tracking-wider md:text-[10px]">
                  Drums
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 md:bottom-4 md:left-4"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#3DDC84]" />
                <span className="font-mono text-[9px] font-medium text-[#3DDC84]/80 uppercase tracking-wider md:text-[10px]">
                  Instrumental
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Section color strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-[3px]">
          {SECTION_COLORS.map((s, i) => (
            <div
              key={i}
              style={{ flex: s.flex, backgroundColor: s.color, opacity: 0.5 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
