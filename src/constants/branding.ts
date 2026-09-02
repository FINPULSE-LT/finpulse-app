/**
 * Configuración de Marca y Branding de FinPulse
 * Modifica estos valores para cambiar la identidad de la aplicación sin alterar componentes ni lógica.
 */
export const BRANDING = {
  name: "FinPulse",
  tagline: "Control Financiero Inteligente & Cero Fricción",
  shortDescription: "Domina tus finanzas personales, tarjetas en cuotas y elimina los gastos hormiga con inteligencia artificial.",
  version: "1.0.0",
  author: "FinPulse Team",
  company: "FinPulse Inc.",
  website: "https://finpulse.app",
  supportEmail: "soporte@finpulse.app",
  social: {
    twitter: "https://twitter.com/finpulse",
    github: "https://github.com",
  },
  defaultCurrency: "ARS",
  defaultLocale: "es-AR",
  storageKeys: {
    theme: "finpulse_theme",
    coachMode: "finpulse_coach_mode",
    userProfile: "finpulse_user_profile",
  },
  links: {
    privacy: "/privacidad",
    terms: "/terminos",
  }
} as const;

export type BrandingConfig = typeof BRANDING;
