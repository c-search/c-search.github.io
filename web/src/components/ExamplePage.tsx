// Página que o dono do negócio abre pelo link: cardápio digital interativo ou site completo.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as I from "lucide-react";
import { decodeExample, mapaEmbed, type ExampleData } from "@/engine/example";
import { carregarDemo } from "@/engine/shortlink";
import { cardapioPara, foto, sitePara, src, type MenuItem, type SiteNicho } from "@/engine/niches";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iniciais = (n: string) => n.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || n[0];
// bairro: no endereço do Google vem depois do número ("Rua X, 713 - Mooca, São Paulo - SP" → "Mooca")
const bairroDe = (e?: string) => {
  if (!e) return "";
  const g = e.match(/\d+[A-Za-z]?\s*-\s*([^,]+)/);
  if (g && !/\bSP\b|^\d/.test(g[1])) return g[1].trim();
  const partes = e.split(",").map((s) => s.trim()).filter((x) => x && !/^\d|\s-\s[A-Z]{2}$/.test(x));
  return partes.length > 2 ? partes[partes.length - 2] : "";
};
const wa = (num: string | undefined, txt: string) => (num ? `https://wa.me/${num}?text=${encodeURIComponent(txt)}` : undefined);

const ICONES: Record<string, I.LucideIcon> = {
  scissors: I.Scissors, sparkles: I.Sparkles, crown: I.Crown, palette: I.Palette, eye: I.Eye, droplet: I.Droplet,
  hand: I.Hand, flower: I.Flower2, clipboard: I.ClipboardCheck, disc: I.Disc3, cpu: I.Cpu, wind: I.Wind, zap: I.Zap,
  sun: I.Sun, smile: I.Smile, shield: I.ShieldCheck, heart: I.HeartPulse, stethoscope: I.Stethoscope, calendar: I.CalendarCheck,
  phone: I.Smartphone, dumbbell: I.Dumbbell, users: I.Users, target: I.Target, truck: I.Truck, bag: I.ShoppingBag,
  home: I.Home, layers: I.Layers, ruler: I.Ruler, pen: I.PenTool, moon: I.Moon, clock: I.Clock3, tag: I.Tag, card: I.CreditCard,
};

/** Foto real que não carregou (site do dono bloqueou, por exemplo): troca por uma do banco. */
const semFoto = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.trocada) return;
  img.dataset.trocada = "1";
  img.src = foto("1517248135467-4c7edcad34c4", 1200);
};

/* --------------------------- faixa "isto é um exemplo" --------------------------- */
function Faixa({ d, escuro, flutuante }: { d: ExampleData; escuro: boolean; flutuante?: boolean }) {
  const [fechada, setFechada] = useState(false);
  if (fechada) return null;
  // no site (que tem menu fixo no topo) a faixa vira uma pílula flutuante embaixo, para não cobrir o menu
  const pos = flutuante
    ? "fixed bottom-4 left-4 z-[60] max-w-[calc(100%-6rem)] rounded-full py-2 pl-4 pr-9 shadow-2xl"
    : "relative z-[60] justify-center px-10 py-2";
  return (
    <div className={`flex items-center gap-3 text-[12px] ${pos} ${escuro ? "bg-white text-neutral-900" : "bg-neutral-950 text-white"}`}>
      <I.Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Prévia criada para <b>{d.n}</b>{d.by ? <> por {d.by}</> : null}</span>
      {d.bw && (
        <a href={wa(d.bw, `Olá! Vi a prévia da ${d.n} e gostei. Vamos conversar?`)} className={`shrink-0 rounded-full px-3 py-0.5 font-semibold ${escuro ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"}`}>
          Quero o meu
        </a>
      )}
      <button onClick={() => setFechada(true)} aria-label="Fechar" className="absolute right-3 opacity-60 hover:opacity-100"><I.X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ================================= CARDÁPIO ================================= */
function CardapioDigital({ d }: { d: ExampleData }) {
  const m = cardapioPara(d.c, d.n);
  const ac = d.a || m.cor;
  const bairro = bairroDe(d.e);
  const [sacola, setSacola] = useState<Record<string, number>>({});
  const [aberta, setAberta] = useState(false);
  const [modo, setModo] = useState<"Entrega" | "Retirada">("Entrega");
  const [nomeCliente, setNomeCliente] = useState("");
  const [obs, setObs] = useState("");
  const [aba, setAba] = useState(m.secoes[0].nome);
  const tabsRef = useRef<HTMLDivElement>(null);

  const itens = m.secoes.flatMap((s) => s.itens);
  const destaques = itens.filter((i) => i.destaque && i.foto);
  const qtd = Object.values(sacola).reduce((a, b) => a + b, 0);
  const total = Object.entries(sacola).reduce((s, [n, q]) => s + (itens.find((i) => i.nome === n)?.preco || 0) * q, 0);
  const add = (n: string, dlt = 1) => setSacola((s) => { const q = Math.max(0, (s[n] || 0) + dlt); const c = { ...s, [n]: q }; if (!q) delete c[n]; return c; });

  // destaca a aba da seção visível
  useEffect(() => {
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setAba(e.target.getAttribute("data-sec")!)), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("[data-sec]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const pedido = [
    `Olá, ${d.n}! Quero fazer um pedido:`, "",
    ...Object.entries(sacola).map(([n, q]) => `• ${q}x ${n} (${brl((itens.find((i) => i.nome === n)?.preco || 0) * q)})`),
    "", `Total: ${brl(total)}`, `${modo}${nomeCliente ? ` · Nome: ${nomeCliente}` : ""}`, obs ? `Obs.: ${obs}` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

  return (
    <div className="min-h-screen bg-[#0d0a08] text-[#f5ede3] [--ac:var(--acc)]" style={{ ["--acc" as string]: ac }}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
        {/* Capa */}
        <header className="relative h-[62vh] min-h-[420px] overflow-hidden lg:sticky lg:top-0 lg:h-screen">
          <motion.img src={src(d.img?.[0] || m.hero, 1600)} onError={semFoto} alt="" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a08] via-[#0d0a08]/55 to-black/20" />
          <div className="relative flex h-full flex-col justify-end p-6 pb-8 sm:p-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-black shadow-2xl" style={{ background: ac }}>
                {iniciais(d.n)}
              </div>
              <h1 className="font-serif text-[clamp(44px,7vw,84px)] leading-[0.95] tracking-[-0.02em]">{d.n}</h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#f5ede3]/75">{d.h || m.frase}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
                {d.r && d.rc ? (
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"><I.Star className="h-3.5 w-3.5 fill-current" style={{ color: ac }} /> {d.r.toFixed(1).replace(".", ",")} · {d.rc.toLocaleString("pt-BR")} avaliações</span>
                ) : null}
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aberto para pedidos</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">Entrega e retirada</span>
                {bairro && <span className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">{bairro}</span>}
              </div>
            </motion.div>
          </div>
        </header>

        {/* Cardápio */}
        <main className="relative pb-32">
          {destaques.length > 0 && (
            <section className="pt-8">
              <h2 className="px-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f5ede3]/55 sm:px-8">Os mais pedidos</h2>
              <div className="mt-4 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:scroll-px-8 sm:px-8 [scrollbar-width:none]">
                {destaques.map((i, k) => (
                  <motion.div key={i.nome} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.06 }}
                    className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/[0.07]">
                    <div className="relative h-[170px] overflow-hidden">
                      <img src={foto(i.foto!, 500, 400)} alt={i.nome} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium backdrop-blur">Mais pedido</span>
                    </div>
                    <div className="p-4">
                      <div className="font-medium leading-tight">{i.nome}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-semibold" style={{ color: ac }}>{brl(i.preco)}</span>
                        <Stepper q={sacola[i.nome] || 0} onAdd={() => add(i.nome)} onSub={() => add(i.nome, -1)} ac={ac} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <div ref={tabsRef} className="sticky top-0 z-30 mt-8 border-b border-white/[0.06] bg-[#0d0a08]/90 backdrop-blur-xl">
            <div className="flex gap-1 overflow-x-auto px-5 py-3 sm:px-7 [scrollbar-width:none]">
              {m.secoes.map((s) => (
                <button key={s.nome} onClick={() => document.getElementById("s-" + s.nome)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition"
                  style={aba === s.nome ? { background: ac, color: "#0d0a08" } : { color: "rgba(245,237,227,.65)" }}>
                  {s.nome}
                </button>
              ))}
            </div>
          </div>

          {m.secoes.map((s) => (
            <section key={s.nome} id={"s-" + s.nome} data-sec={s.nome} className="scroll-mt-20 px-6 pt-8 sm:px-8">
              <h3 className="font-serif text-[30px] leading-none">{s.nome}</h3>
              <div className="mt-4 divide-y divide-white/[0.06]">
                {s.itens.map((i) => <Linha key={i.nome} i={i} q={sacola[i.nome] || 0} onAdd={() => add(i.nome)} onSub={() => add(i.nome, -1)} ac={ac} />)}
              </div>
            </section>
          ))}

          {/* Informações */}
          <section className="mx-6 mt-12 overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/[0.07] sm:mx-8">
            {mapaEmbed(d.la, d.lo) && <iframe title="Mapa" src={mapaEmbed(d.la, d.lo)} className="h-48 w-full border-0 grayscale-[.3] invert-[.9] hue-rotate-180" loading="lazy" />}
            <div className="grid gap-4 p-6 text-[14px] sm:grid-cols-2">
              <Info icon={I.Clock3} t="Horário" v="Todos os dias · 11h às 23h" />
              <Info icon={I.Bike} t="Entrega" v="Média de 40 minutos" />
              {d.e && <Info icon={I.MapPin} t="Endereço" v={d.e} />}
              {d.t && <Info icon={I.Phone} t="Telefone" v={d.t} />}
              <Info icon={I.CreditCard} t="Pagamento" v="Pix, débito e crédito" />
            </div>
          </section>
          <p className="mt-6 px-8 text-center text-[11px] text-[#f5ede3]/35">Itens, fotos, preços e horários ilustrativos: no cardápio de vocês entram os produtos e as fotos reais.</p>
        </main>
      </div>

      {/* Barra da sacola */}
      <AnimatePresence>
        {qtd > 0 && (
          <motion.button initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} onClick={() => setAberta(true)}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[588px] items-center justify-between rounded-2xl px-5 py-4 font-semibold text-[#0d0a08] shadow-[0_20px_60px_-10px_rgba(0,0,0,.8)] lg:right-4 lg:left-auto lg:w-[588px]"
            style={{ background: ac }}>
            <span className="flex items-center gap-2"><I.ShoppingBag className="h-5 w-5" /> Ver sacola · {qtd} {qtd > 1 ? "itens" : "item"}</span>
            <span>{brl(total)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sacola */}
      <AnimatePresence>
        {aberta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={() => setAberta(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#17120e] p-6 ring-1 ring-white/10 sm:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-3xl">Sua sacola</h3>
                <button onClick={() => setAberta(false)} className="rounded-full p-2 text-white/60 hover:bg-white/10"><I.X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 divide-y divide-white/[0.07]">
                {Object.entries(sacola).map(([n, q]) => (
                  <div key={n} className="flex items-center justify-between gap-3 py-3">
                    <div><div className="font-medium">{n}</div><div className="text-sm text-white/50">{brl((itens.find((i) => i.nome === n)?.preco || 0) * q)}</div></div>
                    <Stepper q={q} onAdd={() => add(n)} onSub={() => add(n, -1)} ac={ac} />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
                {(["Entrega", "Retirada"] as const).map((x) => (
                  <button key={x} onClick={() => setModo(x)} className="rounded-xl py-2.5 text-sm font-medium transition" style={modo === x ? { background: ac, color: "#0d0a08" } : {}}>{x}</button>
                ))}
              </div>
              <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Seu nome" className="mt-3 h-12 w-full rounded-xl bg-white/5 px-4 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observações (ex.: sem cebola)" className="mt-2 h-12 w-full rounded-xl bg-white/5 px-4 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <div className="mt-5 flex items-baseline justify-between"><span className="text-white/60">Total</span><span className="text-2xl font-semibold">{brl(total)}</span></div>
              <a href={wa(d.w || d.bw, pedido)} target="_blank" rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-semibold text-[#06260f]">
                <I.MessageCircle className="h-5 w-5" /> Enviar pedido pelo WhatsApp
              </a>
              <p className="mt-3 text-center text-[11px] text-white/40">O pedido chega pronto no WhatsApp da loja, com itens e total.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stepper({ q, onAdd, onSub, ac }: { q: number; onAdd: () => void; onSub: () => void; ac: string }) {
  if (!q) {
    return (
      <button onClick={onAdd} aria-label="Adicionar" className="flex h-9 w-9 items-center justify-center rounded-full text-[#0d0a08] transition active:scale-90" style={{ background: ac }}>
        <I.Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
      <button onClick={onSub} aria-label="Tirar" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"><I.Minus className="h-3.5 w-3.5" /></button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">{q}</span>
      <button onClick={onAdd} aria-label="Adicionar" className="flex h-7 w-7 items-center justify-center rounded-full text-[#0d0a08]" style={{ background: ac }}><I.Plus className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
    </div>
  );
}

function Linha({ i, q, onAdd, onSub, ac }: { i: MenuItem; q: number; onAdd: () => void; onSub: () => void; ac: string }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{i.nome}</div>
        <div className="mt-0.5 text-[13px] leading-snug text-[#f5ede3]/55">{i.desc}</div>
        <div className="mt-2 font-semibold" style={{ color: ac }}>{brl(i.preco)}</div>
      </div>
      {i.foto && <img src={foto(i.foto, 200, 200)} alt={i.nome} className="h-[84px] w-[84px] shrink-0 rounded-2xl object-cover" loading="lazy" />}
      <Stepper q={q} onAdd={onAdd} onSub={onSub} ac={ac} />
    </div>
  );
}

function Info({ icon: Ic, t, v }: { icon: I.LucideIcon; t: string; v: string }) {
  return (
    <div className="flex gap-3">
      <Ic className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acc)]" />
      <div><div className="text-[12px] uppercase tracking-wider text-[#f5ede3]/45">{t}</div><div>{v}</div></div>
    </div>
  );
}

/* =================================== SITE =================================== */
function SiteCompleto({ d }: { d: ExampleData }) {
  const base: SiteNicho = sitePara(d.c, d.n);
  // fotos reais do lugar (escolhidas na abordagem) vêm primeiro; as do banco completam
  const reais = d.img || [];
  const s: SiteNicho = reais.length ? { ...base, hero: reais[0], galeria: [...reais.slice(1), ...base.galeria] } : base;
  const ac = d.a || s.cor;
  const escuro = s.tema === "escuro";
  const bairro = bairroDe(d.e);
  const zap = wa(d.w || d.bw, `Olá, ${d.n}! Vi o site e gostaria de ${s.cta.toLowerCase()}.`);
  const [faq, setFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const bg = escuro ? "bg-[#0b0b0c] text-white" : "bg-[#faf8f5] text-[#16140f]";
  const sub = escuro ? "text-white/60" : "text-[#16140f]/60";
  const card = escuro ? "bg-white/[0.04] ring-white/[0.08]" : "bg-white ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,.04)]";
  const titulo = d.h ? [d.h, ""] : s.titulo;
  const galeria = s.galeria.length >= 2 ? s.galeria : [];

  return (
    <div className={`min-h-screen ${bg}`} style={{ ["--acc" as string]: ac }}>
      {/* Navegação */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? (escuro ? "bg-[#0b0b0c]/80" : "bg-[#faf8f5]/85") + " py-3 backdrop-blur-xl" : "py-5"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <a href="#" className={`flex items-center gap-2.5 font-semibold tracking-tight ${scrolled && !escuro ? "text-[#16140f]" : "text-white"}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold text-black" style={{ background: ac }}>{iniciais(d.n)}</span>
            <span className="max-w-[46vw] truncate">{d.n}</span>
          </a>
          <div className={`hidden items-center gap-7 text-sm md:flex ${scrolled && !escuro ? "text-[#16140f]/70" : "text-white/75"}`}>
            <a href="#servicos" className="hover:opacity-100">Serviços</a>
            {galeria.length > 0 && <a href="#trabalhos">Trabalhos</a>}
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={zap} className="shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold text-black transition hover:brightness-110 sm:px-4 sm:text-sm" style={{ background: ac }}>{s.cta}</a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative flex min-h-[94vh] items-end overflow-hidden">
        <motion.img src={src(s.hero, 2000)} onError={semFoto} alt="" initial={{ scale: 1.15 }} animate={{ scale: 1.02 }} transition={{ duration: 6, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-40 text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] ring-1 ring-white/15 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ac }} />
              {d.c}{bairro ? ` · ${bairro}` : ""}
            </div>
            <h1 className="max-w-4xl text-[clamp(44px,7.5vw,96px)] font-semibold leading-[0.98] tracking-[-0.035em]">
              {titulo[0]} {titulo[1] && <span className="font-serif font-normal italic tracking-[-0.01em]" style={{ color: ac }}>{titulo[1]}</span>}
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75">{s.sub}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={zap} className="group flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-black transition hover:brightness-110" style={{ background: ac }}>
                <I.MessageCircle className="h-5 w-5" /> {s.cta}
                <I.ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a href="#servicos" className="rounded-full px-7 py-4 font-medium ring-1 ring-white/30 backdrop-blur transition hover:bg-white/10">Ver serviços</a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-white/70">
              {d.r && d.rc ? <span className="flex items-center gap-1.5"><I.Star className="h-4 w-4 fill-current" style={{ color: ac }} /> {d.r.toFixed(1).replace(".", ",")} no Google · {d.rc.toLocaleString("pt-BR")} avaliações</span> : null}
              <span className="flex items-center gap-1.5"><I.Zap className="h-4 w-4" style={{ color: ac }} /> Resposta rápida no WhatsApp</span>
              {bairro && <span className="flex items-center gap-1.5"><I.MapPin className="h-4 w-4" style={{ color: ac }} /> Atendimento no {bairro}</span>}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Faixa animada */}
      <div className="overflow-hidden py-4 text-black" style={{ background: ac }}>
        <div className="flex w-max animate-[marq_28s_linear_infinite] gap-10 whitespace-nowrap text-[15px] font-semibold uppercase tracking-[0.14em]">
          {[...s.servicos, ...s.servicos, ...s.servicos].map((x, k) => (
            <span key={k} className="flex items-center gap-10">{x.nome}<I.Asterisk className="h-4 w-4" /></span>
          ))}
        </div>
      </div>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl px-6 py-24">
        <Cabecalho kicker="Serviços" t="O que a gente" i="faz por você." ac={ac} sub={sub} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.servicos.map((x, k) => {
            const Ic = ICONES[x.icone] || I.Check;
            return (
              <motion.div key={x.nome} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (k % 3) * 0.08, duration: 0.6 }}
                className={`group rounded-3xl p-7 ring-1 transition duration-300 hover:-translate-y-1 ${card}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: ac + "22", color: ac }}><Ic className="h-6 w-6" /></div>
                <div className="mt-6 text-lg font-semibold">{x.nome}</div>
                <p className={`mt-1.5 text-[15px] leading-relaxed ${sub}`}>{x.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Por que */}
      <section className={escuro ? "bg-white/[0.02]" : "bg-[#f1ede6]"}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <img src={src(s.galeria[0] || s.hero, 1100, 1300)} onError={semFoto} alt="" className="aspect-[4/5] w-full rounded-[2rem] object-cover" loading="lazy" />
            <div className={`absolute -bottom-6 -right-2 rounded-3xl p-5 ring-1 sm:-right-6 ${escuro ? "bg-[#151517] ring-white/10" : "bg-white ring-black/5 shadow-xl"}`}>
              <div className="text-[13px] opacity-60">Atendimento</div>
              <div className="text-2xl font-semibold">Seg a Sáb</div>
            </div>
          </motion.div>
          <div>
            <Cabecalho kicker="Por que nós" t="Feito com" i="capricho." ac={ac} sub={sub} />
            <div className="mt-10 space-y-7">
              {s.porque.map(([t, x], k) => (
                <motion.div key={t} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.1 }} className="flex gap-5">
                  <span className="font-serif text-4xl italic leading-none" style={{ color: ac }}>0{k + 1}</span>
                  <div><div className="text-lg font-semibold">{t}</div><p className={`mt-1 ${sub}`}>{x}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Galeria */}
      {galeria.length > 0 && (
        <section id="trabalhos" className="mx-auto max-w-6xl px-6 py-24">
          <Cabecalho kicker={d.k === "portfolio" ? "Portfólio" : "Nosso espaço"} t={d.k === "portfolio" ? "Trabalhos" : "Um pouco"} i={d.k === "portfolio" ? "realizados." : "da casa."} ac={ac} sub={sub} />
          {/* 5 fotos: 1 grande + 4 pequenas (4 colunas); menos que isso: 1 grande + 2 (3 colunas) — sem buracos */}
          <div className={`mt-12 grid auto-rows-[200px] grid-cols-2 gap-4 ${[s.hero, ...galeria].length >= 5 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {[s.hero, ...galeria].slice(0, [s.hero, ...galeria].length >= 5 ? 5 : 3).map((g, k) => (
              <motion.div key={g} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.07 }}
                className={`group overflow-hidden rounded-3xl ${k === 0 ? "col-span-2 row-span-2" : ""}`}>
                <img src={src(g, k === 0 ? 1200 : 700, k === 0 ? 900 : 500)} onError={semFoto} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className={`grid gap-4 rounded-[2rem] p-8 ring-1 md:grid-cols-3 md:p-12 ${card}`}>
          {[["Chama no WhatsApp", "Conta o que você precisa, sem compromisso."], ["A gente combina", "Horário, orçamento e detalhes, tudo claro."], ["Pronto", "Atendimento caprichado, do jeito que você esperava."]].map(([t, x], k) => (
            <div key={t}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-black" style={{ background: ac }}>{k + 1}</div>
              <div className="mt-5 text-lg font-semibold">{t}</div>
              <p className={`mt-1 ${sub}`}>{x}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className={escuro ? "bg-white/[0.02]" : "bg-[#f1ede6]"}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Cabecalho kicker="Depoimentos" t="Quem vem," i="volta." ac={ac} sub={sub} />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {s.depoimentos.map(([t, a]) => (
              <figure key={a} className={`rounded-3xl p-7 ring-1 ${card}`}>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <I.Star key={k} className="h-4 w-4 fill-current" style={{ color: ac }} />)}</div>
                <blockquote className="mt-4 font-serif text-[22px] leading-snug">“{t}”</blockquote>
                <figcaption className={`mt-5 text-sm ${sub}`}>{a}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <Cabecalho kicker="Dúvidas" t="Perguntas" i="frequentes." ac={ac} sub={sub} centro />
        <div className="mt-10 space-y-3">
          {s.faq.map(([q, r], k) => (
            <div key={q} className={`overflow-hidden rounded-2xl ring-1 ${card}`}>
              <button onClick={() => setFaq(faq === k ? null : k)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium">
                {q}<I.Plus className={`h-5 w-5 shrink-0 transition ${faq === k ? "rotate-45" : ""}`} style={{ color: ac }} />
              </button>
              <AnimatePresence initial={false}>
                {faq === k && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={`px-6 pb-5 ${sub}`}>{r}</motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-black md:py-24" style={{ background: ac }}>
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_0%,#fff,transparent_45%)]" />
          <h2 className="relative text-[clamp(36px,6vw,72px)] font-semibold leading-none tracking-[-0.03em]">Vamos <span className="font-serif font-normal italic">conversar?</span></h2>
          <p className="relative mx-auto mt-4 max-w-md text-black/70">Chama no WhatsApp e a gente responde em poucos minutos.</p>
          <a href={zap} className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white transition hover:scale-[1.03]">
            <I.MessageCircle className="h-5 w-5" /> {s.cta}
          </a>
        </div>
      </section>

      {/* Contato */}
      <footer id="contato" className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2.5 text-xl font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-black" style={{ background: ac }}>{iniciais(d.n)}</span>{d.n}
          </div>
          <div className={`mt-6 space-y-3 ${sub}`}>
            {d.e && <div className="flex gap-3"><I.MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ac }} />{d.e}</div>}
            {d.t && <div className="flex gap-3"><I.Phone className="h-5 w-5 shrink-0" style={{ color: ac }} />{d.t}</div>}
            <div className="flex gap-3"><I.Clock3 className="h-5 w-5 shrink-0" style={{ color: ac }} />Segunda a sábado</div>
          </div>
          <p className={`mt-10 text-xs ${sub} opacity-70`}>Textos, fotos e depoimentos ilustrativos: no site de vocês entram os seus.</p>
        </div>
        {mapaEmbed(d.la, d.lo) ? (
          <iframe title="Mapa" src={mapaEmbed(d.la, d.lo)} className={`h-72 w-full rounded-3xl border-0 ${escuro ? "invert-[.9] hue-rotate-180" : ""}`} loading="lazy" />
        ) : (
          <img src={src(s.galeria[1] || s.hero, 900, 600)} onError={semFoto} alt="" className="h-72 w-full rounded-3xl object-cover" loading="lazy" />
        )}
      </footer>

      {zap && (
        <a href={zap} aria-label="WhatsApp" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_40px_-5px_rgba(37,211,102,.6)] transition hover:scale-110">
          <I.MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}

function Cabecalho({ kicker, t, i, ac, sub, centro }: { kicker: string; t: string; i: string; ac: string; sub: string; centro?: boolean }) {
  return (
    <div className={centro ? "text-center" : ""}>
      <div className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: ac }}>{kicker}</div>
      <h2 className="mt-3 text-[clamp(34px,4.6vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em]">
        {t} <span className="font-serif font-normal italic">{i}</span>
      </h2>
      <span className={`hidden ${sub}`} />
    </div>
  );
}

export function ExamplePage() {
  // link longo (#/exemplo?d=...) traz os dados no próprio link; link curto (#/p/slug) busca no GitHub
  const slug = useMemo(() => (location.hash.match(/^#\/p\/([a-z0-9-]+)/) || [])[1], []);
  const [d, setD] = useState<ExampleData | null>(() => (slug ? null : decodeExample(location.hash)));
  const [carregando, setCarregando] = useState(!!slug);
  useEffect(() => {
    if (!slug) return;
    carregarDemo(slug).then((x) => { setD(x); setCarregando(false); });
  }, [slug]);
  useEffect(() => {
    if (d) document.title = `${d.n}`;
    window.scrollTo(0, 0);
  }, [d]);
  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c]">
        <I.Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }
  if (!d) return <div className="flex min-h-screen items-center justify-center bg-white p-6 text-neutral-600">Link de exemplo inválido.</div>;
  const cardapio = d.k === "cardapio";
  const escuro = cardapio || sitePara(d.c, d.n).tema === "escuro";
  return (
    <div className="min-h-screen">
      <Faixa d={d} escuro={escuro} flutuante={!cardapio} />
      {cardapio ? <CardapioDigital d={d} /> : <SiteCompleto d={d} />}
    </div>
  );
}
