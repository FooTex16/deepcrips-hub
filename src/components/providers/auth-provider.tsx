"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/lib/types";
import { safeNextPath } from "@/lib/utils";

export interface AuthProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: AuthProfile | null;
  roles: MemberRole[];
  isStaff: boolean;
  isContentAdmin: boolean;
  isPrimaryAdmin: boolean;
  loading: boolean;
  /** True bila Supabase belum dikonfigurasi (kesalahan environment, bukan user). */
  misconfigured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

const ALL_ROLES: MemberRole[] = ["primary_admin", "content_admin", "moderator"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<AuthProfile | null>(null);
  const [roles, setRoles] = React.useState<MemberRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [misconfigured, setMisconfigured] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMisconfigured(true);
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const [{ data: prof }, { data: roleRows }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, avatar_url, bio")
            .eq("id", currentUser.id)
            .maybeSingle(),
          supabase.from("member_roles").select("role").eq("user_id", currentUser.id),
        ]);
        setProfile((prof as AuthProfile | null) ?? null);
        setRoles((roleRows ?? []).map((r: { role: MemberRole }) => r.role));
      } else {
        setProfile(null);
        setRoles([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan perubahan sesi dari tab lain / callback OAuth.
  React.useEffect(() => {
    if (misconfigured) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, [load, misconfigured]);

  const signOut = React.useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setRoles([]);
      // Paksa navigasi server agar seluruh komponen server menyegarkan sesi.
      window.location.assign("/");
    }
  }, []);

  const signInWithGoogle = React.useCallback(async (nextPath?: string) => {
    const supabase = createClient();
    const origin = window.location.origin;
    const next = safeNextPath(nextPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) throw error;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      roles,
      isStaff: roles.some((r) => ALL_ROLES.includes(r)),
      isContentAdmin: roles.includes("primary_admin") || roles.includes("content_admin"),
      isPrimaryAdmin: roles.includes("primary_admin"),
      loading,
      misconfigured,
      refresh: load,
      signOut,
      signInWithGoogle,
    }),
    [user, profile, roles, loading, misconfigured, load, signOut, signInWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
