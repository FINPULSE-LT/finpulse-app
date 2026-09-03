"use client";

import { useCallback } from "react";

/**
 * Hook de Respuesta Háptica Universal para Mobile y Web
 * Proporciona vibraciones físicas placenteras al usuario al tocar botones,
 * guardar transacciones, festejar metas o detectar gastos hormiga.
 */
export function useHaptics() {
  const isSupported = typeof window !== "undefined" && "vibrate" in navigator;

  const hapticTap = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate(8); // Micro pulso de click táctil
      } catch {}
    }
  }, [isSupported]);

  const hapticSuccess = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate([12, 35, 18]); // Doble pulso de confirmación exitosa
      } catch {}
    }
  }, [isSupported]);

  const hapticWarning = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate([35, 50, 35]); // Pulso de alerta para gasto hormiga
      } catch {}
    }
  }, [isSupported]);

  const hapticCelebration = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate([25, 45, 25, 45, 50]); // Secuencia de logro o meta
      } catch {}
    }
  }, [isSupported]);

  return {
    hapticTap,
    hapticSuccess,
    hapticWarning,
    hapticCelebration,
  };
}
