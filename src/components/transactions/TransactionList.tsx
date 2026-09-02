"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatRelativeDate } from "@/lib/formatters/date";
import { LABELS } from "@/constants/labels";
import {
  Coffee,
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Tv,
  HeartPulse,
  PartyPopper,
  Shirt,
  AlertCircle,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Trash2,
  Calendar,
} from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "ant">("all");

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "cafe_kiosco":
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case "delivery_comida":
        return <UtensilsCrossed className="w-4 h-4 text-orange-400" />;
      case "supermercado":
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case "transporte_movilidad":
        return <Car className="w-4 h-4 text-blue-400" />;
      case "vivienda_servicios":
        return <Home className="w-4 h-4 text-indigo-400" />;
      case "suscripciones_digitales":
        return <Tv className="w-4 h-4 text-purple-400" />;
      case "salud_cuidado":
        return <HeartPulse className="w-4 h-4 text-pink-400" />;
      case "ocio_salidas":
        return <PartyPopper className="w-4 h-4 text-rose-400" />;
      case "compras_ropa":
        return <Shirt className="w-4 h-4 text-cyan-400" />;
      case "salario":
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case "freelance_honorarios":
        return <Laptop className="w-4 h-4 text-cyan-400" />;
      case "inversiones_rendimientos":
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <Coins className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "expense") return t.type === "expense";
    if (filterType === "income") return t.type === "income";
    if (filterType === "ant") return t.isAntExpense;
    return true;
  });

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      {/* Header & Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {LABELS.dashboard.recentTransactions}
          </h3>
          <span className="text-xs text-slate-400">
            {filteredTransactions.length} movimiento(s) registrado(s)
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
              filterType === "all"
                ? "bg-slate-800 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType("expense")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
              filterType === "expense"
                ? "bg-rose-500/20 text-rose-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setFilterType("income")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
              filterType === "income"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType("ant")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
              filterType === "ant"
                ? "bg-amber-500/20 text-amber-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Hormiga 🐜
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-800/60">
        {filteredTransactions.map((tx) => (
          <div
            key={tx.id}
            className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-850/40 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                {getCategoryIcon(tx.category)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">
                    {tx.description}
                  </span>

                  {tx.isAntExpense && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                      🐜 Hormiga
                    </span>
                  )}

                  {tx.installmentsTotal > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                      Cuota {tx.installmentCurrent}/{tx.installmentsTotal}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{formatRelativeDate(tx.transactedAt)}</span>
                  {tx.accountName && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">{tx.accountName}</span>
                    </>
                  )}
                  {tx.notes && (
                    <>
                      <span>•</span>
                      <span className="italic text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                        &quot;{tx.notes}&quot;
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span
                  className={`text-sm font-bold font-mono ${
                    tx.type === "income"
                      ? "text-emerald-400"
                      : tx.type === "saving_transfer"
                      ? "text-cyan-400"
                      : "text-rose-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>

              <button
                onClick={() => onDeleteTransaction(tx.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Eliminar movimiento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            {LABELS.dashboard.noTransactionsYet}
          </div>
        )}
      </div>
    </div>
  );
};
