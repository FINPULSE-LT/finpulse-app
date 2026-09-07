import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { SavingsGoal } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, goal } = body;

    if (!userId || !goal || !goal.title || !goal.targetAmount) {
      return NextResponse.json(
        { error: "Faltan parametros requeridos (userId, goal.title, goal.targetAmount)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Asegurar perfil
    await admin.from("profiles").upsert(
      { id: userId, display_name: "Usuario", currency: "ARS" },
      { onConflict: "id", ignoreDuplicates: true }
    );

    const initialAmount = Number(goal.currentAmount) || 0;

    const { data: created, error: createErr } = await admin
      .from("savings_goals")
      .insert({
        creator_id: userId,
        title: goal.title,
        target_amount: Number(goal.targetAmount),
        current_amount: initialAmount,
        target_date: goal.targetDate || null,
        is_collaborative: goal.isCollaborative ?? false,
        invite_code: goal.inviteCode || null,
        category_icon: goal.categoryIcon || "Trophy",
        color_hex: goal.colorHex || "#06b6d4",
      })
      .select()
      .single();

    if (createErr || !created) {
      return NextResponse.json(
        { error: createErr?.message || "Error al crear la meta en Supabase" },
        { status: 500 }
      );
    }

    // Registrar al creador en goal_members
    await admin.from("goal_members").insert({
      goal_id: created.id,
      user_id: userId,
      contributed_amount: initialAmount,
    });

    const newGoal: SavingsGoal = {
      id: created.id,
      creatorId: created.creator_id,
      title: created.title,
      targetAmount: Number(created.target_amount),
      currentAmount: initialAmount,
      targetDate: created.target_date || undefined,
      isCollaborative: created.is_collaborative ?? false,
      inviteCode: created.invite_code || undefined,
      categoryIcon: created.category_icon || "Trophy",
      colorHex: created.color_hex || "#06b6d4",
      members: [
        {
          id: `gm-${Date.now()}`,
          goalId: created.id,
          userId: userId,
          userName: "Tú (Creador)",
          contributedAmount: initialAmount,
          percentageContribution: 100,
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: created.created_at,
    };

    return NextResponse.json({
      success: true,
      goal: newGoal,
    });
  } catch (error: any) {
    console.error("Error in POST /api/goals/create:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la meta" },
      { status: 500 }
    );
  }
}
