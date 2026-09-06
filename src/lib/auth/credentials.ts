/**
 * Gestión de Credenciales y Autenticación Simplificada
 * Permite el acceso directo por Email + Contraseña con fallback garantizado para usuarios autorizados.
 */
import { createClient } from "@/lib/supabase/client";

export interface AuthorizedUser {
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

export async function loginWithEmailAndPassword(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: { email: string; name: string }; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // 1. Verificación contra los usuarios autorizados prioritarios
  const authorized = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === email && u.password === password
  );

  if (authorized) {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_user_session", JSON.stringify({
        email: authorized.email,
        name: authorized.name,
      }));
    }
    return {
      success: true,
      user: {
        email: authorized.email,
        name: authorized.name,
      },
    };
  }

  // 2. Intento vía Supabase Auth
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("finpulse_user_session", JSON.stringify({
          email: data.user.email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
        }));
      }
      return {
        success: true,
        user: {
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
        },
      };
    }

    if (error) {
      // Si el email no fue confirmado aún en Supabase
      if (error.message.toLowerCase().includes("not confirmed")) {
        return {
          success: false,
          error: "Credenciales válidas, pero el correo no ha sido confirmado aún en Supabase.",
        };
      }
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Error al autenticar",
    };
  }

  return {
    success: false,
    error: "Credenciales no reconocidas.",
  };
}
