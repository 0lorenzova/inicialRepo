"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";

export const themeNames = { light: "Claro", dark: "Oscuro", metallic: "Metálico", organic: "Orgánico / Naturaleza", silver: "Silver" };
export type ColorMode = keyof typeof themeNames;
export const themeClass = (mode: ColorMode) => `${mode === "dark" || mode === "metallic" ? "dark-mode" : ""} theme-${mode}`;
const ThemeModeContext = createContext<{ mode: ColorMode; setMode: (mode: ColorMode) => void; toggleMode: () => void }>({ mode: "light", setMode: () => {}, toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<ColorMode>("light");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedMode = window.localStorage.getItem("color-mode");
      if (savedMode && Object.hasOwn(themeNames, savedMode)) setMode(savedMode as ColorMode);
      setPreferencesLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (preferencesLoaded) window.localStorage.setItem("color-mode", mode);
  }, [mode, preferencesLoaded]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: mode === "dark" || mode === "metallic" ? "dark" : "light",
      primary: { main: mode === "silver" ? "#465c70" : mode === "organic" ? "#477443" : mode === "metallic" ? "#4d8da4" : "#0b969f", dark: "#087f88", light: "#e2f4f3" },
      secondary: { main: "#d29c58" },
      background: mode === "silver" ? { default: "#e5e9ef", paper: "#f6f8fb" } : mode === "metallic" ? { default: "#151c26", paper: "#253141" } : mode === "organic" ? { default: "#f0f1e6", paper: "#fbfcf4" } : mode === "dark" ? { default: "#121916", paper: "#1c2520" } : { default: "#f7f7f3", paper: "#ffffff" },
      text: mode === "silver" ? { primary: "#202e3a", secondary: "#526171" } : mode === "metallic" ? { primary: "#f1f5fa", secondary: "#bac8d6" } : mode === "organic" ? { primary: "#253725", secondary: "#52694b" } : mode === "dark" ? { primary: "#edf2ed", secondary: "#aab4ac" } : { primary: "#202c25", secondary: "#7b837d" },
      success: { main: "#4d8b69" },
    },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
  }), [mode]);

  const toggleMode = () => setMode((current) => { const modes = Object.keys(themeNames) as ColorMode[]; return modes[(modes.indexOf(current) + 1) % modes.length]; });

  return <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}><MuiThemeProvider theme={theme}><CssBaseline />{children}</MuiThemeProvider></ThemeModeContext.Provider>;
}
