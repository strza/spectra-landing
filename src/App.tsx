import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <section className="flex h-screen items-center justify-center">
        <h1 className="font-display text-6xl text-gradient">Hero</h1>
      </section>
      <section
        id="waitlist"
        className="flex h-screen items-center justify-center"
      >
        <h2 className="text-3xl text-white">Waitlist Section</h2>
      </section>
    </div>
  );
}
