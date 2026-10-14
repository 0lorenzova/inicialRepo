/** Additional palettes share their tokens between native controls and MUI portals. */
export const additionalThemes = {
  "red-moon": { name:"Red Moon", canvas:"#13090e", paper:"#28151e", raised:"#38202b", line:"#89616e", ink:"#fff0f4", muted:"#d9b6c3", accent:"#ffacbc", action:"#ab3252", selected:"#512335", secondary:"#dfb2a3" },
  universe: { name:"Universe", canvas:"#070d21", paper:"#111e3b", raised:"#1c2b4d", line:"#627ba7", ink:"#f0f5ff", muted:"#b8c9e8", accent:"#9ec9ff", action:"#325cb8", selected:"#203d68", secondary:"#bbc1ff" },
  galaxy: { name:"Galaxy", canvas:"#150a22", paper:"#291638", raised:"#3a204b", line:"#9566a2", ink:"#fff1ff", muted:"#dac0e5", accent:"#efb6ee", action:"#923879", selected:"#542951", secondary:"#c6b7ff" },
  "river-water": { name:"River Water", canvas:"#04191c", paper:"#0b2c32", raised:"#153e46", line:"#578f99", ink:"#e9fcff", muted:"#add4da", accent:"#86e3ef", action:"#166b78", selected:"#1b4e59", secondary:"#9ecbcc" },
} as const;

export function additionalPalette(mode:string) {
  return Object.hasOwn(additionalThemes, mode) ? additionalThemes[mode as keyof typeof additionalThemes] : undefined;
}

export const additionalThemeStyles = Object.fromEntries(Object.entries(additionalThemes).map(([id,p]) => [`.theme-personality.theme-${id}`, {
  "--canvas":p.canvas, "--paper":p.paper, "--surface-raised":p.raised, "--line":p.line,
  "--ink":p.ink, "--muted":p.muted, "--green":p.accent, "--green-dark":p.action, "--pale":p.selected,
  "--theme-shadow":"0 4px 16px #00000030", colorScheme:"dark",
}]));
