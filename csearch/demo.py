"""Dados fictícios para testar o programa sem chave da API do Google."""
from __future__ import annotations

import hashlib
import random


def fake_search(query: str, n: int = 25) -> list[dict]:
    seed = int(hashlib.md5(query.encode()).hexdigest(), 16) % (2**32)
    rnd = random.Random(seed)
    termo = query.split(" em ")[0].strip().title() or "Estabelecimento"
    sufixos = ["do Zé", "Central", "Bom Preço", "da Vila", "Estrela", "Família", "Show",
               "Real", "Primavera", "Nova Era", "do Bairro", "Express", "Top", "São Jorge",
               "Avenida", "Dois Irmãos", "Premium", "Sabor & Cia", "Point", "Mix"]
    out = []
    for i in range(n):
        site_roll = rnd.random()
        if site_roll < 0.45:
            site = ""
        elif site_roll < 0.70:
            site = f"https://instagram.com/{termo.lower().replace(' ', '')}{i}"
        else:
            site = f"https://www.{termo.lower().replace(' ', '')}{i}.com.br"
        reviews = rnd.choice([0, 0, 1, 2, 3, 5, 7, 9, 12, 18, 25, 40, 75, 150, 420])
        phone = rnd.choice([
            f"(11) 9{rnd.randint(1000, 9999)}-{rnd.randint(1000, 9999)}",
            f"(11) {rnd.randint(2000, 5999)}-{rnd.randint(1000, 9999)}",
            "",
        ])
        out.append({
            "place_id": f"demo-{seed}-{i}",
            "nome": f"[DEMO] {termo} {rnd.choice(sufixos)}",
            "categoria": termo,
            "endereco": f"Rua Exemplo, {rnd.randint(10, 999)} - Bairro Fictício",
            "nota": round(rnd.uniform(3.5, 5.0), 1) if reviews else None,
            "avaliacoes": reviews,
            "site": site,
            "telefone": phone,
            "telefone_intl": "",
            "maps_url": "https://maps.google.com",
            "status_google": "OPERATIONAL",
        })
    return out
