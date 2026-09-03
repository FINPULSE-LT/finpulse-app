"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Account, Transaction, TransactionType, SavingsGoal } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { LABELS } from "@/constants/labels";
import { calculateStatementCycle } from "@/lib/credit-cards/calculator";
import { formatDate } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { Calendar, CreditCard, Tag, FileText, Check, Target } from "lucide-react";

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  goals?: SavingsGoal[];
  onSave: (transaction: Omit<Transaction, "id" | "userId">) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  accounts,
  goals = [],
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("supermercado");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [isAntExpense, setIsAntExpense] = useState(false);
  const [installmentsTotal, setInstallmentsTotal] = useState(1);
  const [transactedAt, setTransactedAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isCreditCard = selectedAccount?.accountType === "credit_card";

  // Previsualización de impacto en resumen de tarjeta
  let statementForecast = "";
  if (isCreditCard && selectedAccount) {
    const cycle = calculateStatementCycle(
      new Date(transactedAt),
      selectedAccount.closingDay || 20,
      selectedAccount.dueDay || 30
    );
    statementForecast = `Cierre de resumen: ${formatDate(cycle.closingDate)} | Vence: ${formatDate(cycle.dueDate)}`;
  }

  const setShortcutDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setTransactedAt(d.toISOString().split("T")[0]);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const chosenGoal = goals.find((g) => g.id === goalId);

    onSave({
      type,
      amount: numAmount,
      description: description || (type === "expense" ? "Gasto general" : type === "saving_transfer" ? "Aporte a meta" : "Ingreso general"),
      category: type === "saving_transfer" ? "otros_ingresos" : category,
      accountId: accountId || undefined,
      goalId: type === "saving_transfer" ? goalId : undefined,
      goalTitle: type === "saving_transfer" && chosenGoal ? chosenGoal.title : undefined,
      notes: notes || undefined,
      isAntExpense: type === "expense" ? isAntExpense : false,
      installmentsTotal: isCreditCard ? installmentsTotal : 1,
      installmentCurrent: 1,
      statementDate: isCreditCard && statementForecast ? new Date(transactedAt).toISOString() : undefined,
      transactedAt: new Date(transactedAt).toISOString(),
    });

    onClose();
    // Reset
    setAmount("");
    setDescription("");
    setNotes("");
    setIsAntExpense(false);
    setInstallmentsTotal(1);
    setTransactedAt(todayStr);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Movimiento Detallado"
      subtitle="Gestiona con precisión cuentas, fechas, cuotas y asignación a metas"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Tipo */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "expense"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "income"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType("saving_transfer")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "saving_transfer"
                ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Aporte Ahorro
          </button>
        </div>

        {/* Monto y Selector de Fecha Completo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
              Monto ($) *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Fecha del Registro
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShortcutDate(0)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    transactedAt === todayStr
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutDate(1)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    transactedAt === yesterdayStr
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Ayer
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={transactedAt}
              onChange={(e) => setTransactedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Sección Especial: Si es Aporte de Ahorro, Seleccionar Meta */}
        {type === "saving_transfer" && (
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 animate-in fade-in">
            <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              Seleccionar Meta de Ahorro Destino:
            </label>
            {goals.length > 0 ? (
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title} — Actual: {formatCurrency(g.currentAmount)} / Objetivo: {formatCurrency(g.targetAmount)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-300">
                No tienes metas activas aún. Se registrará como un ahorro general.
              </p>
            )}
          </div>
        )}

        {/* Descripción y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
              Descripción / Comercio *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Coto, Nafta, Restaurante..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={type === "saving_transfer"}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            >
              {CATEGORIES.filter((c) => (type === "income" ? c.type === "income" : c.type === "expense")).map(
                (cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Medio de Pago / Cuenta */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            Medio de Pago / Cuenta
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.accountType === "credit_card" ? "Tarjeta de Crédito" : acc.accountType})
              </option>
            ))}
          </select>
        </div>

        {/* Sección Especial: Tarjetas de Crédito y Cuotas */}
        {isCreditCard && type === "expense" && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">Plan de Cuotas:</span>
              <div className="flex items-center gap-1.5">
                {[1, 3, 6, 12, 18].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setInstallmentsTotal(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      installmentsTotal === num
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {num} cuotas
                  </button>
                ))}
              </div>
            </div>
            {statementForecast && (
              <p className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/50">
                🗓️ {statementForecast}
              </p>
            )}
          </div>
        )}

        {/* Checkbox de Gasto Hormiga */}
        {type === "expense" && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="isAntExpenseCheck"
              checked={isAntExpense}
              onChange={(e) => setIsAntExpense(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isAntExpenseCheck" className="text-xs text-slate-300 select-none cursor-pointer">
              {LABELS.streaks.antExpenseCheckbox}
            </label>
          </div>
        )}

        {/* Observaciones y Notas */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observaciones Adicionales
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas sobre qué compraste, con quién estabas, o detalles del pago..."
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            {LABELS.actions.cancel}
          </Button>
          <Button variant="primary" size="sm" type="submit" leftIcon={<Check className="w-4 h-4" />}>
            {LABELS.actions.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
