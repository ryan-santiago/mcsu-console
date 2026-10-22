/**
 * WCAG AA contrast check for every palette × mode (docs/05-design-system.md §3).
 * Parses the token blocks in src/app/globals.css, layers them the same way the browser does
 * (:root → :root.dark → palette light/dark), and checks the text/background pairs.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

type Tokens = Record<string, string>;

function block(selector: string): Tokens {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!match?.[1]) return {};
  const tokens: Tokens = {};
  for (const [, name, value] of match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (name && value) tokens[name] = value.trim();
  }
  return tokens;
}

const PALETTES = ["qserv", "ember", "midnight", "graphite"] as const;
const MODES = ["light", "dark"] as const;

function tokensFor(palette: (typeof PALETTES)[number], mode: (typeof MODES)[number]): Tokens {
  const layers = [block(":root")];
  if (mode === "dark") layers.push(block(":root.dark"));
  if (palette !== "qserv") {
    layers.push(
      mode === "dark"
        ? block(`:root.dark[data-palette="${palette}"]`)
        : block(`:root[data-palette="${palette}"]:not(.dark)`),
    );
  }
  return Object.assign({}, ...layers) as Tokens;
}

function resolve(tokens: Tokens, name: string, depth = 0): string {
  const value = tokens[name];
  if (!value) throw new Error(`token --${name} is not defined`);
  const ref = /^var\(--([\w-]+)\)$/.exec(value);
  if (ref?.[1] && depth < 10) return resolve(tokens, ref[1], depth + 1);
  return value;
}

type Rgb = [number, number, number];

/** oklch(L C H) → sRGB (0–1, gamma-encoded), clamped to gamut. */
function oklchToRgb(value: string): Rgb {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value);
  if (!m) throw new Error(`unsupported colour: ${value}`);
  const [L, C, H] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180];
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return linear.map((c) => {
    const v = Math.min(1, Math.max(0, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  }) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** A colour at `alpha` over a solid background (how the *-soft pill fills render). */
function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return fg.map((c, i) => c * alpha + (bg[i] ?? 0) * (1 - alpha)) as Rgb;
}

const TEXT_PAIRS: [text: string, surface: string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "card"],
  ["muted-foreground", "background"],
  ["accent-foreground", "accent"],
  ["accent-signal-foreground", "accent-signal"],
  ["sidebar-foreground", "sidebar"],
  ["destructive", "card"],
];

// Status pills: text-<status> on bg-<status>-soft, laid over the card.
const PILL_PAIRS: [status: string, alpha: number][] = [
  ["success", 0.14],
  ["warning", 0.14],
  ["info", 0.14],
  ["destructive", 0.12],
];

describe.each(PALETTES)("palette %s", (palette) => {
  describe.each(MODES)("%s mode", (mode) => {
    const tokens = tokensFor(palette, mode);
    const rgb = (name: string) => oklchToRgb(resolve(tokens, name));

    it.each(TEXT_PAIRS)("%s on %s ≥ 4.5:1", (text, surface) => {
      expect(contrast(rgb(text), rgb(surface))).toBeGreaterThanOrEqual(4.5);
    });

    it.each(PILL_PAIRS)("%s pill text ≥ 4.5:1", (status, alpha) => {
      const card = rgb("card");
      expect(contrast(rgb(status), over(rgb(status), alpha, card))).toBeGreaterThanOrEqual(4.5);
    });

    it("primary is distinguishable from the card (UI ≥ 3:1)", () => {
      expect(contrast(rgb("primary"), rgb("card"))).toBeGreaterThanOrEqual(3);
    });
  });
});
