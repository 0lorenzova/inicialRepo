"use client";
import { useId, useRef, useState } from "react";
import type { Account } from "@/lib/finance-ledger";

/** Uses the scheduled payment operation; reading or dismissing an alert is not a payment. */
export function NotificationPayment({ accounts, expectedAmount, envelopeName, onPay }: {
  accounts: Account[]; onPay: (amount: number, accountId: string) => void;
  expectedAmount: number;
  envelopeName: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false), [amount, setAmount] = useState(String(expectedAmount));
  const [accountId, setAccountId] = useState(accounts.filter(a => a.active).length === 1 ? accounts.find(a => a.active)!.id : "");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  if (!open) return <button type="button" className="primary" onClick={() => setOpen(true)}>Registrar pago</button>;
  return <form className="notification-payment" onSubmit={event => {
    event.preventDefault(); if (submitting.current) return; submitting.current = true;
    try { onPay(Number(amount), accountId); setOpen(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar el pago."); submitting.current = false; }
  }}>
    <b>Registrar pago · {envelopeName}</b>
    <small>Importe pendiente: {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(expectedAmount)}</small>
    <label htmlFor={`${id}-amount`}>Importe recibido</label>
    <input id={`${id}-amount`} type="number" inputMode="numeric" min="1" step="1" required value={amount} onChange={event => setAmount(event.target.value)}/>
    <label htmlFor={`${id}-account`}>Cuenta de pago</label>
    <select id={`${id}-account`} required value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Selecciona la cuenta</option>{accounts.filter(a => a.active).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
    <small>Al confirmar, se registrará un gasto y se descontará el importe de la cuenta y del sobre de este pago.</small>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div><button className="primary" type="submit">Confirmar pago</button><button className="secondary" type="button" onClick={() => { setOpen(false); setError(""); }}>Cancelar</button></div>
  </form>;
}
