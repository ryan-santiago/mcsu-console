import Image from "next/image";
import { cn } from "@/lib/utils";

/** Full lockup: colour on light surfaces, white on dark (docs/05 §1). */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-block", className)}>
      <Image
        src="/brand/logo.png"
        alt="QSERV MCSU"
        width={1484}
        height={264}
        priority={priority}
        className="h-auto w-full dark:hidden"
      />
      <Image
        src="/brand/logo-white.png"
        alt="QSERV MCSU"
        width={1484}
        height={264}
        priority={priority}
        className="hidden h-auto w-full dark:block"
      />
    </span>
  );
}

/** The QSERV mark, for collapsed sidebar and mobile app bar. */
export function Mark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block", className)}>
      <Image
        src="/brand/mark.png"
        alt=""
        width={208}
        height={228}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/brand/mark-white.png"
        alt=""
        width={208}
        height={228}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
