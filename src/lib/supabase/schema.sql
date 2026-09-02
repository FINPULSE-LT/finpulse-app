-- ==============================================================================
-- FINPULSE: ESQUEMA DE BASE DE DATOS Y POLÍTICAS DE SEGURIDAD RLS (SUPABASE)
-- Ejecutar este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/ajtyraxyiruyqibkgpxe/sql/new
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROFILES (Perfiles y Configuración de Usuario)
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

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. TRIGGER AUTOMÁTICO: Crear perfil al registrarse nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA: ACCOUNTS (Cuentas y Medios de Pago)
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

CREATE POLICY "Los usuarios pueden gestionar sus propias cuentas"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id);

-- 5. TABLA: TRANSACTIONS (Movimientos)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'saving_transfer')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  is_ant_expense BOOLEAN DEFAULT FALSE,
  installments_total INTEGER DEFAULT 1 CHECK (installments_total >= 1),
  installment_current INTEGER DEFAULT 1 CHECK (installment_current >= 1),
  statement_date DATE,
  transacted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden gestionar sus propias transacciones"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- 6. TABLA: SAVINGS_GOALS (Metas de Ahorro Individuales y Compartidas)
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

CREATE POLICY "Creadores pueden gestionar sus metas"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = creator_id);

-- 7. TABLA: GOAL_MEMBERS (Participantes y Aportes a Metas Compartidas)
CREATE TABLE IF NOT EXISTS public.goal_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contributed_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (contributed_amount >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, user_id)
);

ALTER TABLE public.goal_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver metas compartidas en las que participan"
  ON public.savings_goals FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (SELECT 1 FROM public.goal_members gm WHERE gm.goal_id = savings_goals.id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Miembros pueden ver y actualizar su aporte"
  ON public.goal_members FOR ALL
  USING (auth.uid() = user_id);

-- ==============================================================================
-- FIN DEL SCRIPT DDL
-- ==============================================================================
