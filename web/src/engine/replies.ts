// Mensagens prontas: retorno (2ª mensagem) e respostas para as perguntas mais comuns.
import type { Lead } from "@/lib";
import { brl, proposta } from "./pricing";

const limpar = (n: string) => n.replace(/^\[DEMO\]\s*/, "");

function produto(l: Lead) {
  const p = proposta(l);
  if (p.pacote === "Presença Digital") return "cardápio digital";
  if (p.pacote === "Vitrine") return "site com portfólio";
  if (p.pacote === "Divulgação") return "pacote de vídeos";
  return "site";
}

export function mensagemRetorno(l: Lead) {
  return `Oi, ${limpar(l.nome)}, tudo bem? Passando só para saber se você viu minha mensagem. ` +
    `Se quiser, te mando um exemplo de como ficaria o ${produto(l)} de vocês, sem compromisso.`;
}

export function mensagemExemplo(l: Lead, link: string) {
  return `Oi, ${limpar(l.nome)}! Como combinado, fiz um exemplo de como ficaria o ${produto(l)} de vocês:\n\n${link}\n\n` +
    `É só abrir no celular. O que achou?`;
}

export type Resposta = { pergunta: string; texto: string };

export function respostasProntas(l: Lead): Resposta[] {
  const p = proposta(l);
  const principal = p.itens[0];
  const minimo = principal.preco.split("–")[0].trim();
  const itens = p.itens.map((i) => i.nome.toLowerCase()).join(", ");
  return [
    {
      pergunta: "Quanto custa?",
      texto: `O pacote completo sai por ${brl(p.valor)}, com ${itens}. ` +
        (p.mensal ? `Depois, se quiser que eu cuide das atualizações, fica ${p.mensal.preco}. ` : "") +
        `Posso te mostrar o exemplo antes, sem compromisso.`,
    },
    {
      pergunta: "Já tenho Instagram",
      texto: `Que bom, o Instagram é ótimo para mostrar o dia a dia! O ${produto(l)} complementa: ` +
        `o cliente encontra tudo organizado num link só (dá até para colocar na bio) e vocês aparecem melhor quando alguém procura no Google.`,
    },
    {
      pergunta: "Tá caro",
      texto: `Entendo! Dá para começar só com ${principal.nome.toLowerCase()} a partir de ${minimo} e ir adicionando o resto depois, no seu tempo. O que acha?`,
    },
    {
      pergunta: "Vou pensar",
      texto: `Claro, sem pressa! Vou deixar o exemplo aqui com você para olhar com calma. Qualquer dúvida é só me chamar.`,
    },
    {
      pergunta: "Como funciona?",
      texto: `É simples: eu monto tudo com as informações e fotos de vocês, te mostro antes para aprovar e, depois de pronto, ` +
        `vocês recebem o link para divulgar. Metade no início e metade na entrega.`,
    },
  ];
}
