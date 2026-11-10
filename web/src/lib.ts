import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchPlaces, geocode } from "./engine/osm";
import { marcarRedes, rankCategories, scoreLead } from "./engine/scoring";
import { cacheVerificacoes } from "./engine/verify";
import { buscarGoogleMaps } from "./engine/gmaps";
import { fakeSearch } from "./engine/demo";
import { deleteAll, loadLeads, saveLeads, updateLead } from "./engine/store";
import type { Verificacao } from "./engine/verify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Lead = {
  place_id: string;
  nome: string;
  categoria: string;
  endereco: string;
  nota: number | null;
  avaliacoes: number | null;
  site: string;
  tipo_site: "Nenhum" | "Só rede social" | "Site próprio";
  telefone: string;
  whatsapp: string;
  maps_url: string;
  score: number;
  nivel: string;
  motivos: string;
  oferta: string;
  verificacao?: Verificacao; // preenchido depois de conferir no Google
  lat?: number;
  lon?: number;
  rede?: number; // quantas unidades com o mesmo nome apareceram (possível franquia)
};

export type SavedLead = Lead & {
  status: string;
  anotacoes: string;
  busca: string;
  encontrado_em: string;
  status_em?: string; // ISO: quando o status mudou (ou último retorno)
  valor?: number; // quanto fechou (status Fechado)
  retornos?: number; // quantas mensagens de retorno já mandou
};

export type RankRow = {
  categoria: string;
  total: number;
  sem_site: number;
  so_rede_social: number;
  com_telefone: number;
  leads_bons: number;
  pct_sem_site: number;
  oferta: string;
};

export type SearchResult = { area: string; leads: Lead[]; ranking: RankRow[]; busca: string };

export type Fonte = "gmaps" | "osm" | "google" | "demo";

export const STATUS = ["Novo", "Aguardando confirmação", "Contatado", "Respondeu", "Negociando", "Fechado", "Descartado"];

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) {
    let msg = `Erro ${r.status}`;
    try {
      const j = await r.json();
      msg = j.detail || msg;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg);
  }
  return r.json();
}

/** Aplica verificações já feitas (cache) e marca redes/franquias. */
function prepare(leads: Lead[]): Lead[] {
  const cache = cacheVerificacoes();
  return marcarRedes(leads.map((l) => cache[l.place_id] ?? l));
}

// Tudo roda no navegador (funciona no GitHub Pages). Só o modo Google usa o
// servidor Python local (api.py), porque a chave não pode ficar exposta num site público.
export const api = {
  config: async () => {
    try {
      const c = await req<{ has_google_key: boolean }>("/api/config");
      return { has_google_key: !!c.has_google_key };
    } catch {
      return { has_google_key: false };
    }
  },
  /** Busca no Google Maps (Serper): lugares reais, com site/telefone/avaliações da ficha do Google. */
  searchGmaps: async (termo: string, cidade: string, bairros: string[], key: string, paginas: number, onProgress?: (m: string) => void) => {
    const r = await buscarGoogleMaps(termo, cidade, bairros, key, paginas, onProgress);
    const leads = marcarRedes(r.leads.map((l) => cacheVerificacoes()[l.place_id] ?? l));
    return { area: r.area, leads, ranking: rankCategories(leads), creditos: r.creditos };
  },
  /** Busca grátis. Com bairros, busca cada um ("Tatuapé, São Paulo", "Mooca, São Paulo"…) e junta tudo. */
  searchOsm: async (lugar: string, bairros: string[] = [], onProgress?: (msg: string) => void): Promise<Omit<SearchResult, "busca">> => {
    if (!bairros.length) {
      const g = await geocode(lugar);
      const leads = prepare((await fetchPlaces(g)).map((p) => scoreLead(p)));
      return { area: g.nome, leads, ranking: rankCategories(leads) };
    }
    const byId = new Map<string, ReturnType<typeof scoreLead>>();
    const falhas: string[] = [];
    for (let i = 0; i < bairros.length; i++) {
      onProgress?.(`Bairro ${i + 1} de ${bairros.length}: ${bairros[i]}`);
      try {
        const g = await geocode(`${bairros[i]}, ${lugar}`);
        for (const p of await fetchPlaces(g)) byId.set(p.place_id, scoreLead(p));
      } catch {
        falhas.push(bairros[i]);
      }
    }
    if (!byId.size) throw new Error(`Não consegui buscar ${falhas.join(", ")}. Confira os nomes dos bairros e a cidade.`);
    const leads = prepare([...byId.values()]);
    const area = `${bairros.filter((b) => !falhas.includes(b)).join(" + ")}, ${lugar}`;
    return { area, leads, ranking: rankCategories(leads) };
  },
  searchTerm: async (body: { termo: string; cidade: string; bairros: string[]; fonte: Fonte; paginas?: number }) => {
    if (body.fonte === "demo") {
      const termos = body.termo ? [body.termo] : ["pizzaria", "barbearia", "oficina mecânica", "padaria", "dentista"];
      const areas = body.bairros.length ? body.bairros.map((b) => `${b}, ${body.cidade}`) : [body.cidade];
      const qs = termos.flatMap((t) => areas.map((a) => ({ t, q: `${t} em ${a}` })));
      const byId = new Map(qs.flatMap(({ t, q }) => fakeSearch(q, body.termo ? 25 : 8).map((p) => scoreLead(p, t))).map((p) => [p.place_id, p]));
      const leads = prepare([...byId.values()]);
      return { area: body.cidade, leads, ranking: rankCategories(leads) };
    }
    const r = await req<Omit<SearchResult, "busca">>("/api/search/term", { method: "POST", body: JSON.stringify(body) });
    const leads = prepare(r.leads);
    return { ...r, leads, ranking: rankCategories(leads) };
  },
  leads: async () => loadLeads(),
  save: async (busca: string, leads: Lead[]) => saveLeads(leads, busca),
  update: async (id: string, status: string, anotacoes: string, extra: Partial<SavedLead> = {}) => updateLead(id, status, anotacoes, extra),
  deleteAll: async () => deleteAll(),
};

export const DEFAULT_MSG =
  "Olá, {nome}! Tudo bem?\n\n" +
  "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um {oferta} de vocês. " +
  "Se ainda não tiverem, acho que pode ser uma ótima forma de mostrar o trabalho de vocês para mais clientes.\n\n" +
  "Posso te enviar um exemplo de como ficaria, sem compromisso?";

export function fillTemplate(t: string, l: Lead, cidade = "") {
  return t
    .replaceAll("{nome}", l.nome)
    .replaceAll("{oferta}", (l.oferta || "um site").toLowerCase())
    .replaceAll("{cidade}", cidade)
    .replaceAll("{avaliacoes}", String(l.avaliacoes ?? 0));
}

export function waLink(l: Lead, template: string, cidade = "") {
  if (!l.whatsapp) return "";
  return `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(fillTemplate(template, l, cidade))}`;
}

export function telLink(tel: string) {
  return "tel:" + tel.replace(/[^\d+]/g, "");
}

export function nivelTone(score: number) {
  if (score >= 70) return { label: "Quente", dot: "bg-white", text: "text-white" };
  if (score >= 45) return { label: "Morno", dot: "bg-neutral-400", text: "text-neutral-300" };
  return { label: "Frio", dot: "bg-neutral-700", text: "text-neutral-500" };
}

export function downloadCsv(rows: Lead[], filename: string, extra: string[] = []) {
  const cols = [...extra, "nome", "categoria", "score", "tipo_site", "site", "telefone", "whatsapp",
    "avaliacoes", "nota", "oferta", "motivos", "endereco", "maps_url"];
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [cols.join(";"), ...rows.map((r) => cols.map((c) => esc((r as Record<string, unknown>)[c])).join(";"))].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function storageGet(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sem armazenamento */
  }
}
