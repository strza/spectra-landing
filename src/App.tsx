import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { WaitlistSignup } from "./components/WaitlistSignup";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <WaitlistSignup />
      <Footer />
    </div>
  );
}
