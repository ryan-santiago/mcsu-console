"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { PALETTES, PALETTE_LABELS } from "@/components/theme/palette";
import { usePalette } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Mode + palette (docs/05 §3). Saved to User.preferences in milestone 1.9. */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme">
          <Sun className="dark:hidden" aria-hidden />
          <Moon className="hidden dark:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        {MODES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon aria-hidden /> {label}
            {theme === value ? <Check className="ml-auto" aria-label="selected" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="size-4" aria-hidden /> Palette
        </DropdownMenuLabel>
        {PALETTES.map((value) => (
          <DropdownMenuItem key={value} onSelect={() => setPalette(value)}>
            {PALETTE_LABELS[value]}
            {palette === value ? <Check className="ml-auto" aria-label="selected" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
