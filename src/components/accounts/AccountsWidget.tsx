"use client";

import React, { useState } from "react";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { LABELS } from "@/constants/labels";
import { useHaptics } from "@/hooks/useHaptics";
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

  const { hapticTap, hapticSuccess } = useHaptics();

  const getAccountIcon = (type: Account["accountType"]) => {
    switch (type) {
      case "credit_card":
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
      case "wallet":
        return <Wallet className="w-4 h-4 text-purple-400" />;
      case "cash":
        return <Banknote className="w-4 h-4 text-[#00F5A0]" />;
      default:
        return <Landmark className="w-4 h-4 text-blue-400" />;
    }
  };

  const getAccountTypeLabel = (type: Account["accountType"]) => {
    switch (type) {
      case "credit_card":
        return "Crédito";
      case "wallet":
        return "Billetera";
      case "cash":
        return "Efectivo";
      default:
        return "Banco / Débito";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    hapticSuccess();
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
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-blue-500/25 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3B82F6]" />
            {LABELS.nav.accounts}
          </h3>
          <span className="text-xs text-slate-400">
            Saldos, billeteras y tarjetas con ciclo de corte
          </span>
        </div>

        <button
          onClick={() => {
            hapticTap();
            setIsAdding(!isAdding);
          }}
          className="p-1.5 px-3 rounded-xl bg-[#0E1526] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-[#00F5A0]" />
          <span>Nueva cuenta</span>
        </button>
      </div>

      {/* Formulario Rápido de Nueva Cuenta */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej: Galicia Débito, MP..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Tipo</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0]"
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
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F5A0]"
              />
            </div>
          </div>

          {accountType === "credit_card" && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Día de Cierre</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F5A0]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Día de Vencimiento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F5A0]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-slate-950 font-black text-xs shadow-md"
            >
              Guardar Cuenta
            </button>
          </div>
        </form>
      )}

      {/* Grid de Cuentas: Estructura Vertical Imposible de Colisionar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {accounts.map((acc) => {
          const isCard = acc.accountType === "credit_card";
          return (
            <div
              key={acc.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isCard
                  ? "bg-gradient-to-br from-[#0B1220] via-[#0E1729] to-[#0B1528] border-cyan-500/30 hover:border-cyan-400/60 shadow-md"
                  : "bg-[#070A12]/90 border-slate-800 hover:border-slate-700 shadow-sm"
              }`}
            >
              {/* Cabecera de la Tarjeta: Icono + Badge de Tipo */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#090D18] border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
                    {getAccountIcon(acc.accountType)}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-bold border border-slate-700/50">
                    {getAccountTypeLabel(acc.accountType)}
                  </span>
                </div>

                {acc.cardNetwork && (
                  <span className="text-[10px] uppercase font-mono font-black text-cyan-400 tracking-wider">
                    {acc.cardNetwork}
                  </span>
                )}
              </div>

              {/* Nombre de la Cuenta (Línea Dedicada sin Colisión) */}
              <div className="mt-3">
                <h4 className="text-sm font-black text-white tracking-tight truncate" title={acc.name}>
                  {acc.name}
                </h4>
              </div>

              {/* Saldo de la Cuenta (Fila Separada con Formato Claro) */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                  {isCard ? "Consumido:" : "Disponible:"}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
                  {formatCurrency(acc.balance)}
                </span>
              </div>

              {/* Fechas de Cierre / Vencimiento en Tarjetas de Crédito */}
              {isCard && acc.closingDay && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300/90">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    Cierra: día {acc.closingDay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
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
