// Créditos do Serper: conta o que o C-Search gasta e tenta ler o saldo da sua conta.
const USADOS = "csearch_creditos_usados";
const EVENTO = "csearch-creditos";

export function creditosUsados(): number {
  try {
    return Number(localStorage.getItem(USADOS) || "0") || 0;
  } catch {
    return 0;
  }
}

/** Chamado a cada pesquisa no Serper que deu certo (1 crédito cada). */
export function registrarCredito(n = 1) {
  try {
    localStorage.setItem(USADOS, String(creditosUsados() + n));
  } catch {
    /* sem armazenamento */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function zerarContador() {
  try {
    localStorage.setItem(USADOS, "0");
  } catch {
    /* sem armazenamento */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function aoMudarCreditos(fn: () => void) {
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}

/**
 * Tenta ler o saldo na conta do Serper. Se o Serper não informar (ou o formato for outro),
 * devolve null e a tela mostra só o que o C-Search já gastou.
 */
export async function consultarSaldo(key: string): Promise<number | null> {
  if (!key) return null;
  try {
    const r = await fetch("https://google.serper.dev/account", { headers: { "X-API-KEY": key } });
    if (!r.ok) return null;
    const j = await r.json();
    for (const campo of ["balance", "credits", "creditsRemaining", "remainingCredits", "remaining"]) {
      const v = j?.[campo];
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return null;
  } catch {
    return null;
  }
}

/** Mensagem certa para um erro do Serper (antes, qualquer erro 400 virava "créditos acabaram"). */
export async function erroSerper(r: Response, oQue = "pesquisa"): Promise<Error> {
  let msg = "";
  try {
    const j = await r.clone().json();
    msg = String(j?.message || j?.error || "");
  } catch {
    try { msg = (await r.text()).slice(0, 120); } catch { /* sem corpo */ }
  }
  if (r.status === 401 || r.status === 403) return new Error("Chave do Serper inválida. Confira em Configurações.");
  if (r.status === 402 || /credit|balance|quota|insufficient/i.test(msg)) return new Error("Seus créditos do Serper acabaram.");
  if (r.status === 429) return new Error("Muitas pesquisas ao mesmo tempo no Serper. Espere alguns segundos e tente de novo.");
  return new Error(`O Serper recusou a ${oQue} (erro ${r.status}${msg ? `: ${msg}` : ""}).`);
}
