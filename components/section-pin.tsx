"use client";

import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";

export function SectionPin({ pinned, section, onToggle }: { pinned: boolean; section: string; onToggle: () => void }) {
  const description = pinned
    ? `Desfijar ${section}: se abrirá plegado la próxima vez`
    : `Fijar ${section}: mantener desplegado al volver a abrir la app`;

  return (
    <button
      type="button"
      className={`pin-button ${pinned ? "pinned" : ""}`}
      aria-label={description}
      aria-pressed={pinned}
      title={description}
      onClick={onToggle}
    >
      {pinned ? <LockOutlined aria-hidden="true" /> : <LockOpenOutlined aria-hidden="true" />}
      <span>{pinned ? "Fijado" : "Fijar"}</span>
    </button>
  );
}
