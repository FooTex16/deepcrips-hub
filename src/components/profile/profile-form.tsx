"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/** Form edit profil milik sendiri (display_name & bio). */
export function ProfileForm({
  initialName,
  initialBio,
}: {
  initialName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState(initialName);
  const [bio, setBio] = React.useState(initialBio);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dirty = name !== initialName || bio !== initialBio;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Nama tampilan minimal 2 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim(), bio: bio.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Profil gagal diperbarui.");
        setLoading(false);
        return;
      }
      toast("Profil diperbarui.", "success");
      router.refresh();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    }
    setLoading(false);
  };

  const inputStyle =
    "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <div>
        <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-text">
          Nama tampilan
        </label>
        <input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          className={inputStyle}
        />
        <p className="mt-1.5 text-xs text-text-faint">{name.length}/60</p>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-text">
          Bio singkat
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Ceritakan sedikit tentang diri Anda…"
          className={inputStyle}
        />
        <p className="mt-1.5 text-xs text-text-faint">{bio.length}/280</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !dirty}
        className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        Simpan perubahan
      </button>
    </form>
  );
}
