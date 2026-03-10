import { motion } from "framer-motion";
import { Layers, AudioWaveform, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  Icon: LucideIcon;
  iconColor: string;
  glowColor: string;
}

const features: Feature[] = [
  {
    title: "Remix Anything",
    description:
      "Split, rearrange, and recombine any track into something new",
    Icon: Layers,
    iconColor: "#7C8BFF",
    glowColor: "rgba(124, 139, 255, 0.3)",
  },
  {
    title: "Stem Separation",
    description:
      "Isolate vocals, drums, and instrumentals with AI precision",
    Icon: AudioWaveform,
    iconColor: "#B78EE0",
    glowColor: "rgba(183, 142, 224, 0.3)",
  },
  {
    title: "Spectral Analysis",
    description: "Pro-grade waveforms and frequency visualization",
    Icon: Activity,
    iconColor: "#36D9CA",
    glowColor: "rgba(54, 217, 202, 0.3)",
  },
];

export function Features() {
  return (
    <section className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          className="mb-10 text-center font-display text-2xl font-bold text-white md:mb-12 md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Everything you need to remix
        </motion.h2>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="card group p-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-shadow duration-300"
                style={{
                  backgroundColor: `${feature.iconColor}15`,
                  border: `1px solid ${feature.iconColor}25`,
                }}
              >
                <feature.Icon
                  size={20}
                  style={{ color: feature.iconColor }}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-white md:text-lg">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
