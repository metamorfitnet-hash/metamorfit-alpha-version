"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import i18n from "@/i18n";

interface HeaderProps {
  variant?: "landing" | "app";
}

// ── Global Language Toggle ────────────────────────────────────────────────────
// Reads locale from localStorage (set by i18next) and calls i18n.changeLanguage
// when the user clicks. Fully client-side; safe to SSR because it defaults to 'en'.
function LocaleToggle() {
  const [locale, setLocale] = useState<"en" | "es">("en");

  useEffect(() => {
    const saved = (localStorage.getItem("i18nextLng") || "en").substring(0, 2) as "en" | "es";
    setLocale(saved);
  }, []);

  const toggle = (lang: "en" | "es") => {
    setLocale(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  };

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
      <button
        onClick={() => toggle("en")}
        className={`px-3 py-1 text-xs font-heading tracking-widest uppercase rounded transition-all duration-200 ${
          locale === "en"
            ? "bg-mm-gold text-mm-black shadow-sm"
            : "text-mm-bone/50 hover:text-mm-bone"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggle("es")}
        className={`px-3 py-1 text-xs font-heading tracking-widest uppercase rounded transition-all duration-200 ${
          locale === "es"
            ? "bg-mm-gold text-mm-black shadow-sm"
            : "text-mm-bone/50 hover:text-mm-bone"
        }`}
      >
        ES
      </button>
    </div>
  );
}

export function Header({ variant = "app" }: HeaderProps) {
  if (variant === "landing") {
    return (
      <header className="bg-lp-header-bg border-b border-lp-line h-[52px] flex items-center justify-between px-[clamp(1.25rem,5vw,3rem)] shrink-0 sticky top-0 z-50 animate-lp-fade-in">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={32}
            height={32}
            priority
            className="w-8 h-8 transition-all duration-500 object-contain rounded"
          />
          <div className="font-bebas text-[1.55rem] tracking-[0.14em] text-lp-gold select-none">
            Meta<span className="text-lp-cream">morfit</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <LocaleToggle />
          <div className="text-[0.62rem] tracking-[0.18em] uppercase text-lp-muted border border-lp-line px-[0.8rem] py-[0.22rem] rounded-[40px] shrink-0">
            Natural Lifting System
          </div>
        </div>
      </header>
    );
  }

  // App-variant nav removed — lead magnet mode, no SaaS navigation.
  return null;
}
