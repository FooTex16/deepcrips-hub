import Link from "next/link";
import { ShieldCheck, ShieldAlert, KeyRound, EyeOff, ServerCog, Download } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Informasi Keamanan",
  description:
    "Bagaimana DeepCrips Hub melindungi data Anda dan apa yang tidak dapat kami jamin. Penjelasan jujur tanpa klaim berlebihan.",
};

const PROTECTIONS = [
  {
    icon: <KeyRound className="h-5 w-5" aria-hidden />,
    title: "Login Google (OAuth 2.0)",
    body: "Kami tidak menyimpan kata sandi Anda. Autentikasi ditangani sepenuhnya oleh Google melalui OAuth 2.0 — kami hanya menerima sesi yang sudah divalidasi.",
  },
  {
    icon: <EyeOff className="h-5 w-5" aria-hidden />,
    title: "URL unduhan tidak dipublikasikan",
    body: "Alamat host unduhan (Drive/MediaFire/dst.) tidak pernah ditampilkan di halaman publik atau dikirim ke browser. Setiap klik unduhan melewati server yang memvalidasi izin Anda sealu mengalihkan ke URL tersebut.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" aria-hidden />,
    title: "Otorisasi di sisi server",
    body: "Setiap permintaan data sensitif diperiksa di server (bukan hanya disembunyikan di UI). Row Level Security (RLS) aktif di seluruh tabel database.",
  },
  {
    icon: <ServerCog className="h-5 w-5" aria-hidden />,
    title: "Rahasia tidak di frontend",
    body: "Service role key dan kredensial admin hanya ada di environment variable server. Tidak ada rahasia yang dikirim ke browser.",
  },
  {
    icon: <Download className="h-5 w-5" aria-hidden />,
    title: "Pelacakan unduhan terbatas",
    body: "Kami mencatat fakta bahwa sebuah tombol diklik (file, versi, host, waktu) untuk statistik. Kami tidak melacak identitas Anda melalui file unduhan.",
  },
];

const LIMITATIONS = [
  "Kami TIDAK dapat menjamin bahwa setiap file 100% bebas dari malware — verifikasi pihak ketiga tetap diperlukan.",
  "Rate limiting berbasis memori per-instance; pada serverless, batas per-IP tidak konsisten antar-instance.",
  "Bila perangkat Anda terinfeksi, sesi login Anda dapat disalahgunakan — keluar dari akun di perangkat bersama.",
  "Kami tidak memindai file dengan antivirus pihak ketiga secara otomatis; pemeriksaan dilakukan manual oleh admin.",
];

export default function SecurityPage() {
  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-8 max-w-2xl">
        <Badge tone="brand" className="mb-3">
          Transparansi Keamanan
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Informasi Keamanan</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Kami percaya pada kejujuran daripada klaim berlebihan. Halaman ini menjelaskan apa yang kami
          lakukan untuk melindungi Anda — dan apa yang <strong className="text-text">tidak dapat kami jamin</strong>.
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        {/* Perlindungan */}
        <h2 className="mb-4 text-lg font-semibold text-text">Yang kami lakukan</h2>
        <ul className="mb-10 space-y-4">
          {PROTECTIONS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-1.5 flex items-center gap-2 text-[15px] font-semibold text-text">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  {p.icon}
                </span>
                {p.title}
              </h3>
              <p className="pl-10 text-sm leading-relaxed text-text-muted">{p.body}</p>
            </li>
          ))}
        </ul>

        {/* Keterbatasan */}
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text">
          <ShieldAlert className="h-5 w-5 text-warning" aria-hidden />
          Keterbatasan (jujur)
        </h2>
        <ul className="mb-10 space-y-2.5 rounded-2xl border border-warning/30 bg-warning/5 p-5">
          {LIMITATIONS.map((l, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              {l}
            </li>
          ))}
        </ul>

        {/* Tips pengguna */}
        <h2 className="mb-4 text-lg font-semibold text-text">Tips untuk Anda</h2>
        <ul className="mb-8 space-y-2.5 rounded-2xl border border-border bg-surface p-5">
          {[
            "Periksa catatan pemeriksaan dan catatan keamanan pada setiap halaman file sebelum mengunduh.",
            "Verifikasi SHA-256 yang tertera bila tersedia — cocokkan dengan file hasil unduhan Anda.",
            "Gunakan perangkat lunak keamanan Anda sendiri untuk memindai file yang diunduh.",
            "Jangan menjalankan file dengan hak admin kecuali Anda memahami apa yang dilakukannya.",
            "Laporkan file yang mencurigakan melalui kanal komunitas atau forum.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {tip}
            </li>
          ))}
        </ul>

        <p className="text-sm text-text-faint">
          Ada pertanyaan keamanan? Baca{" "}
          <Link href="/policies" className="text-brand hover:underline">
            kebijakan & ketentuan
          </Link>{" "}
          atau hubungi kami melalui kanal resmi di footer.
        </p>
      </div>
    </Section>
  );
}
