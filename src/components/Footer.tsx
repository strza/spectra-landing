export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Spectra. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
