// Biblioteca dos exemplos prontos: fotos (Unsplash, licença livre), cores e textos por tipo de negócio.
// Todas as fotos foram conferidas uma a uma (sem marcas/logos aparecendo).

export const foto = (id: string, w = 1200, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ""}&q=75&auto=format&fit=crop`;

/** Foto do banco (id do Unsplash) ou foto real do lugar (URL completa). */
export const src = (x: string, w = 1200, h?: number) => (x.startsWith("http") ? x : foto(x, w, h));

export type MenuItem = { nome: string; desc: string; preco: number; foto?: string; destaque?: boolean };
export type Cardapio = {
  id: string;
  cor: string;
  hero: string;
  ambiente: string;
  frase: string;
  secoes: { nome: string; itens: MenuItem[] }[];
};

export type Servico = { nome: string; desc: string; icone: string };
export type SiteNicho = {
  id: string;
  tema: "escuro" | "claro";
  cor: string;
  hero: string;
  galeria: string[];
  titulo: [string, string]; // [parte normal, palavra em itálico]
  sub: string;
  cta: string;
  servicos: Servico[];
  porque: [string, string][];
  faq: [string, string][];
  depoimentos: [string, string][];
};

// ---------------- CARDÁPIOS ----------------

const CARDAPIOS: Cardapio[] = [
  {
    id: "pizza", cor: "#E4572E", hero: "1574071318508-1cdbab80d002", ambiente: "1517248135467-4c7edcad34c4",
    frase: "Massa de fermentação lenta, forno quente e ingredientes de verdade.",
    secoes: [
      { nome: "Pizzas tradicionais", itens: [
        { nome: "Margherita", desc: "Molho de tomate italiano, muçarela, tomate fresco e manjericão", preco: 54.9, foto: "1574071318508-1cdbab80d002", destaque: true },
        { nome: "Calabresa", desc: "Calabresa artesanal, cebola roxa e azeitonas pretas", preco: 52.9, foto: "1513104890138-7c749659a591", destaque: true },
        { nome: "Frango com catupiry", desc: "Frango desfiado temperado e catupiry original", preco: 58.9, foto: "1565299624946-b28f40a0ae38" },
        { nome: "Portuguesa", desc: "Presunto, ovos, cebola, ervilha, azeitona e muçarela", preco: 59.9 },
      ] },
      { nome: "Pizzas especiais", itens: [
        { nome: "Burrata e rúcula", desc: "Burrata cremosa, rúcula fresca e redução de balsâmico", preco: 72.9, foto: "1593560708920-61dd98c46a4e", destaque: true },
        { nome: "Pepperoni", desc: "Pepperoni fatiado fino, muçarela e orégano", preco: 64.9, foto: "1604382354936-07c5d9983bd3" },
      ] },
      { nome: "Doces", itens: [
        { nome: "Chocolate com morango", desc: "Chocolate ao leite derretido e morangos frescos", preco: 56.9 },
        { nome: "Romeu e Julieta", desc: "Muçarela e goiabada cascão", preco: 49.9 },
      ] },
      { nome: "Bebidas", itens: [
        { nome: "Refrigerante 2 L", desc: "Cola, guaraná ou laranja", preco: 14 },
        { nome: "Suco natural 500 ml", desc: "Laranja, limão ou maracujá", preco: 10 },
      ] },
    ],
  },
  {
    id: "burger", cor: "#F4A23B", hero: "1553979459-d2229ba7433b", ambiente: "1555396273-367ea4eb4db5",
    frase: "Blend da casa, pão brioche e aquele molho que vicia.",
    secoes: [
      { nome: "Burgers", itens: [
        { nome: "Classic", desc: "Blend 160 g, cheddar, alface, tomate e maionese da casa", preco: 32.9, foto: "1568901346375-23c9450c58cd", destaque: true },
        { nome: "Bacon Lover", desc: "Dois blends, cheddar duplo e bacon crocante", preco: 42.9, foto: "1553979459-d2229ba7433b", destaque: true },
        { nome: "Salad", desc: "Blend 160 g, queijo prato, alface, tomate e cebola roxa", preco: 34.9, foto: "1571091718767-18b5b1457add" },
        { nome: "Smash duplo", desc: "Dois smash de 90 g, queijo e cebola caramelizada", preco: 36.9, foto: "1586190848861-99aa4a171e90", destaque: true },
      ] },
      { nome: "Porções", itens: [
        { nome: "Fritas da casa", desc: "Batata rústica com parmesão e ervas", preco: 22.9, foto: "1573080496219-bb080dd4f877" },
        { nome: "Onion rings", desc: "Anéis de cebola empanados e crocantes", preco: 21.9 },
      ] },
      { nome: "Bebidas", itens: [
        { nome: "Milk-shake 400 ml", desc: "Chocolate, morango ou doce de leite", preco: 19.9 },
        { nome: "Refrigerante lata", desc: "350 ml", preco: 6.5 },
      ] },
    ],
  },
  {
    id: "padaria", cor: "#C98B4E", hero: "1517433670267-08bbd4be890f", ambiente: "1568254183919-78a4f43a2877",
    frase: "Pão saindo do forno o dia inteiro, do jeito que o bairro gosta.",
    secoes: [
      { nome: "Pães", itens: [
        { nome: "Pão francês (kg)", desc: "Casquinha crocante, saindo toda hora", preco: 18.9, foto: "1608198093002-ad4e005484ec", destaque: true },
        { nome: "Pão de fermentação natural", desc: "Levain, casca grossa e miolo aerado", preco: 24.9, foto: "1509440159596-0249088772ff", destaque: true },
        { nome: "Croissant", desc: "Folhado na manteiga", preco: 9.9, foto: "1555507036-ab1f4038808a", destaque: true },
      ] },
      { nome: "Salgados", itens: [
        { nome: "Coxinha de frango", desc: "Massa leve e recheio cremoso", preco: 7.5 },
        { nome: "Pão de queijo (6 un.)", desc: "Queijo canastra", preco: 9 },
        { nome: "Misto quente", desc: "Pão de forma, presunto e queijo na chapa", preco: 12.9 },
      ] },
      { nome: "Doces", itens: [
        { nome: "Cupcake do dia", desc: "Pergunte o sabor", preco: 9.9, foto: "1486427944299-d1955d23e34d" },
        { nome: "Sonho de creme", desc: "Creme de baunilha", preco: 6.9 },
      ] },
      { nome: "Café", itens: [
        { nome: "Café coado", desc: "Copo 200 ml", preco: 4.5 },
        { nome: "Pingado + pão na chapa", desc: "O clássico da manhã", preco: 11.9 },
      ] },
    ],
  },
  {
    id: "cafe", cor: "#B7835A", hero: "1554118811-1e0d58224f24", ambiente: "1501339847302-ac426a4a7cbb",
    frase: "Grãos especiais, preparo com calma e um lugar para ficar.",
    secoes: [
      { nome: "Cafés", itens: [
        { nome: "Cappuccino", desc: "Espresso, leite vaporizado e cacau", preco: 13.9, foto: "1509042239860-f550ce710b93", destaque: true },
        { nome: "Latte gelado", desc: "Espresso duplo, leite e gelo", preco: 15.9, foto: "1461023058943-07fcbe16d735", destaque: true },
        { nome: "Coado na hora", desc: "Método V60 com grãos da semana", preco: 12.9, foto: "1442512595331-e89e73853f31", destaque: true },
        { nome: "Espresso", desc: "Curto e encorpado", preco: 7 },
      ] },
      { nome: "Comidinhas", itens: [
        { nome: "Croissant de presunto e queijo", desc: "Folhado na manteiga", preco: 16.9, foto: "1555507036-ab1f4038808a" },
        { nome: "Bolo do dia", desc: "Pergunte o sabor", preco: 10.9 },
        { nome: "Pão de queijo", desc: "Porção com 4", preco: 9.9 },
      ] },
    ],
  },
  {
    id: "bar", cor: "#E9B949", hero: "1572116469696-31de0f17cc34", ambiente: "1543007630-9710e4a00a20",
    frase: "Cerveja gelada, petisco caprichado e a melhor mesa do bairro.",
    secoes: [
      { nome: "Drinks", itens: [
        { nome: "Caipirinha", desc: "Limão, morango ou maracujá", preco: 22, foto: "1514362545857-3bc16c4c7d1b", destaque: true },
        { nome: "Negroni", desc: "Gin, vermute rosso e bitter", preco: 32, foto: "1470337458703-46ad1756a187", destaque: true },
      ] },
      { nome: "Cervejas", itens: [
        { nome: "Chope 300 ml", desc: "Pilsen da casa, bem tirado", preco: 12.9, foto: "1608270586620-248524c67de9", destaque: true },
        { nome: "Long neck", desc: "Consulte as marcas do dia", preco: 13 },
        { nome: "Cerveja 600 ml", desc: "Trincando de gelada", preco: 16 },
      ] },
      { nome: "Petiscos", itens: [
        { nome: "Calabresa acebolada", desc: "Acompanha pão francês", preco: 39.9 },
        { nome: "Bolinho de bacalhau (10 un.)", desc: "Crocante por fora, cremoso por dentro", preco: 44.9 },
        { nome: "Torresmo de rolo", desc: "Com limão e pimenta", preco: 34.9 },
      ] },
    ],
  },
  {
    id: "doces", cor: "#EF6F8E", hero: "1578985545062-69928b1d9587", ambiente: "1488477181946-6428a0291777",
    frase: "Doce feito todo dia, para adoçar qualquer momento.",
    secoes: [
      { nome: "Bolos e tortas", itens: [
        { nome: "Bolo de chocolate", desc: "Massa úmida e cobertura de brigadeiro", preco: 14.9, foto: "1578985545062-69928b1d9587", destaque: true },
        { nome: "Panna cotta de morango", desc: "Potinho 200 ml", preco: 15.9, foto: "1488477181946-6428a0291777", destaque: true },
      ] },
      { nome: "Gelados", itens: [
        { nome: "Taça com calda", desc: "Sorvete, calda quente e biscoito", preco: 21.9, foto: "1563805042-7684c019e1cb", destaque: true },
        { nome: "Casquinha", desc: "2 bolas, sabores do dia", preco: 12.9, foto: "1497034825429-c343d7c6a68f" },
      ] },
      { nome: "Docinhos", itens: [
        { nome: "Donuts (2 un.)", desc: "Recheados e confeitados", preco: 16.9, foto: "1551024601-bec78aea704b" },
        { nome: "Brigadeiro gourmet", desc: "Unidade", preco: 4.5 },
      ] },
    ],
  },
  {
    id: "sushi", cor: "#E2463F", hero: "1579871494447-9811cf80d66c", ambiente: "1611143669185-af224c5e3252",
    frase: "Peixe fresco, arroz no ponto e corte feito na hora.",
    secoes: [
      { nome: "Combinados", itens: [
        { nome: "Combinado 20 peças", desc: "Sushi, sashimi e uramaki do chef", preco: 79.9, foto: "1553621042-f6e147245754", destaque: true },
        { nome: "Combinado salmão 15 peças", desc: "Só salmão, do jeito que você gosta", preco: 69.9, foto: "1617196034796-73dfa7b1fd56", destaque: true },
      ] },
      { nome: "Uramakis", itens: [
        { nome: "Filadélfia (8 un.)", desc: "Salmão, cream cheese e cebolinha", preco: 32.9, foto: "1579871494447-9811cf80d66c", destaque: true },
        { nome: "Hot roll (10 un.)", desc: "Empanado e crocante", preco: 34.9 },
      ] },
      { nome: "Bebidas", itens: [
        { nome: "Chá gelado da casa", desc: "500 ml", preco: 9.9 },
        { nome: "Refrigerante lata", desc: "350 ml", preco: 6.5 },
      ] },
    ],
  },
  {
    id: "restaurante", cor: "#E07A3F", hero: "1414235077428-338989a2e8c0", ambiente: "1517248135467-4c7edcad34c4",
    frase: "Comida feita na hora, tempero de casa e porção caprichada.",
    secoes: [
      { nome: "Pratos do dia", itens: [
        { nome: "Prato executivo", desc: "Arroz, feijão, salada, fritas e proteína do dia", preco: 32.9, foto: "1504674900247-0877df9cc836", destaque: true },
        { nome: "Bowl de salmão", desc: "Salmão grelhado, legumes e grãos", preco: 44.9, foto: "1546069901-ba9599a7e63c", destaque: true },
        { nome: "Parmegiana de frango", desc: "Com arroz e fritas", preco: 42.9 },
      ] },
      { nome: "Saladas", itens: [
        { nome: "Salada da casa", desc: "Folhas, legumes assados, queijo e molho de mostarda", preco: 29.9, foto: "1540189549336-e6e99c3679fe", destaque: true },
        { nome: "Bowl vegetariano", desc: "Grão-de-bico, abacate e vegetais", preco: 34.9, foto: "1512621776951-a57141f2eefd" },
      ] },
      { nome: "Sobremesas", itens: [
        { nome: "Pudim de leite", desc: "Fatia generosa", preco: 12 },
        { nome: "Mousse de maracujá", desc: "Taça", preco: 11 },
      ] },
      { nome: "Bebidas", itens: [
        { nome: "Suco natural 500 ml", desc: "Laranja, limão ou maracujá", preco: 10 },
        { nome: "Refrigerante lata", desc: "350 ml", preco: 6.5 },
      ] },
    ],
  },
];

export function cardapioPara(categoria: string, nome = ""): Cardapio {
  const c = `${categoria} ${nome}`.toLowerCase();
  const id =
    /pizz/.test(c) ? "pizza" :
    /hamb|burger|lanch|fast/.test(c) ? "burger" :
    /padar|pão|pao|panific/.test(c) ? "padaria" :
    /caf/.test(c) ? "cafe" :
    /\bbar\b|boteco|adega|bebida|chope|cerve/.test(c) ? "bar" :
    /doce|confeit|sorvet|açaí|acai|bolo|gelat/.test(c) ? "doces" :
    /sushi|japon|temaki/.test(c) ? "sushi" : "restaurante";
  return CARDAPIOS.find((x) => x.id === id)!;
}

// ---------------- SITES ----------------

const SITES: SiteNicho[] = [
  {
    id: "barbearia", tema: "escuro", cor: "#C9A24A", hero: "1585747860715-2ba37e788b70",
    galeria: ["1622286342621-4bd786c2447c", "1512690459411-b9245aed614b", "1503951914875-452162b0f3f1"],
    titulo: ["Corte na régua,", "barba alinhada."], sub: "Atendimento com hora marcada, ambiente de respeito e aquele acabamento que dá orgulho de sair na rua.", cta: "Agendar horário",
    servicos: [
      { nome: "Corte masculino", desc: "Do clássico ao degradê, do seu jeito.", icone: "scissors" },
      { nome: "Barba completa", desc: "Toalha quente, navalha e hidratação.", icone: "sparkles" },
      { nome: "Corte + barba", desc: "O combo completo, com desconto.", icone: "crown" },
      { nome: "Pigmentação", desc: "Disfarça falhas e realça o corte.", icone: "palette" },
      { nome: "Sobrancelha", desc: "Acabamento na navalha ou pinça.", icone: "eye" },
      { nome: "Tratamento capilar", desc: "Hidratação e cuidado com o couro cabeludo.", icone: "droplet" },
    ],
    porque: [["Hora marcada", "Sem fila e sem espera: você chega e senta."], ["Profissionais experientes", "Técnica atualizada e atenção a cada detalhe."], ["Ambiente da casa", "Café, música boa e conversa de verdade."]],
    faq: [["Precisa agendar?", "Recomendamos: assim você não espera. Mas encaixamos quando dá."], ["Quais formas de pagamento?", "Pix, cartão de débito e crédito."], ["Atende criança?", "Sim, a partir de 4 anos."]],
    depoimentos: [["Melhor degradê da região, sempre saio satisfeito.", "Lucas M."], ["Atendimento pontual e ambiente top.", "Rafael S."], ["Barba impecável, virou meu lugar fixo.", "André P."]],
  },
  {
    id: "beleza", tema: "claro", cor: "#C46A86", hero: "1560066984-138dadb4c035",
    galeria: ["1570172619644-dfd03ed5d881", "1604654894610-df63bc536371", "1522337360788-8b13dee7a37e", "1487412947147-5cebf100ffc2"],
    titulo: ["Cuidado que você", "sente."], sub: "Profissionais qualificadas, produtos de qualidade e um espaço pensado para você relaxar.", cta: "Agendar horário",
    servicos: [
      { nome: "Limpeza de pele", desc: "Pele renovada e livre de impurezas.", icone: "sparkles" },
      { nome: "Design de sobrancelha", desc: "Desenho que valoriza o seu rosto.", icone: "eye" },
      { nome: "Manicure e pedicure", desc: "Esmaltação tradicional e em gel.", icone: "hand" },
      { nome: "Cabelo", desc: "Corte, escova, coloração e tratamentos.", icone: "scissors" },
      { nome: "Maquiagem", desc: "Para eventos, festas e ensaios.", icone: "palette" },
      { nome: "Massagem relaxante", desc: "Uma pausa merecida na rotina.", icone: "flower" },
    ],
    porque: [["Biossegurança", "Materiais esterilizados e descartáveis."], ["Produtos de qualidade", "Marcas profissionais em todos os procedimentos."], ["Atendimento acolhedor", "Você é recebida pelo nome, sem pressa."]],
    faq: [["Como agendar?", "Pelo WhatsApp: escolha o serviço e o melhor horário."], ["Aceitam cartão?", "Sim, débito, crédito e Pix."], ["Têm pacotes?", "Sim, com valores especiais para quem vem todo mês."]],
    depoimentos: [["Saí renovada, atendimento maravilhoso.", "Juliana R."], ["As meninas são super caprichosas.", "Camila T."], ["Ambiente lindo e muito limpo.", "Patrícia L."]],
  },
  {
    id: "oficina", tema: "escuro", cor: "#F59E0B", hero: "1625047509248-ec889cbff17f",
    galeria: ["1619642751034-765dfdf7c58e", "1486262715619-67b85e0b08d3", "1530046339160-ce3e530c7d2f"],
    titulo: ["Seu carro em", "boas mãos."], sub: "Diagnóstico honesto, peças de qualidade e prazo combinado. Você sabe o que está pagando antes de começar.", cta: "Pedir orçamento",
    servicos: [
      { nome: "Revisão completa", desc: "Checklist de segurança e manutenção.", icone: "clipboard" },
      { nome: "Freios e suspensão", desc: "Pastilhas, discos, amortecedores.", icone: "disc" },
      { nome: "Troca de óleo", desc: "Óleo e filtros na especificação certa.", icone: "droplet" },
      { nome: "Injeção eletrônica", desc: "Scanner e diagnóstico preciso.", icone: "cpu" },
      { nome: "Ar-condicionado", desc: "Higienização e recarga de gás.", icone: "wind" },
      { nome: "Elétrica", desc: "Bateria, alternador e partida.", icone: "zap" },
    ],
    porque: [["Orçamento antes", "Nada é feito sem a sua aprovação."], ["Garantia no serviço", "Peças e mão de obra com garantia."], ["Prazo cumprido", "Combinou, entregou."]],
    faq: [["O orçamento é pago?", "Não, o orçamento é gratuito e sem compromisso."], ["Quanto tempo demora uma revisão?", "Normalmente o carro fica pronto no mesmo dia."], ["Aceitam cartão?", "Sim, e parcelamos serviços maiores."]],
    depoimentos: [["Honestos demais, explicaram tudo antes de mexer.", "Marcos A."], ["Resolveram o que outra oficina não achou.", "Fernanda C."], ["Preço justo e serviço rápido.", "Ricardo B."]],
  },
  {
    id: "dentista", tema: "claro", cor: "#0EA5A4", hero: "1629909613654-28e377c37b09",
    galeria: ["1606811971618-4486d14f3f99", "1588776814546-1ffcf47267a5", "1609840114035-3c981b782dfe"],
    titulo: ["Sorria com", "confiança."], sub: "Tratamentos modernos, atendimento humanizado e um consultório pensado para o seu conforto.", cta: "Agendar avaliação",
    servicos: [
      { nome: "Avaliação", desc: "Consulta completa e plano de tratamento.", icone: "clipboard" },
      { nome: "Limpeza", desc: "Profilaxia e remoção de tártaro.", icone: "sparkles" },
      { nome: "Clareamento", desc: "Sorriso mais branco com segurança.", icone: "sun" },
      { nome: "Ortodontia", desc: "Aparelho fixo e alinhadores.", icone: "smile" },
      { nome: "Implantes", desc: "Recupere a função e a estética.", icone: "shield" },
      { nome: "Restaurações", desc: "Resina na cor do seu dente.", icone: "heart" },
    ],
    porque: [["Atendimento sem dor", "Técnicas modernas e anestesia confortável."], ["Equipamentos atuais", "Mais precisão e menos tempo na cadeira."], ["Parcelamento", "Tratamento que cabe no seu bolso."]],
    faq: [["A avaliação é paga?", "Consulte: muitas vezes a primeira avaliação é gratuita."], ["Atendem convênio?", "Fale com a gente para saber os convênios aceitos."], ["Atendem crianças?", "Sim, com todo o cuidado que elas precisam."]],
    depoimentos: [["Perdi o medo de dentista aqui.", "Beatriz F."], ["Profissionais atenciosos e pontuais.", "Gustavo H."], ["Meu clareamento ficou perfeito.", "Aline M."]],
  },
  {
    id: "clinica", tema: "claro", cor: "#2563EB", hero: "1519494026892-80bbd2d6fd0d",
    galeria: ["1631217868264-e5b90bb7e133", "1576091160550-2173dba999ef"],
    titulo: ["Atendimento que", "acolhe."], sub: "Equipe experiente, agendamento rápido e cuidado de verdade com cada paciente.", cta: "Agendar consulta",
    servicos: [
      { nome: "Consultas", desc: "Clínico geral e especialidades.", icone: "stethoscope" },
      { nome: "Exames", desc: "Coleta e resultados ágeis.", icone: "clipboard" },
      { nome: "Retornos", desc: "Acompanhamento do seu tratamento.", icone: "calendar" },
      { nome: "Check-up", desc: "Avaliação completa da sua saúde.", icone: "heart" },
      { nome: "Atendimento particular", desc: "Valores acessíveis e transparentes.", icone: "shield" },
      { nome: "Agendamento online", desc: "Marque pelo WhatsApp em minutos.", icone: "phone" },
    ],
    porque: [["Sem demora", "Horários pontuais, respeito ao seu tempo."], ["Equipe qualificada", "Profissionais experientes e atualizados."], ["Estrutura confortável", "Ambiente limpo, acessível e acolhedor."]],
    faq: [["Como marcar?", "Pelo WhatsApp ou telefone, com confirmação rápida."], ["Atendem convênio?", "Consulte os convênios aceitos."], ["Qual o horário?", "Segunda a sábado, com horários estendidos."]],
    depoimentos: [["Fui muito bem atendida do início ao fim.", "Sandra V."], ["Rápido, organizado e atencioso.", "Paulo R."], ["Recomendo a toda a família.", "Mariana G."]],
  },
  {
    id: "academia", tema: "escuro", cor: "#A3E635", hero: "1534438327276-14e5300c3a48",
    galeria: ["1517836357463-d25dfeac3438", "1540497077202-7c8a3999166f", "1583454110551-21f2fa2afe61", "1571019613454-1cb2f99b2d8b"],
    titulo: ["Seu treino", "começa aqui."], sub: "Estrutura completa, professores acompanhando de perto e planos que cabem na sua rotina.", cta: "Agendar aula grátis",
    servicos: [
      { nome: "Musculação", desc: "Equipamentos modernos e treino orientado.", icone: "dumbbell" },
      { nome: "Funcional", desc: "Força, mobilidade e condicionamento.", icone: "zap" },
      { nome: "Aulas coletivas", desc: "Energia de grupo, horários variados.", icone: "users" },
      { nome: "Avaliação física", desc: "Metas claras e evolução medida.", icone: "clipboard" },
      { nome: "Personal", desc: "Acompanhamento individual.", icone: "target" },
      { nome: "Planos flexíveis", desc: "Mensal, trimestral ou anual.", icone: "calendar" },
    ],
    porque: [["Professores no salão", "Ninguém treina sozinho aqui."], ["Horário estendido", "Treine antes ou depois do trabalho."], ["Sem fidelidade forçada", "Fica porque gosta, não porque assinou."]],
    faq: [["Tem aula experimental?", "Sim, a primeira aula é por nossa conta."], ["Precisa de exame?", "Recomendamos avaliação física na entrada."], ["Qual o horário?", "De segunda a sábado, das 6h às 23h."]],
    depoimentos: [["Ambiente motivador e professores presentes.", "Diego L."], ["Melhor custo-benefício da região.", "Thaís N."], ["Em 3 meses já vi resultado.", "Bruno K."]],
  },
  {
    id: "pet", tema: "claro", cor: "#F97316", hero: "1548199973-03cce0bbc87b",
    galeria: ["1516734212186-a967f81ad0d7", "1587300003388-59208cc962cb"],
    titulo: ["Amor e cuidado com", "seu pet."], sub: "Banho, tosa, consultas e tudo o que ele precisa, com o carinho de quem é apaixonado por bicho.", cta: "Agendar banho",
    servicos: [
      { nome: "Banho e tosa", desc: "Produtos suaves e secagem cuidadosa.", icone: "droplet" },
      { nome: "Consultas", desc: "Veterinários de confiança.", icone: "stethoscope" },
      { nome: "Vacinas", desc: "Carteirinha sempre em dia.", icone: "shield" },
      { nome: "Leva e traz", desc: "Buscamos e entregamos em casa.", icone: "truck" },
      { nome: "Rações e petiscos", desc: "As melhores marcas com bom preço.", icone: "bag" },
      { nome: "Hotelzinho", desc: "Ele fica bem enquanto você viaja.", icone: "home" },
    ],
    porque: [["Equipe apaixonada", "Tratamos seu pet como se fosse nosso."], ["Ambiente seguro", "Espaços separados e higienizados."], ["Leva e traz", "Comodidade para a sua rotina."]],
    faq: [["Precisa agendar o banho?", "Sim, para garantir o horário e sem espera."], ["Atendem gatos?", "Sim, com manejo especial e tranquilo."], ["Fazem leva e traz?", "Sim, consulte a sua região."]],
    depoimentos: [["Meu cachorro volta cheiroso e feliz.", "Carla D."], ["Cuidadosos demais com meu gato.", "Renato F."], ["Leva e traz salvou minha rotina.", "Vanessa O."]],
  },
  {
    id: "obras", tema: "escuro", cor: "#D4A373", hero: "1600585154340-be6161a56a0c",
    galeria: ["1600566753190-17f0baa2a6c3", "1581858726788-75bc0f6a952d", "1611486212557-88be5ff6f941", "1504307651254-35680f356dfd"],
    titulo: ["Do projeto à", "entrega."], sub: "Reformas e construções feitas com capricho, obra limpa e prazo cumprido. Você acompanha cada etapa.", cta: "Pedir orçamento",
    servicos: [
      { nome: "Reformas completas", desc: "Casa, apartamento ou comércio.", icone: "home" },
      { nome: "Acabamentos", desc: "Piso, revestimento e gesso.", icone: "layers" },
      { nome: "Elétrica e hidráulica", desc: "Instalações seguras e na norma.", icone: "zap" },
      { nome: "Pintura", desc: "Interna, externa e texturas.", icone: "palette" },
      { nome: "Móveis sob medida", desc: "Projetos que aproveitam cada canto.", icone: "ruler" },
      { nome: "Projeto e orçamento", desc: "Visita técnica sem compromisso.", icone: "clipboard" },
    ],
    porque: [["Orçamento detalhado", "Você sabe o custo de cada etapa."], ["Obra limpa", "Organização e respeito à sua casa."], ["Prazo combinado", "Cronograma claro do início ao fim."]],
    faq: [["A visita é paga?", "Não, a visita técnica e o orçamento são gratuitos."], ["Vocês compram o material?", "Podemos comprar ou orientar a sua compra."], ["Tem garantia?", "Sim, garantia de execução do serviço."]],
    depoimentos: [["Reforma ficou linda e no prazo.", "Eduardo S."], ["Equipe organizada e caprichosa.", "Luciana P."], ["Orçamento honesto, sem surpresas.", "Henrique T."]],
  },
  {
    id: "tattoo", tema: "escuro", cor: "#DC2626", hero: "1598371839696-5c5bb00bdc28",
    galeria: ["1562962230-16e4623d36e6", "1611501275019-9b5cda994e8d"],
    titulo: ["Arte que fica", "na pele."], sub: "Projetos exclusivos, traço limpo e biossegurança total. Sua ideia vira desenho com a gente.", cta: "Fazer orçamento",
    servicos: [
      { nome: "Fineline", desc: "Traço fino e delicado.", icone: "pen" },
      { nome: "Realismo", desc: "Sombras e detalhes que impressionam.", icone: "eye" },
      { nome: "Blackwork", desc: "Preto sólido e contraste forte.", icone: "moon" },
      { nome: "Cobertura", desc: "Transformamos tatuagens antigas.", icone: "layers" },
      { nome: "Projetos autorais", desc: "Desenho exclusivo para você.", icone: "palette" },
      { nome: "Piercing", desc: "Aplicação com material esterilizado.", icone: "sparkles" },
    ],
    porque: [["Biossegurança", "Material descartável e autoclave."], ["Desenho exclusivo", "Nada de catálogo: é a sua história."], ["Pós-tattoo", "Orientação completa para cicatrizar bem."]],
    faq: [["Como faço orçamento?", "Mande sua ideia, referência e local do corpo pelo WhatsApp."], ["Precisa de sinal?", "Sim, um sinal garante a data e o desenho."], ["Dói muito?", "Depende do local, e a gente vai no seu ritmo."]],
    depoimentos: [["Traço impecável, superou o que eu imaginava.", "Natália V."], ["Estúdio limpo e artista muito atencioso.", "Igor M."], ["Cobriu minha tattoo antiga com perfeição.", "Bruna A."]],
  },
  {
    id: "loja", tema: "claro", cor: "#4F46E5", hero: "1441986300917-64674bd600d8",
    galeria: ["1567401893414-76b7b1e5a7a5", "1542838132-92c53300491e", "1487070183336-b863922373d4"],
    titulo: ["Qualidade e atendimento", "de verdade."], sub: "Conheça nossos produtos e serviços, tire dúvidas e compre direto pelo WhatsApp.", cta: "Falar no WhatsApp",
    servicos: [
      { nome: "Atendimento personalizado", desc: "A gente te ajuda a escolher.", icone: "users" },
      { nome: "Orçamento rápido", desc: "Resposta no mesmo dia.", icone: "clock" },
      { nome: "Preço justo", desc: "Qualidade sem pagar a mais.", icone: "tag" },
      { nome: "Pagamento facilitado", desc: "Pix, débito e crédito.", icone: "card" },
      { nome: "Entrega", desc: "Consulte a sua região.", icone: "truck" },
      { nome: "Garantia", desc: "Compra segura e troca facilitada.", icone: "shield" },
    ],
    porque: [["Perto de você", "Atendimento no bairro, sem complicação."], ["Resposta rápida", "Chamou no WhatsApp, a gente responde."], ["Confiança", "Clientes que voltam sempre."]],
    faq: [["Fazem entrega?", "Sim, consulte a sua região pelo WhatsApp."], ["Quais formas de pagamento?", "Pix, débito e crédito."], ["Qual o horário?", "De segunda a sábado, em horário comercial."]],
    depoimentos: [["Atendimento nota 10, recomendo.", "Cláudia R."], ["Preço bom e entrega rápida.", "Sérgio L."], ["Sempre resolvem o que eu preciso.", "Elaine M."]],
  },
];

export function sitePara(categoria: string, nome = ""): SiteNicho {
  const c = `${categoria} ${nome}`.toLowerCase();
  const id =
    /barb/.test(c) ? "barbearia" :
    /salão|salao|cabel|estét|estet|beleza|unha|nail|manicure|sobrancel|cosmet/.test(c) ? "beleza" :
    /mecân|mecan|oficina|auto|pneu|borrach|moto|lava/.test(c) ? "oficina" :
    /dent|odonto/.test(c) ? "dentista" :
    /clín|clin|consult|médic|medic|saúde|saude|fisio|psic|laborat/.test(c) ? "clinica" :
    /academ|fitness|crossfit|pilates/.test(c) ? "academia" :
    /pet|veter|banho e tosa/.test(c) ? "pet" :
    /constr|reform|pedrei|pintor|gesso|eletric|encan|serralh|vidra|marcen|móve|move|arquitet|obra/.test(c) ? "obras" :
    /tatu|tattoo|piercing/.test(c) ? "tattoo" : "loja";
  return SITES.find((x) => x.id === id)!;
}

export const CORES_SUGERIDAS = ["#E4572E", "#F4A23B", "#C9A24A", "#0EA5A4", "#2563EB", "#4F46E5", "#C46A86", "#A3E635", "#DC2626", "#D4A373"];
