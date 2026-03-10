import { motion } from "framer-motion";
import { Upload, Cpu, Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Upload",
    description: "Drop in any track — MP3, WAV, FLAC",
    Icon: Upload,
    color: "#7C8BFF",
  },
  {
    number: "02",
    title: "AI Separates",
    description: "Stems are isolated in seconds using neural networks",
    Icon: Cpu,
    color: "#B78EE0",
  },
  {
    number: "03",
    title: "Remix & Download",
    description: "Rearrange, recombine, and download your creation",
    Icon: Download,
    color: "#36D9CA",
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-10 text-center font-display text-2xl font-bold text-white md:mb-12 md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          How it works
        </motion.h2>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="card flex flex-col items-center p-6 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${step.color}15`,
                  border: `1px solid ${step.color}30`,
                }}
              >
                <step.Icon
                  size={22}
                  style={{ color: step.color }}
                  strokeWidth={1.5}
                />
              </div>

              <div className="mb-2 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
                Step {step.number}
              </div>

              <h3 className="mb-1.5 text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {step.description}
              </p>

              {/* Connecting arrow (hidden on mobile, shown between cards) */}
              {i < steps.length - 1 && (
                <div className="mt-4 hidden text-zinc-700 md:hidden">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
