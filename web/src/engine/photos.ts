// Busca fotos reais do estabelecimento no Google Imagens (via Serper). Gasta 1 crédito.
// Você escolhe quais usar: nem toda foto que aparece é do lugar, por isso não entram sozinhas.
import type { Lead } from "@/lib";
import { erroSerper, registrarCredito } from "./credits";

export type FotoAchada = { url: string; thumb: string; fonte: string; titulo: string };

const BLOQUEADOS = ["logo", "vector", "icon", "clipart", "shutterstock", "istockphoto", "freepik", "dreamstime", "123rf", "alamy", "depositphotos", "pngtree", "vecteezy"];

export async function buscarFotos(l: Lead, key: string): Promise<FotoAchada[]> {
  const nome = l.nome.replace(/^\[DEMO\]\s*/, "");
  const bairro = (l.endereco.match(/\d+\s*-\s*([^,]+)/) || [])[1]?.trim() || l.endereco.split(",").slice(-2, -1)[0]?.trim() || "";
  const pedir = (body: object) => fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // primeiro com o nome entre aspas; se o Serper recusar o formato, tenta a forma mais simples
  let r = await pedir({ q: `"${nome}" ${bairro}`.trim(), gl: "br", hl: "pt-br" });
  if (r.status === 400) r = await pedir({ q: `${nome} ${bairro}`.trim() });
  if (!r.ok) throw await erroSerper(r, "busca de fotos");
  registrarCredito();
  const j = await r.json();
  type Img = { imageUrl?: string; thumbnailUrl?: string; imageWidth?: number; imageHeight?: number; domain?: string; source?: string; title?: string };
  return ((j.images || []) as Img[])
    .filter((i) => i.imageUrl && i.thumbnailUrl)
    .filter((i) => !BLOQUEADOS.some((b) => `${i.imageUrl} ${i.domain} ${i.title}`.toLowerCase().includes(b)))
    .filter((i) => !i.imageWidth || i.imageWidth >= 400) // foto pequena fica feia na capa
    .slice(0, 12)
    .map((i) => ({ url: i.imageUrl!, thumb: i.thumbnailUrl!, fonte: i.domain || i.source || "", titulo: i.title || "" }));
}
