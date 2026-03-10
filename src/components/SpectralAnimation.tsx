import { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// ─── Config ────────────────────────────────────────────────────────

const POINTS = 200; // Bezier control points per waveform
const STEM_COLORS = {
  vocals: "#9580FF",
  drums: "#FF6B4A",
  instruments: "#3DDC84",
};

// ─── Waveform Path Generation ──────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate a smooth SVG path string for a mirrored waveform envelope */
function generateWaveformPath(
  width: number,
  height: number,
  seed: number,
  amplitudeScale: number = 1
): string {
  const rng = seededRng(seed);
  const midY = height / 2;
  const maxAmp = midY * 0.78 * amplitudeScale;

  // Generate amplitude envelope
  const amps: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / POINTS;
    // Musical structure
    let env =
      0.12 +
      0.52 * Math.sin(t * Math.PI) +
      0.18 * Math.pow(Math.sin(t * Math.PI * 2), 2) +
      0.12 * Math.max(0, Math.sin(t * Math.PI * 4)) * Math.sin(t * Math.PI);
    env += 0.06 * (rng() - 0.5);
    if (rng() > 0.95) env += 0.08 * rng();
    amps.push(Math.max(0.02, Math.min(1, env)));
  }

  // Smooth
  const smoothed: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    let sum = 0,
      n = 0;
    for (let j = Math.max(0, i - 3); j <= Math.min(POINTS - 1, i + 3); j++) {
      sum += amps[j];
      n++;
    }
    smoothed.push(sum / n);
  }

  // Build top path (positive amplitude) and bottom path (mirrored)
  const step = width / POINTS;
  const topPoints: string[] = [];
  const bottomPoints: string[] = [];

  for (let i = 0; i < POINTS; i++) {
    const x = i * step;
    const a = smoothed[i] * maxAmp;
    topPoints.push(`${x},${midY - a}`);
    bottomPoints.push(`${x},${midY + a}`);
  }

  // Close the shape: go across the top, then back across the bottom
  // Using smooth curve commands for bezier interpolation
  let d = `M 0,${midY} `;

  // Top half — use smooth quadratic bezier
  for (let i = 0; i < POINTS; i++) {
    const x = i * step;
    const a = smoothed[i] * maxAmp;
    if (i === 0) {
      d += `L ${x},${midY - a} `;
    } else {
      const prevX = (i - 1) * step;
      const prevA = smoothed[i - 1] * maxAmp;
      const cpX = (prevX + x) / 2;
      d += `C ${cpX},${midY - prevA} ${cpX},${midY - a} ${x},${midY - a} `;
    }
  }

  // End cap
  d += `L ${width},${midY} `;

  // Bottom half — reverse direction
  for (let i = POINTS - 1; i >= 0; i--) {
    const x = i * step;
    const a = smoothed[i] * maxAmp;
    if (i === POINTS - 1) {
      d += `L ${x},${midY + a} `;
    } else {
      const nextX = (i + 1) * step;
      const nextA = smoothed[i + 1] * maxAmp;
      const cpX = (nextX + x) / 2;
      d += `C ${cpX},${midY + nextA} ${cpX},${midY + a} ${x},${midY + a} `;
    }
  }

  d += "Z";
  return d;
}

/** Generate a stem-specific waveform (different character) */
function generateStemPath(
  width: number,
  height: number,
  stemType: "vocals" | "drums" | "instruments",
  centerY: number
): string {
  const seeds = { vocals: 73, drums: 17, instruments: 129 };
  const scales = { vocals: 0.55, drums: 0.50, instruments: 0.45 };
  const rng = seededRng(seeds[stemType]);
  const maxAmp = (height * 0.22) * scales[stemType];

  const amps: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / POINTS;
    let env: number;
    switch (stemType) {
      case "vocals":
        env =
          0.15 +
          0.6 * Math.sin(t * Math.PI) *
            (0.7 + 0.3 * Math.abs(Math.sin(t * Math.PI * 5)));
        env += 0.05 * (rng() - 0.5);
        break;
      case "drums":
        env =
          0.1 +
          0.5 * Math.sin(t * Math.PI) +
          0.3 * Math.pow(Math.abs(Math.sin(t * Math.PI * 8 + rng())), 2.5);
        env += 0.08 * (rng() - 0.5);
        break;
      case "instruments":
        env =
          0.12 +
          0.55 * Math.sin(t * Math.PI) *
            (0.6 + 0.4 * Math.cos(t * Math.PI * 3));
        env += 0.04 * (rng() - 0.5);
        break;
    }
    amps.push(Math.max(0.01, Math.min(1, env)));
  }

  // Smooth
  const smoothed: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    let sum = 0, n = 0;
    const radius = stemType === "drums" ? 2 : 4;
    for (let j = Math.max(0, i - radius); j <= Math.min(POINTS - 1, i + radius); j++) {
      sum += amps[j]; n++;
    }
    smoothed.push(sum / n);
  }

  const step = width / POINTS;
  let d = `M 0,${centerY} `;

  // Top
  for (let i = 0; i < POINTS; i++) {
    const x = i * step;
    const a = smoothed[i] * maxAmp;
    if (i === 0) {
      d += `L ${x},${centerY - a} `;
    } else {
      const prevX = (i - 1) * step;
      const prevA = smoothed[i - 1] * maxAmp;
      const cpX = (prevX + x) / 2;
      d += `C ${cpX},${centerY - prevA} ${cpX},${centerY - a} ${x},${centerY - a} `;
    }
  }

  d += `L ${width},${centerY} `;

  // Bottom
  for (let i = POINTS - 1; i >= 0; i--) {
    const x = i * step;
    const a = smoothed[i] * maxAmp;
    if (i === POINTS - 1) {
      d += `L ${x},${centerY + a} `;
    } else {
      const nextX = (i + 1) * step;
      const nextA = smoothed[i + 1] * maxAmp;
      const cpX = (nextX + x) / 2;
      d += `C ${cpX},${centerY + nextA} ${cpX},${centerY + a} ${x},${centerY + a} `;
    }
  }

  d += "Z";
  return d;
}

// Section color strip data
const SECTIONS = [
  { offset: 0, width: 0.12, color: "#7C8BFF" },
  { offset: 0.12, width: 0.15, color: "#E8A54F" },
  { offset: 0.27, width: 0.22, color: "#F06858" },
  { offset: 0.49, width: 0.1, color: "#36D9CA" },
  { offset: 0.59, width: 0.24, color: "#F06858" },
  { offset: 0.83, width: 0.17, color: "#B78EE0" },
];

// ─── Component ─────────────────────────────────────────────────────

export function SpectralAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Refs for animated elements
  const compositeRef = useRef<SVGPathElement>(null);
  const vocalsRef = useRef<SVGPathElement>(null);
  const drumsRef = useRef<SVGPathElement>(null);
  const instrumentsRef = useRef<SVGPathElement>(null);
  const scanLineRef = useRef<SVGRectElement>(null);
  const scanGlowRef = useRef<SVGRectElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const phaseTextRef = useRef<HTMLDivElement>(null);
  const fftBadgeRef = useRef<HTMLSpanElement>(null);
  const vocalLabelRef = useRef<HTMLDivElement>(null);
  const drumLabelRef = useRef<HTMLDivElement>(null);
  const instrLabelRef = useRef<HTMLDivElement>(null);
  const sectionStripRef = useRef<HTMLDivElement>(null);

  // SVG dimensions
  const W = 1000;
  const H = 280;
  const MID = H / 2;

  // Pre-generate paths
  const compositePath = useMemo(
    () => generateWaveformPath(W, H, 42, 1),
    []
  );
  const vocalsPath = useMemo(
    () => generateStemPath(W, H, "vocals", MID - H * 0.28),
    []
  );
  const drumsPath = useMemo(
    () => generateStemPath(W, H, "drums", MID),
    []
  );
  const instrumentsPath = useMemo(
    () => generateStemPath(W, H, "instruments", MID + H * 0.28),
    []
  );

  // Paths at center position (for initial state of stems)
  const vocalsCenterPath = useMemo(
    () => generateStemPath(W, H, "vocals", MID),
    []
  );
  const drumsCenterPath = useMemo(
    () => generateStemPath(W, H, "drums", MID),
    []
  );
  const instrumentsCenterPath = useMemo(
    () => generateStemPath(W, H, "instruments", MID),
    []
  );

  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

      // ── Phase 1: The Track (0 → 2.5s) ──
      // Composite waveform visible, gentle pulse
      tl.set(compositeRef.current, { opacity: 1 });
      tl.set([vocalsRef.current, drumsRef.current, instrumentsRef.current], {
        opacity: 0,
      });
      tl.set(scanLineRef.current, { opacity: 0 });
      tl.set(scanGlowRef.current, { opacity: 0 });
      tl.set(clipRectRef.current, { attr: { width: 0 } });
      tl.set(
        [vocalLabelRef.current, drumLabelRef.current, instrLabelRef.current],
        { opacity: 0, x: -10 }
      );
      tl.set(phaseTextRef.current, { opacity: 0 });
      tl.set(fftBadgeRef.current, { opacity: 0, scale: 0.8 });
      tl.set(sectionStripRef.current, { opacity: 0.5 });

      // Subtle scale pulse on composite
      tl.fromTo(
        compositeRef.current,
        { scaleY: 0.97, transformOrigin: "center center" },
        {
          scaleY: 1.03,
          duration: 1.2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        0
      );

      // ── Phase 2: Spectral Reveal (2.5 → 5.5s) ──
      const scanStart = 2.5;

      // Show phase text
      tl.to(phaseTextRef.current, { opacity: 1, duration: 0.3 }, scanStart);
      tl.to(
        fftBadgeRef.current,
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
        scanStart
      );

      // Scan line appears and sweeps
      tl.set(scanLineRef.current, { opacity: 1 }, scanStart);
      tl.set(scanGlowRef.current, { opacity: 1 }, scanStart);
      tl.fromTo(
        scanLineRef.current,
        { attr: { x: 0 } },
        { attr: { x: W }, duration: 3, ease: "power2.out" },
        scanStart
      );
      tl.fromTo(
        scanGlowRef.current,
        { attr: { x: -15 } },
        { attr: { x: W - 15 }, duration: 3, ease: "power2.out" },
        scanStart
      );

      // Clip rect reveals the colored stems behind the composite
      tl.fromTo(
        clipRectRef.current,
        { attr: { width: 0 } },
        { attr: { width: W }, duration: 3, ease: "power2.out" },
        scanStart
      );

      // Fade in stems (behind clip) as scan progresses
      tl.to(
        vocalsRef.current,
        { opacity: 0.7, duration: 0.5 },
        scanStart + 0.3
      );
      tl.to(
        drumsRef.current,
        { opacity: 0.7, duration: 0.5 },
        scanStart + 0.3
      );
      tl.to(
        instrumentsRef.current,
        { opacity: 0.7, duration: 0.5 },
        scanStart + 0.3
      );

      // Fade out composite as stems are revealed
      tl.to(
        compositeRef.current,
        { opacity: 0, duration: 1.5 },
        scanStart + 1.5
      );

      // ── Phase 3: Separation (5.5 → 8.5s) ──
      const sepStart = 5.5;

      // Update phase text
      tl.to(fftBadgeRef.current, { opacity: 0, duration: 0.2 }, sepStart);
      tl.to(phaseTextRef.current, {
        opacity: 1,
        duration: 0.01,
        onStart: () => {
          if (phaseTextRef.current)
            phaseTextRef.current.textContent = "Separating stems";
        },
      }, sepStart + 0.2);

      // Hide scan line
      tl.to(
        [scanLineRef.current, scanGlowRef.current],
        { opacity: 0, duration: 0.4 },
        sepStart
      );

      // Morph stems from center to separated positions
      tl.to(
        vocalsRef.current,
        {
          attr: { d: vocalsPath },
          opacity: 0.9,
          duration: 2,
          ease: "power3.inOut",
        },
        sepStart + 0.3
      );
      tl.to(
        drumsRef.current,
        {
          attr: { d: drumsPath },
          opacity: 0.9,
          duration: 2,
          ease: "power3.inOut",
        },
        sepStart + 0.3
      );
      tl.to(
        instrumentsRef.current,
        {
          attr: { d: instrumentsPath },
          opacity: 0.9,
          duration: 2,
          ease: "power3.inOut",
        },
        sepStart + 0.3
      );

      // Stem labels fade in staggered
      tl.to(
        vocalLabelRef.current,
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
        sepStart + 1.2
      );
      tl.to(
        drumLabelRef.current,
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
        sepStart + 1.4
      );
      tl.to(
        instrLabelRef.current,
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
        sepStart + 1.6
      );

      // ── Phase 4: Remix (8.5 → 11s) ──
      const remixStart = 8.5;

      tl.to(phaseTextRef.current, {
        opacity: 1,
        duration: 0.01,
        onStart: () => {
          if (phaseTextRef.current)
            phaseTextRef.current.textContent = "Remixing";
        },
      }, remixStart);

      // Shift some stem segments via translateX
      tl.to(
        vocalsRef.current,
        {
          x: 25,
          duration: 1.5,
          ease: "power2.inOut",
        },
        remixStart + 0.3
      );
      tl.to(
        instrumentsRef.current,
        {
          x: -20,
          duration: 1.5,
          ease: "power2.inOut",
        },
        remixStart + 0.3
      );

      // ── Phase 5: Recombine (11 → 13s) ──
      const recombineStart = 11;

      tl.to(phaseTextRef.current, {
        opacity: 1,
        duration: 0.01,
        onStart: () => {
          if (phaseTextRef.current)
            phaseTextRef.current.textContent = "New mashup created";
        },
      }, recombineStart);

      // Undo remix shifts
      tl.to(
        [vocalsRef.current, instrumentsRef.current],
        { x: 0, duration: 1, ease: "power2.inOut" },
        recombineStart
      );

      // Morph stems back to center
      tl.to(
        vocalsRef.current,
        {
          attr: { d: vocalsCenterPath },
          opacity: 0.5,
          duration: 1.5,
          ease: "power3.inOut",
        },
        recombineStart + 0.3
      );
      tl.to(
        drumsRef.current,
        {
          attr: { d: drumsCenterPath },
          opacity: 0.5,
          duration: 1.5,
          ease: "power3.inOut",
        },
        recombineStart + 0.3
      );
      tl.to(
        instrumentsRef.current,
        {
          attr: { d: instrumentsCenterPath },
          opacity: 0.5,
          duration: 1.5,
          ease: "power3.inOut",
        },
        recombineStart + 0.3
      );

      // Fade in composite (now gradient colored via CSS)
      tl.to(
        compositeRef.current,
        { opacity: 0.85, duration: 1, ease: "power2.in" },
        recombineStart + 1
      );

      // Fade out stems and labels
      tl.to(
        [vocalsRef.current, drumsRef.current, instrumentsRef.current],
        { opacity: 0, duration: 0.8 },
        recombineStart + 1.2
      );
      tl.to(
        [
          vocalLabelRef.current,
          drumLabelRef.current,
          instrLabelRef.current,
        ],
        { opacity: 0, x: -10, duration: 0.5 },
        recombineStart + 1
      );

      // Fade phase text
      tl.to(
        phaseTextRef.current,
        { opacity: 0, duration: 0.5 },
        recombineStart + 1.5
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="card relative w-full overflow-hidden p-0">
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

        <div className="flex items-center gap-2">
          <span
            ref={fftBadgeRef}
            className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary md:text-[10px]"
            style={{ opacity: 0 }}
          >
            FFT
          </span>
          <div
            ref={phaseTextRef}
            className="font-mono text-[10px] text-zinc-400 md:text-xs"
            style={{ opacity: 0 }}
          >
            Analyzing frequency spectrum
          </div>
        </div>
      </div>

      {/* SVG animation area */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[200px] w-full md:h-[280px]"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient for composite waveform after recombine */}
            <linearGradient id="compositeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={STEM_COLORS.vocals} />
              <stop offset="35%" stopColor={STEM_COLORS.drums} />
              <stop offset="65%" stopColor={STEM_COLORS.drums} />
              <stop offset="100%" stopColor={STEM_COLORS.instruments} />
            </linearGradient>

            {/* Glow filters */}
            <filter id="glowVocals" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowDrums" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowInstruments" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="scanGlow" x="-200%" y="0" width="500%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>

            {/* Clip path for spectral reveal */}
            <clipPath id="revealClip">
              <rect
                ref={clipRectRef}
                x="0"
                y="0"
                width="0"
                height={H}
              />
            </clipPath>
          </defs>

          {/* Composite waveform (white → gradient after recombine) */}
          <path
            ref={compositeRef}
            d={compositePath}
            fill="url(#compositeGrad)"
            opacity="1"
          />

          {/* Stem waveforms (revealed by clip, then morphed to separated positions) */}
          <g clipPath="url(#revealClip)">
            <path
              ref={vocalsRef}
              d={vocalsCenterPath}
              fill={STEM_COLORS.vocals}
              filter="url(#glowVocals)"
              opacity="0"
            />
            <path
              ref={drumsRef}
              d={drumsCenterPath}
              fill={STEM_COLORS.drums}
              filter="url(#glowDrums)"
              opacity="0"
            />
            <path
              ref={instrumentsRef}
              d={instrumentsCenterPath}
              fill={STEM_COLORS.instruments}
              filter="url(#glowInstruments)"
              opacity="0"
            />
          </g>

          {/* Scan line */}
          <rect
            ref={scanGlowRef}
            x="0"
            y="0"
            width="30"
            height={H}
            fill="#7C8BFF"
            filter="url(#scanGlow)"
            opacity="0"
          />
          <rect
            ref={scanLineRef}
            x="0"
            y="0"
            width="2"
            height={H}
            fill="rgba(124, 139, 255, 0.9)"
            opacity="0"
          />
        </svg>

        {/* Stem labels */}
        <div
          ref={vocalLabelRef}
          className="absolute left-3 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0, top: "12%" }}
        >
          <div className="h-2 w-2 rounded-full bg-[#9580FF] shadow-[0_0_6px_rgba(149,128,255,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#9580FF] uppercase tracking-wider md:text-xs">
            Vocals
          </span>
        </div>

        <div
          ref={drumLabelRef}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0 }}
        >
          <div className="h-2 w-2 rounded-full bg-[#FF6B4A] shadow-[0_0_6px_rgba(255,107,74,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#FF6B4A] uppercase tracking-wider md:text-xs">
            Drums
          </span>
        </div>

        <div
          ref={instrLabelRef}
          className="absolute left-3 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0, bottom: "12%" }}
        >
          <div className="h-2 w-2 rounded-full bg-[#3DDC84] shadow-[0_0_6px_rgba(61,220,132,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#3DDC84] uppercase tracking-wider md:text-xs">
            Instrumental
          </span>
        </div>

        {/* Section color strip */}
        <div
          ref={sectionStripRef}
          className="absolute bottom-0 left-0 right-0 flex h-[3px]"
        >
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              style={{
                width: `${s.width * 100}%`,
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
