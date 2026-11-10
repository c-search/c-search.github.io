import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Download, FileDown, FileUp, MapPin, MessageCircle, MessageSquareText, Phone, Sparkles, Trash2 } from "lucide-react";
import { cn, downloadCsv, nivelTone, telLink, waLink, type SavedLead } from "@/lib";
import { Button, Input, SectionTitle, Stat } from "./ui";
import { ProposalChip } from "./Proposal";
import { VerifBadge } from "./Results";
import { brl, proposta } from "@/engine/pricing";
import { diasParado, precisaRetorno } from "@/engine/store";
import { mensagemRetorno, respostasProntas } from "@/engine/replies";

type Props = {
  leads: SavedLead[];
  statuses: string[];
  template: string;
  onUpdate: (id: string, status: string, anotacoes: string, extra?: Partial<SavedLead>) => void;
  onDeleteAll: () => void;
  onExample: (l: SavedLead) => void;
  onFollowUp: (l: SavedLead) => void;
  onCopy: (texto: string) => void;
  onBackup: () => void;
  onRestore: (f: File) => void;
};

const waTexto = (numero: string, texto: string) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

export function SavedLeads(props: Props) {
  const { leads, statuses, template, onUpdate, onDeleteAll } = props;
  const [filtro, setFiltro] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach((l) => (c[l.status] = (c[l.status] || 0) + 1));
    return c;
  }, [leads]);

  const chamados = leads.filter((l) => l.status !== "Novo").length;
  const responderam = leads.filter((l) => ["Respondeu", "Negociando", "Fechado"].includes(l.status)).length;
  const fechados = leads.filter((l) => l.status === "Fechado");
  const faturado = fechados.reduce((s, l) => s + (l.valor ?? proposta(l).valor), 0);
  const retornar = leads.filter(precisaRetorno);

  const view = leads
    .filter((l) => (filtro ? l.status === filtro : !["Fechado", "Descartado"].includes(l.status)))
    .filter((l) => !q || `${l.nome} ${l.categoria} ${l.busca}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section id="leads" className="px-6 md:px-12 lg:px-28 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="Seu funil de vendas" title="Meus" accent="leads." />

        {/* Painel de vendas */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Chamados" value={chamados} />
          <Stat label="Responderam" value={<>{responderam}<span className="ml-2 text-sm font-normal text-muted-foreground">{chamados ? Math.round((responderam / chamados) * 100) : 0}%</span></>} />
          <Stat label="Fechados" value={fechados.length} />
          <Stat label="Faturado" value={brl(faturado)} />
        </div>

        {/* Lembretes de retorno */}
        {retornar.length > 0 && (
          <div className="mb-6 rounded-2xl bg-card p-4 ring-1 ring-white/15">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <BellRing className="h-4 w-4" /> Para retornar hoje <span className="text-muted-foreground">· sem resposta há {3}+ dias</span>
            </div>
            <div className="space-y-2">
              {retornar.slice(0, 6).map((l) => (
                <div key={l.place_id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.status} há {diasParado(l)} dias{l.retornos ? ` · ${l.retornos} retorno${l.retornos > 1 ? "s" : ""} enviado${l.retornos > 1 ? "s" : ""}` : ""}
                    </div>
                  </div>
                  {l.whatsapp ? (
                    <a href={waTexto(l.whatsapp, mensagemRetorno(l))} target="_blank" rel="noreferrer" onClick={() => props.onFollowUp(l)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90">
                      <MessageCircle className="h-4 w-4" /> Mandar 2ª mensagem
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { props.onCopy(mensagemRetorno(l)); props.onFollowUp(l); }}>Copiar 2ª mensagem</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          <StatusPill active={filtro === null} onClick={() => setFiltro(null)} label="Em andamento"
            n={leads.filter((l) => !["Fechado", "Descartado"].includes(l.status)).length} />
          {statuses.map((s) => (
            <StatusPill key={s} active={filtro === s} onClick={() => setFiltro(s)} label={s} n={counts[s] || 0} />
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar lead…" className="h-8 md:w-64" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!leads.length}
              onClick={() => downloadCsv(leads, "csearch_meus_leads.csv", ["status", "anotacoes", "valor", "busca", "encontrado_em"])}>
              <Download className="h-4 w-4" /> Excel (CSV)
            </Button>
            <Button size="sm" variant="outline" onClick={props.onBackup} title="Baixa um arquivo com seus leads, verificações e configurações">
              <FileDown className="h-4 w-4" /> Backup
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} title="Restaurar de um arquivo de backup">
              <FileUp className="h-4 w-4" /> Restaurar
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) props.onRestore(f); e.target.value = ""; }} />
            {confirmar ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setConfirmar(false)}>Cancelar</Button>
                <Button size="sm" className="bg-red-500 text-white" onClick={() => { onDeleteAll(); setConfirmar(false); }}>
                  Apagar {leads.length} leads, sem volta
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" disabled={!leads.length} onClick={() => setConfirmar(true)}>
                <Trash2 className="h-4 w-4" /> Apagar todos
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-white/5">
          {view.map((l) => (
            <Row key={l.place_id} {...props} lead={l} wa={waLink(l, template)} />
          ))}
          {!view.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {leads.length ? "Nenhum lead nesse status." : "Nenhum lead salvo ainda. Faça uma busca e clique em Salvar."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ active, onClick, label, n }: { active: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition cursor-pointer",
        active ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-white/5 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("tabular-nums font-semibold", active ? "text-background" : "text-foreground")}>{n}</span>
    </button>
  );
}

function Row({ lead: l, statuses, wa, onUpdate, onExample, onCopy }: Props & { lead: SavedLead; wa: string }) {
  const [nota, setNota] = useState(l.anotacoes || "");
  const [resp, setResp] = useState(false);
  const tone = nivelTone(l.score);
  const sugerido = proposta(l).valor;

  return (
    <div className="border-b border-white/5 px-5 py-4 last:border-0">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[150px_1fr_1fr_auto] lg:items-center">
        <div className="space-y-2">
          <select
            value={l.status}
            onChange={(e) => onUpdate(l.place_id, e.target.value, nota, e.target.value === "Fechado" && l.valor == null ? { valor: sugerido } : {})}
            className="h-9 w-full rounded-lg bg-white/[0.03] px-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40 cursor-pointer"
          >
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          {l.status === "Fechado" && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              R$
              <input
                type="number"
                defaultValue={l.valor ?? sugerido}
                onBlur={(e) => onUpdate(l.place_id, l.status, nota, { valor: Number(e.target.value) || 0 })}
                className="h-7 w-full rounded-md bg-white/[0.03] px-2 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-white/40"
                title="Quanto você fechou com esse cliente"
              />
            </label>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
            <span className="truncate font-medium">{l.nome}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {l.categoria} · salvo em {l.encontrado_em}
            {l.status !== "Novo" && l.status_em && <> · {l.status.toLowerCase()} há {diasParado(l)}d</>}
          </div>
          <VerifBadge lead={l} />
          <ProposalChip lead={l} />
        </div>

        <Input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onBlur={() => nota !== (l.anotacoes || "") && onUpdate(l.place_id, l.status, nota)}
          placeholder="Anotações (ex.: ligar sexta, falar com o dono)"
          className="h-9"
        />

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button size="sm" variant="outline" onClick={() => onExample(l)} title="Gerar exemplo pronto para mandar">
            <Sparkles className="h-4 w-4" /> Abordar
          </Button>
          <Button size="icon" variant={resp ? "solid" : "outline"} onClick={() => setResp(!resp)} title="Respostas prontas">
            <MessageSquareText className="h-4 w-4" />
          </Button>
          {l.telefone && (
            <a href={telLink(l.telefone)} title={l.telefone} className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10 hover:bg-white/5">
              <Phone className="h-4 w-4" />
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" onClick={() => l.status === "Novo" && onUpdate(l.place_id, "Contatado", nota)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          <a href={l.maps_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10 hover:bg-white/5">
            <MapPin className="h-4 w-4" />
          </a>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {resp && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {respostasProntas(l).map((r) => (
                <div key={r.pergunta} className="flex flex-col rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Se disserem: "{r.pergunta}"</div>
                  <p className="flex-1 text-sm">{r.texto}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onCopy(r.texto)}>Copiar</Button>
                    {l.whatsapp && (
                      <a href={waTexto(l.whatsapp, r.texto)} target="_blank" rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm ring-1 ring-white/10 hover:bg-white/5">
                        <MessageCircle className="h-4 w-4" /> Enviar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
