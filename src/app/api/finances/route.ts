import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { Account, Transaction, SavingsGoal, GoalMember, Profile, CategoryBudget } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // 1. Perfil del usuario
    const { data: profileData } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    let profile: Profile | null = null;
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
      await admin.from("profiles").upsert(
        { id: userId, display_name: "Usuario", currency: "ARS" },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }

    // 2. Cuentas del usuario
    const { data: accountsData } = await admin
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    let accounts: Account[] = (accountsData || []).map((a) => ({
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

    if (accounts.length === 0) {
      const { data: newAcc } = await admin
        .from("accounts")
        .insert({
          user_id: userId,
          name: "Efectivo / Billetera",
          account_type: "cash",
          balance: 0,
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

    // 3. Transacciones del usuario
    const { data: txData } = await admin
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

    // 4. Metas de ahorro colaborativas y personales
    const { data: userMemberships } = await admin
      .from("goal_members")
      .select("goal_id")
      .eq("user_id", userId);

    const memberGoalIds = (userMemberships || []).map((m) => m.goal_id);

    const { data: allGoals } = await admin
      .from("savings_goals")
      .select("*")
      .order("created_at", { ascending: false });

    const visibleGoals = (allGoals || []).filter(
      (g) => g.creator_id === userId || memberGoalIds.includes(g.id)
    );

    const visibleGoalIds = visibleGoals.map((g) => g.id);
    const { data: allMembers } = await admin
      .from("goal_members")
      .select("*")
      .in("goal_id", visibleGoalIds.length > 0 ? visibleGoalIds : ["none"]);

    const memberUserIds = Array.from(new Set((allMembers || []).map((m) => m.user_id)));
    const { data: memberProfiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", memberUserIds.length > 0 ? memberUserIds : ["none"]);

    const profileMap = new Map<string, string>();
    memberProfiles?.forEach((p) => profileMap.set(p.id, p.display_name || "Usuario"));

    const goals: SavingsGoal[] = [];

    for (const g of visibleGoals) {
      const gMembers = (allMembers || []).filter((m) => m.goal_id === g.id);
      const totalContributed = gMembers.reduce(
        (sum, m) => sum + (Number(m.contributed_amount) || 0),
        0
      );

      if (Number(g.current_amount) !== totalContributed) {
        await admin
          .from("savings_goals")
          .update({ current_amount: totalContributed })
          .eq("id", g.id);
      }

      const members: GoalMember[] = gMembers.map((m) => {
        const isSelf = m.user_id === userId;
        const profileName = profileMap.get(m.user_id);
        const userName = isSelf
          ? "Tú" + (profileName ? ` (${profileName})` : "")
          : profileName || "Participante";

        const contributedAmount = Number(m.contributed_amount) || 0;
        const percentageContribution =
          totalContributed > 0 ? (contributedAmount / totalContributed) * 100 : 0;

        return {
          id: m.id,
          goalId: m.goal_id,
          userId: m.user_id,
          userName,
          contributedAmount,
          percentageContribution,
          joinedAt: m.joined_at,
        };
      });

      goals.push({
        id: g.id,
        creatorId: g.creator_id,
        title: g.title,
        targetAmount: Number(g.target_amount) || 0,
        currentAmount: totalContributed,
        targetDate: g.target_date || undefined,
        isCollaborative: g.is_collaborative ?? false,
        inviteCode: g.invite_code || undefined,
        categoryIcon: g.category_icon || "Trophy",
        colorHex: g.color_hex || "#06b6d4",
        members,
        createdAt: g.created_at,
      });
    }

    // 5. Presupuestos
    let budgets: CategoryBudget[] = [];
    try {
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      if (userData?.user?.user_metadata?.budgets) {
        budgets = userData.user.user_metadata.budgets;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions,
        goals,
        profile,
        budgets,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/finances:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
