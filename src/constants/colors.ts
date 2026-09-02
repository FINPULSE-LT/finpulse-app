/**
 * Definición Centralizada de Colores de FinPulse
 * Editar aquí para cambiar la estética global sin tocar código de vistas o componentes.
 */
export const COLOR_TOKENS = {
  // Tipos de transacción
  types: {
    expense: {
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      hex: "#f43f5e",
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
    income: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hex: "#10b981",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    saving: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      hex: "#06b6d4",
      badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
    transfer: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hex: "#3b82f6",
      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    antExpense: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      hex: "#f59e0b",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
  },

  // Rachas & Gamificación
  streak: {
    fire: "#f97316",
    activeBg: "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20",
    activeText: "text-amber-400",
    freezeBg: "bg-cyan-500/20",
    freezeText: "text-cyan-300",
  },

  // Paleta de Medios de Pago / Tarjetas
  cardPresets: [
    { id: "emerald", name: "Esmeralda FinPulse", from: "#059669", to: "#10b981", border: "#34d399" },
    { id: "ocean", name: "Azul Santander/Galicia", from: "#1e3a8a", to: "#3b82f6", border: "#60a5fa" },
    { id: "violet", name: "Violeta MercadoPago/Ualá", from: "#581c87", to: "#8b5cf6", border: "#c084fc" },
    { id: "carbon", name: "Black Mastercard", from: "#111827", to: "#374151", border: "#9ca3af" },
    { id: "sunset", name: "Naranja Lemon/Naranja", from: "#c2410c", to: "#ea580c", border: "#fb923c" },
    { id: "gold", name: "Oro Premium", from: "#854d0e", to: "#eab308", border: "#fde047" },
  ],

  // Estados de Coach
  coachTones: {
    zen: {
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
      accent: "#14b8a6",
    },
    encouraging: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      accent: "#10b981",
    },
    strict: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      accent: "#f43f5e",
    },
  },
} as const;
