"""Busca gratuita de estabelecimentos no OpenStreetMap (Nominatim + Overpass).

Uma única consulta traz todos os comércios com nome da cidade/bairro; depois
separamos por categoria localmente. Assim dá para comparar categorias e achar
as que têm mais negócios sem site.
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path
from urllib.parse import quote_plus

import requests

USER_AGENT = "C-Search/0.1 (ferramenta local de prospeccao de clientes)"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

# (rótulo, [(chave, regex do valor)])
CATEGORIES: list[tuple[str, list[tuple[str, str]]]] = [
    ("Restaurante", [("amenity", r"^restaurant$")]),
    ("Lanchonete / hamburgueria", [("amenity", r"^fast_food$")]),
    ("Bar / boteco", [("amenity", r"^(bar|pub|biergarten)$")]),
    ("Cafeteria", [("amenity", r"^cafe$")]),
    ("Padaria", [("shop", r"^bakery$")]),
    ("Doceria / confeitaria", [("shop", r"^(confectionery|pastry|chocolate)$")]),
    ("Sorveteria / açaí", [("amenity", r"^ice_cream$"), ("shop", r"^ice_cream$")]),
    ("Barbearia / salão", [("shop", r"^hairdresser$")]),
    ("Estética / beleza", [("shop", r"^(beauty|cosmetics|massage|nails)$")]),
    ("Tatuagem", [("shop", r"^tattoo$")]),
    ("Oficina mecânica", [("shop", r"^car_repair$"), ("craft", r"^(car_repair|mechanic)$")]),
    ("Autopeças", [("shop", r"^car_parts$")]),
    ("Borracharia / pneus", [("shop", r"^tyres$")]),
    ("Lava-rápido", [("amenity", r"^car_wash$")]),
    ("Oficina / loja de motos", [("shop", r"^(motorcycle|motorcycle_repair)$")]),
    ("Mercado / mercearia", [("shop", r"^(supermarket|convenience|greengrocer|general|deli)$")]),
    ("Açougue", [("shop", r"^butcher$")]),
    ("Adega / bebidas", [("shop", r"^(alcohol|beverages|wine)$")]),
    ("Pet shop", [("shop", r"^pet(_grooming)?$")]),
    ("Veterinário", [("amenity", r"^veterinary$")]),
    ("Academia", [("leisure", r"^fitness_centre$")]),
    ("Dentista", [("amenity", r"^dentist$"), ("healthcare", r"^dentist$")]),
    ("Clínica / consultório", [("amenity", r"^(clinic|doctors)$")]),
    ("Loja de roupas / calçados", [("shop", r"^(clothes|shoes|boutique|fashion_accessories)$")]),
    ("Material de construção", [("shop", r"^(hardware|doityourself|paint|trade)$")]),
    ("Móveis / marcenaria", [("shop", r"^(furniture|kitchen)$"), ("craft", r"^(carpenter|cabinet_maker)$")]),
    ("Construção / reformas", [("craft", r"^(builder|plasterer|tiler|roofer|stonemason|painter)$"),
                               ("office", r"^(construction_company|architect)$")]),
    ("Eletricista / encanador", [("craft", r"^(electrician|plumber|hvac)$")]),
    ("Serralheria / vidraçaria", [("craft", r"^(metal_construction|glaziery|window_construction)$")]),
    ("Ótica", [("shop", r"^optician$")]),
    ("Floricultura", [("shop", r"^(florist|garden_centre)$")]),
    ("Papelaria / gráfica", [("shop", r"^(stationery|copyshop)$"), ("craft", r"^printer$")]),
    ("Celulares / informática", [("shop", r"^(mobile_phone|computer|electronics)$")]),
    ("Imobiliária", [("office", r"^estate_agent$")]),
    ("Contabilidade / advocacia", [("office", r"^(accountant|lawyer|tax_advisor)$")]),
    ("Hotel / pousada", [("tourism", r"^(hotel|guest_house|hostel|motel)$")]),
    ("Lavanderia", [("shop", r"^(laundry|dry_cleaning)$")]),
    ("Fotografia", [("shop", r"^photo$"), ("craft", r"^photographer$")]),
]

AMENITY_RE = "restaurant|fast_food|bar|pub|biergarten|cafe|ice_cream|car_wash|veterinary|dentist|clinic|doctors"
OFFICE_RE = "construction_company|architect|estate_agent|accountant|lawyer|tax_advisor"
TOURISM_RE = "hotel|guest_house|hostel|motel"


class OSMError(Exception):
    pass


def geocode(lugar: str) -> dict:
    """Converte 'Campinas SP' ou 'Cambuí, Campinas' numa área do OpenStreetMap."""
    r = requests.get(
        NOMINATIM,
        params={"q": lugar, "format": "jsonv2", "limit": 5, "countrycodes": "br"},
        headers={"User-Agent": USER_AGENT, "Accept-Language": "pt-BR"},
        timeout=30,
    )
    if r.status_code != 200:
        raise OSMError(f"Não consegui localizar '{lugar}' (erro {r.status_code}).")
    results = r.json()
    if not results:
        raise OSMError(f"Não encontrei '{lugar}'. Tente 'Cidade UF', ex.: 'Campinas SP'.")
    best = next((x for x in results if x.get("osm_type") == "relation"), results[0])
    return {
        "nome": best.get("display_name", lugar),
        "osm_type": best.get("osm_type"),
        "osm_id": int(best.get("osm_id")),
        "lat": float(best["lat"]),
        "lon": float(best["lon"]),
    }


def _area_filter(geo: dict, raio_m: int) -> tuple[str, str]:
    if geo["osm_type"] == "relation":
        return f"area({3600000000 + geo['osm_id']})->.a;", "(area.a)"
    if geo["osm_type"] == "way":
        return f"area({2400000000 + geo['osm_id']})->.a;", "(area.a)"
    return "", f"(around:{raio_m},{geo['lat']},{geo['lon']})"


CACHE_DIR = Path(__file__).resolve().parent.parent / "dados" / "cache_osm"
CACHE_HORAS = 24


def fetch_places(geo: dict, raio_m: int = 3000) -> list[dict]:
    """Igual a _fetch_places, mas guarda o resultado em disco por 24h (o servidor grátis é lento)."""
    cache = CACHE_DIR / f"{geo['osm_type']}_{geo['osm_id']}_{raio_m}.json"
    if cache.exists() and time.time() - cache.stat().st_mtime < CACHE_HORAS * 3600:
        return json.loads(cache.read_text(encoding="utf-8"))
    result = _fetch_places(geo, raio_m)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


def _fetch_places(geo: dict, raio_m: int) -> list[dict]:
    head, f = _area_filter(geo, raio_m)
    query = f"""
[out:json][timeout:180];
{head}
(
  nwr["shop"]["name"]{f};
  nwr["craft"]["name"]{f};
  nwr["amenity"~"^({AMENITY_RE})$"]["name"]{f};
  nwr["office"~"^({OFFICE_RE})$"]["name"]{f};
  nwr["tourism"~"^({TOURISM_RE})$"]["name"]{f};
  nwr["leisure"="fitness_centre"]["name"]{f};
  nwr["healthcare"="dentist"]["name"]{f};
);
out center tags;
"""
    last_err = ""
    # o servidor principal é o mais estável; tentamos ele de novo antes de desistir
    tentativas = [OVERPASS_MIRRORS[0], OVERPASS_MIRRORS[1], OVERPASS_MIRRORS[0], OVERPASS_MIRRORS[2], OVERPASS_MIRRORS[0]]
    for i, url in enumerate(tentativas):
        try:
            r = requests.post(url, data={"data": query}, headers={"User-Agent": USER_AGENT}, timeout=240)
        except requests.RequestException as e:
            last_err = type(e).__name__
            continue
        if r.status_code == 200:
            elements = r.json().get("elements", [])
            return [p for p in (_normalize(e) for e in elements) if p]
        last_err = f"erro {r.status_code}"
        time.sleep(5 * (i + 1))
    raise OSMError(f"Servidores do OpenStreetMap ocupados ({last_err}). Tente de novo em 1 minuto.")


def categorize(tags: dict) -> str | None:
    for label, rules in CATEGORIES:
        for key, rx in rules:
            if key in tags and re.search(rx, tags[key]):
                return label
    return None


def _first(tags: dict, *keys: str) -> str:
    for k in keys:
        if tags.get(k):
            return tags[k].split(";")[0].strip()
    return ""


def _normalize(e: dict) -> dict | None:
    tags = e.get("tags", {})
    cat = categorize(tags)
    if not cat or not tags.get("name"):
        return None
    if tags.get("brand:wikidata") or tags.get("brand:wikipedia"):
        return None  # grandes redes (McDonald's, Drogasil...) não são clientes
    site = _first(tags, "website", "contact:website", "url")
    social = _first(tags, "contact:instagram", "instagram", "contact:facebook", "facebook")
    if social and not social.startswith("http"):
        social = "https://instagram.com/" + social.lstrip("@")
    phone = _first(tags, "contact:whatsapp", "whatsapp", "mobile", "contact:mobile", "phone", "contact:phone")
    endereco = ", ".join(x for x in [
        " ".join(x for x in [tags.get("addr:street", ""), tags.get("addr:housenumber", "")] if x),
        tags.get("addr:suburb", ""),
        tags.get("addr:city", ""),
    ] if x)
    lat = e.get("lat") or (e.get("center") or {}).get("lat")
    lon = e.get("lon") or (e.get("center") or {}).get("lon")
    busca_maps = f"{tags['name']} {endereco or ''}".strip()
    if lat and lon and not endereco:
        maps_url = f"https://www.google.com/maps/search/?api=1&query={quote_plus(tags['name'])}%20{lat},{lon}"
    else:
        maps_url = f"https://www.google.com/maps/search/?api=1&query={quote_plus(busca_maps)}"
    return {
        "place_id": f"osm-{e['type']}-{e['id']}",
        "nome": tags["name"],
        "categoria": cat,
        "endereco": endereco,
        "nota": None,
        "avaliacoes": None,  # OSM não tem avaliações
        "site": site or social,
        "telefone": phone,
        "telefone_intl": "",
        "maps_url": maps_url,
        "status_google": "",
        "bairro": tags.get("addr:suburb", ""),
    }
