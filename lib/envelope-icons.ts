export type EnvelopeIcon = { icon: string; label: string };

const defaults: EnvelopeIcon[] = [
  { icon: "💰", label: "Dinero" },
  { icon: "📩", label: "Sobre" },
  { icon: "🎯", label: "Objetivo" },
  { icon: "🐷", label: "Ahorro" },
  { icon: "⭐", label: "Prioridad" },
];

const categories: { words: string[]; icons: EnvelopeIcon[] }[] = [
  { words: ["alimentacion", "alimentos", "comida", "supermercado", "mercado", "compras", "cocina"], icons: [
    { icon: "🛒", label: "Compras" }, { icon: "🍎", label: "Alimentación" }, { icon: "🥗", label: "Comida" }, { icon: "🥑", label: "Productos frescos" }, { icon: "🍽️", label: "Mesa" },
  ] },
  { words: ["transporte", "transito", "carro", "auto", "automovil", "gasolina", "combustible", "bus", "taxi", "moto"], icons: [
    { icon: "🚗", label: "Carro" }, { icon: "🚌", label: "Autobús" }, { icon: "⛽", label: "Combustible" }, { icon: "🚲", label: "Bicicleta" }, { icon: "🛵", label: "Moto" },
  ] },
  { words: ["alquiler", "renta", "casa", "hogar", "vivienda", "hipoteca", "apartamento"], icons: [
    { icon: "🏠", label: "Hogar" }, { icon: "🔑", label: "Llaves" }, { icon: "🏡", label: "Casa" }, { icon: "🏢", label: "Apartamento" }, { icon: "🛋️", label: "Muebles" },
  ] },
  { words: ["viaje", "viajes", "vacaciones", "paseo", "turismo", "hotel", "playa"], icons: [
    { icon: "✈️", label: "Viaje" }, { icon: "🧳", label: "Equipaje" }, { icon: "🏖️", label: "Playa" }, { icon: "🌍", label: "Destino" }, { icon: "🏕️", label: "Paseo" },
  ] },
  { words: ["salud", "medico", "medicina", "medicinas", "farmacia", "hospital", "dentista", "terapia"], icons: [
    { icon: "❤️", label: "Salud" }, { icon: "💊", label: "Medicinas" }, { icon: "🩺", label: "Consulta médica" }, { icon: "🏥", label: "Hospital" }, { icon: "🦷", label: "Dentista" },
  ] },
  { words: ["ahorro", "ahorros", "reserva", "emergencia", "emergencias", "imprevistos"], icons: [
    { icon: "🐷", label: "Ahorro" }, { icon: "🛡️", label: "Protección" }, { icon: "💰", label: "Reserva" }, { icon: "🏦", label: "Banco" }, { icon: "🪙", label: "Monedas" },
  ] },
  { words: ["educacion", "estudio", "estudios", "escuela", "colegio", "universidad", "curso", "cursos"], icons: [
    { icon: "📚", label: "Estudios" }, { icon: "🎓", label: "Educación" }, { icon: "✏️", label: "Materiales" }, { icon: "🏫", label: "Escuela" }, { icon: "💻", label: "Curso" },
  ] },
  { words: ["mascota", "mascotas", "perro", "gato", "veterinario"], icons: [
    { icon: "🐾", label: "Mascotas" }, { icon: "🐶", label: "Perro" }, { icon: "🐱", label: "Gato" }, { icon: "🦴", label: "Alimento para mascotas" }, { icon: "🐕", label: "Cuidado de mascotas" },
  ] },
  { words: ["servicios", "electricidad", "luz", "agua", "internet", "telefono"], icons: [
    { icon: "💡", label: "Electricidad" }, { icon: "💧", label: "Agua" }, { icon: "📱", label: "Teléfono" }, { icon: "🌐", label: "Internet" }, { icon: "🧾", label: "Servicios" },
  ] },
  { words: ["ocio", "entretenimiento", "cine", "musica", "juegos", "diversion"], icons: [
    { icon: "🎮", label: "Juegos" }, { icon: "🎬", label: "Cine" }, { icon: "🎵", label: "Música" }, { icon: "🎨", label: "Arte" }, { icon: "🎟️", label: "Entradas" },
  ] },
];

/** Local, deterministic suggestions; changing a name never changes saved data. */
export function suggestEnvelopeIcons(name: string): EnvelopeIcon[] {
  const words = new Set(name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").split(/[^a-z0-9]+/));
  const best = categories.map((category, index) => ({ category, index, score: category.words.filter(word => words.has(word)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index)[0];
  return (best?.category.icons ?? defaults).map(option => ({ ...option }));
}

export function validateEnvelopeIdentity(value: { name: string; icon: string }): { name: string; icon: string } {
  const name = value.name.trim();
  const icon = value.icon.trim();
  if (!name) throw new Error("Escribe un nombre para el sobre.");
  if (!icon) throw new Error("Elige un icono o escribe un emoji.");
  const segments = Array.from(new Intl.Segmenter("es", { granularity: "grapheme" }).segment(icon));
  if (segments.length !== 1) throw new Error("Utiliza un solo emoji como icono del sobre.");
  return { name, icon };
}
