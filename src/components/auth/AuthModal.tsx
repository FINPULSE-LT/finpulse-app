"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { LABELS } from "@/constants/labels";
import { Mail, Check, ShieldCheck, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) {
        setErrorMessage(error.message);
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
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botón de Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
        >
          {/* Logo SVG Oficial de Google */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 text-center space-y-2">
            <Check className="w-8 h-8 text-brand-400 mx-auto" />
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
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

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{LABELS.auth.secureNotice}</span>
        </div>
      </div>
    </Modal>
  );
};
