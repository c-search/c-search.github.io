import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Lightbulb, Repeat } from "lucide-react";
import { cn, type Lead } from "@/lib";
import { brl, proposta } from "@/engine/pricing";

/** Chip compacto "Pacote · R$ X" que abre um cartão curto com o que oferecer. */
export function ProposalChip({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const p = proposta(lead);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-2 text-xs transition cursor-pointer ring-1",
          open ? "bg-foreground text-background ring-foreground" : "ring-white/15 hover:ring-white/40",
        )}
      >
        <span className="font-medium">{p.pacote}</span>
        <span className={cn("font-semibold tabular-nums", open ? "" : "text-foreground")}>{brl(p.valor)}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-w-md rounded-xl bg-black/40 p-3 ring-1 ring-white/10">
              <div className="space-y-1.5">
                {p.itens.map((i) => (
                  <div key={i.nome} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{i.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{i.preco}</span>
                  </div>
                ))}
              </div>
              <div className="my-2.5 h-px bg-white/10" />
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Cobre no pacote</span>
                <span className="text-lg font-semibold tracking-tight tabular-nums">{brl(p.valor)}</span>
              </div>
              {p.mensal && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Repeat className="h-3 w-3" /> + {p.mensal.nome}</span>
                  <span className="tabular-nums">{p.mensal.preco}</span>
                </div>
              )}
              <div className="mt-2.5 flex gap-1.5 text-xs text-neutral-300">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" /> {p.dica}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
