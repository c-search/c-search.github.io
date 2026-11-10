// Link curto: a demonstração fica guardada num arquivo no seu GitHub (branch "demos" do
// repositório do C-Search) e o link vira só  c-search.github.io/#/p/nome-do-lugar-x7k2
import type { ExampleData } from "./example";
import { SITE_PUBLICO } from "./example";

export const REPO = "c-search/c-search.github.io";
const BRANCH = "demos";

function slugify(n: string) {
  return n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 4).join("-").slice(0, 32) || "demo";
}

function b64(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function linkCurto(slug: string) {
  return `${SITE_PUBLICO}#/p/${slug}`;
}

/** Salva a demonstração no GitHub e devolve o link curto. */
export async function criarLinkCurto(d: ExampleData, token: string): Promise<string> {
  const slug = `${slugify(d.n)}-${Math.random().toString(36).slice(2, 6)}`;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${slug}.json`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({ message: `demo: ${d.n}`, content: b64(JSON.stringify(d)), branch: BRANCH }),
  });
  if (r.status === 401) throw new Error("Token do GitHub inválido ou vencido. Confira em Configurações.");
  if (r.status === 403 || r.status === 404) throw new Error("O token do GitHub não tem permissão de escrita no repositório csearch.");
  if (!r.ok) throw new Error(`Erro ${r.status} ao salvar a demonstração no GitHub.`);
  return linkCurto(slug);
}

/** Lê a demonstração salva (o cliente não precisa de token: o arquivo é público). */
export async function carregarDemo(slug: string): Promise<ExampleData | null> {
  if (!/^[a-z0-9-]{3,48}$/.test(slug)) return null;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${slug}.json`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        return d?.n ? d : null;
      }
    } catch {
      /* tenta de novo */
    }
    await new Promise((res) => setTimeout(res, 1500)); // arquivo recém-criado pode demorar uns segundos
  }
  return null;
}
