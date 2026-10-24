import Link from "next/link";
import { ShieldAlert, Scale, Cookie, Users, Flag } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Kebijakan & Ketentuan",
  description: "Kebijakan konten, hak cipta, privasi, dan ketentuan penggunaan DeepCrips Hub.",
};

const SECTIONS = [
  {
    id: "konten",
    icon: <ShieldAlert className="h-5 w-5" aria-hidden />,
    title: "Kebijakan Konten",
    body: [
      "DeepCrips Hub adalah platform konten yang dikelola oleh tim admin. Setiap file, tutorial, dan video melewati proses moderasi sebelum ditampilkan publik.",
      "Kami berupaya memastikan konten berasal dari sumber yang dapat dipercaya, namun kami tidak memberikan klaim bahwa setiap file 100% bebas dari risiko. Selalu periksa catatan pemeriksaan dan keamanan pada halaman detail file sebelum mengunduh.",
      "Konten yang melanggar hukum, berbahaya, atau melanggar hak pihak ketiga tidak akan ditoleransi dan akan dihapus.",
    ],
  },
  {
    id: "hak-cipta",
    icon: <Scale className="h-5 w-5" aria-hidden />,
    title: "Hak Cipta & Takedown",
    body: [
      "Sebagian konten yang ditautkan bersifat open-source atau berasal dari sumber komunitas. Bila Anda pemilik hak cipta dan merasa konten di platform ini melanggar hak Anda, silakan hubungi kami melalui kanal resmi yang tertera di footer.",
      "Kami akan meninjau setiap laporan hak cipta yang lengkap dan melakukan penghapusan bila laporan terbukti sah.",
    ],
  },
  {
    id: "privasi",
    icon: <Cookie className="h-5 w-5" aria-hidden />,
    title: "Privasi & Data",
    body: [
      "Login hanya menggunakan Google OAuth — kami tidak menyimpan kata sandi Anda.",
      "Data yang kami simpan: email Google, nama tampilan, foto profil, dan aktivitas komunitas (topik, komentar, suara). Email Anda tidak pernah ditampilkan ke publik.",
      "Unduhan dicatat untuk statistik internal (ID file, versi, host, waktu, ID pengguna yang tidak ditampilkan publik).",
      "Anda dapat meminta penghapusan data Anda melalui kanal resmi.",
    ],
  },
  {
    id: "komunitas",
    icon: <Users className="h-5 w-5" aria-hidden />,
    title: "Aturan Komunitas",
    body: [
      "Hormati anggota lain — tidak ada pelecehan, ujaran kebencian, atau spam.",
      "Konten yang menyesatkan atau tautan berbahaya akan dihapus dan ak dapat dikenakan pembatasan.",
      "Penggunaan forum dan permintaan konten tunduk pada kebijakan moderasi admin.",
    ],
  },
  {
    id: "pelaporan",
    icon: <Flag className="h-5 w-5" aria-hidden />,
    title: "Pelaporan Konten",
    body: [
      "Setiap topik dan komentar dapat dilaporkan melalui tombol “Laporkan”. Laporan ditinjau oleh moderator.",
      "Penyalahgunaan fitur pelaporan (spam laporan) dapat mengakibatkan pembatasan akun.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-8 max-w-2xl">
        <Badge tone="neutral" className="mb-3">
          Terakhir diperbarui: 24 Oktober 2026
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Kebijakan & Ketentuan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Halaman ini menjelaskan kebijakan konten, hak cipta, privasi, aturan komunitas, dan ketentuan
          penggunaan DeepCrips Hub. Dengan menggunakan situs ini, Anda dianggap menyetujui ketentuan di
          bawah.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="mb-3 flex items-center gap-2.5 text-lg font-semibold text-text">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                {s.icon}
              </span>
              {s.title}
            </h2>
            <div className="space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <p className="text-sm leading-relaxed text-text-muted">
            <strong className="text-text">Penafian:</strong> Unduhan dari pihak ketiga selalu memiliki
            risiko. Kami menyarankan Anda memverifikasi file dengan perangkat lunak keamanan Anda sendiri
            sebelum menjalankannya. Untuk informasi keamanan lebih lanjut, baca{" "}
            <Link href="/security" className="text-brand hover:underline">
              informasi keamanan
            </Link>
            .
          </p>
        </section>
      </div>
    </Section>
  );
}
