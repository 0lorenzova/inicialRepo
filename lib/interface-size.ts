export const interfaceSizes = ["Normal", "Grande", "Muy grande", "Extra grande"] as const;
export type InterfaceSize = 0 | 1 | 2 | 3;
export const interfaceScale = (size:InterfaceSize) => [1,1.12,1.25,1.4][size];
export const normalizeInterfaceSize = (value:unknown):InterfaceSize => value===1||value==="1"?1:value===2||value==="2"?2:value===3||value==="3"?3:0;
export const nextInterfaceSize = (size:InterfaceSize):InterfaceSize => ((size+1)%interfaceSizes.length) as InterfaceSize;
