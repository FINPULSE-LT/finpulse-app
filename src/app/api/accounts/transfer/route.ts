import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/serverAdmin";
import { Account, Transaction } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fromAccountId, toAccountId, amount, transactedAt, notes } = body;

    const numAmount = Number(amount);
    if (!userId || !fromAccountId || !toAccountId || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Parametros requeridos: userId, fromAccountId, toAccountId, amount > 0" },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: "La cuenta de origen y destino deben ser distintas" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Obtener ambas cuentas
    const { data: accounts, error: accError } = await admin
      .from("accounts")
      .select("*")
      .in("id", [fromAccountId, toAccountId])
      .eq("user_id", userId);

    if (accError || !accounts || accounts.length < 2) {
      return NextResponse.json(
        { error: "No se encontraron ambas cuentas asociadas al usuario" },
        { status: 404 }
      );
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);

    if (!fromAcc || !toAcc) {
      return NextResponse.json(
        { error: "Cuentas no validas para transferencia" },
        { status: 400 }
      );
    }

    // 2. Actualizar saldos
    const newFromBalance = (Number(fromAcc.balance) || 0) - numAmount;
    const newToBalance = (Number(toAcc.balance) || 0) + numAmount;

    await admin.from("accounts").update({ balance: newFromBalance }).eq("id", fromAccountId);
    await admin.from("accounts").update({ balance: newToBalance }).eq("id", toAccountId);

    const finalDate = transactedAt || new Date().toISOString();

    // 3. Crear transacciones de salida e ingreso
    const { data: txOut } = await admin
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: fromAccountId,
        type: "expense",
        amount: numAmount,
        category: "otros_ingresos",
        description: `Transferencia enviada a ${toAcc.name}`,
        notes: notes || "Transferencia entre cuentas propias",
        is_ant_expense: false,
        installments_total: 1,
        installment_current: 1,
        transacted_at: finalDate,
      })
      .select()
      .single();

    const { data: txIn } = await admin
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: toAccountId,
        type: "income",
        amount: numAmount,
        category: "otros_ingresos",
        description: `Transferencia recibida de ${fromAcc.name}`,
        notes: notes || "Transferencia entre cuentas propias",
        is_ant_expense: false,
        installments_total: 1,
        installment_current: 1,
        transacted_at: finalDate,
      })
      .select()
      .single();

    const updatedFromAccount: Account = {
      id: fromAcc.id,
      userId: fromAcc.user_id,
      name: fromAcc.name,
      accountType: fromAcc.account_type,
      balance: newFromBalance,
      closingDay: fromAcc.closing_day || undefined,
      dueDay: fromAcc.due_day || undefined,
      colorHex: fromAcc.color_hex || "#10b981",
      cardNetwork: fromAcc.card_network || undefined,
      lastFourDigits: fromAcc.last_four_digits || undefined,
      createdAt: fromAcc.created_at,
    };

    const updatedToAccount: Account = {
      id: toAcc.id,
      userId: toAcc.user_id,
      name: toAcc.name,
      accountType: toAcc.account_type,
      balance: newToBalance,
      closingDay: toAcc.closing_day || undefined,
      dueDay: toAcc.due_day || undefined,
      colorHex: toAcc.color_hex || "#10b981",
      cardNetwork: toAcc.card_network || undefined,
      lastFourDigits: toAcc.last_four_digits || undefined,
      createdAt: toAcc.created_at,
    };

    const transactionsCreated: Transaction[] = [];
    if (txOut) {
      transactionsCreated.push({
        id: txOut.id,
        userId: txOut.user_id,
        accountId: txOut.account_id,
        accountName: fromAcc.name,
        type: txOut.type,
        amount: Number(txOut.amount),
        category: txOut.category,
        description: txOut.description,
        notes: txOut.notes,
        isAntExpense: false,
        installmentsTotal: 1,
        installmentCurrent: 1,
        transactedAt: txOut.transacted_at,
      });
    }

    if (txIn) {
      transactionsCreated.push({
        id: txIn.id,
        userId: txIn.user_id,
        accountId: txIn.account_id,
        accountName: toAcc.name,
        type: txIn.type,
        amount: Number(txIn.amount),
        category: txIn.category,
        description: txIn.description,
        notes: txIn.notes,
        isAntExpense: false,
        installmentsTotal: 1,
        installmentCurrent: 1,
        transactedAt: txIn.transacted_at,
      });
    }

    return NextResponse.json({
      success: true,
      fromAccount: updatedFromAccount,
      toAccount: updatedToAccount,
      transactions: transactionsCreated,
    });
  } catch (err: any) {
    console.error("Error in POST /api/accounts/transfer:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
