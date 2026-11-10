// "Meus leads" guardado no navegador de cada pessoa.
import type { Lead, SavedLead } from "@/lib";

const KEY = "csearch_leads_v1";

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Leads salvos antes da correção tinham link do Maps com as coordenadas no texto da busca
// (o Google procurava o nome no Brasil inteiro). Reaproveita as coordenadas no formato certo.
function corrigirLinkMaps(l: SavedLead): SavedLead {
  const m = l.maps_url.match(/[?&]query=(.*)%20(-?\d+\.\d+),(-?\d+\.\d+)$/);
  if (!m) return l;
  const tipo = l.categoria.split(" /")[0];
  const texto = l.nome.toLowerCase().includes(tipo.toLowerCase()) ? l.nome : `${l.nome} ${tipo}`;
  return { ...l, maps_url: `https://www.google.com/maps/search/${encodeURIComponent(texto)}/@${m[2]},${m[3]},18z` };
}

// A verificação antiga (sem "fonte") comparava só o nome e podia dizer "sem site" errado: descarta.
function descartarVerificacaoAntiga(l: SavedLead): SavedLead {
  if (!l.verificacao || l.verificacao.fonte) return l;
  const { verificacao: _v, ...resto } = l;
  return { ...resto, motivos: (l.motivos || "").replace(/^[^·]*·\s*/, "") };
}

export function loadLeads(): SavedLead[] {
  try {
    const list: SavedLead[] = JSON.parse(localStorage.getItem(KEY) || "[]").map(corrigirLinkMaps).map(descartarVerificacaoAntiga);
    return list.sort((a, b) => b.score - a.score || (a.avaliacoes ?? 0) - (b.avaliacoes ?? 0));
  } catch {
    return [];
  }
}

function write(list: SavedLead[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error("O navegador não deixou salvar (armazenamento cheio ou bloqueado). Exporte seus leads para não perder.");
  }
}

export function saveLeads(leads: Lead[], busca: string) {
  const list = loadLeads();
  const byId = new Map(list.map((l) => [l.place_id, l]));
  let novos = 0;
  for (const l of leads) {
    const old = byId.get(l.place_id);
    if (old) {
      Object.assign(old, { ...l, status: old.status, anotacoes: old.anotacoes, busca: old.busca, encontrado_em: old.encontrado_em });
    } else {
      byId.set(l.place_id, { ...l, status: "Novo", anotacoes: "", busca, encontrado_em: now() });
      novos++;
    }
  }
  write([...byId.values()]);
  return { novos, existentes: leads.length - novos };
}

/** Atualiza os dados (ex.: verificação) de leads que já estão salvos, sem mexer no status. */
export function refreshLeads(leads: Lead[]) {
  const novos = new Map(leads.map((l) => [l.place_id, l]));
  const list = loadLeads();
  if (!list.some((l) => novos.has(l.place_id))) return;
  write(list.map((l) => (novos.has(l.place_id) ? { ...l, ...novos.get(l.place_id), status: l.status, anotacoes: l.anotacoes, busca: l.busca, encontrado_em: l.encontrado_em } : l)));
}

export function updateLead(id: string, status: string, anotacoes: string, extra: Partial<SavedLead> = {}) {
  write(loadLeads().map((l) => {
    if (l.place_id !== id) return l;
    const mudou = l.status !== status;
    return { ...l, status, anotacoes, ...(mudou ? { status_em: new Date().toISOString() } : {}), ...extra };
  }));
}

/** Registra que mandou mensagem de retorno: o lembrete volta só daqui a alguns dias. */
export function marcarRetorno(id: string) {
  write(loadLeads().map((l) => (l.place_id === id ? { ...l, status_em: new Date().toISOString(), retornos: (l.retornos || 0) + 1 } : l)));
}

/** Dias desde a última mudança de status (ou retorno). */
export function diasParado(l: SavedLead) {
  const ref = l.status_em || l.encontrado_em.replace(" ", "T");
  const t = new Date(ref).getTime();
  return isNaN(t) ? 0 : Math.floor((Date.now() - t) / 86400000);
}

export const DIAS_PARA_RETORNO = 3;
export const precisaRetorno = (l: SavedLead) =>
  (l.status === "Contatado" || l.status === "Respondeu") && diasParado(l) >= DIAS_PARA_RETORNO && (l.retornos || 0) < 3;

export function deleteAll() {
  write([]);
}
