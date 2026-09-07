import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { SavingsGoal, GoalMember } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, inviteCodeOrGoalId } = body;

    if (!userId || !inviteCodeOrGoalId) {
      return NextResponse.json(
        { error: "Faltan parametros requeridos (userId, inviteCodeOrGoalId)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const raw = String(inviteCodeOrGoalId).trim();
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
      const { data: found } = await admin
        .from("savings_goals")
        .select("id")
        .eq("invite_code", cleanCode)
        .maybeSingle();

      if (found) {
        goalId = found.id;
      }
    }

    if (!goalId) {
      return NextResponse.json(
        { error: "No se encontro ninguna meta con ese codigo de invitacion" },
        { status: 404 }
      );
    }

    // Asegurar perfil
    await admin.from("profiles").upsert(
      { id: userId, display_name: "Usuario", currency: "ARS" },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // Buscar si ya es miembro
    const { data: existingMember } = await admin
      .from("goal_members")
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingMember) {
      await admin.from("goal_members").insert({
        goal_id: goalId,
        user_id: userId,
        contributed_amount: 0,
      });
    }

    // Recalcular y devolver meta
    const { data: goalData } = await admin
      .from("savings_goals")
      .select("*")
      .eq("id", goalId)
      .single();

    if (!goalData) {
      return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
    }

    const { data: allMembers } = await admin
      .from("goal_members")
      .select("*")
      .eq("goal_id", goalId);

    const totalContributed = (allMembers || []).reduce(
      (sum, m) => sum + (Number(m.contributed_amount) || 0),
      0
    );

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
      goal: parsedGoal,
    });
  } catch (error: any) {
    console.error("Error in /api/goals/join:", error);
    return NextResponse.json(
      { error: error.message || "Error al unirse a la meta" },
      { status: 500 }
    );
  }
}
