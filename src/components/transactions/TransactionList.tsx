"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatRelativeDate } from "@/lib/formatters/date";
import { useHaptics } from "@/hooks/useHaptics";
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
  Target,
} from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "saving" | "ant">("all");
  const { hapticTap, hapticWarning } = useHaptics();

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "cafe_kiosco":
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case "delivery_comida":
        return <UtensilsCrossed className="w-4 h-4 text-orange-400" />;
      case "supermercado":
        return <ShoppingCart className="w-4 h-4 text-[#00F5A0]" />;
      case "transporte_movilidad":
        return <Car className="w-4 h-4 text-sky-400" />;
      case "vivienda_servicios":
        return <Home className="w-4 h-4 text-blue-400" />;
      case "suscripciones_digitales":
        return <Tv className="w-4 h-4 text-indigo-400" />;
      case "salud_cuidado":
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case "ocio_salidas":
        return <PartyPopper className="w-4 h-4 text-pink-400" />;
      case "compras_ropa":
        return <Shirt className="w-4 h-4 text-violet-400" />;
      case "salario":
        return <Briefcase className="w-4 h-4 text-[#00F5A0]" />;
      case "freelance_honorarios":
        return <Laptop className="w-4 h-4 text-emerald-400" />;
      case "inversiones_rendimientos":
        return <TrendingUp className="w-4 h-4 text-teal-400" />;
      case "otros_ingresos":
        return <Coins className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "expense") return tx.type === "expense";
    if (filterType === "income") return tx.type === "income";
    if (filterType === "saving") return tx.type === "saving_transfer";
    if (filterType === "ant") return tx.isAntExpense;
    return true;
  });

  return (
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-slate-800/80">
      {/* Encabezado y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/70">
        <div>
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] shadow-[0_0_10px_#00F5A0]" />
            {LABELS.dashboard.recentTransactions}
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Historial de movimientos con categorización y metas en tiempo real
          </p>
        </div>

        {/* Botonera de Filtros con Código de Color */}
        <div className="flex items-center gap-1.5 flex-wrap bg-[#070A12] p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              hapticTap();
              setFilterType("all");
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterType === "all"
                ? "bg-slate-200 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              hapticTap();
              setFilterType("expense");
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterType === "expense"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => {
              hapticTap();
              setFilterType("income");
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterType === "income"
                ? "bg-[#00F5A0] text-slate-950 shadow-md shadow-[#00F5A0]/25"
                : "text-slate-400 hover:text-[#00F5A0]"
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => {
              hapticTap();
              setFilterType("saving");
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === "saving"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-slate-400 hover:text-purple-400"
            }`}
          >
            <Target className="w-3 h-3 text-purple-400" />
            <span>Ahorros</span>
          </button>
          <button
            onClick={() => {
              hapticTap();
              setFilterType("ant");
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === "ant"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                : "text-slate-400 hover:text-amber-400"
            }`}
          >
            <span>🐜 Hormiga</span>
          </button>
        </div>
      </div>

      {/* Listado de Transacciones */}
      <div className="divide-y divide-slate-800/60">
        {filteredTransactions.map((tx) => (
          <div
            key={tx.id}
            className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-850/50 px-2 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#090D18] border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                {getCategoryIcon(tx.category)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {tx.description}
                  </span>

                  {/* Badge de Meta Asignada (UX-03 Solucionado) */}
                  {tx.goalTitle && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Target className="w-3 h-3 text-purple-400" />
                      {tx.goalTitle}
                    </span>
                  )}

                  {tx.isAntExpense && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      🐜 Hormiga
                    </span>
                  )}

                  {tx.installmentsTotal > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold font-mono">
                      Cuota {tx.installmentCurrent}/{tx.installmentsTotal}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono text-slate-400">{formatRelativeDate(tx.transactedAt)}</span>
                  {tx.accountName && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{tx.accountName}</span>
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
                  className={`text-sm font-black font-mono tracking-tight ${
                    tx.type === "income"
                      ? "text-[#00F5A0]"
                      : tx.type === "saving_transfer"
                      ? "text-purple-400"
                      : "text-rose-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>

              <button
                onClick={() => {
                  hapticWarning();
                  onDeleteTransaction(tx.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all"
                title="Eliminar movimiento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-400">Sin movimientos para este filtro</p>
            <p>{LABELS.dashboard.noTransactionsYet}</p>
          </div>
        )}
      </div>
    </div>
  );
};
