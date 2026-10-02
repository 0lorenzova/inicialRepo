import assert from "node:assert/strict";
import { suggestEnvelopeIcons, validateEnvelopeIdentity } from "../lib/envelope-icons.ts";

for (const name of ["Alimentación", "Transporte", "Alquiler", "Viaje", "Salud", "Educación", "Mascotas", "Servicios", "Entretenimiento", "Ahorros", "", "Mi sobre personal"]) {
  const icons = suggestEnvelopeIcons(name);
  assert.equal(icons.length, 5);
  assert.equal(new Set(icons.map(option => option.icon)).size, 5);
  assert.deepEqual(icons, suggestEnvelopeIcons(name));
}
assert.equal(suggestEnvelopeIcons("  ALIMENTACIÓN familiar ")[0].icon, "🛒");
assert.equal(suggestEnvelopeIcons("Vacaciones de verano")[0].icon, "✈️");
assert.equal(suggestEnvelopeIcons("Alquiler de apartamento")[0].icon, "🏠");
assert.equal(suggestEnvelopeIcons("Automóvil y gasolina")[0].icon, "🚗");
assert.equal(suggestEnvelopeIcons("Mascotas y veterinario")[0].icon, "🐾");
assert.equal(suggestEnvelopeIcons("casamiento")[0].icon, "💰", "Match whole words, not accidental fragments.");
assert.deepEqual(validateEnvelopeIdentity({ name: "  Viajes  ", icon: " 🧳 " }), { name: "Viajes", icon: "🧳" });
assert.equal(validateEnvelopeIdentity({ name: "Familia", icon: "👨‍👩‍👧‍👦" }).icon, "👨‍👩‍👧‍👦");
assert.equal(validateEnvelopeIdentity({ name: "Costa Rica", icon: "🇨🇷" }).icon, "🇨🇷");
assert.throws(() => validateEnvelopeIdentity({ name: " ", icon: "💰" }), /nombre/);
assert.throws(() => validateEnvelopeIdentity({ name: "Casa", icon: " " }), /icono/);
assert.throws(() => validateEnvelopeIdentity({ name: "Casa", icon: "🏠🏡" }), /solo emoji/);
console.log("OK: cinco sugerencias locales por nombre, acentos, selección manual, validación española y emojis compuestos.");
