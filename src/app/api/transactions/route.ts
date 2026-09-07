import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { Transaction, SavingsGoal, GoalMember } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, transaction, accountId, goalId } = body;

    if (!userId || !transaction || !transaction.amount || !transaction.type) {
      return NextResponse.json(
        { error: "Faltan parametros requeridos (userId, transaction)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Insertar transaccion
    const { data: inserted, error: txError } = await admin
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: accountId || transaction.accountId || null,
        type: transaction.type,
        amount: Number(transaction.amount),
        category: transaction.category,
        description: transaction.description,
        notes: transaction.notes || null,
        is_ant_expense: transaction.isAntExpense ?? false,
        installments_total: transaction.installmentsTotal || 1,
        installment_current: transaction.installmentCurrent || 1,
        statement_date: transaction.statementDate || null,
        transacted_at: transaction.transactedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !inserted) {
      return NextResponse.json(
        { error: txError?.message || "Error al insertar transaccion" },
        { status: 500 }
      );
    }

    // 2. Actualizar saldo de cuenta
    const resolvedAccId = accountId || transaction.accountId;
    if (resolvedAccId) {
      const { data: acc } = await admin
        .from("accounts")
        .select("balance")
        .eq("id", resolvedAccId)
        .maybeSingle();

      if (acc) {
        const diff = transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount);
        const newBalance = (Number(acc.balance) || 0) + diff;
        await admin
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", resolvedAccId);
      }
    }

    // 3. Si esta asociada a una meta de ahorro (o es tipo saving_transfer)
    const resolvedGoalId = goalId || transaction.goalId;
    let updatedGoal: SavingsGoal | null = null;

    if (resolvedGoalId) {
      const { data: existingMember } = await admin
        .from("goal_members")
        .select("*")
        .eq("goal_id", resolvedGoalId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMember) {
        const newMemberAmt = (Number(existingMember.contributed_amount) || 0) + Number(transaction.amount);
        await admin
          .from("goal_members")
          .update({ contributed_amount: newMemberAmt })
          .eq("id", existingMember.id);
      } else {
        await admin.from("goal_members").insert({
          goal_id: resolvedGoalId,
          user_id: userId,
          contributed_amount: Number(transaction.amount),
        });
      }

      // Recalcular total de la meta
      const { data: allMembers } = await admin
        .from("goal_members")
        .select("*")
        .eq("goal_id", resolvedGoalId);

      const totalContributed = (allMembers || []).reduce(
        (sum, m) => sum + (Number(m.contributed_amount) || 0),
        0
      );

      await admin
        .from("savings_goals")
        .update({ current_amount: totalContributed })
        .eq("id", resolvedGoalId);

      // Obtener meta completa
      const { data: goalData } = await admin
        .from("savings_goals")
        .select("*")
        .eq("id", resolvedGoalId)
        .single();

      if (goalData) {
        const memberUserIds = (allMembers || []).map((m) => m.user_id);
        const { data: memberProfiles } = await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", memberUserIds);

        const profileMap = new Map<string, string>();
        memberProfiles?.forEach((p) => profileMap.set(p.id, p.display_name || "Usuario"));

        const members: GoalMember[] = (allMembers || []).map((m) => {
          const isSelf = m.user_id === userId;
          const profileName = profileMap.get(m.user_id);
          const userName = isSelf
            ? "Tú" + (profileName ? ` (${profileName})` : "")
            : profileName || "Participante";

          const contrib = Number(m.contributed_amount) || 0;
          const percentageContribution =
            totalContributed > 0 ? (contrib / totalContributed) * 100 : 0;

          return {
            id: m.id,
            goalId: m.goal_id,
            userId: m.user_id,
            userName,
            contributedAmount: contrib,
            percentageContribution,
            joinedAt: m.joined_at,
          };
        });

        updatedGoal = {
          id: goalData.id,
          creatorId: goalData.creator_id,
          title: goalData.title,
          targetAmount: Number(goalData.target_amount),
          currentAmount: totalContributed,
          targetDate: goalData.target_date || undefined,
          isCollaborative: goalData.is_collaborative ?? false,
          inviteCode: goalData.invite_code || undefined,
          categoryIcon: goalData.category_icon || "Trophy",
          colorHex: goalData.color_hex || "#06b6d4",
          members,
          createdAt: goalData.created_at,
        };
      }
    }

    const createdTx: Transaction = {
      id: inserted.id,
      userId: inserted.user_id,
      accountId: inserted.account_id || undefined,
      accountName: transaction.accountName || "General",
      goalId: resolvedGoalId,
      goalTitle: updatedGoal ? updatedGoal.title : transaction.goalTitle,
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

    return NextResponse.json({
      success: true,
      transaction: createdTx,
      updatedGoal,
    });
  } catch (error: any) {
    console.error("Error in POST /api/transactions:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar transaccion" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const txId = searchParams.get("txId");
    const accountId = searchParams.get("accountId");
    const amountStr = searchParams.get("amount");
    const type = searchParams.get("type");
    const goalId = searchParams.get("goalId");

    if (!userId || !txId) {
      return NextResponse.json(
        { error: "Faltan parametros (userId, txId)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Borrar transaccion
    const { error: delErr } = await admin
      .from("transactions")
      .delete()
      .eq("id", txId)
      .eq("user_id", userId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // 2. Revertir saldo de cuenta
    const amount = Number(amountStr) || 0;
    if (accountId && amount > 0 && type) {
      const { data: acc } = await admin
        .from("accounts")
        .select("balance")
        .eq("id", accountId)
        .maybeSingle();

      if (acc) {
        const revertDiff = type === "income" ? -amount : amount;
        await admin
          .from("accounts")
          .update({ balance: (Number(acc.balance) || 0) + revertDiff })
          .eq("id", accountId);
      }
    }

    // 3. Si era aporte a meta, revertir aporte
    if (goalId && amount > 0) {
      const { data: member } = await admin
        .from("goal_members")
        .select("*")
        .eq("goal_id", goalId)
        .eq("user_id", userId)
        .maybeSingle();

      if (member) {
        const newMemberAmt = Math.max(0, (Number(member.contributed_amount) || 0) - amount);
        await admin
          .from("goal_members")
          .update({ contributed_amount: newMemberAmt })
          .eq("id", member.id);

        const { data: allMembers } = await admin
          .from("goal_members")
          .select("*")
          .eq("goal_id", goalId);

        const totalContributed = (allMembers || []).reduce(
          (sum, m) => sum + (Number(m.contributed_amount) || 0),
          0
        );

        await admin
          .from("savings_goals")
          .update({ current_amount: totalContributed })
          .eq("id", goalId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/transactions:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar transaccion" },
      { status: 500 }
    );
  }
}
