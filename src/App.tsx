import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <Hero />
      <section
        id="waitlist"
        className="flex h-screen items-center justify-center"
      >
        <h2 className="text-3xl text-white">Waitlist Section</h2>
      </section>
    </div>
  );
}
