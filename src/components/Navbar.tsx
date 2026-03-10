import { useCallback, useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo size="sm" />

        <div className="flex items-center gap-6">
          <button
            onClick={() => scrollToSection("about")}
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white md:block"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection("careers")}
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white md:block"
          >
            Careers
          </button>
          <a
            href="mailto:michas@spectradj.com"
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white md:block"
          >
            Contact
          </a>
          <button
            onClick={() => scrollToSection("waitlist")}
            className="btn btn-primary text-sm"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </nav>
  );
}
