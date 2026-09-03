/**
 * Motor de Interpretación de Lenguaje Natural (IA Heurística + LLM)
 * Extrae monto, categoría, comercio, medio de pago, cuotas, fechas relativas y clasificador de gasto hormiga.
 */
import { ParsedTransactionResult, TransactionType } from "@/types";
import { CATEGORIES } from "@/constants/categories";

const ANT_EXPENSE_KEYWORDS = [
  "café", "cafe", "cafecito", "kiosco", "quiosco", "alfajor", "chicle",
  "golosina", "chocolatada", "snack", "gaseosa", "coca", "pepsi", "papas",
  "delivery", "pedidosya", "rappi", "helado", "antojo", "cerveza al paso",
  "cigarrillos", "puchos", "frapuccino", "starbucks"
];

const INCOME_KEYWORDS = [
  "sueldo", "salario", "cobré", "cobre", "pago de cliente", "honorarios",
  "transferencia recibida", "dividendo", "rendimiento", "venta", "regalo"
];

const SAVING_KEYWORDS = [
  "ahorro", "ahorre", "ahorré", "guardé", "guarde", "meta", "vacaciones",
  "fondo", "alcancia", "aparté", "deposito para"
];

const INSTALLMENT_REGEX = /(?:en\s+)?(\d{1,2})\s*(?:cuotas?|pagos?)/i;

export function parseTransactionTextLocally(rawText: string): ParsedTransactionResult {
  const clean = rawText.trim().toLowerCase();

  // 1. Detección de Cuotas
  let installmentsTotal = 1;
  const installmentMatch = clean.match(INSTALLMENT_REGEX);
  if (installmentMatch && installmentMatch[1]) {
    installmentsTotal = parseInt(installmentMatch[1], 10) || 1;
  }

  // 2. Detección de Fecha Relativa ("ayer", "anteayer", "hace X días")
  let dateSuggestion: string | undefined = undefined;
  const today = new Date();

  if (clean.includes("anteayer") || clean.includes("antes de ayer")) {
    const d = new Date();
    d.setDate(today.getDate() - 2);
    dateSuggestion = d.toISOString().split("T")[0];
  } else if (clean.includes("ayer")) {
    const d = new Date();
    d.setDate(today.getDate() - 1);
    dateSuggestion = d.toISOString().split("T")[0];
  } else {
    const daysAgoMatch = clean.match(/hace\s+(\d{1,2})\s+d[ií]as/);
    if (daysAgoMatch && daysAgoMatch[1]) {
      const days = parseInt(daysAgoMatch[1], 10);
      if (days > 0 && days < 60) {
        const d = new Date();
        d.setDate(today.getDate() - days);
        dateSuggestion = d.toISOString().split("T")[0];
      }
    }
  }

  // 3. Detección de Monto
  let amount = 0;
  const numbers = clean.match(/\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?/g);
  if (numbers && numbers.length > 0) {
    for (const numStr of numbers) {
      const parsedNum = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
      if (parsedNum !== installmentsTotal && parsedNum > 0) {
        amount = parsedNum;
        break;
      }
    }
    if (amount === 0 && numbers[0]) {
      amount = parseFloat(numbers[0].replace(/\./g, "").replace(",", "."));
    }
  }

  // 4. Detección de Tipo (Ingreso vs Gasto vs Ahorro a Meta)
  const isSaving = SAVING_KEYWORDS.some((kw) => clean.includes(kw));
  const isIncome = !isSaving && INCOME_KEYWORDS.some((kw) => clean.includes(kw));
  
  let type: TransactionType = "expense";
  if (isSaving) {
    type = "saving_transfer";
  } else if (isIncome) {
    type = "income";
  }

  // 5. Detección de Gasto Hormiga
  const isAntExpense = type === "expense" && ANT_EXPENSE_KEYWORDS.some((kw) => clean.includes(kw));

  // 6. Asignación de Categoría Inteligente
  let matchedCategory = type === "income" ? "salario" : type === "saving_transfer" ? "otros_ingresos" : "imprevistos";

  if (type === "income") {
    if (clean.includes("honorario") || clean.includes("cliente") || clean.includes("freelance")) {
      matchedCategory = "freelance_honorarios";
    } else if (clean.includes("inversi") || clean.includes("dividendo") || clean.includes("interes")) {
      matchedCategory = "inversiones_rendimientos";
    } else {
      matchedCategory = "salario";
    }
  } else if (type === "expense") {
    if (isAntExpense) {
      if (clean.includes("delivery") || clean.includes("rappi") || clean.includes("pedidosya") || clean.includes("helado")) {
        matchedCategory = "delivery_comida";
      } else {
        matchedCategory = "cafe_kiosco";
      }
    } else if (clean.includes("uber") || clean.includes("cabify") || clean.includes("nafta") || clean.includes("combustible") || clean.includes("sube") || clean.includes("peaje")) {
      matchedCategory = "transporte_movilidad";
    } else if (clean.includes("super") || clean.includes("coto") || clean.includes("carrefour") || clean.includes("dia") || clean.includes("verduleria") || clean.includes("almacen")) {
      matchedCategory = "supermercado";
    } else if (clean.includes("alquiler") || clean.includes("luz") || clean.includes("gas") || clean.includes("internet") || clean.includes("expensas")) {
      matchedCategory = "vivienda_servicios";
    } else if (clean.includes("netflix") || clean.includes("spotify") || clean.includes("disney") || clean.includes("gym") || clean.includes("gimnasio")) {
      matchedCategory = "suscripciones_digitales";
    } else if (clean.includes("farmacia") || clean.includes("medico") || clean.includes("dentista") || clean.includes("remedio")) {
      matchedCategory = "salud_cuidado";
    } else if (clean.includes("cena") || clean.includes("almuerzo") || clean.includes("bar") || clean.includes("cerveza") || clean.includes("cine") || clean.includes("salida")) {
      matchedCategory = "ocio_salidas";
    } else if (clean.includes("ropa") || clean.includes("zapatilla") || clean.includes("remera") || clean.includes("pantalon") || clean.includes("compra")) {
      matchedCategory = "compras_ropa";
    }
  }

  // 7. Sugerencia de Medio de Pago
  let accountSuggestion: string | undefined = undefined;
  if (clean.includes("efectivo") || clean.includes("cash")) {
    accountSuggestion = "Efectivo";
  } else if (clean.includes("mercadopago") || clean.includes("mercado pago") || clean.includes("mp")) {
    accountSuggestion = "MercadoPago";
  } else if (clean.includes("debito") || clean.includes("débito")) {
    accountSuggestion = "Tarjeta Débito";
  } else if (clean.includes("visa") || clean.includes("master") || clean.includes("credito") || clean.includes("crédito")) {
    accountSuggestion = "Tarjeta Crédito";
  }

  // 8. Descripción Limpia (removiendo términos de fecha y cuotas)
  let description = rawText;
  const words = rawText
    .split(/\s+/)
    .filter(
      (w) =>
        !w.match(/^\d+$/) &&
        !w.toLowerCase().includes("cuota") &&
        !["ayer", "anteayer", "hoy", "hace"].includes(w.toLowerCase())
    );
  if (words.length > 0) {
    description = words.slice(0, 4).join(" ");
  }

  return {
    amount,
    type,
    category: matchedCategory,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    isAntExpense,
    accountSuggestion,
    dateSuggestion,
    installmentsTotal,
    confidence: amount > 0 ? 0.88 : 0.4,
    rawText,
  };
}
