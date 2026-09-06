/**
 * Servicio de Datos y Persistencia en Supabase Cloud
 * Centraliza las consultas, inserciones y actualizaciones en la base de datos de Supabase.
 * Elimina toda dependencia de almacenamiento local (localStorage) para la economía del usuario.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Account, Transaction, SavingsGoal, GoalMember, Profile, CategoryBudget } from "@/types";

export interface UserFinancesData {
  accounts: Account[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  profile: Profile | null;
  budgets: CategoryBudget[];
}

/**
 * Carga todo el estado financiero del usuario desde Supabase
 */
export async function fetchUserFinances(
  supabase: SupabaseClient,
  userId: string
): Promise<UserFinancesData> {
  // 1. Obtener Perfil
  let profile: Profile | null = null;
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileData) {
    profile = {
      id: profileData.id,
      displayName: profileData.display_name || "Usuario",
      avatarUrl: profileData.avatar_url || undefined,
      currency: profileData.currency || "ARS",
      coachMode: (profileData.coach_mode as any) || "encouraging",
      emailDigestEnabled: profileData.email_digest_enabled ?? true,
      streakAntExpensesCount: profileData.streak_ant_expenses_count || 0,
      lastStreakDate: profileData.last_streak_date || undefined,
      monthlyStreakFreezeAvailable: profileData.monthly_streak_freeze_available ?? true,
      totalRescuedMoney: Number(profileData.total_rescued_money) || 0,
      createdAt: profileData.created_at,
    };
  }

  // 2. Obtener Cuentas
  const { data: accountsData } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  let accounts: Account[] = [];
  if (accountsData && accountsData.length > 0) {
    accounts = accountsData.map((a) => ({
      id: a.id,
      userId: a.user_id,
      name: a.name,
      accountType: a.account_type,
      balance: Number(a.balance) || 0,
      closingDay: a.closing_day || undefined,
      dueDay: a.due_day || undefined,
      colorHex: a.color_hex || "#10b981",
      cardNetwork: a.card_network || undefined,
      lastFourDigits: a.last_four_digits || undefined,
      createdAt: a.created_at,
    }));
  } else {
    // Si es un usuario nuevo sin cuentas, crear cuenta inicial "Efectivo / Billetera" con saldo 0
    const { data: newAcc } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name: "Efectivo / Billetera",
        account_type: "cash",
        balance: 0.0,
        color_hex: "#10b981",
      })
      .select()
      .maybeSingle();

    if (newAcc) {
      accounts = [
        {
          id: newAcc.id,
          userId: newAcc.user_id,
          name: newAcc.name,
          accountType: newAcc.account_type,
          balance: Number(newAcc.balance) || 0,
          colorHex: newAcc.color_hex || "#10b981",
          createdAt: newAcc.created_at,
        },
      ];
    }
  }

  // 3. Obtener Transacciones
  const { data: txData } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("transacted_at", { ascending: false });

  const transactions: Transaction[] = (txData || []).map((t) => {
    const acc = accounts.find((a) => a.id === t.account_id);
    return {
      id: t.id,
      userId: t.user_id,
      accountId: t.account_id || undefined,
      accountName: acc ? acc.name : "General",
      type: t.type,
      amount: Number(t.amount) || 0,
      category: t.category,
      description: t.description,
      notes: t.notes || undefined,
      isAntExpense: t.is_ant_expense ?? false,
      installmentsTotal: t.installments_total || 1,
      installmentCurrent: t.installment_current || 1,
      statementDate: t.statement_date || undefined,
      transactedAt: t.transacted_at || new Date().toISOString(),
    };
  });

  // 4. Obtener Metas de Ahorro con Miembros
  const { data: goalsData } = await supabase
    .from("savings_goals")
    .select(`
      *,
      goal_members (*)
    `)
    .order("created_at", { ascending: false });

  const goals: SavingsGoal[] = (goalsData || []).map((g) => {
    const members: GoalMember[] = (g.goal_members || []).map((m: any) => ({
      id: m.id,
      goalId: m.goal_id,
      userId: m.user_id,
      userName: m.user_id === userId ? "Tú" : "Participante",
      contributedAmount: Number(m.contributed_amount) || 0,
      percentageContribution:
        Number(g.current_amount) > 0
          ? (Number(m.contributed_amount) / Number(g.current_amount)) * 100
          : 0,
      joinedAt: m.joined_at,
    }));

    return {
      id: g.id,
      creatorId: g.creator_id,
      title: g.title,
      targetAmount: Number(g.target_amount) || 0,
      currentAmount: Number(g.current_amount) || 0,
      targetDate: g.target_date || undefined,
      isCollaborative: g.is_collaborative ?? false,
      inviteCode: g.invite_code || undefined,
      categoryIcon: g.category_icon || "Trophy",
      colorHex: g.color_hex || "#06b6d4",
      members,
      createdAt: g.created_at,
    };
  });

  // 5. Presupuestos almacenados en user_metadata
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const budgets: CategoryBudget[] = user?.user_metadata?.budgets || [];

  return {
    accounts,
    transactions,
    goals,
    profile,
    budgets,
  };
}

/**
 * Inserta un movimiento en Supabase y actualiza el balance de la cuenta
 */
export async function createSupabaseTransaction(
  supabase: SupabaseClient,
  userId: string,
  tx: Omit<Transaction, "id" | "userId">,
  targetAccount?: Account,
  targetGoal?: SavingsGoal
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const { data: inserted, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: targetAccount ? targetAccount.id : null,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        notes: tx.notes || (targetGoal ? `Meta: ${targetGoal.title}` : null),
        is_ant_expense: tx.isAntExpense,
        installments_total: tx.installmentsTotal || 1,
        installment_current: tx.installmentCurrent || 1,
        statement_date: tx.statementDate || null,
        transacted_at: tx.transactedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !inserted) {
      return { success: false, error: txError?.message || "Error al insertar transacción" };
    }

    // Actualizar Saldo de Cuenta en Supabase
    if (targetAccount) {
      const diff = tx.type === "income" ? tx.amount : -tx.amount;
      const newBalance = (targetAccount.balance || 0) + diff;
      await supabase
        .from("accounts")
        .update({ balance: newBalance })
        .eq("id", targetAccount.id)
        .eq("user_id", userId);
    }

    // Si es aporte a Meta, actualizar la meta en Supabase
    if (targetGoal) {
      const newGoalCurrent = (targetGoal.currentAmount || 0) + tx.amount;
      await supabase
        .from("savings_goals")
        .update({ current_amount: newGoalCurrent })
        .eq("id", targetGoal.id);

      // Actualizar o insertar aporte en goal_members
      const { data: member } = await supabase
        .from("goal_members")
        .select("*")
        .eq("goal_id", targetGoal.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (member) {
        await supabase
          .from("goal_members")
          .update({
            contributed_amount: (Number(member.contributed_amount) || 0) + tx.amount,
          })
          .eq("id", member.id);
      } else {
        await supabase.from("goal_members").insert({
          goal_id: targetGoal.id,
          user_id: userId,
          contributed_amount: tx.amount,
        });
      }
    }

    const createdTx: Transaction = {
      id: inserted.id,
      userId: inserted.user_id,
      accountId: inserted.account_id || undefined,
      accountName: targetAccount ? targetAccount.name : "General",
      goalId: targetGoal ? targetGoal.id : undefined,
      goalTitle: targetGoal ? targetGoal.title : undefined,
      type: inserted.type,
      amount: Number(inserted.amount),
      category: inserted.category,
      description: inserted.description,
      notes: inserted.notes || undefined,
      isAntExpense: inserted.is_ant_expense,
      installmentsTotal: inserted.installments_total,
      installmentCurrent: inserted.installment_current,
      statementDate: inserted.statement_date || undefined,
      transactedAt: inserted.transacted_at,
    };

    return { success: true, transaction: createdTx };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Elimina una transacción de Supabase y revierte el balance
 */
export async function deleteSupabaseTransaction(
  supabase: SupabaseClient,
  userId: string,
  txId: string,
  accountId?: string,
  amount?: number,
  type?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", txId)
    .eq("user_id", userId);

  if (error) return false;

  // Revertir balance de la cuenta
  if (accountId && amount && type) {
    const { data: acc } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    if (acc) {
      const revertDiff = type === "income" ? -amount : amount;
      await supabase
        .from("accounts")
        .update({ balance: Number(acc.balance) + revertDiff })
        .eq("id", accountId)
        .eq("user_id", userId);
    }
  }

  return true;
}

/**
 * Crea una nueva cuenta bancaria, billetera o tarjeta en Supabase
 */
export async function createSupabaseAccount(
  supabase: SupabaseClient,
  userId: string,
  account: Omit<Account, "id" | "userId">
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: account.name,
      account_type: account.accountType,
      balance: account.balance,
      closing_day: account.closingDay || null,
      due_day: account.dueDay || null,
      color_hex: account.colorHex || "#10b981",
      card_network: account.cardNetwork || null,
      last_four_digits: account.lastFourDigits || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    accountType: data.account_type,
    balance: Number(data.balance),
    closingDay: data.closing_day || undefined,
    dueDay: data.due_day || undefined,
    colorHex: data.color_hex || "#10b981",
    cardNetwork: data.card_network || undefined,
    lastFourDigits: data.last_four_digits || undefined,
    createdAt: data.created_at,
  };
}

/**
 * Crea una meta de ahorro en Supabase y agrega al creador como miembro
 */
export async function createSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: Omit<SavingsGoal, "id" | "creatorId">
): Promise<SavingsGoal | null> {
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      creator_id: userId,
      title: goal.title,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount || 0,
      target_date: goal.targetDate || null,
      is_collaborative: goal.isCollaborative,
      invite_code: goal.inviteCode || null,
      category_icon: goal.categoryIcon || "Trophy",
      color_hex: goal.colorHex || "#06b6d4",
    })
    .select()
    .single();

  if (error || !data) return null;

  // Si tiene aporte inicial o es colaborativa, registrar al creador en goal_members
  await supabase.from("goal_members").insert({
    goal_id: data.id,
    user_id: userId,
    contributed_amount: goal.currentAmount || 0,
  });

  return {
    id: data.id,
    creatorId: data.creator_id,
    title: data.title,
    targetAmount: Number(data.target_amount),
    currentAmount: Number(data.current_amount),
    targetDate: data.target_date || undefined,
    isCollaborative: data.is_collaborative,
    inviteCode: data.invite_code || undefined,
    categoryIcon: data.category_icon,
    colorHex: data.color_hex,
    members: [
      {
        id: `gm-${Date.now()}`,
        goalId: data.id,
        userId: userId,
        userName: "Tú",
        contributedAmount: Number(data.current_amount) || 0,
        percentageContribution: 100,
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: data.created_at,
  };
}

/**
 * Aporta a una meta existente en Supabase
 */
export async function contributeToSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  amount: number
): Promise<boolean> {
  // 1. Obtener la meta actual
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", goalId)
    .single();

  if (!goal) return false;

  const newCurrent = Number(goal.current_amount) + amount;
  await supabase
    .from("savings_goals")
    .update({ current_amount: newCurrent })
    .eq("id", goalId);

  // 2. Actualizar o insertar aporte en goal_members
  const { data: member } = await supabase
    .from("goal_members")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member) {
    await supabase
      .from("goal_members")
      .update({
        contributed_amount: Number(member.contributed_amount) + amount,
      })
      .eq("id", member.id);
  } else {
    await supabase.from("goal_members").insert({
      goal_id: goalId,
      user_id: userId,
      contributed_amount: amount,
    });
  }

  return true;
}

/**
 * Actualiza los presupuestos en la nube de Supabase (user_metadata)
 */
export async function updateSupabaseBudgets(
  supabase: SupabaseClient,
  budgets: CategoryBudget[]
): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({
    data: { budgets },
  });
  return !error;
}

/**
 * Actualiza racha y dinero rescatado en el perfil del usuario
 */
export async function updateSupabaseProfileStreak(
  supabase: SupabaseClient,
  userId: string,
  streak: number,
  rescued: number
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({
      streak_ant_expenses_count: streak,
      total_rescued_money: rescued,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  return !error;
}

/**
 * Unirse a una meta colaborativa existente en Supabase mediante código o ID
 */
export async function joinSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  inviteCodeOrGoalId: string
): Promise<{ success: boolean; goal?: SavingsGoal; error?: string }> {
  try {
    const raw = inviteCodeOrGoalId.trim();
    // Extraer UUID si es un link o query param
    let cleanCode = raw;
    if (raw.includes("unirseMeta=")) {
      const match = raw.match(/unirseMeta=([^&]+)/);
      if (match) cleanCode = match[1];
    }

    let goalId: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);

    if (isUuid) {
      goalId = cleanCode;
    } else {
      // Buscar por invite_code
      const { data: found } = await supabase
        .from("savings_goals")
        .select("id")
        .eq("invite_code", cleanCode)
        .maybeSingle();

      if (found) {
        goalId = found.id;
      }
    }

    if (!goalId) {
      return {
        success: false,
        error: "No se encontró ninguna meta colaborativa con ese código de invitación.",
      };
    }

    // 2. Insertar en goal_members si no existe
    const { data: existingMember } = await supabase
      .from("goal_members")
      .select("id")
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingMember) {
      const { error: insertErr } = await supabase.from("goal_members").insert({
        goal_id: goalId,
        user_id: userId,
        contributed_amount: 0,
      });

      if (insertErr) {
        return { success: false, error: "Error al unirte al equipo de la meta." };
      }
    }

    // 3. Obtener la meta con miembros actualizados
    const { data: fullGoal, error: gError } = await supabase
      .from("savings_goals")
      .select(`
        *,
        goal_members (*)
      `)
      .eq("id", goalId)
      .single();

    if (gError || !fullGoal) {
      return { success: false, error: "Te has unido, pero hubo un problema al cargar los datos." };
    }

    const members: GoalMember[] = (fullGoal.goal_members || []).map((m: any) => ({
      id: m.id,
      goalId: m.goal_id,
      userId: m.user_id,
      userName: m.user_id === userId ? "Tú" : "Participante",
      contributedAmount: Number(m.contributed_amount) || 0,
      percentageContribution:
        Number(fullGoal.current_amount) > 0
          ? (Number(m.contributed_amount) / Number(fullGoal.current_amount)) * 100
          : 0,
      joinedAt: m.joined_at,
    }));

    const parsedGoal: SavingsGoal = {
      id: fullGoal.id,
      creatorId: fullGoal.creator_id,
      title: fullGoal.title,
      targetAmount: Number(fullGoal.target_amount),
      currentAmount: Number(fullGoal.current_amount),
      targetDate: fullGoal.target_date || undefined,
      isCollaborative: fullGoal.is_collaborative,
      inviteCode: fullGoal.invite_code || undefined,
      categoryIcon: fullGoal.category_icon,
      colorHex: fullGoal.color_hex,
      members,
      createdAt: fullGoal.created_at,
    };

    return { success: true, goal: parsedGoal };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al unirse a la meta" };
  }
}
