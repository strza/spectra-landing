import { useRef, useMemo, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// ─── Config ────────────────────────────────────────────────────────

const BAR_COUNT = 500;

// ─── Data Generation ───────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate realistic peak data that looks like actual audio waveform RMS peaks */
function generatePeaks(seed: number, character: "full" | "vocals" | "drums" | "instruments"): Float32Array {
  const rng = seededRng(seed);
  const peaks = new Float32Array(BAR_COUNT);

  for (let i = 0; i < BAR_COUNT; i++) {
    const t = i / BAR_COUNT;

    // Musical structure envelope
    let envelope =
      0.15 +
      0.50 * Math.sin(t * Math.PI) +
      0.15 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 4)), 2) * Math.sin(t * Math.PI) +
      0.10 * Math.max(0, Math.sin(t * Math.PI * 2 - 0.5));
    envelope = Math.max(0.05, Math.min(1, envelope));

    // Character-specific modulation
    let detail: number;
    switch (character) {
      case "vocals":
        // Smoother, phrase-based, with gaps
        detail = 0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 12 + rng() * 2));
        detail *= (rng() > 0.15) ? 1 : 0.15; // occasional silence (breath gaps)
        break;
      case "drums":
        // Rhythmic transients — regular peaks
        detail = 0.2 + 0.8 * Math.pow(rng(), 0.5);
        // Beat pattern: stronger hits at regular intervals
        if (i % 12 < 2) detail = 0.7 + 0.3 * rng(); // kick
        if (i % 12 === 6) detail = 0.5 + 0.3 * rng(); // snare
        if (i % 3 === 0) detail = Math.max(detail, 0.3 + 0.2 * rng()); // hi-hat
        break;
      case "instruments":
        // Flowing, sustained, harmonically rich
        detail = 0.4 + 0.6 * (
          0.5 + 0.3 * Math.sin(t * Math.PI * 8 + rng()) +
          0.2 * Math.sin(t * Math.PI * 16 + rng() * 3)
        );
        detail += 0.15 * (rng() - 0.5);
        break;
      default: // "full"
        // Dense, detailed — combination of all elements
        detail = 0.3 + 0.7 * rng();
        // Add rhythmic pattern underneath
        if (i % 12 < 2) detail = Math.max(detail, 0.6 + 0.3 * rng());
        // Add some phrase variation
        detail *= 0.7 + 0.3 * Math.abs(Math.sin(t * Math.PI * 6 + 1.5));
        break;
    }

    peaks[i] = Math.max(0.02, Math.min(1, envelope * detail));
  }

  return peaks;
}

// ─── Canvas Waveform Renderer ──────────────────────────────────────

function renderWaveform(
  canvas: HTMLCanvasElement,
  peaks: Float32Array,
  color: string,
  opts: { opacity?: number } = {}
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width * dpr;
  const h = rect.height * dpr;

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.clearRect(0, 0, w, h);

  const midY = h / 2;
  const barW = w / peaks.length;
  const gap = barW > 3 ? 1 : 0.5;
  const maxH = midY * 0.88;

  ctx.fillStyle = color;
  ctx.globalAlpha = opts.opacity ?? 0.9;

  for (let i = 0; i < peaks.length; i++) {
    const x = i * barW;
    const barH = peaks[i] * maxH;
    ctx.fillRect(x, midY - barH, Math.max(0.5, barW - gap), barH * 2);
  }

  ctx.globalAlpha = 1;
}

// ─── Section color strip ───────────────────────────────────────────

const SECTIONS = [
  { width: "12%", color: "#7C8BFF" },
  { width: "15%", color: "#E8A54F" },
  { width: "22%", color: "#F06858" },
  { width: "10%", color: "#36D9CA" },
  { width: "24%", color: "#F06858" },
  { width: "17%", color: "#B78EE0" },
];

// ─── Component ─────────────────────────────────────────────────────

export function SpectralAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas refs
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const vocalsCanvasRef = useRef<HTMLCanvasElement>(null);
  const drumsCanvasRef = useRef<HTMLCanvasElement>(null);
  const instrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Container refs (for GSAP layout animation)
  const compositeWrapRef = useRef<HTMLDivElement>(null);
  const stemsWrapRef = useRef<HTMLDivElement>(null);
  const vocalsWrapRef = useRef<HTMLDivElement>(null);
  const drumsWrapRef = useRef<HTMLDivElement>(null);
  const instrWrapRef = useRef<HTMLDivElement>(null);

  // UI refs
  const scanLineRef = useRef<HTMLDivElement>(null);
  const phaseTextRef = useRef<HTMLDivElement>(null);
  const fftBadgeRef = useRef<HTMLSpanElement>(null);
  const vocalLabelRef = useRef<HTMLDivElement>(null);
  const drumLabelRef = useRef<HTMLDivElement>(null);
  const instrLabelRef = useRef<HTMLDivElement>(null);

  // Generate peak data
  const compositePeaks = useMemo(() => generatePeaks(42, "full"), []);
  const vocalsPeaks = useMemo(() => generatePeaks(73, "vocals"), []);
  const drumsPeaks = useMemo(() => generatePeaks(17, "drums"), []);
  const instrPeaks = useMemo(() => generatePeaks(129, "instruments"), []);

  // Draw all canvases
  const drawAll = useCallback(() => {
    if (compositeCanvasRef.current)
      renderWaveform(compositeCanvasRef.current, compositePeaks, "rgba(200, 200, 215, 0.9)");
    if (vocalsCanvasRef.current)
      renderWaveform(vocalsCanvasRef.current, vocalsPeaks, "#9580FF");
    if (drumsCanvasRef.current)
      renderWaveform(drumsCanvasRef.current, drumsPeaks, "#FF6B4A");
    if (instrCanvasRef.current)
      renderWaveform(instrCanvasRef.current, instrPeaks, "#3DDC84");
  }, [compositePeaks, vocalsPeaks, drumsPeaks, instrPeaks]);

  // Initial draw + resize handler
  useEffect(() => {
    drawAll();
    window.addEventListener("resize", drawAll);
    return () => window.removeEventListener("resize", drawAll);
  }, [drawAll]);

  // GSAP timeline
  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      // ── Initial state ──
      tl.set(compositeWrapRef.current, { opacity: 1 });
      tl.set(stemsWrapRef.current, { opacity: 0 });
      tl.set(scanLineRef.current, { opacity: 0, left: "0%" });
      tl.set(phaseTextRef.current, { opacity: 0 });
      tl.set(fftBadgeRef.current, { opacity: 0, scale: 0.8 });
      tl.set(
        [vocalLabelRef.current, drumLabelRef.current, instrLabelRef.current],
        { opacity: 0, x: -8 }
      );
      // Stems start stacked (all at the same position)
      tl.set(vocalsWrapRef.current, { y: 0 });
      tl.set(drumsWrapRef.current, { y: 0 });
      tl.set(instrWrapRef.current, { y: 0 });

      // ── Phase 1: The Track (0 → 2.5s) ──
      // Gentle breathing animation on composite
      tl.fromTo(
        compositeWrapRef.current,
        { scaleY: 0.97, transformOrigin: "center center" },
        { scaleY: 1.02, duration: 1.25, yoyo: true, repeat: 1, ease: "sine.inOut" },
        0
      );

      // ── Phase 2: Spectral Reveal (2.5 → 5.5s) ──
      const p2 = 2.5;

      // Show phase label + FFT badge
      tl.to(phaseTextRef.current, {
        opacity: 1, duration: 0.3,
        onStart() { if (phaseTextRef.current) phaseTextRef.current.textContent = "Analyzing frequency spectrum"; }
      }, p2);
      tl.to(fftBadgeRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, p2);

      // Scan line sweeps left → right
      tl.set(scanLineRef.current, { opacity: 1 }, p2);
      tl.fromTo(
        scanLineRef.current,
        { left: "0%" },
        { left: "100%", duration: 2.8, ease: "power2.out" },
        p2
      );

      // Reveal stems behind scan line using clip-path
      tl.set(stemsWrapRef.current, { opacity: 1, clipPath: "inset(0 100% 0 0)" }, p2);
      tl.to(
        stemsWrapRef.current,
        { clipPath: "inset(0 0% 0 0)", duration: 2.8, ease: "power2.out" },
        p2
      );

      // Fade composite as stems revealed
      tl.to(compositeWrapRef.current, { opacity: 0, duration: 1.2 }, p2 + 1.6);

      // Hide scan line
      tl.to(scanLineRef.current, { opacity: 0, duration: 0.4 }, p2 + 2.6);

      // ── Phase 3: Separation (5.5 → 8.5s) ──
      const p3 = 5.5;

      // Update label
      tl.to(fftBadgeRef.current, { opacity: 0, duration: 0.2 }, p3);
      tl.to(phaseTextRef.current, {
        duration: 0.01,
        onStart() { if (phaseTextRef.current) phaseTextRef.current.textContent = "Separating stems"; }
      }, p3 + 0.2);

      // Remove clip-path
      tl.set(stemsWrapRef.current, { clipPath: "none" }, p3);

      // Stems spread apart vertically
      tl.to(vocalsWrapRef.current, { y: "-100%", duration: 2, ease: "power3.inOut" }, p3 + 0.2);
      tl.to(instrWrapRef.current, { y: "100%", duration: 2, ease: "power3.inOut" }, p3 + 0.2);
      // Drums stays at center (y: 0)

      // Stem labels fade in
      tl.to(vocalLabelRef.current, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, p3 + 1.2);
      tl.to(drumLabelRef.current, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, p3 + 1.4);
      tl.to(instrLabelRef.current, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, p3 + 1.6);

      // ── Phase 4: Remix (8.5 → 11s) ──
      const p4 = 8.5;

      tl.to(phaseTextRef.current, {
        duration: 0.01,
        onStart() { if (phaseTextRef.current) phaseTextRef.current.textContent = "Remixing"; }
      }, p4);

      // Shift some stems horizontally
      tl.to(vocalsWrapRef.current, { x: 20, duration: 1.5, ease: "power2.inOut" }, p4 + 0.2);
      tl.to(instrWrapRef.current, { x: -15, duration: 1.5, ease: "power2.inOut" }, p4 + 0.2);

      // ── Phase 5: Recombine (11 → 13s) ──
      const p5 = 11;

      tl.to(phaseTextRef.current, {
        duration: 0.01,
        onStart() { if (phaseTextRef.current) phaseTextRef.current.textContent = "New mashup created"; }
      }, p5);

      // Undo horizontal shifts
      tl.to(
        [vocalsWrapRef.current, instrWrapRef.current],
        { x: 0, duration: 0.8, ease: "power2.inOut" },
        p5
      );

      // Stems come back together
      tl.to(vocalsWrapRef.current, { y: 0, duration: 1.2, ease: "power3.inOut" }, p5 + 0.3);
      tl.to(instrWrapRef.current, { y: 0, duration: 1.2, ease: "power3.inOut" }, p5 + 0.3);

      // Fade out labels
      tl.to(
        [vocalLabelRef.current, drumLabelRef.current, instrLabelRef.current],
        { opacity: 0, x: -8, duration: 0.4 },
        p5 + 0.5
      );

      // Fade stems out, composite back in
      tl.to(stemsWrapRef.current, { opacity: 0, duration: 0.6 }, p5 + 1.2);
      tl.to(compositeWrapRef.current, { opacity: 1, scaleY: 1, duration: 0.6 }, p5 + 1.4);

      // Fade phase text
      tl.to(phaseTextRef.current, { opacity: 0, duration: 0.4 }, p5 + 1.6);
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

      {/* Waveform area */}
      <div className="relative h-[200px] md:h-[280px]">

        {/* Composite (white) waveform */}
        <div ref={compositeWrapRef} className="absolute inset-0">
          <canvas ref={compositeCanvasRef} className="h-full w-full" />
        </div>

        {/* Stem waveforms (stacked, animated apart) */}
        <div ref={stemsWrapRef} className="absolute inset-0" style={{ opacity: 0 }}>
          {/* Each stem is positioned at center, GSAP moves them apart */}
          <div className="relative h-full">
            <div
              ref={vocalsWrapRef}
              className="absolute inset-x-0"
              style={{ top: 0, height: "100%" }}
            >
              <canvas ref={vocalsCanvasRef} className="h-full w-full" />
            </div>
            <div
              ref={drumsWrapRef}
              className="absolute inset-x-0"
              style={{ top: 0, height: "100%" }}
            >
              <canvas ref={drumsCanvasRef} className="h-full w-full" />
            </div>
            <div
              ref={instrWrapRef}
              className="absolute inset-x-0"
              style={{ top: 0, height: "100%" }}
            >
              <canvas ref={instrCanvasRef} className="h-full w-full" />
            </div>
          </div>
        </div>

        {/* Scan line */}
        <div
          ref={scanLineRef}
          className="absolute top-0 bottom-0 z-20 w-[2px]"
          style={{
            opacity: 0,
            background: "rgba(124, 139, 255, 0.9)",
            boxShadow:
              "0 0 12px 4px rgba(124, 139, 255, 0.5), 0 0 30px 8px rgba(183, 142, 224, 0.25)",
          }}
        />

        {/* Stem labels */}
        <div
          ref={vocalLabelRef}
          className="absolute left-3 top-[8%] z-30 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0 }}
        >
          <div className="h-2 w-2 rounded-full bg-[#9580FF] shadow-[0_0_6px_rgba(149,128,255,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#9580FF] uppercase tracking-wider md:text-xs">
            Vocals
          </span>
        </div>
        <div
          ref={drumLabelRef}
          className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0 }}
        >
          <div className="h-2 w-2 rounded-full bg-[#FF6B4A] shadow-[0_0_6px_rgba(255,107,74,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#FF6B4A] uppercase tracking-wider md:text-xs">
            Drums
          </span>
        </div>
        <div
          ref={instrLabelRef}
          className="absolute bottom-[8%] left-3 z-30 flex items-center gap-1.5 md:left-4"
          style={{ opacity: 0 }}
        >
          <div className="h-2 w-2 rounded-full bg-[#3DDC84] shadow-[0_0_6px_rgba(61,220,132,0.6)]" />
          <span className="font-mono text-[10px] font-medium text-[#3DDC84] uppercase tracking-wider md:text-xs">
            Instrumental
          </span>
        </div>

        {/* Section color strip */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[3px]">
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              style={{ width: s.width, backgroundColor: s.color, opacity: 0.5 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
