/**
 * Gestión de Credenciales y Autenticación Oficial de FinPulse
 * Valida credenciales contra Supabase Auth y garantiza el inicio de sesión real en la nube.
 * Se eliminan fallbacks simulados para evitar falsas sesiones locales y pérdidas de datos.
 */
import { createClient } from "@/lib/supabase/client";

export interface AuthorizedUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  displayName: string;
}

export const AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    email: "lisandrotorressola@gmail.com",
    password: "Lisinho2026",
    name: "Lisandro Torres Sola",
    displayName: "Lisandro",
  },
  {
    email: "alberdimariajose02@gmail.com",
    password: "Velinha2026",
    name: "María José Alberdi",
    displayName: "María José",
  },
];

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
  isUnconfirmed?: boolean;
}

/**
 * Inicia sesión exclusivamente contra Supabase Auth Cloud
 */
export async function loginWithEmailAndPassword(
  emailInput: string,
  passwordInput: string
): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  const isAuthorizedCredential = AUTHORIZED_USERS.some(
    (u) => u.email.toLowerCase() === email && u.password === password
  );

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const userPayload = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || email.split("@")[0],
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("finpulse_user_session", JSON.stringify(userPayload));
        localStorage.removeItem("finpulse_demo_mode");
      }

      return {
        success: true,
        user: userPayload,
      };
    }

    if (error) {
      console.warn("Supabase Auth signInWithPassword error:", error.message, error.code);

      // Si el usuario ingresó la contraseña autorizada pero Supabase rechaza por confirmación de email
      if (
        isAuthorizedCredential &&
        (error.message.toLowerCase().includes("invalid login credentials") ||
          error.code === "invalid_credentials" ||
          error.message.toLowerCase().includes("not confirmed") ||
          error.code === "email_not_confirmed")
      ) {
        return {
          success: false,
          isUnconfirmed: true,
          error:
            "Tu cuenta está registrada en Supabase, pero requiere confirmación por correo para activar el guardado en la nube. Revisa tu casilla de Gmail (" +
            email +
            ") y pulsa el enlace 'Confirm your mail' de Supabase.",
        };
      }

      if (
        error.message.toLowerCase().includes("not confirmed") ||
        error.code === "email_not_confirmed"
      ) {
        return {
          success: false,
          isUnconfirmed: true,
          error:
            "Debes confirmar tu correo electrónico haciendo clic en el enlace que Supabase envió a tu casilla antes de iniciar sesión.",
        };
      }

      return {
        success: false,
        error: "Usuario o contraseña incorrectos en Supabase Cloud.",
      };
    }
  } catch (err: any) {
    console.error("Error inesperado en login:", err);
    return {
      success: false,
      error: err.message || "Error al conectar con el servicio de autenticación.",
    };
  }

  return {
    success: false,
    error: "No se pudo iniciar sesión en Supabase.",
  };
}

/**
 * Reenvía el correo de confirmación de Supabase a la dirección indicada
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al reenviar correo" };
  }
}

/**
 * Valida un token, código OTP o URL de confirmación pegada por el usuario
 */
export async function verifyUserTokenOrUrl(
  input: string,
  email: string
): Promise<LoginResult> {
  const supabase = createClient();
  const trimmed = input.trim();

  try {
    // 1. Si es un código numérico de 6 dígitos
    if (/^\d{6}$/.test(trimmed)) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: trimmed,
        type: "signup",
      });

      if (!error && data.user) {
        const userPayload = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("finpulse_user_session", JSON.stringify(userPayload));
          localStorage.removeItem("finpulse_demo_mode");
        }
        return { success: true, user: userPayload };
      }
      return { success: false, error: error?.message || "Código incorrecto o expirado." };
    }

    // 2. Si pegó una URL (ej: http://localhost:3000/auth/callback?code=... o token_hash=... o verify?token=...)
    if (trimmed.includes("http") || trimmed.includes("?") || trimmed.includes("#")) {
      // Si tiene token_hash
      const tokenHashMatch = trimmed.match(/token_hash=([^&]+)/);
      if (tokenHashMatch) {
        const token_hash = decodeURIComponent(tokenHashMatch[1]);
        const typeMatch = trimmed.match(/type=([^&]+)/);
        const type = (typeMatch ? decodeURIComponent(typeMatch[1]) : "signup") as any;
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });
        if (!error && data.user) {
          const userPayload = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("finpulse_user_session", JSON.stringify(userPayload));
            localStorage.removeItem("finpulse_demo_mode");
          }
          return { success: true, user: userPayload };
        }
        return { success: false, error: error?.message || "Enlace expirado o no válido." };
      }

      // Si tiene code= (PKCE)
      const codeMatch = trimmed.match(/code=([^&]+)/);
      if (codeMatch) {
        const code = decodeURIComponent(codeMatch[1]);
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.user) {
          const userPayload = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("finpulse_user_session", JSON.stringify(userPayload));
            localStorage.removeItem("finpulse_demo_mode");
          }
          return { success: true, user: userPayload };
        }
        return { success: false, error: error?.message || "Código de acceso ya utilizado o expirado." };
      }

      // Si es la URL directa de Supabase con verify?token=...
      const tokenMatch = trimmed.match(/[?&]token=([^&]+)/);
      if (tokenMatch) {
        const token = decodeURIComponent(tokenMatch[1]);
        const typeMatch = trimmed.match(/type=([^&]+)/);
        const type = (typeMatch ? decodeURIComponent(typeMatch[1]) : "signup") as any;
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token,
          type,
        });
        if (!error && data.user) {
          const userPayload = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("finpulse_user_session", JSON.stringify(userPayload));
            localStorage.removeItem("finpulse_demo_mode");
          }
          return { success: true, user: userPayload };
        }
        return { success: false, error: error?.message || "Token no válido o ya confirmado." };
      }
    }

    return {
      success: false,
      error: "No se reconoció el formato. Ingresa el código de 6 dígitos o la URL completa de confirmación.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al verificar." };
  }
}
