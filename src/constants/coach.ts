/**
 * Configuración de Personalidades y Mensajes del Coach Financiero
 * Personalización del "ayudante" y sus grados de exigencia.
 */
export type CoachPersonalityType = "zen" | "encouraging" | "strict";

export interface CoachPersonality {
  id: CoachPersonalityType;
  name: string;
  tagline: string;
  avatarIcon: string;
  color: string;
  badge: string;
}

export const COACH_PERSONALITIES: Record<CoachPersonalityType, CoachPersonality> = {
  zen: {
    id: "zen",
    name: "Financista Zen",
    tagline: "Calma mental, serenidad y decisiones conscientes con tu dinero.",
    avatarIcon: "Sparkles",
    color: "text-teal-400",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
  encouraging: {
    id: "encouraging",
    name: "Amigo Alentador",
    tagline: "¡Tu mayor fanático! Celebra cada pequeño ahorro y avance.",
    avatarIcon: "Smile",
    color: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  strict: {
    id: "strict",
    name: "Sargento Ramsay",
    tagline: "Cero excusas con los gastos hormiga. Humor ácido y disciplina pura.",
    avatarIcon: "Flame",
    color: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
};

export const COACH_MESSAGES = {
  // Cuando se registra un ingreso
  income: {
    zen: [
      "La energía de la abundancia fluye. Recuerda destinar una porción antes de que el deseo la consuma.",
      "Excelente entrada. Respira y planifica con calma su mejor destino.",
    ],
    encouraging: [
      "¡Qué buena noticia! Ingresó dinero fresco a tu cuenta. ¡Sigue así!",
      "¡Golazo financiero! Cada peso extra te acerca más rápido a tus sueños.",
    ],
    strict: [
      "Llegó plata. No te sientas millonario todavía: primero pagá deudas y ahorrá antes de inventar caprichos.",
      "Bien, entró dinero. Ahora cuidalo como si fuera oro, no lo hagas desaparecer en 48 horas.",
    ],
  },

  // Cuando se registra un ahorro para una meta
  saving: {
    zen: [
      "Sembraste una semilla de paz para tu futuro yo. Florecerá.",
      "Ahorrar no es privarse, es comprar tu tranquilidad de mañana.",
    ],
    encouraging: [
      "¡Orgullo total! Estás alimentando tu meta con determinación de hierro.",
      "¡Un paso gigante hacia tu objetivo! Mira cómo crece esa barra.",
    ],
    strict: [
      "¡Así me gusta! Menos chucherías y más capital para tus verdaderos objetivos.",
      "Por fin una decisión inteligente. Esa meta no se va a cumplir con buenas intenciones, sino con esto.",
    ],
  },

  // Cuando se registra un gasto hormiga
  antExpense: {
    zen: [
      "Observa sin juzgar: ¿era una necesidad genuina o un escape momentáneo? Mañana es una nueva oportunidad.",
      "Un pequeño desvío en el camino. No pasa nada, retoma la serenidad y la consciencia.",
    ],
    encouraging: [
      "Se nos escapó un gasto hormiga hoy, ¡pero tranqui! Lo importante es que lo registraste y tienes el control.",
      "No te desanimes. Aprender a detectarlos es el 80% de la batalla ganada.",
    ],
    strict: [
      "¿En serio? ¿Otro gasto hormiga? Ese café o antojo te acaba de costar un día de racha. ¡Fuerza de voluntad!",
      "Tus metas de viaje acaban de posponerse 3 horas por esa compra impulsiva. ¡Reaccioná!",
    ],
  },

  // Cuando se mantiene la racha de días limpios
  streakClean: {
    zen: [
      "Día en equilibrio. El autocontrol es la forma más elevada de libertad.",
      "La constancia silenciosa construye imperios de paz mental.",
    ],
    encouraging: [
      "¡FUEGO TOTAL! Mantienes tu racha limpia de gastos hormiga. ¡Estás imparable!",
      "¡Otro día ganado! Mira cuánto dinero rescatado estás acumulando.",
    ],
    strict: [
      "¡Excelente disciplina! Hoy no caíste en la trampa del consumo basura. Te ganaste mi respeto.",
      "Día impecable. Seguí así y a fin de mes vas a ver la diferencia en tu bolsillo.",
    ],
  },
};
