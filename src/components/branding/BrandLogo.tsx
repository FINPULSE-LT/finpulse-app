"use client";

import React from "react";
import { BRANDING } from "@/constants/branding";
import { WalletCards } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showTagline = false,
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base font-bold",
    md: "text-xl font-extrabold",
    lg: "text-3xl font-extrabold",
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-brand-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-brand-500/20 text-slate-950 font-bold shrink-0`}
      >
        <WalletCards className={size === "lg" ? "w-6 h-6" : "w-4 h-4"} />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} tracking-tight text-white font-sans`}>
            {BRANDING.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono font-medium border border-brand-500/20">
            v{BRANDING.version}
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
