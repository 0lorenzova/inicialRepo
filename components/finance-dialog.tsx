"use client";

import { cloneElement, type HTMLAttributes, type ReactElement } from "react";
import Modal from "@mui/material/Modal";
import { useThemeMode } from "@/components/theme-provider";

export function FinanceDialog({ label, onClose, children }: {
  label: string;
  onClose: () => void;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}) {
  const { mode } = useThemeMode();
  return (
    <Modal
      open
      hideBackdrop
      className="modal-backdrop"
      onClose={onClose}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={`dialog-theme ${mode === "dark" ? "dark-mode" : ""}`} tabIndex={-1}>
        {cloneElement(children, { role: "dialog", "aria-modal": true, "aria-label": label, tabIndex: -1 })}
      </div>
    </Modal>
  );
}
