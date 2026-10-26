"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Download, Users, MessageSquare } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { AmbientBackground } from "@/components/motion/ambient-bg";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn, safeNextPath } from "@/lib/utils";

const BENEFITS = [
  {
    icon: <Download className="h-4 w-4" aria-hidden />,
    title: "Unduh file",
    description: "Akses unduhan dengan beberapa pilihan host alternatif.",
  },
  {
    icon: <MessageSquare className="h-4 w-4" aria-hidden />,
    title: "Ikut forum",
    description: "Buat topik, beri komentar, dan beri reaksi.",
  },
  {
    icon: <Users className="h-4 w-4" aria-hidden />,
    title: "Ajukan permintaan",
    description: "Usulkan konten baru dan dukung permintaan lain.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
    title: "Google saja",
    description: "Tanpa kata sandi tambahan — gunakan akun Google Anda.",
  },
];

/** Halaman login — wrapper untuk memastikan useSearchParams dalam Suspense. */
export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
        </div>
      }
    >
      <LoginInner />
    </React.Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const { user, signInWithGoogle, loading } = useAuth();

  const next = safeNextPath(searchParams.get("next"));
  const error = searchParams.get("error");

  const errorMessage =
    error === "auth_callback_failed"
      ? "Proses login gagal diselesaikan. Coba lagi."
      : error === "access_denied"
        ? "Akses ditolak. Pastikan Anda menyetujui permintaan izin Google."
        : error
          ? "Terjadi masalah saat login. Coba lagi."
          : null;

  if (user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="mb-4 h-10 w-10 text-success" aria-hidden />
        <h1 className="text-2xl font-bold text-text">Anda sudah masuk</h1>
        <p className="mt-2 text-sm text-text-muted">
          Anda sudah login dengan akun Google Anda.
        </p>
        <a
          href={next}
          className={cn(buttonVariants("primary", "md"), "mt-6")}
        >
          Lanjutkan
        </a>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
      {/* Latar gradien bergerak loop */}
      <AmbientBackground />
      <div aria-hidden className="absolute inset-0 bg-grid-fade opacity-40" />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 h-72 w-[30rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-pop">
          <div className="mb-6 text-center">
            <BrandMark className="mx-auto mb-4 h-12 w-12" />
            <h1 className="text-2xl font-bold tracking-tight text-text">Masuk ke DeepCrips Hub</h1>
            <p className="mt-2 text-sm text-text-muted">
              Gunakan akun Google Anda untuk mengakses unduhan dan komunitas.
            </p>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle(next)}
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-strong bg-white px-5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                />
              </svg>
            )}
            Lanjutkan dengan Google
          </button>

          <p className="mt-4 text-center text-xs text-text-faint">
            Dengan melanjutkan, Anda menyetujui{" "}
            <a href="/policies" className="text-brand hover:underline">
              kebijakan & ketentuan
            </a>
            .
          </p>
        </div>

        {/* Manfaat login */}
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li
              key={b.title}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/60 p-3.5"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                {b.icon}
              </span>
              <span>
                <span className="block text-xs font-semibold text-text">{b.title}</span>
                <span className="text-xs leading-relaxed text-text-muted">{b.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
