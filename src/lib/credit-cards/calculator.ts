/**
 * Motor de Cálculo para Tarjetas de Crédito y Cuotas
 * Resuelve la lógica de fechas de cierre, vencimiento y distribución de cuotas futuras.
 */

export interface StatementImpact {
  statementMonth: number; // 1-12
  statementYear: number;
  closingDate: Date;
  dueDate: Date;
  isNextCycle: boolean;
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  statementDueDate: string; // YYYY-MM-DD
  isUpcoming: boolean;
}

/**
 * Determina a qué ciclo de facturación pertenece una compra según su fecha y el día de cierre.
 */
export function calculateStatementCycle(
  purchaseDate: Date,
  closingDay: number = 20,
  dueDay: number = 30
): StatementImpact {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth(); // 0-11
  const day = purchaseDate.getDate();

  let statementMonth = month;
  let statementYear = year;
  let isNextCycle = false;

  // Si la compra se realiza después o en el día de cierre, pasa al resumen del mes siguiente
  if (day >= closingDay) {
    isNextCycle = true;
    statementMonth += 1;
    if (statementMonth > 11) {
      statementMonth = 0;
      statementYear += 1;
    }
  }

  // Fecha de cierre
  const closingDate = new Date(statementYear, statementMonth, closingDay);

  // Fecha de vencimiento (suele ser a fin de mes o primeros días del mes posterior al cierre)
  let dueMonth = statementMonth;
  let dueYear = statementYear;
  if (dueDay < closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }
  const dueDate = new Date(dueYear, dueMonth, dueDay);

  return {
    statementMonth: statementMonth + 1,
    statementYear,
    closingDate,
    dueDate,
    isNextCycle,
  };
}

/**
 * Genera el cronograma completo de cuotas distribuidas en los resúmenes correspondientes.
 */
export function generateInstallmentSchedule(
  totalAmount: number,
  installmentsCount: number = 1,
  purchaseDate: Date = new Date(),
  closingDay: number = 20,
  dueDay: number = 30
): InstallmentScheduleItem[] {
  if (installmentsCount <= 1) {
    const cycle = calculateStatementCycle(purchaseDate, closingDay, dueDay);
    return [
      {
        installmentNumber: 1,
        totalInstallments: 1,
        amount: totalAmount,
        statementDueDate: cycle.dueDate.toISOString().split("T")[0],
        isUpcoming: true,
      },
    ];
  }

  const installmentAmount = Math.round((totalAmount / installmentsCount) * 100) / 100;
  const schedule: InstallmentScheduleItem[] = [];

  const initialCycle = calculateStatementCycle(purchaseDate, closingDay, dueDay);

  for (let i = 0; i < installmentsCount; i++) {
    const cycleMonth = (initialCycle.statementMonth - 1 + i) % 12;
    const additionalYears = Math.floor((initialCycle.statementMonth - 1 + i) / 12);
    const cycleYear = initialCycle.statementYear + additionalYears;

    let dueMonth = cycleMonth;
    let dueYear = cycleYear;
    if (dueDay < closingDay) {
      dueMonth = (dueMonth + 1) % 12;
      if (dueMonth === 0) dueYear += 1;
    }

    const dueDate = new Date(dueYear, dueMonth, dueDay);

    schedule.push({
      installmentNumber: i + 1,
      totalInstallments: installmentsCount,
      amount: installmentAmount,
      statementDueDate: dueDate.toISOString().split("T")[0],
      isUpcoming: i === 0,
    });
  }

  return schedule;
}
