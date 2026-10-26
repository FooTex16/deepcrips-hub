import { Sparkles } from "lucide-react";

/**
 * Notifikasi di halaman detail bahwa konten yang dibuka adalah template
 * pratinjau (bukan postingan nyata) — tampil hanya saat toggle template
 * aktif dan entri berasal dari pool template.
 */
export function TemplateNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 px-4 py-3.5 text-sm text-info">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Konten contoh.</span> Halaman ini bagian dari template
        pratinjau agar terlihat gambaran website ketika sudah terisi. Konten asli tampil di sini
        setelah admin menerbitkan postingannya.
      </p>
    </div>
  );
}
