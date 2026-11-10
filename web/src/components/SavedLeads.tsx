import { useMemo, useState } from "react";
import { Download, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import { cn, downloadCsv, nivelTone, telLink, waLink, type SavedLead } from "@/lib";
import { Button, Input, SectionTitle } from "./ui";

type Props = {
  leads: SavedLead[];
  statuses: string[];
  template: string;
  onUpdate: (id: string, status: string, anotacoes: string) => void;
  onDeleteAll: () => void;
};

export function SavedLeads({ leads, statuses, template, onUpdate, onDeleteAll }: Props) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach((l) => (c[l.status] = (c[l.status] || 0) + 1));
    return c;
  }, [leads]);

  const view = leads
    .filter((l) => (filtro ? l.status === filtro : !["Fechado", "Descartado"].includes(l.status)))
    .filter((l) => !q || `${l.nome} ${l.categoria} ${l.busca}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section id="leads" className="px-6 md:px-12 lg:px-28 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="Seu funil de vendas" title="Meus" accent="leads." />

        <div className="mb-6 flex flex-wrap gap-2">
          <StatusPill active={filtro === null} onClick={() => setFiltro(null)} label="Em andamento"
            n={leads.filter((l) => !["Fechado", "Descartado"].includes(l.status)).length} />
          {statuses.map((s) => (
            <StatusPill key={s} active={filtro === s} onClick={() => setFiltro(s)} label={s} n={counts[s] || 0} />
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar lead…" className="h-8 md:w-64" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!leads.length}
              onClick={() => downloadCsv(leads, "csearch_meus_leads.csv", ["status", "anotacoes", "busca", "encontrado_em"])}>
              <Download className="h-4 w-4" /> Excel (CSV)
            </Button>
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

        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-white/5">
          {view.map((l) => (
            <Row key={l.place_id} lead={l} statuses={statuses} wa={waLink(l, template)} onUpdate={onUpdate} />
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

function Row({ lead: l, statuses, wa, onUpdate }: { lead: SavedLead; statuses: string[]; wa: string; onUpdate: Props["onUpdate"] }) {
  const [nota, setNota] = useState(l.anotacoes || "");
  const tone = nivelTone(l.score);
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-white/5 px-5 py-4 last:border-0 lg:grid-cols-[150px_1fr_1fr_auto] lg:items-center">
      <select
        value={l.status}
        onChange={(e) => onUpdate(l.place_id, e.target.value, nota)}
        className="h-9 rounded-lg bg-white/[0.03] px-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40 cursor-pointer"
      >
        {statuses.map((s) => <option key={s}>{s}</option>)}
      </select>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
          <span className="truncate font-medium">{l.nome}</span>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {l.categoria} · {l.oferta} · salvo em {l.encontrado_em}
        </div>
      </div>

      <Input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        onBlur={() => nota !== (l.anotacoes || "") && onUpdate(l.place_id, l.status, nota)}
        placeholder="Anotações (ex.: ligar sexta, falar com o dono)"
        className="h-9"
      />

      <div className="flex gap-2 lg:justify-end">
        {l.telefone && (
          <a href={telLink(l.telefone)} title={l.telefone} className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10 hover:bg-white/5">
            <Phone className="h-4 w-4" />
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        <a href={l.maps_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10 hover:bg-white/5">
          <MapPin className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
