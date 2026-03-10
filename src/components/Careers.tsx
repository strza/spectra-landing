import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export function Careers() {
  return (
    <section id="careers" className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="mb-8 text-center font-display text-2xl font-bold text-white md:mb-10 md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Join the team
        </motion.h2>

        <motion.div
          className="card space-y-6 p-6 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            We're looking for passionate engineers and researchers to push the
            boundaries of what AI can do with music. If you're excited about
            machine learning, signal processing, and audio analysis — and you
            happen to love music too — we'd love to hear from you.
          </p>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-2 text-base font-semibold text-white">
              ML / Audio Research Engineer
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-zinc-400">
              Work on state-of-the-art source separation models, music
              structure analysis, and novel AI methods for understanding and
              transforming audio. Experience with deep learning frameworks
              (PyTorch), audio/DSP fundamentals, and a genuine curiosity about
              music are what matter most.
            </p>
            <div className="flex flex-wrap gap-2">
              {["PyTorch", "Audio/DSP", "Source Separation", "Music IR"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-mono text-[10px] text-primary/80"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-sm text-zinc-500">
              Interested? Drop us a line.
            </p>
            <a
              href="mailto:michas@spectradj.com?subject=Careers at Spectra"
              className="btn btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Mail size={16} strokeWidth={1.5} />
              michas@spectradj.com
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
