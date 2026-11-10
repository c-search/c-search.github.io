"""C-Search — encontra estabelecimentos sem site / com poucas avaliações."""
from __future__ import annotations

import io
import os

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

from csearch import demo, osm, places, scoring, storage

load_dotenv()

st.set_page_config(page_title="C-Search", page_icon="🔎", layout="wide")

DEFAULT_MSG = (
    "Olá, {nome}! Tudo bem?\n\n"
    "Encontrei vocês pesquisando negócios aqui da região e gostei do que vi. Notei que ainda "
    "não têm {oferta}, e acho que pode ser uma ótima forma de mostrar o trabalho de vocês "
    "para mais clientes.\n\n"
    "Posso te enviar um exemplo de como ficaria, sem compromisso?"
)

FONTE_OSM = "OpenStreetMap (grátis)"
FONTE_GOOGLE = "Google (precisa de chave paga)"
FONTE_DEMO = "Demonstração (dados falsos)"

# ---------------- Barra lateral ----------------
with st.sidebar:
    st.title("🔎 C-Search")
    st.caption("Ache negócios que precisam de site, cardápio digital ou portfólio.")

    fonte = st.radio("Fonte dos dados", [FONTE_OSM, FONTE_GOOGLE, FONTE_DEMO])
    api_key = ""
    if fonte == FONTE_GOOGLE:
        api_key = st.text_input("Chave da Google Places API", value=os.getenv("GOOGLE_PLACES_API_KEY", ""),
                                type="password", help="Fica salva no arquivo .env")
    elif fonte == FONTE_OSM:
        st.caption("Grátis e sem cadastro. Não traz avaliações do Google — use o link "
                   "'Ver no Maps' para conferir antes de chamar.")

    st.divider()
    st.subheader("Mensagem do WhatsApp")
    template = st.text_area(
        "Modelo", value=st.session_state.get("template", DEFAULT_MSG), height=180,
        help="Variáveis: {nome}, {oferta}, {cidade}, {avaliacoes}",
    )
    st.session_state["template"] = template


def to_excel(df: pd.DataFrame) -> bytes:
    buf = io.BytesIO()
    df.to_excel(buf, index=False, sheet_name="Leads")
    return buf.getvalue()


@st.cache_data(ttl=6 * 3600, show_spinner=False)
def buscar_osm(lugar: str) -> tuple[str, list[dict]]:
    geo = osm.geocode(lugar)
    achados = osm.fetch_places(geo)
    return geo["nome"], [scoring.score_lead(p) for p in achados]


SHOW_COLS = ["nivel", "score", "nome", "categoria", "avaliacoes", "nota", "tipo_site",
             "site", "telefone", "oferta", "motivos", "link_whatsapp", "maps_url", "endereco"]

COL_CONFIG = {
    "nivel": st.column_config.TextColumn("Nível", width="small"),
    "score": st.column_config.ProgressColumn("Score", min_value=0, max_value=100, format="%d"),
    "nome": st.column_config.TextColumn("Nome", width="medium"),
    "categoria": "Categoria",
    "avaliacoes": st.column_config.NumberColumn("Avaliações", format="%d"),
    "nota": st.column_config.NumberColumn("Nota", format="%.1f ⭐"),
    "tipo_site": "Site?",
    "site": st.column_config.LinkColumn("Link do site"),
    "telefone": "Telefone",
    "oferta": "O que oferecer",
    "motivos": "Por que é lead",
    "link_whatsapp": st.column_config.LinkColumn("WhatsApp", display_text="Abrir conversa"),
    "maps_url": st.column_config.LinkColumn("Google Maps", display_text="Ver no Maps"),
    "endereco": "Endereço",
    "status": st.column_config.SelectboxColumn("Status", options=storage.STATUS, required=True),
    "anotacoes": st.column_config.TextColumn("Anotações", width="large"),
}


def filtros(com_avaliacoes: bool, padrao_telefone: bool) -> dict:
    with st.expander("Filtros", expanded=True):
        f1, f2, f3 = st.columns(3)
        out = {
            "max_reviews": f1.slider("Máximo de avaliações", 0, 500, 50, step=5) if com_avaliacoes else None,
            "tipos_site": f2.multiselect("Situação do site", ["Nenhum", "Só rede social", "Site próprio"],
                                         default=["Nenhum", "Só rede social"]),
            "so_telefone": f3.checkbox("Só com telefone", value=padrao_telefone),
            "so_whatsapp": f3.checkbox("Só com celular (WhatsApp)", value=False),
            "esconder_salvos": f1.checkbox("Esconder quem já está em 'Meus leads'", value=False),
        }
    return out


def mostrar_leads(leads: list[dict], f: dict, busca: str, cidade: str, key: str) -> None:
    df = pd.DataFrame(leads)
    total = len(df)
    if total:
        if f["max_reviews"] is not None:
            df = df[df["avaliacoes"].isna() | (df["avaliacoes"] <= f["max_reviews"])]
        df = df[df["tipo_site"].isin(f["tipos_site"])]
        if f["so_telefone"]:
            df = df[df["telefone"] != ""]
        if f["so_whatsapp"]:
            df = df[df["whatsapp"] != ""]
        if f["esconder_salvos"]:
            df = df[~df["place_id"].isin(storage.known_ids())]
        df = df.sort_values(["score", "avaliacoes"], ascending=[False, True], na_position="last")
        df["link_whatsapp"] = [
            scoring.whatsapp_link(r["whatsapp"], scoring.fill_template(template, r, cidade))
            for r in df.to_dict("records")
        ]

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Encontrados", total)
    m2.metric("Passaram nos filtros", len(df))
    m3.metric("🔥 Quentes", int((df["nivel"] == "🔥 Quente").sum()) if len(df) else 0)
    m4.metric("Com WhatsApp", int((df["whatsapp"] != "").sum()) if len(df) else 0)

    if not len(df):
        if total:
            st.warning("Ninguém passou nos filtros. Tente desmarcar 'Só com telefone' ou mudar a situação do site.")
        return

    cols = [c for c in SHOW_COLS if not (c in ("avaliacoes", "nota") and df[c].isna().all())]
    st.dataframe(df[cols], column_config=COL_CONFIG, hide_index=True, use_container_width=True)
    b1, b2, b3 = st.columns(3)
    if b1.button("💾 Salvar todos em 'Meus leads'", key=f"salvar_{key}"):
        novos = storage.save_leads(df.to_dict("records"), busca)
        st.success(f"{novos} leads novos salvos ({len(df) - novos} já existiam).")
    b2.download_button("⬇️ Baixar Excel", to_excel(df[cols]), "csearch_leads.xlsx", key=f"xlsx_{key}")
    b3.download_button("⬇️ Baixar CSV", df[cols].to_csv(index=False).encode("utf-8-sig"),
                       "csearch_leads.csv", "text/csv", key=f"csv_{key}")


aba_busca, aba_leads = st.tabs(["🔎 Buscar estabelecimentos", "📋 Meus leads"])

# ---------------- Aba de busca ----------------
with aba_busca:
    if fonte == FONTE_OSM:
        c1, c2 = st.columns([3, 1])
        lugar = c1.text_input("Cidade ou bairro", placeholder="ex.: Campinas SP  ou  Cambuí, Campinas")
        c2.write("")
        c2.write("")
        if c2.button("Buscar comércios", type="primary", disabled=not lugar, use_container_width=True):
            with st.spinner("Buscando todos os comércios da região… O servidor grátis pode levar de 2 a 10 min "
                            "quando está cheio. Depois fica salvo e a mesma cidade abre na hora por 24h."):
                try:
                    nome_area, leads = buscar_osm(lugar.strip())
                    st.session_state["osm"] = {"lugar": lugar.strip(), "area": nome_area, "leads": leads}
                except osm.OSMError as e:
                    st.error(str(e))

        res = st.session_state.get("osm")
        if res:
            st.caption(f"Área: {res['area']}")
            ranking = scoring.rank_categories(res["leads"])
            st.subheader("🏆 Melhores categorias para prospectar")
            st.caption("'Leads bons' = sem site próprio **e** com telefone cadastrado.")
            rk = pd.DataFrame(ranking)[["categoria", "leads_bons", "sem_site", "so_rede_social",
                                        "total", "pct_sem_site", "oferta"]]
            st.dataframe(
                rk, hide_index=True, use_container_width=True, height=280,
                column_config={
                    "categoria": "Categoria", "leads_bons": "Leads bons", "sem_site": "Sem site",
                    "so_rede_social": "Só rede social", "total": "Total",
                    "pct_sem_site": st.column_config.ProgressColumn("% sem site", min_value=0, max_value=100, format="%d%%"),
                    "oferta": "O que oferecer",
                },
            )

            st.subheader("📍 Estabelecimentos")
            opcoes = ["Todas as categorias"] + [f"{r['categoria']} ({r['leads_bons']} bons / {r['total']})" for r in ranking]
            escolha = st.selectbox("Categoria", opcoes, index=1 if len(opcoes) > 1 else 0)
            f = filtros(com_avaliacoes=False, padrao_telefone=False)
            leads = res["leads"]
            if escolha != opcoes[0]:
                cat = escolha.rsplit(" (", 1)[0]
                leads = [l for l in leads if l["categoria"] == cat]
            mostrar_leads(leads, f, f"{escolha.rsplit(' (', 1)[0]} - {res['lugar']}", res["lugar"], "osm")

    else:
        c1, c2 = st.columns(2)
        termo = c1.text_input("Tipo de estabelecimento", placeholder="ex.: barbearia, mecânico, pizzaria, empreiteira")
        cidade = c2.text_input("Cidade / região", placeholder="ex.: Campinas SP")
        bairros_txt = st.text_area(
            "Bairros (opcional, um por linha)", placeholder="Centro\nCambuí\nTaquaral", height=90,
            help="O Google devolve no máximo 60 lugares por busca. Buscando bairro por bairro você encontra muito mais.",
        )
        f = filtros(com_avaliacoes=True, padrao_telefone=True)
        paginas = st.select_slider("Páginas por busca (20 lugares cada)", options=[1, 2, 3], value=3,
                                   help="No Google, cada página é uma requisição cobrada.")

        bairros = [b.strip() for b in bairros_txt.splitlines() if b.strip()]
        consultas = [f"{termo} em {b}, {cidade}" for b in bairros] if bairros else [f"{termo} em {cidade}"]
        if termo and cidade and fonte == FONTE_GOOGLE:
            st.caption(f"Vai fazer até **{len(consultas) * paginas}** requisições ao Google.")

        if st.button("Buscar", type="primary", disabled=not (termo and cidade)):
            brutos: dict[str, dict] = {}
            progresso = st.progress(0.0, text="Buscando…")
            try:
                for i, q in enumerate(consultas):
                    progresso.progress(i / len(consultas), text=f"Buscando: {q}")
                    achados = demo.fake_search(q) if fonte == FONTE_DEMO else places.search_text(q, api_key, paginas)
                    for p in achados:
                        brutos[p["place_id"]] = p
            except places.PlacesError as e:
                st.error(str(e))
            progresso.empty()
            st.session_state["resultado"] = {
                "leads": [scoring.score_lead(p, termo) for p in brutos.values()
                          if p.get("status_google") in ("", "OPERATIONAL")],
                "busca": f"{termo} - {cidade}", "cidade": cidade,
            }

        res = st.session_state.get("resultado")
        if res:
            mostrar_leads(res["leads"], f, res["busca"], res["cidade"], "google")

# ---------------- Aba de leads salvos ----------------
with aba_leads:
    salvos = storage.load_leads()
    if salvos.empty:
        st.info("Nenhum lead salvo ainda. Faça uma busca e clique em 'Salvar todos'.")
    else:
        s1, s2 = st.columns(2)
        filtro_status = s1.multiselect("Status", storage.STATUS, default=["Novo", "Contatado", "Respondeu", "Negociando"])
        filtro_busca = s2.multiselect("Busca de origem", sorted(salvos["busca"].dropna().unique()))
        view = salvos[salvos["status"].isin(filtro_status)]
        if filtro_busca:
            view = view[view["busca"].isin(filtro_busca)]
        view = view.copy()
        view["link_whatsapp"] = [
            scoring.whatsapp_link(r["whatsapp"], scoring.fill_template(template, r)) for r in view.to_dict("records")
        ]

        counts = salvos["status"].value_counts()
        cols = st.columns(len(storage.STATUS))
        for col, s in zip(cols, storage.STATUS):
            col.metric(s, int(counts.get(s, 0)))

        edit_cols = ["status", "anotacoes", "nivel", "score", "nome", "categoria", "avaliacoes", "tipo_site",
                     "telefone", "oferta", "link_whatsapp", "maps_url", "busca", "encontrado_em", "place_id"]
        editado = st.data_editor(
            view[edit_cols],
            column_config={**COL_CONFIG, "place_id": None, "busca": "Busca", "encontrado_em": "Encontrado em"},
            disabled=[c for c in edit_cols if c not in ("status", "anotacoes")],
            hide_index=True,
            use_container_width=True,
            key="editor_leads",
        )

        a1, a2, a3 = st.columns(3)
        if a1.button("💾 Salvar alterações", type="primary"):
            orig = view.set_index("place_id")
            mudou = 0
            for r in editado.to_dict("records"):
                o = orig.loc[r["place_id"]]
                if r["status"] != o["status"] or (r["anotacoes"] or "") != (o["anotacoes"] or ""):
                    storage.update_lead(r["place_id"], r["status"], r["anotacoes"] or "")
                    mudou += 1
            st.success(f"{mudou} leads atualizados.")
            st.rerun()
        a2.download_button("⬇️ Exportar Excel", to_excel(salvos), "csearch_meus_leads.xlsx")
        with a3.popover("🗑️ Apagar todos"):
            st.write("Isso apaga todos os leads salvos, sem volta.")
            if st.button("Confirmar exclusão", type="secondary"):
                storage.delete_all()
                st.rerun()
