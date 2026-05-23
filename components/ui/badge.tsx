import { cn } from "@/lib/cn";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center text-[0.65rem] tracking-[0.2em] uppercase",
      "px-2 py-1 border border-hairline rounded-[2px] text-muted",
      className
    )}>
      {children}
    </span>
  );
}
