export const interfaceSizes = ["Normal", "Grande", "Muy grande"] as const;
export type InterfaceSize = 0 | 1 | 2;
export const interfaceScale = (size:InterfaceSize) => [1,1.12,1.25][size];
export const normalizeInterfaceSize = (value:unknown):InterfaceSize => value===1||value==="1"?1:value===2||value==="2"?2:0;
export const nextInterfaceSize = (size:InterfaceSize):InterfaceSize => ((size+1)%3) as InterfaceSize;
