import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Loader2, MapPin, Search } from "lucide-react";
import { cn, type Fonte, type SearchResult } from "@/lib";
import { Button, Input } from "./ui";

export const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4";

/** Vídeo fixo atrás do site inteiro, com uma camada escura para o texto ficar legível. */
export function VideoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <video className="h-full w-full object-cover" src={VIDEO_URL} autoPlay muted loop playsInline />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/70" />
    </div>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <circle cx="14" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M19.8 19.8 26 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  onSearch: (p: { fonte: Fonte; lugar: string; termo: string; bairros: string[] }) => void;
  loading: boolean;
  result: SearchResult | null;
  hasGoogleKey: boolean;
  savedCount: number;
  onOpenMessage: () => void;
};

const FONTES: { id: Fonte; label: string }[] = [
  { id: "osm", label: "Grátis" },
  { id: "google", label: "Google" },
  { id: "demo", label: "Demo" },
];

export function Hero({ onSearch, loading, result, hasGoogleKey, savedCount, onOpenMessage }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  const [fonte, setFonte] = useState<Fonte>("osm");
  const [lugar, setLugar] = useState("");
  const [termo, setTermo] = useState("");
  const [bairros, setBairros] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) return setElapsed(0);
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const precisaTermo = fonte !== "osm";
  const podeBuscar = lugar.trim() && (!precisaTermo || termo.trim()) && !loading;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeBuscar) return;
    onSearch({
      fonte,
      lugar: lugar.trim(),
      termo: termo.trim(),
      bairros: bairros.split(/[\n,]/).map((b) => b.trim()).filter(Boolean),
    });
  }

  const top = result?.ranking.slice(0, 6) ?? [];

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-40 flex items-center justify-between px-8 md:px-28 py-4">
        <div className="flex items-center gap-12 md:gap-20">
          <a href="#" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold tracking-tight">C-Search</span>
          </a>
          <div className="hidden md:flex items-center gap-1 text-sm">
            <a href="#" className="rounded-lg px-3 py-2 text-foreground">Buscar</a>
            <a href="#resultados" className="flex items-center gap-1 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
              Resultados <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#leads" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Meus leads</a>
            <button onClick={onOpenMessage} className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer">
              Mensagem
            </button>
          </div>
        </div>
        <a href="#leads" className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90">
          Meus leads{savedCount ? ` · ${savedCount}` : ""}
        </a>
      </nav>

      {/* Conteúdo */}
      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-30 mt-16 md:mt-20 flex flex-col items-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="liquid-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2"
        >
          <span className="rounded-md bg-foreground px-2 py-0.5 text-sm font-medium text-background">Novo</span>
          <span className="text-sm font-medium text-muted-foreground">Ranking das melhores categorias da sua cidade</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-3 text-5xl md:text-7xl tracking-[-2px] font-medium leading-tight md:leading-[1.15]"
        >
          Seus próximos clientes.
          <br />
          Em um só <span className="font-serif italic font-normal">mapa.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-lg font-normal leading-6 opacity-90"
          style={{ color: "hsl(var(--hero-subtitle))" }}
        >
          O C-Search encontra negócios sem site, sem cardápio digital
          <br className="hidden sm:block" /> e com poucas avaliações, prontos para ouvir sua proposta.
        </motion.p>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="liquid-glass w-full max-w-2xl rounded-2xl bg-black/30 p-2"
        >
          <div className="mb-2 flex items-center gap-1 px-1 pt-1">
            {FONTES.filter((f) => f.id !== "google" || hasGoogleKey).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFonte(f.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                  fonte === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto pr-2 text-xs text-neutral-500">
              {fonte === "osm" && "OpenStreetMap · sem avaliações"}
              {fonte === "google" && (hasGoogleKey ? "Google Places · pago" : "sem chave no .env")}
              {fonte === "demo" && "dados falsos para testar"}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {precisaTermo && (
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Tipo: barbearia, pizzaria…"
                className="h-12 sm:max-w-[40%] bg-black/65"
              />
            )}
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Cidade ou bairro, ex.: Campinas SP"
                className="h-12 bg-black/65 pl-9"
              />
            </div>
            <motion.button
              type="submit"
              disabled={!podeBuscar}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-base font-medium text-background disabled:opacity-40 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Buscando…" : "Buscar"}
            </motion.button>
          </div>
          {precisaTermo && (
            <Input
              value={bairros}
              onChange={(e) => setBairros(e.target.value)}
              placeholder="Bairros (opcional, separados por vírgula): Centro, Cambuí, Taquaral"
              className="mt-2 bg-black/65"
            />
          )}
        </motion.form>

        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            {fonte === "osm"
              ? `Varrendo todos os comércios da região… ${elapsed}s. O servidor grátis pode levar de 2 a 10 min; depois a cidade fica salva por 24h.`
              : `Buscando… ${elapsed}s`}
          </p>
        )}
      </motion.div>

      {/* Vídeo + painel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative mt-12 w-screen"
        style={{ marginLeft: "calc(-50vw + 50%)", aspectRatio: "16 / 9", maxHeight: "80vh" }}
      >
        <motion.div
          style={{ y: panelY, x: "-50%" }}
          className="absolute left-1/2 top-[12%] z-20 w-[90%] max-w-5xl rounded-2xl"
        >
          <PreviewPanel result={result} top={top} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function PreviewPanel({ result, top }: { result: SearchResult | null; top: SearchResult["ranking"] }) {
  const rows = result
    ? top
    : [
        { categoria: "Restaurante", leads_bons: 64, total: 352, pct_sem_site: 87, oferta: "Cardápio digital" },
        { categoria: "Clínica / consultório", leads_bons: 38, total: 185, pct_sem_site: 62, oferta: "Site profissional" },
        { categoria: "Oficina mecânica", leads_bons: 19, total: 82, pct_sem_site: 76, oferta: "Site profissional" },
        { categoria: "Padaria", leads_bons: 17, total: 89, pct_sem_site: 90, oferta: "Cardápio digital" },
        { categoria: "Barbearia / salão", leads_bons: 17, total: 60, pct_sem_site: 90, oferta: "Site profissional" },
      ];
  const max = Math.max(1, ...rows.map((r) => r.leads_bons));
  return (
    <div className="glass-panel rounded-2xl p-5 md:p-7 ring-1 ring-white/10 shadow-2xl" style={{ mixBlendMode: result ? "normal" : "luminosity" }}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground">{result ? "Melhores categorias em" : "Exemplo · Campinas SP"}</div>
          <div className="text-lg font-semibold tracking-tight">{result ? result.area.split(",")[0] : "Onde estão os clientes"}</div>
        </div>
        {result && (
          <a href="#resultados" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todos os {result.leads.length} →
          </a>
        )}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.categoria} className="grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[200px_1fr_auto_auto]">
            <div className="truncate text-sm">{r.categoria}</div>
            <div className="hidden h-2 overflow-hidden rounded-full bg-white/10 md:block">
              <div className="h-full rounded-full bg-white/80" style={{ width: `${(r.leads_bons / max) * 100}%` }} />
            </div>
            <div className="text-sm tabular-nums">
              <span className="font-semibold">{r.leads_bons}</span>
              <span className="text-muted-foreground"> / {r.total}</span>
            </div>
            <div className="hidden w-36 text-right text-xs text-muted-foreground md:block">{r.oferta}</div>
          </div>
        ))}
        {result && rows.length === 0 && <div className="text-sm text-muted-foreground">Nenhum comércio encontrado nessa área.</div>}
      </div>
    </div>
  );
}
