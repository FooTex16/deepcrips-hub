import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Profile } from "@/lib/types";

/** Ambil user login dari sesi (null jika belum login). */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Supabase belum dikonfigurasi → perlakukan sebagai anon.
    return null;
  }
}

export interface StaffContext {
  user: User;
  profile: Profile | null;
  roles: MemberRole[];
  isStaff: boolean;
  isContentAdmin: boolean;
  isPrimaryAdmin: boolean;
}

const ALL_ROLES: MemberRole[] = ["primary_admin", "content_admin", "moderator"];

/**
 * Konteks otorisasi untuk route handler admin/moderasi.
 * Otorisasi FINAL tetap di RLS database; ini lapisan validasi server-side
 * tambahan agar pesan error lebih jelas dan tidak bergantung frontend.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, bio, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("member_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? []).map((r: { role: MemberRole }) => r.role);
  return {
    user,
    profile: (profile as Profile | null) ?? null,
    roles,
    isStaff: roles.some((r) => ALL_ROLES.includes(r)),
    isContentAdmin: roles.includes("primary_admin") || roles.includes("content_admin"),
    isPrimaryAdmin: roles.includes("primary_admin"),
  };
}
