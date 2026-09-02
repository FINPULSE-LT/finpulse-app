/**
 * Atajos de Teclado Centralizados de FinPulse
 * Editar aquí para cambiar teclas o agregar atajos sin afectar la lógica de las vistas.
 */
export interface ShortcutDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  category: "navigation" | "actions" | "modals";
  ctrlOrCmd?: boolean;
  shift?: boolean;
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  // Acciones Rápidas
  {
    id: "quick_input",
    key: "/",
    label: "/",
    description: "Enfocar barra de registro rápido de texto",
    category: "actions",
  },
  {
    id: "new_transaction",
    key: "n",
    label: "N",
    description: "Abrir modal de nuevo movimiento",
    category: "actions",
  },
  {
    id: "voice_record",
    key: "v",
    label: "V",
    description: "Iniciar / Detener grabación de audio",
    category: "actions",
  },

  // Navegación
  {
    id: "nav_dashboard",
    key: "1",
    label: "Alt + 1",
    description: "Ir al Panel Principal (Dashboard)",
    category: "navigation",
  },
  {
    id: "nav_transactions",
    key: "2",
    label: "Alt + 2",
    description: "Ir a Movimientos",
    category: "navigation",
  },
  {
    id: "nav_accounts",
    key: "3",
    label: "Alt + 3",
    description: "Ir a Cuentas y Tarjetas",
    category: "navigation",
  },
  {
    id: "nav_goals",
    key: "4",
    label: "Alt + 4",
    description: "Ir a Metas de Ahorro",
    category: "navigation",
  },
  {
    id: "nav_reports",
    key: "5",
    label: "Alt + 5",
    description: "Ir a Reportes & Gráficos",
    category: "navigation",
  },

  // Modales
  {
    id: "close_modal",
    key: "Escape",
    label: "Esc",
    description: "Cerrar modal o ventana emergente activa",
    category: "modals",
  },
];
