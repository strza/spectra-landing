import { useCallback } from "react";
import { Logo } from "./Logo";
import { MashupAnimation } from "./MashupAnimation";

export function Hero() {
  const scrollToWaitlist = useCallback(() => {
    document
      .getElementById("waitlist")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-6">
      {/* Subtle radial gradient for depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <Logo size="lg" />

        <p className="mt-4 text-lg font-medium text-zinc-300 md:mt-5 md:text-2xl">
          The easiest way to remix music
        </p>

        <p className="mt-2 max-w-md text-sm text-zinc-500 md:text-base">
          AI-powered stem separation and remixing for DJs and producers
        </p>

        {/* Mashup animation — full width */}
        <div className="mt-8 w-full md:mt-10">
          <MashupAnimation />
        </div>

        <button
          onClick={scrollToWaitlist}
          className="btn btn-primary mt-8 px-8 py-3.5 text-base md:text-lg"
        >
          Join the Waitlist
        </button>
      </div>
    </section>
  );
}
