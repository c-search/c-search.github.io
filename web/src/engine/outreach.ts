// Mensagens de primeira abordagem, já com o link da demonstração.
import type { Lead } from "@/lib";
import type { ExampleData } from "./example";
import { proposta } from "./pricing";

export type Abordagem = "site" | "cardapio" | "portfolio" | "renovar" | "consultoria";

export const ABORDAGENS: { id: Abordagem; nome: string; desc: string }[] = [
  { id: "site", nome: "Site", desc: "Site profissional ou landing page" },
  { id: "cardapio", nome: "Cardápio digital", desc: "Cardápio com pedido pelo WhatsApp" },
  { id: "portfolio", nome: "Portfólio", desc: "Site com os trabalhos realizados" },
  { id: "renovar", nome: "Renovar site", desc: "Já tem site ou página de links simples" },
  { id: "consultoria", nome: "Consultoria", desc: "Presença digital completa" },
];

const limpar = (n: string) => n.replace(/^\[DEMO\]\s*/, "");
const PARAGRAFO = "\n\n";

export function abordagemPadrao(l: Lead): Abordagem {
  // já tem site (ou o mapa diz que tem): oferecer uma versão melhor, não um site "do zero"
  if (l.verificacao?.status === "site" || l.tipo_site === "Site próprio") return "renovar";
  const p = proposta(l).pacote;
  if (p === "Presença Digital") return "cardapio";
  if (p === "Vitrine") return "portfolio";
  if (p === "Divulgação") return "consultoria";
  return "site";
}

/** Tipo de demo pelo ramo do negócio, como se ele não tivesse site. */
function demoDoRamo(l: Lead): ExampleData["k"] {
  const p = proposta({ ...l, tipo_site: "Nenhum", verificacao: undefined }).pacote;
  return p === "Presença Digital" ? "cardapio" : p === "Vitrine" ? "portfolio" : "site";
}

export function demoDaAbordagem(a: Abordagem, l: Lead): ExampleData["k"] {
  if (a === "cardapio") return "cardapio";
  if (a === "portfolio") return "portfolio";
  if (a === "site") return "site";
  return demoDoRamo(l);
}

/** "Meu nome é Ryan e eu tenho a C-Search…" (usa o nome e a empresa de Configurações). */
/** A empresa e todos os serviços (vai na proposta, não na confirmação). */
function apresentacao(empresa: string) {
  const e = empresa.trim();
  const quem = e ? `Eu tenho uma empresa chamada ${e}, que` : "Eu";
  return `${quem} ajuda estabelecimentos que ainda não têm cardápio digital, site ou uma presença forte na internet. Trabalho com sites, cardápios digitais, portfólios e também com vídeos para divulgação nas redes sociais.`
    .replace("Eu ajuda", "Eu ajudo");
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";
}

/** 1ª mensagem curta só para confirmar que o número é mesmo do lugar. */
// _empresa: a empresa só aparece na proposta, depois que confirmarem o número
export function mensagemConfirmacao(l: Lead, meuNome = "", _empresa = "") {
  const quem = meuNome.trim() ? ` Meu nome é ${meuNome.trim()}.` : "";
  return `Olá, ${saudacao()}!${quem} Esse número é da ${limpar(l.nome)}?`;
}

/** Quando quem responde é um robô/atendimento automático: curta, pede para falar com o responsável. */
export function mensagemRobo(l: Lead, meuNome = "", empresa = "") {
  const saude = /dent|odonto|clín|clin|médic|medic|fisio|psic|estét|estet|saúde|saude|consult/i.test(`${l.categoria} ${l.nome}`);
  const quem = [meuNome.trim() && `meu nome é ${meuNome.trim()}`, empresa.trim() && `sou da empresa ${empresa.trim()}`].filter(Boolean).join(" e ");
  return `Olá! Na verdade não sou ${saude ? "paciente" : "cliente"} 🙂${quem ? " " + quem.charAt(0).toUpperCase() + quem.slice(1) + "." : ""} ` +
    `Preparei um projeto pensado especialmente para a ${limpar(l.nome)} e gostaria de apresentar ao responsável. Posso enviar por aqui?`;
}

/** Proposta com a demonstração. continuacao = já confirmaram o número (você já disse seu nome). */
export function mensagemAbordagem(a: Abordagem, l: Lead, link: string, meuNome: string, continuacao = false, empresa = "") {
  const n = meuNome.trim();
  const abertura = continuacao
    ? "Que bom, obrigado por responder!"
    : `Olá, ${limpar(l.nome)}! Tudo bem?${n ? ` Meu nome é ${n}.` : ""}`;
  return abertura + PARAGRAFO + apresentacao(empresa) + PARAGRAFO + corpo(a, link);
}

function corpo(a: Abordagem, link: string) {
  const fecho = PARAGRAFO + "É só abrir no celular. Tudo é ajustável ao gosto de vocês: cores, fotos, textos e produtos." + PARAGRAFO +
    "Vocês teriam interesse? Se quiserem, podemos conversar melhor sobre esse projeto ou sobre os outros trabalhos que eu posso oferecer, como os vídeos para divulgação.";
  switch (a) {
    case "cardapio":
      return "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um cardápio digital de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar, com o pedido indo direto para o WhatsApp:" + PARAGRAFO + link + fecho;
    case "portfolio":
      return "Encontrei vocês pesquisando aqui na região e gostei do trabalho de vocês. Procurei, mas não encontrei um site com o portfólio de vocês, então montei uma demonstração de como ele poderia ficar, mostrando os serviços e os trabalhos realizados:" + PARAGRAFO + link + fecho;
    case "renovar":
      return "Encontrei vocês pesquisando negócios aqui da região e gostei muito do que vi: dá para ver o cuidado que vocês têm com o trabalho. Vi que vocês já têm uma página na internet, o que é ótimo. Pensando em somar ao que vocês já construíram, montei uma demonstração de uma versão mais completa, com fotos em destaque, tudo organizado e botão direto para o WhatsApp, para transformar ainda mais visitas em clientes. A ideia é complementar o que vocês já têm, não começar do zero:" + PARAGRAFO + link + fecho;
    case "consultoria":
      return "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Pensando em vocês, montei uma demonstração de como poderia ficar a presença online de vocês:" + PARAGRAFO + link + fecho;
    default:
      return "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Procurei, mas não encontrei um site de vocês, então tomei a liberdade de montar uma demonstração de como ele poderia ficar:" + PARAGRAFO + link + fecho;
  }
}
