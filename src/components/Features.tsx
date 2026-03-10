import { motion } from "framer-motion";

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const features: Feature[] = [
  {
    title: "Remix Anything",
    description: "Split, rearrange, and recombine any track into something new",
    icon: "🎛️",
  },
  {
    title: "Stem Separation",
    description: "Isolate vocals, drums, and instrumentals with AI precision",
    icon: "🎵",
  },
  {
    title: "Spectral Analysis",
    description: "Pro-grade waveforms and frequency visualization",
    icon: "📊",
  },
];

export function Features() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="mb-16 text-center font-display text-3xl font-bold text-white md:text-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          Everything you need to remix
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="card p-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
