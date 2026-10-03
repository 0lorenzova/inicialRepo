"use client";

import { useRef, useState } from "react";
import { FinanceDialog } from "./finance-dialog";

export function FinanceResetDialog({ cloud, onReset, onClose, onBackup }: { cloud: boolean; onReset: (keep: boolean) => void; onClose: () => void; onBackup: () => void }) {
  const [keep, setKeep] = useState<boolean | null>(null);
  const [final, setFinal] = useState(false), [confirmation, setConfirmation] = useState(""), [error, setError] = useState("");
  const submitting = useRef(false);
  return <FinanceDialog label="Restablecer datos financieros" onClose={onClose}><section className="flow-modal"><header><h2>Borrar movimientos y restablecer saldos</h2><button type="button" aria-label="Cancelar restablecimiento" onClick={onClose}>×</button></header><div className="flow-body">
    <p className="flow-intro">Se borrarán todos los movimientos, préstamos y comprobantes de pago; los saldos quedarán en cero. {cloud ? "El cambio se guardará también en tu cuenta de Supabase." : "El cambio afecta a los datos de este navegador."} Se guardará un respaldo local antes de continuar.</p>
    <button type="button" className="secondary wide" onClick={onBackup}>Descargar respaldo antes de continuar</button>
    {!final ? <><h3>¿Deseas conservar la configuración de tus sobres y preferencias de la aplicación?</h3>
      <button type="button" className={`choice ${keep === true ? "chosen" : ""}`} aria-pressed={keep === true} onClick={() => setKeep(true)}>Sí · Conservar sobres, metas, programación, cuentas y preferencias</button>
      <button type="button" className={`choice ${keep === false ? "chosen" : ""}`} aria-pressed={keep === false} onClick={() => setKeep(false)}>No · Volver a la configuración de primer uso</button>
      <button type="button" className="primary wide" disabled={keep === null} onClick={() => setFinal(true)}>Continuar al resumen</button>
    </> : <><h3>Confirmación final</h3><p className="flow-intro">{keep ? "Se conservarán tus preferencias y la última programación de cada serie recurrente. Se borrarán los pagos y todos los saldos quedarán en cero." : "Se reemplazarán tus sobres, cuentas y preferencias por los valores iniciales; también se restablecerá el tema. Tu usuario y sesión no se eliminarán."}</p>
      <label htmlFor="reset-confirm">Escribe BORRAR para confirmar</label><input id="reset-confirm" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="button" className="primary wide" disabled={confirmation !== "BORRAR"} onClick={() => { if (submitting.current || keep === null) return; submitting.current = true; try { onReset(keep); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo restablecer. Tus datos se conservan."); submitting.current = false; } }}>Confirmar borrado y restablecer</button>
      <button type="button" className="secondary wide" onClick={() => { setFinal(false); setConfirmation(""); }}>Volver</button>
    </>}
    <button type="button" className="secondary wide" onClick={onClose}>Cancelar</button>
  </div></section></FinanceDialog>;
}
