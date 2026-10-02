"use client";
import { useState } from "react";
import { FinanceDialog } from "@/components/finance-dialog";

export function FeedbackDialog({onClose}:{onClose:()=>void}) {
  const [kind,setKind]=useState("Sugerencia"),[message,setMessage]=useState("");
  const destination=process.env.NEXT_PUBLIC_FEEDBACK_EMAIL||"0lorenzova@gmail.com";
  const body=`${message.trim()}\n\nFinanzas · Compilación: ${process.env.NEXT_PUBLIC_BUILD_DATE||"local"}`;
  return <FinanceDialog label="Enviar comentarios" onClose={onClose}><section className="flow-modal">
    <header><h2>Enviar comentarios</h2><button aria-label="Cerrar diálogo" onClick={onClose}>×</button></header>
    <div className="flow-body"><label htmlFor="feedback-kind">Tipo</label><select id="feedback-kind" value={kind} onChange={e=>setKind(e.target.value)}><option>Sugerencia</option><option>Error</option><option>Idea de mejora</option></select><label htmlFor="feedback-message">Tu comentario</label><textarea id="feedback-message" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Cuéntanos qué ocurrió o qué te gustaría mejorar."/>
      <p className="flow-intro">Se abrirá tu aplicación de correo para revisar y enviar el mensaje a {destination}. No se adjuntan saldos ni movimientos.</p>
      <a className={`primary wide feedback-send ${!message.trim()?"disabled":""}`} aria-disabled={!message.trim()} href={message.trim()?`mailto:${destination}?subject=${encodeURIComponent(`Finanzas · ${kind}`)}&body=${encodeURIComponent(body)}`:undefined}>Abrir correo</a>
    </div>
  </section></FinanceDialog>;
}
