import { motion, AnimatePresence } from "framer-motion";
import { type FormEvent, useCallback, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!email || state === "submitting") return;

      setState("submitting");
      setErrorMessage("");

      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Something went wrong");
        }

        setState("success");
        setEmail("");
      } catch (err) {
        setState("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong, try again"
        );
      }
    },
    [email, state]
  );

  return (
    <section id="waitlist" className="relative px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-lg">
        <motion.div
          className="card p-8 md:p-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-2 text-center font-display text-2xl font-bold text-white md:text-3xl">
            Get early access
          </h2>
          <p className="mb-8 text-center text-zinc-400">
            Be the first to know when Spectra launches
          </p>

          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl text-accent">
                  ✓
                </div>
                <p className="text-lg font-medium text-white">
                  You're on the list!
                </p>
                <p className="text-sm text-zinc-400">
                  We'll let you know when Spectra is ready
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "submitting"}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="btn btn-primary whitespace-nowrap disabled:opacity-50"
                >
                  {state === "submitting" ? "Joining..." : "Join Waitlist"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {state === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-sm text-error"
            >
              {errorMessage}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
