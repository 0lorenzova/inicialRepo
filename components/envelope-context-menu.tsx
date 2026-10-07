"use client";

import { useThemeMode } from "@/components/theme-provider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { ReactNode } from "react";

export type EnvelopeMenuAction = { label: string; onSelect: () => void; danger?: boolean; content?: ReactNode; key?: string };

export function EnvelopeContextMenu({ anchor, name, onClose, actions, title, menuId = "envelope-context-menu", closeOnSelect = true }: {
  anchor: HTMLElement;
  name: string;
  onClose: () => void;
  actions: EnvelopeMenuAction[];
  title?: string;
  menuId?: string;
  closeOnSelect?: boolean;
}) {
  const {scale}=useThemeMode();
  const bounds = anchor.getBoundingClientRect();
  const viewport = window.visualViewport;
  const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const top = viewport?.offsetTop || 0;
  const spaceBelow = bottom - bounds.bottom;
  const spaceAbove = bounds.top - top;
  const opensUp = spaceBelow < actions.reduce((height, action) => height + (action.content ? 116 : 44), title ? 68 : 24) && spaceAbove > spaceBelow;

  return (
    <Menu
      id={menuId}
      anchorEl={anchor}
      open
      onClose={onClose}
      anchorOrigin={{ vertical: opensUp ? "top" : "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: opensUp ? "bottom" : "top", horizontal: "right" }}
      marginThreshold={12}
      slotProps={{
        paper: {
          sx: {
            width: title ? 320 : 240,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "calc(100dvh - 24px)",
            border: 1,
            borderColor: "divider",
            borderRadius: "10px",
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: "0 12px 32px #0003",
          },
        },
        list: { "aria-label": title ?? `Opciones de ${name}`, sx: { p: "5px" } },
      }}
    >
      {title && <li role="presentation" style={{ padding: "10px", fontSize: 12*scale, fontWeight: 700, overflowWrap: "anywhere" }}>{title}</li>}
      {title && !actions.length && <li role="presentation" style={{ padding: "10px", fontSize: 12 }}>No hay metas ni importes activos en este sobre.</li>}
      {actions.map(action => (
        <MenuItem
          key={action.key ?? action.label}
          aria-label={action.content ? action.label : undefined}
          onClick={() => { if (closeOnSelect) onClose(); action.onSelect(); }}
          sx={{ minHeight: `${44*scale}px !important`, px: "10px", py: "8px", borderRadius: "6px", fontSize: `${12*scale}px`, whiteSpace: "normal", color: action.danger ? "error.main" : "text.primary" }}
        >
          {action.content ?? action.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
