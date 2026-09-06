"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginWithEmailAndPassword } from "@/lib/auth/credentials";
import { LABELS } from "@/constants/labels";
import { Mail, Lock, Check, ShieldCheck, AlertCircle, Sparkles, UserCheck, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDemoAccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDemoAccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const result = await loginWithEmailAndPassword(email, password);

      if (result.success && result.user) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(result.error || "Credenciales incorrectas.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await loginWithEmailAndPassword(uEmail, uPass);
      if (result.success && result.user) {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al ingresar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const supabase = createClient();
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

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
        if (error.message.toLowerCase().includes("not enabled") || error.message.toLowerCase().includes("provider")) {
          setErrorMessage(
            "El inicio con Google requiere activar el proveedor en Supabase. Ingresa directamente con tu contraseña o en Modo Demo."
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={LABELS.auth.welcomeTitle}
      subtitle={LABELS.auth.welcomeSubtitle}
      maxWidth="sm"
    >
      <div className="space-y-4 py-1">
        {/* Accesos Rápidos Oficiales */}
        <div className="p-3 rounded-2xl bg-[#081813] border border-emerald-900/60 space-y-2">
          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block text-center">
            ⚡ Ingreso Rápido Oficial
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("lisandrotorressola@gmail.com", "Lisinho2026")}
              className="p-2 rounded-xl bg-[#0A221B] hover:bg-[#0E2E25] border border-emerald-500/30 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Lisandro</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("alberdimariajose02@gmail.com", "Velinha2026")}
              className="p-2 rounded-xl bg-[#0A221B] hover:bg-[#0E2E25] border border-emerald-500/30 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>María José</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario de Email + Contraseña */}
        <form onSubmit={handlePasswordLogin} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Correo Electrónico
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

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-[#060E0C] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0] transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Ingresar a mi Cuenta
          </Button>
        </form>

        <div className="flex items-center gap-2 my-2">
          <div className="h-[1px] flex-1 bg-slate-800" />
          <span className="text-[10px] uppercase font-mono text-slate-500">o continuar con</span>
          <div className="h-[1px] flex-1 bg-slate-800" />
        </div>

        {/* Botón de Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-[#0A1613] hover:bg-[#0E201B] border border-slate-700/80 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-98 disabled:opacity-50 group"
        >
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{LABELS.auth.googleSignIn}</span>
        </button>

        {/* Bypass Modo Demo */}
        {onDemoAccess && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onDemoAccess();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#091512] hover:bg-[#0c201b] border border-[#00F5A0]/30 text-[#00F5A0] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explorar Modo Demo Interactivo</span>
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
          <span>{LABELS.auth.secureNotice}</span>
        </div>
      </div>
    </Modal>
  );
};
