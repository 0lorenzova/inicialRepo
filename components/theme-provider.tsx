"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";

import { interfaceScale, nextInterfaceSize, normalizeInterfaceSize, type InterfaceSize } from "@/lib/interface-size";

export const themeNames = { light: "Claro", dark: "Oscuro", metallic: "Metálico", organic: "Orgánico / Naturaleza", silver: "Silver" };
export type ColorMode = keyof typeof themeNames;
export const themeClass = (mode: ColorMode) => `${mode === "dark" || mode === "metallic" ? "dark-mode" : ""} theme-${mode}`;
const ThemeModeContext = createContext<{ mode: ColorMode; setMode: (mode: ColorMode) => void; toggleMode: () => void; size:InterfaceSize; scale:number; cycleSize:()=>void }>({ mode: "light", setMode: () => {}, toggleMode: () => {}, size:0, scale:1, cycleSize:()=>{} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [size,setSize]=useState<InterfaceSize>(0);
  const scale=interfaceScale(size);
  const [mode, setMode] = useState<ColorMode>("light");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedMode = window.localStorage.getItem("color-mode");
      if (savedMode && Object.hasOwn(themeNames, savedMode)) setMode(savedMode as ColorMode);
      setSize(normalizeInterfaceSize(window.localStorage.getItem("interface-size")));
      setPreferencesLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (preferencesLoaded) window.localStorage.setItem("color-mode", mode);
  }, [mode, preferencesLoaded]);

  useEffect(()=>{
    document.documentElement.style.setProperty("--ui-scale",String(scale));
    document.documentElement.dataset.interfaceSize=String(size);
    if(preferencesLoaded)window.localStorage.setItem("interface-size",String(size));
  },[size,scale,preferencesLoaded]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: mode === "dark" || mode === "metallic" ? "dark" : "light",
      primary: { main: mode === "silver" ? "#3e566e" : mode === "organic" ? "#32602a" : mode === "dark" ? "#68e1ce" : mode === "metallic" ? "#4d8da4" : "#0b969f", dark: mode === "silver" ? "#30455b" : mode === "organic" ? "#294e24" : "#087f88", light: mode === "silver" ? "#cbd2db" : mode === "organic" ? "#ccdbb3" : mode === "dark" ? "#163d36" : "#e2f4f3" },
      secondary: { main: mode === "organic" ? "#785b35" : "#d29c58" },
      background: mode === "silver" ? { default: "#b7bfc8", paper: "#e0e4e9" } : mode === "metallic" ? { default: "#151c26", paper: "#253141" } : mode === "organic" ? { default: "#bbc9a4", paper: "#e5ebd3" } : mode === "dark" ? { default: "#050809", paper: "#172026" } : { default: "#f7f7f3", paper: "#ffffff" },
      text: mode === "silver" ? { primary: "#1a2633", secondary: "#414f5f" } : mode === "metallic" ? { primary: "#f1f5fa", secondary: "#bac8d6" } : mode === "organic" ? { primary: "#20351f", secondary: "#465338" } : mode === "dark" ? { primary: "#f4f7fa", secondary: "#b8c5cf" } : { primary: "#202c25", secondary: "#7b837d" },
      divider: mode === "dark" ? "#4a5a65" : mode === "silver" ? "#8795a5" : mode === "organic" ? "#82936e" : undefined,
      success: { main: "#4d8b69" },
    },
    typography: {
      fontSize:14*scale,
      fontFamily: "Arial, Helvetica, sans-serif",
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
  }), [mode,scale]);

  const toggleMode = () => setMode((current) => { const modes = Object.keys(themeNames) as ColorMode[]; return modes[(modes.indexOf(current) + 1) % modes.length]; });

  return <ThemeModeContext.Provider value={{ mode, setMode, toggleMode, size, scale, cycleSize:()=>setSize(nextInterfaceSize) }}><MuiThemeProvider theme={theme}><CssBaseline />{children}</MuiThemeProvider></ThemeModeContext.Provider>;
}
