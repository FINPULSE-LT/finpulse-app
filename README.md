# 💳 FinPulse - App de Control Financiero Inteligente & Cero Fricción

FinPulse es una plataforma web y móvil para el control financiero moderno, diseñada con **cero fricción cognitiva**, **interpretación de gastos por texto libre y notas de voz con IA**, **gestión de tarjetas de crédito con cuotas reales y fechas de cierre/vencimiento**, y **psicología de hábitos y rachas (Duolingo Style)** para combatir los gastos hormiga.

---

## 🏛️ Arquitectura Desacoplada y Modular

Siguiendo las mejores prácticas de ingeniería de software, **cada elemento del sistema está completamente separado** para que puedas modificar estilos, textos, atajos o lógica de negocio sin que nada más se rompa:

```
├── src/
│   ├── constants/              # 🎨 CONFIGURACIÓN Y TOKENS AISLADOS
│   │   ├── branding.ts         # Nombre, slogan, URLs, versión, soporte
│   │   ├── colors.ts           # Paleta de colores, badges, gradientes
│   │   ├── labels.ts           # Todos los textos, copys y mensajes de la UI
│   │   ├── categories.ts       # Categorías, subcategorías e iconos
│   │   ├── shortcuts.ts        # Definición de atajos de teclado
│   │   ├── coach.ts            # Personalidades (Zen, Amigo, Ramsay) y frases
│   │   └── initialData.ts      # Datos iniciales y seed
│   │
│   ├── types/                  # 📐 TIPOS TYPESCRIPT
│   │   └── index.ts            # Profile, Account, Transaction, SavingsGoal, etc.
│   │
│   ├── lib/                    # 🧠 LÓGICA DE NEGOCIO PURA (ENGINES)
│   │   ├── ai/                 # Parser de lenguaje natural y extracción JSON
│   │   ├── credit-cards/       # Fechas de corte, vencimiento y cálculo de cuotas
│   │   ├── streaks/            # Cálculo de rachas hormiga y dinero rescatado
│   │   ├── formatters/         # Monedas (ARS/USD/EUR) y fechas relativas
│   │   └── supabase/           # Clientes browser/server y script DDL SQL
│   │
│   ├── hooks/                  # ⚡ HOOKS REACTIVOS
│   │   └── useKeyboardShortcuts.ts # Listener global de teclas de acceso rápido
│   │
│   ├── components/             # 🧩 COMPONENTES MODULARES
│   │   ├── ui/                 # Botones, Modales, Badges reutilizables
│   │   ├── branding/           # Logotipo e isotipo de FinPulse
│   │   ├── coach/              # Widget del Asistente con selector de exigencia
│   │   ├── streaks/            # Widget de Racha con fuego y dinero rescatado
│   │   ├── transactions/       # Barra rápida IA, Modal de Voz, Lista y Formulario
│   │   ├── accounts/           # Cuentas bancarias, billeteras y tarjetas
│   │   ├── goals/              # Metas individuales y tableros compartidos
│   │   ├── reports/            # Gráficos, analíticas y calendario de calor
│   │   ├── shortcuts/          # Modal interactivo de atajos de teclado
│   │   └── navigation/         # Navbar superior y barra de pestañas móvil
│   │
│   └── app/                    # 🚀 NEXT.JS 15 APP ROUTER
│       ├── layout.tsx          # Layout raíz con soporte PWA
│       ├── globals.css         # Tailwind directives y utilidades dark
│       └── page.tsx            # Orquestador del Dashboard principal
```

---

## ⌨️ Atajos de Teclado Rápidos

Puedes controlar la app sin usar el mouse:
* `/` : Enfoca instantáneamente la barra de registro rápido.
* `V` : Inicia la grabación de nota de voz con IA.
* `N` : Abre el formulario detallado de movimiento manual.
* `?` : Abre la ventana con todos los atajos disponibles.
* `Alt + 1` a `Alt + 5` : Alterna entre Dashboard, Movimientos, Cuentas, Metas y Reportes.
* `Esc` : Cierra cualquier modal abierto.

---

## 🗄️ Base de Datos Supabase (PostgreSQL)

El archivo [`src/lib/supabase/schema.sql`](file:///c:/Users/Lisandro/.gemini/antigravity/scratch/Proyectos%20nuevos/Proyectos%20personales/App%20para%20Control%20financiero/src/lib/supabase/schema.sql) contiene el script SQL DDL listo para ejecutar en el panel de Supabase:
1. Ingresa a tu proyecto: [https://supabase.com/dashboard/project/ajtyraxyiruyqibkgpxe/sql](https://supabase.com/dashboard/project/ajtyraxyiruyqibkgpxe/sql)
2. Pega el contenido de `schema.sql` y presiona **Run**.
3. Las tablas (`profiles`, `accounts`, `transactions`, `savings_goals`, `goal_members`) y las políticas de seguridad **Row-Level Security (RLS)** quedarán activadas inmediatamente.

---

## 🛠️ Ejecución Local

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🚀 Despliegue en Vercel & GitHub

1. Inicializar git y hacer commit:
   ```bash
   git init
   git add .
   git commit -m "feat: inicializacion completa de FinPulse"
   ```
2. Crear un nuevo repositorio en tu cuenta de GitHub y vincularlo:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/finpulse-app.git
   git branch -M main
   git push -u origin main
   ```
3. En Vercel ([vercel.com/new](https://vercel.com/new)):
   * Importa el repositorio de GitHub.
   * Añade las variables de entorno en **Settings > Environment Variables**:
     * `NEXT_PUBLIC_SUPABASE_URL`: `https://ajtyraxyiruyqibkgpxe.supabase.co`
     * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_frRh_gDszWof32wcFaNg2Q_8YCARkY2`
   * Presiona **Deploy**. En menos de 60 segundos tendrás la app pública con HTTPS.
