"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dc-theme";

/**
 * Tema: default mengikuti preferensi sistem saat kunjungan pertama,
 * lalu pilihan pengguna disimpan di localStorage.
 * Script inline di root layout menerapkan kelas SEBELUM paint (tanpa flash).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  const toggle = React.useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    if (next === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage diblokir — tema tetap berlaku sesi ini */
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={mounted && theme === "dark" ? "Tema terang" : "Tema gelap"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-all duration-200 hover:border-border-strong hover:text-text active:scale-95",
        className
      )}
    >
      {!mounted ? (
        <span className="h-4 w-4" aria-hidden />
      ) : theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}

/** Script anti-flash tema — dipasang di <head> root layout. */
export const themeInitScript = `(function(){try{
  var stored=localStorage.getItem('${STORAGE_KEY}');
  var prefersLight=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;
  var theme=stored==='light'||stored==='dark' ? stored : (prefersLight?'light':'dark');
  var root=document.documentElement;
  if(theme==='light'){root.classList.add('light');root.classList.remove('dark');}
  else{root.classList.add('dark');root.classList.remove('light');}
}catch(e){}})();`;
