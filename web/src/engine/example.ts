// Monta e lê o link do "exemplo pronto" (todos os dados vão no próprio link).
import type { Lead } from "@/lib";
import { proposta } from "./pricing";

export type ExampleData = {
  n: string; // nome
  k: "cardapio" | "site" | "portfolio";
  c: string; // categoria
  t?: string; // telefone
  e?: string; // endereço
  w?: string; // whatsapp do estabelecimento
  by?: string; // seu nome
  bw?: string; // seu whatsapp
};

function b64urlEncode(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function exampleKind(l: Lead): ExampleData["k"] {
  const p = proposta(l).pacote;
  if (p === "Presença Digital") return "cardapio";
  if (p === "Vitrine") return "portfolio";
  return "site";
}

export function exampleLink(l: Lead, meuNome: string, meuWhats: string) {
  const d: ExampleData = {
    n: l.nome.replace(/^\[DEMO\]\s*/, ""),
    k: exampleKind(l),
    c: l.categoria.split(" /")[0],
    t: l.telefone || undefined,
    e: l.endereco || undefined,
    w: l.whatsapp || undefined,
    by: meuNome.trim() || undefined,
    bw: meuWhats.replace(/\D/g, "") ? (meuWhats.replace(/\D/g, "").startsWith("55") ? "" : "55") + meuWhats.replace(/\D/g, "") : undefined,
  };
  const base = location.origin + location.pathname;
  return `${base}#/exemplo?d=${b64urlEncode(JSON.stringify(d))}`;
}

export function decodeExample(hash: string): ExampleData | null {
  const m = hash.match(/[?&]d=([^&]+)/);
  if (!m) return null;
  try {
    const d = JSON.parse(b64urlDecode(m[1]));
    return d?.n ? d : null;
  } catch {
    return null;
  }
}
