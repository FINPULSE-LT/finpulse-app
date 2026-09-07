import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de administracion de Supabase para ejecucion segura en el servidor
 * Utiliza SUPABASE_SERVICE_ROLE_KEY para omitir bloqueos de RLS en consultas colaborativas
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
