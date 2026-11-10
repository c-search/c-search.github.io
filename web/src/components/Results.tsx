import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Download, ExternalLink, Globe, List, Loader2, Map as MapIcon, MapPin, MessageCircle, Phone, Save, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { LeadsMap } from "./LeadsMap";
import { precisaConfirmar } from "@/engine/verify";
import { QuickMode } from "./QuickMode";
import { cn, downloadCsv, nivelTone, telLink, waLink, type Lead, type SearchResult } from "@/lib";
import { Button, Input, ScoreBar, SectionTitle, Stat, Toggle } from "./ui";
import { ProposalChip } from "./Proposal";

type Props = {
  result: SearchResult;
  template: string;
  savedIds: Set<string>;
  onSave: (leads: Lead[], busca: string) => void;
  onVerify: (leads: Lead[]) => void;
  verifying: { done: number; total: number } | null;
  verifyingIds: Set<string>;
  onExample: (l: Lead) => void;
  onContact: (l: Lead, busca: string) => void;
  onDiscard: (l: Lead, busca: string) => void;
  fonte?: string;
};

const TIPOS = ["Nenhum", "Só rede social", "Site próprio"] as const;
type VF = "todos" | "pendente" | "sem_site" | "sem_site_maps" | "social" | "site" | "incerto";
const PAGE = 60;

export function Results({ result, fonte, template, savedIds, onSave, onVerify, verifying, verifyingIds, onExample, onContact, onDiscard }: Props) {
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [quick, setQuick] = useState(false);
  const [verifFiltro, setVerifFiltro] = useState<VF>("todos");
  const [lote, setLote] = useState(20);
  // no mapa grátis abre na melhor categoria; nas buscas por tipo (Google Maps etc.) abre em "Todas"
  const [cat, setCat] = useState<string>(fonte === "osm" ? result.ranking[0]?.categoria ?? "" : "");
  const [tipos, setTipos] = useState<Set<string>>(new Set(["Nenhum", "Só rede social"]));
  const [soTel, setSoTel] = useState(false);
  const [soWa, setSoWa] = useState(false);
  const [esconderSalvos, setEsconderSalvos] = useState(false);
  const [q, setQ] = useState("");
  const [limite, setLimite] = useState(PAGE);
  const cidade = result.area.split(",")[0];

  // ordem calculada uma vez, quando a busca chega
  const [ordem] = useState(() => new Map(
    [...result.leads].sort((a, b) => b.score - a.score || (a.avaliacoes ?? 0) - (b.avaliacoes ?? 0)).map((l, i) => [l.place_id, i] as const),
  ));
  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return result.leads
      .filter((l) => !cat || l.categoria === cat)
      // quem já foi verificado continua na lista com o resultado (não some)
      .filter((l) => l.verificacao || tipos.has(l.tipo_site))
      .filter((l) => !soTel || l.telefone)
      .filter((l) => !soWa || l.whatsapp)
      .filter((l) => !esconderSalvos || !savedIds.has(l.place_id))
      .filter((l) => {
        if (verifFiltro === "todos") return true;
        if (verifFiltro === "pendente") return !l.verificacao;
        if (verifFiltro === "sem_site") return l.verificacao?.status === "sem_site" && l.verificacao.confirmado !== false;
        if (verifFiltro === "sem_site_maps") return l.verificacao?.status === "sem_site" && l.verificacao.confirmado === false;
        return l.verificacao?.status === verifFiltro;
      })
      .filter((l) => !termo || `${l.nome} ${l.endereco}`.toLowerCase().includes(termo))
      // ordem fixa da busca: verificar um lugar não faz ele pular para o fim da lista
      .sort((a, b) => (ordem.get(a.place_id) ?? 1e9) - (ordem.get(b.place_id) ?? 1e9));
  }, [result, cat, tipos, soTel, soWa, esconderSalvos, verifFiltro, savedIds, q, ordem]);

  const naoVerificados = filtrados.filter(precisaConfirmar);
  // modo rápido: só quem vale a pena (tira quem já tem site e quem já foi salvo como descartado)
  const rapido = filtrados.filter((l) => l.verificacao?.status !== "site");
  const daCategoria = result.leads.filter((l) => !cat || l.categoria === cat);
  const contagem = {
    sem_site: daCategoria.filter((l) => l.verificacao?.status === "sem_site" && l.verificacao.confirmado !== false).length,
    sem_site_maps: daCategoria.filter((l) => l.verificacao?.status === "sem_site" && l.verificacao.confirmado === false).length,
    social: daCategoria.filter((l) => l.verificacao?.status === "social").length,
    site: daCategoria.filter((l) => l.verificacao?.status === "site").length,
    incerto: daCategoria.filter((l) => l.verificacao?.status === "incerto").length,
  };
  const verificadosTotal = contagem.sem_site + contagem.sem_site_maps + contagem.social + contagem.site + contagem.incerto;

  const temAvaliacoes = result.leads.some((l) => l.avaliacoes !== null);
  const busca = `${cat || "Todas"} - ${cidade}`;

  function toggleTipo(t: string) {
    const n = new Set(tipos);
    n.has(t) ? n.delete(t) : n.add(t);
    setTipos(n);
  }

  return (
    <section id="resultados" className="relative px-6 md:px-12 lg:px-28 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker={result.area} title="Onde estão seus" accent="clientes." />
        {fonte === "osm" && (
          <div className="mb-8 rounded-2xl bg-amber-400/10 px-5 py-4 text-sm text-amber-100 ring-1 ring-amber-300/20">
            <b>Atenção:</b> estes lugares vêm do mapa grátis (OpenStreetMap), que em muitas cidades está desatualizado: nomes antigos,
            lugares que fecharam e sites que ninguém cadastrou. Use para ter ideias de categorias; para prospectar de verdade,
            busque com <b>Google Maps</b> ou verifique cada lugar antes de chamar.
          </div>
        )}

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Comércios encontrados" value={result.leads.length} />
          <Stat label="Sem site próprio" value={result.leads.filter((l) => l.tipo_site !== "Site próprio").length} />
          <Stat label="Com telefone" value={result.leads.filter((l) => l.telefone).length} />
          <Stat label="Com WhatsApp" value={result.leads.filter((l) => l.whatsapp).length} />
        </div>

        {/* Ranking de categorias */}
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Melhores categorias para prospectar</h3>
          <span className="hidden text-xs text-muted-foreground md:block">Leads bons = sem site próprio e com telefone</span>
        </div>
        <div className="scrollbar-thin -mx-6 mb-10 flex gap-3 overflow-x-auto px-6 pb-3 md:mx-0 md:px-0">
          <CatCard active={cat === ""} onClick={() => setCat("")} title="Todas" big={result.leads.length} small="comércios" />
          {result.ranking.map((r, i) => (
            <CatCard
              key={r.categoria}
              active={cat === r.categoria}
              onClick={() => { setCat(r.categoria); setLimite(PAGE); }}
              title={r.categoria}
              big={r.leads_bons}
              small={`bons de ${r.total} · ${r.pct_sem_site}% sem site`}
              tag={i < 3 ? `#${i + 1}` : undefined}
              offer={r.oferta}
            />
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TIPOS.map((t) => (
            <Toggle key={t} checked={tipos.has(t)} onChange={() => toggleTipo(t)}>
              {t === "Nenhum" ? "Sem site" : t}
            </Toggle>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          <Toggle checked={soTel} onChange={setSoTel}>Com telefone</Toggle>
          <Toggle checked={soWa} onChange={setSoWa}>Com WhatsApp</Toggle>
          <Toggle checked={esconderSalvos} onChange={setEsconderSalvos}>Esconder salvos</Toggle>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome ou rua…" className="h-8 w-full md:ml-auto md:w-60" />
        </div>

        {/* Verificação no Google */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-white/10">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-medium">Confirmar no Google se já têm site, cardápio ou Instagram</div>
            <div className="text-xs text-muted-foreground">
              Confere a ficha do Google Maps de cada lugar (pelo telefone e endereço) e busca no Google. De 1 a 3 créditos do Serper por lugar; o resultado fica gravado.
            </div>
          </div>
          {verifying ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando {verifying.done}/{verifying.total}…
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={lote}
                onChange={(e) => setLote(Number(e.target.value))}
                className="h-8 rounded-lg bg-white/[0.03] px-2 text-sm outline-none ring-1 ring-white/10 cursor-pointer"
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>os {n} primeiros</option>)}
              </select>
              <Button size="sm" disabled={!naoVerificados.length} onClick={() => onVerify(naoVerificados.slice(0, lote))}>
                Verificar {Math.min(lote, naoVerificados.length)}
              </Button>
            </div>
          )}

          {/* resumo que fica gravado: clique para filtrar */}
          {verificadosTotal > 0 && (
            <div className="flex w-full flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <span className="mr-1 text-xs text-muted-foreground">{verificadosTotal} verificados:</span>
              <ResumoChip ativo={verifFiltro === "sem_site"} onClick={() => setVerifFiltro(verifFiltro === "sem_site" ? "todos" : "sem_site")}
                n={contagem.sem_site} label="Sem site (confirmado)" tom="branco" />
              {contagem.sem_site_maps > 0 && (
                <ResumoChip ativo={verifFiltro === "sem_site_maps"} onClick={() => setVerifFiltro(verifFiltro === "sem_site_maps" ? "todos" : "sem_site_maps")}
                  n={contagem.sem_site_maps} label="Sem site no Maps · falta confirmar" tom="cinza" />
              )}
              <ResumoChip ativo={verifFiltro === "social"} onClick={() => setVerifFiltro(verifFiltro === "social" ? "todos" : "social")}
                n={contagem.social} label="Só Instagram/iFood" tom="cinza" />
              <ResumoChip ativo={verifFiltro === "site"} onClick={() => setVerifFiltro(verifFiltro === "site" ? "todos" : "site")}
                n={contagem.site} label="Já têm site" tom="vermelho" />
              {contagem.incerto > 0 && (
                <ResumoChip ativo={verifFiltro === "incerto"} onClick={() => setVerifFiltro(verifFiltro === "incerto" ? "todos" : "incerto")}
                  n={contagem.incerto} label="Não achei no Maps" tom="cinza" />
              )}
              <ResumoChip ativo={verifFiltro === "pendente"} onClick={() => setVerifFiltro(verifFiltro === "pendente" ? "todos" : "pendente")}
                n={daCategoria.length - verificadosTotal} label="Não verificados" tom="cinza" />
              {verifFiltro !== "todos" && (
                <button onClick={() => setVerifFiltro("todos")} className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer">
                  mostrar todos
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtrados.length}</span> estabelecimentos
            {!temAvaliacoes && " · confira as avaliações no Maps antes de chamar"}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg p-0.5 ring-1 ring-white/10">
              {(["lista", "mapa"] as const).map((v) => (
                <button key={v} onClick={() => setVista(v)}
                  className={cn("flex h-7 items-center gap-1.5 rounded-md px-3 text-sm capitalize transition cursor-pointer", vista === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                  {v === "lista" ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />} {v}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" disabled={!rapido.length} onClick={() => setQuick(true)} title="Um lugar por vez, botões grandes">
              <Zap className="h-4 w-4" /> Modo rápido
            </Button>
            <Button size="sm" variant="outline" disabled={!filtrados.length} onClick={() => downloadCsv(filtrados, "csearch_leads.csv")}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" disabled={!filtrados.length} onClick={() => onSave(filtrados, busca)}>
              <Save className="h-4 w-4" /> Salvar {filtrados.length}
            </Button>
          </div>
        </div>

        {vista === "mapa" ? (
          <LeadsMap leads={filtrados} template={template} cidade={cidade} />
        ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-white/5">
          {filtrados.slice(0, limite).map((l, i) => (
            <LeadRow
              key={l.place_id}
              lead={l}
              index={i}
              saved={savedIds.has(l.place_id)}
              wa={waLink(l, template, cidade)}
              onSave={() => onSave([l], busca)}
              onVerify={() => onVerify([l])}
              onExample={() => onExample(l)}
              onContact={() => onContact(l, busca)}
              checking={verifyingIds.has(l.place_id)}
            />
          ))}
          {!filtrados.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Ninguém passou nos filtros. Tente desmarcar "Com telefone" ou incluir "Site próprio".
            </div>
          )}
        </div>
        )}

        <AnimatePresence>
          {quick && (
            <QuickMode
              leads={rapido}
              template={template}
              cidade={cidade}
              onClose={() => setQuick(false)}
              onContact={(l) => onContact(l, busca)}
              onDiscard={(l) => onDiscard(l, busca)}
              onExample={onExample}
              onVerify={(l) => onVerify([l])}
              checkingIds={verifyingIds}
            />
          )}
        </AnimatePresence>
        {vista === "lista" && filtrados.length > limite && (
          <div className="mt-6 flex justify-center">
            <Button variant="glass" onClick={() => setLimite(limite + PAGE)}>
              Mostrar mais ({filtrados.length - limite} restantes)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function CatCard(p: { active: boolean; onClick: () => void; title: string; big: number; small: string; tag?: string; offer?: string }) {
  return (
    <button
      onClick={p.onClick}
      className={cn(
        "relative min-w-[190px] shrink-0 rounded-2xl p-4 text-left transition cursor-pointer",
        p.active ? "bg-foreground text-background" : "bg-card ring-1 ring-white/5 hover:ring-white/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{p.title}</span>
        {p.tag && <span className={cn("text-xs font-serif italic", p.active ? "text-black/60" : "text-muted-foreground")}>{p.tag}</span>}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{p.big}</div>
      <div className={cn("text-xs", p.active ? "text-black/60" : "text-muted-foreground")}>{p.small}</div>
      {p.offer && <div className={cn("mt-2 text-xs font-medium", p.active ? "text-black/80" : "text-neutral-300")}>→ {p.offer}</div>}
    </button>
  );
}

function formatarData(iso: string) {
  // "2026-11-10 03:20" (UTC) -> "10/11 às 00:20" no horário local
  const d = new Date(iso.replace(" ", "T") + ":00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ResumoChip({ ativo, onClick, n, label, tom }: { ativo: boolean; onClick: () => void; n: number; label: string; tom: "branco" | "cinza" | "vermelho" }) {
  const dot = { branco: "bg-white", cinza: "bg-neutral-500", vermelho: "bg-red-400" }[tom];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 text-xs transition cursor-pointer ring-1",
        ativo ? "bg-foreground text-background ring-foreground" : "ring-white/10 hover:ring-white/30",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
      <span className="font-semibold tabular-nums">{n}</span>
    </button>
  );
}

export function VerifBadge({ lead: l }: { lead: Lead }) {
  const v = l.verificacao;
  if (!v && !l.rede) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {v?.status === "sem_site" && (
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
          v.confirmado === false ? "ring-1 ring-white/40 text-foreground" : "bg-foreground text-background")}>
          <ShieldCheck className="h-3 w-3" /> {v.resumo}
        </span>
      )}
      {v?.status === "incerto" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
          {v.resumo}
        </span>
      )}
      {v?.nomeGoogle && <span className="text-[11px] text-neutral-300">No Google: <b>{v.nomeGoogle}</b></span>}
      {v?.status === "social" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium">
          <ShieldCheck className="h-3 w-3" /> {v.resumo}
        </span>
      )}
      {v?.status === "site" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
          {v.resumo}
        </span>
      )}
      {v?.links.map((k) => (
        <a key={k.url} href={k.url} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
          {k.tipo} ↗
        </a>
      ))}
      {v && <span className="text-[11px] text-neutral-500">verificado em {formatarData(v.quando)}</span>}
      {l.rede && !v && (
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] text-neutral-300">Possível rede · {l.rede} unidades</span>
      )}
    </div>
  );
}

function LeadRow({ lead: l, index, saved, wa, onSave, onVerify, onExample, onContact, checking }: { lead: Lead; index: number; saved: boolean; wa: string; onSave: () => void; onVerify: () => void; onExample: () => void; onContact: () => void; checking: boolean }) {
  const tone = nivelTone(l.score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index % 12, 6) * 0.03 }}
      className={cn(
        "grid grid-cols-1 gap-3 border-b border-white/5 px-5 py-4 last:border-0 lg:grid-cols-[110px_1fr_200px_auto] lg:items-center",
        l.verificacao?.status === "site" && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-1">
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", tone.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} /> {tone.label}
        </span>
        <ScoreBar score={l.score} />
      </div>

      <div className="min-w-0">
        <div className="truncate font-medium">{l.nome}</div>
        <div className="truncate text-xs text-muted-foreground">
          {l.categoria}
          {l.endereco && <> · {l.endereco}</>}
          {l.avaliacoes !== null && <> · {l.avaliacoes} avaliações{l.nota ? ` (${l.nota}★)` : ""}</>}
        </div>
        <VerifBadge lead={l} />
        <ProposalChip lead={l} />
      </div>

      <div className="min-w-0 text-sm">
        {l.telefone ? (
          <a href={telLink(l.telefone)} className="flex items-center gap-1.5 hover:underline">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {l.telefone}
          </a>
        ) : (
          <span className="text-xs text-neutral-600">sem telefone</span>
        )}
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          {l.site ? (
            <a href={l.site} target="_blank" rel="noreferrer" className="truncate hover:text-foreground">
              {l.tipo_site === "Só rede social" ? "só rede social" : "site próprio"}
            </a>
          ) : (
            "sem site"
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {precisaConfirmar(l) && (
          <Button size="icon" variant="outline" onClick={onVerify} disabled={checking} title="Verificar no Google se já tem site">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          </Button>
        )}
        <button onClick={onExample} title="Abrir a abordagem: mensagem pronta + demonstração"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90 cursor-pointer">
          <MessageCircle className="h-4 w-4" /> Abordar
        </button>
        <a href={l.maps_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm ring-1 ring-white/10 hover:bg-white/5">
          <MapPin className="h-4 w-4" /> Maps <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
        <Button size="icon" variant={saved ? "solid" : "outline"} onClick={onSave} title={saved ? "Já está em Meus leads" : "Salvar em Meus leads"}>
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        </Button>
      </div>
    </motion.div>
  );
}
