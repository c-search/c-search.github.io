import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route } from "lucide-react";
import { waLink, type Lead } from "@/lib";
import { brl, proposta } from "@/engine/pricing";
import { Button } from "./ui";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function cor(l: Lead) {
  if (l.verificacao?.status === "site") return "#f87171"; // já tem site
  if (l.score >= 70) return "#ffffff";
  if (l.score >= 45) return "#a3a3a3";
  return "#525252";
}

/** Ordena as paradas pelo vizinho mais próximo, começando pelo melhor lead. */
function rota(leads: Lead[], max = 10) {
  const pts = leads.filter((l) => l.lat && l.lon && l.verificacao?.status !== "site").slice(0, 40);
  if (!pts.length) return [];
  const out = [pts.shift()!];
  while (pts.length && out.length < max) {
    const u = out[out.length - 1];
    let best = 0;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const d = (p.lat! - u.lat!) ** 2 + (p.lon! - u.lon!) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    out.push(pts.splice(best, 1)[0]);
  }
  return out;
}

export function LeadsMap({ leads, template, cidade }: { leads: Lead[]; template: string; cidade: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const comCoord = leads.filter((l) => l.lat && l.lon);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([-23.55, -46.63], 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    comCoord.forEach((l) => {
      const p = proposta(l);
      const wa = waLink(l, template, cidade);
      const html = `
        <div style="min-width:190px;font-family:Inter,sans-serif">
          <div style="font-weight:600;font-size:14px">${esc(l.nome)}</div>
          <div style="color:#888;font-size:12px">${esc(l.categoria)}${l.verificacao ? " · " + esc(l.verificacao.resumo) : ""}</div>
          <div style="margin:6px 0;font-size:12px">${esc(p.pacote)} · <b>${brl(p.valor)}</b></div>
          <div style="display:flex;gap:8px;font-size:12px">
            ${wa ? `<a href="${wa}" target="_blank" rel="noreferrer">WhatsApp</a>` : ""}
            <a href="${l.maps_url}" target="_blank" rel="noreferrer">Google Maps</a>
          </div>
        </div>`;
      L.circleMarker([l.lat!, l.lon!], { radius: 7, color: "#000", weight: 1.5, fillColor: cor(l), fillOpacity: 0.95 })
        .bindPopup(html)
        .addTo(layer.current!);
      bounds.push([l.lat!, l.lon!]);
    });
    if (bounds.length) map.current.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 16 });
  }, [comCoord.map((l) => l.place_id + l.score + (l.verificacao?.status || "")).join(), template, cidade]);

  const paradas = rota(leads);
  const rotaUrl = paradas.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${paradas[0].lat},${paradas[0].lon}` +
      `&destination=${paradas[paradas.length - 1].lat},${paradas[paradas.length - 1].lon}` +
      (paradas.length > 2 ? `&waypoints=${paradas.slice(1, -1).map((p) => `${p.lat},${p.lon}`).join("|")}` : "")
    : "";

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{comCoord.length} no mapa</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-white" /> Quente</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-neutral-400" /> Morno</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-neutral-600" /> Frio</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-400" /> Já tem site</span>
        </div>
        {rotaUrl && (
          <a href={rotaUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline"><Route className="h-4 w-4" /> Rota com os {paradas.length} melhores</Button>
          </a>
        )}
      </div>
      <div ref={el} className="h-[520px] w-full bg-neutral-900" />
      {!comCoord.length && <div className="bg-card p-4 text-center text-sm text-muted-foreground">Esses lugares não têm localização para mostrar no mapa.</div>}
    </div>
  );
}
