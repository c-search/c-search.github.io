"""Guarda os leads num banco SQLite local para acompanhar quem já foi contatado."""
from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

import pandas as pd

DB_PATH = Path(__file__).resolve().parent.parent / "dados" / "leads.db"

STATUS = ["Novo", "Contatado", "Respondeu", "Negociando", "Fechado", "Descartado"]

COLUMNS = [
    "place_id", "nome", "categoria", "endereco", "nota", "avaliacoes", "site", "tipo_site",
    "telefone", "whatsapp", "maps_url", "score", "nivel", "motivos", "oferta",
    "busca", "status", "anotacoes", "encontrado_em", "atualizado_em",
]


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute(
        f"CREATE TABLE IF NOT EXISTS leads ({', '.join(c + (' TEXT PRIMARY KEY' if c == 'place_id' else '') for c in COLUMNS)})"
    )
    return con


def known_ids() -> set[str]:
    with _conn() as con:
        return {r[0] for r in con.execute("SELECT place_id FROM leads")}


def save_leads(leads: list[dict], busca: str) -> int:
    """Salva leads novos (não sobrescreve status/anotações dos já existentes). Retorna quantos eram novos."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    novos = 0
    with _conn() as con:
        for lead in leads:
            exists = con.execute("SELECT 1 FROM leads WHERE place_id=?", (lead["place_id"],)).fetchone()
            if exists:
                con.execute(
                    "UPDATE leads SET avaliacoes=?, nota=?, site=?, tipo_site=?, score=?, nivel=?, motivos=?, atualizado_em=? WHERE place_id=?",
                    (lead["avaliacoes"], lead["nota"], lead["site"], lead["tipo_site"], lead["score"],
                     lead["nivel"], lead["motivos"], now, lead["place_id"]),
                )
            else:
                row = {c: lead.get(c, "") for c in COLUMNS}
                row.update(busca=busca, status="Novo", anotacoes="", encontrado_em=now, atualizado_em=now)
                con.execute(
                    f"INSERT INTO leads ({', '.join(COLUMNS)}) VALUES ({', '.join('?' * len(COLUMNS))})",
                    [row[c] for c in COLUMNS],
                )
                novos += 1
    return novos


def load_leads() -> pd.DataFrame:
    with _conn() as con:
        df = pd.read_sql_query("SELECT * FROM leads ORDER BY score DESC, avaliacoes ASC", con)
    df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0).astype(int)
    df["avaliacoes"] = pd.to_numeric(df["avaliacoes"], errors="coerce").astype("Int64")  # vazio = fonte sem avaliações
    df["nota"] = pd.to_numeric(df["nota"], errors="coerce")
    return df


def update_lead(place_id: str, status: str, anotacoes: str) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    with _conn() as con:
        con.execute(
            "UPDATE leads SET status=?, anotacoes=?, atualizado_em=? WHERE place_id=?",
            (status, anotacoes, now, place_id),
        )


def delete_all() -> None:
    with _conn() as con:
        con.execute("DELETE FROM leads")
