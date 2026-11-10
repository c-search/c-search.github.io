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

/** 1ª mensagem curta só para confirmar que o número é mesmo do lugar. */
export function mensagemConfirmacao(l: Lead) {
  const h = new Date().getHours();
  const saudacao = h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";
  return `Olá, ${saudacao}! Esse é o WhatsApp da ${limpar(l.nome)}?`;
}

/** Proposta com a demonstração. continuacao = a pessoa já respondeu a confirmação. */
export function mensagemAbordagem(a: Abordagem, l: Lead, link: string, meuNome: string, continuacao = false) {
  const txt = mensagemBase(a, l, link, meuNome);
  if (!continuacao) return txt;
  const eu = meuNome.trim() ? `Aqui é ${meuNome.trim()}. ` : "";
  // troca o "Olá, X! Tudo bem?" do começo por uma continuação da conversa
  const corte = txt.indexOf("\n\n");
  return `Que bom, obrigado por responder! ${eu}` + (corte >= 0 ? txt.slice(corte) : "\n\n" + txt);
}

function mensagemBase(a: Abordagem, l: Lead, link: string, meuNome: string) {
  const nome = limpar(l.nome);
  const eu = meuNome.trim() ? `Aqui é ${meuNome.trim()}. ` : "";
  const fecho = "\n\nÉ só abrir no celular. Se gostar, eu ajusto tudo com as fotos, os produtos e as informações reais de vocês. O que acha?";
  switch (a) {
    case "cardapio":
      return `Olá, ${nome}! Tudo bem? ${eu}\n\nEncontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um cardápio digital de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar, com o pedido indo direto para o WhatsApp:\n\n${link}${fecho}`;
    case "portfolio":
      return `Olá, ${nome}! Tudo bem? ${eu}\n\nEncontrei vocês pesquisando aqui na região e gostei do trabalho de vocês. Procurei, mas não encontrei um site com o portfólio de vocês, então montei uma demonstração de como ele poderia ficar, mostrando os serviços e os trabalhos realizados:\n\n${link}${fecho}`;
    case "consultoria":
      return `Olá, ${nome}! Tudo bem? ${eu}\n\nTrabalho ajudando negócios da região a aparecer melhor na internet: site, cardápio digital, perfil no Google e vídeos para as redes. Pensando em vocês, montei uma demonstração de como poderia ficar a presença online de vocês:\n\n${link}\n\nSe fizer sentido, posso te mostrar em poucos minutos como isso pode trazer mais clientes, sem compromisso.`;
    default:
      return `Olá, ${nome}! Tudo bem? ${eu}\n\nEncontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um site de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar:\n\n${link}${fecho}`;
  }
}
