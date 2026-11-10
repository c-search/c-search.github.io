// Busca DIRETO no Google Maps (via Serper.dev). É a fonte confiável:
// lugares reais e atuais, com o site, telefone e avaliações da própria ficha do Google.
import type { Lead } from "@/lib";
import { scoreLead, type RawPlace } from "./scoring";
import { geocode } from "./osm";
import type { Verificacao } from "./verify";

type Place = {
  title: string; address?: string; latitude?: number; longitude?: number; rating?: number; ratingCount?: number;
  category?: string; phoneNumber?: string; website?: string; cid?: string; placeId?: string; fid?: string;
};

const DELIVERY = ["ifood.com.br", "goomer", "anota.ai", "aiqfome", "rappi", "ubereats", "deliverymuch", "menudino", "cardapioweb", "olaclick", "neemo", "saipos", "instadelivery", "pedir.delivery", "cardapio.app", "bit.ly", "linktr.ee", "linkr.bio", "beacons.ai", "bio.link", "taplink", "lnk.bio"];
const SOCIAL = ["instagram.com", "facebook.com", "fb.com", "tiktok.com", "wa.me", "whatsapp.com"];

function host(url: string) {
  try {
    return new URL(url.includes("://") ? url : "http://" + url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
const has = (h: string, list: string[]) => list.some((d) => (d.includes(".") ? h === d || h.endsWith("." + d) : h.includes(d)));

/** Link que abre EXATAMENTE a ficha do lugar no Google Maps (não uma lista). */
export function linkFicha(p: Place) {
  if (p.cid) return `https://www.google.com/maps?cid=${p.cid}`;
  if (p.placeId) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.title)}&query_place_id=${p.placeId}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.title} ${p.address || ""}`.trim())}`;
}

function agora() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

/** O que a ficha do Google já diz sobre o site (sem gastar crédito extra). */
function verificacaoDaFicha(p: Place): Verificacao {
  const base = { links: [] as Verificacao["links"], quando: agora(), fonte: "maps" as const, confirmado: false };
  if (p.website) {
    const h = host(p.website);
    if (has(h, DELIVERY)) return { ...base, status: "social", resumo: `Sem site próprio, mas tem cardápio/link (${h})`, url: p.website, links: [{ tipo: "Link da ficha", url: p.website }], confirmado: true };
    if (has(h, SOCIAL)) return { ...base, status: "social", resumo: `Sem site próprio, só ${h.split(".")[0]}`, url: p.website, links: [{ tipo: "Rede social", url: p.website }], confirmado: true };
    return { ...base, status: "site", resumo: `Já tem site: ${h}`, url: p.website, links: [{ tipo: "Site", url: p.website }], confirmado: true };
  }
  return { ...base, status: "sem_site", resumo: "Ficha do Google Maps sem site" };
}

async function places(body: object, key: string): Promise<Place[]> {
  const r = await fetch("https://google.serper.dev/places", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ gl: "br", hl: "pt-br", ...body }),
  });
  if (r.status === 401 || r.status === 403) throw new Error("Chave do Serper inválida. Confira em Configurações.");
  if (r.status === 400 || r.status === 402) throw new Error("Seus créditos do Serper acabaram.");
  if (!r.ok) throw new Error(`Erro ${r.status} no Serper.`);
  return (await r.json()).places || [];
}

export function normalizarFicha(p: Place, termo: string): Lead {
  const id = p.cid || p.placeId || p.fid || `${p.title}|${p.address}`;
  const raw: RawPlace = {
    place_id: `g-${id}`,
    nome: p.title,
    categoria: p.category || termo,
    endereco: p.address || "",
    nota: typeof p.rating === "number" ? p.rating : null,
    avaliacoes: typeof p.ratingCount === "number" ? p.ratingCount : 0,
    site: p.website || "",
    telefone: p.phoneNumber || "",
    maps_url: linkFicha(p),
    lat: p.latitude,
    lon: p.longitude,
  };
  const lead = scoreLead(raw, termo);
  const verificacao = verificacaoDaFicha(p);
  return { ...lead, verificacao, motivos: [verificacao.resumo, lead.motivos].filter(Boolean).join(" · ") };
}

/**
 * Procura "termo" (ex.: "restaurante") em cada área (cidade ou bairros), algumas páginas por área.
 * Cada página traz ~20 lugares e custa 1 crédito.
 */
export async function buscarGoogleMaps(
  termo: string, cidade: string, bairros: string[], key: string, paginas = 3, onProgress?: (m: string) => void,
): Promise<{ area: string; leads: Lead[]; creditos: number }> {
  const areas = bairros.length ? bairros.map((b) => `${b}, ${cidade}`) : [cidade];
  const porId = new Map<string, Lead>();
  let creditos = 0;
  for (let a = 0; a < areas.length; a++) {
    let ll: string | undefined;
    try {
      const g = await geocode(areas[a]);
      ll = `@${g.lat},${g.lon},${bairros.length ? 15 : 13}z`;
    } catch {
      /* sem coordenada: busca só pelo texto */
    }
    for (let pg = 1; pg <= paginas; pg++) {
      onProgress?.(`${areas.length > 1 ? `Área ${a + 1} de ${areas.length} · ` : ""}${areas[a]} · página ${pg} de ${paginas}`);
      const ps = await places({ q: `${termo} em ${areas[a]}`, ...(ll ? { ll } : {}), page: pg }, key);
      creditos++;
      ps.forEach((p) => { const l = normalizarFicha(p, termo); porId.set(l.place_id, l); });
      if (ps.length < 10) break; // acabou
    }
  }
  return { area: bairros.length ? `${bairros.join(" + ")}, ${cidade}` : cidade, leads: [...porId.values()], creditos };
}
