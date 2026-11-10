// Página de exemplo que o cliente abre pelo link: cardápio digital ou site com o nome dele.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, MessageCircle, Phone, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib";
import { decodeExample, type ExampleData } from "@/engine/example";

type Item = { nome: string; desc: string; preco: string };

function cardapio(cat: string): Record<string, Item[]> {
  const c = cat.toLowerCase();
  if (/pizz/.test(c)) return {
    "Pizzas salgadas": [
      { nome: "Margherita", desc: "Molho de tomate, muçarela, tomate e manjericão", preco: "54,90" },
      { nome: "Calabresa", desc: "Calabresa fatiada, cebola e azeitonas", preco: "52,90" },
      { nome: "Portuguesa", desc: "Presunto, ovos, cebola, ervilha e muçarela", preco: "59,90" },
      { nome: "Frango com catupiry", desc: "Frango desfiado e catupiry original", preco: "58,90" },
    ],
    "Pizzas doces": [
      { nome: "Chocolate com morango", desc: "Chocolate ao leite e morangos frescos", preco: "56,90" },
      { nome: "Romeu e Julieta", desc: "Muçarela e goiabada cascão", preco: "49,90" },
    ],
    Bebidas: [{ nome: "Refrigerante 2L", desc: "Coca-Cola, Guaraná ou Fanta", preco: "14,00" }, { nome: "Suco natural", desc: "Laranja, limão ou maracujá", preco: "9,00" }],
  };
  if (/padaria|pão|pao|confeit|doce/.test(c)) return {
    "Pães e salgados": [
      { nome: "Pão francês (kg)", desc: "Quentinho, saindo do forno toda hora", preco: "18,90" },
      { nome: "Coxinha de frango", desc: "Massa crocante e recheio cremoso", preco: "7,50" },
      { nome: "Pão de queijo", desc: "Porção com 6 unidades", preco: "9,00" },
    ],
    "Doces e bolos": [
      { nome: "Bolo de cenoura com chocolate", desc: "Fatia generosa", preco: "8,50" },
      { nome: "Sonho de creme", desc: "Recheio de creme de baunilha", preco: "6,90" },
    ],
    Café: [{ nome: "Café coado", desc: "Copo 200 ml", preco: "4,50" }, { nome: "Pingado na chapa", desc: "Café com leite + pão na chapa", preco: "11,90" }],
  };
  if (/hamb|lanch|fast|burger/.test(c)) return {
    Lanches: [
      { nome: "X-Burger", desc: "Pão, hambúrguer 150g, queijo e maionese da casa", preco: "24,90" },
      { nome: "X-Salada", desc: "Hambúrguer, queijo, alface, tomate e cebola roxa", preco: "27,90" },
      { nome: "X-Bacon", desc: "Hambúrguer, queijo e bacon crocante", preco: "31,90" },
    ],
    Porções: [{ nome: "Batata frita", desc: "Porção individual com cheddar e bacon", preco: "22,90" }, { nome: "Onion rings", desc: "Anéis de cebola empanados", preco: "19,90" }],
    Bebidas: [{ nome: "Refrigerante lata", desc: "350 ml", preco: "6,50" }, { nome: "Milk-shake", desc: "Chocolate, morango ou ovomaltine", preco: "18,90" }],
  };
  if (/bar|boteco|adega|bebida|cerve/.test(c)) return {
    Petiscos: [
      { nome: "Porção de calabresa acebolada", desc: "Acompanha pão francês", preco: "39,90" },
      { nome: "Bolinho de bacalhau", desc: "10 unidades", preco: "44,90" },
      { nome: "Torresmo", desc: "Crocante, com limão", preco: "34,90" },
    ],
    Bebidas: [{ nome: "Cerveja 600 ml", desc: "Consulte as marcas do dia", preco: "15,00" }, { nome: "Caipirinha", desc: "Limão, morango ou maracujá", preco: "22,00" }],
  };
  if (/caf/.test(c)) return {
    Cafés: [
      { nome: "Espresso", desc: "Grãos especiais torrados na semana", preco: "7,00" },
      { nome: "Cappuccino", desc: "Espresso, leite vaporizado e canela", preco: "12,90" },
      { nome: "Latte gelado", desc: "Com calda de caramelo", preco: "15,90" },
    ],
    Comidinhas: [{ nome: "Croissant de presunto e queijo", desc: "Folhado na manteiga", preco: "16,90" }, { nome: "Bolo do dia", desc: "Pergunte o sabor", preco: "10,90" }],
  };
  if (/sorvet|açaí|acai/.test(c)) return {
    Açaí: [
      { nome: "Açaí 300 ml", desc: "Com 3 acompanhamentos", preco: "16,90" },
      { nome: "Açaí 500 ml", desc: "Com 4 acompanhamentos", preco: "22,90" },
    ],
    Sorvetes: [{ nome: "Casquinha", desc: "1 bola", preco: "7,00" }, { nome: "Sundae", desc: "Calda quente e farofa", preco: "14,90" }],
  };
  return {
    "Pratos do dia": [
      { nome: "Prato executivo", desc: "Arroz, feijão, salada, fritas e proteína do dia", preco: "29,90" },
      { nome: "Parmegiana de frango", desc: "Com arroz e fritas", preco: "39,90" },
      { nome: "Feijoada (sábado)", desc: "Completa, serve 1 pessoa", preco: "44,90" },
    ],
    Sobremesas: [{ nome: "Pudim de leite", desc: "Fatia", preco: "12,00" }, { nome: "Mousse de maracujá", desc: "Taça", preco: "11,00" }],
    Bebidas: [{ nome: "Suco natural", desc: "500 ml", preco: "10,00" }, { nome: "Refrigerante lata", desc: "350 ml", preco: "6,50" }],
  };
}

function servicos(cat: string): { titulo: string; frase: string; itens: string[] } {
  const c = cat.toLowerCase();
  if (/mecân|mecan|oficina|auto|pneu|borrach|moto/.test(c)) return { titulo: "Seu carro em boas mãos", frase: "Diagnóstico honesto, peças de qualidade e prazo combinado.", itens: ["Revisão completa", "Freios e suspensão", "Troca de óleo e filtros", "Injeção eletrônica", "Ar-condicionado", "Orçamento sem compromisso"] };
  if (/barb|salão|salao|cabel/.test(c)) return { titulo: "Seu estilo, do seu jeito", frase: "Atendimento com hora marcada e ambiente confortável.", itens: ["Corte masculino", "Barba completa", "Corte + barba", "Pigmentação", "Sobrancelha", "Tratamentos capilares"] };
  if (/estét|estet|beleza|unha|nail/.test(c)) return { titulo: "Cuidado que você sente", frase: "Profissionais qualificadas e produtos de qualidade.", itens: ["Limpeza de pele", "Design de sobrancelha", "Manicure e pedicure", "Depilação", "Massagem relaxante", "Pacotes mensais"] };
  if (/dent|odonto/.test(c)) return { titulo: "Sorria com confiança", frase: "Tratamentos modernos com atendimento humanizado.", itens: ["Avaliação", "Limpeza", "Clareamento", "Restaurações", "Ortodontia", "Implantes"] };
  if (/clín|clin|consult|saúde|saude/.test(c)) return { titulo: "Atendimento que acolhe", frase: "Equipe experiente e agendamento rápido.", itens: ["Consultas", "Exames", "Retornos", "Atendimento particular", "Convênios", "Agendamento online"] };
  if (/veter|pet/.test(c)) return { titulo: "Amor e cuidado com seu pet", frase: "Do banho à consulta, seu pet bem cuidado.", itens: ["Banho e tosa", "Consultas", "Vacinas", "Rações e acessórios", "Leva e traz", "Hotelzinho"] };
  if (/academ|fitness/.test(c)) return { titulo: "Seu treino começa aqui", frase: "Estrutura completa e professores acompanhando você.", itens: ["Musculação", "Funcional", "Aulas coletivas", "Avaliação física", "Planos mensais", "Personal trainer"] };
  if (/constr|reform|pedrei|pintor|gesso|eletric|encan|serralh|vidra|marcen|móve|move/.test(c)) return { titulo: "Do projeto à entrega", frase: "Serviço caprichado, limpo e dentro do prazo.", itens: ["Reformas completas", "Acabamentos", "Elétrica e hidráulica", "Pintura", "Projetos sob medida", "Orçamento grátis"] };
  if (/tatu|tattoo/.test(c)) return { titulo: "Arte que fica na pele", frase: "Projetos exclusivos e biossegurança total.", itens: ["Tattoo fineline", "Realismo", "Old school", "Cobertura", "Piercing", "Orçamento pelo WhatsApp"] };
  return { titulo: "Qualidade e atendimento de verdade", frase: "Conheça nossos serviços e fale com a gente.", itens: ["Atendimento personalizado", "Orçamento rápido", "Preço justo", "Pagamento facilitado", "Garantia", "Atendimento pelo WhatsApp"] };
}

function Banner({ d }: { d: ExampleData }) {
  const msg = encodeURIComponent(`Olá! Vi o exemplo da ${d.n} e gostei. Vamos conversar?`);
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-neutral-900 px-4 py-2 text-center text-xs text-white">
      <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Este é um <b>exemplo</b> feito para {d.n}{d.by ? ` por ${d.by}` : ""}.</span>
      {d.bw && (
        <a href={`https://wa.me/${d.bw}?text=${msg}`} className="rounded-full bg-white px-3 py-0.5 font-medium text-neutral-900">Gostei, quero o meu</a>
      )}
    </div>
  );
}

function Cardapio({ d }: { d: ExampleData }) {
  const menu = useMemo(() => cardapio(d.c), [d.c]);
  const secoes = Object.keys(menu);
  const [aba, setAba] = useState(secoes[0]);
  const wa = d.w ? `https://wa.me/${d.w}?text=${encodeURIComponent("Olá! Vi o cardápio e quero fazer um pedido.")}` : "";
  return (
    <div className="mx-auto max-w-lg pb-28">
      <div className="relative h-44 bg-gradient-to-br from-orange-400 via-red-500 to-rose-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_50%)]" />
      </div>
      <div className="relative -mt-12 px-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-4xl font-serif italic text-rose-600 shadow-xl ring-4 ring-white">
          {d.n.charAt(0)}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{d.n}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
          <span>{d.c}</span>
          <span className="flex items-center gap-1 text-emerald-600"><Clock className="h-3.5 w-3.5" /> Aberto agora</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4,8</span>
        </div>
        {d.e && <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500"><MapPin className="h-3.5 w-3.5" /> {d.e}</div>}
      </div>

      <div className="sticky top-8 z-40 mt-5 flex gap-2 overflow-x-auto bg-white/90 px-5 py-3 backdrop-blur">
        {secoes.map((s) => (
          <button key={s} onClick={() => { setAba(s); document.getElementById("sec-" + s)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition", aba === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700")}>
            {s}
          </button>
        ))}
      </div>

      <div className="px-5">
        {secoes.map((s) => (
          <section key={s} id={"sec-" + s} className="scroll-mt-28 pt-4">
            <h2 className="mb-2 text-lg font-semibold">{s}</h2>
            <div className="divide-y divide-neutral-100">
              {menu[s].map((i) => (
                <div key={i.nome} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <div className="font-medium">{i.nome}</div>
                    <div className="text-sm text-neutral-500">{i.desc}</div>
                  </div>
                  <div className="shrink-0 font-semibold text-rose-600">R$ {i.preco}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <p className="mt-6 text-center text-xs text-neutral-400">Preços e itens ilustrativos: no seu cardápio entram os seus produtos e fotos.</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg p-4">
        <a href={wa || undefined} className={cn("flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-semibold text-white shadow-xl", !wa && "opacity-80")}>
          <MessageCircle className="h-5 w-5" /> Fazer pedido pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function Site({ d }: { d: ExampleData }) {
  const s = servicos(d.c);
  const portfolio = d.k === "portfolio";
  const wa = d.w ? `https://wa.me/${d.w}?text=${encodeURIComponent("Olá! Vi o site e gostaria de um orçamento.")}` : "";
  const cores = ["from-sky-400 to-indigo-600", "from-amber-300 to-orange-600", "from-emerald-300 to-teal-700", "from-fuchsia-400 to-purple-700", "from-rose-300 to-red-600", "from-slate-300 to-slate-700"];
  return (
    <div>
      <header className="relative overflow-hidden bg-neutral-950 px-6 pb-20 pt-10 text-white md:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(99,102,241,.45),transparent_55%)]" />
        <nav className="relative flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">{d.n}</span>
          {wa && <a href={wa} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900">Fale conosco</a>}
        </nav>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative mt-16 max-w-2xl">
          <div className="mb-3 text-sm text-indigo-200">{d.c}{d.e ? ` · ${d.e.split(",").slice(-2).join(",").trim()}` : ""}</div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            {s.titulo.split(" ").slice(0, -1).join(" ")} <span className="font-serif italic font-normal">{s.titulo.split(" ").slice(-1)}</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-300">{s.frase}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={wa || undefined} className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-medium"><MessageCircle className="h-5 w-5" /> Pedir orçamento</a>
            {d.t && <a href={`tel:${d.t.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 rounded-full px-6 py-3 ring-1 ring-white/30"><Phone className="h-5 w-5" /> {d.t}</a>}
          </div>
        </motion.div>
      </header>

      <section className="px-6 py-16 md:px-16">
        <h2 className="text-3xl font-semibold tracking-tight">Serviços</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.itens.map((i) => (
            <div key={i} className="rounded-2xl bg-neutral-50 p-5 ring-1 ring-neutral-100">
              <div className="mb-3 h-9 w-9 rounded-xl bg-neutral-900" />
              <div className="font-medium">{i}</div>
            </div>
          ))}
        </div>
      </section>

      {portfolio && (
        <section className="px-6 pb-16 md:px-16">
          <h2 className="text-3xl font-semibold tracking-tight">Trabalhos realizados</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {cores.map((c, i) => (
              <div key={i} className={cn("aspect-[4/3] rounded-2xl bg-gradient-to-br", c)} />
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400">Aqui entram as fotos reais dos seus trabalhos.</p>
        </section>
      )}

      <section className="bg-neutral-50 px-6 py-16 md:px-16">
        <h2 className="text-3xl font-semibold tracking-tight">O que dizem nossos clientes</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Atendimento excelente, super recomendo!", "Preço justo e serviço caprichado.", "Resolveram rápido e com muita atenção."].map((t, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-neutral-100">
              <div className="mb-2 flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-neutral-700">"{t}"</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-14 md:px-16">
        <h2 className="text-3xl font-semibold tracking-tight">Contato</h2>
        <div className="mt-4 space-y-2 text-neutral-600">
          {d.e && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {d.e}</div>}
          {d.t && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {d.t}</div>}
        </div>
        <p className="mt-8 text-xs text-neutral-400">Textos, fotos e depoimentos ilustrativos: no seu site entram os seus.</p>
      </footer>

      {wa && (
        <a href={wa} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl">
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}

export function ExamplePage() {
  const d = useMemo(() => decodeExample(location.hash), []);
  if (!d) {
    return <div className="flex min-h-screen items-center justify-center bg-white p-6 text-neutral-600">Link de exemplo inválido.</div>;
  }
  document.title = `${d.n} · exemplo`;
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Banner d={d} />
      {d.k === "cardapio" ? <Cardapio d={d} /> : <Site d={d} />}
    </div>
  );
}
