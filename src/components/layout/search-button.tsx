"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPEN_COMMAND_MENU } from "./command-menu";

export function SearchButton() {
  const open = () => window.dispatchEvent(new Event(OPEN_COMMAND_MENU));
  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 w-64 justify-start gap-2 text-muted-foreground md:inline-flex lg:w-80"
        onClick={open}
      >
        <Search aria-hidden /> Search…
        <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">Ctrl K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={open}>
        <Search aria-hidden />
      </Button>
    </>
  );
}
