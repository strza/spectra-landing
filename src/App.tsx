export default function App() {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-8">
      <h1 className="font-display text-6xl text-gradient">SPECTRA</h1>
      <div className="card p-8">
        <p className="text-zinc-400">Glassmorphic card</p>
      </div>
      <button className="btn btn-primary">Join Waitlist</button>
      <button className="btn btn-secondary">Learn More</button>
    </div>
  );
}
