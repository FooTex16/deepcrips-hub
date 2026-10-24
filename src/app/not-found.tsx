import Link from "next/link";
import { Search, Home } from "lucide-react";
import { Section } from "@/components/layout/section";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-gradient-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Halaman yang Anda cari tidak ada, tidak tersedia, atau mungkin telah dipindahkan.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonVariants("primary", "md")}>
          <Home className="h-4 w-4" aria-hidden />
          Beranda
        </Link>
        <Link href="/search" className={buttonVariants("outline", "md")}>
          <Search className="h-4 w-4" aria-hidden />
          Cari konten
        </Link>
      </div>
    </Section>
  );
}
