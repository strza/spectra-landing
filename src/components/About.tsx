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
          className="card space-y-5 p-6 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Spectra was born at the intersection of two passions: DJing and
            artificial intelligence. Late nights spent mixing tracks led to a
            familiar frustration — wanting to isolate a vocal, swap a bassline,
            or rearrange a song's structure, but having no clean way to do it
            without expensive studio tools or hours of manual editing.
          </p>

          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Meanwhile, breakthroughs in deep learning were making the impossible
            possible. Neural networks could now hear the individual
            instruments inside a mixed recording — the same way a trained
            musician's ear can pick apart a chord. The technology existed, but
            it was locked behind research papers and command-line scripts.
          </p>

          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            So we decided to bridge the gap. We built Spectra to put the
            power of AI stem separation into the hands of DJs, producers,
            and music lovers — wrapped in a beautiful, intuitive interface that
            feels like it belongs in your creative workflow. No setup, no
            technical knowledge required. Just drop in a track and start
            creating.
          </p>

          <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
            What started as a personal tool for weekend DJ sets is becoming
            something bigger — a platform where anyone can deconstruct,
            understand, and reimagine music.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
