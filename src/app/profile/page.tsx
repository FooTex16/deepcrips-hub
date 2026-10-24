import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MessageSquare, Vote, ShieldCheck, Calendar } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getStaffContext } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { SignOutButton } from "@/components/profile/signout-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil Saya",
  robots: { index: false },
};

const ROLE_LABELS: Record<string, string> = {
  primary_admin: "Admin Utama",
  content_admin: "Admin Konten",
  staff: "Moderator",
};

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/profile")}`);

  const supabase = await createClient();
  const [profileRes, topicsRes, requestsRes, staff] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("forum_topics").select("id", { count: "exact", head: true }).eq("author_id", user.id),
    supabase.from("content_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id),
    getStaffContext(),
  ]);

  const profile = profileRes.data as {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;

  const roles = staff?.roles ?? [];
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? "Anggota";
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const email = (user.email ?? "") as string;

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-8 flex flex-wrap items-center gap-5">
        <Avatar src={avatarUrl} name={displayName} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{displayName}</h1>
          <p className="mt-1 text-sm text-text-faint">{email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {roles.length > 0 ? (
              roles.map((r) => (
                <Badge key={r} tone="brand" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))
            ) : (
              <Badge tone="neutral">Anggota</Badge>
            )}
            {profile?.created_at && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-faint">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Bergabung {formatDate(profile.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <SignOutButton />
        </div>
      </header>

      {/* Statistik singkat */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/forum"
          className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <MessageSquare className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-3 text-2xl font-bold text-text">{topicsRes.count ?? 0}</p>
          <p className="text-sm text-text-muted">Topik forum dibuat</p>
        </Link>
        <Link
          href="/requests"
          className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Vote className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-3 text-2xl font-bold text-text">{requestsRes.count ?? 0}</p>
          <p className="text-sm text-text-muted">Permintaan diajukan</p>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-3 text-2xl font-bold text-text">{roles.length}</p>
          <p className="text-sm text-text-muted">Peran aktif</p>
        </div>
      </div>

      {/* Edit profil */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text">Edit Profil</h2>
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <ProfileForm initialName={displayName} initialBio={profile?.bio ?? ""} />
          </div>
          <p className="mt-3 text-xs text-text-faint">
            Nama tampilan dan bio bersifat publik (ditampilkan pada komentar & topik Anda). Email tidak
            pernah ditampilkan publik.
          </p>
        </div>

        <aside>
          <h2 className="mb-4 text-lg font-semibold text-text">Tautan Akun</h2>
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
            <Link href="/forum" className="block text-brand hover:underline">
              Topik saya di forum →
            </Link>
            <Link href="/requests?view=mine" className="block text-brand hover:underline">
              Permintaan saya →
            </Link>
            <Link href="/downloads" className="block text-brand hover:underline">
              Katalog download →
            </Link>
            <p className="border-t border-border pt-3 text-xs text-text-faint">
              Peran dan hak akses dikelola oleh admin utama.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
