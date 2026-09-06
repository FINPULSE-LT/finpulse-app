"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { LABELS } from "@/constants/labels";
import { Mail, Check, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
            "El proveedor de Google aún no está configurado con Client ID/Secret en Supabase. Puedes ingresar con Email Magic Link o explorar en Modo Demo."
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const supabase = createClient();
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSentMessage(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al enviar enlace");
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
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {onDemoAccess && (
                <button
                  type="button"
                  onClick={() => {
                    onDemoAccess();
                    onClose();
                  }}
                  className="block text-[#00F5A0] hover:underline font-bold text-xs mt-1"
                >
                  ⚡ O entra directamente en Modo Demo interactivo →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botón de Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 disabled:opacity-50 group"
        >
          {/* Logo SVG Oficial de Google */}
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
          <span>{LABELS.auth.googleSignIn}</span>
        </button>

        <div className="flex items-center gap-2 my-2">
          <div className="h-[1px] flex-1 bg-slate-800" />
          <span className="text-[10px] uppercase font-mono text-slate-500">o con email</span>
          <div className="h-[1px] flex-1 bg-slate-800" />
        </div>

        {/* Formulario de Email Magic Link */}
        {sentMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <Check className="w-8 h-8 text-[#00F5A0] mx-auto" />
            <h4 className="text-sm font-bold text-white">¡Enlace enviado!</h4>
            <p className="text-xs text-slate-300">
              Revisa tu casilla <strong>{email}</strong> para ingresar sin contraseña.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={LABELS.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#090D18] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0] transition-colors"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              {LABELS.auth.sendMagicLink}
            </Button>
          </form>
        )}

        {/* Bypass Modo Demo */}
        {onDemoAccess && (
          <div className="pt-2">
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
