// Backup em arquivo: baixa tudo o que está salvo no navegador e restaura em outro aparelho.
import type { SavedLead } from "@/lib";

const CHAVES = ["csearch_leads_v1", "csearch_verificacoes_v2", "csearch_template", "csearch_meu_nome", "csearch_meu_whats", "csearch_auto_verify"];
// a chave do Serper NÃO vai no arquivo, para não vazar se você mandar o backup para alguém

export function exportBackup() {
  const dados: Record<string, string | null> = {};
  for (const k of CHAVES) {
    try {
      dados[k] = localStorage.getItem(k);
    } catch {
      dados[k] = null;
    }
  }
  const json = JSON.stringify({ app: "csearch", versao: 1, criado_em: new Date().toISOString(), dados }, null, 1);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const d = new Date();
  a.download = `csearch-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importBackup(texto: string) {
  let b: { app?: string; dados?: Record<string, string | null> };
  try {
    b = JSON.parse(texto);
  } catch {
    throw new Error("Esse arquivo não é um backup do C-Search.");
  }
  if (b.app !== "csearch" || !b.dados) throw new Error("Esse arquivo não é um backup do C-Search.");

  // leads: junta com o que já existe (não apaga nada daqui)
  const atuais: SavedLead[] = JSON.parse(localStorage.getItem("csearch_leads_v1") || "[]");
  const doArquivo: SavedLead[] = JSON.parse(b.dados["csearch_leads_v1"] || "[]");
  const porId = new Map(atuais.map((l) => [l.place_id, l]));
  for (const l of doArquivo) {
    const a = porId.get(l.place_id);
    if (!a || (l.status_em || "") > (a.status_em || "")) porId.set(l.place_id, l);
  }
  localStorage.setItem("csearch_leads_v1", JSON.stringify([...porId.values()]));

  const verAtuais = JSON.parse(localStorage.getItem("csearch_verificacoes_v2") || "{}");
  const verArquivo = JSON.parse(b.dados["csearch_verificacoes_v2"] || "{}");
  localStorage.setItem("csearch_verificacoes_v2", JSON.stringify({ ...verArquivo, ...verAtuais }));

  for (const k of ["csearch_template", "csearch_meu_nome", "csearch_meu_whats", "csearch_auto_verify"]) {
    const v = b.dados[k];
    if (v != null && !localStorage.getItem(k)) localStorage.setItem(k, v);
  }
  return { leads: doArquivo.length, verificacoes: Object.keys(verArquivo).length };
}
