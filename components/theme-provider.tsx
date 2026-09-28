"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";

type ColorMode = "light" | "dark";
const ThemeModeContext = createContext<{ mode: ColorMode; toggleMode: () => void }>({ mode: "light", toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<ColorMode>("light");

  useEffect(() => {
    const savedMode = window.localStorage.getItem("color-mode");
    if (savedMode === "light" || savedMode === "dark") setMode(savedMode);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("color-mode", mode);
  }, [mode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: "#70aa82", dark: "#174531", light: "#e6efe9" },
      secondary: { main: "#d29c58" },
      background: mode === "dark" ? { default: "#121916", paper: "#1c2520" } : { default: "#f7f7f3", paper: "#ffffff" },
      text: mode === "dark" ? { primary: "#edf2ed", secondary: "#aab4ac" } : { primary: "#202c25", secondary: "#7b837d" },
      success: { main: "#4d8b69" },
    },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
  }), [mode]);

  const toggleMode = () => setMode((current) => current === "light" ? "dark" : "light");

  return <ThemeModeContext.Provider value={{ mode, toggleMode }}><MuiThemeProvider theme={theme}><CssBaseline />{children}</MuiThemeProvider></ThemeModeContext.Provider>;
}