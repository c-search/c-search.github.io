// Mesma lógica de csearch/scoring.py, rodando no navegador.
import type { Lead, RankRow } from "@/lib";

const SOCIAL_DOMAINS = [
  "instagram.com", "facebook.com", "fb.com", "linktr.ee", "linktree", "wa.me", "whatsapp.com",
  "tiktok.com", "youtube.com", "twitter.com", "x.com", "ifood.com.br", "goomer", "anota.ai",
  "aiqfome", "rappi", "ubereats", "bit.ly", "google.com", "business.site", "g.page", "beacons.ai",
  "bio.link", "taplink",
];

const FOOD_WORDS = [
  "restaurante", "lanchonete", "pizzaria", "hamburgueria", "bar", "café", "cafe", "cafeteria", "padaria",
  "doceria", "confeitaria", "sorveteria", "açaí", "acai", "churrascaria", "sushi", "japonês", "japones",
  "marmitaria", "pastelaria", "food", "comida", "espetinho", "bistrô", "bistro", "cervejaria", "adega",
];

const PORTFOLIO_WORDS = [
  "empreiteira", "construtora", "construção", "reforma", "pedreiro", "arquitet", "marcenaria",
  "serralheria", "pintor", "gesso", "vidraçaria", "móveis planejados", "tatuagem", "tattoo", "fotógraf",
  "fotograf", "estúdio", "studio", "design", "paisagismo", "decoração", "eventos", "buffet",
];

export type RawPlace = Omit<Lead, "tipo_site" | "score" | "nivel" | "motivos" | "oferta" | "whatsapp">;

type Kind = "nenhum" | "rede_social" | "proprio";

export function siteKind(url: string): Kind {
  if (!url) return "nenhum";
  const low = url.trim().toLowerCase();
  let host = "";
  try {
    host = new URL(low.includes("://") ? low : "http://" + low).hostname;
  } catch {
    host = low;
  }
  if (host.startsWith("www.")) host = host.slice(4);
  for (const d of SOCIAL_DOMAINS) {
    if (d.includes(".")) {
      if (host === d || host.endsWith("." + d)) return "rede_social";
    } else if (host.includes(d)) return "rede_social";
  }
  return "proprio";
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function hasWord(text: string, words: string[]) {
  // fronteira no início evita que "bar" case com "barbearia"
  return words.some((w) => new RegExp("(^|[^\\p{L}])" + esc(w) + (w.length <= 4 ? "($|[^\\p{L}])" : ""), "u").test(text));
}

export function suggestOffer(categoria: string, termo: string, kind: Kind, avaliacoes: number | null) {
  const text = `${categoria} ${termo}`.toLowerCase();
  const offers: string[] = [];
  if (kind !== "proprio") {
    if (hasWord(text, FOOD_WORDS)) offers.push("Cardápio digital");
    else if (hasWord(text, PORTFOLIO_WORDS)) offers.push("Site + portfólio");
    else offers.push("Site profissional");
  }
  if (avaliacoes !== null && avaliacoes < 30) offers.push("Perfil Google / avaliações");
  return offers.length ? offers.join(" + ") : "Melhoria do site";
}

export function whatsappNumber(telefone: string) {
  let d = (telefone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  return d.length === 11 && d[2] === "9" ? "55" + d : "";
}

export function scoreLead(p: RawPlace, termo = ""): Lead {
  const kind = siteKind(p.site);
  const n = p.avaliacoes;
  let score = 0;
  const motivos: string[] = [];

  if (kind === "nenhum") { score += 50; motivos.push("sem site"); }
  else if (kind === "rede_social") { score += 35; motivos.push("só rede social/delivery"); }

  if (n !== null) {
    if (n === 0) { score += 30; motivos.push("nenhuma avaliação"); }
    else if (n < 10) { score += 25; motivos.push(`só ${n} avaliações`); }
    else if (n < 30) { score += 15; motivos.push(`${n} avaliações`); }
    else if (n < 60) score += 5;
  }

  if (p.telefone) score += 15;
  else motivos.push("sem telefone cadastrado");

  if (n === null) {
    // sem avaliações: site vale até 60 e telefone 40
    score = { nenhum: 60, rede_social: 45, proprio: 0 }[kind] + (p.telefone ? 40 : 0);
  }
  score = Math.min(score, 100);

  return {
    ...p,
    tipo_site: ({ nenhum: "Nenhum", rede_social: "Só rede social", proprio: "Site próprio" } as const)[kind],
    score,
    nivel: score >= 70 ? "🔥 Quente" : score >= 45 ? "🟡 Morno" : "❄️ Frio",
    motivos: motivos.join(", "),
    oferta: suggestOffer(p.categoria, termo, kind, n),
    whatsapp: whatsappNumber(p.telefone),
  };
}

export function rankCategories(leads: Lead[]): RankRow[] {
  const stats = new Map<string, RankRow>();
  for (const l of leads) {
    const s = stats.get(l.categoria) ?? {
      categoria: l.categoria, total: 0, sem_site: 0, so_rede_social: 0, com_telefone: 0,
      leads_bons: 0, pct_sem_site: 0, oferta: "",
    };
    s.total++;
    if (l.tipo_site === "Nenhum") s.sem_site++;
    if (l.tipo_site === "Só rede social") s.so_rede_social++;
    if (l.telefone) s.com_telefone++;
    if (l.tipo_site !== "Site próprio" && l.telefone) s.leads_bons++;
    stats.set(l.categoria, s);
  }
  const out = [...stats.values()].map((s) => ({
    ...s,
    pct_sem_site: Math.round((100 * (s.sem_site + s.so_rede_social)) / s.total),
    oferta: suggestOffer(s.categoria, "", "nenhum", null),
  }));
  out.sort((a, b) => b.leads_bons - a.leads_bons || b.sem_site + b.so_rede_social - (a.sem_site + a.so_rede_social));
  return out;
}
