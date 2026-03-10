import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { AppShowcase } from "./components/AppShowcase";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { WaitlistSignup } from "./components/WaitlistSignup";
import { Footer } from "./components/Footer";
import { AuroraBackground } from "./components/AuroraBackground";

export default function App() {
  return (
    <div className="relative min-h-screen bg-background text-white">
      <AuroraBackground />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <AppShowcase />
        <Features />
        <HowItWorks />
        <WaitlistSignup />
        <Footer />
      </div>
    </div>
  );
}
