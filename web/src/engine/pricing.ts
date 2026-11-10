// Sugestão de proposta: o que oferecer e quanto cobrar, por tipo de cliente.
// Valores de referência para freelancer iniciante no Brasil; ajuste à sua realidade.
import type { Lead } from "@/lib";

export type Item = { nome: string; preco: string; mensal?: boolean };
export type Proposta = {
  pacote: string; // nome curto do combo
  valor: number; // preço sugerido do combo
  itens: Item[]; // o que entra (máx. 3)
  mensal?: Item; // recorrência opcional
  dica: string; // 1 frase de argumento de venda
};

type Tipo = "comida" | "portfolio" | "saude" | "servico";

const RX: [Tipo, RegExp][] = [
  ["comida", /restaurante|lanchonete|hamburg|\bbar\b|boteco|cafe|cafeteria|padaria|doceria|confeitaria|sorveteria|açaí|acai|pizzaria|pastel|adega|bebidas|churrasc|sushi|marmit|food|comida/i],
  ["portfolio", /constru|reforma|marcenaria|móveis|moveis|serralheria|vidraçaria|tatuagem|tattoo|fotograf|eletricista|encanador|arquitet|pintor|gesso|paisagismo|eventos|buffet/i],
  ["saude", /clínica|clinica|consultório|consultorio|dentista|odonto|veterin|estética|estetica|beleza|fisio|psicolog|academia|pet/i],
];

function tipoDe(l: Lead): Tipo {
  const t = `${l.categoria} ${l.nome}`;
  return RX.find(([, rx]) => rx.test(t))?.[0] ?? "servico";
}

const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR");

export function proposta(l: Lead): Proposta {
  const tipo = tipoDe(l);
  const temSite = l.tipo_site === "Site próprio";
  const temRede = l.tipo_site === "Só rede social" || l.verificacao?.status === "social";
  const poucasAval = l.avaliacoes === null || l.avaliacoes < 30;
  const google: Item = { nome: "Perfil no Google", preco: "R$ 150 – 400" };
  const reels: Item = { nome: "4 vídeos curtos (Reels)", preco: "R$ 400 – 900/mês", mensal: true };

  // Já tem site: vender vídeos e Google
  if (temSite) {
    return {
      pacote: "Divulgação",
      valor: 590,
      itens: [{ nome: "4 vídeos curtos (Reels)", preco: "R$ 400 – 900" }, ...(poucasAval ? [google] : [])],
      mensal: reels,
      dica: "Já tem site; o ganho está em aparecer mais nas redes e no Google.",
    };
  }

  const extras = [poucasAval ? google : null, temRede ? { nome: "2 vídeos curtos", preco: "R$ 160 – 400" } : null].filter(Boolean) as Item[];

  if (tipo === "comida") {
    return {
      pacote: "Presença Digital",
      valor: extras.length ? 690 : 450,
      itens: [{ nome: "Cardápio digital + QR code", preco: "R$ 300 – 600" }, ...extras].slice(0, 3),
      mensal: { nome: "Atualizar cardápio", preco: "R$ 40 – 60/mês", mensal: true },
      dica: temRede ? "Já posta no Instagram: o cardápio no link da bio vende sozinho." : "Cliente vê o cardápio pelo celular antes de pedir ou ir até lá.",
    };
  }
  if (tipo === "portfolio") {
    return {
      pacote: "Vitrine",
      valor: extras.length ? 1490 : 1200,
      itens: [{ nome: "Site + portfólio de trabalhos", preco: "R$ 1.000 – 2.500" }, ...extras].slice(0, 3),
      mensal: { nome: "Hospedagem e ajustes", preco: "R$ 80 – 150/mês", mensal: true },
      dica: "Mostrar trabalhos já feitos é o que fecha orçamento nesse ramo.",
    };
  }
  if (tipo === "saude") {
    return {
      pacote: "Consultório Online",
      valor: extras.length ? 1690 : 1400,
      itens: [{ nome: "Site profissional", preco: "R$ 1.200 – 3.000" }, ...extras].slice(0, 3),
      mensal: { nome: "Hospedagem e ajustes", preco: "R$ 80 – 150/mês", mensal: true },
      dica: "Paciente pesquisa antes de marcar; site passa confiança.",
    };
  }
  return {
    pacote: "Vitrine Local",
    valor: extras.length ? 990 : 790,
    itens: [{ nome: "Site de 1 página", preco: "R$ 600 – 1.500" }, ...extras].slice(0, 3),
    mensal: { nome: "Hospedagem e ajustes", preco: "R$ 50 – 100/mês", mensal: true },
    dica: "Quem procura no Google encontra o contato e o endereço na hora.",
  };
}

export { brl };
