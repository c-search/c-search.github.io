import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { aoMudarCreditos, consultarSaldo, creditosUsados, zerarContador } from "@/engine/credits";

/** Saldo do Serper (se a conta informar) + quanto o C-Search já gastou. */
export function Creditos({ serperKey, compacto }: { serperKey: string; compacto?: boolean }) {
  const [usados, setUsados] = useState(creditosUsados);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function atualizar() {
    setCarregando(true);
    setSaldo(await consultarSaldo(serperKey));
    setCarregando(false);
  }

  useEffect(() => { if (serperKey) atualizar(); }, [serperKey]);
  useEffect(() => aoMudarCreditos(() => {
    setUsados(creditosUsados());
    setSaldo((s) => (s === null ? s : Math.max(0, s - 1)));
  }), []);

  if (!serperKey) return null;
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  if (compacto) {
    return (
      <span className={saldo !== null && saldo < 50 ? "text-amber-300" : ""}>
        {saldo !== null ? `${fmt(saldo)} créditos no Serper` : `${fmt(usados)} créditos usados`}
      </span>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-black/30 px-3 py-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          {saldo !== null ? (
            <div className="text-sm"><b className={saldo < 50 ? "text-amber-300" : "text-foreground"}>{fmt(saldo)}</b> <span className="text-muted-foreground">créditos restantes no Serper</span></div>
          ) : (
            <div className="text-muted-foreground">O Serper não informou o saldo por aqui. Veja no painel dele.</div>
          )}
          <div className="mt-0.5 text-muted-foreground">O C-Search já usou <b className="text-foreground">{fmt(usados)}</b> créditos neste navegador.</div>
        </div>
        <button onClick={atualizar} disabled={carregando} title="Atualizar saldo" className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer">
          <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="mt-2 flex gap-4">
        <a href="https://serper.dev/dashboard" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3 w-3" /> Abrir painel do Serper
        </a>
        <button onClick={zerarContador} className="text-muted-foreground hover:text-foreground cursor-pointer">zerar contador</button>
      </div>
    </div>
  );
}
