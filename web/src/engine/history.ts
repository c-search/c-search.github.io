// Buscas salvas no navegador: atualizar a página não perde a pesquisa e repetir a mesma busca
// não gasta créditos de novo.
import type { Fonte, Lead, RankRow } from "@/lib";
import { cacheVerificacoes } from "./verify";
import { marcarRedes, rankCategories } from "./scoring";

export type BuscaSalva = {
  id: string; // fonte|termo|cidade|bairros
  fonte: Fonte;
  termo: string;
  cidade: string;
  bairros: string[];
  rotulo: string; // "São Paulo" ou "pizzaria em Mooca, São Paulo"
  quando: string; // ISO
  area: string;
  busca: string;
  leads: Lead[];
};

const CHAVE = "csearch_buscas_v1";
const MAX = 8;
export const VALIDADE_DIAS = 7;

export function idBusca(fonte: Fonte, termo: string, cidade: string, bairros: string[]) {
  const n = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return [fonte, n(termo), n(cidade), bairros.map(n).sort().join(",")].join("|");
}

function ler(): BuscaSalva[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
}

function gravar(lista: BuscaSalva[]) {
  // se faltar espaço, vai tirando as mais antigas
  for (let n = lista.length; n > 0; n--) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, n)));
      return;
    } catch {
      /* tenta com menos */
    }
  }
}

export function salvarBusca(b: Omit<BuscaSalva, "quando">) {
  if (b.fonte === "demo") return;
  const lista = ler().filter((x) => x.id !== b.id);
  lista.unshift({ ...b, quando: new Date().toISOString() });
  gravar(lista.slice(0, MAX));
}

export function recentes(): Omit<BuscaSalva, "leads">[] {
  return ler().map(({ leads: _l, ...r }) => ({ ...r, total: _l.length } as Omit<BuscaSalva, "leads">));
}

export function diasDesde(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

/** Abre uma busca salva, já com as verificações feitas depois dela. */
export function abrirBusca(id: string): { area: string; busca: string; leads: Lead[]; ranking: RankRow[]; salva: BuscaSalva } | null {
  const b = ler().find((x) => x.id === id);
  if (!b) return null;
  const cache = cacheVerificacoes();
  const leads = marcarRedes(b.leads.map((l) => cache[l.place_id] ?? l));
  return { area: b.area, busca: b.busca, leads, ranking: rankCategories(leads), salva: b };
}

export function ultimaBusca() {
  const b = ler()[0];
  return b ? abrirBusca(b.id) : null;
}

export function apagarBusca(id: string) {
  gravar(ler().filter((x) => x.id !== id));
}
