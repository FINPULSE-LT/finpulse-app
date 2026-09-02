"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { KEYBOARD_SHORTCUTS } from "@/constants/shortcuts";
import { Command, Search } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atajos de Teclado Rápidos"
      subtitle="Navega y registra gastos a la velocidad de la luz sin tocar el mouse"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar atajo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 pr-1">
          {filteredShortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="py-2.5 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Command className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-slate-300">{shortcut.description}</span>
              </div>
              <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono font-bold text-brand-300 shadow-inner">
                {shortcut.label}
              </kbd>
            </div>
          ))}

          {filteredShortcuts.length === 0 && (
            <p className="text-center py-6 text-xs text-slate-500">
              No se encontraron atajos para &quot;{searchTerm}&quot;.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
