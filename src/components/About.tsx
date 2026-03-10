import { motion } from "framer-motion";

export function About() {
  return (
    <section id="about" className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="mb-8 text-center font-display text-2xl font-bold text-white md:mb-10 md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Our story
        </motion.h2>

        <motion.div
          className="card space-y-4 p-6 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Spectra was born where two passions collide — DJing and AI. Late
            nights mixing tracks led to a familiar frustration: wanting to
            isolate a vocal or swap a bassline, but having no clean way to do
            it without expensive tools or hours of manual work.
          </p>

          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Deep learning changed that. Neural networks can now hear individual
            instruments inside a mixed recording, but the technology was locked
            behind research papers and command-line scripts. We built Spectra to
            bridge that gap — AI-powered stem separation in a beautiful
            interface that just works.
          </p>

          <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
            What started as a personal tool for weekend DJ sets is becoming a
            platform where anyone can deconstruct, understand, and reimagine
            music.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
