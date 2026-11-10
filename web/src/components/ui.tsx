import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib";

// Componentes no estilo shadcn/ui, adaptados ao tema preto e branco.

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
  {
    variants: {
      variant: {
        solid: "bg-foreground text-background hover:opacity-90",
        glass: "liquid-glass text-foreground hover:bg-white/5",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-white/5",
        outline: "border border-border text-foreground hover:bg-white/5",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-lg",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "px-8 py-3.5 text-base rounded-full",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg bg-white/[0.03] px-3 text-sm text-foreground placeholder:text-neutral-500 outline-none ring-1 ring-white/10 focus:ring-white/40 transition",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "h-8 rounded-full px-3 text-sm transition ring-1 cursor-pointer",
        checked ? "bg-foreground text-background ring-foreground" : "text-muted-foreground ring-white/10 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-white/5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${score}%`, opacity: 0.35 + score / 160 }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{score}</span>
    </div>
  );
}

export function SectionTitle({ kicker, title, accent }: { kicker: string; title: string; accent: string }) {
  return (
    <div className="mb-8">
      <div className="mb-2 text-sm font-medium text-muted-foreground">{kicker}</div>
      <h2 className="text-3xl md:text-5xl font-medium tracking-[-1.5px] leading-tight">
        {title} <span className="font-serif italic font-normal">{accent}</span>
      </h2>
    </div>
  );
}
