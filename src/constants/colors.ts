/**
 * Definición Centralizada de Colores & Identidad Cromática de FinPulse
 * Diseñado con psicología del color FinTech de alto impacto:
 * - Neo-Mint & Cyan Pulse: Vitalidad, crecimiento de patrimonio y energía de marca.
 * - Cosmic Violet: Metas de ahorro, aspiración y logros futuros.
 * - Sapphire Blue: Seguridad bancaria, tarjetas y cuentas.
 * - Coral Rose: Gastos y salidas (alerta sin estrés).
 * - Solar Amber: Gastos hormiga y racha de fuego.
 */
export const COLOR_TOKENS = {
  // Marca Principal
  brand: {
    primary: "#00F5A0",      // Neo-Mint Pulse
    secondary: "#00D9F5",    // Electric Cyan
    gradient: "from-[#00F5A0] to-[#00D9F5]",
    glow: "shadow-[0_0_30px_-5px_rgba(0,245,160,0.35)]",
    bgDark: "#080c16",       // Midnight Navy Base
    cardDark: "#101729",     // Elevated Surface
    cardHover: "#162038",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
  },

  // Código Cromático Funcional
  types: {
    expense: {
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/25",
      hex: "#FF4D6D",
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
    income: {
      text: "text-[#00F5A0]",
      bg: "bg-[#00F5A0]/10",
      border: "border-[#00F5A0]/25",
      hex: "#00F5A0",
      badge: "bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/30",
    },
    saving: {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25",
      hex: "#A855F7",
      badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    },
    transfer: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/25",
      hex: "#3b82f6",
      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    antExpense: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      hex: "#F59E0B",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
  },

  // Navegación con Código de Color por Pestaña
  navSections: {
    dashboard: {
      color: "text-[#00F5A0]",
      glow: "border-[#00F5A0]/40",
      activeBg: "bg-[#00F5A0]/15 text-[#00F5A0]",
    },
    transactions: {
      color: "text-rose-400",
      glow: "border-rose-500/40",
      activeBg: "bg-rose-500/15 text-rose-300",
    },
    accounts: {
      color: "text-blue-400",
      glow: "border-blue-500/40",
      activeBg: "bg-blue-500/15 text-blue-300",
    },
    goals: {
      color: "text-purple-400",
      glow: "border-purple-500/40",
      activeBg: "bg-purple-500/15 text-purple-300",
    },
    reports: {
      color: "text-cyan-400",
      glow: "border-cyan-500/40",
      activeBg: "bg-cyan-500/15 text-cyan-300",
    },
  },

  // Rachas & Gamificación
  streak: {
    fire: "#F97316",
    activeBg: "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20",
    activeText: "text-amber-400",
    freezeBg: "bg-cyan-500/20",
    freezeText: "text-cyan-300",
  },

  // Paleta de Medios de Pago / Tarjetas
  cardPresets: [
    { id: "mint", name: "Neo-Mint FinPulse", from: "#008552", to: "#00F5A0", border: "#00F5A0" },
    { id: "ocean", name: "Azul Santander/Galicia", from: "#1e3a8a", to: "#3b82f6", border: "#60a5fa" },
    { id: "violet", name: "Violeta Metas/Ualá", from: "#581c87", to: "#8b5cf6", border: "#c084fc" },
    { id: "carbon", name: "Black Mastercard", from: "#0f172a", to: "#334155", border: "#64748b" },
    { id: "sunset", name: "Naranja Lemon", from: "#c2410c", to: "#ea580c", border: "#fb923c" },
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
      color: "text-[#00F5A0]",
      bg: "bg-[#00F5A0]/10",
      border: "border-[#00F5A0]/30",
      accent: "#00F5A0",
    },
    strict: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      accent: "#FF4D6D",
    },
  },
} as const;
