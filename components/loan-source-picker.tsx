"use client";

import { useState } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { envelopeLabel } from "@/lib/envelope-label";
import styles from "./loans-screen.module.css";

type Envelope = { id: string; name: string; icon: string; balance: number; balanceHidden?: boolean; archived?: boolean };

export function LoanSourcePicker({ envelopes, display, onSelect, onClose }: {
  envelopes: Envelope[];
  display: (amount: number) => string;
  onSelect: (envelopeId: string) => void;
  onClose: () => void;
}) {
  const sources = envelopes.filter(envelope => !envelope.archived && envelope.balance > 0);
  const [selected, setSelected] = useState(sources[0]?.id ?? "");

  return <FinanceDialog label="Elegir sobre prestamista" onClose={onClose}>
    <section className={`flow-modal ${styles.dialog}`}>
      <header className={styles.dialogHeader}>
        <div><small>NUEVO PRÉSTAMO</small><h2>Elige el sobre prestamista</h2></div>
        <button type="button" aria-label="Cerrar diálogo" onClick={onClose}>×</button>
      </header>
      <div className={`flow-body ${styles.dialogBody}`}>
        <p className={styles.helper}>Luego podrás elegir el sobre receptor, el monto y la fecha límite.</p>
        {sources.length ? <div className={styles.sourceOptions} role="radiogroup" aria-label="Sobre que prestará el dinero">
          {sources.map(envelope => <label key={envelope.id} className={styles.sourceOption}>
            <input type="radio" name="loan-source" value={envelope.id} checked={selected === envelope.id} onChange={() => setSelected(envelope.id)}/>
            <span aria-hidden="true">{envelope.icon}</span>
            <span><strong>{envelopeLabel(envelope.name)}</strong><small>Disponible: {envelope.balanceHidden ? "••••••" : display(envelope.balance)}</small></span>
          </label>)}
        </div> : <div className={styles.empty}><span aria-hidden="true">↔</span><div><strong>No hay sobres disponibles para prestar.</strong><p>Necesitas un sobre activo con saldo y otro sobre como destino.</p></div></div>}
        <div className={styles.dialogActions}>
          <button type="button" className="secondary wide" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary wide" disabled={!selected || sources.length === 0} onClick={() => onSelect(selected)}>Continuar</button>
        </div>
      </div>
    </section>
  </FinanceDialog>;
}
