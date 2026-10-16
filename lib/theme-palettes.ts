/** Additional palettes share their tokens between native controls and MUI portals. */
export const additionalThemes = {
  "red-moon": { name:"Red Moon", canvas:"#13090e", paper:"#28151e", raised:"#38202b", line:"#89616e", ink:"#fff0f4", muted:"#d9b6c3", accent:"#ffacbc", action:"#ab3252", selected:"#512335", secondary:"#dfb2a3" },
  universe: { name:"Universe", canvas:"#070d21", paper:"#111e3b", raised:"#1c2b4d", line:"#627ba7", ink:"#f0f5ff", muted:"#b8c9e8", accent:"#9ec9ff", action:"#325cb8", selected:"#203d68", secondary:"#bbc1ff" },
  galaxy: { name:"Galaxy", canvas:"#150a22", paper:"#291638", raised:"#3a204b", line:"#9566a2", ink:"#fff1ff", muted:"#dac0e5", accent:"#efb6ee", action:"#923879", selected:"#542951", secondary:"#c6b7ff" },
  "river-water": { name:"River Water", canvas:"#04191c", paper:"#0b2c32", raised:"#153e46", line:"#578f99", ink:"#e9fcff", muted:"#add4da", accent:"#86e3ef", action:"#166b78", selected:"#1b4e59", secondary:"#9ecbcc" },
  "white-snow": { name:"White Snow", canvas:"#f3f7fb", paper:"#ffffff", raised:"#eaf0f6", line:"#8095aa", ink:"#182b3e", muted:"#485c70", accent:"#42627f", action:"#345470", selected:"#dce8f2", secondary:"#536b83" },
  ice: { name:"Ice", canvas:"#d9f1fa", paper:"#f3fcff", raised:"#c3e6f2", line:"#507e91", ink:"#103745", muted:"#365d6c", accent:"#005d72", action:"#006477", selected:"#b2deeb", secondary:"#216f86" },
  fire: { name:"Fire", canvas:"#140e0b", paper:"#281b16", raised:"#3b271d", line:"#9c715b", ink:"#fff5ed", muted:"#e2c0a7", accent:"#ffb775", action:"#a9431d", selected:"#50301e", secondary:"#f6cd86" },
} as const;

export function additionalPalette(mode:string) {
  return Object.hasOwn(additionalThemes, mode) ? additionalThemes[mode as keyof typeof additionalThemes] : undefined;
}
export const additionalThemeIsDark=(mode:string)=>Boolean(additionalPalette(mode))&&mode!=="white-snow"&&mode!=="ice";

export const additionalThemeStyles = Object.fromEntries(Object.entries(additionalThemes).map(([id,p]) => [`.theme-personality.theme-${id}`, {
  "--canvas":p.canvas, "--paper":p.paper, "--surface-raised":p.raised, "--line":p.line,
  "--ink":p.ink, "--muted":p.muted, "--green":p.accent, "--green-dark":p.action, "--pale":p.selected,
  "--theme-shadow":additionalThemeIsDark(id)?"0 4px 16px #00000030":"0 4px 16px #29435b14", colorScheme:additionalThemeIsDark(id)?"dark":"light",
  ...(id==="fire"?{"--accent-ink":p.canvas}:{}),
}]));
