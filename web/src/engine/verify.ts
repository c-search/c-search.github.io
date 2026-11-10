// Verificação no Google (via Serper.dev).
//
// Como funciona (do mais confiável para o menos):
//  1. Procura a FICHA DO GOOGLE MAPS do lugar perto da localização dele (a mesma ficha que você
//     abre no botão Maps) e confirma que é o mesmo lugar pelo TELEFONE, pela DISTÂNCIA e pelo
//     ENDEREÇO — não só pelo nome, porque o nome no mapa grátis às vezes é diferente do Google
//     (ex.: "Trattoria Carasi" no mapa grátis = "Pastifício Carasi" no Google).
//  2. Se não achar pelo nome, tenta achar a ficha pelo telefone.
//  3. Se a ficha não tiver site, faz uma busca normal no Google com o nome do Google para ter certeza.
//  4. Só diz "sem site" quando ACHOU a ficha e nada apareceu. Se não achou a ficha, diz "não confirmado".
import type { Lead } from "@/lib";
import { scoreLead, siteKind, whatsappNumber, type RawPlace } from "./scoring";

export type Verificacao = {
  status: "sem_site" | "site" | "social" | "incerto" | "erro";
  resumo: string;
  url?: string;
  links: { tipo: string; url: string }[];
  quando: string;
  nomeGoogle?: string; // nome na ficha do Google (quando é diferente)
  fonte?: "maps" | "busca";
  creditos?: number;
  confirmado?: boolean; // false = só olhamos a ficha do Maps; true = conferimos também na busca do Google
};

const DELIVERY = ["ifood.com.br", "goomer", "anota.ai", "aiqfome", "rappi", "ubereats", "deliverymuch", "menudino", "cardapioweb", "olaclick", "neemo", "saipos", "instadelivery", "pedir.delivery", "cardapio.app", "bit.ly", "linktr.ee", "linkr.bio", "beacons.ai", "bio.link", "taplink", "lnk.bio"];
const SOCIAL = ["instagram.com", "facebook.com", "fb.com", "tiktok.com", "wa.me", "whatsapp.com", "api.whatsapp.com"];
// listas, guias e agregadores que citam o lugar mas não são dele
const DIRETORIOS = [
  "google.", "goo.gl", "g.page", "tripadvisor", "guiamais", "apontador", "encontra", "yelp", "restaurantguru",
  "solutudo", "telelistas", "cnpj", "casadosdados", "econodata", "empresaqui", "consultas", "waze.com",
  "moovit", "foursquare", "wikipedia", "youtube.com", "linkedin.com", "glassdoor", "indeed", "reclameaqui",
  "achei", "listamais", "infobel", "cylex", "hotfrog", "brasil.io", "mapcarta", "wikimapia", "kekanto",
  "petlove", "doctoralia", "boaconsulta", "booking.com", "trivago", "decolar", "hoteis.com", "airbnb",
  "olx.com", "mercadolivre", "spotify", "twitter.com", "x.com", "pinterest", "threads.net", "jusbrasil",
  "gov.br", "receitaws", "guiadasemana", "vejasp", "timeout.com", "zapimoveis", "vivareal",
  "maps.apple", "bing.com", "nominatim", "openstreetmap", "here.com", "groupon", "peixeurbano", "cuponomia",
  "menuweb", "sluurpy", "wanderlog", "kayak", "thefork", "opentable",
];

const STOP = new Set(["do", "da", "de", "dos", "das", "e", "o", "a", "os", "as", "the", "and", "&", "em", "no", "na",
  "ltda", "me", "eireli", "cia", "sp", "rj", "loja", "unidade", "filial"]);

// palavras que aparecem no nome de muita gente e não identificam o lugar
const GENERICAS = new Set(["bar", "restaurante", "pizzaria", "padaria", "lanchonete", "casa", "salao", "barbearia",
  "oficina", "mecanica", "auto", "center", "studio", "estudio", "academia", "pet", "shop", "mercado", "mini", "super",
  "supermercado", "mercearia", "emporio", "doceria", "confeitaria", "cafe", "cafeteria", "lanches", "pastelaria",
  "hamburgueria", "burger", "food", "beleza", "estetica", "clinica", "odontologia", "consultorio", "loja", "moda",
  "boutique", "materiais", "construcao", "acougue", "adega", "bebidas", "conveniencia", "otica", "farmacia",
  "drogaria", "hotel", "pousada", "lava", "rapido", "borracharia", "pneus", "sorveteria", "acai", "sushi", "grill",
  "churrascaria", "espetinho", "tattoo", "tatuagem", "imobiliaria", "contabilidade", "advocacia", "advogados",
  "papelaria", "grafica", "floricultura", "veterinaria", "veterinario", "comercio", "servicos", "express", "point",
  "novo", "nova", "trattoria", "cantina", "pastificio", "bistro", "boteco", "lanchonete", "pub", "house", "kitchen"]);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (n: string) => norm(n).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t));
const compactar = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");
const distintivos = (n: string) => tokens(n).filter((t) => !GENERICAS.has(t) && t.length >= 4);
const digitos = (s?: string) => (s || "").replace(/\D/g, "");

function host(url: string) {
  try {
    return new URL(url.includes("://") ? url : "http://" + url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** O host pertence a algum domínio da lista? ("x.com" não casa com "pastelx.com.br") */
const has = (h: string, list: string[]) =>
  list.some((d) => (d.includes(".") && !d.endsWith(".") ? h === d || h.endsWith("." + d) : h.includes(d)));

/** Os nomes têm alguma palavra que identifica o lugar em comum? ("Trattoria Carasi" x "Pastifício Carasi" → "carasi") */
function palavraEmComum(a: string, b: string) {
  const ca = compactar(a), cb = compactar(b);
  if (ca.length >= 5 && cb.length >= 5 && (ca.includes(cb) || cb.includes(ca))) return true;
  const nb = norm(b);
  return distintivos(a).some((t) => nb.includes(t));
}

const TLD = new Set(["com", "br", "net", "org", "site", "app", "io", "co", "online", "store", "shop", "rest", "food", "wixsite", "negocio", "wordpress", "blogspot", "ind", "art"]);

/** O link parece ser do próprio estabelecimento (algum dos nomes dele está no domínio)? */
function dominioDoLugar(nomes: string[], url: string) {
  const dom = host(url).split(".").filter((p) => !TLD.has(p)).join("");
  return nomes.some((n) => {
    const inteiro = compactar(n);
    const semStop = tokens(n).join("");
    if ((inteiro.length >= 6 && dom.includes(inteiro)) || (semStop.length >= 6 && dom.includes(semStop))) return true;
    const d = distintivos(n);
    return d.length > 0 && d.some((t) => t.length >= 5 && dom.includes(t));
  });
}

function distanciaM(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371000, r = Math.PI / 180;
  const a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

type Place = { title: string; address?: string; latitude?: number; longitude?: number; rating?: number; ratingCount?: number; phoneNumber?: string; website?: string; category?: string; cid?: string };
type Busca = { knowledgeGraph?: { title?: string; website?: string; rating?: number; ratingCount?: number }; organic?: { title: string; link: string }[] };

/** Nota de 0 a 100: o quanto essa ficha do Google parece ser o mesmo lugar. */
export function pontuarFicha(l: Lead, p: Place) {
  let s = 0;
  const tl = digitos(l.telefone).slice(-8), tp = digitos(p.phoneNumber).slice(-8);
  if (tl.length === 8 && tl === tp) s += 60;
  if (l.lat && l.lon && p.latitude && p.longitude) {
    const d = distanciaM(l.lat, l.lon, p.latitude, p.longitude);
    s += d < 80 ? 40 : d < 250 ? 25 : d < 600 ? 10 : d > 2000 ? -40 : 0;
  }
  if (palavraEmComum(l.nome, p.title) || palavraEmComum(p.title, l.nome)) s += 25;
  const numL = (l.endereco.match(/\b\d{1,5}\b/) || [])[0];
  if (numL && p.address && new RegExp(`\\b${numL}\\b`).test(p.address)) s += 15;
  return s;
}

function agora() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

async function serper(endpoint: "search" | "places", body: object, key: string) {
  const r = await fetch(`https://google.serper.dev/${endpoint}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ gl: "br", hl: "pt-br", ...body }),
  });
  if (r.status === 401 || r.status === 403) throw new Error("Chave do Serper inválida. Confira em Configurações.");
  if (r.status === 400 || r.status === 402) throw new Error("Seus créditos do Serper acabaram.");
  if (!r.ok) throw new Error(`Erro ${r.status} no Serper.`);
  return r.json();
}

function classificar(url: string): "site" | "delivery" | "social" | "ignorar" {
  const h = host(url);
  if (!h) return "ignorar";
  if (has(h, DELIVERY)) return "delivery";
  if (has(h, SOCIAL)) return "social";
  if (has(h, DIRETORIOS)) return "ignorar";
  return "site";
}

/** Analisa a ficha encontrada + a busca normal e decide. Exportada para testes. */
export function decidir(l: Lead, ficha: Place | null, busca: Busca | null): Verificacao {
  const links: Verificacao["links"] = [];
  const nomes = [l.nome, ficha?.title].filter(Boolean) as string[];
  let site = "", delivery = "", social = "";

  if (ficha?.website) {
    const c = classificar(ficha.website);
    if (c === "site") site = ficha.website;
    else if (c === "delivery") delivery = ficha.website;
    else if (c === "social") social = ficha.website;
  }

  const kg = busca?.knowledgeGraph;
  if (kg?.website && kg.title && nomes.some((n) => palavraEmComum(n, kg.title!))) {
    const c = classificar(kg.website);
    if (c === "site") site ||= kg.website;
    else if (c === "delivery") delivery ||= kg.website;
    else if (c === "social") social ||= kg.website;
  }

  for (const o of busca?.organic || []) {
    const c = classificar(o.link);
    if (c === "ignorar") continue;
    const doLugar = nomes.some((n) => palavraEmComum(n, o.title)) || dominioDoLugar(nomes, o.link);
    if (!doLugar) continue;
    if (c === "site" && dominioDoLugar(nomes, o.link)) site ||= o.link;
    else if (c === "delivery") delivery ||= o.link;
    else if (c === "social") social ||= o.link;
  }

  if (site) links.push({ tipo: "Site", url: site });
  if (delivery) links.push({ tipo: "Cardápio/delivery", url: delivery });
  if (social) links.push({ tipo: "Rede social", url: social });
  const nomeGoogle = ficha && compactar(ficha.title) !== compactar(l.nome) ? ficha.title : undefined;
  const base = { links, quando: agora(), nomeGoogle, fonte: (ficha ? "maps" : "busca") as Verificacao["fonte"], confirmado: true };

  if (site) return { ...base, status: "site", resumo: `Já tem site: ${host(site)}`, url: site };
  if (delivery || social) {
    const oq = [delivery && "cardápio/delivery", social && "rede social"].filter(Boolean).join(" e ");
    return { ...base, status: "social", resumo: `Sem site próprio, mas tem ${oq}`, url: delivery || social };
  }
  if (ficha) return { ...base, status: "sem_site", resumo: "Confirmado: sem site no Maps e na busca do Google" };
  return { ...base, status: "incerto", resumo: "Não achei no Google Maps: confira antes de chamar" };
}

/** Pesquisa o lugar no Google e devolve o lead recalculado com o que foi encontrado. */
export async function verificarLead(l: Lead, regiao: string, key: string): Promise<Lead> {
  const ll = l.lat && l.lon ? `@${l.lat},${l.lon},17z` : undefined;
  // sempre manda a cidade junto do nome (se o Serper ignorar o "ll", ainda procura na cidade certa)
  const cidade = l.endereco.split(",").map((s) => s.trim()).filter(Boolean).pop() || regiao.split(",")[0];
  const local = ll ? ` ${cidade}` : ` ${l.endereco || regiao}`;
  let creditos = 0;
  const melhor = (ps: Place[]) => ps.map((p) => ({ p, s: pontuarFicha(l, p) })).sort((a, b) => b.s - a.s)[0];

  // Lugar que já veio do Google Maps: a ficha é ele mesmo (não gasta crédito procurando de novo)
  const veioDoMaps = l.place_id.startsWith("g-");
  let ficha: Place | null = veioDoMaps
    ? { title: l.nome, address: l.endereco, latitude: l.lat, longitude: l.lon, phoneNumber: l.telefone, rating: l.nota ?? undefined, ratingCount: l.avaliacoes ?? undefined, website: l.site || undefined }
    : null;
  let m: { p: Place; s: number } | undefined;

  // 1) ficha do Google Maps pelo nome, perto do lugar
  if (!ficha) {
    const r1 = await serper("places", { q: l.nome + local, ...(ll ? { ll } : {}) }, key);
    creditos++;
    m = melhor(r1.places || []);
    if (m && m.s >= 50) ficha = m.p;
  }

  // 2) não achou: tenta pelo telefone
  if (!ficha && digitos(l.telefone).length >= 10) {
    const r2 = await serper("places", { q: l.telefone, ...(ll ? { ll } : {}) }, key);
    creditos++;
    m = melhor(r2.places || []);
    if (m && m.s >= 50) ficha = m.p;
  }

  // 3) a ficha não tem site próprio (ou não achou a ficha): busca normal para ter certeza
  let busca: Busca | null = null;
  if (!ficha?.website || classificar(ficha.website) !== "site") {
    const nome = ficha?.title || l.nome;
    // bairro: no endereço do Google vem depois do número ("R. da Mooca, 1000 - Mooca, São Paulo - SP" → "Mooca")
    const end = ficha?.address || l.endereco;
    const bairro = (end.match(/\d+\s*-\s*([^,]+)/) || [])[1]?.trim() || l.endereco.split(",").slice(-2, -1)[0]?.trim() || regiao.split(",")[0];
    busca = await serper("search", { q: `${nome} ${bairro}`.trim(), num: 10 }, key);
    creditos++;
  }

  const verificacao = { ...decidir(l, ficha, busca), creditos };

  // recalcula com o que o Google mostrou (site, avaliações, telefone)
  let siteFinal = l.site;
  if (verificacao.status === "site") siteFinal = verificacao.url!;
  else if (verificacao.status === "social" && siteKind(l.site) !== "proprio") siteFinal = l.site || verificacao.url!;
  const telefone = l.telefone || ficha?.phoneNumber || "";
  const raw: RawPlace = {
    ...l,
    site: siteFinal,
    telefone,
    avaliacoes: typeof ficha?.ratingCount === "number" ? ficha.ratingCount : l.avaliacoes,
    nota: typeof ficha?.rating === "number" ? ficha.rating : l.nota,
  };
  const novo = scoreLead(raw, "");
  return {
    ...novo,
    whatsapp: novo.whatsapp || whatsappNumber(telefone),
    // achou a ficha: o botão Maps passa a abrir exatamente ela
    maps_url: ficha?.cid ? `https://www.google.com/maps?cid=${ficha.cid}` : l.maps_url,
    verificacao,
    motivos: [verificacao.resumo, novo.motivos].filter(Boolean).join(" · "),
  };
}

/** Ainda vale conferir no Google? (nunca verificado, ou só vimos a ficha do Maps sem site) */
export function precisaConfirmar(l: Lead) {
  return !l.verificacao || (l.verificacao.status === "sem_site" && l.verificacao.confirmado === false);
}

// ---- cache das verificações (não gastar crédito duas vezes) ----
// v2: a verificação antiga comparava só o nome e errava; as antigas são descartadas.
const KEY = "csearch_verificacoes_v2";
try { localStorage.removeItem("csearch_verificacoes_v1"); } catch { /* sem armazenamento */ }

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
