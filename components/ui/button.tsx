import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "ink" | "line" | "quiet";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ variant = "ink", className, ...rest }, ref) {
    const v =
      variant === "ink" ? "btn-ink" :
      variant === "line" ? "btn-line" :
      "btn-quiet";
    return <button ref={ref} className={cn(v, className)} {...rest} />;
  }
);
