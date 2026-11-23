// Cardápio digital da demonstração: cada tipo de negócio tem cores, fonte e textura próprias.
import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import * as I from "lucide-react";
import { mapaEmbed, type ExampleData } from "@/engine/example";
import { cardapioPara, foto, src, type MenuItem } from "@/engine/niches";
import { bairroDe, brl, iniciais, semFoto, textoSobre, usarFonte, wa } from "./util";

type Tema = { bg: string; fg: string; card: string; line: string; mut: string; fonte: string; gf: string; caixaAlta: boolean; claro?: boolean; xadrez?: boolean };
const escuro = { card: "rgba(255,255,255,.045)", line: "rgba(255,255,255,.09)" };
const TEMAS: Record<string, Tema> = {
  burger: { bg: "#0E0B09", fg: "#F5EDE3", mut: "rgba(245,237,227,.64)", ...escuro, fonte: "'Anton', Impact, sans-serif", gf: "Anton", caixaAlta: true },
  bar: { bg: "#0C0B10", fg: "#F3EFE6", mut: "rgba(243,239,230,.64)", ...escuro, fonte: "'Bebas Neue', Impact, sans-serif", gf: "Bebas+Neue", caixaAlta: true },
  sushi: { bg: "#0B0A0A", fg: "#F2ECE4", mut: "rgba(242,236,228,.62)", ...escuro, fonte: "'Shippori Mincho B1', Georgia, serif", gf: "Shippori+Mincho+B1:wght@700;800", caixaAlta: false },
  restaurante: { bg: "#121010", fg: "#F4EEE6", mut: "rgba(244,238,230,.62)", ...escuro, fonte: "'Cormorant Garamond', Georgia, serif", gf: "Cormorant+Garamond:wght@600;700", caixaAlta: false },
  pizza: { bg: "#F6EFE3", fg: "#2A1810", card: "#FFFAF2", line: "rgba(42,24,16,.12)", mut: "rgba(42,24,16,.66)", fonte: "'DM Serif Display', Georgia, serif", gf: "DM+Serif+Display", caixaAlta: false, claro: true, xadrez: true },
  padaria: { bg: "#F7F0E6", fg: "#3B2A1C", card: "#FFFBF4", line: "rgba(59,42,28,.12)", mut: "rgba(59,42,28,.66)", fonte: "'Young Serif', Georgia, serif", gf: "Young+Serif", caixaAlta: false, claro: true },
  salgados: { bg: "#F7F0E6", fg: "#3B2A1C", card: "#FFFBF4", line: "rgba(59,42,28,.12)", mut: "rgba(59,42,28,.66)", fonte: "'Young Serif', Georgia, serif", gf: "Young+Serif", caixaAlta: false, claro: true },
  cafe: { bg: "#EFE6DA", fg: "#2B1D14", card: "#F8F2EA", line: "rgba(43,29,20,.12)", mut: "rgba(43,29,20,.66)", fonte: "'Gloock', Georgia, serif", gf: "Gloock", caixaAlta: false, claro: true },
  doces: { bg: "#FFF1F3", fg: "#4A1D2C", card: "#FFFFFF", line: "rgba(74,29,44,.1)", mut: "rgba(74,29,44,.64)", fonte: "'Bagel Fat One', 'Arial Rounded MT Bold', sans-serif", gf: "Bagel+Fat+One", caixaAlta: false, claro: true },
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function CardapioDigital({ d }: { d: ExampleData }) {
  const m = cardapioPara(d.c, d.n);
  const t = TEMAS[m.id] || TEMAS.restaurante;
  const ac = d.a || m.cor;
  const acfg = textoSobre(ac);
  const bairro = bairroDe(d.e);
  const [sacola, setSacola] = useState<Record<string, number>>({});
  const [aberta, setAberta] = useState(false);
  const [modo, setModo] = useState<"Entrega" | "Retirada">("Entrega");
  const [nomeCliente, setNomeCliente] = useState("");
  const [obs, setObs] = useState("");
  const [aba, setAba] = useState(m.secoes[0].nome);
  const [intro, setIntro] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => { usarFonte(t.gf); usarFonte("Archivo:wght@400;500;600;700"); }, [t.gf]);
  useEffect(() => { if (!intro) return; const x = setTimeout(() => setIntro(false), 900); return () => clearTimeout(x); }, [intro]);
  // destaca a aba da seção visível
  useEffect(() => {
    const o = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setAba(e.target.getAttribute("data-sec")!)), { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("[data-sec]").forEach((el) => o.observe(el));
    return () => o.disconnect();
  }, []);

  const itens = m.secoes.flatMap((s) => s.itens);
  const destaques = itens.filter((i) => i.destaque && i.foto).slice(0, 3);
  const qtd = Object.values(sacola).reduce((a, b) => a + b, 0);
  const preco = (n: string) => itens.find((i) => i.nome === n)?.preco || 0;
  const total = Object.entries(sacola).reduce((s, [n, q]) => s + preco(n) * q, 0);
  const add = (n: string, dlt = 1) => setSacola((s) => { const q = Math.max(0, (s[n] || 0) + dlt); const c = { ...s, [n]: q }; if (!q) delete c[n]; return c; });
  const pedido = [
    `Olá, ${d.n}! Quero fazer um pedido:`, "",
    ...Object.entries(sacola).map(([n, q]) => `• ${q}x ${n} (${brl(preco(n) * q)})`),
    "", `Total: ${brl(total)}`, `${modo}${nomeCliente ? ` · Nome: ${nomeCliente}` : ""}`, obs ? `Obs.: ${obs}` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  const zap = wa(d.w || d.bw, `Olá, ${d.n}! Vi o cardápio e quero fazer um pedido.`);
  const atraso = intro ? 0.95 : 0.15;
  const tamNome = d.n.length > 22 ? "clamp(40px,8.6vw,100px)" : d.n.length > 13 ? "clamp(48px,10.5vw,124px)" : "clamp(60px,14vw,164px)";
  const disp: CSSProperties = { fontFamily: "var(--disp)", textTransform: t.caixaAlta ? "uppercase" : "none", letterSpacing: t.caixaAlta ? ".01em" : "-.01em" };
  const vars = { "--bg": t.bg, "--fg": t.fg, "--card": t.card, "--line": t.line, "--mut": t.mut, "--ac": ac, "--acfg": acfg, "--disp": t.fonte, fontFamily: "'Archivo', system-ui, sans-serif" } as CSSProperties;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]" style={vars}>
        <style>{`@keyframes cd-marq{to{transform:translateX(-50%)}}@keyframes cd-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

        {/* Abertura: o selo se abre ao meio */}
        <AnimatePresence>
          {intro && (
            <motion.div key="intro" className="pointer-events-none fixed inset-0 z-[70]" exit={{ opacity: 1 }} transition={{ duration: 0.9 }}>
              {[0, 1].map((k) => (
                <motion.div key={k} className="absolute inset-x-0 h-1/2" style={{ top: k ? "50%" : 0, background: ac }}
                  exit={{ y: k ? "100%" : "-100%" }} transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }} />
              ))}
              <motion.div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-3xl"
                style={{ ...disp, color: ac, background: acfg }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                {iniciais(d.n)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capa */}
        <header className="relative h-[100svh] min-h-[560px] overflow-hidden bg-black text-white">
          <motion.img src={src(d.img?.[0] || m.hero, 1800)} onError={semFoto} alt="" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 2.8, ease: EASE, delay: atraso - 0.3 }}
            className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.1)_30%,rgba(0,0,0,.35)_55%,rgba(0,0,0,.88)_100%)]" />
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: atraso + 0.5, duration: 0.6 }}
            className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-6 sm:px-10">
            <span className="flex items-center gap-2.5 text-[13px] font-medium">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-[15px]" style={{ ...disp, background: ac, color: acfg }}>{iniciais(d.n)}</span>
              Cardápio digital
            </span>
            <span className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: "cd-pulse 1.8s infinite" }} /> Aberto para pedidos
            </span>
          </motion.div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-10 sm:px-10 sm:pb-14">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: atraso + 0.1, duration: 0.6 }}
              className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/85">
              <span className="h-px w-8" style={{ background: ac }} />{[m.id === "restaurante" ? d.c : null, bairro].filter(Boolean).join(" · ") || d.c}
            </motion.p>
            <h1 aria-label={d.n} className="mt-3 max-w-[14ch] leading-[0.9] [text-wrap:balance]" style={{ ...disp, fontSize: tamNome }}>
              {d.n.split(" ").map((w, wi, arr) => (
                <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
                  {w.split("").map((ch, ci) => (
                    <motion.span key={ci} className="inline-block" initial={{ y: "0.5em", opacity: 0, filter: "blur(8px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      transition={{ delay: atraso + 0.15 + (arr.slice(0, wi).join("").length + ci) * 0.03, duration: 0.7, ease: EASE }}>{ch}</motion.span>
                  ))}
                  {wi < arr.length - 1 && <span className="inline-block w-[0.22em]" />}
                </span>
              ))}
            </h1>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: atraso + 0.75, duration: 0.7, ease: EASE }}>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">{d.h || m.frase}</p>
              {d.r && d.rc ? (
                <p className="mt-3 flex items-center gap-1.5 text-[13px] text-white/80">
                  <span className="flex">{[0, 1, 2, 3, 4].map((k) => <I.Star key={k} className="h-3.5 w-3.5" style={{ color: ac, fill: k < Math.round(d.r!) ? ac : "transparent" }} />)}</span>
                  {d.r.toFixed(1).replace(".", ",")} · {d.rc.toLocaleString("pt-BR")} avaliações no Google
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#menu" className="flex h-12 items-center gap-2 rounded-full px-6 text-[14px] font-semibold transition hover:brightness-110" style={{ background: ac, color: acfg }}>
                  Ver cardápio <I.ArrowDown className="h-4 w-4" />
                </a>
                {zap && (
                  <a href={zap} target="_blank" rel="noreferrer" className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 text-[14px] font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20">
                    <I.MessageCircle className="h-4 w-4" /> Pedir no WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </header>

        {/* Faixa com os pratos da casa */}
        <div className="overflow-hidden py-4" style={{ background: ac, color: acfg }} aria-hidden>
          <div className="flex w-max gap-10 whitespace-nowrap text-[clamp(22px,3vw,34px)] leading-none" style={{ ...disp, animation: "cd-marq 32s linear infinite" }}>
            {[0, 1].map((k) => <span key={k} className="flex gap-10">{itens.slice(0, 8).map((i) => <span key={i.nome} className="flex items-center gap-10">{i.nome}<span className="opacity-50">✦</span></span>)}</span>)}
          </div>
        </div>
        {t.xadrez && <div aria-hidden className="h-3" style={{ background: `repeating-conic-gradient(${ac} 0 25%, #fff 0 50%) 0 0 / 24px 24px` }} />}

        <main id="menu" className="mx-auto max-w-[1180px] px-5 pb-36 sm:px-10">
          {/* Os mais pedidos */}
          {destaques.length > 0 && (
            <section className="pt-16 sm:pt-24">
              <Titulo disp={disp} kicker="Os favoritos da casa" t="Os mais pedidos" />
              <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
                {destaques.map((i, k) => (
                  <motion.article key={i.nome} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: k * 0.1, duration: 0.8, ease: EASE }}
                    className="group relative w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-black text-white sm:w-auto sm:max-w-none">
                    <div className="aspect-[4/5] overflow-hidden">
                      <motion.img src={foto(i.foto!, 700, 875)} alt={i.nome} loading="lazy" initial={{ scale: 1.18 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE }}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />
                    <span className="absolute left-5 top-4 text-[56px] leading-none text-white/90" style={disp}>{String(k + 1).padStart(2, "0")}</span>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="text-[26px] leading-[1.05]" style={disp}>{i.nome}</h3>
                      <p className="mt-1.5 line-clamp-2 text-[13px] text-white/70">{i.desc}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[17px] font-semibold">{brl(i.preco)}</span>
                        <Stepper q={sacola[i.nome] || 0} onAdd={() => add(i.nome)} onSub={() => add(i.nome, -1)} />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {/* Abas */}
          <div className="sticky top-0 z-30 -mx-5 mt-16 border-b border-[var(--line)] bg-[var(--bg)]/90 px-5 backdrop-blur-xl sm:mx-0 sm:px-0">
            <div className="flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
              {m.secoes.map((s) => (
                <button key={s.nome} onClick={() => document.getElementById("s-" + s.nome)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
                  style={{ color: aba === s.nome ? acfg : "var(--mut)" }}>
                  {aba === s.nome && <motion.span layoutId="cd-aba" className="absolute inset-0 rounded-full" style={{ background: ac }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{s.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {m.secoes.map((s) => (
            <section key={s.nome} id={"s-" + s.nome} data-sec={s.nome} className="scroll-mt-20 pt-12">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
                <motion.h2 initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
                  className="text-[clamp(36px,5.4vw,64px)] leading-[0.95]" style={disp}>{s.nome}</motion.h2>
                <span className="shrink-0 pb-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--mut)]">{String(s.itens.length).padStart(2, "0")} itens</span>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {s.itens.map((i, k) => <Linha key={i.nome} i={i} k={k} q={sacola[i.nome] || 0} onAdd={() => add(i.nome)} onSub={() => add(i.nome, -1)} disp={disp} />)}
              </div>
            </section>
          ))}

          {/* Fotos reais do lugar */}
          {d.img && d.img.length > 1 && (
            <section className="pt-20">
              <Titulo disp={disp} kicker="Por dentro" t="Nosso espaço" />
              <div className="-mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
                {d.img.slice(1).map((u, k) => (
                  <motion.img key={u} src={u} onError={semFoto} alt="" loading="lazy" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.08, duration: 0.7, ease: EASE }}
                    className="h-72 w-[72vw] max-w-[420px] shrink-0 snap-start rounded-[24px] object-cover" />
                ))}
              </div>
            </section>
          )}

          {/* Informações */}
          <section className="pt-20">
            <Titulo disp={disp} kicker="Peça do seu jeito" t="Entrega, retirada e endereço" />
            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info icon={I.Clock3} t="Horário" v="Todos os dias · 11h às 23h" />
                <Info icon={I.Bike} t="Entrega" v="Média de 40 minutos" />
                <Info icon={I.CreditCard} t="Pagamento" v="Pix, débito e crédito" />
                {d.t ? <Info icon={I.Phone} t="Telefone" v={d.t} /> : <Info icon={I.ShoppingBag} t="Retirada" v="Pronto em 20 minutos" />}
                {d.e && <div className="sm:col-span-2"><Info icon={I.MapPin} t="Endereço" v={d.e} /></div>}
              </div>
              {mapaEmbed(d.la, d.lo) && (
                <iframe title="Mapa" src={mapaEmbed(d.la, d.lo)} loading="lazy"
                  className={`h-72 w-full rounded-[24px] border-0 lg:h-full ${t.claro ? "grayscale-[.2]" : "invert-[.9] hue-rotate-180 grayscale-[.3]"}`} />
              )}
            </div>
            <p className="mt-10 text-center text-[11px] text-[var(--mut)]">Itens, fotos, preços e horários ilustrativos: no cardápio de vocês entram os produtos e as fotos reais.</p>
          </section>
        </main>

        {/* Barra da sacola */}
        <AnimatePresence>
          {qtd > 0 && (
            <motion.button initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: "spring", damping: 24, stiffness: 280 }} onClick={() => setAberta(true)}
              className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[560px] items-center justify-between rounded-2xl px-5 py-4 font-semibold shadow-[0_20px_50px_-12px_rgba(0,0,0,.6)]"
              style={{ background: ac, color: acfg }}>
              <span className="flex items-center gap-3">
                <motion.span key={qtd} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}
                  className="flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[13px]" style={{ background: acfg, color: ac }}>{qtd}</motion.span>
                Ver sacola
              </span>
              <span>{brl(total)}</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Sacola */}
        <AnimatePresence>
          {aberta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setAberta(false)}>
              <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-[var(--bg)] p-6 ring-1 ring-[var(--line)] sm:rounded-[28px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl" style={disp}>Sua sacola</h3>
                  <button onClick={() => setAberta(false)} aria-label="Fechar" className="rounded-full p-2 text-[var(--mut)] hover:bg-[var(--card)]"><I.X className="h-5 w-5" /></button>
                </div>
                <div className="mt-4 divide-y divide-[var(--line)]">
                  {Object.entries(sacola).map(([n, q]) => (
                    <div key={n} className="flex items-center justify-between gap-3 py-3">
                      <div><div className="font-medium">{n}</div><div className="text-sm text-[var(--mut)]">{brl(preco(n) * q)}</div></div>
                      <Stepper q={q} onAdd={() => add(n)} onSub={() => add(n, -1)} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--card)] p-1 ring-1 ring-[var(--line)]">
                  {(["Entrega", "Retirada"] as const).map((x) => (
                    <button key={x} onClick={() => setModo(x)} className="rounded-xl py-2.5 text-sm font-semibold transition" style={modo === x ? { background: ac, color: acfg } : { color: "var(--mut)" }}>{x}</button>
                  ))}
                </div>
                <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Seu nome" className="mt-3 h-12 w-full rounded-xl bg-[var(--card)] px-4 text-sm outline-none ring-1 ring-[var(--line)] placeholder:text-[var(--mut)] focus:ring-[var(--ac)]" />
                <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observações (ex.: sem cebola)" className="mt-2 h-12 w-full rounded-xl bg-[var(--card)] px-4 text-sm outline-none ring-1 ring-[var(--line)] placeholder:text-[var(--mut)] focus:ring-[var(--ac)]" />
                <div className="mt-5 flex items-baseline justify-between"><span className="text-[var(--mut)]">Total</span><span className="text-2xl font-semibold">{brl(total)}</span></div>
                <a href={wa(d.w || d.bw, pedido)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-semibold text-[#06260f]">
                  <I.MessageCircle className="h-5 w-5" /> Enviar pedido pelo WhatsApp
                </a>
                <p className="mt-3 text-center text-[11px] text-[var(--mut)]">O pedido chega pronto no WhatsApp da loja, com itens e total.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function Titulo({ kicker, t, disp }: { kicker: string; t: string; disp: CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--ac)" }}>{kicker}</p>
      <h2 className="mt-2 text-[clamp(38px,5.8vw,72px)] leading-[0.95]" style={disp}>{t}</h2>
    </motion.div>
  );
}

function Stepper({ q, onAdd, onSub }: { q: number; onAdd: () => void; onSub: () => void }) {
  const ac = { background: "var(--ac)", color: "var(--acfg)" };
  if (!q) {
    return (
      <motion.button whileTap={{ scale: 0.85 }} onClick={onAdd} aria-label="Adicionar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={ac}>
        <I.Plus className="h-4 w-4" strokeWidth={2.6} />
      </motion.button>
    );
  }
  return (
    <motion.div initial={{ width: 40 }} animate={{ width: "auto" }} className="flex shrink-0 items-center gap-1 overflow-hidden rounded-full p-1" style={ac}>
      <button onClick={onSub} aria-label="Tirar" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/10"><I.Minus className="h-3.5 w-3.5" strokeWidth={2.6} /></button>
      <motion.span key={q} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-5 text-center text-sm font-bold tabular-nums">{q}</motion.span>
      <button onClick={onAdd} aria-label="Adicionar" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/10"><I.Plus className="h-3.5 w-3.5" strokeWidth={2.6} /></button>
    </motion.div>
  );
}

function Linha({ i, k, q, onAdd, onSub, disp }: { i: MenuItem; k: number; q: number; onAdd: () => void; onSub: () => void; disp: CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ delay: (k % 4) * 0.06, duration: 0.6, ease: EASE }}
      className={`flex items-center gap-4 rounded-[22px] bg-[var(--card)] p-3 ring-1 transition-shadow ${q ? "ring-[var(--ac)]" : "ring-[var(--line)]"}`}>
      {i.foto ? (
        <img src={foto(i.foto, 220, 220)} alt={i.nome} loading="lazy" className="h-[92px] w-[92px] shrink-0 rounded-[16px] object-cover" />
      ) : (
        <span className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-[16px] text-[34px]" style={{ ...disp, background: "color-mix(in srgb, var(--ac) 14%, transparent)", color: "var(--ac)" }}>{i.nome[0]}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-tight">{i.nome}</div>
        <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--mut)]">{i.desc}</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold" style={{ color: "var(--ac)" }}>{brl(i.preco)}</span>
          <Stepper q={q} onAdd={onAdd} onSub={onSub} />
        </div>
      </div>
    </motion.div>
  );
}

function Info({ icon: Ic, t, v }: { icon: I.LucideIcon; t: string; v: string }) {
  return (
    <div className="flex h-full gap-3 rounded-[20px] bg-[var(--card)] p-5 ring-1 ring-[var(--line)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--ac) 16%, transparent)", color: "var(--ac)" }}><Ic className="h-[18px] w-[18px]" /></span>
      <div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mut)]">{t}</div><div className="mt-1 text-[15px]">{v}</div></div>
    </div>
  );
}
