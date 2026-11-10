// Mensagens de primeira abordagem, já com o link da demonstração.
import type { Lead } from "@/lib";
import type { ExampleData } from "./example";
import { proposta } from "./pricing";

export type Abordagem = "site" | "cardapio" | "portfolio" | "consultoria";

export const ABORDAGENS: { id: Abordagem; nome: string; desc: string }[] = [
  { id: "site", nome: "Site", desc: "Site profissional ou landing page" },
  { id: "cardapio", nome: "Cardápio digital", desc: "Cardápio com pedido pelo WhatsApp" },
  { id: "portfolio", nome: "Portfólio", desc: "Site com os trabalhos realizados" },
  { id: "consultoria", nome: "Consultoria", desc: "Presença digital completa" },
];

const limpar = (n: string) => n.replace(/^\[DEMO\]\s*/, "");
const PARAGRAFO = "\n\n";

export function abordagemPadrao(l: Lead): Abordagem {
  const p = proposta(l).pacote;
  if (p === "Presença Digital") return "cardapio";
  if (p === "Vitrine") return "portfolio";
  if (p === "Divulgação") return "consultoria";
  return "site";
}

export function demoDaAbordagem(a: Abordagem, l: Lead): ExampleData["k"] {
  if (a === "cardapio") return "cardapio";
  if (a === "portfolio") return "portfolio";
  if (a === "site") return "site";
  return abordagemPadrao(l) === "cardapio" ? "cardapio" : abordagemPadrao(l) === "portfolio" ? "portfolio" : "site";
}

/** "Meu nome é Ryan e eu tenho a C-Search…" (usa o nome e a empresa de Configurações). */
function apresentacao(meuNome: string, empresa: string) {
  const n = meuNome.trim();
  const e = empresa.trim();
  if (n && e) return `Meu nome é ${n} e eu tenho a ${e}, uma empresa que cria sites e cardápios digitais para negócios locais.`;
  if (n) return `Meu nome é ${n} e eu crio sites e cardápios digitais para negócios locais.`;
  if (e) return `Aqui é da ${e}, uma empresa que cria sites e cardápios digitais para negócios locais.`;
  return "";
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";
}

/** 1ª mensagem curta só para confirmar que o número é mesmo do lugar. */
export function mensagemConfirmacao(l: Lead, meuNome = "", empresa = "") {
  const n = meuNome.trim();
  const e = empresa.trim();
  const quem = n && e ? ` Meu nome é ${n}, da ${e}.` : n ? ` Meu nome é ${n}.` : e ? ` Aqui é da ${e}.` : "";
  return `Olá, ${saudacao()}!${quem} Esse é o WhatsApp da ${limpar(l.nome)}?`;
}

/** Proposta com a demonstração. continuacao = a pessoa já respondeu a confirmação (você já se apresentou). */
export function mensagemAbordagem(a: Abordagem, l: Lead, link: string, meuNome: string, continuacao = false, empresa = "") {
  const ap = apresentacao(meuNome, empresa);
  const abertura = continuacao
    ? "Que bom, obrigado por responder!" + (ap ? " Como falei, " + ap.charAt(0).toLowerCase() + ap.slice(1) : "")
    : `Olá, ${limpar(l.nome)}! Tudo bem?` + (ap ? PARAGRAFO + ap : "");
  return abertura + PARAGRAFO + corpo(a, link);
}

function corpo(a: Abordagem, link: string) {
  const fecho = PARAGRAFO + "É só abrir no celular. Se gostar, eu ajusto tudo com as fotos, os produtos e as informações reais de vocês. O que acha?";
  switch (a) {
    case "cardapio":
      return "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um cardápio digital de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar, com o pedido indo direto para o WhatsApp:" + PARAGRAFO + link + fecho;
    case "portfolio":
      return "Encontrei vocês pesquisando aqui na região e gostei do trabalho de vocês. Procurei, mas não encontrei um site com o portfólio de vocês, então montei uma demonstração de como ele poderia ficar, mostrando os serviços e os trabalhos realizados:" + PARAGRAFO + link + fecho;
    case "consultoria":
      return "Ajudo negócios da região a aparecer melhor na internet: site, cardápio digital, perfil no Google e vídeos para as redes. Pensando em vocês, montei uma demonstração de como poderia ficar a presença online de vocês:" + PARAGRAFO + link + PARAGRAFO + "Se fizer sentido, posso te mostrar em poucos minutos como isso pode trazer mais clientes, sem compromisso.";
    default:
      return "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um site de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar:" + PARAGRAFO + link + fecho;
  }
}
