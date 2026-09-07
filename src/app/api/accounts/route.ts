import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { Account } from "@/types";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, accountId, name, accountType, balance, colorHex, closingDay, dueDay } = body;

    if (!userId || !accountId || !name) {
      return NextResponse.json(
        { error: "Parametros requeridos: userId, accountId, name" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: updated, error } = await admin
      .from("accounts")
      .update({
        name: name.trim(),
        account_type: accountType,
        balance: Number(balance) || 0,
        color_hex: colorHex || "#10b981",
        closing_day: closingDay || null,
        due_day: dueDay || null,
      })
      .eq("id", accountId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message || "No se pudo actualizar la cuenta" },
        { status: 500 }
      );
    }

    const account: Account = {
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      accountType: updated.account_type,
      balance: Number(updated.balance) || 0,
      closingDay: updated.closing_day || undefined,
      dueDay: updated.due_day || undefined,
      colorHex: updated.color_hex || "#10b981",
      cardNetwork: updated.card_network || undefined,
      lastFourDigits: updated.last_four_digits || undefined,
      createdAt: updated.created_at,
    };

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    console.error("Error in PATCH /api/accounts:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const accountId = searchParams.get("accountId");

    if (!userId || !accountId) {
      return NextResponse.json(
        { error: "Parametros requeridos: userId, accountId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Desvincular movimientos para no romper el historial de transacciones
    await admin
      .from("transactions")
      .update({ account_id: null })
      .eq("account_id", accountId)
      .eq("user_id", userId);

    // 2. Eliminar cuenta
    const { error: delErr } = await admin
      .from("accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/accounts:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
