import type { EnvelopeAction } from "@/lib/envelope-operation";

export function EnvelopeActionIcon({ action }: { action: EnvelopeAction }) {
  const paired = action === "Transferir" || action === "Prestar a otro sobre" || action === "Pedir prestado";
  return <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {paired ? <>
      <path d="M2 17h11v10H2z m0 0 5.5 5 5.5-5 M19 17h11v10H19z m0 0 5.5 5 5.5-5"/>
      <path d="M7 12V6h18v6 m-3-3 3 3 3-3"/>
      {action !== "Transferir" && <path d="M25 13H7 m3-3-3 3 3 3"/>}
    </> : <>
      <path d="m3 15 6-5 m14 0 6 5v14H3V15l13 8 13-8 M3 29l9-9 m8 0 9 9"/>
      {action === "Asignar dinero" ? <path d="M16 2v15 m-4-4 4 4 4-4"/> : <path d="M16 17V2 m-4 4 4-4 4 4"/>}
    </>}
  </svg>;
}
