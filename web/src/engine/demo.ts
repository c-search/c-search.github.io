// Dados fictícios para testar sem internet nem chave.
import type { RawPlace } from "./scoring";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function fakeSearch(query: string, n = 25): RawPlace[] {
  let h = 0;
  for (const c of query) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(h);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const termoRaw = query.split(" em ")[0].trim() || "Estabelecimento";
  const termo = termoRaw.charAt(0).toUpperCase() + termoRaw.slice(1);
  const slug = termoRaw.toLowerCase().replace(/\s+/g, "");
  const sufixos = ["do Zé", "Central", "Bom Preço", "da Vila", "Estrela", "Família", "Show", "Real", "Primavera",
    "Nova Era", "do Bairro", "Express", "Top", "São Jorge", "Avenida", "Dois Irmãos", "Premium", "Point", "Mix"];
  const num = (a: number, b: number) => a + Math.floor(r() * (b - a));
  return Array.from({ length: n }, (_, i) => {
    const s = r();
    const site = s < 0.45 ? "" : s < 0.7 ? `https://instagram.com/${slug}${i}` : `https://www.${slug}${i}.com.br`;
    const avaliacoes = pick([0, 0, 1, 2, 3, 5, 7, 9, 12, 18, 25, 40, 75, 150, 420]);
    const telefone = pick([`(11) 9${num(1000, 9999)}-${num(1000, 9999)}`, `(11) ${num(2000, 5999)}-${num(1000, 9999)}`, ""]);
    return {
      place_id: `demo-${h}-${i}`,
      nome: `[DEMO] ${termo} ${pick(sufixos)}`,
      categoria: termo,
      endereco: `Rua Exemplo, ${num(10, 999)} - Bairro Fictício`,
      nota: avaliacoes ? Math.round((3.5 + r() * 1.5) * 10) / 10 : null,
      avaliacoes,
      site,
      telefone,
      maps_url: "https://maps.google.com",
    };
  });
}
