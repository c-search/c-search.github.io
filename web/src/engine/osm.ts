// Busca grátis no OpenStreetMap direto do navegador (mesma lógica de csearch/osm.py).
import type { RawPlace } from "./scoring";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

const CATEGORIES: [string, [string, RegExp][]][] = [
  ["Restaurante", [["amenity", /^restaurant$/]]],
  ["Lanchonete / hamburgueria", [["amenity", /^fast_food$/]]],
  ["Bar / boteco", [["amenity", /^(bar|pub|biergarten)$/]]],
  ["Cafeteria", [["amenity", /^cafe$/]]],
  ["Padaria", [["shop", /^bakery$/]]],
  ["Doceria / confeitaria", [["shop", /^(confectionery|pastry|chocolate)$/]]],
  ["Sorveteria / açaí", [["amenity", /^ice_cream$/], ["shop", /^ice_cream$/]]],
  ["Barbearia / salão", [["shop", /^hairdresser$/]]],
  ["Estética / beleza", [["shop", /^(beauty|cosmetics|massage|nails)$/]]],
  ["Tatuagem", [["shop", /^tattoo$/]]],
  ["Oficina mecânica", [["shop", /^car_repair$/], ["craft", /^(car_repair|mechanic)$/]]],
  ["Autopeças", [["shop", /^car_parts$/]]],
  ["Borracharia / pneus", [["shop", /^tyres$/]]],
  ["Lava-rápido", [["amenity", /^car_wash$/]]],
  ["Oficina / loja de motos", [["shop", /^(motorcycle|motorcycle_repair)$/]]],
  ["Mercado / mercearia", [["shop", /^(supermarket|convenience|greengrocer|general|deli)$/]]],
  ["Açougue", [["shop", /^butcher$/]]],
  ["Adega / bebidas", [["shop", /^(alcohol|beverages|wine)$/]]],
  ["Pet shop", [["shop", /^pet(_grooming)?$/]]],
  ["Veterinário", [["amenity", /^veterinary$/]]],
  ["Academia", [["leisure", /^fitness_centre$/]]],
  ["Dentista", [["amenity", /^dentist$/], ["healthcare", /^dentist$/]]],
  ["Clínica / consultório", [["amenity", /^(clinic|doctors)$/]]],
  ["Loja de roupas / calçados", [["shop", /^(clothes|shoes|boutique|fashion_accessories)$/]]],
  ["Material de construção", [["shop", /^(hardware|doityourself|paint|trade)$/]]],
  ["Móveis / marcenaria", [["shop", /^(furniture|kitchen)$/], ["craft", /^(carpenter|cabinet_maker)$/]]],
  ["Construção / reformas", [["craft", /^(builder|plasterer|tiler|roofer|stonemason|painter)$/], ["office", /^(construction_company|architect)$/]]],
  ["Eletricista / encanador", [["craft", /^(electrician|plumber|hvac)$/]]],
  ["Serralheria / vidraçaria", [["craft", /^(metal_construction|glaziery|window_construction)$/]]],
  ["Ótica", [["shop", /^optician$/]]],
  ["Floricultura", [["shop", /^(florist|garden_centre)$/]]],
  ["Papelaria / gráfica", [["shop", /^(stationery|copyshop)$/], ["craft", /^printer$/]]],
  ["Celulares / informática", [["shop", /^(mobile_phone|computer|electronics)$/]]],
  ["Imobiliária", [["office", /^estate_agent$/]]],
  ["Contabilidade / advocacia", [["office", /^(accountant|lawyer|tax_advisor)$/]]],
  ["Hotel / pousada", [["tourism", /^(hotel|guest_house|hostel|motel)$/]]],
  ["Lavanderia", [["shop", /^(laundry|dry_cleaning)$/]]],
  ["Fotografia", [["shop", /^photo$/], ["craft", /^photographer$/]]],
];

const AMENITY_RE = "restaurant|fast_food|bar|pub|biergarten|cafe|ice_cream|car_wash|veterinary|dentist|clinic|doctors";
const OFFICE_RE = "construction_company|architect|estate_agent|accountant|lawyer|tax_advisor";
const TOURISM_RE = "hotel|guest_house|hostel|motel";

export type Geo = { nome: string; osm_type: string; osm_id: number; lat: number; lon: number };

export async function geocode(lugar: string): Promise<Geo> {
  const url = `${NOMINATIM}?${new URLSearchParams({ q: lugar, format: "jsonv2", limit: "5", countrycodes: "br", "accept-language": "pt-BR" })}`;
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error("Sem conexão com o OpenStreetMap. Confira sua internet.");
  }
  if (!r.ok) throw new Error(`Não consegui localizar '${lugar}' (erro ${r.status}).`);
  const results = await r.json();
  if (!results.length) throw new Error(`Não encontrei '${lugar}'. Tente 'Cidade UF', ex.: 'Campinas SP'.`);
  const best = results.find((x: { osm_type: string }) => x.osm_type === "relation") ?? results[0];
  return { nome: best.display_name, osm_type: best.osm_type, osm_id: Number(best.osm_id), lat: Number(best.lat), lon: Number(best.lon) };
}

function areaFilter(g: Geo, raio = 3000): [string, string] {
  if (g.osm_type === "relation") return [`area(${3600000000 + g.osm_id})->.a;`, "(area.a)"];
  if (g.osm_type === "way") return [`area(${2400000000 + g.osm_id})->.a;`, "(area.a)"];
  return ["", `(around:${raio},${g.lat},${g.lon})`];
}

// ---- cache no navegador (o servidor grátis é lento) ----
const CACHE_PREFIX = "csearch_osm2_"; // v2: link do Maps corrigido
const CACHE_MS = 24 * 3600 * 1000;

// apaga o cache da versão antiga (links do Maps errados) para liberar espaço
try {
  Object.keys(localStorage).filter((k) => k.startsWith("csearch_osm_")).forEach((k) => localStorage.removeItem(k));
} catch {
  /* sem armazenamento */
}

function cacheGet(key: string): RawPlace[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    return Date.now() - t < CACHE_MS ? data : null;
  } catch {
    return null;
  }
}

function cacheSet(key: string, data: RawPlace[]) {
  const value = JSON.stringify({ t: Date.now(), data });
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, value);
      return;
    } catch {
      // sem espaço: apaga a cidade mais antiga e tenta de novo
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_PREFIX + key);
      if (!keys.length) return;
      const oldest = keys.sort((a, b) => (JSON.parse(localStorage.getItem(a) || "{}").t ?? 0) - (JSON.parse(localStorage.getItem(b) || "{}").t ?? 0))[0];
      localStorage.removeItem(oldest);
    }
  }
}

export async function fetchPlaces(g: Geo): Promise<RawPlace[]> {
  const key = `${g.osm_type}_${g.osm_id}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const [head, f] = areaFilter(g);
  const query = `
[out:json][timeout:180];
${head}
(
  nwr["shop"]["name"]${f};
  nwr["craft"]["name"]${f};
  nwr["amenity"~"^(${AMENITY_RE})$"]["name"]${f};
  nwr["office"~"^(${OFFICE_RE})$"]["name"]${f};
  nwr["tourism"~"^(${TOURISM_RE})$"]["name"]${f};
  nwr["leisure"="fitness_centre"]["name"]${f};
  nwr["healthcare"="dentist"]["name"]${f};
);
out center tags;`;

  let lastErr = "";
  for (let i = 0; i < OVERPASS.length; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 240000);
      const r = await fetch(OVERPASS[i], {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (r.ok) {
        const json = await r.json();
        const places = (json.elements || []).map(normalize).filter(Boolean) as RawPlace[];
        cacheSet(key, places);
        return places;
      }
      lastErr = `erro ${r.status}`;
    } catch (e) {
      lastErr = (e as Error).name === "AbortError" ? "demorou demais" : "falha de conexão";
    }
    await new Promise((res) => setTimeout(res, 4000 * (i + 1)));
  }
  throw new Error(`Os servidores grátis do OpenStreetMap estão ocupados (${lastErr}). Tente de novo em alguns minutos.`);
}

function categorize(tags: Record<string, string>) {
  for (const [label, rules] of CATEGORIES) {
    for (const [k, rx] of rules) if (tags[k] && rx.test(tags[k])) return label;
  }
  return null;
}

function first(tags: Record<string, string>, ...keys: string[]) {
  for (const k of keys) if (tags[k]) return tags[k].split(";")[0].trim();
  return "";
}

type OsmEl = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

function normalize(e: OsmEl): RawPlace | null {
  const tags = e.tags || {};
  const cat = categorize(tags);
  if (!cat || !tags.name) return null;
  if (tags["brand:wikidata"] || tags["brand:wikipedia"]) return null; // grandes redes não são clientes
  const site = first(tags, "website", "contact:website", "url");
  let social = first(tags, "contact:instagram", "instagram", "contact:facebook", "facebook");
  if (social && !social.startsWith("http")) social = "https://instagram.com/" + social.replace(/^@/, "");
  const telefone = first(tags, "contact:whatsapp", "whatsapp", "mobile", "contact:mobile", "phone", "contact:phone");
  const rua = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const endereco = [rua, tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ");
  const lat = e.lat ?? e.center?.lat;
  const lon = e.lon ?? e.center?.lon;
  return {
    place_id: `osm-${e.type}-${e.id}`,
    nome: tags.name,
    categoria: cat,
    endereco,
    nota: null,
    avaliacoes: null,
    site: site || social,
    telefone,
    maps_url: mapsUrl(tags.name, cat, endereco, lat, lon),
  };
}

/**
 * Link do Google Maps que procura o lugar AO REDOR do ponto certo.
 * (Colocar as coordenadas no texto da busca faz o Google procurar o nome no Brasil inteiro.)
 */
function mapsUrl(nome: string, categoria: string, endereco: string, lat?: number, lon?: number) {
  const tipo = categoria.split(" /")[0];
  const comTipo = nome.toLowerCase().includes(tipo.toLowerCase()) ? nome : `${nome} ${tipo}`;
  const texto = [comTipo, endereco].filter(Boolean).join(" ");
  if (lat && lon) return `https://www.google.com/maps/search/${encodeURIComponent(texto)}/@${lat},${lon},18z`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
}
