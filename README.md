# 🔎 C-Search

Encontra estabelecimentos no Google (barbearias, mecânicos, restaurantes, empreiteiras… qualquer coisa)
que **não têm site**, **só têm Instagram/iFood** ou **têm poucas avaliações** — ou seja, clientes em
potencial para você vender site, cardápio digital, portfólio ou gestão do perfil no Google.

## 🌐 Versão online

**https://c-search.github.io/**: abre direto no navegador, sem instalar nada.

- Busca grátis no OpenStreetMap, ranking de categorias, score, WhatsApp e "Meus leads".
- "Meus leads" fica salvo **no navegador de cada pessoa** (ninguém vê a lista de ninguém).
  Se limpar os dados do navegador a lista some, então exporte de vez em quando.
- O modo Google **não existe na versão online** (a chave ficaria exposta). Ele só aparece na
  versão local (`iniciar.bat`) quando há chave no `.env`.
- Cada `git push` na branch `main` atualiza o site sozinho (GitHub Actions).

### 🧰 Ferramentas de venda

- **Exemplo pronto** (✨): gera um link com um cardápio digital ou site de exemplo com o nome do
  lugar, para mandar quando o dono disser "pode mandar". Coloque seu nome e WhatsApp em
  Configurações para aparecer o botão "Gostei, quero o meu".
- **WhatsApp marca sozinho**: ao clicar em WhatsApp, o lugar vai para Meus leads como "Contatado".
- **Lembretes**: quem está sem resposta há 3+ dias aparece em "Para retornar hoje", com a
  2ª mensagem pronta.
- **Respostas prontas** (💬 em Meus leads): "Quanto custa?", "Já tenho Instagram", "Tá caro"…
- **Painel de vendas**: chamados, taxa de resposta, fechados e quanto você já faturou.
- **Mapa** com rota pelo Google Maps passando pelos melhores lugares.
- **Vários bairros** numa busca só (campo de bairros, separados por vírgula).
- **Modo rápido**: um lugar por vez, com botões grandes. Ótimo no celular (dá para arrastar).
- **Instalar como app** (botão no topo, ou "Adicionar à tela inicial" no celular).
- **Backup**: baixa um arquivo com seus leads e restaura em outro aparelho (a chave do Serper
  não vai no arquivo).

### ✅ Verificação no Google (Serper)

O mapa grátis não sabe tudo (ex.: lugar que tem site mas não cadastrou no OpenStreetMap).
Com uma chave grátis do [serper.dev](https://serper.dev) (só e-mail, ~2.500 pesquisas grátis),
o botão **Verificar** pesquisa cada lugar no Google e marca:

- **Confirmado no Google: sem site** → pode chamar
- **Sem site próprio, mas tem rede social / cardápio-delivery** (Instagram, iFood…)
- **Já tem site** → sai da lista automaticamente

Cada lugar verificado gasta 1 crédito e fica guardado no navegador (não gasta de novo).
Também pega o número de avaliações do Google quando aparece. Lugares com o mesmo nome em
vários endereços são marcados como **possível rede** e caem no ranking.
A chave fica em **Configurações**, salva só no navegador de quem usa.

## ⭐ Busca recomendada: Google Maps

Com a chave grátis do [serper.dev](https://serper.dev) (Configurações), a busca **Google Maps** traz os
lugares direto do Google: reais, atuais, com site, telefone e avaliações da própria ficha.
Cada página (~20 lugares) custa 1 crédito. O botão **Maps** abre exatamente a ficha do lugar.

- Ficha **com site** → "Já tem site" na hora (sem gastar crédito extra).
- Ficha **sem site** → "Sem site no Maps · falta confirmar". O botão **Verificar** faz uma busca no
  Google (1 crédito) para pegar sites que não estão na ficha. Só depois disso aparece
  **"Sem site (confirmado)"**.
- No mapa grátis (OpenStreetMap) a verificação procura a ficha do Google pelo telefone,
  distância e endereço (o nome pode ser diferente). Se não achar, diz "Não achei no Google
  Maps", nunca "sem site".

## Fontes de dados

| Fonte | Custo | O que traz |
|---|---|---|
| **OpenStreetMap** (padrão) | Grátis, sem cadastro | Todos os comércios da cidade/bairro, site, telefone, Instagram. **Sem avaliações.** |
| **Google Places** | Precisa de conta de faturamento no Google Cloud | Tudo, inclusive avaliações e nota. Mais completo. |
| **Demonstração** | Grátis | Dados falsos, só para ver como funciona. |

> ⚠️ No OpenStreetMap, "sem site" quer dizer "ninguém cadastrou o site no mapa" — às vezes o lugar
> tem site sim. Antes de chamar, clique em **Ver no Maps** para conferir no Google (avaliações, site, fotos).

## Como usar

1. Dê dois cliques em **`iniciar.bat`**. Vai abrir no navegador (http://localhost:8000).
   Na primeira vez ele monta a interface (precisa do Node.js instalado; leva 1 minuto).
2. **Modo Grátis (OpenStreetMap):** digite a cidade ou bairro e clique em **Buscar**. O programa
   traz todos os comércios de uma vez e mostra o ranking **🏆 Melhores categorias para prospectar**
   (onde tem mais negócios sem site e com telefone). Escolha a categoria e veja a lista.
   O servidor grátis pode levar 1–3 minutos; a mesma cidade fica guardada por 6 horas.
3. **Modo Google:** digite o tipo de estabelecimento e a cidade, ajuste os filtros e clique em **Buscar**.
4. Cada resultado vem com:
   - **Score (0–100)** e nível 🔥 Quente / 🟡 Morno / ❄️ Frio
   - **O que oferecer** (cardápio digital para comida, site + portfólio para obras/estúdios etc.)
   - Botão **Abrir conversa** no WhatsApp com a mensagem já preenchida (só quando o número é celular)
5. Clique em **Salvar todos em 'Meus leads'** e acompanhe na outra aba: Novo → Contatado → Respondeu → Negociando → Fechado.
6. Exporte para Excel/CSV quando quiser.

**Dica:** o Google devolve no máximo 60 lugares por busca. Preencha o campo **Bairros** (um por linha)
para buscar bairro por bairro e achar muito mais.

## Pegando a chave do Google (opcional, para dados mais completos)

1. Acesse https://console.cloud.google.com/ e crie um projeto.
2. Ative a cobrança (precisa de cartão; o Google dá uma cota gratuita mensal).
3. Vá em **APIs e serviços → Biblioteca** e ative a **Places API (New)**.
4. Vá em **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
5. (Recomendado) Restrinja a chave para usar só a "Places API (New)".
6. Copie `.env.example` para `.env` e cole a chave: `GOOGLE_PLACES_API_KEY=sua_chave`.

**Custo:** cada página de resultados (até 20 lugares) é 1 requisição. Como pedimos site, telefone e
avaliações, ela entra na faixa "Enterprise" da Text Search. Confira os preços e a cota grátis atuais em
https://developers.google.com/maps/billing-and-pricing/pricing e crie um **alerta de orçamento** no
Google Cloud para não ter surpresa. O programa mostra quantas requisições vai fazer antes de buscar.

## Mexendo no visual

Depois de alterar algo em `web/src`, rode `npm run build` dentro da pasta `web` (ou apague `web/dist`
e o `iniciar.bat` monta de novo). Para editar vendo ao vivo: rode o servidor
(`py -m uvicorn api:app --port 8000`) e, em outra janela, `npm run dev` dentro de `web`
(abre em http://localhost:5173).

## Estrutura

```
api.py               servidor (FastAPI): API em /api + serve a interface
web/                 interface (React + Vite + Tailwind + Framer Motion)
  src/components/    Hero (busca), Results (ranking + lista), SavedLeads, HowItWorks
app.py               interface antiga (Streamlit) — ainda funciona: py -m streamlit run app.py
csearch/osm.py       busca grátis no OpenStreetMap + categorias
csearch/places.py    busca na Google Places API
csearch/scoring.py   score do lead, oferta sugerida, link do WhatsApp
csearch/storage.py   banco local SQLite (dados/leads.db) com status e anotações
csearch/demo.py      dados falsos para testar
```
