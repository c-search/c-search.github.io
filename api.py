"""Servidor do C-Search: API em /api e a interface (web/dist) na raiz."""
from __future__ import annotations

import io
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from csearch import demo, osm, places, scoring, storage

load_dotenv()
ROOT = Path(__file__).resolve().parent
DIST = ROOT / "web" / "dist"

app = FastAPI(title="C-Search")


def _google_key() -> str:
    load_dotenv(override=True)  # pega a chave nova sem reiniciar
    return (os.getenv("GOOGLE_PLACES_API_KEY") or "").strip()


@app.get("/api/config")
def config():
    return {"has_google_key": bool(_google_key()), "status": storage.STATUS}


class OsmSearch(BaseModel):
    lugar: str


@app.post("/api/search/osm")
def search_osm(body: OsmSearch):
    try:
        geo = osm.geocode(body.lugar.strip())
        achados = osm.fetch_places(geo)
    except osm.OSMError as e:
        raise HTTPException(502, str(e))
    leads = [scoring.score_lead(p) for p in achados]
    return {"area": geo["nome"], "leads": leads, "ranking": scoring.rank_categories(leads)}


class TermSearch(BaseModel):
    termo: str
    cidade: str
    bairros: list[str] = []
    paginas: int = 3
    fonte: str = "google"  # google | demo


@app.post("/api/search/term")
def search_term(body: TermSearch):
    consultas = [f"{body.termo} em {b}, {body.cidade}" for b in body.bairros if b.strip()] or [
        f"{body.termo} em {body.cidade}"
    ]
    brutos: dict[str, dict] = {}
    key = _google_key()
    if body.fonte == "google" and not key:
        raise HTTPException(400, "Sem chave do Google no arquivo .env.")
    try:
        for q in consultas:
            achados = demo.fake_search(q) if body.fonte == "demo" else places.search_text(q, key, body.paginas)
            for p in achados:
                brutos[p["place_id"]] = p
    except places.PlacesError as e:
        raise HTTPException(502, str(e))
    leads = [scoring.score_lead(p, body.termo) for p in brutos.values()
             if p.get("status_google") in ("", "OPERATIONAL")]
    return {"area": body.cidade, "leads": leads, "ranking": scoring.rank_categories(leads)}


class SaveLeads(BaseModel):
    busca: str
    leads: list[dict]


@app.get("/api/leads")
def list_leads():
    df = storage.load_leads()
    df = df.astype(object).where(df.notna(), None)
    return df.to_dict("records")


@app.get("/api/leads/ids")
def lead_ids():
    return sorted(storage.known_ids())


@app.post("/api/leads")
def save_leads(body: SaveLeads):
    novos = storage.save_leads(body.leads, body.busca)
    return {"novos": novos, "existentes": len(body.leads) - novos}


class UpdateLead(BaseModel):
    status: str
    anotacoes: str = ""


@app.patch("/api/leads/{place_id}")
def update_lead(place_id: str, body: UpdateLead):
    if body.status not in storage.STATUS:
        raise HTTPException(400, "Status inválido")
    storage.update_lead(place_id, body.status, body.anotacoes)
    return {"ok": True}


@app.delete("/api/leads")
def delete_leads():
    storage.delete_all()
    return {"ok": True}


@app.get("/api/leads/export.xlsx")
def export_leads():
    buf = io.BytesIO()
    storage.load_leads().to_excel(buf, index=False, sheet_name="Leads")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="csearch_meus_leads.xlsx"'},
    )


# ---- interface ----
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        f = DIST / path
        if path and f.is_file():
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
