import type { EnvelopeAction } from "./envelope-operation";

// Presentation labels only: stored operation types retain their existing identity.
export const envelopeActionLabels: Record<EnvelopeAction, string> = {
  "Asignar dinero": "Cargar dinero",
  Desasignar: "Descargar dinero",
  Transferir: "Transferir dinero entre sobres",
  "Prestar a otro sobre": "Prestar a otro sobre",
  "Pedir prestado": "Pedir prestado",
};
