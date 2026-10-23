"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Loan } from "@/lib/finance-ledger";
import { envelopeLabel } from "@/lib/envelope-label";
import { FinanceDialog } from "@/components/finance-dialog";
import styles from "./loans-screen.module.css";

type Props = {
  loan: Loan;
  available: number;
  display: (amount: number) => string;
  error: string;
  onClose: () => void;
  onConfirm: (amount: number) => boolean;
};

export function LoanRepaymentDialog({ loan, available, display, error, onClose, onConfirm }: Props) {
  const maximum = Math.max(0, Math.min(loan.outstanding, available));
  const [amount, setAmount] = useState(String(maximum));
  const [busy, setBusy] = useState(false);
  const submitLock = useRef(false);
  const parsed = Number(amount);
  const valid = Number.isSafeInteger(parsed) && parsed > 0 && parsed <= loan.outstanding && parsed <= available;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current || !valid) return;
    submitLock.current = true;
    setBusy(true);
    try {
      if (!onConfirm(parsed)) {
        submitLock.current = false;
        setBusy(false);
      }
    } catch {
      submitLock.current = false;
      setBusy(false);
    }
  };

  return <FinanceDialog label="Devolver préstamo" onClose={onClose} maxWidth={520}>
    <form className={`flow-modal ${styles.dialog}`} noValidate onSubmit={submit}>
      <header className={styles.dialogHeader}>
        <div><small>PRÉSTAMO ENTRE SOBRES</small><h2>Devolver préstamo</h2></div>
        <button type="button" aria-label="Cerrar diálogo" onClick={onClose}>×</button>
      </header>
      <div className={`flow-body ${styles.dialogBody}`}>
        <div className={styles.dialogParties}>
          <div><small>Recibe el dinero</small><strong>{envelopeLabel(loan.targetName)}</strong></div>
          <span aria-hidden="true">→</span>
          <div><small>Recupera el dinero</small><strong>{envelopeLabel(loan.sourceName)}</strong></div>
        </div>
        <div className={styles.dialogFacts}>
          <div><span>Importe original</span><strong>{display(loan.amount)}</strong></div>
          <div><span>Saldo pendiente</span><strong>{display(loan.outstanding)}</strong></div>
          <div><span>Disponible en {envelopeLabel(loan.targetName)}</span><strong>{display(available)}</strong></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {available <= 0 && <p className="form-error" role="status">El sobre receptor no tiene saldo disponible para devolver.</p>}
        <label className={styles.amountLabel} htmlFor="loan-repayment-amount">Importe a devolver</label>
        <div className="currency-input"><span>₡</span><input id="loan-repayment-amount" name="amount" type="number" inputMode="numeric" step="1" min="1" max={maximum} value={amount} onChange={event => setAmount(event.target.value)} required aria-describedby="loan-repayment-hint"/></div>
        <label className={styles.maxOption}>
          <input type="checkbox" checked={parsed === loan.outstanding} disabled={available < loan.outstanding} onChange={event => setAmount(event.target.checked ? String(loan.outstanding) : String(maximum))}/>
          Devolver el total pendiente
        </label>
        {available < loan.outstanding && <p className={styles.helper}>El sobre no tiene saldo suficiente para cubrir todo el pendiente; puedes registrar una devolución parcial de hasta {display(maximum)}.</p>}
        <div className={styles.transferPreview}>
          <strong>Así cambiarán los saldos al confirmar</strong>
          <div><span>{envelopeLabel(loan.targetName)}</span><b>−{display(valid ? parsed : 0)}</b></div>
          <div><span>{envelopeLabel(loan.sourceName)}</span><b>+{display(valid ? parsed : 0)}</b></div>
        </div>
        <span id="loan-repayment-hint" className="visually-hidden">El importe debe ser un entero mayor que cero y no superar el saldo pendiente ni el saldo disponible.</span>
        <div className={styles.dialogActions}>
          <button type="button" className="secondary wide" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="primary wide" disabled={!valid || busy}>{busy ? "Registrando…" : "Confirmar devolución"}</button>
        </div>
      </div>
    </form>
  </FinanceDialog>;
}
