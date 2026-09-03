# 🏛️ Auditoría Exhaustiva de Calidad (QA) y UX Lead — FinPulse FinTech
**URL de Producción Evaluada:** [https://finpulse-app-theta.vercel.app](https://finpulse-app-theta.vercel.app)  
**Fecha de Auditoría:** 3 de Septiembre de 2026  
**Auditor:** QA & UX Lead Specialist (FinTech High-Performance Apps)  
**Estado General:** ✅ **Aprobado con Calificación Superior (9.2 / 10)** — *Excelente propuesta visual, fluidez de interacción y arquitectura sólida; con oportunidades clave de optimización en emparejamiento de cuentas, consistencia de filtros y respuesta háptica.*

---

## 1. Resumen Ejecutivo

FinPulse se presenta como una aplicación financiera personal de alta gama orientada a usuarios exigentes que buscan control granular sobre sus finanzas sin la fricción tradicional de los formularios extensos. El despliegue en Vercel demuestra una arquitectura moderna basada en Next.js (App Router), React 19, Tailwind CSS y persistencia dual (LocalStorage reactivo + Supabase RLS).

### Scorecard Global de Calidad:
| Dimensión | Puntuación | Estado | Observación Principal |
| :--- | :---: | :---: | :--- |
| **Estética & Visual (Obsidian Theme)** | **9.6 / 10** | 🟢 Sobresaliente | Modo oscuro profundo, contrastes precisos, micro-glows y tipografía financiera estricta. |
| **UX & Registro Cero Fricción** | **9.1 / 10** | 🟢 Excelente | Entrada predictiva en lenguaje natural con chips dinámicos inmediatos. |
| **Analítica & Reportes** | **8.9 / 10** | 🟡 Muy Bueno | 4 vistas temporales sólidas; la vista mensual requiere gráfico de tendencia. |
| **Resiliencia & Edge Cases** | **8.4 / 10** | 🟡 Bueno | Mapeo de tarjetas de crédito por nombre en el parser requiere normalización. |
| **Mobile & Háptica (PWA)** | **8.8 / 10** | 🟡 Muy Bueno | Bottom nav ágil; falta implementación de `navigator.vibrate` para feedback táctil. |

---

## 2. Evaluación Estética y Visual

### 2.1. Paleta Cromática y Modo Oscuro "Obsidian"
- **Fondo Base (`#06090e`):** El negro obsidiana profundo con sutiles gradientes radiales cian (`rgba(0, 242, 254, 0.08)`), esmeralda (`rgba(16, 185, 129, 0.08)`) y violeta en el fondo fixed proporciona una atmósfera inmersiva tipo terminal bancaria institucional o Bloomberg sin resultar estridente.
- **Glassmorphism de Alto Contraste (`.obsidian-panel`, `.obsidian-card`):** Se destaca el borde superior blanco con transparencia `rgba(255, 255, 255, 0.12)` y sombras invertidas `box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7)` que separan los paneles del fondo con claridad tridimensional.
- **Micro-interacciones y Glows:** El efecto `:hover` con elevación `translateY(-2px)` y acentuación en borde cian (`border-top-color: rgba(0, 242, 254, 0.3)`) transmite dinamismo y reactividad instantánea.

### 2.2. Tipografía y Jerarquía
- **Cifras Monetarias (`font-mono`):** Uso estricto de fuentes monoespaciadas para todos los montos (`$ 18.000,00`, `$ 25.000,00`), lo cual previene el salto visual ("jitter") cuando las cifras cambian o se comparan en columnas.
- **Legibilidad y Contraste WCAG 2.1:**
  - Textos principales (`#f8fafc` / `text-white`): Cumple estándar **WCAG AAA** sobre fondo `#06090e` (> 15:1).
  - Textos secundarios (`text-slate-400`): Cumple **WCAG AA** (> 4.8:1).
  - Indicadores semánticos: Verde esmeralda (`#34d399` / `#10b981`) para ingresos, cian (`#06b6d4`) para balances/ahorros, rosa (`#f43f5e`) para egresos, y ámbar (`#f59e0b`) para gastos hormiga.

### 2.3. Sistema de Badges
- Los badges redondeados (`🐜 Hormiga`, `Cuota 1/3`, `🎯 Vacaciones`, `📅 Ayer`) mantienen una escala visual coherente (`text-[10px]` o `text-xs`) con bordes semitransparentes que evitan la sobrecarga cognitiva.

### 2.4. Evaluación Háptica (Mobile Feedback)
- **Diagnóstico:** Se constató que **no existe integración con la API Háptica** (`navigator.vibrate`) en el código fuente. En dispositivos móviles, la confirmación de transacciones, la detección de voz y el festejo de ahorro con confetti carecen de respuesta táctil física, una característica clave en apps Fintech modernas (como Revolut, N26 o Lemon Cash).

---

## 3. Auditoría de la Barra Rápida de Registro (`QuickTransactionBar`)

### Prueba 3.1: Gasto con Fecha Relativa — `"Cena 18000 ayer con Visa"`
1. **Comportamiento Observado:**
   - **Monto detectado:** `$ 18.000,00` (Exacto).
   - **Tipo asignado:** `expense` (Gasto, color rosa).
   - **Categoría asignada:** `ocio_salidas` (Detectado por la palabra clave *"cena"*).
   - **Fecha detectada:** Reconoce *"ayer"* y calcula `today - 1 día`. La etiqueta del selector de fecha cambia a **`📅 Fecha: Ayer`** en color cian.
   - **Descripción resultante:** *"Cena con Visa"*.
2. **Hallazgo / Defecto Detectado en el Emparejamiento de Medio de Pago:**
   - En el archivo `src/lib/ai/parser.ts` (línea 134-136):
     ```ts
     } else if (clean.includes("visa") || clean.includes("master") || clean.includes("credito") || clean.includes("crédito")) {
       accountSuggestion = "Tarjeta Crédito";
     }
     ```
   - El parser devuelve la cadena genérica `"Tarjeta Crédito"`.
   - Luego, en `QuickTransactionBar.tsx` (líneas 62-65):
     ```ts
     const found = accounts.find((acc) =>
       acc.name.toLowerCase().includes(result.accountSuggestion!.toLowerCase()) ||
       acc.accountType.toLowerCase().includes(result.accountSuggestion!.toLowerCase())
     );
     ```
   - Dado que la cuenta configurada en los datos iniciales se llama `"Visa Santander"` y su tipo interno es `"credit_card"`, la búsqueda de `"tarjeta crédito"` **no coincide ni con el nombre ni con el tipo en inglés**.
   - **Consecuencia:** `found` resulta `undefined`, cayendo en el fallback que selecciona por defecto la primera cuenta (`Galicia Débito`), a pesar de que el usuario especificó claramente `"con Visa"`.

### Prueba 3.2: Ahorro Asignado a Meta — `"Ahorré 25000 para las vacaciones"`
1. **Comportamiento Observado:**
   - **Monto detectado:** `$ 25.000,00` (Exacto).
   - **Tipo asignado:** `saving_transfer` (Aporte a Meta de Ahorro, color cian).
   - **Categoría asignada:** `otros_ingresos`.
   - **Badge activado:** Aparece el chip identificador `🎯 Ahorro a Meta`.
   - **Selector de Meta:** Se despliega el contenedor interactivo `🎯 Asignar a Meta:` mostrando las metas disponibles (`🎯 Vacaciones Brasil 2027` y `🎯 Fondo de Emergencia 3 Meses`).
   - **Preselección:** Al no haber meta previa elegida, se preselecciona la primera (`goals[0].id`).
   - **Chips de Medio de Pago:** Se listan las cuentas disponibles para elegir la cuenta debitada.
   - **Al Confirmar:**
     - Se descuenta el balance de la cuenta bancaria.
     - Se incrementa el ahorro de la meta en `$ 25.000,00`.
     - Se activa la animación de festejo con partículas `canvas-confetti`.
2. **Oportunidades de Mejora UX:**
   - **Etiqueta en Ahorro:** Para egresos el texto *"Medio de pago:"* es correcto, pero cuando la transacción es de ahorro (`saving_transfer`), debería rotularse como *"Cuenta origen:"* o *"Debitar de:"*.
   - **Emparejamiento Inteligente de Metas:** Si el usuario dice *"para las vacaciones"*, el parser actualmente no cruza el texto con los nombres de las metas existentes; simplemente selecciona la primera meta por orden de arreglo. Si la meta estuviera en segunda posición, no se auto-emparejaría.
   - **Visibilidad en el Listado Principal (`TransactionList.tsx`):** Al guardarse la transacción, en la lista del panel no se muestra el badge `🎯 Vacaciones Brasil 2027` (a diferencia de la vista de Reportes donde sí se muestra `t.goalTitle`).

---

## 4. Auditoría del Módulo de Reportes (`ReportsView`)

El componente `ReportsView.tsx` incluye una botonera para alternar entre cuatro escalas temporales: **Diario**, **Semanal**, **Mensual** y **Anual**, además de KPIs superiores, desglose por categorías y exportación CSV.

### 4.1. Vista "Diario"
- **Selector de Día:** Permite conmutar con un clic al día actual ("Hoy") o seleccionar cualquier fecha mediante un selector nativo.
- **Listado Detallado:** Muestra cada movimiento del día seleccionado con iconos semánticos, montos, cuenta y badges (`🐜 Hormiga`, `🎯 Meta`).
- **Estado Vacío Amigable:** Si el día no registra gastos, muestra una tarjeta motivacional (`"¡Día sin gastos! Excelente para tu racha de ahorro"`), reforzando la gamificación del hábito.
- **Alerta Técnica de Zona Horaria:** El filtrado compara `t.transactedAt.split("T")[0] === selectedDay`. Dado que `toISOString()` devuelve la fecha en UTC, usuarios en Argentina (UTC-3) que registren un movimiento entre las 21:00 y las 23:59 verán que su movimiento se registra con fecha UTC del día siguiente, generando un falso desajuste en el filtro diario si no se maneja la fecha local.

### 4.2. Vista "Semanal"
- **Gráfico de Barras de 7 Días:**
  - Renderiza los 7 días móviles (Lun a Dom) con alturas relativas proporcionales al gasto máximo semanal (`heightPct = (d.amount / maxWeekAmount) * 100`).
  - El día actual se resalta en gradiente cian brillante con sombra `shadow-cyan-500/30`.
  - Al posar el cursor (`hover`), revela el monto exacto gastado en dicho día.

### 4.3. Vista "Mensual"
- **Diagnóstico Crítico de UX:**
  - La vista mensual es el estado predeterminado (`useState<TimeRange>("month")`).
  - Sin embargo, **no posee un bloque de gráfico de barras o línea temporal propio** entre los KPIs y las categorías (mientras que Semanal tiene 7 días y Anual tiene 12 meses).
  - El usuario pasa de los 4 KPI cards directamente a las barras de progreso de categorías.
  - **Propuesta:** Incorporar un gráfico de evolución acumulada del mes o distribución por semanas del mes (Semana 1 a 4) para mantener la consistencia con las otras tres vistas.

### 4.4. Vista "Anual"
- **Gráfico Comparativo de 12 Meses:**
  - Presenta barras duales por cada mes del año: verde esmeralda para Ingresos vs rosa para Gastos.
  - El mes en curso se resalta con tipografía cian destacada.
  - Muestra el acumulado neto del año (`formatCurrency(netBalance)`).

### 4.5. Exportación a CSV
- Funcionalidad limpia y robusta: genera un Blob con encabezados UTF-8 conteniendo ID, Fecha, Tipo, Descripción, Categoría, Monto, Cuenta, Indicador Hormiga y Meta, disparando la descarga con nombre descriptivo `finpulse_reporte_{timeRange}.csv`.

---

## 5. Auditoría del Registro por Nota de Voz (`VoiceExpenseModal`)

- **Web Speech API:** Implementado con reconocimiento continuo `es-AR` y fallback transparente con texto de demostración si el navegador no soporta la API de voz.
- **Detección Instantánea:** Transcribe en vivo y pasa el texto directamente al parser local para previsualizar monto, categoría y gasto hormiga en tiempo real.
- **Brecha Encontrada:** El modal de voz recibe `accounts: Account[]` pero **no recibe `goals: SavingsGoal[]`**. Si el usuario dicta *"Ahorré 30000 para el auto"*, la transacción se detecta como ahorro pero no ofrece la opción de elegir a qué meta asignarlo dentro del modal de voz.

---

## 6. Matriz de Hallazgos y Defectos Identificados

| ID | Componente | Severidad | Descripción del Problema | Impacto UX / Técnico |
| :---: | :--- | :---: | :--- | :--- |
| **BUG-01** | `parser.ts` & `QuickTransactionBar` | **Media-Alta** | Al ingresar *"con Visa"*, el parser sugiere `"Tarjeta Crédito"`, pero la cuenta se llama `"Visa Santander"` y su tipo es `"credit_card"`. La búsqueda falla y se selecciona la cuenta equivocada. | El usuario debe corregir manualmente el chip de medio de pago cada vez que menciona Visa/Mastercard. |
| **UX-02** | `ReportsView.tsx` | **Media** | La vista "Mensual" (por defecto) no tiene gráfico temporal; pasa de los KPIs a las categorías directamente. | Sensación de vacío comparado con las vistas Semanal y Anual. |
| **UX-03** | `TransactionList.tsx` | **Baja-Media** | No muestra el badge de la meta (`🎯 {goalTitle}`) en las transacciones de ahorro en el listado principal del dashboard. | El usuario no visualiza a qué meta fue destinado su ahorro en el historial reciente. |
| **UX-04** | `QuickTransactionBar.tsx` | **Baja** | Para ahorros muestra *"Medio de pago:"* en lugar de *"Cuenta origen:"*. | Inconsistencia terminológica al transferir dinero hacia un bote de ahorro. |
| **FEAT-05**| Global (Mobile) | **Media** | Ausencia total de API Háptica (`navigator.vibrate`). | Falta de confirmación táctil al registrar gastos o festejar metas en dispositivos móviles. |
| **TECH-06**| `date.ts` & `ReportsView` | **Baja-Media** | Filtrado de fechas usando `.toISOString().split("T")[0]` (UTC) en lugar de fecha local del usuario. | En husos horarios UTC-3 / UTC-4, transacciones nocturnas (21hs - 23:59hs) caen en la fecha del día siguiente. |
| **FEAT-07**| `VoiceExpenseModal.tsx` | **Baja** | Falta soporte del prop `goals` en el modal de nota de voz. | No se puede asignar meta directamente al dictar un ahorro por voz. |

---

## 7. Propuestas de Nuevas Mejoras y Roadmap de Cambios

### Propuesta 1: Mapeo Inteligente de Cuentas y Tarjetas en el Parser
Actualizar el algoritmo de emparejamiento de cuentas para que:
1. Revise coincidencias directas con el nombre de la cuenta (`acc.name.toLowerCase().includes(token)`).
2. Si el token es "visa", "mastercard" o "amex", busque en `acc.cardNetwork` o en nombres que contengan dicha franquicia.
3. Si el usuario menciona "crédito" o "tarjeta", busque cuentas donde `acc.accountType === "credit_card"`.

### Propuesta 2: Motor Háptico Universal (`useHaptics`)
Crear un hook utilitario de feedback háptico con tres niveles de vibración segura:
- **`hapticSuccess()`**: Patrón suave `[10, 40, 15]` al guardar un gasto o cumplir una meta.
- **`hapticWarning()`**: Pulso doble `[30, 50, 30]` al detectar gasto hormiga o alerta de límite de tarjeta.
- **`hapticTap()`**: Micro-pulso de `8ms` al pulsar botones rápidos de fecha ("Hoy", "Ayer") o cambiar de pestaña.

### Propuesta 3: Gráfico de Evolución Semanal/Diaria en la Vista Mensual
Incorporar en la pestaña de Reportes cuando `timeRange === "month"` un gráfico de distribución por semanas del mes (Semana 1, Semana 2, Semana 3, Semana 4) con comparativa de gasto proyectado vs presupuesto.

### Propuesta 4: Badges de Metas y Filtro de Ahorro en `TransactionList`
1. Agregar en cada fila de `TransactionList.tsx`:
   ```tsx
   {tx.goalTitle && (
     <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
       🎯 {tx.goalTitle}
     </span>
   )}
   ```
2. Agregar el botón de filtro `Ahorros 🎯` en el selector superior de la lista (junto a `Todos`, `Gastos`, `Ingresos`, `Hormiga 🐜`).

### Propuesta 5: Helper de Fecha Local Libre de Desfase UTC
Crear una función `getLocalISODate(date: Date = new Date()): string` que use el año, mes y día en zona horaria local:
```ts
export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

---

## 8. Conclusión General

FinPulse cuenta con un nivel de terminación visual e interactivo de primer nivel, superando ampliamente el estándar de aplicaciones de control financiero convencionales. La interfaz Obsidian en modo oscuro, la velocidad de respuesta y el registro heurístico sin fricción ofrecen una experiencia de usuario sumamente satisfactoria.

La subsanación de los detalles identificados en este informe (especialmente el emparejamiento de cuentas bancarias y el gráfico en la vista mensual) consolidará a FinPulse como una aplicación Fintech de clase mundial.
