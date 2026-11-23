// Página que o dono do negócio abre pelo link: cardápio digital interativo ou site completo.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as I from "lucide-react";
import { decodeExample, mapaEmbed, type ExampleData } from "@/engine/example";
import { carregarDemo } from "@/engine/shortlink";
import { sitePara, src, type SiteNicho } from "@/engine/niches";
import { CardapioDigital } from "./demos/Cardapio";
import { bairroDe, iniciais, semFoto, wa } from "./demos/util";

const ICONES: Record<string, I.LucideIcon> = {
  scissors: I.Scissors, sparkles: I.Sparkles, crown: I.Crown, palette: I.Palette, eye: I.Eye, droplet: I.Droplet,
  hand: I.Hand, flower: I.Flower2, clipboard: I.ClipboardCheck, disc: I.Disc3, cpu: I.Cpu, wind: I.Wind, zap: I.Zap,
  sun: I.Sun, smile: I.Smile, shield: I.ShieldCheck, heart: I.HeartPulse, stethoscope: I.Stethoscope, calendar: I.CalendarCheck,
  phone: I.Smartphone, dumbbell: I.Dumbbell, users: I.Users, target: I.Target, truck: I.Truck, bag: I.ShoppingBag,
  home: I.Home, layers: I.Layers, ruler: I.Ruler, pen: I.PenTool, moon: I.Moon, clock: I.Clock3, tag: I.Tag, card: I.CreditCard,
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
