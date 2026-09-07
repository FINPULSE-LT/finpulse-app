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
  // 0. Intentar cargar via API segura con permisos Admin (resuelve RLS en metas compartidas y nombres reales)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/finances?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (apiErr) {
      console.warn("Fallo fetch a /api/finances, usando cliente directo:", apiErr);
    }
  }

  // 1. Obtener Perfil (o crearlo si es primera vez para integridad referencial)
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
  } else {
    // Si no existe, crearlo automáticamente en Supabase para asegurar que foreign keys no fallen
    try {
      await supabase.from("profiles").upsert(
        {
          id: userId,
          display_name: "Usuario",
          currency: "ARS",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    } catch (e) {
      console.warn("No se pudo auto-inicializar perfil en Supabase:", e);
    }
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
): Promise<{ success: boolean; transaction?: Transaction; updatedGoal?: SavingsGoal; error?: string }> {
  // Intentar mediante API segura en el servidor
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          transaction: tx,
          accountId: targetAccount?.id,
          goalId: targetGoal?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          transaction: data.transaction,
          updatedGoal: data.updatedGoal || undefined,
        };
      } else if (!res.ok) {
        return {
          success: false,
          error: data.error || "Error al registrar transacción",
        };
      }
    } catch (apiErr: any) {
      console.warn("Fallo POST /api/transactions, intentando cliente directo:", apiErr);
    }
  }

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
  type?: string,
  goalId?: string
): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams({ userId, txId });
      if (accountId) params.set("accountId", accountId);
      if (amount !== undefined) params.set("amount", String(amount));
      if (type) params.set("type", type);
      if (goalId) params.set("goalId", goalId);

      const res = await fetch(`/api/transactions?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return true;
      }
    } catch (apiErr) {
      console.warn("Fallo DELETE /api/transactions, usando cliente directo:", apiErr);
    }
  }

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
): Promise<{ success: boolean; account?: Account; error?: string }> {
  try {
    // Asegurar integridad referencial con el perfil
    await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: "Usuario",
        currency: "ARS",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

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

    if (error || !data) {
      console.error("Error al crear cuenta en Supabase:", error);
      return {
        success: false,
        error: error?.message || "No se pudo insertar la cuenta en Supabase.",
      };
    }

    return {
      success: true,
      account: {
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
      },
    };
  } catch (err: any) {
    console.error("Excepción en createSupabaseAccount:", err);
    return {
      success: false,
      error: err.message || "Excepción al guardar la cuenta.",
    };
  }
}

/**
 * Crea una meta de ahorro en Supabase y agrega al creador como miembro
 */
export async function createSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: Omit<SavingsGoal, "id" | "creatorId">
): Promise<{ success: boolean; goal?: SavingsGoal; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/goals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, goal }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.goal) {
        return { success: true, goal: data.goal };
      } else if (!res.ok) {
        return { success: false, error: data.error || "Error al crear meta" };
      }
    } catch (apiErr: any) {
      console.warn("Fallo fetch /api/goals/create, usando fallback directo:", apiErr);
    }
  }

  try {
    // Asegurar integridad referencial con el perfil
    await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: "Usuario",
        currency: "ARS",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    const { data, error } = await supabase
      .from("savings_goals")
      .insert({
        creator_id: userId,
        title: goal.title,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        target_date: goal.targetDate || null,
        is_collaborative: goal.isCollaborative ?? false,
        invite_code: goal.inviteCode || null,
        category_icon: goal.categoryIcon || "Trophy",
        color_hex: goal.colorHex || "#06b6d4",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error al crear meta en Supabase:", error);
      return {
        success: false,
        error: error?.message || "No se pudo insertar la meta en Supabase Cloud.",
      };
    }

    // Si tiene aporte inicial o es colaborativa, registrar al creador en goal_members
    await supabase.from("goal_members").insert({
      goal_id: data.id,
      user_id: userId,
      contributed_amount: goal.currentAmount || 0,
    });

    return {
      success: true,
      goal: {
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
      },
    };
  } catch (err: any) {
    console.error("Excepción en createSupabaseGoal:", err);
    return {
      success: false,
      error: err.message || "Excepción al guardar la meta en Supabase.",
    };
  }
}

/**
 * Aporta a una meta existente en Supabase
 */
export async function contributeToSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  amount: number
): Promise<{ success: boolean; goal?: SavingsGoal; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/goals/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, userId, amount }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.goal) {
        return { success: true, goal: data.goal };
      } else if (!res.ok) {
        return { success: false, error: data.error || "Error al registrar aporte a la meta" };
      }
    } catch (apiErr: any) {
      console.warn("Fallo fetch /api/goals/contribute, usando fallback directo:", apiErr);
    }
  }

  try {
    // 1. Obtener la meta actual
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("current_amount")
      .eq("id", goalId)
      .single();

    if (!goal) return { success: false, error: "Meta no encontrada" };

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

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/goals/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, inviteCodeOrGoalId }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.goal) {
        return { success: true, goal: data.goal };
      } else if (!res.ok) {
        return { success: false, error: data.error || "Error al unirse a la meta" };
      }
    } catch (apiErr: any) {
      console.warn("Fallo fetch /api/goals/join, usando fallback directo:", apiErr);
    }
  }

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

/**
 * Actualiza los datos de una cuenta existente
 */
export async function updateSupabaseAccount(
  supabase: SupabaseClient,
  userId: string,
  accountData: Partial<Account> & { id: string }
): Promise<{ success: boolean; account?: Account; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountId: accountData.id,
          name: accountData.name,
          accountType: accountData.accountType,
          balance: accountData.balance,
          colorHex: accountData.colorHex,
          closingDay: accountData.closingDay,
          dueDay: accountData.dueDay,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, account: data.account };
      }
      return { success: false, error: data.error || "Error al actualizar la cuenta" };
    } catch (err: any) {
      console.warn("Fallo PATCH /api/accounts, intentando cliente directo:", err);
    }
  }

  const { data, error } = await supabase
    .from("accounts")
    .update({
      name: accountData.name,
      account_type: accountData.accountType,
      balance: accountData.balance,
      color_hex: accountData.colorHex,
      closing_day: accountData.closingDay || null,
      due_day: accountData.dueDay || null,
    })
    .eq("id", accountData.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Error al actualizar cuenta" };
  }

  return {
    success: true,
    account: {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      accountType: data.account_type,
      balance: Number(data.balance) || 0,
      closingDay: data.closing_day || undefined,
      dueDay: data.due_day || undefined,
      colorHex: data.color_hex || "#10b981",
      cardNetwork: data.card_network || undefined,
      lastFourDigits: data.last_four_digits || undefined,
      createdAt: data.created_at,
    },
  };
}

/**
 * Elimina una cuenta bancaria o billetera
 */
export async function deleteSupabaseAccount(
  supabase: SupabaseClient,
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/accounts?userId=${encodeURIComponent(userId)}&accountId=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || "Error al eliminar la cuenta" };
    } catch (err: any) {
      console.warn("Fallo DELETE /api/accounts, intentando cliente directo:", err);
    }
  }

  await supabase.from("transactions").update({ account_id: null }).eq("account_id", accountId).eq("user_id", userId);
  const { error } = await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", userId);
  return { success: !error, error: error?.message };
}

/**
 * Realiza una transferencia entre dos cuentas del usuario
 */
export async function transferBetweenSupabaseAccounts(
  supabase: SupabaseClient,
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  notes?: string
): Promise<{
  success: boolean;
  fromAccount?: Account;
  toAccount?: Account;
  transactions?: Transaction[];
  error?: string;
}> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fromAccountId,
          toAccountId,
          amount,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          fromAccount: data.fromAccount,
          toAccount: data.toAccount,
          transactions: data.transactions,
        };
      }
      return { success: false, error: data.error || "Error en la transferencia" };
    } catch (err: any) {
      console.error("Error en transferBetweenSupabaseAccounts:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: "Sólo disponible en entorno con conexión al servidor" };
}

/**
 * Modifica una transacción existente
 */
export async function updateSupabaseTransaction(
  supabase: SupabaseClient,
  userId: string,
  txId: string,
  tx: Omit<Transaction, "id" | "userId">,
  accountId?: string,
  goalId?: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          txId,
          transaction: tx,
          accountId,
          goalId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, transaction: data.transaction };
      }
      return { success: false, error: data.error || "Error al actualizar la transacción" };
    } catch (err: any) {
      console.error("Error en updateSupabaseTransaction:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: "No disponible sin conexión al servidor" };
}

/**
 * Actualiza una meta de ahorro y los montos aportados por cada miembro
 */
export async function updateSupabaseGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  goalData: {
    title: string;
    targetAmount: number;
    targetDate?: string;
    isCollaborative?: boolean;
    memberContributions?: { userId: string; amount: number }[];
  }
): Promise<{ success: boolean; goal?: SavingsGoal; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/goals/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          goalId,
          ...goalData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.goal) {
        return { success: true, goal: data.goal };
      }
      return { success: false, error: data.error || "Error al actualizar la meta" };
    } catch (err: any) {
      console.error("Error en updateSupabaseGoal:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: "No disponible sin conexión al servidor" };
}
