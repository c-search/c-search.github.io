// Verificação no Google (via Serper.dev): confirma se o lugar tem mesmo site,
// cardápio/delivery ou só rede social, e pega o número de avaliações quando aparece.
import type { Lead } from "@/lib";
import { scoreLead, siteKind, type RawPlace } from "./scoring";

export type Verificacao = {
  status: "sem_site" | "site" | "social" | "erro";
  resumo: string;
  url?: string;
  links: { tipo: string; url: string }[];
  quando: string;
};

const DELIVERY = ["ifood.com.br", "goomer", "anota.ai", "aiqfome", "rappi", "ubereats", "deliverymuch", "menudino", "cardapioweb", "olaclick", "neemo", "saipos", "instadelivery", "pedir.delivery", "cardapio.app"];
const SOCIAL = ["instagram.com", "facebook.com", "fb.com", "tiktok.com", "linktr.ee", "wa.me", "whatsapp.com", "linkr.bio", "beacons.ai", "bio.link", "taplink"];
// listas, guias e agregadores que citam o lugar mas não são dele
const DIRETORIOS = [
  "google.", "goo.gl", "g.page", "tripadvisor", "guiamais", "apontador", "encontra", "yelp", "restaurantguru",
  "solutudo", "telelistas", "cnpj", "casadosdados", "econodata", "empresaqui", "consultas", "waze.com",
  "moovit", "foursquare", "wikipedia", "youtube.com", "linkedin.com", "glassdoor", "indeed", "reclameaqui",
  "achei", "listamais", "infobel", "cylex", "hotfrog", "brasil.io", "mapcarta", "wikimapia", "kekanto",
  "petlove", "doctoralia", "boaconsulta", "booking.com", "trivago", "decolar", "hoteis.com", "airbnb",
  "olx.com", "mercadolivre", "spotify", "twitter.com", "x.com", "pinterest", "threads.net", "jusbrasil",
  "gov.br", "receitaws", "guiadasemana", "vejasp", "timeout.com", "ubereats", "zapimoveis", "vivareal",
  "maps.apple", "bing.com", "nominatim", "openstreetmap", "here.com", "groupon", "peixeurbano", "cuponomia",
];

const STOP = new Set(["do", "da", "de", "dos", "das", "e", "o", "a", "os", "as", "the", "and", "&", "em", "no", "na",
  "ltda", "me", "eireli", "cia", "sp", "rj", "loja", "unidade", "filial"]);

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function tokens(nome: string) {
  return norm(nome).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t));
}

// palavras que aparecem no nome de muita gente e não identificam o lugar
const GENERICAS = new Set(["bar", "restaurante", "pizzaria", "padaria", "lanchonete", "casa", "salao", "barbearia",
  "oficina", "mecanica", "auto", "center", "studio", "estudio", "academia", "pet", "shop", "mercado", "mini", "super",
  "supermercado", "mercearia", "emporio", "doceria", "confeitaria", "cafe", "cafeteria", "lanches", "pastelaria",
  "hamburgueria", "burger", "food", "beleza", "estetica", "clinica", "odontologia", "consultorio", "loja", "moda",
  "boutique", "materiais", "construcao", "acougue", "adega", "bebidas", "conveniencia", "otica", "farmacia",
  "drogaria", "hotel", "pousada", "lava", "rapido", "borracharia", "pneus", "sorveteria", "acai", "sushi", "grill",
  "churrascaria", "espetinho", "tattoo", "tatuagem", "imobiliaria", "contabilidade", "advocacia", "advogados",
  "papelaria", "grafica", "floricultura", "veterinaria", "veterinario", "comercio", "servicos", "express", "point", "novo", "nova"]);

const compactar = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");
const distintivos = (nome: string) => tokens(nome).filter((t) => !GENERICAS.has(t));

/** Dois nomes falam do mesmo lugar? (um contém o outro, ou todas as palavras que identificam batem) */
function mesmoNome(a: string, b: string) {
  const ca = compactar(a);
  const cb = compactar(b);
  if (ca.length >= 5 && cb.length >= 5 && (ca.includes(cb) || cb.includes(ca))) return true;
  const d = distintivos(a);
  const nb = norm(b);
  return d.length > 0 && d.every((t) => nb.includes(t));
}

const TLD = new Set(["com", "br", "net", "org", "site", "app", "io", "co", "online", "store", "shop", "rest", "food", "wixsite", "negocio", "wordpress", "blogspot"]);

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** O host pertence a algum domínio da lista? ("x.com" não pode casar com "pastelx.com.br") */
const has = (h: string, list: string[]) =>
  list.some((d) => (d.includes(".") && !d.endsWith(".") ? h === d || h.endsWith("." + d) : h.includes(d)));

/** O link parece ser do próprio estabelecimento? */
function pareceDoLugar(nome: string, url: string, titulo: string) {
  const dom = host(url).split(".").filter((p) => !TLD.has(p)).join("");
  // 1) domínio contém o nome inteiro: casadopastelsp.com.br ⊃ "casadopastel"
  const inteiro = compactar(nome);
  const semStop = tokens(nome).join("");
  if ((inteiro.length >= 6 && dom.includes(inteiro)) || (semStop.length >= 6 && dom.includes(semStop))) return true;
  // 2) todas as palavras que identificam o lugar estão no domínio e o título fala do lugar
  const d = distintivos(nome);
  return d.length > 0 && d.every((t) => dom.includes(t)) && mesmoNome(nome, titulo);
}

type SerperResp = {
  knowledgeGraph?: { title?: string; website?: string; rating?: number; ratingCount?: number; type?: string };
  organic?: { title: string; link: string; snippet?: string }[];
  places?: { title: string; website?: string; rating?: number; ratingCount?: number }[];
};

function agora() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export async function serperSearch(q: string, key: string): Promise<SerperResp> {
  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 10 }),
  });
  if (r.status === 401 || r.status === 403) throw new Error("Chave do Serper inválida. Confira em Configurações.");
  if (r.status === 400 || r.status === 402) throw new Error("Seus créditos do Serper acabaram.");
  if (!r.ok) throw new Error(`Erro ${r.status} no Serper.`);
  return r.json();
}

export function analisar(lead: Lead, resp: SerperResp): { verificacao: Verificacao; avaliacoes: number | null; nota: number | null } {
  const links: Verificacao["links"] = [];
  let site = "";
  let social = "";
  let delivery = "";
  const kg = resp.knowledgeGraph;
  const kgBate = kg?.title ? mesmoNome(lead.nome, kg.title) : false;
  // link de rede social/delivery é do lugar se o título ou o @ batem com o nome
  const linkDoLugar = (url: string, titulo: string) => {
    if (mesmoNome(lead.nome, titulo)) return true;
    let caminho = "";
    try { caminho = compactar(new URL(url).pathname); } catch { /* url estranha */ }
    const inteiro = compactar(lead.nome);
    const d = distintivos(lead.nome);
    return (inteiro.length >= 6 && caminho.includes(inteiro)) || (d.length > 0 && d.every((t) => caminho.includes(t)));
  };

  if (kg?.website && kgBate) {
    const h = host(kg.website);
    if (has(h, DELIVERY)) delivery = kg.website;
    else if (has(h, SOCIAL)) social = kg.website;
    else if (!has(h, DIRETORIOS)) site = kg.website;
  }

  for (const o of resp.organic || []) {
    const h = host(o.link);
    if (!h) continue;
    if (has(h, DELIVERY)) {
      if (linkDoLugar(o.link, o.title)) delivery ||= o.link;
    } else if (has(h, SOCIAL)) {
      if (linkDoLugar(o.link, o.title)) social ||= o.link;
    } else if (!has(h, DIRETORIOS) && pareceDoLugar(lead.nome, o.link, o.title)) {
      site ||= o.link;
    }
  }

  if (site) links.push({ tipo: "Site", url: site });
  if (delivery) links.push({ tipo: "Delivery/cardápio", url: delivery });
  if (social) links.push({ tipo: "Rede social", url: social });

  let verificacao: Verificacao;
  if (site) {
    verificacao = { status: "site", resumo: `Já tem site: ${host(site)}`, url: site, links, quando: agora() };
  } else if (delivery || social) {
    const oq = [delivery && "cardápio/delivery", social && "rede social"].filter(Boolean).join(" e ");
    verificacao = { status: "social", resumo: `Sem site próprio, mas tem ${oq}`, url: delivery || social, links, quando: agora() };
  } else {
    verificacao = { status: "sem_site", resumo: "Confirmado no Google: sem site", links, quando: agora() };
  }

  const avaliacoes = kgBate && typeof kg?.ratingCount === "number" ? kg.ratingCount : lead.avaliacoes;
  const nota = kgBate && typeof kg?.rating === "number" ? kg.rating : lead.nota;
  return { verificacao, avaliacoes, nota };
}

/** Pesquisa o lugar no Google e devolve o lead recalculado com o que foi encontrado. */
export async function verificarLead(lead: Lead, regiao: string, key: string): Promise<Lead> {
  const bairro = lead.endereco.split(",").slice(-2).join(" ").trim();
  const q = `"${lead.nome}" ${bairro || regiao}`.trim();
  const resp = await serperSearch(q, key);
  const { verificacao, avaliacoes, nota } = analisar(lead, resp);

  // site efetivo para recalcular o score
  let siteFinal = lead.site;
  if (verificacao.status === "site") siteFinal = verificacao.url!;
  else if (verificacao.status === "social" && siteKind(lead.site) !== "proprio") siteFinal = lead.site || verificacao.url!;
  else if (verificacao.status === "sem_site" && siteKind(lead.site) === "proprio") siteFinal = lead.site; // mapa diz que tem

  const raw: RawPlace = { ...lead, site: siteFinal, avaliacoes, nota };
  const novo = scoreLead(raw, "");
  return {
    ...novo,
    verificacao,
    motivos: [verificacao.resumo, novo.motivos].filter(Boolean).join(" · "),
  };
}

// ---- cache das verificações (não gastar crédito duas vezes) ----
const KEY = "csearch_verificacoes_v1";

export function cacheVerificacoes(): Record<string, Lead> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function salvarVerificacao(lead: Lead) {
  try {
    const all = cacheVerificacoes();
    all[lead.place_id] = lead;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* sem espaço: segue sem cache */
  }
}
