import { motion } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Upload",
    description: "Drop in any track — MP3, WAV, FLAC",
  },
  {
    number: "02",
    title: "AI Separates",
    description: "Stems are isolated in seconds using neural networks",
  },
  {
    number: "03",
    title: "Remix & Download",
    description: "Rearrange, recombine, and download your creation",
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-16 text-center font-display text-3xl font-bold text-white md:text-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          How it works
        </motion.h2>

        <div className="relative flex flex-col gap-12 md:gap-16">
          <div className="absolute left-8 top-0 bottom-0 hidden w-px bg-gradient-to-b from-primary/50 via-aurora-purple/50 to-accent/50 md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="flex items-start gap-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-surface font-display text-lg font-bold text-primary">
                {step.number}
              </div>
              <div className="pt-3">
                <h3 className="mb-1 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-zinc-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
