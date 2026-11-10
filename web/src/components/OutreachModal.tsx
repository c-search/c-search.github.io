// Janela de abordagem: escolhe o tipo de oferta e a demonstração, vê a prévia no "WhatsApp" e envia.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Copy, ExternalLink, MessageCircle, Pencil, Phone, RotateCcw, X } from "lucide-react";
import { cn, telLink, type Lead } from "@/lib";
import { exampleLink, type ExampleData } from "@/engine/example";
import { CORES_SUGERIDAS } from "@/engine/niches";
import { ABORDAGENS, abordagemPadrao, demoDaAbordagem, mensagemAbordagem, type Abordagem } from "@/engine/outreach";
import { brl, proposta } from "@/engine/pricing";
import { VerifBadge } from "./Results";

type Props = {
  lead: Lead;
  meuNome: string;
  meuWhats: string;
  onClose: () => void;
  onSent: (l: Lead) => void;
  onCopy: (texto: string) => void;
};

const DEMOS: { id: ExampleData["k"]; nome: string }[] = [
  { id: "site", nome: "Site / landing page" },
  { id: "cardapio", nome: "Cardápio digital" },
  { id: "portfolio", nome: "Site + portfólio" },
];

export function OutreachModal({ lead: l, meuNome, meuWhats, onClose, onSent, onCopy }: Props) {
  const [abordagem, setAbordagem] = useState<Abordagem>(() => abordagemPadrao(l));
  const [demo, setDemo] = useState<ExampleData["k"]>(() => demoDaAbordagem(abordagemPadrao(l), l));
  const [cor, setCor] = useState<string | undefined>();
  const [frase, setFrase] = useState("");
  const [aba, setAba] = useState<"conversa" | "demo">("conversa");
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState<string | null>(null); // null = mensagem automática
  const [gerando, setGerando] = useState(true);

  const link = useMemo(() => exampleLink(l, { meuNome, meuWhats, cor, frase, tipo: demo }), [l, meuNome, meuWhats, cor, frase, demo]);
  const automatica = mensagemAbordagem(abordagem, l, link, meuNome);
  const msg = texto ?? automatica;
  const p = proposta(l);
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // pequena "montagem" visual ao trocar a demonstração
  useEffect(() => {
    setGerando(true);
    const t = setTimeout(() => setGerando(false), 900);
    return () => clearTimeout(t);
  }, [link]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  function trocarAbordagem(a: Abordagem) {
    setAbordagem(a);
    setDemo(demoDaAbordagem(a, l));
    setTexto(null);
    setEditando(false);
  }

  // se o texto foi editado, mantém o link atualizado
  const msgFinal = texto !== null ? texto.replace(/https?:\/\/\S*#\/exemplo\?d=\S+/g, link) : msg;
  const waUrl = l.whatsapp ? `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(msgFinal)}` : "";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-white/10 md:flex-row">

        {/* Celular com a conversa / demo */}
        <div className="flex shrink-0 flex-col items-center gap-3 bg-black/50 p-4 md:p-6">
          <div className="flex rounded-full bg-white/5 p-1 text-xs ring-1 ring-white/10">
            {(["conversa", "demo"] as const).map((x) => (
              <button key={x} onClick={() => setAba(x)}
                className={cn("rounded-full px-4 py-1.5 font-medium transition cursor-pointer", aba === x ? "bg-foreground text-background" : "text-muted-foreground")}>
                {x === "conversa" ? "Mensagem" : "Demonstração"}
              </button>
            ))}
          </div>
          <div className="relative h-[460px] w-[260px] overflow-hidden rounded-[2.2rem] bg-[#0b141a] ring-[7px] ring-neutral-800 md:h-[600px] md:w-[320px]">
            {aba === "conversa" ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 bg-[#202c33] px-4 pb-3 pt-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-600 text-sm font-semibold text-white">
                    {l.nome.replace(/^\[DEMO\]\s*/, "").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{l.nome.replace(/^\[DEMO\]\s*/, "")}</div>
                    <div className="text-[11px] text-white/50">{l.telefone || "sem telefone"}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4" style={{ background: "#0b141a radial-gradient(circle at 20% 20%, rgba(255,255,255,.025) 1px, transparent 1px) 0 0/18px 18px" }}>
                  <div className="mx-auto mb-3 w-fit rounded-md bg-[#182229] px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/50">Hoje</div>
                  <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-[#005c4b] p-1.5 text-[13px] leading-snug text-[#e9edef] shadow">
                    {/* prévia do link, como o WhatsApp mostra */}
                    <button onClick={() => setAba("demo")} className="mb-1.5 block w-full overflow-hidden rounded-lg bg-[#025144] text-left cursor-pointer">
                      <div className="relative h-28 overflow-hidden bg-black">
                        {gerando ? (
                          <div className="flex h-full items-center justify-center text-[11px] text-white/60">Montando demonstração…</div>
                        ) : (
                          <iframe src={link} title="miniatura" tabIndex={-1} className="pointer-events-none h-[560px] w-[320px] origin-top-left scale-[0.84] border-0" />
                        )}
                      </div>
                      <div className="px-2.5 py-2">
                        <div className="truncate text-[12px] font-semibold">{l.nome.replace(/^\[DEMO\]\s*/, "")}</div>
                        <div className="truncate text-[11px] text-white/60">{DEMOS.find((d) => d.id === demo)?.nome} · demonstração</div>
                      </div>
                    </button>
                    <div className="whitespace-pre-line break-words px-1.5 pb-1">{msgFinal}</div>
                    <div className="flex items-center justify-end gap-1 px-1.5 text-[10px] text-white/55">{hora} <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" /></div>
                  </div>
                </div>
              </div>
            ) : gerando ? (
              <div className="flex h-full items-center justify-center text-sm text-white/60">Montando demonstração…</div>
            ) : (
              <iframe key={link} src={link} title="Demonstração" className="h-full w-full border-0 bg-white" />
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Abordagem para</div>
              <h3 className="truncate text-2xl font-medium tracking-tight">{l.nome}</h3>
              <div className="text-xs text-muted-foreground">{l.categoria}{l.endereco ? ` · ${l.endereco}` : ""}</div>
              <VerifBadge lead={l} />
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-5 w-5" /></button>
          </div>

          {l.verificacao?.status === "site" && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/20">
              Esse lugar já tem site. Talvez valha oferecer <b>consultoria</b> (vídeos, perfil no Google) em vez de um site novo.
            </div>
          )}

          <Passo n={1} t="O que você vai oferecer">
            <div className="grid grid-cols-2 gap-2">
              {ABORDAGENS.map((a) => (
                <button key={a.id} onClick={() => trocarAbordagem(a.id)}
                  className={cn("rounded-xl p-3 text-left transition cursor-pointer ring-1",
                    abordagem === a.id ? "bg-foreground text-background ring-foreground" : "ring-white/10 hover:ring-white/30")}>
                  <div className="text-sm font-semibold">{a.nome}</div>
                  <div className={cn("text-xs", abordagem === a.id ? "text-black/60" : "text-muted-foreground")}>{a.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Sugestão de preço: <b className="text-foreground">{p.pacote} · {brl(p.valor)}</b></div>
          </Passo>

          <Passo n={2} t="Demonstração que vai junto">
            <div className="flex flex-wrap gap-1.5">
              {DEMOS.map((d) => (
                <button key={d.id} onClick={() => setDemo(d.id)}
                  className={cn("rounded-full px-3 py-1.5 text-xs transition cursor-pointer", demo === d.id ? "bg-foreground text-background" : "ring-1 ring-white/15 text-muted-foreground hover:text-foreground")}>
                  {d.nome}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => setCor(undefined)}
                className={cn("flex h-7 items-center rounded-full px-2.5 text-[11px] cursor-pointer", !cor ? "bg-foreground text-background" : "ring-1 ring-white/15 text-muted-foreground")}>Cor auto</button>
              {CORES_SUGERIDAS.map((c) => (
                <button key={c} onClick={() => setCor(c)} aria-label={c}
                  className={cn("h-7 w-7 rounded-full transition cursor-pointer", cor === c && "ring-2 ring-white ring-offset-2 ring-offset-black")} style={{ background: c }} />
              ))}
            </div>
            <input defaultValue={frase} onBlur={(e) => setFrase(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              placeholder="Frase de destaque (opcional): Ex.: A melhor pizza da Mooca"
              className="mt-3 h-9 w-full rounded-lg bg-black/40 px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40" />
            <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" /> Abrir a demonstração em tela cheia
            </a>
          </Passo>

          <Passo n={3} t="Mensagem">
            {editando ? (
              <textarea value={msgFinal} onChange={(e) => setTexto(e.target.value)} rows={9}
                className="w-full rounded-lg bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40" />
            ) : (
              <p className="text-sm text-muted-foreground">A mensagem está na prévia ao lado, já com o link da demonstração.</p>
            )}
            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={() => setEditando(!editando)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                {editando ? <><Check className="h-3.5 w-3.5" /> Pronto</> : <><Pencil className="h-3.5 w-3.5" /> Editar texto</>}
              </button>
              {texto !== null && (
                <button onClick={() => { setTexto(null); setEditando(false); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                  <RotateCcw className="h-3.5 w-3.5" /> Voltar ao automático
                </button>
              )}
            </div>
            {!meuNome && <p className="mt-2 text-xs text-amber-200/80">Dica: coloque seu nome e WhatsApp em Configurações para aparecerem na mensagem e na demonstração.</p>}
          </Passo>

          <div className="mt-6 space-y-2">
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noreferrer" onClick={() => onSent(l)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-semibold text-[#06260f] transition hover:brightness-110">
                <MessageCircle className="h-5 w-5" /> Enviar no WhatsApp
              </a>
            ) : (
              <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                Esse número {l.telefone ? "parece ser fixo" : "não foi encontrado"}: copie a mensagem e mande pelo WhatsApp Business, e-mail ou Instagram do lugar.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { onCopy(msgFinal); onSent(l); }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm ring-1 ring-white/15 hover:bg-white/5 cursor-pointer">
                <Copy className="h-4 w-4" /> Copiar mensagem
              </button>
              {l.telefone ? (
                <a href={telLink(l.telefone)} className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm ring-1 ring-white/15 hover:bg-white/5">
                  <Phone className="h-4 w-4" /> Ligar
                </a>
              ) : (
                <a href={l.maps_url} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm ring-1 ring-white/15 hover:bg-white/5">
                  <ExternalLink className="h-4 w-4" /> Ver no Maps
                </a>
              )}
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Ao enviar ou copiar, o lugar vai para Meus leads como "Contatado".</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Passo({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">{n}</span>{t}
      </div>
      {children}
    </div>
  );
}
