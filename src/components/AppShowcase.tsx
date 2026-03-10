import { motion } from "framer-motion";

interface Screenshot {
  src: string;
  alt: string;
  label: string;
  description: string;
}

const screenshots: Screenshot[] = [
  {
    src: "/screenshots/mixer.png",
    alt: "Spectra mixer view showing separated stems with individual volume controls",
    label: "Stem Mixer",
    description:
      "Separate any track into vocals, drums, and instrumentals — then mix them independently",
  },
  {
    src: "/screenshots/remix.png",
    alt: "Spectra remix view showing two tracks with structural analysis and mashup timeline",
    label: "Remix Studio",
    description:
      "Load two tracks, analyze their structure, and create mashups with one-click presets",
  },
];

export function AppShowcase() {
  return (
    <section className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          className="mb-3 text-center font-display text-2xl font-bold text-white md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          See it in action
        </motion.h2>
        <motion.p
          className="mb-10 text-center text-sm text-zinc-500 md:mb-12 md:text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Professional-grade tools, beautifully designed
        </motion.p>

        <div className="flex flex-col gap-6 md:gap-8">
          {screenshots.map((shot, i) => (
            <motion.div
              key={shot.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              {/* Screenshot card */}
              <div className="card group overflow-hidden p-0">
                {/* Label bar */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 md:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]/70" />
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 md:text-xs">
                      spectra — {shot.label.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Screenshot image */}
                <div className="relative overflow-hidden">
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    className="w-full transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  {/* Subtle vignette */}
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]" />
                </div>
              </div>

              {/* Caption below */}
              <div className="mt-3 px-1">
                <h3 className="text-sm font-semibold text-white md:text-base">
                  {shot.label}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 md:text-sm">
                  {shot.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
