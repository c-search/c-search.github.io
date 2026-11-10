// "Meus leads" guardado no navegador de cada pessoa.
import type { Lead, SavedLead } from "@/lib";

const KEY = "csearch_leads_v1";

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function loadLeads(): SavedLead[] {
  try {
    const list: SavedLead[] = JSON.parse(localStorage.getItem(KEY) || "[]");
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

export function updateLead(id: string, status: string, anotacoes: string) {
  write(loadLeads().map((l) => (l.place_id === id ? { ...l, status, anotacoes } : l)));
}

export function deleteAll() {
  write([]);
}
