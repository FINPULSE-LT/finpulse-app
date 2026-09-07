import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { SavingsGoal, GoalMember } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, goalId, title, targetAmount, targetDate, isCollaborative, memberContributions } = body;

    if (!userId || !goalId || !title || !targetAmount) {
      return NextResponse.json(
        { error: "Parametros requeridos: userId, goalId, title, targetAmount" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Actualizar datos base de la meta
    const { data: updatedGoalData, error: goalErr } = await admin
      .from("savings_goals")
      .update({
        title: title.trim(),
        target_amount: Number(targetAmount),
        target_date: targetDate || null,
        is_collaborative: isCollaborative ?? false,
      })
      .eq("id", goalId)
      .select()
      .single();

    if (goalErr || !updatedGoalData) {
      return NextResponse.json({ error: goalErr?.message || "Error al actualizar meta" }, { status: 500 });
    }

    // 2. Si se pasaron ajustes de aportes para miembros
    if (Array.isArray(memberContributions) && memberContributions.length > 0) {
      for (const mc of memberContributions) {
        if (mc.userId && typeof mc.amount === "number") {
          await admin
            .from("goal_members")
            .update({ contributed_amount: Math.max(0, mc.amount) })
            .eq("goal_id", goalId)
            .eq("user_id", mc.userId);
        }
      }
    }

    // 3. Recalcular total acumulado de la meta
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

    // 4. Obtener nombres de perfiles
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

    const parsedGoal: SavingsGoal = {
      id: updatedGoalData.id,
      creatorId: updatedGoalData.creator_id,
      title: updatedGoalData.title,
      targetAmount: Number(updatedGoalData.target_amount),
      currentAmount: totalContributed,
      targetDate: updatedGoalData.target_date || undefined,
      isCollaborative: updatedGoalData.is_collaborative ?? false,
      inviteCode: updatedGoalData.invite_code || undefined,
      categoryIcon: updatedGoalData.category_icon || "Trophy",
      colorHex: updatedGoalData.color_hex || "#06b6d4",
      members,
      createdAt: updatedGoalData.created_at,
    };

    return NextResponse.json({ success: true, goal: parsedGoal });
  } catch (err: any) {
    console.error("Error in POST /api/goals/update:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
