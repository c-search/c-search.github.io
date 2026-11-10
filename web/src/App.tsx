import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, ExternalLink, MessageCircle, X } from "lucide-react";
import { api, STATUS, DEFAULT_MSG, fillTemplate, storageGet, storageSet, type Fonte, type Lead, type SavedLead, type SearchResult } from "@/lib";
import { Hero, VideoBackground } from "./components/Hero";
import { contestarVerificacao, precisaConfirmar, salvarVerificacao, verificarLead } from "./engine/verify";
import { rankCategories } from "./engine/scoring";
import { marcarRetorno, refreshLeads } from "./engine/store";
import { exampleKind, exampleLink, type ExampleData } from "./engine/example";
import { CORES_SUGERIDAS } from "./engine/niches";
import { mensagemExemplo } from "./engine/replies";
import { exportBackup, importBackup } from "./engine/backup";
import { Results } from "./components/Results";
import { SavedLeads } from "./components/SavedLeads";
import { HowItWorks } from "./components/HowItWorks";
import { ExamplePage } from "./components/ExamplePage";
import { OutreachModal } from "./components/OutreachModal";
import { Creditos } from "./components/Creditos";
import { Button } from "./components/ui";

export default function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const h = () => setHash(location.hash);
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  if (hash.startsWith("#/exemplo") || hash.startsWith("#/p/")) return <ExamplePage />;
  return <Main />;
}

function Main() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [saved, setSaved] = useState<SavedLead[]>([]);
  const statuses = STATUS;
  const [hasKey, setHasKey] = useState(false);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [template, setTemplate] = useState(() => storageGet("csearch_template", DEFAULT_MSG));
  const [msgOpen, setMsgOpen] = useState(false);
  const [serperKey, setSerperKey] = useState(() => storageGet("csearch_serper_key", ""));
  const [githubToken, setGithubToken] = useState(() => storageGet("csearch_github_token", ""));
  const [meuNome, setMeuNome] = useState(() => storageGet("csearch_meu_nome", ""));
  const [meuWhats, setMeuWhats] = useState(() => storageGet("csearch_meu_whats", ""));
  const [autoVerify, setAutoVerify] = useState(() => storageGet("csearch_auto_verify", "0") === "1");
  const [verifying, setVerifying] = useState<{ done: number; total: number } | null>(null);
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [paginas, setPaginas] = useState(() => Number(storageGet("csearch_paginas", "3")) || 3);
  const [fonteAtual, setFonteAtual] = useState<Fonte>("gmaps");
  const [exemplo, setExemploRaw] = useState<Lead | null>(null);
  const [exCor, setExCor] = useState<string | undefined>();
  const [exFrase, setExFrase] = useState("");
  const [exTipo, setExTipo] = useState<ExampleData["k"] | undefined>();
  const setExemplo = (l: Lead | null) => { setExemploRaw(l); setExCor(undefined); setExFrase(""); setExTipo(undefined); };

  const notify = useCallback((msg: string, erro = false) => {
    setToast({ msg, erro });
    setTimeout(() => setToast(null), erro ? 7000 : 3500);
  }, []);

  const loadSaved = useCallback(() => api.leads().then(setSaved).catch(() => {}), []);

  useEffect(() => {
    api.config().then((c) => setHasKey(c.has_google_key));
    loadSaved();
  }, [loadSaved]);

  async function verify(leads: Lead[], regiaoOverride?: string) {
    if (!serperKey.trim()) {
      notify("Coloque sua chave do Serper em Configurações para verificar no Google.", true);
      setMsgOpen(true);
      return;
    }
    const regiao = regiaoOverride ?? result?.area.split(",")[0] ?? "";
    if (!leads.length) return;
    const fila = [...leads];
    const prontos: Lead[] = [];
    let erro = "";
    setVerifying({ done: 0, total: leads.length });
    setVerifyingIds(new Set(leads.map((l) => l.place_id)));
    const worker = async () => {
      while (fila.length && !erro) {
        const l = fila.shift()!;
        try {
          const v = await verificarLead(l, regiao, serperKey.trim());
          salvarVerificacao(v);
          prontos.push(v);
          setResult((r) => (r ? { ...r, leads: r.leads.map((x) => (x.place_id === v.place_id ? v : x)) } : r));
        } catch (e) {
          erro = (e as Error).message;
        }
        setVerifying((s) => (s ? { ...s, done: s.done + 1 } : s));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setVerifying(null);
    setVerifyingIds(new Set());
    setResult((r) => (r ? { ...r, ranking: rankCategories(r.leads) } : r));
    refreshLeads(prontos);
    loadSaved();
    if (erro) return notify(erro, true);
    const site = prontos.filter((l) => l.verificacao?.status === "site").length;
    const social = prontos.filter((l) => l.verificacao?.status === "social").length;
    const sem = prontos.filter((l) => l.verificacao?.status === "sem_site").length;
    notify(`${prontos.length} verificados: ${sem} sem site, ${social} só rede social/delivery, ${site} já têm site`);
  }

  async function search(p: { fonte: Fonte; lugar: string; termo: string; bairros: string[] }) {
    setLoading(true);
    setProgress("");
    try {
      if (p.fonte === "gmaps" && !serperKey.trim()) {
        setMsgOpen(true);
        throw new Error("A busca no Google Maps usa a sua chave do Serper. Cole a chave em Configurações.");
      }
      const r = p.fonte === "gmaps"
        ? await api.searchGmaps(p.termo, p.lugar, p.bairros, serperKey.trim(), paginas, setProgress)
        : p.fonte === "osm"
        ? await api.searchOsm(p.lugar, p.bairros, setProgress)
        : await api.searchTerm({ termo: p.termo, cidade: p.lugar, bairros: p.bairros, fonte: p.fonte });
      setFonteAtual(p.fonte);
      setResult({ ...r, busca: `${p.termo || "comércios"} - ${p.lugar}${p.bairros.length ? " (" + p.bairros.join(", ") + ")" : ""}` });
      setTimeout(() => document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }), 300);
      // verificação automática dos 10 melhores (sem site próprio e ainda não verificados)
      if (autoVerify && serperKey.trim()) {
        const top = r.leads
          .filter((l) => precisaConfirmar(l) && l.tipo_site !== "Site próprio" && !l.rede)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        if (top.length) verify(top, r.area.split(",")[0]);
      }
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  async function save(leads: Lead[], busca: string) {
    try {
      const r = await api.save(busca, leads);
      notify(r.novos ? `${r.novos} lead${r.novos > 1 ? "s" : ""} salvo${r.novos > 1 ? "s" : ""} em Meus leads` : "Já estavam salvos");
      loadSaved();
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function update(id: string, status: string, anotacoes: string, extra: Partial<SavedLead> = {}) {
    setSaved((s) => s.map((l) => (l.place_id === id ? { ...l, status, anotacoes, ...extra } : l)));
    try {
      await api.update(id, status, anotacoes, extra);
      loadSaved();
    } catch (e) {
      notify((e as Error).message, true);
      loadSaved();
    }
  }

  /** Clicou em WhatsApp: salva (se ainda não estiver) e marca como Contatado. */
  async function contact(l: Lead, busca: string) {
    const ja = saved.find((s) => s.place_id === l.place_id);
    if (!ja) await api.save(busca, [l]);
    if (!ja || ja.status === "Novo") await api.update(l.place_id, "Contatado", ja?.anotacoes || "");
    loadSaved();
  }

  async function discard(l: Lead, busca: string) {
    const ja = saved.find((s) => s.place_id === l.place_id);
    if (!ja) await api.save(busca, [l]);
    await api.update(l.place_id, "Descartado", ja?.anotacoes || "");
    loadSaved();
    notify(`${l.nome} descartado`);
  }

  async function deleteAll() {
    await api.deleteAll();
    loadSaved();
    notify("Leads apagados");
  }

  function copy(texto: string) {
    navigator.clipboard?.writeText(texto).then(() => notify("Copiado! Cole no WhatsApp.")).catch(() => notify("Não consegui copiar", true));
  }

  async function restore(f: File) {
    try {
      const r = importBackup(await f.text());
      loadSaved();
      setTemplate(storageGet("csearch_template", DEFAULT_MSG));
      setMeuNome(storageGet("csearch_meu_nome", ""));
      setMeuWhats(storageGet("csearch_meu_whats", ""));
      notify(`Backup restaurado: ${r.leads} leads e ${r.verificacoes} verificações`);
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  const savedIds = new Set(saved.map((l) => l.place_id));
  const linkExemplo = exemplo ? exampleLink(exemplo, { meuNome, meuWhats, cor: exCor, frase: exFrase, tipo: exTipo }) : "";
  const tipoPadrao = exemplo ? exampleKind(exemplo) : "site";

  return (
    <main className="relative min-h-screen text-foreground">
      <VideoBackground />
      <div className="relative z-10">
      <Hero onSearch={search} loading={loading} progress={progress} result={result} hasGoogleKey={hasKey} hasSerper={!!serperKey.trim()} serperKey={serperKey.trim()} paginas={paginas} onPaginas={(n) => { setPaginas(n); storageSet("csearch_paginas", String(n)); }} savedCount={saved.length} onOpenMessage={() => setMsgOpen(true)} />
      {result && <Results key={result.busca + result.area} result={result} fonte={fonteAtual} template={template} savedIds={savedIds} onSave={save}
        onVerify={(ls) => verify(ls)} verifying={verifying} verifyingIds={verifyingIds}
        onExample={setExemplo} onContact={contact} onDiscard={discard} onContestar={(l) => {
          const c = contestarVerificacao(l);
          salvarVerificacao(c);
          setResult((r) => (r ? { ...r, leads: r.leads.map((x) => (x.place_id === c.place_id ? c : x)) } : r));
          refreshLeads([c]);
          loadSaved();
          notify(`${l.nome}: corrigido para "sem site"`);
        }} />}
      <SavedLeads leads={saved} statuses={statuses} template={template} onUpdate={update} onDeleteAll={deleteAll}
        onExample={setExemplo} onFollowUp={(l) => { marcarRetorno(l.place_id); loadSaved(); }} onCopy={copy}
        onBackup={() => { exportBackup(); notify("Backup baixado. Guarde o arquivo num lugar seguro."); }} onRestore={restore} />
      <HowItWorks />
      <footer className="px-8 md:px-28 py-10 text-sm text-muted-foreground">
        C-Search · dados de OpenStreetMap (© colaboradores OSM){hasKey && " e Google Places"}
      </footer>
      </div>

      {/* Abordagem: mensagem + demonstração (fecha na hora, sem esperar animação) */}
      <>
        {exemplo && (
          <OutreachModal key={exemplo.place_id} lead={exemplo} meuNome={meuNome} meuWhats={meuWhats} serperKey={serperKey.trim()} githubToken={githubToken.trim()} onClose={() => setExemplo(null)} onCopy={copy}
            onSent={(l) => contact(l, result?.busca || "Abordagem")} />
        )}
      </>

      {/* Configurações */}
      <AnimatePresence>
        {msgOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMsgOpen(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6 ring-1 ring-white/10">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-xl font-medium tracking-tight">Configurações</h3>
                <button onClick={() => setMsgOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-5 w-5" /></button>
              </div>

              <div className="mb-4 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <div className="mb-1 text-sm font-medium">Seus dados <span className="font-normal text-muted-foreground">(aparecem no exemplo pronto)</span></div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input value={meuNome} onChange={(e) => { setMeuNome(e.target.value); storageSet("csearch_meu_nome", e.target.value); }}
                    placeholder="Seu nome ou da sua marca" className="h-10 rounded-lg bg-black/40 px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40" />
                  <input value={meuWhats} onChange={(e) => { setMeuWhats(e.target.value); storageSet("csearch_meu_whats", e.target.value); }}
                    placeholder="Seu WhatsApp, ex.: 11 91234-5678" className="h-10 rounded-lg bg-black/40 px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40" />
                </div>
              </div>

              <div className="mb-6 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <div className="mb-1 text-sm font-medium">Chave do Serper <span className="font-normal text-muted-foreground">(verificação no Google)</span></div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Crie uma conta grátis em{" "}
                  <a href="https://serper.dev" target="_blank" rel="noreferrer" className="underline hover:text-foreground">serper.dev</a>
                  {" "}(só e-mail, sem cartão), copie a "API Key" do painel e cole aqui. Ela fica salva só neste navegador.
                </p>
                <input
                  type="password"
                  value={serperKey}
                  onChange={(e) => { setSerperKey(e.target.value); storageSet("csearch_serper_key", e.target.value.trim()); }}
                  placeholder="Cole sua API Key do Serper"
                  className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40"
                />
                <div className="mt-2 text-xs text-muted-foreground">{serperKey ? "✓ Chave salva" : "Sem chave: a verificação no Google fica desligada"}</div>
                <Creditos serperKey={serperKey.trim()} />
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={autoVerify} onChange={(e) => { setAutoVerify(e.target.checked); storageSet("csearch_auto_verify", e.target.checked ? "1" : "0"); }} />
                  Verificar automaticamente os 10 melhores depois de cada busca <span className="text-muted-foreground">(até 30 créditos)</span>
                </label>
              </div>

              <div className="mb-6 -mt-2 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <div className="mb-1 text-sm font-medium">Token do GitHub <span className="font-normal text-muted-foreground">(link curto da demonstração)</span></div>
                <ol className="mb-3 list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
                  <li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="underline hover:text-foreground">github.com/settings/personal-access-tokens/new</a> .</li>
                  <li>Nome: <b>csearch-demos</b> · <b>Resource owner: c-search</b> · Validade: a que preferir (ex.: 1 ano).</li>
                  <li>Em <b>Repository access</b>, escolha <b>Only select repositories</b> → <b>c-search.github.io</b>.</li>
                  <li>Em <b>Permissions → Repository permissions → Contents</b>, escolha <b>Read and write</b>.</li>
                  <li>Clique em <b>Generate token</b>, copie e cole aqui. Ele fica salvo só neste navegador.</li>
                </ol>
                <input type="password" value={githubToken}
                  onChange={(e) => { setGithubToken(e.target.value); storageSet("csearch_github_token", e.target.value.trim()); }}
                  placeholder="Cole o token (começa com github_pat_)"
                  className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40" />
                <div className="mt-2 text-xs text-muted-foreground">{githubToken ? "✓ Token salvo: as demonstrações saem com link curto" : "Sem token: a mensagem vai com o link longo (funciona igual, só é maior)"}</div>
              </div>

              <div className="mb-3">
                <h4 className="text-base font-medium tracking-tight">Mensagem do <span className="font-serif italic font-normal">WhatsApp</span></h4>
                <p className="text-sm text-muted-foreground">Variáveis: {"{nome}"}, {"{oferta}"}, {"{cidade}"}, {"{avaliacoes}"}</p>
              </div>
              <textarea
                value={template}
                onChange={(e) => { setTemplate(e.target.value); storageSet("csearch_template", e.target.value); }}
                rows={9}
                className="w-full rounded-lg bg-white/[0.03] p-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40"
              />
              <div className="mt-3 whitespace-pre-line rounded-lg bg-white/[0.03] p-3 text-sm text-muted-foreground">
                <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Prévia</div>
                {fillTemplate(template, { nome: "Pizzaria Bella Massa", oferta: "Cardápio digital", avaliacoes: 4 } as Lead, "sua cidade")}
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => { setTemplate(DEFAULT_MSG); storageSet("csearch_template", DEFAULT_MSG); }}>Restaurar padrão</Button>
                <Button size="sm" onClick={() => setMsgOpen(false)}>Pronto</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-xl px-5 py-3 text-sm shadow-2xl ${toast.erro ? "bg-red-500 text-white" : "bg-foreground text-background"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
