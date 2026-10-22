"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, isPalette, type Palette } from "./palette";

type PaletteContextValue = { palette: Palette; setPalette: (palette: Palette) => void };
const PaletteContext = createContext<PaletteContextValue | null>(null);

function readPalette(): Palette {
  if (typeof document === "undefined") return DEFAULT_PALETTE;
  const value = document.documentElement.getAttribute("data-palette");
  return isPalette(value) ? value : DEFAULT_PALETTE;
}

/** Mode (light/dark/system) via next-themes; palette via data-palette on <html> (docs/05 §3). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(readPalette);

  const setPalette = useCallback((next: Palette) => {
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode): the palette still applies for this page view
    }
    setPaletteState(next);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PaletteContext value={{ palette, setPalette }}>{children}</PaletteContext>
    </NextThemesProvider>
  );
}

export function usePalette(): PaletteContextValue {
  const value = use(PaletteContext);
  if (!value) throw new Error("usePalette must be used inside <ThemeProvider>");
  return value;
}
