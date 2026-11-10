import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { api, STATUS, DEFAULT_MSG, fillTemplate, storageGet, storageSet, type Fonte, type Lead, type SavedLead, type SearchResult } from "@/lib";
import { Hero, VideoBackground } from "./components/Hero";
import { Results } from "./components/Results";
import { SavedLeads } from "./components/SavedLeads";
import { HowItWorks } from "./components/HowItWorks";
import { Button } from "./components/ui";

export default function App() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedLead[]>([]);
  const statuses = STATUS;
  const [hasKey, setHasKey] = useState(false);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [template, setTemplate] = useState(() => storageGet("csearch_template", DEFAULT_MSG));
  const [msgOpen, setMsgOpen] = useState(false);

  const notify = useCallback((msg: string, erro = false) => {
    setToast({ msg, erro });
    setTimeout(() => setToast(null), erro ? 7000 : 3500);
  }, []);

  const loadSaved = useCallback(() => api.leads().then(setSaved).catch(() => {}), []);

  useEffect(() => {
    api.config().then((c) => setHasKey(c.has_google_key));
    loadSaved();
  }, [loadSaved]);

  async function search(p: { fonte: Fonte; lugar: string; termo: string; bairros: string[] }) {
    setLoading(true);
    try {
      const r = p.fonte === "osm"
        ? await api.searchOsm(p.lugar)
        : await api.searchTerm({ termo: p.termo, cidade: p.lugar, bairros: p.bairros, fonte: p.fonte });
      setResult({ ...r, busca: `${p.termo || "comércios"} - ${p.lugar}` });
      setTimeout(() => document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
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

  async function update(id: string, status: string, anotacoes: string) {
    setSaved((s) => s.map((l) => (l.place_id === id ? { ...l, status, anotacoes } : l)));
    try {
      await api.update(id, status, anotacoes);
    } catch (e) {
      notify((e as Error).message, true);
      loadSaved();
    }
  }

  async function deleteAll() {
    await api.deleteAll();
    loadSaved();
    notify("Leads apagados");
  }

  const savedIds = new Set(saved.map((l) => l.place_id));

  return (
    <main className="relative min-h-screen text-foreground">
      <VideoBackground />
      <div className="relative z-10">
      <Hero onSearch={search} loading={loading} result={result} hasGoogleKey={hasKey} savedCount={saved.length} onOpenMessage={() => setMsgOpen(true)} />
      {result && <Results key={result.busca + result.area} result={result} template={template} savedIds={savedIds} onSave={save} />}
      <SavedLeads leads={saved} statuses={statuses} template={template} onUpdate={update} onDeleteAll={deleteAll} />
      <HowItWorks />
      <footer className="px-8 md:px-28 py-10 text-sm text-muted-foreground">
        C-Search · dados de OpenStreetMap (© colaboradores OSM){hasKey && " e Google Places"}
      </footer>
      </div>

      <AnimatePresence>
        {msgOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMsgOpen(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-card p-6 ring-1 ring-white/10">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-medium tracking-tight">Mensagem do <span className="font-serif italic font-normal">WhatsApp</span></h3>
                  <p className="text-sm text-muted-foreground">Variáveis: {"{nome}"}, {"{oferta}"}, {"{cidade}"}, {"{avaliacoes}"}</p>
                </div>
                <button onClick={() => setMsgOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-5 w-5" /></button>
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
            className={`fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl px-5 py-3 text-sm shadow-2xl ${toast.erro ? "bg-red-500 text-white" : "bg-foreground text-background"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
