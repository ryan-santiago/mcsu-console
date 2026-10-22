export const PALETTES = ["qserv", "ember", "midnight", "graphite"] as const;
export type Palette = (typeof PALETTES)[number];
export const DEFAULT_PALETTE: Palette = "qserv";
export const PALETTE_STORAGE_KEY = "mcsu-palette";

export const PALETTE_LABELS: Record<Palette, string> = {
  qserv: "QSERV Blue",
  ember: "Ember",
  midnight: "Midnight",
  graphite: "Graphite",
};

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && (PALETTES as readonly string[]).includes(value);
}

/**
 * Runs before first paint (inlined in <head>) so the saved palette never flashes.
 * Kept dependency-free and tiny; it only reads localStorage. Milestone 1.9 syncs the value
 * from User.preferences into localStorage after sign-in.
 */
export const paletteInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  PALETTE_STORAGE_KEY,
)});if(${JSON.stringify(PALETTES)}.indexOf(p)<0)p=${JSON.stringify(DEFAULT_PALETTE)};document.documentElement.setAttribute("data-palette",p)}catch(e){document.documentElement.setAttribute("data-palette",${JSON.stringify(DEFAULT_PALETTE)})}})()`;
