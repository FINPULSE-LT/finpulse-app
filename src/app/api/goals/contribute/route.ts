import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { SavingsGoal, GoalMember } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goalId, userId, amount } = body;

    if (!goalId || !userId || !amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Parametros invalidos (goalId, userId, amount requerido y > 0)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Obtener la meta
    const { data: goalData, error: gError } = await admin
      .from("savings_goals")
      .select("*")
      .eq("id", goalId)
      .maybeSingle();

    if (gError || !goalData) {
      return NextResponse.json(
        { error: "No se encontro la meta solicitada" },
        { status: 404 }
      );
    }

    // 2. Asegurar que el perfil del usuario aportante exista
    await admin.from("profiles").upsert(
      { id: userId, display_name: "Usuario", currency: "ARS" },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // 3. Buscar o insertar en goal_members
    const { data: existingMember } = await admin
      .from("goal_members")
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      const newMemberAmount = (Number(existingMember.contributed_amount) || 0) + amount;
      await admin
        .from("goal_members")
        .update({ contributed_amount: newMemberAmount })
        .eq("id", existingMember.id);
    } else {
      await admin.from("goal_members").insert({
        goal_id: goalId,
        user_id: userId,
        contributed_amount: amount,
      });
    }

    // 4. Recalcular total exacto de todos los miembros
    const { data: allMembers } = await admin
      .from("goal_members")
      .select("*")
      .eq("goal_id", goalId);

    const totalContributed = (allMembers || []).reduce(
      (sum, m) => sum + (Number(m.contributed_amount) || 0),
      0
    );

    // Actualizar current_amount en savings_goals
    await admin
      .from("savings_goals")
      .update({ current_amount: totalContributed })
      .eq("id", goalId);

    // 5. Obtener nombres de perfiles
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

    const updatedGoal: SavingsGoal = {
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

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
    });
  } catch (error: any) {
    console.error("Error in /api/goals/contribute:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar aporte a la meta" },
      { status: 500 }
    );
  }
}
