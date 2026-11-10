// Monta e lê o link do "exemplo pronto" (todos os dados vão no próprio link).
import type { Lead } from "@/lib";
import { proposta } from "./pricing";

export const SITE_PUBLICO = "https://c-search.github.io/";

export type ExampleData = {
  n: string; // nome
  k: "cardapio" | "site" | "portfolio";
  c: string; // categoria
  t?: string; // telefone
  e?: string; // endereço
  w?: string; // whatsapp do estabelecimento
  by?: string; // seu nome
  bw?: string; // seu whatsapp
  la?: number; // latitude (mapa)
  lo?: number; // longitude
  r?: number; // nota real no Google
  rc?: number; // nº de avaliações reais
  a?: string; // cor de destaque escolhida
  h?: string; // frase de destaque personalizada
  img?: string[]; // fotos reais do lugar (URLs)
};

function b64urlEncode(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function exampleKind(l: Lead): ExampleData["k"] {
  const p = proposta(l).pacote;
  if (p === "Presença Digital") return "cardapio";
  if (p === "Vitrine") return "portfolio";
  return "site";
}

export type ExampleOpts = { meuNome: string; meuWhats: string; cor?: string; frase?: string; tipo?: ExampleData["k"]; fotos?: string[] };

export function exampleData(l: Lead, o: ExampleOpts): ExampleData {
  const meu = o.meuWhats.replace(/\D/g, "");
  const d: ExampleData = {
    n: l.nome.replace(/^\[DEMO\]\s*/, ""),
    k: o.tipo || exampleKind(l),
    c: l.categoria.split(" /")[0],
    t: l.telefone || undefined,
    e: l.endereco || undefined,
    w: l.whatsapp || undefined,
    by: o.meuNome.trim() || undefined,
    bw: meu ? (meu.startsWith("55") ? meu : "55" + meu) : undefined,
    la: l.lat ? Math.round(l.lat * 1e5) / 1e5 : undefined,
    lo: l.lon ? Math.round(l.lon * 1e5) / 1e5 : undefined,
    r: l.nota ?? undefined,
    rc: l.avaliacoes ?? undefined,
    a: o.cor || undefined,
    h: o.frase?.trim() || undefined,
    img: o.fotos?.length ? o.fotos : undefined,
  };
  return d;
}

/** Link longo (os dados vão dentro do próprio link). Sempre o endereço público. */
export function linkLongo(d: ExampleData) {
  return `${SITE_PUBLICO}#/exemplo?d=${b64urlEncode(JSON.stringify(d))}`;
}

export function exampleLink(l: Lead, o: ExampleOpts) {
  return linkLongo(exampleData(l, o));
}

export function decodeExample(hash: string): ExampleData | null {
  const m = hash.match(/[?&]d=([^&]+)/);
  if (!m) return null;
  try {
    const d = JSON.parse(b64urlDecode(m[1]));
    return d?.n ? d : null;
  } catch {
    return null;
  }
}

/** Mapa do OpenStreetMap (sem chave) centrado no lugar. */
export function mapaEmbed(la?: number, lo?: number) {
  if (!la || !lo) return "";
  const d = 0.004;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lo - d},${la - d},${lo + d},${la + d}&layer=mapnik&marker=${la},${lo}`;
}
