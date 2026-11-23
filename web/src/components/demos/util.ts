// Ajudantes usados pelas páginas de demonstração (cardápio e site).
import { foto } from "@/engine/niches";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const iniciais = (n: string) => n.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || n[0];
// bairro: no endereço do Google vem depois do número ("Rua X, 713 - Mooca, São Paulo - SP" → "Mooca")
export const bairroDe = (e?: string) => {
  if (!e) return "";
  const g = e.match(/\d+[A-Za-z]?\s*-\s*([^,]+)/);
  if (g && !/\bSP\b|^\d/.test(g[1])) return g[1].trim();
  const partes = e.split(",").map((s) => s.trim()).filter((x) => x && !/^\d|\s-\s[A-Z]{2}$/.test(x));
  return partes.length > 2 ? partes[partes.length - 2] : "";
};
export const wa = (num: string | undefined, txt: string) => (num ? `https://wa.me/${num}?text=${encodeURIComponent(txt)}` : undefined);

/** Foto real que não carregou (site do dono bloqueou, por exemplo): troca por uma do banco. */
export const semFoto = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.trocada) return;
  img.dataset.trocada = "1";
  img.src = foto("1517248135467-4c7edcad34c4", 1200);
};

/** Carrega uma fonte do Google Fonts uma vez só. */
export function usarFonte(familia: string) {
  const id = "gf-" + familia.replace(/\W/g, "");
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${familia}&display=swap`;
  document.head.appendChild(l);
}

/** Texto preto ou branco, o que tiver mais contraste com a cor. */
export function textoSobre(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#141010" : "#ffffff";
}
