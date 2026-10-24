"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";

/** Tombol keluar — memanggil auth provider lalu redirect ke beranda. */
export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const click = async () => {
    if (loading) return;
    setLoading(true);
    await signOut();
    toast("Anda telah keluar.", "success");
    router.push("/");
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={() => void click()}
      disabled={loading}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong px-4 text-sm font-semibold text-text-muted transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Keluar
    </button>
  );
}
