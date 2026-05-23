import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-[-0.04em]">Hooked.</Link>
          <Link href="/" className="text-sm font-medium hover:text-muted transition">Back</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 lg:px-10 py-16 md:py-24">
        {children}
      </main>
    </div>
  );
}
