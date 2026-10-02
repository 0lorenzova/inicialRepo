export type EnvelopeView = {
  envelopesViewMode: "list" | "grid";
  envelopesGridColumns: 2 | 3;
};

export function normalizeEnvelopeView(value: Partial<EnvelopeView>): EnvelopeView {
  return {
    envelopesViewMode: value.envelopesViewMode === "grid" ? "grid" : "list",
    envelopesGridColumns: value.envelopesGridColumns === 3 ? 3 : 2,
  };
}

// Entering the grid always starts with two columns; tapping it again cycles.
export function nextEnvelopeGrid(value: EnvelopeView): EnvelopeView {
  return {
    envelopesViewMode: "grid",
    envelopesGridColumns: value.envelopesViewMode === "grid" && value.envelopesGridColumns === 2 ? 3 : 2,
  };
}

export const MIN_GRID_CARD_WIDTH = 96;
export function canShowThreeColumns(width: number) {
  return width >= MIN_GRID_CARD_WIDTH * 3 + 12;
}

const GRID_GAP = 6;
const COMPACT_DESKTOP_CARD_WIDTH = 156;
const COMFORTABLE_DESKTOP_CARD_WIDTH = 210;

// Keep the saved mobile choice; use it as density once four comfortable-to-read
// compact cards fit. The displayed count also drives keyboard reordering.
export function isAdaptiveEnvelopeGrid(width: number | null): boolean {
  return width !== null && Number.isFinite(width)
    && width >= COMPACT_DESKTOP_CARD_WIDTH * 4 + GRID_GAP * 3;
}

export function envelopeGridColumns(preferred: 2 | 3, width: number | null): number {
  if (!isAdaptiveEnvelopeGrid(width)) return preferred;
  const cardWidth = preferred === 3 ? COMPACT_DESKTOP_CARD_WIDTH : COMFORTABLE_DESKTOP_CARD_WIDTH;
  return Math.max(preferred, Math.floor((width! + GRID_GAP) / (cardWidth + GRID_GAP)));
}

export function reorderEnvelopes<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const unique = [...new Set(ids)];
  const byId = new Map(items.map(item => [item.id, item]));
  const ordered = unique.map(id => byId.get(id)).filter((item): item is T => Boolean(item));
  const selected = new Set(ordered.map(item => item.id));
  let position = 0;
  return items.map(item => selected.has(item.id) ? ordered[position++] : item);
}
