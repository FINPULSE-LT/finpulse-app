/**
 * Diccionario Central de Etiquetas y Textos (Labels) de FinPulse
 * Todos los textos visibles en la interfaz provienen de aquí.
 * Editar cualquier texto aquí garantiza que nada en la lógica del código se rompa.
 */
export const LABELS = {
  // Navegación
  nav: {
    dashboard: "Panel Principal",
    transactions: "Movimientos",
    accounts: "Cuentas y Tarjetas",
    goals: "Metas de Ahorro",
    reports: "Reportes & Gráficos",
    settings: "Personalización",
    login: "Iniciar Sesión",
    logout: "Cerrar Sesión",
  },

  // Encabezados y Secciones del Dashboard
  dashboard: {
    welcome: "¡Hola de nuevo!",
    balanceTotal: "Balance Total Disponible",
    monthlyIncome: "Ingresos del Mes",
    monthlyExpense: "Gastos del Mes",
    monthlySavings: "Ahorro Neto",
    quickInputTitle: "Registro Inteligente Rápido",
    quickInputPlaceholder: "Ej: 'Almuerzo 12500 con Galicia débito' o 'Café 2500 efectivo'",
    voiceInputPrompt: "Presiona para hablar y decir tu gasto...",
    recentTransactions: "Últimos Movimientos",
    seeAll: "Ver todos",
    noTransactionsYet: "Aún no registraste movimientos este mes.",
  },

  // Módulo de Rachas y Gastos Hormiga
  streaks: {
    title: "Racha Libre de Gastos Hormiga",
    daysCount: (count: number) => `${count} ${count === 1 ? 'Día Limpio' : 'Días Limpios'}`,
    fireSubtitle: "¡Imparable! Cero fugas innecesarias de dinero.",
    rescuedTitle: "Dinero Rescatado Acumulado",
    rescuedSubtitle: "Lo que evitaste gastar en impulsos y sumaste a tu libertad financiera.",
    freezeAvailable: "Escudo protector mensual disponible",
    freezeUsed: "Escudo mensual utilizado este mes",
    antExpenseCheckbox: "¿Es un gasto hormiga? (antojos, café al paso, delivery innecesario)",
    antExpenseBadge: "Gasto Hormiga",
  },

  // Módulo de Tarjetas y Cuotas
  creditCards: {
    closingDateLabel: "Cierre de Resumen",
    dueDateLabel: "Vencimiento de Pago",
    installments: "Cuotas",
    installmentsCount: (current: number, total: number) => `Cuota ${current} de ${total}`,
    nextStatementForecast: "Estimación Próximo Resumen",
    statementDateInfo: "Impacta en el resumen que vence el",
    addCardButton: "Nueva Tarjeta de Crédito",
  },

  // Módulo de Metas y Colaboración
  goals: {
    title: "Tus Metas de Ahorro",
    newGoalButton: "Crear Nueva Meta",
    collaborativeBadge: "Meta Compartida",
    individualBadge: "Meta Individual",
    targetAmount: "Monto Objetivo",
    currentAmount: "Ahorro Actual",
    progress: (percent: number) => `${percent.toFixed(1)}% completado`,
    targetDate: "Fecha Límite Estimada",
    invitePartnerButton: "Invitar Pareja / Amigo",
    inviteCodeLabel: "Código de Invitación Único",
    copyCode: "Copiar Código",
    codeCopied: "¡Código copiado al portapapeles!",
    joinedMembers: "Participantes del Bote Común",
    contributeButton: "Aportar a esta Meta",
  },

  // Botones y Acciones Globales
  actions: {
    save: "Guardar Registro",
    saving: "Guardando...",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    filter: "Filtrar",
    exportPdf: "Descargar Reporte PDF",
    exportCsv: "Exportar a Excel / CSV",
    startVoice: "Grabar Audio",
    stopVoice: "Listo, Procesar",
    apply: "Aplicar",
    confirm: "Confirmar",
  },

  // Filtros de Reportes
  reports: {
    weekly: "Semana Actual",
    monthly: "Este Mes",
    yearly: "Anual",
    customRange: "Rango Personalizado",
    expensesByCategory: "Distribución por Categorías",
    incomeVsExpense: "Evolución de Ingresos vs Gastos",
    heatmapTitle: "Calendario de Intensidad de Gasto (Heatmap)",
    heatmapSubtitle: "Identifica en qué días de la semana tiendes a gastar más",
  },

  // Notificaciones & Feedback
  toasts: {
    transactionSaved: "¡Movimiento registrado con éxito!",
    transactionDeleted: "Movimiento eliminado.",
    accountCreated: "Cuenta configurada exitosamente.",
    goalUpdated: "Meta de ahorro actualizada.",
    errorGeneric: "Ocurrió un error inesperado. Inténtalo nuevamente.",
    voiceParsing: "Interpretando nota de voz con Inteligencia Artificial...",
    voiceParsedSuccess: "¡Audio interpretado correctamente!",
    voiceParseFailed: "No se pudo interpretar el audio. Puedes cargarlo manualmente.",
  },

  // Autenticación
  auth: {
    welcomeTitle: "Controla tu dinero sin esfuerzo",
    welcomeSubtitle: "Inicia sesión para sincronizar tus finanzas en la nube",
    googleSignIn: "Continuar con Google",
    emailSignIn: "Continuar con Email",
    emailPlaceholder: "tu@email.com",
    sendMagicLink: "Enviar Enlace de Acceso",
    secureNotice: "Tus datos están protegidos con encriptación Row-Level Security de Supabase.",
  }
} as const;

export type LabelsConfig = typeof LABELS;
