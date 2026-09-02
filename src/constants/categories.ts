/**
 * Categorías y Subcategorías de Gastos e Ingresos
 * Editar aquí para agregar o modificar categorías sin tocar vistas.
 */
export interface CategoryDefinition {
  id: string;
  name: string;
  type: "expense" | "income";
  iconName: string; // Nombre del icono de Lucide
  color: string;
  isAntDefault: boolean; // Si por defecto suele considerarse gasto hormiga
  subcategories?: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  // Gastos - Frecuentes y Hormiga
  {
    id: "cafe_kiosco",
    name: "Cafetería & Kiosco",
    type: "expense",
    iconName: "Coffee",
    color: "#f59e0b", // Amber
    isAntDefault: true,
    subcategories: ["Café al paso", "Snacks", "Golosinas", "Cigarrillos", "Bebidas al paso"],
  },
  {
    id: "delivery_comida",
    name: "Delivery & Antojos",
    type: "expense",
    iconName: "UtensilsCrossed",
    color: "#fb923c", // Orange
    isAntDefault: true,
    subcategories: ["PedidosYa / Rappi", "Comida rápida", "Helado"],
  },
  {
    id: "supermercado",
    name: "Supermercado & Alimentos",
    type: "expense",
    iconName: "ShoppingCart",
    color: "#10b981", // Emerald
    isAntDefault: false,
    subcategories: ["Comestibles", "Verdulería", "Carnicería", "Limpieza"],
  },
  {
    id: "transporte_movilidad",
    name: "Transporte & Movilidad",
    type: "expense",
    iconName: "Car",
    color: "#3b82f6", // Blue
    isAntDefault: false,
    subcategories: ["Uber / Cabify / Taxi", "Combustible", "SUBE / Metro / Bus", "Peajes", "Estacionamiento"],
  },
  {
    id: "vivienda_servicios",
    name: "Vivienda & Servicios",
    type: "expense",
    iconName: "Home",
    color: "#6366f1", // Indigo
    isAntDefault: false,
    subcategories: ["Alquiler / Expensas", "Electricidad", "Gas", "Agua", "Internet & Cable"],
  },
  {
    id: "suscripciones_digitales",
    name: "Suscripciones Digitales",
    type: "expense",
    iconName: "Tv",
    color: "#8b5cf6", // Purple
    isAntDefault: true,
    subcategories: ["Netflix / Disney+", "Spotify", "iCloud / Google One", "Gym / Fitness"],
  },
  {
    id: "salud_cuidado",
    name: "Salud & Bienestar",
    type: "expense",
    iconName: "HeartPulse",
    color: "#ec4899", // Pink
    isAntDefault: false,
    subcategories: ["Farmacia", "Consultas médicas", "Obra Social / Prepaga", "Peluquería & Estética"],
  },
  {
    id: "ocio_salidas",
    name: "Salidas & Entretenimiento",
    type: "expense",
    iconName: "PartyPopper",
    color: "#f43f5e", // Rose
    isAntDefault: false,
    subcategories: ["Restaurantes & Bares", "Cine & Teatro", "Recitales", "Juegos"],
  },
  {
    id: "compras_ropa",
    name: "Ropa & Tecnología",
    type: "expense",
    iconName: "Shirt",
    color: "#06b6d4", // Cyan
    isAntDefault: false,
    subcategories: ["Indumentaria", "Calzado", "Electrónica & Gadgets"],
  },
  {
    id: "imprevistos",
    name: "Imprevistos & Varios",
    type: "expense",
    iconName: "AlertCircle",
    color: "#64748b", // Slate
    isAntDefault: false,
    subcategories: ["Reparaciones", "Multas", "Regalos"],
  },

  // Ingresos
  {
    id: "salario",
    name: "Salario / Sueldo",
    type: "income",
    iconName: "Briefcase",
    color: "#10b981",
    isAntDefault: false,
    subcategories: ["Sueldo principal", "Aguinaldo / Bono"],
  },
  {
    id: "freelance_honorarios",
    name: "Freelance & Honorarios",
    type: "income",
    iconName: "Laptop",
    color: "#06b6d4",
    isAntDefault: false,
    subcategories: ["Clientes", "Proyectos puntuales", "Consultoría"],
  },
  {
    id: "inversiones_rendimientos",
    name: "Inversiones & Rendimientos",
    type: "income",
    iconName: "TrendingUp",
    color: "#8b5cf6",
    isAntDefault: false,
    subcategories: ["Intereses de cuenta", "Dividendos", "Cripto"],
  },
  {
    id: "otros_ingresos",
    name: "Otros Ingresos",
    type: "income",
    iconName: "Coins",
    color: "#eab308",
    isAntDefault: false,
    subcategories: ["Venta de usados", "Regalos / Devoluciones"],
  },
];
