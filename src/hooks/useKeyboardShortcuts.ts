"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onQuickInputFocus?: () => void;
  onNewTransaction?: () => void;
  onVoiceRecord?: () => void;
  onToggleShortcuts?: () => void;
  onNavDashboard?: () => void;
  onNavTransactions?: () => void;
  onNavAccounts?: () => void;
  onNavGoals?: () => void;
  onNavReports?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en un input, textarea o elemento editable, ignoramos atajos de una sola tecla (excepto Escape)
      const target = e.target as HTMLElement;
      const isInputActive =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        handlers.onQuickInputFocus?.();
        return;
      }

      if (e.key === "?" && !isInputActive) {
        e.preventDefault();
        handlers.onToggleShortcuts?.();
        return;
      }

      if (isInputActive) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handlers.onNewTransaction?.();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handlers.onVoiceRecord?.();
      } else if (e.altKey && e.key === "1") {
        e.preventDefault();
        handlers.onNavDashboard?.();
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        handlers.onNavTransactions?.();
      } else if (e.altKey && e.key === "3") {
        e.preventDefault();
        handlers.onNavAccounts?.();
      } else if (e.altKey && e.key === "4") {
        e.preventDefault();
        handlers.onNavGoals?.();
      } else if (e.altKey && e.key === "5") {
        e.preventDefault();
        handlers.onNavReports?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
