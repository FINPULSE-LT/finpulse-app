"use client";

import React from "react";
import Image from "next/image";
import { BRANDING } from "@/constants/branding";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showTagline = false,
}) => {
  const imageSizes = {
    sm: { w: 34, h: 34, className: "w-8.5 h-8.5" },
    md: { w: 42, h: 42, className: "w-10.5 h-10.5" },
    lg: { w: 56, h: 56, className: "w-14 h-14" },
  };

  const textSizes = {
    sm: "text-lg font-extrabold",
    md: "text-2xl font-black",
    lg: "text-4xl font-black",
  };

  return (
    <div className="flex items-center gap-3 select-none group cursor-pointer">
      {/* Icono Oficial FinPulse con Glow Reactivo */}
      <div className="relative shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300" />
        <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-[#0B0E17]">
          <Image
            src="/brand/finpulse-logo.jpg"
            alt="FinPulse Logo"
            width={imageSizes[size].w}
            height={imageSizes[size].h}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span
            className={`${textSizes[size]} tracking-tight font-sans bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent`}
          >
            Fin<span className="text-[#00F5A0]">Pulse</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5A0]/15 text-[#00F5A0] font-mono font-bold border border-[#00F5A0]/30 shadow-sm">
            PRO
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-slate-400 tracking-normal font-sans">
            {BRANDING.tagline}
          </p>
        )}
      </div>
    </div>
  );
};
