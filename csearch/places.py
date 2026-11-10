"""Busca de estabelecimentos na Google Places API (New) - Text Search."""
from __future__ import annotations

import time

import requests

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

FIELDS = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.googleMapsUri",
    "places.primaryTypeDisplayName",
    "places.businessStatus",
    "nextPageToken",
]


class PlacesError(Exception):
    pass


def search_text(query: str, api_key: str, max_pages: int = 3) -> list[dict]:
    """Busca um texto (ex.: 'barbearia em Campinas SP'). Cada página = 1 requisição
    cobrada e traz até 20 lugares; o Google entrega no máximo 3 páginas (60 lugares)."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(FIELDS),
    }
    body = {"textQuery": query, "languageCode": "pt-BR", "regionCode": "BR", "pageSize": 20}
    results: list[dict] = []

    for _ in range(max_pages):
        resp = requests.post(SEARCH_URL, json=body, headers=headers, timeout=30)
        if resp.status_code != 200:
            try:
                msg = resp.json().get("error", {}).get("message", resp.text)
            except ValueError:
                msg = resp.text
            dica = ""
            if resp.status_code == 403:
                dica = (" — Verifique se o faturamento está ativo no projeto (no Brasil o teste grátis "
                        "exige um pré-pagamento) e se a chave pode usar a 'Places API (New)'.")
            elif resp.status_code == 400 and "API key" in msg:
                dica = " — A chave parece inválida. Confira se colou ela inteira no .env."
            raise PlacesError(f"Erro {resp.status_code} do Google: {msg}{dica}")
        data = resp.json()
        results.extend(_normalize(p) for p in data.get("places", []))
        token = data.get("nextPageToken")
        if not token:
            break
        body["pageToken"] = token
        time.sleep(1)  # o token demora um instante para ficar válido
    return results


def _normalize(p: dict) -> dict:
    return {
        "place_id": p.get("id"),
        "nome": (p.get("displayName") or {}).get("text", ""),
        "categoria": (p.get("primaryTypeDisplayName") or {}).get("text", ""),
        "endereco": p.get("formattedAddress", ""),
        "nota": p.get("rating"),
        "avaliacoes": p.get("userRatingCount") or 0,
        "site": p.get("websiteUri") or "",
        "telefone": p.get("nationalPhoneNumber") or "",
        "telefone_intl": p.get("internationalPhoneNumber") or "",
        "maps_url": p.get("googleMapsUri") or "",
        "status_google": p.get("businessStatus") or "",
    }
