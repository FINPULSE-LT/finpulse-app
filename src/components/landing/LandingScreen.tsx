"use client";

import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { LABELS } from "@/constants/labels";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  Target,
  Flame,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Mail,
  AlertCircle,
} from "lucide-react";

interface LandingScreenProps {
  onEnterDemo: () => void;
  onLoginSuccess: (email: string) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onEnterDemo,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("not enabled") ||
          error.message.toLowerCase().includes("provider")
        ) {
          setErrorMessage(
            "El inicio con Google requiere configurar el Client ID en la consola de Supabase. Mientras tanto, puedes usar Email Magic Link o explorar en Modo Demo con 1 clic."
          );
        } else {
          setErrorMessage(error.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al enviar enlace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D14] text-white flex flex-col selection:bg-[#00F5A0] selection:text-slate-950">
      {/* Barra Superior con Logo y Acceso Rápido */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-emerald-900/30">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,245,160,0.4)] border border-[#00F5A0]/50">
            <Image
              src="/brand/finpulse-logo.jpg"
              alt="FinPulse Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                FinPulse
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00F5A0] text-[10px] font-mono font-bold border border-[#00F5A0]/40">
                PRO v1.0
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 block">
              Control Financiero Inteligente
            </span>
          </div>
        </div>

        <button
          onClick={onEnterDemo}
          className="px-4 py-2 rounded-xl bg-[#0B1E19] hover:bg-[#102B24] border border-[#00F5A0]/40 text-[#00F5A0] font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,245,160,0.15)] hover:shadow-[0_0_25px_rgba(0,245,160,0.3)] active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Explorar</span> Modo Demo
        </button>
      </header>

      {/* Hero Principal con Gradiente Verde Dinero y Login Box */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Columna Izquierda: Mensaje y Propuesta de Valor */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>Inspirado en lo mejor de Fintonic, Mobills y Monefy</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Tus finanzas bajo control con el{" "}
              <span className="bg-gradient-to-r from-[#00F5A0] via-emerald-300 to-[#00D9F5] bg-clip-text text-transparent">
                poder del verde
              </span>{" "}
              y cero fricción.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Registra gastos dictando por voz o escribiendo en lenguaje natural.
              Gestiona tarjetas con sus fechas reales de cierre, presupuestos
              por categoría estilo Mobills y eleva tu <strong>PulseScore</strong> como en Fintonic.
            </p>

            {/* Checklist de Ventajas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2 bg-[#0A1613]/70 p-2.5 rounded-xl border border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <span>Registro por IA en menos de 2 segundos</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0A1613]/70 p-2.5 rounded-xl border border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <span>Tarjetas con cuotas y fechas de corte</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0A1613]/70 p-2.5 rounded-xl border border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <span>Estructura Donut & Presupuestos por categoría</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0A1613]/70 p-2.5 rounded-xl border border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <span>Gamificación anti-gastos hormiga</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Inicio de Sesión */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0D1C17] via-[#091512] to-[#060D0B] border border-[#00F5A0]/30 shadow-[0_0_50px_rgba(0,245,160,0.15)] space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00F5A0] to-[#00D9F5] p-0.5 mx-auto shadow-md">
                  <div className="w-full h-full bg-[#091512] rounded-[14px] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#00F5A0]" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Bienvenido a FinPulse
                </h2>
                <p className="text-xs text-slate-400">
                  Ingresa con tu cuenta para sincronizar tus finanzas en la nube
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-1.5">
                    <span>{errorMessage}</span>
                    <button
                      type="button"
                      onClick={onEnterDemo}
                      className="block text-[#00F5A0] hover:underline font-bold text-xs"
                    >
                      ⚡ O entra directamente en Modo Demo interactivo →
                    </button>
                  </div>
                </div>
              )}

              {/* Botón de Google OAuth Oficial */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-lg active:scale-98 disabled:opacity-50 group cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  o con correo electrónico
                </span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              {/* Formulario Email Magic Link */}
              {isMagicLinkSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-8 h-8 text-[#00F5A0] mx-auto" />
                  <h4 className="text-sm font-bold text-white">¡Enlace Mágico Enviado!</h4>
                  <p className="text-xs text-slate-300">
                    Revisa la bandeja de entrada de <strong>{email}</strong> para ingresar sin contraseña.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Tu Email Personal
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="tu-email@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#060E0C] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-slate-950 font-black text-xs hover:opacity-90 transition-all shadow-md active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? "Enviando enlace..." : "Enviar Enlace de Acceso"}
                  </button>
                </form>
              )}

              {/* Botón de Modo Demo Destacado */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="w-full py-3 px-4 rounded-2xl bg-[#091512] hover:bg-[#0E201B] border border-[#00F5A0]/40 text-[#00F5A0] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-inner hover:border-[#00F5A0] active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Probar Demo Interactiva sin Registrarse</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-sans text-slate-400 text-center block">
                  Explora todas las funciones con datos de muestra en 1 clic
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Base de datos cifrada con Supabase RLS y grado bancario</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de 4 Pilares Inspirados en Fintonic, Mobills y Monefy */}
        <div className="mt-16 pt-10 border-t border-emerald-950/80 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#081310] border border-emerald-900/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-[#00F5A0] flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Registro Heurístico</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Escribe &quot;Cena 18000 ayer con Visa&quot; o dicta una nota de voz. La IA categoriza y computa tu cuota al instante.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#081310] border border-emerald-900/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
              <PieChart className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Estructura & Presupuestos</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rueda interactiva Donut y presupuestos por categoría con semáforo tricolor inspirado en Mobills y Monefy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#081310] border border-emerald-900/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">PulseScore 0 a 1000</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Salud financiera en tiempo real evaluando ahorro, solvencia en tarjetas y colchón de liquidez al estilo Fintonic.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#081310] border border-emerald-900/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Racha Anti-Hormiga</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gamificación con psicología de Duolingo, congeladores mensuales de racha y coach con 3 personalidades.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-emerald-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© 2026 FinPulse Inc. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4">
          <span className="text-[#00F5A0] font-mono">Status: En Línea</span>
          <span>•</span>
          <button onClick={onEnterDemo} className="hover:text-white transition-colors">
            Modo Demo
          </button>
        </div>
      </footer>
    </div>
  );
};
