import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Download, ExternalLink, Globe, Loader2, MapPin, MessageCircle, Phone, Save, ShieldCheck } from "lucide-react";
import { cn, downloadCsv, nivelTone, telLink, waLink, type Lead, type SearchResult } from "@/lib";
import { Button, Input, ScoreBar, SectionTitle, Stat, Toggle } from "./ui";

type Props = {
  result: SearchResult;
  template: string;
  savedIds: Set<string>;
  onSave: (leads: Lead[], busca: string) => void;
  onVerify: (leads: Lead[]) => void;
  verifying: { done: number; total: number } | null;
  verifyingIds: Set<string>;
};

const TIPOS = ["Nenhum", "Só rede social", "Site próprio"] as const;
const PAGE = 60;

export function Results({ result, template, savedIds, onSave, onVerify, verifying, verifyingIds }: Props) {
  const [soVerificados, setSoVerificados] = useState(false);
  const [lote, setLote] = useState(20);
  const [cat, setCat] = useState<string>(result.ranking[0]?.categoria ?? "");
  const [tipos, setTipos] = useState<Set<string>>(new Set(["Nenhum", "Só rede social"]));
  const [soTel, setSoTel] = useState(false);
  const [soWa, setSoWa] = useState(false);
  const [esconderSalvos, setEsconderSalvos] = useState(false);
  const [q, setQ] = useState("");
  const [limite, setLimite] = useState(PAGE);
  const cidade = result.area.split(",")[0];

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return result.leads
      .filter((l) => !cat || l.categoria === cat)
      .filter((l) => tipos.has(l.tipo_site))
      .filter((l) => !soTel || l.telefone)
      .filter((l) => !soWa || l.whatsapp)
      .filter((l) => !esconderSalvos || !savedIds.has(l.place_id))
      .filter((l) => !soVerificados || l.verificacao)
      .filter((l) => !termo || `${l.nome} ${l.endereco}`.toLowerCase().includes(termo))
      .sort((a, b) => b.score - a.score || (a.avaliacoes ?? 0) - (b.avaliacoes ?? 0));
  }, [result, cat, tipos, soTel, soWa, esconderSalvos, soVerificados, savedIds, q]);

  const naoVerificados = filtrados.filter((l) => !l.verificacao);
  const verificadosTotal = result.leads.filter((l) => l.verificacao).length;

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
          <Toggle checked={soVerificados} onChange={setSoVerificados}>Só verificados</Toggle>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome ou rua…" className="h-8 w-full md:ml-auto md:w-60" />
        </div>

        {/* Verificação no Google */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-white/10">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-medium">Confirmar no Google se já têm site, cardápio ou Instagram</div>
            <div className="text-xs text-muted-foreground">
              Pesquisa cada lugar no Google e esconde quem já tem site. 1 crédito do Serper por lugar ·{" "}
              {verificadosTotal} já verificados nesta busca
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
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtrados.length}</span> estabelecimentos
            {!temAvaliacoes && " · confira as avaliações no Maps antes de chamar"}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!filtrados.length} onClick={() => downloadCsv(filtrados, "csearch_leads.csv")}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" disabled={!filtrados.length} onClick={() => onSave(filtrados, busca)}>
              <Save className="h-4 w-4" /> Salvar {filtrados.length} em Meus leads
            </Button>
          </div>
        </div>

        {/* Lista */}
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
              checking={verifyingIds.has(l.place_id)}
            />
          ))}
          {!filtrados.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Ninguém passou nos filtros. Tente desmarcar "Com telefone" ou incluir "Site próprio".
            </div>
          )}
        </div>
        {filtrados.length > limite && (
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

export function VerifBadge({ lead: l }: { lead: Lead }) {
  const v = l.verificacao;
  if (!v && !l.rede) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {v?.status === "sem_site" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background">
          <ShieldCheck className="h-3 w-3" /> Confirmado no Google: sem site
        </span>
      )}
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
      {l.rede && !v && (
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] text-neutral-300">Possível rede · {l.rede} unidades</span>
      )}
    </div>
  );
}

function LeadRow({ lead: l, index, saved, wa, onSave, onVerify, checking }: { lead: Lead; index: number; saved: boolean; wa: string; onSave: () => void; onVerify: () => void; checking: boolean }) {
  const tone = nivelTone(l.score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index % 12, 6) * 0.03 }}
      className="grid grid-cols-1 gap-3 border-b border-white/5 px-5 py-4 last:border-0 lg:grid-cols-[110px_1fr_200px_auto] lg:items-center"
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
        <div className="mt-1 text-xs text-neutral-300">→ {l.oferta}</div>
        <VerifBadge lead={l} />
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
        {!l.verificacao && (
          <Button size="icon" variant="outline" onClick={onVerify} disabled={checking} title="Verificar no Google se já tem site">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          </Button>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
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
