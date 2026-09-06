/**
 * Gestión de Credenciales y Autenticación de FinPulse
 * Valida credenciales contra Supabase Auth y garantiza el inicio de sesión para los usuarios autorizados.
 */
import { createClient } from "@/lib/supabase/client";

export interface AuthorizedUser {
  id: string;
  email: string;
  password: string;
  name: string;
  displayName: string;
}

export const AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: "f3129e05-84c8-4551-a5c1-26a2f153650b",
    email: "lisandrotorressola@gmail.com",
    password: "Lisinho2026",
    name: "Lisandro Torres Sola",
    displayName: "Lisandro",
  },
  {
    id: "8de13f0f-325a-489a-9792-0a6b16a04c2a",
    email: "alberdimariajose02@gmail.com",
    password: "Velinha2026",
    name: "María José Alberdi",
    displayName: "María José",
  },
];

export async function loginWithEmailAndPassword(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: { id: string; email: string; name: string }; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // 1. Verificación contra la lista autorizada
  const authorized = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === email && u.password === password
  );

  // 2. Intento de inicio de sesión vía Supabase Auth
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "finpulse_user_session",
          JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
          })
        );
      }
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
        },
      };
    }

    // Si Supabase falló pero la contraseña ingresada coincide con el usuario autorizado
    if (authorized) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "finpulse_user_session",
          JSON.stringify({
            id: authorized.id,
            email: authorized.email,
            name: authorized.name,
          })
        );
      }
      return {
        success: true,
        user: {
          id: authorized.id,
          email: authorized.email,
          name: authorized.name,
        },
      };
    }

    if (error) {
      if (error.message.toLowerCase().includes("not confirmed") || error.code === "email_not_confirmed") {
        return {
          success: false,
          error: "Tu usuario está registrado, pero debes confirmar el enlace que Supabase envió a tu correo.",
        };
      }
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }
  } catch (err: any) {
    if (authorized) {
      return {
        success: true,
        user: {
          id: authorized.id,
          email: authorized.email,
          name: authorized.name,
        },
      };
    }
    return {
      success: false,
      error: err.message || "Error al autenticar",
    };
  }

  return {
    success: false,
    error: "Credenciales no reconocidas o contraseña incorrecta.",
  };
}
