"use client";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export type EnvelopeMenuAction = { label: string; onSelect: () => void; danger?: boolean };

export function EnvelopeContextMenu({ anchor, name, onClose, actions }: {
  anchor: HTMLElement;
  name: string;
  onClose: () => void;
  actions: EnvelopeMenuAction[];
}) {
  const bounds = anchor.getBoundingClientRect();
  const viewport = window.visualViewport;
  const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const top = viewport?.offsetTop || 0;
  const spaceBelow = bottom - bounds.bottom;
  const spaceAbove = bounds.top - top;
  const opensUp = spaceBelow < actions.length * 44 + 24 && spaceAbove > spaceBelow;

  return (
    <Menu
      id="envelope-context-menu"
      anchorEl={anchor}
      open
      onClose={onClose}
      anchorOrigin={{ vertical: opensUp ? "top" : "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: opensUp ? "bottom" : "top", horizontal: "right" }}
      marginThreshold={12}
      slotProps={{
        paper: {
          sx: {
            width: 240,
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
        list: { "aria-label": `Opciones de ${name}`, sx: { p: "5px" } },
      }}
    >
      {actions.map(action => (
        <MenuItem
          key={action.label}
          onClick={() => { onClose(); action.onSelect(); }}
          sx={{ minHeight: "44px !important", px: "10px", py: "8px", borderRadius: "6px", fontSize: "12px", whiteSpace: "normal", color: action.danger ? "error.main" : "text.primary" }}
        >
          {action.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
