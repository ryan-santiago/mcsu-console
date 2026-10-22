"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { PALETTES, PALETTE_LABELS } from "@/components/theme/palette";
import { usePalette } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribe = () => () => {};
/** True only after hydration, so the selected state never mismatches the server HTML. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  const mounted = useMounted();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div role="group" aria-label="Mode" className="flex gap-1">
        {MODES.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            size="sm"
            variant={mounted && theme === value ? "default" : "outline"}
            aria-pressed={mounted && theme === value}
            onClick={() => setTheme(value)}
          >
            <Icon aria-hidden /> {label}
          </Button>
        ))}
      </div>
      <div role="group" aria-label="Palette" className="flex flex-wrap gap-1">
        {PALETTES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={mounted && palette === value ? "default" : "outline"}
            aria-pressed={mounted && palette === value}
            onClick={() => setPalette(value)}
          >
            {PALETTE_LABELS[value]}
          </Button>
        ))}
      </div>
    </div>
  );
}
