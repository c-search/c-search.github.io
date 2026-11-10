// Modo "um por vez": um lugar por tela, botões grandes. Ótimo no celular.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, ThumbsDown, X } from "lucide-react";
import { cn, nivelTone, telLink, waLink, type Lead } from "@/lib";
import { brl, proposta } from "@/engine/pricing";
import { VerifBadge } from "./Results";

type Props = {
  leads: Lead[];
  template: string;
  cidade: string;
  onClose: () => void;
  onContact: (l: Lead) => void;
  onDiscard: (l: Lead) => void;
  onExample: (l: Lead) => void;
  onVerify: (l: Lead) => void;
  checkingIds: Set<string>;
};

export function QuickMode({ leads, template, cidade, onClose, onContact, onDiscard, onExample, onVerify, checkingIds }: Props) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [perguntaQ, setPerguntaQ] = useState<string | null>(null);
  const l = leads[Math.min(i, leads.length - 1)];

  const ir = (d: number) => {
    setDir(d);
    setI((x) => Math.max(0, Math.min(leads.length, x + d)));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, []);

  const acabou = i >= leads.length || !l;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm text-muted-foreground">
          {acabou ? "Fim da lista" : <><span className="font-semibold text-foreground">{i + 1}</span> de {leads.length}</>}
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground cursor-pointer" title="Fechar (Esc)">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-white transition-all" style={{ width: `${(Math.min(i, leads.length) / Math.max(1, leads.length)) * 100}%` }} />
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        <AnimatePresence mode="popLayout" custom={dir}>
          {acabou ? (
            <motion.div key="fim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="text-4xl font-medium tracking-tight">Mandou bem! <span className="font-serif italic font-normal">✓</span></div>
              <p className="mt-2 text-muted-foreground">Você passou por todos os {leads.length} lugares dessa lista.</p>
              <button onClick={onClose} className="mt-6 rounded-full bg-foreground px-6 py-3 font-medium text-background cursor-pointer">Voltar para a lista</button>
            </motion.div>
          ) : (
            <motion.div
              key={l.place_id}
              custom={dir}
              initial={{ x: dir * 300, opacity: 0, rotate: dir * 4 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={{ x: -dir * 300, opacity: 0, rotate: -dir * 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => { if (info.offset.x < -100) ir(1); else if (info.offset.x > 100) ir(-1); }}
              className="w-full max-w-md cursor-grab rounded-3xl bg-card p-6 ring-1 ring-white/10 active:cursor-grabbing"
            >
              <Card l={l} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!acabou && (
        <div className="mx-auto w-full max-w-md space-y-2 px-4 pb-6">
          {waLink(l, template, cidade) ? (
            <a href={waLink(l, template, cidade)} target="_blank" rel="noreferrer" onClick={() => setPerguntaQ(l.place_id)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-base font-semibold text-background">
              <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
            </a>
          ) : l.telefone ? (
            <a href={telLink(l.telefone)} onClick={() => setPerguntaQ(l.place_id)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-base font-semibold text-background">
              <Phone className="h-5 w-5" /> Ligar · {l.telefone}
            </a>
          ) : (
            <a href={l.maps_url} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-base font-semibold text-background">
              <MapPin className="h-5 w-5" /> Sem telefone · ver no Maps
            </a>
          )}
          <div className="grid grid-cols-4 gap-2">
            <Acao onClick={() => ir(-1)} disabled={i === 0} icon={<ChevronLeft className="h-5 w-5" />} label="Voltar" />
            <Acao onClick={() => onExample(l)} icon={<Sparkles className="h-5 w-5" />} label="Exemplo" />
            {l.verificacao ? (
              <Acao onClick={() => { onDiscard(l); ir(1); }} icon={<ThumbsDown className="h-5 w-5" />} label="Descartar" />
            ) : (
              <Acao onClick={() => onVerify(l)} disabled={checkingIds.has(l.place_id)} icon={<ShieldCheck className="h-5 w-5" />} label={checkingIds.has(l.place_id) ? "Verificando" : "Verificar"} />
            )}
            <Acao onClick={() => ir(1)} icon={<ChevronRight className="h-5 w-5" />} label="Pular" />
          </div>
          {perguntaQ === l.place_id && (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10">
              <span>Você mandou?</span>
              <div className="flex gap-2">
                <button onClick={() => { onContact(l); setPerguntaQ(null); ir(1); }} className="rounded-lg bg-foreground px-3 py-1.5 font-semibold text-background cursor-pointer">Sim, mandei</button>
                <button onClick={() => setPerguntaQ(null)} className="rounded-lg px-3 py-1.5 ring-1 ring-white/15 cursor-pointer">Ainda não</button>
              </div>
            </div>
          )}
          <p className="pt-1 text-center text-xs text-neutral-500">Arraste o cartão para os lados ou use as setas do teclado</p>
        </div>
      )}
    </motion.div>
  );
}

function Acao({ onClick, icon, label, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 py-3 text-xs text-muted-foreground ring-1 ring-white/10 transition hover:text-foreground disabled:opacity-30 cursor-pointer">
      {icon}
      {label}
    </button>
  );
}

function Card({ l }: { l: Lead }) {
  const tone = nivelTone(l.score);
  const p = proposta(l);
  return (
    <div className="select-none">
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", tone.text)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} /> {tone.label} · {l.score}
      </div>
      <h3 className="mt-2 text-3xl font-medium leading-tight tracking-tight">{l.nome}</h3>
      <div className="mt-1 text-sm text-muted-foreground">{l.categoria}{l.endereco && <> · {l.endereco}</>}</div>
      {l.avaliacoes !== null && <div className="mt-1 text-sm text-muted-foreground">{l.avaliacoes} avaliações no Google{l.nota ? ` · ${l.nota}★` : ""}</div>}
      <VerifBadge lead={l} />

      <div className="mt-5 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Ofereça o pacote</span>
          <span className="text-sm font-medium">{p.pacote}</span>
        </div>
        <div className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{brl(p.valor)}</div>
        <ul className="mt-3 space-y-1 text-sm text-neutral-300">
          {p.itens.map((it) => <li key={it.nome}>· {it.nome}</li>)}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">💡 {p.dica}</p>
      </div>
    </div>
  );
}
