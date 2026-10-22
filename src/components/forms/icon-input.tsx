"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<typeof InputGroupInput>;

const GROUP = "h-11 rounded-xl bg-card has-[[aria-invalid=true]]:border-destructive";

/** Text input with a leading icon. Works with react-hook-form's register() (ref passes through). */
export function IconInput({ icon: Icon, className, ...props }: InputProps & { icon: LucideIcon }) {
  return (
    <InputGroup className={cn(GROUP, className)}>
      <InputGroupAddon>
        <Icon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput {...props} />
    </InputGroup>
  );
}

/** Password input with a lock icon and a show/hide toggle. */
export function PasswordInput({
  icon: Icon,
  className,
  ...props
}: Omit<InputProps, "type"> & { icon: LucideIcon }) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup className={cn(GROUP, className)}>
      <InputGroupAddon>
        <Icon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput {...props} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
