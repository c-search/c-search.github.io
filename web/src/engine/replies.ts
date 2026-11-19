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

/** Qual mensagem ficou sem resposta: a pergunta do número, a do robô (pedi o responsável) ou a proposta. */
export type CasoRetorno = "numero" | "robo" | "proposta";
export const CASOS_RETORNO: { id: CasoRetorno; nome: string }[] = [
  { id: "numero", nome: "Pergunta do número" },
  { id: "robo", nome: "Mensagem do robô" },
  { id: "proposta", nome: "Proposta enviada" },
];
export const casoPadrao = (status?: string): CasoRetorno => (status === "Contatado" ? "proposta" : "numero");

/** 2ª tentativa quando não responderam: curta, leve, sem cobrar resposta. */
export function mensagemRetorno(l: Lead & { status?: string }, caso: CasoRetorno = casoPadrao(l.status)) {
  const h = new Date().getHours();
  const saudacao = h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";
  if (caso === "numero")
    return `Oi, ${saudacao}! Não sei se minha mensagem chegou, então passando só para confirmar: esse número é da ${limpar(l.nome)}? 🙂`;
  if (caso === "robo")
    return `Oi, ${saudacao}! Passando só para retomar minha última mensagem: preparei um projeto especialmente para a ${limpar(l.nome)} ` +
      `e gostaria de mostrar ao responsável. Posso enviar por aqui? Sem pressa 🙂`;
  return `Oi, ${saudacao}! Passando só para saber se vocês conseguiram ver o projeto que preparei para a ${limpar(l.nome)}. ` +
    `Sem pressa nenhuma, fico à disposição se quiserem conversar. 🙂`;
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
