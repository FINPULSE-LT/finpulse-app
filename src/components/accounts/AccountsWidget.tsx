"use client";

import React, { useState } from "react";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { LABELS } from "@/constants/labels";
import { CreditCard, Wallet, Landmark, Banknote, Plus, Calendar, Clock } from "lucide-react";

interface AccountsWidgetProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, "id" | "userId">) => void;
}

export const AccountsWidget: React.FC<AccountsWidgetProps> = ({
  accounts,
  onAddAccount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<Account["accountType"]>("bank");
  const [balance, setBalance] = useState("");
  const [closingDay, setClosingDay] = useState("20");
  const [dueDay, setDueDay] = useState("30");
  const [colorHex, setColorHex] = useState("#10b981");

  const getAccountIcon = (type: Account["accountType"]) => {
    switch (type) {
      case "credit_card":
        return <CreditCard className="w-5 h-5 text-cyan-400" />;
      case "wallet":
        return <Wallet className="w-5 h-5 text-purple-400" />;
      case "cash":
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      default:
        return <Landmark className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddAccount({
      name: name.trim(),
      accountType,
      balance: parseFloat(balance) || 0,
      closingDay: accountType === "credit_card" ? parseInt(closingDay, 10) : undefined,
      dueDay: accountType === "credit_card" ? parseInt(dueDay, 10) : undefined,
      colorHex,
    });

    setIsAdding(false);
    setName("");
    setBalance("");
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {LABELS.nav.accounts}
          </h3>
          <span className="text-xs text-slate-400">
            Saldos, billeteras y tarjetas con ciclo de corte
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva cuenta</span>
        </button>
      </div>

      {/* Formulario Rápido de Nueva Cuenta */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej: Galicia Débito, MP..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Tipo</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="bank">Banco / Caja de Ahorro</option>
                <option value="wallet">Billetera Virtual (MP, Ualá)</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Saldo Inicial</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {accountType === "credit_card" && (
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Día de Cierre de Resumen</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Día de Vencimiento de Pago</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Guardar Cuenta
            </button>
          </div>
        </form>
      )}

      {/* Grid de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc) => {
          const isCard = acc.accountType === "credit_card";
          return (
            <div
              key={acc.id}
              className={`p-4 rounded-xl border transition-all ${
                isCard
                  ? "bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border-cyan-500/30"
                  : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {getAccountIcon(acc.accountType)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{acc.name}</h4>
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {isCard ? "Tarjeta de Crédito" : acc.accountType}
                    </span>
                  </div>
                </div>

                <span className="text-sm font-bold font-mono text-white">
                  {formatCurrency(acc.balance)}
                </span>
              </div>

              {isCard && acc.closingDay && (
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Cierra: día {acc.closingDay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Vence: día {acc.dueDay || 30}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
