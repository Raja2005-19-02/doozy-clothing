import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-950 text-center px-6">
      <div>
        <div className="eyebrow text-silver-500 mb-4">Error 404</div>
        <div className="font-display text-7xl md:text-8xl silver-text">Lost.</div>
        <p className="text-silver-400 mt-4 text-sm">
          This page slipped into the shadows.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Back Home
        </Link>
      </div>
    </div>
  );
}
