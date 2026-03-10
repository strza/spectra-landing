import { useCallback } from "react";
import { Logo } from "./Logo";

export function Hero() {
  const scrollToWaitlist = useCallback(() => {
    document
      .getElementById("waitlist")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute left-1/3 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-purple/10 blur-[100px]" />
        <div className="absolute right-1/3 bottom-1/3 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-aurora-cyan/8 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo size="lg" />

        <p className="mt-6 text-xl font-medium text-zinc-300 md:text-2xl">
          The easiest way to remix music
        </p>

        <p className="mt-4 max-w-lg text-base text-zinc-500">
          AI-powered stem separation and remixing for DJs and producers
        </p>

        {/* WebGL animation container — Task 5 will render here */}
        <div className="my-12 h-[200px] w-full max-w-3xl md:h-[280px]">
          <div className="flex h-full items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-sm text-zinc-600">
              WebGL Animation Placeholder
            </span>
          </div>
        </div>

        <button
          onClick={scrollToWaitlist}
          className="btn btn-primary px-8 py-4 text-lg"
        >
          Join the Waitlist
        </button>
      </div>
    </section>
  );
}
