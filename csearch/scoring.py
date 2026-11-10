"""Classifica cada estabelecimento como oportunidade de venda (lead)."""
from __future__ import annotations

import re
from urllib.parse import quote, urlparse

# Domínios que NÃO contam como "site próprio"
SOCIAL_DOMAINS = [
    "instagram.com", "facebook.com", "fb.com", "linktr.ee", "linktree", "wa.me",
    "whatsapp.com", "tiktok.com", "youtube.com", "twitter.com", "x.com",
    "ifood.com.br", "goomer", "anota.ai", "aiqfome", "rappi", "ubereats", "bit.ly",
    "google.com", "business.site", "g.page", "beacons.ai", "bio.link", "taplink",
]

FOOD_WORDS = [
    "restaurante", "lanchonete", "pizzaria", "hamburgueria", "bar", "café", "cafe",
    "cafeteria", "padaria", "doceria", "confeitaria", "sorveteria", "açaí", "acai",
    "churrascaria", "sushi", "japonês", "japones", "marmitaria", "pastelaria",
    "food", "comida", "espetinho", "bistrô", "bistro", "cervejaria", "adega",
]

PORTFOLIO_WORDS = [
    "empreiteira", "construtora", "construção", "reforma", "pedreiro", "arquitet",
    "marcenaria", "serralheria", "pintor", "gesso", "vidraçaria", "móveis planejados",
    "tatuagem", "tattoo", "fotógraf", "fotograf", "estúdio", "studio", "design",
    "paisagismo", "decoração", "eventos", "buffet",
]


def site_kind(url: str) -> str:
    """'nenhum', 'rede_social' ou 'proprio'."""
    if not url:
        return "nenhum"
    low = url.strip().lower()
    host = urlparse(low if "://" in low else "http://" + low).netloc.split(":")[0]
    host = host[4:] if host.startswith("www.") else host
    for d in SOCIAL_DOMAINS:
        if "." in d:
            if host == d or host.endswith("." + d):
                return "rede_social"
        elif d in host:  # palavras soltas como 'goomer', 'linktree'
            return "rede_social"
    return "proprio"


def _has_word(text: str, words: list[str]) -> bool:
    # \b no início evita que "bar" case com "barbearia"
    return any(re.search(r"\b" + re.escape(w) + (r"\b" if len(w) <= 4 else ""), text) for w in words)


def suggest_offer(categoria: str, termo_busca: str, kind: str, avaliacoes: int | None) -> str:
    text = f"{categoria} {termo_busca}".lower()
    offers = []
    if kind != "proprio":
        if _has_word(text, FOOD_WORDS):
            offers.append("Cardápio digital")
        elif _has_word(text, PORTFOLIO_WORDS):
            offers.append("Site + portfólio")
        else:
            offers.append("Site profissional")
    if avaliacoes is not None and avaliacoes < 30:
        offers.append("Perfil Google / avaliações")
    return " + ".join(offers) if offers else "Melhoria do site"


def score_lead(lead: dict, termo_busca: str = "") -> dict:
    kind = site_kind(lead.get("site", ""))
    raw_n = lead.get("avaliacoes")
    sem_avaliacoes = raw_n is None or (isinstance(raw_n, float) and raw_n != raw_n)  # None ou NaN
    n = None if sem_avaliacoes else int(raw_n)
    score = 0
    motivos = []

    if kind == "nenhum":
        score += 50
        motivos.append("sem site")
    elif kind == "rede_social":
        score += 35
        motivos.append("só rede social/delivery")

    if n is None:
        pass  # fonte sem avaliações (OpenStreetMap): confira no Google Maps
    elif n == 0:
        score += 30
        motivos.append("nenhuma avaliação")
    elif n < 10:
        score += 25
        motivos.append(f"só {n} avaliações")
    elif n < 30:
        score += 15
        motivos.append(f"{n} avaliações")
    elif n < 60:
        score += 5

    if lead.get("telefone"):
        score += 15
    else:
        motivos.append("sem telefone cadastrado")

    if n is None:
        # fonte sem avaliações: site vale até 60 e ter telefone vale 40
        # (sem site + telefone = 100 Quente; sem site sem telefone = 60 Morno; site próprio = Frio)
        score = {"nenhum": 60, "rede_social": 45, "proprio": 0}[kind] + (40 if lead.get("telefone") else 0)
    score = min(score, 100)
    nivel = "🔥 Quente" if score >= 70 else ("🟡 Morno" if score >= 45 else "❄️ Frio")

    return {
        **lead,
        "tipo_site": {"nenhum": "Nenhum", "rede_social": "Só rede social", "proprio": "Site próprio"}[kind],
        "score": score,
        "nivel": nivel,
        "motivos": ", ".join(motivos),
        "oferta": suggest_offer(lead.get("categoria", ""), termo_busca, kind, n),
        "whatsapp": whatsapp_number(lead.get("telefone", "")),
    }


def whatsapp_number(telefone: str) -> str:
    """Retorna '55DDXXXXXXXXX' se parecer celular brasileiro, senão ''."""
    digits = re.sub(r"\D", "", telefone or "")
    if digits.startswith("0"):
        digits = digits.lstrip("0")
    if digits.startswith("55") and len(digits) in (12, 13):
        digits = digits[2:]
    # celular: DDD (2) + 9 dígitos começando com 9
    if len(digits) == 11 and digits[2] == "9":
        return "55" + digits
    return ""


def whatsapp_link(numero: str, mensagem: str) -> str:
    if not numero:
        return ""
    return f"https://wa.me/{numero}?text={quote(mensagem)}"


def fill_template(template: str, lead: dict, cidade: str = "") -> str:
    return (
        template.replace("{nome}", lead.get("nome", ""))
        .replace("{oferta}", (lead.get("oferta") or "um site").lower())
        .replace("{cidade}", cidade)
        .replace("{avaliacoes}", str(lead.get("avaliacoes") or 0))
    )


def rank_categories(leads: list[dict]) -> "list[dict]":
    """Resume por categoria: onde há mais negócios sem site próprio e com contato."""
    stats: dict[str, dict] = {}
    for l in leads:
        s = stats.setdefault(l["categoria"], {"categoria": l["categoria"], "total": 0, "sem_site": 0,
                                               "so_rede_social": 0, "com_telefone": 0, "leads_bons": 0})
        s["total"] += 1
        sem_proprio = l["tipo_site"] != "Site próprio"
        s["sem_site"] += l["tipo_site"] == "Nenhum"
        s["so_rede_social"] += l["tipo_site"] == "Só rede social"
        s["com_telefone"] += bool(l.get("telefone"))
        s["leads_bons"] += sem_proprio and bool(l.get("telefone"))
    out = []
    for s in stats.values():
        s["pct_sem_site"] = round(100 * (s["sem_site"] + s["so_rede_social"]) / s["total"])
        s["oferta"] = suggest_offer(s["categoria"], "", "nenhum", None)
        out.append(s)
    out.sort(key=lambda s: (s["leads_bons"], s["sem_site"] + s["so_rede_social"]), reverse=True)
    return out
