/*************************************************************
 * EVOLPEOPLE - Front-end (app.js)
 * Fala com o backend Code.gs via JSONP (script tag), porque o
 * doGet/doPost do Apps Script responde texto com callback().
 *
 * CONFIGURAÇÃO OBRIGATÓRIA:
 *  1) Implante o Code.gs como "App da Web" (Executar como: Eu;
 *     Quem tem acesso: Qualquer pessoa).
 *  2) Cole a URL terminada em /exec abaixo em CONFIG.API_URL.
 *************************************************************/

const CONFIG = {
  // ↓↓↓ URL /exec da sua implantação (App da Web). Não mexer em mais nada abaixo. ↓↓↓
  API_URL: "https://script.google.com/macros/s/AKfycbx4FiKAYkn4LBUKUQhs0DofAjySsHSLJb6peqcKRjD_N0y4UkqdrTyRked19S0tR_iG/exec"
};

const STATE = {
  user: null,
  init: { unidades: [], cargos: [], colaboradores: [], salarios: [] },
  pagina: "dashboard",
  cache: {} // cache simples por módulo: { colaboradores: [...], vagas: [...] }
};

/* ===================== JSONP (chamada ao backend) ===================== */

// Envia ARQUIVOS (base64) por POST de verdade — o api() normal usa URL (JSONP) e
// estoura o limite de tamanho com PDF/imagem. Aqui conseguimos ler a resposta.
async function apiUpload(acao, dados) {
  const body = "acao=" + encodeURIComponent(acao) + "&dados=" + encodeURIComponent(JSON.stringify(dados));
  try {
    const resp = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body
    });
    const txt = await resp.text();
    try { return JSON.parse(txt); }
    catch (e) { return { ok: true, semResposta: true }; }
  } catch (e) {
    // Se o navegador bloquear a leitura da resposta, envia às cegas (o arquivo sobe do mesmo jeito)
    try {
      await fetch(CONFIG.API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: body
      });
      return { ok: true, semResposta: true };
    } catch (e2) {
      throw new Error("Não consegui enviar o arquivo: " + e2.message);
    }
  }
}

function apiCall(acao, dados) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.API_URL || CONFIG.API_URL.indexOf("COLE_AQUI") !== -1) {
      reject(new Error("Configure CONFIG.API_URL no topo do app.js com a URL /exec do seu App da Web."));
      return;
    }
    const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    const script = document.createElement("script");
    let timeoutId;

    function limpar() {
      clearTimeout(timeoutId);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function (res) {
      limpar();
      resolve(res);
    };
    script.onerror = function () {
      limpar();
      reject(new Error("Falha de conexão com o servidor. Verifique a URL e as permissões de implantação."));
    };
    timeoutId = setTimeout(function () {
      limpar();
      reject(new Error("Tempo de resposta excedido. O servidor pode estar sobrecarregado — tente novamente."));
    }, 45000);

    const payload = Object.assign({}, dados || {});
    if (STATE.user) {
      payload.__user = { nome: STATE.user.nome, perfil: STATE.user.perfil }; // informativo
      payload.__token = STATE.user.token || "";                               // autenticação real
    }

    const url = CONFIG.API_URL +
      "?acao=" + encodeURIComponent(acao) +
      "&dados=" + encodeURIComponent(JSON.stringify(payload)) +
      "&callback=" + cbName;

    script.src = url;
    document.body.appendChild(script);
  });
}

async function api(acao, dados) {
  toggleLoading(true);
  try {
    const res = await apiCall(acao, dados);
    if (!res || res.ok === false) {
      if (res && res.erro === "NAO_AUTORIZADO") {
        limparSessao();
        STATE.user = null;
        const app = document.getElementById("appScreen");
        const login = document.getElementById("loginScreen");
        if (app) app.style.display = "none";
        if (login) login.style.display = "flex";
        throw new Error(res.mensagem || "Sessão expirada. Faça login de novo.");
      }
      throw new Error((res && res.erro) || "Erro desconhecido ao chamar " + acao + ".");
    }
    return res;
  } finally {
    toggleLoading(false);
  }
}

/* ===================== UI: toast / loading / helpers ===================== */

function toast(msg, tipo) {
  tipo = tipo || "ok";
  const area = document.getElementById("toastArea");
  const el = document.createElement("div");
  el.className = "toast " + tipo;
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function toggleLoading(ligado) {
  const main = document.getElementById("main");
  if (!main) return;
  main.classList.toggle("loading-block", !!ligado);
}

function el(sel) { return document.querySelector(sel); }
function setMain(html) { document.getElementById("main").innerHTML = html; }

function fmtMoeda(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Converte texto em formato brasileiro para número. Ex.: "1.490.688" -> 1490688 ; "1.490,50" -> 1490.5 ; "5828.95" -> 5828.95
function parseMoedaBR(s) {
  s = String(s == null ? "" : s).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, "");
  const temVirgula = s.indexOf(",") !== -1;
  const temPonto = s.indexOf(".") !== -1;
  if (temVirgula && temPonto) { s = s.replace(/\./g, "").replace(",", "."); }      // 1.490.688,50
  else if (temVirgula) { s = s.replace(",", "."); }                                 // 1490,50
  else if (temPonto) {
    const partes = s.split(".");
    const ultimo = partes[partes.length - 1];
    if (partes.length > 2 || (partes.length === 2 && ultimo.length === 3)) s = s.replace(/\./g, ""); // milhar: 600.000 / 1.490.688
    // caso contrário mantém decimal (ex.: 5828.95)
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function normalize(s) {
  return String(s || "").trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ===================== LOGIN / SESSÃO ===================== */

const SESSION_KEY = "evolpeople_user";

function salvarSessao(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) {}
}
function lerSessao() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function limparSessao() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

async function fazerLogin(ev) {
  ev.preventDefault();
  const login = el("#loginUsuario").value.trim();
  const senha = el("#loginSenha").value;
  const msgEl = el("#loginMsg");
  msgEl.style.display = "none";

  if (!login || !senha) {
    msgEl.textContent = "Informe usuário e senha.";
    msgEl.className = "msg err";
    msgEl.style.display = "block";
    return;
  }

  try {
    const r = await api("login", { login: login, senha: senha });
    STATE.user = r.user;
    salvarSessao(r.user);
    await iniciarApp();
  } catch (e) {
    msgEl.textContent = e.message || "Login ou senha inválidos.";
    msgEl.className = "msg err";
    msgEl.style.display = "block";
  }
}

function sair() {
  limparSessao();
  STATE.user = null;
  document.getElementById("appScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

/* ===================== BOOT ===================== */

window.addEventListener("load", async () => {
  document.getElementById("loginForm").addEventListener("submit", fazerLogin);
  const sess = lerSessao();
  if (sess) {
    STATE.user = sess;
    try {
      await iniciarApp();
      return;
    } catch (e) {
      limparSessao();
    }
  }
  document.getElementById("loginScreen").style.display = "flex";
});

async function iniciarApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "grid";
  el("#userNome").textContent = STATE.user.nome || STATE.user.login || "";
  el("#userInfo").textContent = [STATE.user.perfil, STATE.user.unidade].filter(Boolean).join(" · ");

  await carregarInit();
  montarSidebar();
  navegar("dashboard");
  mostrarAvisosLogin();
}

async function carregarInit() {
  try {
    const r = await api("getInit");
    STATE.init.unidades = r.unidades || [];
    STATE.init.cargos = r.cargos || [];
    STATE.init.colaboradores = (r.colaboradores || []).map(c => Object.assign({}, c, {
      Nome: c.Nome || c["Funcionário"] || c.Funcionario || c.Colaborador || c.NOME || "",
      Unidade: c.Unidade || c.Operacao || c["Operação"] || c.Lotacao || "",
      Cargo: c.Cargo || c.Funcao || c["Função"] || c.CARGO || "",
      Lider: c.Lider || c["Líder"] || ""
    }));
    STATE.init.salarios = r.salarios || [];
    STATE.init.lideranca = r.lideranca || [];
    atualizarDatalists();
  } catch (e) {
    // Não trava o app: mantém listas vazias e segue. As telas mostram o próprio erro.
    STATE.init.unidades = STATE.init.unidades || [];
    STATE.init.colaboradores = STATE.init.colaboradores || [];
    if (typeof toast === "function") toast("Não consegui carregar os dados iniciais. Verifique se o Code.gs está publicado.", "err");
  }
}

function atualizarDatalists() {
  setDatalist("dl-unidades", STATE.init.unidades);
  setDatalist("dl-cargos", STATE.init.cargos.map(c => c.Cargo));
  setDatalist("dl-colaboradores", STATE.init.colaboradores.map(c => c.Nome));
  setDatalist("dl-gestores", todosGestores());
  setDatalist("dl-bairros", BAIRROS_FORTALEZA.concat(MUNICIPIOS_RMF));
  setDatalist("dl-ministrantes", [...new Set(SOLICITANTES.map(s => s[0]))].sort());
  ativarFiltroColabPorUnidade();
}

// Filtra o datalist de colaboradores para mostrar só os da unidade escolhida.
// Se a unidade estiver vazia, mostra todos.
function filtrarColabPorUnidade(unidade) {
  const u = normalize(unidade || "");
  const todos = STATE.init.colaboradores || [];
  const nomes = (u ? todos.filter(c => normalize(c.Unidade) === u) : todos)
    .map(c => c.Nome).filter(Boolean).sort();
  setDatalist("dl-colaboradores", nomes);
}

// Liga (uma vez) o comportamento: ao mudar qualquer campo de Unidade,
// o datalist de colaboradores passa a mostrar só os daquela unidade.
function ativarFiltroColabPorUnidade() {
  if (window.__filtroColabUni) return;
  window.__filtroColabUni = true;
  document.addEventListener("change", function (e) {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("list") === "dl-unidades") {
      filtrarColabPorUnidade(t.value);
    }
  });
}

// Todos os gestores + diretoria (Liderança, Sócio Operador, Diretor, RH),
// de todas as unidades, mais os líderes cadastrados na aba Liderança.
function todosGestores() {
  const tiposOK = ["LIDERANCA", "SOCIO OPERADOR", "DIRETOR", "DIRETORIA", "SOCIO", "RH", "GESTOR"];
  const daLista = SOLICITANTES.filter(s => tiposOK.indexOf(normalize(s[2])) !== -1).map(s => s[0]);
  const daAba = (STATE.init.lideranca || []).map(l => l.Lider);
  return [...new Set(daLista.concat(daAba))].filter(Boolean).sort();
}

function setDatalist(id, valores) {
  let dl = document.getElementById(id);
  if (!dl) {
    dl = document.createElement("datalist");
    dl.id = id;
    document.body.appendChild(dl);
  }
  dl.innerHTML = (valores || [])
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map(v => `<option value="${escapeHtml(v)}">`)
    .join("");
}

/* ===================== NAVEGAÇÃO / SIDEBAR ===================== */

const GRUPOS_NAV = [
  { titulo: "Visão Geral", itens: [
    { key: "dashboard", label: "Dashboard" },
    { key: "agenda", label: "Agenda" },
    { key: "avisos", label: "Avisos" }
  ] },
  { titulo: "Pessoas", itens: [
    { key: "colaboradores", label: "Cadastro de Colaboradores" },
    { key: "headcount", label: "Headcount" },
    { key: "cargos", label: "Cargos e Salários" },
    { key: "unidades", label: "Unidades" },
    { key: "lideranca", label: "Liderança" },
    { key: "dossie", label: "Dossiê" },
    { key: "documentos", label: "Documentos" }
  ]},
  { titulo: "Recrutamento", itens: [
    { key: "vagas", label: "Recrutamento (Vagas)" },
    { key: "testerh", label: "Agendar Teste (RH)" },
    { key: "testes", label: "Teste Prático (parecer do líder)" },
    { key: "emteste", label: "Quem está testando" }
  ]},
  { titulo: "Gestão de Pessoas", itens: [
    { key: "escalas", label: "Escalas" },
    { key: "ponto", label: "Ponto" },
    { key: "ajustesPonto", label: "Ajustes de Ponto" },
    { key: "feedbacks", label: "Feedbacks" },
    { key: "experiencia", label: "Avaliação de Experiência" },
    { key: "treinamentos", label: "Treinamentos" }
  ]},
  { titulo: "Desenvolvimento", itens: [
    { key: "universidade", label: "Universidade Evol" }
  ]},
  { titulo: "Operações", itens: [
    { key: "fardamento", label: "Fardamento / Estoque" },
    { key: "entregas", label: "Entrega de Fardamento / EPI" },
    { key: "variavel", label: "Variável da Liderança" },
    { key: "utensilios", label: "Desconto de Utensílios" },
    { key: "valetransporte", label: "Vale Transporte (quem recebe)" },
    { key: "indicadores", label: "Indicadores Mensais" },
    { key: "absenteismo", label: "Absenteísmo" },
    { key: "desligamentos", label: "Entrevista de Desligamento" },
    { key: "sla", label: "SLA de Vagas" }
  ]},
  { titulo: "Assistente", itens: [{ key: "assistente", label: "EVA (Assistente)" }] }
];

function permitido(key) {
  const mods = STATE.user && STATE.user.modulos;
  if (!mods || mods === "*") return true;
  const lista = String(mods).split(",").map(m => normalize(m));
  return lista.indexOf(normalize(key)) !== -1;
}

function montarSidebar() {
  const html = GRUPOS_NAV.map(grupo => {
    const itens = grupo.itens.filter(i => permitido(i.key));
    if (!itens.length) return "";
    return `
      <div class="nav-title">${escapeHtml(grupo.titulo)}</div>
      ${itens.map(i => `<button class="nav" data-nav="${i.key}" onclick="navegar('${i.key}')">${escapeHtml(i.label)}</button>`).join("")}
    `;
  }).join("");
  document.getElementById("sidebar").innerHTML = html;
}

async function navegar(key) {
  STATE.pagina = key;
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.nav === key));
  if (typeof filtrarColabPorUnidade === "function") filtrarColabPorUnidade(""); // começa com todos até escolher a unidade

  try {
    if (key === "dashboard") return renderDashboard();
    if (key === "agenda") return renderAgenda();
    if (key === "avisos") return renderAvisos();
    if (key === "unidades") return renderUnidades();
    if (key === "headcount") return renderHeadcount();
    if (key === "emteste") return renderEmTeste();
    if (key === "documentos") return renderDocumentos();
    if (key === "lideranca") return renderLideranca();
    if (key === "vagas") return renderVagas();
    if (key === "testes") return renderTestePratico();
    if (key === "testerh") return renderTesteRH();
    if (key === "valetransporte") return renderValeTransporte();
    if (key === "experiencia") return renderExperiencia();
    if (key === "feedbacks") return renderFeedback();
    if (key === "dossie") return renderDossie();
    if (key === "universidade") return renderUniversidade();
    if (key === "escalas") return renderEscalas();
    if (key === "ponto") return renderPonto();
    if (key === "absenteismo") return renderAbsenteismo();
    if (key === "treinamentos") return renderTreinamentos();
    if (key === "assistente") return renderAssistente();
    if (MODULES[key]) return renderModulo(key);
    setMain(`<div class="empty">Página não encontrada.</div>`);
  } catch (e) {
    setMain(`<div class="msg err">Erro ao carregar página: ${escapeHtml(e.message)}</div>`);
  }
}

/* ===================== HEADCOUNT ===================== */

const HC = { todos: [], unidade: "", sel: -1, busca: "" };

function hcData_(s) {
  if (!s) return "—";
  const p = String(s).split("-");
  if (p.length === 3) return p[2].slice(0, 2) + "/" + p[1] + "/" + p[0];
  return String(s);
}
function hcAniversario_(s) {
  if (!s) return "—";
  const p = String(s).split("-");
  if (p.length === 3) return p[2].slice(0, 2) + "/" + p[1];
  return String(s);
}
function hcExperiencia_(fim) {
  if (!fim) return "Sem data cadastrada";
  const d = new Date(fim);
  if (isNaN(d.getTime())) return escapeHtml(fim);
  const hoje = new Date();
  const dias = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (dias >= 0) return "Em experiência — faltam " + dias + " dia(s) (até " + hcData_(fim) + ")";
  return "Efetivado (experiência encerrou em " + hcData_(fim) + ")";
}
function hcCampo_(obj, nomes) {
  for (let i = 0; i < nomes.length; i++) {
    if (obj[nomes[i]] !== undefined && String(obj[nomes[i]]).trim() !== "") return obj[nomes[i]];
  }
  return "";
}

async function renderHeadcount() {
  setMain(`<div class="loading">Carregando colaboradores...</div>`);
  try {
    const r = await api("listarHeadcount", {});
    HC.todos = (r.headcount || []).map(c => Object.assign({}, c, {
      Nome: c.Nome || c["Funcionário"] || c.Funcionario || c.Colaborador || c.NOME || "",
      Unidade: c.Unidade || c.Operacao || c["Operação"] || c.Lotacao || "",
      Cargo: c.Cargo || c.Funcao || c["Função"] || c.CARGO || ""
    })).filter(c => {
      const st = normalize(c.Status);
      return st.indexOf("DEMIT") === -1 && st.indexOf("DESLIG") === -1 && st !== "INATIVO";
    });
    HC.sel = -1;
    hcRender();
  } catch (e) {
    setMain(`<div class="page-title"><div><h2>Headcount</h2></div></div>
      <div class="card"><div class="msg err">Não consegui carregar: ${escapeHtml(e.message)}</div>
      <p class="muted">Se aparecer "Ação desconhecida", o servidor (Code.gs) ainda está numa versão antiga — publique a Nova versão no Apps Script.</p></div>`);
  }
}

function hcFiltrados() {
  const q = normalize(HC.busca);
  let base;
  if (HC.unidade) base = HC.todos.filter(c => normalize(c.Unidade) === normalize(HC.unidade));
  else if (q) base = HC.todos;   // busca por nome em todas as unidades
  else base = [];
  return q ? base.filter(c => normalize(c.Nome).indexOf(q) !== -1) : base;
}

// Monta a "casca" fixa (título + busca + filtro) uma vez, e um contêiner dinâmico.
function hcRender() {
  const unis = [...new Set(HC.todos.map(c => String(c.Unidade || "").trim()).filter(Boolean))].sort();
  setMain(`
    <div class="page-title">
      <div><h2>Headcount</h2><p>Busque por nome e/ou filtre por unidade, marque o colaborador e veja os detalhes. <span class="muted" style="font-size:12px">Atualizado em ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></p></div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
        <div style="min-width:220px">
          <label>Buscar por nome</label>
          <input id="hcBusca" type="text" placeholder="Digite o nome" value="${escapeHtml(HC.busca)}" oninput="hcBuscar(this.value)">
        </div>
        <div style="min-width:220px">
          <label>Unidade</label>
          <select id="hcUni" onchange="hcMudarUnidade(this.value)">
            <option value="">Todas as unidades</option>
            ${unis.map(u => `<option value="${escapeHtml(u)}" ${normalize(u) === normalize(HC.unidade) ? "selected" : ""}>${escapeHtml(u)}</option>`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div id="hcDinamico"></div>
  `);
  hcRenderLista();
}

// Atualiza só a parte dinâmica (KPI + detalhe + lista) sem recriar a busca,
// pra não perder o foco enquanto você digita.
function hcRenderLista() {
  const daUni = hcFiltrados();
  const q = normalize(HC.busca);

  let detalhe = "";
  if (HC.sel >= 0 && daUni[HC.sel]) {
    const c = daUni[HC.sel];
    const nome = c.Nome || "—";
    const cargo = c.Cargo || c.Funcao || "—";
    const funcao = c.Funcao || c.Cargo || "—";
    const lider = c.Lider || "—";
    const salario = Number(c.Salario) || 0;
    detalhe = `<div class="card" style="border-left:5px solid var(--laranja)">
      <h3>👤 ${escapeHtml(nome)}</h3>
      <div class="grid g2">
        <div><small class="muted">Nome completo</small><div><b>${escapeHtml(nome)}</b></div></div>
        <div><small class="muted">Líder</small><div><b>${escapeHtml(lider)}</b></div></div>
        <div><small class="muted">Unidade</small><div>${escapeHtml(c.Unidade || "—")}</div></div>
        <div><small class="muted">Cargo</small><div>${escapeHtml(cargo)}</div></div>
        <div><small class="muted">Função</small><div>${escapeHtml(funcao)}</div></div>
        <div><small class="muted">Admissão</small><div>${hcData_(c.DataAdmissao)}</div></div>
        <div><small class="muted">Aniversário</small><div>${hcAniversario_(c.DataNascimento)}</div></div>
        <div><small class="muted">Salário</small><div><b>${fmtMoeda(salario)}</b></div></div>
        <div><small class="muted">Período de experiência</small><div>${escapeHtml(hcExperiencia_(c.FimExperiencia))}</div></div>
      </div>
    </div>`;
  }

  const semFiltro = !HC.unidade && !q;
  const lista = semFiltro
    ? `<div class="empty">Escolha uma unidade ou digite um nome para ver os colaboradores.</div>`
    : (daUni.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Nome</th><th>Unidade</th><th>Cargo / Função</th><th>Líder</th><th></th></tr></thead>
          <tbody>${daUni.map((c, i) => `<tr${i === HC.sel ? ' style="background:rgba(255,140,0,.08)"' : ""}>
            <td>${i + 1}</td>
            <td style="font-weight:600">${escapeHtml(c.Nome || "—")}</td>
            <td>${escapeHtml(c.Unidade || "—")}</td>
            <td>${escapeHtml(c.Cargo || c.Funcao || "—")}</td>
            <td>${escapeHtml(c.Lider || "—")}</td>
            <td><button class="btn btn-secondary" onclick="hcSelecionar(${i})">Ver detalhes</button></td>
          </tr>`).join("")}</tbody></table></div>`
      : `<div class="empty">Nenhum colaborador encontrado.</div>`);

  const titulo = HC.unidade ? "Colaboradores da unidade" : (q ? "Resultado da busca" : "Colaboradores");
  const kpi = (HC.unidade || q)
    ? `<div class="grid g4"><div class="kpi"><small>${HC.unidade ? "Ativos — " + escapeHtml(HC.unidade) : "Encontrados"}</small><strong>${daUni.length}</strong></div></div>`
    : "";

  const alvo = document.getElementById("hcDinamico");
  if (alvo) alvo.innerHTML = `${kpi}${detalhe}<div class="card"><h3>${titulo}</h3>${lista}</div>`;
}

function hcBuscar(v) { HC.busca = v; HC.sel = -1; hcRenderLista(); }
function hcMudarUnidade(u) { HC.unidade = u; HC.sel = -1; hcRenderLista(); }
function hcSelecionar(i) { HC.sel = i; hcRenderLista(); }

/* ===================== QUEM ESTÁ TESTANDO ===================== */

const ET = { todos: [], unidade: "", curriculos: [] };

/* ============ AGENDAR TESTE (RH) ============ */
async function renderTesteRH() {
  setMain(`
    <div class="page-title"><div><h2>Agendar Teste (RH)</h2><p>O RH agenda o candidato que vai fazer o teste na casa. O líder dá o parecer depois, em "Teste Prático".</p></div></div>

    <div class="card">
      <h3>Novo candidato para teste</h3>
      <div class="grid g3">
        <div class="form-row g2"><label>Nome completo *</label><input id="trNome" type="text" placeholder="Nome completo do candidato"></div>
        <div class="form-row"><label>Telefone</label><input id="trFone" type="text" placeholder="(85) 9 9999-9999"></div>
        <div class="form-row"><label>Função *</label><input id="trFuncao" type="text" list="dl-cargos" placeholder="Ex.: Garçom"></div>
        <div class="form-row"><label>Setor</label><input id="trSetor" type="text" placeholder="Ex.: Salão"></div>
        <div class="form-row"><label>Unidade *</label><input id="trUni" type="text" list="dl-unidades" placeholder="Unidade do teste"></div>
        <div class="form-row"><label>Líder direto</label><input id="trLider" type="text" list="dl-responsaveis" placeholder="Quem vai avaliar"></div>
        <div class="form-row"><label>Data do teste</label><input id="trData" type="date"></div>
        <div class="form-row"><label>Hora do teste</label><input id="trHora" type="time"></div>
      </div>

      <h4 style="margin:14px 0 6px">Passagem e fardamento</h4>
      <div class="grid g3">
        <div class="form-row"><label>Passagem — como será?</label>
          <select id="trPassagem">
            <option value="">Selecione...</option>
            <option value="RH entregou">RH entregou a passagem</option>
            <option value="Sangria no caixa">Sangria no caixa</option>
            <option value="PIX">PIX</option>
            <option value="Não precisa">Não precisa</option>
          </select>
        </div>
        <div class="form-row"><label>Passagem entregue?</label>
          <select id="trPassEnt"><option value="Não">Não</option><option value="Sim">Sim</option></select>
        </div>
        <div class="form-row"><label>Fardamento entregue?</label>
          <select id="trFardEnt"><option value="Não">Não</option><option value="Sim">Sim</option></select>
        </div>
        <div class="form-row"><label>Alinhado com o sócio operador?</label>
          <select id="trAlinhado"><option value="Não">Não</option><option value="Sim">Sim</option></select>
        </div>
        <div class="form-row"><label>Sócio operador</label><input id="trSocio" type="text" list="dl-responsaveis" placeholder="Quem foi alinhado"></div>
        <div class="form-row"><label>Currículo (PDF ou imagem)</label><input id="trCurriculo" type="file" accept=".pdf,.doc,.docx,image/*"></div>
      </div>

      <div class="form-row g3"><label>Observações</label><textarea id="trObs" rows="2" placeholder="Alguma informação importante..."></textarea></div>
      <div style="margin-top:10px"><button class="btn btn-primary" onclick="salvarTesteRH()">Agendar teste</button></div>
      <p class="muted" style="font-size:12px;margin-top:6px">O candidato aparece na hora em "Quem está testando" (com currículo e telefone) e na lista de parecer do líder.</p>
    </div>

    <div class="card">
      <h3>Testes agendados</h3>
      <div id="tabelaTesteRH"><div class="empty">Carregando...</div></div>
    </div>
  `);
  await carregarTabelaTesteRH();
}

async function carregarTabelaTesteRH() {
  try {
    const r = await api("listarTestesRH");
    STATE.testesRHCache = r.testesRH || [];
    const linhas = STATE.testesRHCache;
    if (!linhas.length) {
      document.getElementById("tabelaTesteRH").innerHTML = `<div class="empty">Nenhum teste agendado ainda.</div>`;
      return;
    }
    document.getElementById("tabelaTesteRH").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Data</th><th>Candidato</th><th>Função</th><th>Unidade</th><th>Telefone</th><th>Currículo</th><th>Passagem</th><th>Fardamento</th><th>Sócio</th><th>Status</th><th style="width:1%">Ações</th></tr></thead>
        <tbody>${linhas.map((t, i) => `<tr>
          <td>${formatarCelula("Data", t.DataTeste || t.Data)}</td>
          <td>${escapeHtml(t.NomeCompleto || "")}</td>
          <td>${escapeHtml(t.Funcao || "")}</td>
          <td>${escapeHtml(t.Unidade || "")}</td>
          <td>${escapeHtml(t.Telefone || "—")}</td>
          <td>${t.CurriculoUrl ? `<a href="${escapeHtml(t.CurriculoUrl)}" target="_blank" rel="noopener">📄 Abrir</a>` : "—"}</td>
          <td>${escapeHtml(t.Passagem || "—")}<br><span class="badge ${String(t.PassagemEntregue) === "Sim" ? "ok" : "warn"}">${String(t.PassagemEntregue) === "Sim" ? "Entregue" : "Pendente"}</span></td>
          <td><span class="badge ${String(t.FardamentoEntregue) === "Sim" ? "ok" : "warn"}">${String(t.FardamentoEntregue) === "Sim" ? "Entregue" : "Pendente"}</span></td>
          <td><span class="badge ${String(t.AlinhadoSocio) === "Sim" ? "ok" : "warn"}">${String(t.AlinhadoSocio) === "Sim" ? "Alinhado" : "Pendente"}</span>${t.Socio ? `<br>${escapeHtml(t.Socio)}` : ""}</td>
          <td>${formatarCelula("Status", t.Status)}</td>
          <td style="white-space:nowrap;text-align:right">
            <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" title="Marcar passagem entregue" onclick="marcarTesteRH(${i},'PassagemEntregue')">🎫</button>
            <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" title="Marcar fardamento entregue" onclick="marcarTesteRH(${i},'FardamentoEntregue')">👕</button>
            <button class="btn btn-secondary" style="padding:4px 8px;font-size:13px;color:#b91c1c" title="Excluir" onclick="excluirTesteRH(${i})">🗑️</button>
          </td>
        </tr>`).join("")}</tbody>
      </table></div>`;
  } catch (e) {
    document.getElementById("tabelaTesteRH").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

async function salvarTesteRH() {
  const nome = (el("#trNome").value || "").trim();
  const funcao = (el("#trFuncao").value || "").trim();
  const uni = (el("#trUni").value || "").trim();
  if (!nome) return toast("Informe o nome completo do candidato.", "err");
  if (!funcao) return toast("Informe a função.", "err");
  if (!uni) return toast("Informe a unidade.", "err");

  const dados = {
    NomeCompleto: nome, Funcao: funcao, Unidade: uni,
    Setor: (el("#trSetor").value || "").trim(),
    LiderDireto: (el("#trLider").value || "").trim(),
    Telefone: (el("#trFone").value || "").trim(),
    DataTeste: el("#trData").value, HoraTeste: el("#trHora").value,
    Passagem: el("#trPassagem").value, PassagemEntregue: el("#trPassEnt").value,
    FardamentoEntregue: el("#trFardEnt").value,
    AlinhadoSocio: el("#trAlinhado").value, Socio: (el("#trSocio").value || "").trim(),
    Observacoes: (el("#trObs").value || "").trim(), Status: "EM TESTE"
  };

  try {
    toggleLoading(true);
    // 1) sobe o currículo (se houver) e pega o link
    const inp = el("#trCurriculo");
    if (inp && inp.files && inp.files[0]) {
      const f = inp.files[0];
      if (f.size > 15 * 1024 * 1024) { toast("Currículo muito grande (máx. 15 MB).", "err"); }
      else {
        const b64 = await fileToBase64(f);
        const up = await apiUpload("uploadCurriculo", { Candidato: nome, candidato: nome, Unidade: uni, base64: b64, nomeArquivo: f.name, tipo: f.type || "application/pdf" });
        if (up && up.url) { dados.CurriculoUrl = up.url; dados.CurriculoNome = f.name; }
      }
    }
    // 2) salva o teste
    const r = await api("salvarTesteRH", dados);
    toast(r.msg || "Teste agendado.", "ok");
    ["#trNome", "#trFone", "#trFuncao", "#trSetor", "#trUni", "#trLider", "#trData", "#trHora", "#trSocio", "#trObs"].forEach(s => { if (el(s)) el(s).value = ""; });
    if (el("#trCurriculo")) el("#trCurriculo").value = "";
    await carregarTabelaTesteRH();
  } catch (e) {
    toast(e.message, "err");
  } finally {
    toggleLoading(false);
  }
}

async function marcarTesteRH(i, campo) {
  const t = (STATE.testesRHCache || [])[i]; if (!t) return;
  const novo = String(t[campo]) === "Sim" ? "Não" : "Sim";
  const dados = {}; dados[campo] = novo;
  try {
    await api("atualizarTesteRH", { index: i, dados: dados });
    toast((campo === "PassagemEntregue" ? "Passagem" : "Fardamento") + ": " + novo, "ok");
    await carregarTabelaTesteRH();
  } catch (e) { toast(e.message, "err"); }
}

async function excluirTesteRH(i) {
  const t = (STATE.testesRHCache || [])[i]; if (!t) return;
  if (!confirm(`Excluir o teste de "${t.NomeCompleto}"?`)) return;
  try {
    await api("excluirRegistroModulo", { sheetKey: "testesRH", index: i, confereCol: "NomeCompleto", confereVal: t.NomeCompleto });
    toast("Teste excluído.", "ok");
    await carregarTabelaTesteRH();
  } catch (e) { toast(e.message, "err"); }
}

/* ============ VALE TRANSPORTE (marcar em massa) ============ */
const VT = { todos: [], unidade: "" };

async function renderValeTransporte() {
  setMain(`<div class="loading">Carregando colaboradores...</div>`);
  try {
    const r = await api("listarVT");
    VT.todos = r.vt || [];
    vtRender();
  } catch (e) {
    setMain(`<div class="page-title"><div><h2>Vale Transporte</h2></div></div>
      <div class="card"><div class="msg err">${escapeHtml(e.message)}</div></div>`);
  }
}

function vtRender() {
  const unis = [...new Set(VT.todos.map(x => x.Unidade).filter(Boolean))].sort();
  const linhas = VT.unidade ? VT.todos.filter(x => normalize(x.Unidade) === normalize(VT.unidade)) : VT.todos;
  const comVT = VT.todos.filter(x => x.TemVT === "Sim");
  const totalDesconto = comVT.reduce((s, x) => s + (Number(x.ValorVT) || 0), 0);

  setMain(`
    <div class="page-title">
      <div><h2>Vale Transporte</h2><p>Marque quem recebe VT. O desconto de 6% é calculado <strong>na hora</strong> e já entra na folha.</p></div>
      <div style="min-width:230px">
        <label>Filtrar por Unidade</label>
        <select onchange="vtMudarUnidade(this.value)">
          <option value="">Todas as unidades</option>
          ${unis.map(u => `<option value="${escapeHtml(u)}" ${normalize(u) === normalize(VT.unidade) ? "selected" : ""}>${escapeHtml(u)}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="grid g4">
      <div class="kpi"><small>Colaboradores${VT.unidade ? " — " + escapeHtml(VT.unidade) : ""}</small><strong>${linhas.length}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Recebem VT</small><strong id="vtQtd">${comVT.length}</strong></div>
      <div class="kpi" style="border-left-color:var(--laranja)"><small>Desconto total de VT (6%)</small><strong id="vtTotal">${fmtMoeda(totalDesconto)}</strong></div>
    </div>

    <div class="card">
      <p class="muted" style="font-size:13px;margin:0 0 10px">Clique no ✅ de cada pessoa — <strong>salva automaticamente</strong>, não precisa de botão.</p>
      ${linhas.length ? `<div class="table-wrap"><table>
        <thead><tr><th style="width:1%">Recebe VT?</th><th>Colaborador</th><th>Unidade</th><th>Cargo</th><th>Salário</th><th>Desconto (6%)</th></tr></thead>
        <tbody>${linhas.map((x, i) => {
          const idx = VT.todos.indexOf(x);
          return `<tr id="vtrow_${idx}">
            <td style="text-align:center">
              <input type="checkbox" ${x.TemVT === "Sim" ? "checked" : ""} onchange="vtAlternar(${idx}, this.checked)" style="width:20px;height:20px;cursor:pointer">
            </td>
            <td style="font-weight:600">${escapeHtml(x.Nome)}</td>
            <td>${escapeHtml(x.Unidade || "—")}</td>
            <td>${escapeHtml(x.Cargo || "—")}</td>
            <td>${fmtMoeda(x.Bruto || 0)}</td>
            <td id="vtval_${idx}" style="font-weight:600;color:${x.TemVT === "Sim" ? "#b91c1c" : "#94a3b8"}">${x.TemVT === "Sim" ? "− " + fmtMoeda(x.ValorVT || 0) : "—"}</td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>` : `<div class="empty">Nenhum colaborador encontrado.</div>`}
    </div>
  `);
}

function vtMudarUnidade(u) { VT.unidade = u; vtRender(); }

// Marca/desmarca UMA pessoa e salva na hora. O cálculo do VT muda automaticamente.
async function vtAlternar(idx, marcado) {
  const p = VT.todos[idx]; if (!p) return;
  const antes = p.TemVT;
  p.TemVT = marcado ? "Sim" : "Não";

  // atualiza a tela na hora
  const cel = document.getElementById("vtval_" + idx);
  if (cel) {
    cel.textContent = marcado ? "− " + fmtMoeda(p.ValorVT || 0) : "—";
    cel.style.color = marcado ? "#b91c1c" : "#94a3b8";
  }
  const comVT = VT.todos.filter(x => x.TemVT === "Sim");
  const total = comVT.reduce((s, x) => s + (Number(x.ValorVT) || 0), 0);
  if (document.getElementById("vtQtd")) document.getElementById("vtQtd").textContent = comVT.length;
  if (document.getElementById("vtTotal")) document.getElementById("vtTotal").textContent = fmtMoeda(total);

  try {
    await api("salvarVTemMassa", { marcacoes: [{ Nome: p.Nome, CPF: p.CPF || "", TemVT: p.TemVT }] });
    toast(`${p.Nome}: VT ${marcado ? "ativado" : "removido"}.`, "ok");
  } catch (e) {
    p.TemVT = antes; // desfaz se falhou
    toast("Não consegui salvar: " + e.message, "err");
    vtRender();
  }
}

/* ============ QUEM ESTÁ TESTANDO ============ */
async function renderEmTeste() {
  setMain(`<div class="loading">Carregando testes...</div>`);
  try {
    const r = await api("listarTestesRH", {});
    // "Testando" = agendado pelo RH e ainda sem parecer final
    ET.todos = (r.testesRH || []).filter(t => {
      const s = normalize(t.Status);
      return s === "" || s === "EM TESTE" || s === "EM ANDAMENTO" || s === "TESTANDO";
    });
    etRender();
  } catch (e) {
    setMain(`<div class="page-title"><div><h2>Quem está testando</h2></div></div>
      <div class="card"><div class="msg err">Não consegui carregar: ${escapeHtml(e.message)}</div></div>`);
  }
}

function etRender() {
  const unis = [...new Set(ET.todos.map(t => String(t.Unidade || "").trim()).filter(Boolean))].sort();
  const linhas = ET.unidade
    ? ET.todos.filter(t => normalize(t.Unidade) === normalize(ET.unidade))
    : ET.todos;

  const sim = (v) => String(v) === "Sim";
  const tabela = linhas.length
    ? `<div class="table-wrap"><table>
        <thead><tr><th>Candidato</th><th>Função</th><th>Unidade</th><th>Telefone</th><th>Currículo</th><th>Passagem</th><th>Fardamento</th><th>Sócio alinhado</th><th>Líder</th></tr></thead>
        <tbody>${linhas.map(t => `<tr>
          <td style="font-weight:600">${escapeHtml(t.NomeCompleto || "—")}</td>
          <td>${escapeHtml(t.Funcao || "—")}</td>
          <td>${escapeHtml(t.Unidade || "—")}</td>
          <td>${escapeHtml(t.Telefone || "—")}</td>
          <td>${t.CurriculoUrl ? `<a class="btn btn-secondary" style="padding:4px 8px;font-size:12px" href="${escapeHtml(t.CurriculoUrl)}" target="_blank" rel="noopener">Ver / Baixar</a>` : "—"}</td>
          <td>${escapeHtml(t.Passagem || "—")}<br><span class="badge ${sim(t.PassagemEntregue) ? "ok" : "warn"}">${sim(t.PassagemEntregue) ? "Entregue" : "Pendente"}</span></td>
          <td><span class="badge ${sim(t.FardamentoEntregue) ? "ok" : "warn"}">${sim(t.FardamentoEntregue) ? "Entregue" : "Pendente"}</span></td>
          <td><span class="badge ${sim(t.AlinhadoSocio) ? "ok" : "warn"}">${sim(t.AlinhadoSocio) ? "Sim" : "Não"}</span>${t.Socio ? `<br><span class="muted" style="font-size:12px">${escapeHtml(t.Socio)}</span>` : ""}</td>
          <td>${escapeHtml(t.LiderDireto || "—")}</td>
        </tr>`).join("")}</tbody></table></div>`
    : `<div class="empty">Ninguém em teste no momento. O RH agenda em "Agendar Teste (RH)".</div>`;

  const pendPass = linhas.filter(t => !sim(t.PassagemEntregue) && normalize(t.Passagem) !== "NAO PRECISA").length;
  const pendFard = linhas.filter(t => !sim(t.FardamentoEntregue)).length;
  const sangria = linhas.filter(t => normalize(t.Passagem) === "SANGRIA NO CAIXA").length;

  setMain(`
    <div class="page-title">
      <div><h2>Quem está testando</h2><p>Candidatos com teste em andamento.</p></div>
      <div style="min-width:230px">
        <label>Filtrar por Unidade</label>
        <select onchange="etMudarUnidade(this.value)">
          <option value="">Todas as unidades</option>
          ${unis.map(u => `<option value="${escapeHtml(u)}" ${normalize(u) === normalize(ET.unidade) ? "selected" : ""}>${escapeHtml(u)}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="grid g4">
      <div class="kpi"><small>Em teste${ET.unidade ? " — " + escapeHtml(ET.unidade) : ""}</small><strong>${linhas.length}</strong></div>
      <div class="kpi" style="border-left-color:var(--warn)"><small>Passagem pendente</small><strong>${pendPass}</strong></div>
      <div class="kpi" style="border-left-color:var(--warn)"><small>Fardamento pendente</small><strong>${pendFard}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Passagem via sangria</small><strong>${sangria}</strong></div>
    </div>
    <div class="card"><h3>🧪 Em teste</h3>${tabela}</div>
  `);
}

function etMudarUnidade(u) { ET.unidade = u; etRender(); }

/* ===================== ABSENTEÍSMO (lançamento) ===================== */

const AB = { mapaUni: {} };

async function renderAbsenteismo() {
  setMain(`<div class="loading">Carregando...</div>`);
  let cols = [];
  try { const r = await api("listarHeadcount"); cols = r.headcount || []; } catch (e) {}
  AB.mapaUni = {};
  cols.forEach(c => { if (c.Nome) AB.mapaUni[normalize(c.Nome)] = c.Unidade || ""; });
  const nomes = cols.map(c => c.Nome).filter(Boolean).sort();

  setMain(`
    <div class="page-title">
      <div><h2>Absenteísmo</h2><p>Lance atestados e faltas por colaborador. Cada lançamento já vai para o dossiê e entra no cálculo do absenteísmo.</p></div>
    </div>

    <div class="card">
      <h3>Novo lançamento</h3>
      <div class="grid g3">
        <div class="form-row"><label>Colaborador *</label><input id="abColab" list="dl-colaboradores" placeholder="Nome do colaborador" onchange="abPreencherUnidade()"></div>
        <div class="form-row"><label>Unidade</label><input id="abUnidade" list="dl-unidades" placeholder="Unidade"></div>
        <div class="form-row"><label>Data *</label><input id="abData" type="date"></div>
        <div class="form-row"><label>Tipo *</label>
          <select id="abTipo"><option value="">Selecione...</option><option>Atestado</option><option>Falta Injustificada</option><option>Falta Justificada</option></select></div>
        <div class="form-row"><label>Dias</label><input id="abDias" type="number" min="1" step="1" value="1"></div>
        <div class="form-row"><label>Motivo / CID</label><input id="abMotivo" placeholder="Ex.: gripe (CID J11)"></div>
        <div class="form-row"><label>Anexar atestado (PDF/imagem)</label><input id="abAtestado" type="file" accept=".pdf,image/*"></div>
        <div class="form-row"><label>Dias previstos no mês <span class="muted">(opcional — p/ calcular %)</span></label><input id="abDiasPrev" type="number" min="0" step="1" placeholder="Ex.: 26"></div>
      </div>
      <div class="form-row"><label>Observações</label><textarea id="abObs"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="abSalvar()">Lançar</button></div>
    </div>

    <div class="card">
      <h3>Lançamentos (acumulado do mês por colaborador)</h3>
      <div id="abTabela"><div class="loading">Carregando...</div></div>
    </div>
  `);
  setDatalist("dl-colaboradores", (STATE.init.colaboradores || []).map(c => c.Nome));
  await abCarregarTabela();
}

function abPreencherUnidade() {
  const nome = el("#abColab").value.trim();
  const uni = AB.mapaUni[normalize(nome)];
  const campo = el("#abUnidade");
  if (uni && campo && !campo.value) campo.value = uni;
}

async function abSalvar() {
  const colab = el("#abColab").value.trim();
  const data = el("#abData").value;
  const tipo = el("#abTipo").value;
  if (!colab || !data || !tipo) { toast("Preencha Colaborador, Data e Tipo.", "err"); return; }
  const dados = {
    Colaborador: colab,
    Unidade: el("#abUnidade").value.trim(),
    Data: data,
    Tipo: tipo,
    Dias: el("#abDias").value || 1,
    Motivo: el("#abMotivo").value.trim(),
    DiasEscala: el("#abDiasPrev").value || 0,
    Observacoes: el("#abObs").value.trim()
  };
  try {
    const r = await api("registrarAbsenteismo", dados);
    toast(r.msg || "Lançado.", "ok");
    // anexa o atestado (se houver) -> vai pro Drive, pro dossiê e fica ligado ao lançamento
    const fa = el("#abAtestado");
    if (fa && fa.files && fa.files[0]) {
      const f = fa.files[0];
      if (f.size > 15 * 1024 * 1024) { toast("Atestado muito grande (máx. 15 MB).", "err"); }
      else {
        try {
          toast("Enviando atestado...", "info");
          toggleLoading(true);
          const b64 = await fileToBase64(f);
          const dt = new Date(data + "T12:00:00");
          const up = await apiUpload("uploadAtestado", {
            Colaborador: colab, cpf: "",
            Mes: dt.getMonth() + 1, Ano: dt.getFullYear(),
            nomeArquivo: "Atestado " + data + " - " + f.name,
            tipo: f.type || "application/pdf",
            base64: b64
          });
          if (up && up.url) toast("Atestado anexado ao dossiê. ✅", "ok");
          else toast("Atestado enviado. Confira no dossiê do colaborador.", "ok");
          if (el("#abAtestado")) el("#abAtestado").value = "";
        } catch (e) { toast("Atestado não anexado: " + e.message, "err"); }
        finally { toggleLoading(false); }
      }
    }
    await renderAbsenteismo();
  } catch (e) { toast(e.message, "err"); }
}

async function abCarregarTabela() {
  try {
    const r = await api("listarAbsenteismo");
    const linhas = r.absenteismo || [];
    const cols = ["Mes", "Ano", "Colaborador", "Unidade", "Atestados", "FaltasInjustificadas", "FaltasJustificadas", "PercentualAbsenteismo"];
    document.getElementById("abTabela").innerHTML = linhas.length
      ? `<div class="table-wrap"><table>
          <thead><tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join("")}<th>Atestado</th></tr></thead>
          <tbody>${linhas.map(l => `<tr>
            ${cols.map(c => `<td>${formatarCelula(c, l[c])}</td>`).join("")}
            <td>${l.AtestadoUrl
              ? String(l.AtestadoUrl).split("|").map((u, i) => `<a href="${escapeHtml(u.trim())}" target="_blank" rel="noopener" style="margin-right:6px">📄 Ver${i > 0 ? " " + (i + 1) : ""}</a>`).join("")
              : "—"}</td>
          </tr>`).join("")}</tbody>
        </table></div>`
      : `<div class="empty">Nenhum lançamento ainda.</div>`;
  } catch (e) {
    document.getElementById("abTabela").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

/* ===================== TREINAMENTOS ===================== */

const TRN = { unidade: "", nomes: [], sel: {} };

async function renderTreinamentos() {
  setMain(`<div class="loading">Carregando...</div>`);
  TRN.unidade = ""; TRN.nomes = []; TRN.sel = {};
  setDatalist("dl-gestores", todosGestores());
  setMain(`
    <div class="page-title"><div><h2>Treinamentos</h2><p>Escolha a unidade, o líder e o tipo, e marque os colaboradores participantes daquela unidade.</p></div></div>

    <div class="card">
      <h3>Novo treinamento</h3>
      <div class="grid g3">
        <div class="form-row"><label>Unidade *</label><input id="trnUni" list="dl-unidades" placeholder="Unidade" onchange="trnMudarUnidade(this.value)"></div>
        <div class="form-row"><label>Líder responsável</label><input id="trnLider" list="dl-gestores" placeholder="Todos os gestores / diretoria"></div>
        <div class="form-row"><label>Tipo *</label>
          <select id="trnTipo"><option value="">Selecione...</option><option>Prático</option><option>Gestão</option><option>Operacional</option><option>Teórico</option></select></div>
        <div class="form-row"><label>Tema *</label><input id="trnTema" placeholder="Tema do treinamento"></div>
        <div class="form-row"><label>Data</label><input id="trnData" type="date"></div>
        <div class="form-row"><label>Ministrante / Instrutor</label><input id="trnMinistrante" list="dl-ministrantes"></div>
        <div class="form-row"><label>Horas</label><input id="trnHoras" type="number" min="0" step="0.5" placeholder="Ex.: 2"></div>
      </div>
      <div class="form-row"><label>Participantes (colaboradores da unidade)</label>
        <div id="trnParticipantes"><div class="muted">Escolha a unidade para listar os colaboradores.</div></div>
      </div>
      <div class="form-row"><label>Observações</label><textarea id="trnObs"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="trnSalvar()">Salvar treinamento</button></div>
    </div>

    <div class="card"><h3>Treinamentos registrados</h3><div id="trnTabela"><div class="loading">Carregando...</div></div></div>
  `);
  await trnCarregarTabela();
}

function trnMudarUnidade(u) {
  TRN.unidade = u; TRN.sel = {};
  trnRenderParticipantes();
}

function trnRenderParticipantes() {
  const alvo = document.getElementById("trnParticipantes");
  if (!alvo) return;
  const u = normalize(TRN.unidade);
  TRN.nomes = (STATE.init.colaboradores || [])
    .filter(c => u && normalize(c.Unidade) === u)
    .map(c => c.Nome).filter(Boolean).sort();
  if (!u) { alvo.innerHTML = `<div class="muted">Escolha a unidade para listar os colaboradores.</div>`; return; }
  if (!TRN.nomes.length) { alvo.innerHTML = `<div class="muted">Nenhum colaborador nesta unidade.</div>`; return; }
  alvo.innerHTML = `
    <div style="margin-bottom:6px"><button class="btn btn-secondary" onclick="trnMarcarTodos(true)">Marcar todos</button>
      <button class="btn btn-secondary" onclick="trnMarcarTodos(false)">Limpar</button></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px 18px">
      ${TRN.nomes.map((n, i) => `<label style="display:flex;gap:6px;align-items:center;min-width:230px">
        <input type="checkbox" ${TRN.sel[i] ? "checked" : ""} onchange="trnToggle(${i}, this.checked)"> ${escapeHtml(n)}</label>`).join("")}
    </div>`;
}

function trnToggle(i, on) { if (on) TRN.sel[i] = true; else delete TRN.sel[i]; }
function trnMarcarTodos(on) {
  TRN.sel = {};
  if (on) TRN.nomes.forEach((_, i) => TRN.sel[i] = true);
  trnRenderParticipantes();
}

async function trnSalvar() {
  const uni = el("#trnUni").value.trim();
  const tema = el("#trnTema").value.trim();
  const tipo = el("#trnTipo").value;
  if (!uni || !tema || !tipo) { toast("Preencha Unidade, Tema e Tipo.", "err"); return; }
  const participantes = Object.keys(TRN.sel).map(i => TRN.nomes[i]).filter(Boolean);
  const horas = el("#trnHoras").value || 0;
  const dados = {
    Data: el("#trnData").value,
    Unidade: uni,
    Tema: tema,
    Tipo: tipo,
    LiderResponsavel: el("#trnLider").value.trim(),
    Ministrante: el("#trnMinistrante").value.trim(),
    HorasDadas: horas,
    HorasAssistidas: horas,
    ParticipantesManuais: participantes.join(", "),
    Observacoes: el("#trnObs").value.trim()
  };
  try {
    const r = await api("salvarTreinamento", dados);
    toast(r.msg || "Treinamento salvo.", "ok");
    await renderTreinamentos();
  } catch (e) { toast(e.message, "err"); }
}

async function trnCarregarTabela() {
  try {
    const r = await api("listarTreinamentos");
    const linhas = r.treinamentos || [];
    document.getElementById("trnTabela").innerHTML =
      tabelaComBadge(linhas, ["Data", "Unidade", "Tema", "Tipo", "LiderResponsavel", "HorasDadas"]);
  } catch (e) {
    document.getElementById("trnTabela").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

/* ===================== DASHBOARD ===================== */

function tabelaIndicadoresMensais(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum indicador lançado ainda. Vá em "Indicadores" e cadastre o mês, admissões e desligamentos por unidade.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Período</th><th>Unidade</th><th>Ativos</th><th>Admissões</th><th>Desligamentos</th><th>Turnover</th><th>Absenteísmo</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Periodo)}</td>
      <td>${escapeHtml(l.Unidade)}</td>
      <td>${escapeHtml(l.Ativos)}</td>
      <td>${escapeHtml(l.Admissoes)}</td>
      <td>${escapeHtml(l.Desligamentos)}</td>
      <td><span class="badge ${l.Turnover >= 5 ? "warn" : "ok"}">${escapeHtml(l.Turnover)}%</span></td>
      <td><span class="badge ${l.Absenteismo >= 5 ? "bad" : (l.Absenteismo >= 3 ? "warn" : "ok")}">${escapeHtml(l.Absenteismo)}%</span></td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaTurnover(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Sem dados de turnover.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Unidade</th><th>Ativos</th><th>Admissões (mês)</th><th>Desligamentos (mês)</th><th>Turnover</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Unidade)}</td><td>${escapeHtml(l.Ativos)}</td>
      <td>${escapeHtml(l.Admissoes)}</td><td>${escapeHtml(l.Desligamentos)}</td>
      <td><span class="badge ${l.Turnover >= 5 ? "warn" : "ok"}">${escapeHtml(l.Turnover)}%</span></td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaAbsenteismo(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum absenteísmo lançado ainda. Registre em "Absenteísmo".</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Unidade</th><th>Absenteísmo</th><th>Atestados</th><th>Faltas Injustificadas</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Unidade)}</td>
      <td><span class="badge ${l.Absenteismo >= 5 ? "bad" : (l.Absenteismo >= 3 ? "warn" : "ok")}">${escapeHtml(l.Absenteismo)}%</span></td>
      <td>${escapeHtml(l.Atestados)}</td><td>${escapeHtml(l.FaltasInjustificadas)}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaExperiencia(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Ninguém em período de experiência nesta seleção.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Colaborador</th><th>Unidade</th><th>Cargo</th><th>Fim da Experiência</th><th>Dias Restantes</th></tr></thead>
    <tbody>${linhas.map(l => {
      const badge = l.DiasRestantes <= 7 ? "bad" : (l.DiasRestantes <= 15 ? "warn" : "ok");
      return `<tr>
        <td style="font-weight:700">${escapeHtml(l.Nome)}</td>
        <td>${escapeHtml(l.Unidade)}</td>
        <td>${escapeHtml(l.Cargo)}</td>
        <td>${escapeHtml(l.FimExperiencia)}</td>
        <td><span class="badge ${badge}">${escapeHtml(l.DiasRestantes)} dias</span></td>
      </tr>`;
    }).join("")}</tbody></table></div>`;
}

function tabelaPorUnidade(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhuma unidade.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Unidade</th><th>Headcount</th><th>Vagas Abertas</th><th>Folha (ativos)</th><th>Faturamento</th><th>Faturamento / Colaborador</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td style="font-weight:700">${escapeHtml(l.Unidade)}</td>
      <td>${escapeHtml(l.Headcount)}</td>
      <td>${escapeHtml(l.VagasAbertas)}</td>
      <td>${fmtMoeda(l.Folha)}</td>
      <td>${l.Faturamento ? fmtMoeda(l.Faturamento) : "—"}</td>
      <td>${l.Faturamento ? fmtMoeda(l.FatPorColab) : "—"}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaSlaMes(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Sem vagas encerradas para calcular SLA.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mês</th><th>Vagas Encerradas</th><th>Tempo Médio (dias)</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Mes)}</td><td>${escapeHtml(l.Encerradas)}</td>
      <td>${l.SLADias === "" ? "—" : escapeHtml(l.SLADias) + " dias"}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaSlaUnidade(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Sem vagas encerradas para calcular SLA.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Unidade</th><th>Encerradas</th><th>Tempo Médio (dias)</th><th>Em Aberto Fora do SLA</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Unidade)}</td><td>${escapeHtml(l.Encerradas)}</td>
      <td>${l.SLADias === "" ? "—" : escapeHtml(l.SLADias)}</td>
      <td>${l.ForaSLA > 0 ? `<span class="badge bad">${escapeHtml(l.ForaSLA)}</span>` : escapeHtml(l.ForaSLA)}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function tabelaIndicadores(linhas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum indicador cadastrado. Edite em "Indicadores Mensais".</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Unidade</th><th>Turnover</th><th>Absenteísmo</th><th>Período</th></tr></thead>
    <tbody>${linhas.map(l => `<tr>
      <td>${escapeHtml(l.Unidade)}</td><td>${escapeHtml(l.Turnover)}%</td>
      <td>${escapeHtml(l.Absenteismo)}%</td><td>${escapeHtml(l.Periodo)}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

async function renderDashboard(unidade) {
  setMain(`<div class="loading">Carregando dashboard...</div>`);
  let r;
  try {
    r = await api("dashboard", unidade ? { unidade: unidade } : {});
  } catch (e) {
    setMain(`<div class="page-title"><div><h2>Dashboard</h2></div></div>
      <div class="card"><div class="msg err">Não consegui carregar o dashboard: ${escapeHtml(e.message)}</div>
      <p class="muted">Se aparecer "Ação desconhecida" ou demorar muito, publique a Nova versão do Code.gs no Apps Script.</p></div>`);
    return;
  }
  const dash = r.dashboard || {};
  const k = dash.kpis || {};
  const unis = dash.unidades || [];
  const sel = dash.filtroUnidade || "";

  let aviso = "";
  if (k.folhaTotal === undefined) {
    aviso = `<div class="msg err">⚠️ O backend (Code.gs) está desatualizado. Cole o Code.gs novo e publique <b>Nova versão</b> no Apps Script — sem isso, folha, custo projetado e SLA por mês não funcionam.</div>`;
  } else if (k.folhaTotal === 0) {
    aviso = `<div class="msg warn">⚠️ O backend está atualizado, mas não achei os salários. Provável causa: a coluna de <b>Cargo</b> na aba Colaboradores tem nome diferente, ou os cargos não batem com a tabela de salários. Me manda os cabeçalhos da aba Colaboradores.</div>`;
  }

  setMain(`
    <div class="page-title">
      <div><h2>Dashboard</h2><p>Visão geral da operação${sel ? " — " + escapeHtml(sel) : ""}.${dash.geradoEm ? ` <span class="muted" style="font-size:12px">Atualizado em ${escapeHtml(dash.geradoEm)}</span>` : ""}</p></div>
      <div style="min-width:230px">
        <label>Filtrar por Unidade</label>
        <select onchange="renderDashboard(this.value)">
          <option value="">Todas as unidades</option>
          ${unis.map(u => `<option value="${escapeHtml(u)}" ${normalize(u) === normalize(sel) ? "selected" : ""}>${escapeHtml(u)}</option>`).join("")}
        </select>
      </div>
    </div>

    ${aviso}

    ${(dash.avisos && dash.avisos.length) ? `<div class="card" style="border-left:5px solid var(--laranja)">
      <h3>📢 Avisos</h3>
      ${dash.avisos.map(a => `<div class="msg ${normalize(a.Prioridade) === "URGENTE" || normalize(a.Prioridade) === "CRITICA" ? "err" : "info"}" style="text-align:left"><strong>${escapeHtml(a.Titulo || "")}</strong><br>${escapeHtml(a.Mensagem || "")}</div>`).join("")}
    </div>` : ""}

    ${(dash.insights && dash.insights.length) ? `<div class="card" style="border-left:5px solid var(--info)">
      <h3>🤖 Insights da EVA</h3>
      ${dash.insights.map(i => `<div style="padding:6px 0;border-bottom:1px solid var(--border)">${escapeHtml(i)}</div>`).join("")}
    </div>` : ""}

    <div class="grid g4">
      <div class="kpi"><small>Headcount Ativo</small><strong>${k.headcount}</strong></div>
      <div class="kpi"><small>Vagas em Aberto</small><strong>${k.vagasAbertas}</strong></div>
      <div class="kpi"><small>Custo Projetado</small><strong>${fmtMoeda(k.custoProjetado)}</strong></div>
      <div class="kpi" style="border-left-color:var(--laranja);min-width:280px">
        <small>💰 FOLHA REAL (MÊS)</small>
        <strong>${fmtMoeda(k.folhaReal || k.folhaTotal)}</strong>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b">
          <div style="display:flex;justify-content:space-between"><span>Bruto</span><span>${fmtMoeda(k.folhaBruta || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;color:#b91c1c"><span>(−) INSS, VT e utensílios</span><span>− ${fmtMoeda((k.folhaBruta || 0) - (k.folhaTotal || 0))}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:600;color:#334155"><span>= Líquido</span><span>${fmtMoeda(k.folhaTotal || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;color:#0369a1"><span>(+) Variável liderança</span><span>+ ${fmtMoeda(k.variavelMes || 0)}</span></div>
        </div>
      </div>
      <div class="kpi" style="border-left-color:var(--info)"><small>SLA Médio de Fechamento</small><strong>${k.slaMedioGeral || 0} dias</strong></div>
      <div class="kpi"><small>Testes no Mês</small><strong>${k.testesMes}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Candidatos em Teste (vagas)</small><strong>${k.candidatosEmTeste || 0}</strong></div>
      <div class="kpi"><small>Aniversariantes do Mês</small><strong>${k.aniversariantes}</strong></div>
      <div class="kpi" style="border-left-color:var(--warn)"><small>Em Período de Experiência</small><strong>${k.emExperiencia || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Integrados no Mês</small><strong>${k.integradosMes || 0}</strong></div>
      <div class="kpi"><small>Itens em Estoque Crítico</small><strong>${k.estoqueCritico}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Treinamentos no Mês</small><strong>${k.treinamentosMes || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Horas de Treinamento (mês)</small><strong>${k.horasTreinMes || 0}h</strong></div>
    </div>

    <div class="card">
      <h3>👥 Headcount, Folha e Faturamento por Unidade</h3>
      ${tabelaPorUnidade(dash.porUnidade)}
    </div>

    <div class="grid g2">
      <div class="card">
        <h3>⏱️ SLA de Vagas por Mês <span class="muted" style="font-weight:400;font-size:12px">(tempo médio de fechamento)</span></h3>
        ${tabelaSlaMes(dash.slaPorMes)}

        <h4 style="margin:16px 0 6px">📊 Média do GRUPO por mês <span class="muted" style="font-weight:400;font-size:12px">(todas as unidades juntas)</span></h4>
        ${(dash.slaGrupoPorMes && dash.slaGrupoPorMes.length)
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Mês</th><th>Vagas fechadas</th><th>Tempo médio</th></tr></thead>
              <tbody>${dash.slaGrupoPorMes.map(s => `<tr>
                <td>${escapeHtml(s.Mes)}</td>
                <td>${escapeHtml(s.Encerradas)}</td>
                <td><span class="badge ${Number(s.SLADias) > 30 ? "bad" : (Number(s.SLADias) > 20 ? "warn" : "ok")}">${s.SLADias !== "" ? escapeHtml(s.SLADias) + " dias" : "—"}</span></td>
              </tr>`).join("")}</tbody>
            </table></div>`
          : `<div class="empty">Nenhuma vaga encerrada ainda.</div>`}

        <h4 style="margin:16px 0 6px">🏬 Por mês de cada unidade</h4>
        ${(dash.slaPorMesUnidade && dash.slaPorMesUnidade.length)
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Mês</th><th>Unidade</th><th>Vagas fechadas</th><th>Tempo médio</th></tr></thead>
              <tbody>${dash.slaPorMesUnidade.map(s => `<tr>
                <td>${escapeHtml(s.Mes)}</td>
                <td style="font-weight:600">${escapeHtml(s.Unidade)}</td>
                <td>${escapeHtml(s.Encerradas)}</td>
                <td><span class="badge ${Number(s.SLADias) > 30 ? "bad" : (Number(s.SLADias) > 20 ? "warn" : "ok")}">${s.SLADias !== "" ? escapeHtml(s.SLADias) + " dias" : "—"}</span></td>
              </tr>`).join("")}</tbody>
            </table></div>`
          : `<div class="empty">Nenhuma vaga encerrada por unidade ainda.</div>`}
      </div>
      <div class="card">
        <h3>🔄 Turnover por Unidade <span class="muted" style="font-weight:400;font-size:12px">(mês atual — admissões/desligamentos automáticos)</span></h3>
        ${tabelaTurnover(dash.turnoverAuto || [])}
      </div>
    </div>

    <div class="card">
      <h3>🏢 Grupo Evol — Consolidado <span class="muted" style="font-weight:400;font-size:12px">(todas as unidades juntas, mês atual)</span></h3>
      <div class="grid g4">
        <div class="kpi"><small>Ativos no grupo</small><strong>${(dash.grupoConsolidado && dash.grupoConsolidado.Ativos) || 0}</strong></div>
        <div class="kpi"><small>Admissões no mês</small><strong>${(dash.grupoConsolidado && dash.grupoConsolidado.Admissoes) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--warn)"><small>Desligamentos no mês</small><strong>${(dash.grupoConsolidado && dash.grupoConsolidado.Desligamentos) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--laranja)"><small>🔄 Turnover do GRUPO</small><strong>${(dash.grupoConsolidado && dash.grupoConsolidado.Turnover) || 0}%</strong></div>
        <div class="kpi" style="border-left-color:var(--info)"><small>🩺 Absenteísmo do GRUPO</small><strong>${(dash.grupoConsolidado && dash.grupoConsolidado.Absenteismo) || 0}%</strong></div>
      </div>
    </div>

    <div class="card">
      <h3>🏬 Turnover e Absenteísmo por Setor <span class="muted" style="font-weight:400;font-size:12px">(setor dentro de cada unidade)</span></h3>
      ${(dash.porUnidadeSetor && dash.porUnidadeSetor.length)
        ? `<div class="table-wrap"><table>
            <thead><tr><th>Unidade</th><th>Setor</th><th>Ativos</th><th>Admissões</th><th>Desligamentos</th><th>Turnover</th><th>Absenteísmo</th></tr></thead>
            <tbody>${dash.porUnidadeSetor.map(s => `<tr>
              <td>${escapeHtml(s.Unidade)}</td>
              <td style="font-weight:600">${escapeHtml(s.Setor)}</td>
              <td>${escapeHtml(s.Ativos)}</td>
              <td>${escapeHtml(s.Admissoes)}</td>
              <td>${escapeHtml(s.Desligamentos)}</td>
              <td><span class="badge ${s.Turnover >= 5 ? "warn" : "ok"}">${escapeHtml(s.Turnover)}%</span></td>
              <td><span class="badge ${s.Absenteismo >= 5 ? "bad" : (s.Absenteismo >= 3 ? "warn" : "ok")}">${escapeHtml(s.Absenteismo)}%</span></td>
            </tr>`).join("")}</tbody>
          </table></div>`
        : `<div class="empty">Sem dados por setor ainda. Preencha o Setor no cadastro dos colaboradores.</div>`}
    </div>

    <div class="card">
      <h3>💵 Variável da Liderança <span class="muted" style="font-weight:400;font-size:12px">(entra na folha real)</span></h3>
      <div class="grid g4">
        <div class="kpi"><small>Variável no mês</small><strong>${fmtMoeda((dash.kpis && dash.kpis.variavelMes) || 0)}</strong></div>
        <div class="kpi" style="border-left-color:var(--info)"><small>Variável acumulada</small><strong>${fmtMoeda((dash.kpis && dash.kpis.variavelTotal) || 0)}</strong></div>
      </div>
      ${(dash.variavelPorUnidade && dash.variavelPorUnidade.length)
        ? `<h4 style="margin:14px 0 6px">Por unidade</h4>
           <div class="table-wrap"><table>
             <thead><tr><th>Unidade</th><th>Líderes</th><th>Total pago</th></tr></thead>
             <tbody>${dash.variavelPorUnidade.map(v => `<tr>
               <td>${escapeHtml(v.Unidade)}</td><td>${escapeHtml(v.Lideres)}</td><td>${fmtMoeda(v.Total)}</td>
             </tr>`).join("")}</tbody>
           </table></div>`
        : ""}
      ${(dash.variavelLista && dash.variavelLista.length)
        ? `<h4 style="margin:14px 0 6px">Lançamentos</h4>
           <div class="table-wrap"><table>
             <thead><tr><th>Período</th><th>Unidade</th><th>Quem recebeu</th><th>Cargo</th><th>Tipo</th><th>Valor</th><th>Pago?</th></tr></thead>
             <tbody>${dash.variavelLista.map(v => `<tr>
               <td>${escapeHtml(v.Periodo)}</td>
               <td>${escapeHtml(v.Unidade)}</td>
               <td style="font-weight:600">${escapeHtml(v.Colaborador)}</td>
               <td>${escapeHtml(v.Cargo || "—")}</td>
               <td>${escapeHtml(v.TipoVariavel || "—")}</td>
               <td>${fmtMoeda(v.Valor)}</td>
               <td><span class="badge ${String(v.Pago) === "Sim" ? "ok" : "warn"}">${escapeHtml(v.Pago || "—")}</span></td>
             </tr>`).join("")}</tbody>
           </table></div>`
        : `<div class="empty">Nenhuma variável lançada. Cadastre em "Variável da Liderança".</div>`}
    </div>

    <div class="card">
      <h3>📊 Turnover e Absenteísmo por Mês <span class="muted" style="font-weight:400;font-size:12px">(do que você lança em Indicadores — turnover calculado)</span></h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px">
        <div class="kpi" style="flex:1;min-width:180px"><small>Turnover médio (geral)</small><strong>${(dash.mediaTurnover != null ? dash.mediaTurnover : 0)}%</strong></div>
        <div class="kpi" style="flex:1;min-width:180px;border-left-color:var(--info)"><small>Absenteísmo médio (geral)</small><strong>${(dash.mediaAbsenteismo != null ? dash.mediaAbsenteismo : 0)}%</strong></div>
      </div>
      ${tabelaIndicadoresMensais(dash.indicadoresMensais || [])}
    </div>

    <div class="card">
      <h3>🚪 Entrevistas de Desligamento</h3>
      <div class="grid g4">
        <div class="kpi"><small>Desligamentos no mês</small><strong>${(dash.desligamentos && dash.desligamentos.noMes) || 0}</strong></div>
        <div class="kpi"><small>Voluntários (pediram)</small><strong>${(dash.desligamentos && dash.desligamentos.voluntarios) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--warn)"><small>Involuntários (empresa)</small><strong>${(dash.desligamentos && dash.desligamentos.involuntarios) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--info)"><small>Recontrataria</small><strong>${(dash.desligamentos && dash.desligamentos.recontratariaPct) || 0}%</strong></div>
        <div class="kpi"><small>Fizeram a entrevista</small><strong>${(dash.desligamentos && dash.desligamentos.responderam) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--warn)"><small>Recusaram / não localizadas</small><strong>${(dash.desligamentos && dash.desligamentos.recusaram) || 0}</strong></div>
      </div>

      ${(dash.desligamentos && dash.desligamentos.lista && dash.desligamentos.lista.length)
        ? `<h4 style="margin:14px 0 6px">Pessoas desligadas</h4>
           <div class="table-wrap"><table>
             <thead><tr><th>Colaborador</th><th>Unidade</th><th>Cargo</th><th>Líder</th><th>Data</th><th>Tipo</th><th>Motivo(s)</th><th>Fez entrevista?</th><th>Preenchido por</th></tr></thead>
             <tbody>${dash.desligamentos.lista.map(x => `<tr>
               <td style="font-weight:600">${escapeHtml(x.Colaborador || "—")}</td>
               <td>${escapeHtml(x.Unidade || "—")}</td>
               <td>${escapeHtml(x.Cargo || "—")}</td>
               <td>${escapeHtml(x.LiderDireto || "—")}</td>
               <td>${formatarCelula("Data", x.DataDesligamento)}</td>
               <td>${escapeHtml(x.TipoDesligamento || "—")}</td>
               <td>${escapeHtml(x.Motivo || "—")}</td>
               <td><span class="badge ${normalize(x.QuisFazerEntrevista).indexOf("NAO") !== -1 ? "warn" : "ok"}">${escapeHtml(x.QuisFazerEntrevista || "Sim")}</span></td>
               <td>${escapeHtml(x.PreenchidoPor || "—")}</td>
             </tr>`).join("")}</tbody>
           </table></div>`
        : `<div class="empty">Nenhuma entrevista de desligamento registrada ainda. Cadastre em "Entrevista de Desligamento".</div>`}

      ${(dash.desligamentos && dash.desligamentos.motivosTop && dash.desligamentos.motivosTop.length)
        ? `<h4 style="margin:14px 0 6px">Motivos mais comuns</h4>
           <div class="table-wrap"><table>
             <thead><tr><th>Motivo</th><th>Qtd</th></tr></thead>
             <tbody>${dash.desligamentos.motivosTop.map(m => `<tr><td>${escapeHtml(m.Motivo)}</td><td>${escapeHtml(m.Qtd)}</td></tr>`).join("")}</tbody>
           </table></div>`
        : ""}
    </div>

    <div class="grid g2">
      <div class="card">
        <h3>🔄 Turnover por Setor <span class="muted" style="font-weight:400;font-size:12px">(mês atual)</span></h3>
        ${(dash.turnoverPorSetor && dash.turnoverPorSetor.length)
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Setor</th><th>Ativos</th><th>Adm.</th><th>Deslig.</th><th>Turnover</th></tr></thead>
              <tbody>${dash.turnoverPorSetor.map(s => `<tr>
                <td>${escapeHtml(s.Setor)}</td><td>${escapeHtml(s.Ativos)}</td>
                <td>${escapeHtml(s.Admissoes)}</td><td>${escapeHtml(s.Desligamentos)}</td>
                <td><span class="badge ${s.Turnover >= 5 ? "warn" : "ok"}">${escapeHtml(s.Turnover)}%</span></td>
              </tr>`).join("")}</tbody></table></div>`
          : `<div class="empty">Sem dados de setor.</div>`}
      </div>
      <div class="card">
        <h3>🩺 Absenteísmo por Setor <span class="muted" style="font-weight:400;font-size:12px">(mês mais recente lançado)</span></h3>
        ${(dash.absenteismoPorSetor && dash.absenteismoPorSetor.length)
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Setor</th><th>Absenteísmo</th></tr></thead>
              <tbody>${dash.absenteismoPorSetor.map(s => `<tr>
                <td>${escapeHtml(s.Setor)}</td>
                <td><span class="badge ${s.Absenteismo >= 5 ? "bad" : (s.Absenteismo >= 3 ? "warn" : "ok")}">${escapeHtml(s.Absenteismo)}%</span></td>
              </tr>`).join("")}</tbody></table></div>`
          : `<div class="empty">Nenhum absenteísmo lançado ainda.</div>`}
      </div>
    </div>

    <div class="card">
      <h3>🧪 Colaboradores em Período de Experiência ${sel ? `<span class="badge info">${escapeHtml(sel)}</span>` : ""}</h3>
      ${tabelaExperiencia(dash.emExperiencia || [])}
    </div>

    <div class="card">
      <h3>📝 Avaliações de Período de Experiência</h3>
      <div class="grid g4" style="margin-bottom:12px">
        <div class="kpi" style="border-left-color:var(--info)"><small>Total</small><strong>${(dash.avaliacoesExp && dash.avaliacoesExp.total) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--ok)"><small>Efetivar</small><strong>${(dash.avaliacoesExp && dash.avaliacoesExp.efetivar) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--warn)"><small>Acompanhar</small><strong>${(dash.avaliacoesExp && dash.avaliacoesExp.acompanhar) || 0}</strong></div>
        <div class="kpi" style="border-left-color:var(--bad)"><small>Não Efetivar</small><strong>${(dash.avaliacoesExp && dash.avaliacoesExp.naoEfetivar) || 0}</strong></div>
      </div>
      ${tabelaComBadge((dash.avaliacoesExp && dash.avaliacoesExp.recentes) || [], ["Colaborador", "Unidade", "Etapa", "Resultado"])}
    </div>

    <div class="grid g2">
      <div class="card">
        <h3>🎂 Aniversariantes do Mês</h3>
        ${tabelaSimples(dash.aniversariantes, ["Nome", "Unidade", "DataNascimento"])}
      </div>
      <div class="card">
        <h3>⏳ Experiência Vencendo (15 dias)</h3>
        ${tabelaSimples(dash.experienciaProximas, ["Nome", "Unidade", "Cargo", "FimExperiencia"])}
      </div>
    </div>

    <div class="card">
      <h3>📦 Estoque Crítico de Fardamento</h3>
      ${tabelaSimples(dash.estoqueCritico, ["Unidade", "Item", "Tamanho", "QuantidadeEstoque", "QuantidadeMinima"])}
    </div>
  `);
}

function tabelaSimples(linhas, colunas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum registro.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${colunas.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${linhas.map(l => `<tr>${colunas.map(c => `<td>${escapeHtml(l[c])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ===================== VALE TRANSPORTE (por bairro/cidade) ===================== */

const BAIRROS_FORTALEZA = ["Aerolândia", "Aeroporto", "Aldeota", "Alagadiço", "Alagadiço Novo", "Alto da Balança",
  "Álvaro Weyne", "Amadeu Furtado", "Ancuri", "Antônio Bezerra", "Aracapé", "Autran Nunes", "Barra do Ceará",
  "Barroso", "Bela Vista", "Benfica", "Bom Futuro", "Bom Jardim", "Bonsucesso", "Cais do Porto", "Cajazeiras",
  "Cambeba", "Canindezinho", "Carlito Pamplona", "Castelo", "Caça e Pesca", "Centro", "Cidade 2000",
  "Cidade dos Funcionários", "Cocó", "Conjunto Ceará", "Conjunto Esperança", "Conjunto Palmeiras",
  "Cristo Redentor", "Curió", "Damas", "Demócrito Rocha", "Dias Macedo", "Dionísio Torres", "Dom Lustosa",
  "Dunas", "Edson Queiroz", "Ellery", "Engenheiro Luciano Cavalcante", "Farias Brito", "Fátima", "Floresta",
  "Genibaú", "Granja Lisboa", "Granja Portugal", "Guajeru", "Guararapes", "Henrique Jorge", "Itaoca", "Itaperi",
  "Jacarecanga", "Jardim América", "Jardim Cearense", "Jardim das Oliveiras", "Jardim Guanabara", "Jardim Iracema",
  "João XXIII", "Joaquim Távora", "Jóquei Clube", "José Bonifácio", "José de Alencar", "Lagoa Redonda",
  "Manuel Dias Branco", "Manoel Sátiro", "Maraponga", "Meireles", "Messejana", "Mondubim", "Monte Castelo",
  "Montese", "Moura Brasil", "Mucuripe", "Padre Andrade", "Pan Americano", "Papicu", "Parangaba", "Parque Araxá",
  "Parque Dois Irmãos", "Parque Iracema", "Parque Manibura", "Parque Santa Maria", "Parque Santa Rosa",
  "Parque São José", "Parquelândia", "Parreão", "Passaré", "Paupina", "Pedras", "Pici", "Planalto Ayrton Senna",
  "Praia de Iracema", "Praia do Futuro I", "Praia do Futuro II", "Presidente Kennedy", "Presidente Vargas",
  "Quintino Cunha", "Raquel de Queiroz", "Rodolfo Teófilo", "Sabiaguaba", "Salinas", "Sapiranga", "São Bento",
  "São Gerardo", "São João do Tauape", "Serrinha", "Serviluz", "Siqueira", "Tancredo Neves", "Varjota",
  "Vicente Pinzón", "Vila Ellery", "Vila Peri", "Vila União", "Vila Velha"];

const MUNICIPIOS_RMF = ["Caucaia", "Maracanaú", "Maranguape", "Pacatuba", "Eusébio", "Aquiraz", "Itaitinga",
  "Guaiúba", "Horizonte", "Pacajus", "Chorozinho", "Cascavel", "Pindoretama", "São Gonçalo do Amarante",
  "Paracuru", "Paraipaba", "Trairi", "São Luís do Curu"];

// Valor do VT por dia conforme cidade de moradia x cidade de trabalho.
// Edite aqui se os valores mudarem.
function vtPorDia(cidadeMora, cidadeTrabalha) {
  const m = normalize(cidadeMora), t = normalize(cidadeTrabalha);
  if (m === "FORTALEZA" && t === "FORTALEZA") return 10.80;
  if (m === "FORTALEZA" && t === "EUSEBIO") return 19.80;
  if (m === "EUSEBIO" && t === "EUSEBIO") return 10.80;
  if (m === "EUSEBIO" && t === "FORTALEZA") return 19.80;
  return 0; // combinação ainda não cadastrada
}

function cidadeDoBairro(bairro) {
  const b = normalize(bairro);
  const muni = MUNICIPIOS_RMF.find(x => normalize(x) === b);
  if (muni) return muni;
  // se está na lista de bairros de Fortaleza (ou qualquer coisa não-município), assume Fortaleza
  return "Fortaleza";
}

function cidadeDaUnidade(unidade) {
  const u = normalize(unidade);
  if (u.indexOf("EUSEBIO") !== -1 || u.indexOf("CONRADO") !== -1) return "Eusébio";
  return "Fortaleza";
}

function calcularVT() {
  const bairroEl = document.getElementById("campo_Bairro");
  const uniEl = document.getElementById("campo_Unidade");
  const vtEl = document.getElementById("campo_ValeTransporteDia");
  const cidResEl = document.getElementById("campo_CidadeResidencia");
  if (!vtEl) return;
  const bairro = bairroEl ? bairroEl.value : "";
  const cidadeMora = cidadeDoBairro(bairro);
  const cidadeTrab = cidadeDaUnidade(uniEl ? uniEl.value : "");
  if (cidResEl && !cidResEl.value.trim()) cidResEl.value = cidadeMora;
  const dia = vtPorDia(cidadeMora, cidadeTrab);
  vtEl.value = dia;
}

/* ===================== LIDERANÇA AUTOMÁTICA ===================== */

function liderDe(nomeColaborador) {
  const alvo = normalize(nomeColaborador);
  // 1) organograma que já vem em cada colaborador (getInit -> liderDiretoDe_)
  const col = (STATE.init.colaboradores || []).find(c => normalize(c.Nome) === alvo);
  if (col && col.Lider) return col.Lider;
  // 2) aba "lideranca" (se um dia for preenchida)
  const lista = STATE.init.lideranca || [];
  const achou = lista.find(l => normalize(l.Liderado) === alvo);
  return achou ? achou.Lider : "";
}

function autofillGestor(nomeColaborador, campoDestinoId) {
  const lider = liderDe(nomeColaborador);
  const campo = document.getElementById(campoDestinoId);
  if (campo && lider) campo.value = lider;
}

/* ===================== UNIVERSIDADE EVOL ===================== */

const ACADEMIA_NOVOS_TALENTOS = [
  ["01", "Autoconhecimento e Perfil Profissional", "Entender quem você é para crescer com intenção"],
  ["02", "Comunicação e Oratória", "Falar com clareza, confiança e presença"],
  ["03", "Inteligência Emocional", "Gerenciar emoções para agir com equilíbrio"],
  ["04", "Gestão de Conflitos", "Transformar tensões em soluções"],
  ["05", "Atendimento e Experiência do Cliente", "Encantar é uma escolha que se aprende"],
  ["06", "Organização e Gestão do Tempo", "Fazer mais com o tempo que você já tem"],
  ["07", "Trabalho em Equipe e Colaboração", "Ninguém cresce sozinho"],
  ["08", "Pensamento Crítico e Resolução de Problemas", "Do 'não sei' para o 'vou descobrir'"],
  ["09", "Feedback: Dar e Receber", "A ferramenta mais poderosa de crescimento"],
  ["10", "Liderança Pessoal", "Liderar a si mesmo antes de liderar qualquer pessoa"],
  ["11", "Ética, Postura e Imagem Profissional", "Sua reputação é seu maior ativo"],
  ["12", "Projeto de Crescimento Pessoal", "De onde vim, onde estou, para onde vou"]
];

const ACADEMIA_LIDERES = [
  ["Mês 1", "🧭 O Papel do Líder Moderno", "Identidade do líder"],
  ["Mês 2", "🧠 Inteligência Emocional na Liderança", "Autorregulação emocional"],
  ["Mês 3", "📚 Andragogia: Como Adultos Aprendem", "Ensinar e desenvolver"],
  ["Mês 4", "💬 Feedback de Alto Impacto", "Conversas difíceis"],
  ["Mês 5", "🌱 Acompanhamento e Desenvolvimento de Novos Talentos", "Onboarding e plano 90 dias"],
  ["Mês 6", "🗣️ Comunicação Assertiva para Líderes", "Clareza e assertividade"],
  ["Mês 7", "🔥 Gestão de Conflitos na Liderança", "Mediação e resolução"],
  ["Mês 8", "🎯 Delegação e Desenvolvimento de Autonomia", "Autonomia e delegação"],
  ["Mês 9", "⚡ Motivação e Engajamento de Equipes", "Motivação intrínseca"],
  ["Mês 10", "🧩 Tomada de Decisão e Gestão sob Pressão", "Decisão e cognição"],
  ["Mês 11", "🌐 Gestão de Clima e Cultura de Equipe", "Clima e comportamento"],
  ["Mês 12", "🏆 Liderança Integrada: Plano de Evolução", "Integração e PDI"]
];

function tabelaModulos(linhas, colTitulo, programa, keyPrefix) {
  return `<div class="table-wrap"><table>
    <thead><tr><th style="width:80px">#</th><th>${escapeHtml(colTitulo)}</th><th>Foco</th><th style="width:150px"></th></tr></thead>
    <tbody>${linhas.map(m => {
      const chave = keyPrefix + m[0];
      const titEsc = m[1].replace(/'/g, "\\'");
      return `<tr>
      <td style="font-weight:800;color:var(--azul)">${escapeHtml(m[0])}</td>
      <td style="font-weight:700">${escapeHtml(m[1])}</td>
      <td class="muted">${escapeHtml(m[2])}</td>
      <td><button class="btn btn-primary" style="padding:6px 10px;min-height:auto" onclick="abrirModuloUniversidade('${programa}','${escapeHtml(chave)}','${escapeHtml(titEsc)}')">Ver conteúdo</button></td>
    </tr>`;
    }).join("")}</tbody></table></div>`;
}

async function carregarUniversidadeJson() {
  if (STATE.cache.universidade) return STATE.cache.universidade;
  const r = await fetch("universidade.json");
  if (!r.ok) throw new Error("Arquivo universidade.json não encontrado (envie-o ao GitHub, na raiz).");
  const data = await r.json();
  STATE.cache.universidade = data;
  return data;
}

function aplicaNegritoUni(s) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function formatarConteudoModulo(texto) {
  const linhas = String(texto || "").split("\n");
  let html = "", buf = [];
  function flush() {
    if (!buf.length) return;
    const rows = buf.map(l => l.split("|").map(c => c.trim()));
    const head = rows[0], body = rows.slice(1);
    html += `<div class="table-wrap" style="margin:12px 0"><table>
      <thead><tr>${head.map(h => `<th>${aplicaNegritoUni(h)}</th>`).join("")}</tr></thead>
      <tbody>${body.map(r => `<tr>${r.map(c => `<td>${aplicaNegritoUni(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
    buf = [];
  }
  linhas.forEach(raw => {
    const l = raw.trim();
    if (!l) { flush(); return; }
    const nPipes = (l.match(/\|/g) || []).length;
    if (nPipes >= 2) { buf.push(l); return; }
    flush();
    if (l.indexOf("###") === 0) { html += `<h3 style="color:var(--azul);margin:16px 0 6px">${escapeHtml(l.replace(/^#+\s*/, ""))}</h3>`; return; }
    html += `<p style="margin:6px 0;line-height:1.6">${aplicaNegritoUni(l.replace(/\s*\|\s*/g, " · "))}</p>`;
  });
  flush();
  return html;
}

async function abrirModuloUniversidade(programa, chave, titulo) {
  setMain(`<div class="loading">Carregando conteúdo do módulo...</div>`);
  let data;
  try { data = await carregarUniversidadeJson(); }
  catch (e) { setMain(`<div class="msg err">${escapeHtml(e.message)}</div><div class="actions"><button class="btn btn-secondary" onclick="renderUniversidade()">← Voltar</button></div>`); return; }
  const conteudo = (data[programa] && data[programa][chave]) || "Conteúdo não encontrado para este módulo.";
  setMain(`
    <div class="page-title"><div><h2>${escapeHtml(titulo)}</h2><p>Universidade Evol — conteúdo do módulo.</p></div>
      <button class="btn btn-secondary" onclick="renderUniversidade()">← Voltar</button>
    </div>
    <div class="card">${formatarConteudoModulo(conteudo)}</div>
    <div class="actions"><button class="btn btn-primary" onclick="treinarModulo('${escapeHtml(titulo.replace(/'/g, "\\'"))}')">Registrar treino deste módulo</button></div>
  `);
}

async function renderUniversidade() {
  setMain(`
    <div class="page-title"><div><h2>🎓 Universidade Evol</h2><p>Trilhas de desenvolvimento do Grupo Evol. Clique em "Ver conteúdo" para abrir o módulo.</p></div></div>

    <div class="card">
      <h3>🎓 Academia de Novos Talentos <span class="badge info">Para Colaboradores</span></h3>
      <p class="card-subtitle">Trilha de base para os colaboradores, do autoconhecimento ao projeto de crescimento pessoal.</p>
      ${tabelaModulos(ACADEMIA_NOVOS_TALENTOS, "Módulo", "TALENTOS", "Módulo ")}
    </div>

    <div class="card">
      <h3>👑 Academia de Líderes <span class="badge orange">Somente Liderança</span></h3>
      <p class="card-subtitle">Programa de 12 meses exclusivo para a liderança: do papel do líder moderno à liderança integrada com PDI.</p>
      ${tabelaModulos(ACADEMIA_LIDERES, "Tema do Mês", "LIDERES", "")}
    </div>
  `);
}

function treinarModulo(tema) {
  navegar("treinamentos");
  setTimeout(() => {
    const campo = document.getElementById("campo_Tema");
    if (campo) { campo.value = tema; campo.focus(); }
  }, 400);
}

/* ===================== FEEDBACK (avaliação completa) ===================== */

function fbChk(name, opcoes) {
  return `<div class="grid g3">${opcoes.map(o => `<label class="check"><input type="checkbox" data-fb="${name}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>`).join("")}</div>`;
}
function fbRadio(name, opcoes) {
  return `<div class="grid g3">${opcoes.map(o => `<label class="check"><input type="radio" name="fb_${name}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>`).join("")}</div>`;
}
function fbColetarChk(name) {
  return Array.from(document.querySelectorAll(`#main input[data-fb="${name}"]:checked`)).map(i => i.value).join(", ");
}
function fbColetarRadio(name) {
  const e = document.querySelector(`#main input[name="fb_${name}"]:checked`);
  return e ? e.value : "";
}

async function renderFeedback() {
  const decisoes = ["Reconhecer desempenho", "Registrar elogio", "Conceder destaque do mês", "Indicar para promoção",
    "Indicar para sucessão", "Delegar novos desafios", "Criar Plano de Desenvolvimento (PDI)", "Realizar treinamento",
    "Realizar reciclagem", "Acompanhamento semanal", "Acompanhamento quinzenal", "Acompanhamento mensal",
    "Mentoria", "Coaching", "Feedback complementar", "Correção de rota", "Advertência verbal", "Advertência escrita",
    "Suspensão (conforme RH)", "Encaminhar ao RH", "Encaminhar ao SESMT", "Encaminhar ao DP", "Outro"];
  const desenvolver = ["Comunicação", "Liderança", "Trabalho em Equipe", "Organização", "Gestão do Tempo",
    "Inteligência Emocional", "Atendimento ao Cliente", "Vendas", "Técnicas da Função", "Segurança do Trabalho",
    "Produtividade", "Eficiência", "Planejamento", "Tomada de Decisão", "Relacionamento Interpessoal",
    "Gestão de Conflitos", "Criatividade", "Inovação", "Senso de Dono", "Ética", "Respeito", "Outro"];
  const indicadores = ["Cumprimento de metas", "Qualidade das entregas", "Produtividade", "Eficiência", "Pontualidade",
    "Assiduidade", "Comprometimento", "Organização", "Iniciativa", "Comunicação", "Trabalho em equipe", "Liderança",
    "Relacionamento interpessoal", "Atendimento ao cliente", "Cumprimento de normas", "Cumprimento dos POPs",
    "Uso correto de EPI", "Uso correto do uniforme", "Segurança no trabalho", "Redução de retrabalho",
    "Resolução de problemas", "Inovação", "Aprendizado rápido", "Autonomia", "Responsabilidade", "Senso de urgência",
    "Adaptabilidade", "Gestão do tempo", "Proatividade", "Foco em resultados"];

  setMain(`
    <div class="page-title"><div><h2>Feedback</h2><p>Avaliação de desempenho — classificação automática por pontuação.</p></div></div>

    <div class="card">
      <h3>Identificação</h3>
      <div class="grid g3">
        <div class="form-row"><label>Colaborador *</label><input id="fbColab" type="text" list="dl-colaboradores" onchange="autofillGestor(this.value,'fbGestor')"></div>
        <div class="form-row"><label>Unidade</label><input id="fbUnidade" type="text" list="dl-unidades"></div>
        <div class="form-row"><label>Nome do gestor</label><input id="fbGestor" type="text"></div>
        <div class="form-row"><label>Data</label><input id="fbData" type="date"></div>
        <div class="form-row"><label>Pontuação Geral (0 a 100) *</label><input id="fbPont" type="number" min="0" max="100" step="1" value="0" oninput="fbAtualizaClass()"></div>
        <div class="form-row"><label>Classificação (automática)</label><input id="fbClass" type="text" readonly value="—"></div>
      </div>
      <div class="msg" id="fbClassMsg" style="display:none"></div>
    </div>

    <div class="card"><h3>Decisão do Gestor</h3>${fbChk("decisao", decisoes)}</div>

    <div class="card">
      <h3>Perfil</h3>
      <label style="margin-top:6px">Potencial do colaborador</label>
      ${fbRadio("potencial", ["Alto Potencial", "Potencial para Crescimento", "Potencial Moderado", "Necessita Desenvolvimento", "Necessita Acompanhamento Intensivo"])}
      <label style="margin-top:12px">Risco de desligamento</label>
      ${fbRadio("risco", ["Nenhum", "Baixo", "Médio", "Alto", "Crítico"])}
      <label style="margin-top:12px">Prontidão para promoção</label>
      ${fbRadio("prontidao", ["Pronto imediatamente", "Pronto em até 3 meses", "Pronto em até 6 meses", "Pronto em até 12 meses", "Ainda não elegível"])}
      <label style="margin-top:12px">Nível de engajamento</label>
      ${fbRadio("engajamento", ["Muito Engajado", "Engajado", "Neutro", "Pouco Engajado", "Desengajado"])}
      <label style="margin-top:12px">Evolução desde o último feedback</label>
      ${fbRadio("evolucao", ["Evoluiu muito", "Evoluiu", "Manteve o desempenho", "Oscilou", "Piorou", "Primeiro feedback"])}
    </div>

    <div class="card"><h3>Plano de Desenvolvimento — Necessita desenvolver</h3>${fbChk("desenvolver", desenvolver)}</div>

    <div class="card">
      <h3>Prazo para Reavaliação</h3>
      ${fbRadio("prazo", ["7 dias", "15 dias", "30 dias", "45 dias", "60 dias", "90 dias", "6 meses", "12 meses"])}
      <div class="form-row" style="max-width:280px;margin-top:12px"><label>Data da próxima avaliação</label><input id="fbDataProx" type="date"></div>
    </div>

    <div class="card"><h3>Indicadores Observados</h3>${fbChk("indicadores", indicadores)}</div>

    <div class="card">
      <h3>Status Final</h3>
      ${fbRadio("status", ["Feedback concluído", "Aguardando retorno do colaborador", "Aguardando novo acompanhamento", "PDI em andamento", "Em monitoramento", "Encaminhado ao RH", "Encaminhado à Diretoria", "Processo encerrado"])}
    </div>

    <div class="card">
      <h3>Comentários</h3>
      <div class="grid g2">
        <div class="form-row"><label>Pontos Fortes</label><textarea id="fbFortes"></textarea></div>
        <div class="form-row"><label>Pontos de Melhoria</label><textarea id="fbMelhoria"></textarea></div>
      </div>
      <div class="form-row"><label>Plano de Ação</label><textarea id="fbPlano"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="salvarFeedbackCompleto()">Salvar Feedback</button></div>
    </div>

    <div class="card"><h3>Feedbacks Registrados</h3><div id="tabelaFb"><div class="loading">Carregando...</div></div></div>
  `);
  fbAtualizaClass();
  await carregarFbTabela();
}

function classificaFbLocal(p) {
  if (!p || p <= 0) return "—";
  if (p >= 90) return "🔵 DESTAQUE";
  if (p >= 80) return "🟢 ACIMA DAS EXPECTATIVAS";
  if (p >= 70) return "🟡 DENTRO DAS EXPECTATIVAS";
  if (p >= 50) return "🟠 NECESSITA DESENVOLVIMENTO";
  return "🔴 PLANO DE AÇÃO IMEDIATO";
}
function fbAtualizaClass() {
  const raw = el("#fbPont").value;
  const p = Number(raw);
  el("#fbClass").value = (raw === "" || isNaN(p) || p <= 0) ? "—" : classificaFbLocal(p);
}

async function salvarFeedbackCompleto() {
  const colab = el("#fbColab").value.trim();
  if (!colab) { toast("Selecione o colaborador.", "err"); return; }
  const dados = {
    Colaborador: colab, Unidade: el("#fbUnidade").value.trim(), Gestor: el("#fbGestor").value.trim(),
    Data: el("#fbData").value, Pontuacao: el("#fbPont").value,
    DecisaoGestor: fbColetarChk("decisao"),
    Potencial: fbColetarRadio("potencial"),
    RiscoDesligamento: fbColetarRadio("risco"),
    ProntidaoPromocao: fbColetarRadio("prontidao"),
    Engajamento: fbColetarRadio("engajamento"),
    Evolucao: fbColetarRadio("evolucao"),
    PlanoDesenvolvimento: fbColetarChk("desenvolver"),
    PrazoReavaliacao: fbColetarRadio("prazo"),
    DataProxima: el("#fbDataProx").value,
    Indicadores: fbColetarChk("indicadores"),
    StatusFinal: fbColetarRadio("status"),
    PontosFortes: el("#fbFortes").value, PontosMelhoria: el("#fbMelhoria").value, PlanoAcao: el("#fbPlano").value
  };
  try {
    const r = await api("salvarFeedback", dados);
    toast(r.msg, "ok");
    if (r.classificacao) toast("Classificação: " + r.classificacao, "info");
    await renderFeedback();
  } catch (e) { toast(e.message, "err"); }
}

async function carregarFbTabela() {
  try {
    const r = await api("listarFeedbacks");
    document.getElementById("tabelaFb").innerHTML =
      tabelaComBadge(r.feedbacks || [], ["Data", "Colaborador", "Unidade", "Pontuacao", "Classificacao", "StatusFinal"]);
  } catch (e) { document.getElementById("tabelaFb").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`; }
}

/* ===================== AVALIAÇÃO DE EXPERIÊNCIA (Nossos Valores) ===================== */

async function renderExperiencia() {
  const sel = (id) => `<select id="${id}"><option value="">Selecione...</option><option>Abaixo</option><option>Atende</option><option>Supera</option></select>`;
  setMain(`
    <div class="page-title"><div><h2>Avaliação de Período de Experiência</h2><p>Identificação e etapa da avaliação.</p></div></div>
    <div class="card">
      <div class="grid g3">
        <div class="form-row"><label>Colaborador *</label><input id="exColab" type="text" list="dl-colaboradores" placeholder="Selecione o colaborador" onchange="autofillGestor(this.value,'exGestor')"></div>
        <div class="form-row"><label>Nome do gestor</label><input id="exGestor" type="text" list="dl-gestores" placeholder="Líder responsável"></div>
        <div class="form-row"><label>Data desta avaliação *</label><input id="exDataAval" type="date"></div>
        <div class="form-row"><label>Unidade</label><input id="exUnidade" type="text" list="dl-unidades" onchange="filtrarGestoresExp()"></div>
        <div class="form-row"><label>Cargo</label><input id="exCargo" type="text" list="dl-cargos"></div>
        <div class="form-row"><label>Data de admissão</label><input id="exAdmissao" type="date"></div>
      </div>
      <div class="form-row"><label>Etapa da avaliação *</label>
        <select id="exEtapa">
          <option value="">Selecione...</option>
          <option value="1ª AVALIAÇÃO — 45 DIAS">1ª Avaliação — 45 dias</option>
          <option value="2ª AVALIAÇÃO — 90 DIAS">2ª Avaliação — 90 dias</option>
        </select>
      </div>

      <h3 style="margin-top:8px">Nossos Valores</h3>
      <p class="card-subtitle">Avalie a conduta do colaborador em cada valor do Grupo Evol (Abaixo, Atende ou Supera).</p>
      <div class="grid g3">
        <div class="form-row"><label>Produtividade e eficiência *</label>${sel("exProd")}</div>
        <div class="form-row"><label>Trabalho em equipe *</label>${sel("exEquipe")}</div>
        <div class="form-row"><label>Senso de dono *</label>${sel("exDono")}</div>
        <div class="form-row"><label>Inovação *</label>${sel("exInov")}</div>
        <div class="form-row"><label>Fazer a diferença *</label>${sel("exDif")}</div>
      </div>

      <div class="form-row"><label>Plano de ação</label><textarea id="exPlano"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="salvarExperiencia()">Salvar Avaliação</button></div>
    </div>

    <div class="card"><h3>Avaliações Registradas</h3><div id="tabelaExp"><div class="loading">Carregando...</div></div></div>
  `);
  setDatalist("dl-gestores", todosGestores());
  await carregarExpTabela();
}

function filtrarGestoresExp() {
  // Gestor mostra TODOS os gestores + diretoria (não filtra por unidade).
  setDatalist("dl-gestores", todosGestores());
}

async function salvarExperiencia() {
  const colab = el("#exColab").value.trim();
  if (!colab) { toast("Selecione o colaborador.", "err"); return; }
  const dados = {
    Colaborador: colab, Gestor: el("#exGestor").value.trim(),
    DataAvaliacao: el("#exDataAval").value, Unidade: el("#exUnidade").value.trim(),
    Cargo: el("#exCargo").value.trim(), DataAdmissao: el("#exAdmissao").value,
    Etapa: el("#exEtapa").value,
    Produtividade: el("#exProd").value, TrabalhoEquipe: el("#exEquipe").value,
    SensoDono: el("#exDono").value, Inovacao: el("#exInov").value, FazerDiferenca: el("#exDif").value,
    PlanoAcao: el("#exPlano").value
  };
  try {
    const r = await api("salvarAvaliacaoExperiencia", dados);
    toast(r.msg, "ok");
    if (r.resultado) toast("Resultado: " + r.resultado, "info");
    await renderExperiencia();
  } catch (e) { toast(e.message, "err"); }
}

async function carregarExpTabela() {
  try {
    const r = await api("listarAvaliacoesExperiencia");
    document.getElementById("tabelaExp").innerHTML =
      tabelaComBadge(r.avaliacoes || [], ["Colaborador", "Unidade", "Etapa", "Resultado"]);
  } catch (e) { document.getElementById("tabelaExp").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`; }
}

/* ===================== DOSSIÊ DO COLABORADOR ===================== */

async function renderDossie() {
  setMain(`
    <div class="page-title"><div><h2>Dossiê do Colaborador</h2><p>Histórico completo: ocorrências, avaliações, feedbacks e treinamentos.</p></div></div>
    <div class="card">
      <div class="actions">
        <input id="dsColab" type="text" list="dl-colaboradores" placeholder="Selecione o colaborador" style="flex:1">
        <button class="btn btn-primary" onclick="abrirDossie()">Abrir dossiê</button>
      </div>
    </div>
    <div id="dossieConteudo"></div>
  `);
}

async function abrirDossie() {
  const nome = el("#dsColab").value.trim();
  if (!nome) { toast("Selecione o colaborador.", "err"); return; }
  const cont = document.getElementById("dossieConteudo");
  cont.innerHTML = `<div class="loading">Carregando dossiê...</div>`;
  let r;
  try { r = await api("dossie", { colaborador: nome }); }
  catch (e) { cont.innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`; return; }

  const c = r.colaborador || {}, k = r.kpis || {};
  STATE.cache.dossieNome = c.Nome || nome;

  cont.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:4px">${escapeHtml(c.Nome || nome)}</h2>
      <p class="muted">${escapeHtml([c.Cargo, c.Unidade].filter(Boolean).join(" · "))}${c.Status ? " · Status: " + escapeHtml(c.Status) : ""}</p>
      <p class="muted">Admissão: ${escapeHtml(c.DataAdmissao || "não informada")}</p>
    </div>

    <div class="grid g4">
      <div class="kpi" style="border-left-color:var(--warn)"><small>Atrasos registrados</small><strong>${k.atrasos || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--bad)"><small>Faltas injustificadas</small><strong>${k.faltas || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--bad)"><small>Advertências</small><strong>${k.advertencias || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--ok)"><small>Freq. em treinamentos</small><strong>${(k.horasTreinamento || 0)}h</strong></div>
    </div>

    <div class="card">
      <h3>Registrar Ocorrência</h3>
      <div class="grid g3">
        <div class="form-row"><label>Tipo</label>
          <select id="ocTipo"><option>ATRASO</option><option>FALTA</option><option>ADVERTÊNCIA</option><option>ELOGIO</option><option>OUTRO</option></select></div>
        <div class="form-row"><label>Data</label><input id="ocData" type="date"></div>
        <div class="form-row"><label>Unidade</label><input id="ocUnidade" type="text" list="dl-unidades" value="${escapeHtml(c.Unidade || "")}"></div>
      </div>
      <div class="form-row"><label>Descrição</label><textarea id="ocDesc"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="salvarOcorrenciaDossie()">Registrar Ocorrência</button></div>
    </div>

    <div class="card"><h3>Ocorrências</h3>${tabelaComBadge(r.ocorrencias, ["Data", "Tipo", "Descricao", "RegistradoPor"])}</div>
    <div class="card"><h3>Feedbacks</h3>${tabelaComBadge(r.feedbacks, ["Data", "Tipo", "Pontuacao", "Classificacao", "Lider"])}</div>
    <div class="card"><h3>Avaliações de Experiência</h3>${tabelaComBadge(r.avaliacoes, ["DataAvaliacao", "Etapa", "Resultado", "Parecer"])}</div>
    <div class="card"><h3>Treinamentos</h3>${tabelaComBadge(r.treinamentos, ["Data", "Tema", "Tipo", "HorasAssistidas"])}</div>
    <div class="card"><h3>👕 Fardamentos recebidos</h3>${tabelaComBadge(r.fardamentos || [], ["Data", "Item", "Tamanho", "Quantidade", "EntreguePor"])}</div>
    <div class="card"><h3>🦺 EPIs recebidos</h3>${tabelaComBadge(r.epis || [], ["Data", "Item", "Tamanho", "Quantidade", "EntreguePor"])}</div>
    <div class="card"><h3>📎 Atestados e documentos anexados</h3>${
      (r.documentos && r.documentos.length)
        ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Arquivo</th><th>Abrir</th></tr></thead>
           <tbody>${r.documentos.map(d => `<tr>
             <td>${escapeHtml(d.Data || "")}</td><td>${escapeHtml(d.Arquivo || "")}</td>
             <td>${d.Url ? `<a class="btn btn-secondary" style="padding:4px 8px;font-size:12px" href="${escapeHtml(d.Url)}" target="_blank" rel="noopener">Ver / Baixar</a>` : "—"}</td>
           </tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Nenhum documento anexado.</div>`
    }</div>
  `;
}

async function salvarOcorrenciaDossie() {
  const nome = STATE.cache.dossieNome;
  if (!nome) { toast("Abra um dossiê primeiro.", "err"); return; }
  const dados = {
    Colaborador: nome, Tipo: el("#ocTipo").value, Data: el("#ocData").value,
    Unidade: el("#ocUnidade").value.trim(), Descricao: el("#ocDesc").value.trim()
  };
  try {
    const r = await api("salvarOcorrencia", dados);
    toast(r.msg, "ok");
    el("#dsColab").value = nome;
    await abrirDossie();
  } catch (e) { toast(e.message, "err"); }
}

/* ===================== MODAL / AVISOS ===================== */

function mostrarModal(titulo, htmlConteudo) {
  let ov = document.getElementById("modalOverlay");
  if (!ov) { ov = document.createElement("div"); ov.id = "modalOverlay"; document.body.appendChild(ov); }
  ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px";
  ov.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:540px;width:100%;max-height:82vh;overflow:auto;padding:22px;box-shadow:var(--shadow-strong)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h2 style="margin:0;color:var(--azul)">${escapeHtml(titulo)}</h2>
      <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
    </div>${htmlConteudo}</div>`;
  ov.onclick = e => { if (e.target === ov) fecharModal(); };
}
function fecharModal() { const ov = document.getElementById("modalOverlay"); if (ov) ov.remove(); }

async function mostrarAvisosLogin() {
  try {
    const r = await api("listarAvisos", { perfil: (STATE.user && STATE.user.perfil) || "" });
    const avisos = r.avisos || [];
    if (!avisos.length) return;
    const html = avisos.map(a => `
      <div class="msg ${normalize(a.Prioridade) === "URGENTE" || normalize(a.Prioridade) === "CRITICA" ? "err" : "info"}" style="text-align:left">
        <strong>${escapeHtml(a.Titulo || "Aviso")}</strong><br>${escapeHtml(a.Mensagem || "")}
        <div class="muted" style="font-size:11px;margin-top:4px">${escapeHtml(a.Data || "")} · ${escapeHtml(a.CriadoPor || "")}</div>
      </div>`).join("");
    mostrarModal("📢 Avisos", html);
  } catch (e) {}
}

async function renderAvisos() {
  setMain(`
    <div class="page-title"><div><h2>📢 Avisos e Lembretes</h2><p>Aparecem no login e no Dashboard de sócios e diretoria.</p></div></div>
    <div class="card">
      <h3>Novo aviso</h3>
      <div class="grid g2">
        <div class="form-row"><label>Título *</label><input id="avsTitulo" type="text"></div>
        <div class="form-row"><label>Enviado por</label><input id="avsEnviadoPor" type="text" list="dl-responsaveis" placeholder="Quem está enviando"></div>
        <div class="form-row"><label>Unidade destino</label>
          <select id="avsUnidade"><option value="Todas">Todas as unidades</option>${(STATE.init.unidades || []).map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("")}</select>
        </div>
        <div class="form-row"><label>Colaboradores (opcional)</label><input id="avsColaboradores" type="text" list="dl-colaboradores" placeholder="Vazio = todos da unidade. Separe por vírgula."></div>
        <div class="form-row"><label>Perfil que vê</label>
          <select id="avsPublico"><option>Todos</option><option>Sócios</option><option>Diretoria</option><option>Sócios e Diretoria</option><option>Liderança</option><option>RH</option></select>
        </div>
        <div class="form-row"><label>Prioridade</label>
          <select id="avsPrioridade"><option>Normal</option><option>Urgente</option></select>
        </div>
        <div class="form-row"><label>Expira em (opcional)</label><input id="avsExpira" type="date"></div>
      </div>
      <div class="form-row"><label>Mensagem *</label><textarea id="avsMsg"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="salvarAviso()">Publicar aviso</button></div>
    </div>
    <div class="card"><h3>Avisos ativos</h3><div id="tabelaAvisos"><div class="loading">Carregando...</div></div></div>
  `);
  setDatalist("dl-lideres", todosOsLideres());
  setDatalist("dl-responsaveis", ["Luiza Garzon", "Denayre Monte", "Jéssica Monalisa", "Aline Cardoso", "Alan Souza", "Saulo Gomes", "João Ricardo", "Anália Gabriely", "Mariano Maia", "Daniel Jourdain", "André Coelho", "Jeffany Alencar", "Victor Pinheiro", "Mary Diane", "Cleylson", "Gustavo Freitas", "Victor Farias", "Lucas Nogueira"]);
  setDatalist("dl-colaboradores", (STATE.init.colaboradores || []).map(c => c.Nome).filter(Boolean));
  await carregarAvisos();
}

async function salvarAviso() {
  const dados = {
    Titulo: el("#avsTitulo").value.trim(),
    Mensagem: el("#avsMsg").value.trim(),
    Publico: el("#avsPublico").value,
    UnidadeDestino: el("#avsUnidade") ? el("#avsUnidade").value : "Todas",
    Colaboradores: el("#avsColaboradores") ? el("#avsColaboradores").value.trim() : "",
    EnviadoPor: el("#avsEnviadoPor") ? el("#avsEnviadoPor").value.trim() : "",
    Prioridade: el("#avsPrioridade").value,
    Expira: el("#avsExpira").value
  };
  if (!dados.Titulo || !dados.Mensagem) { toast("Preencha título e mensagem.", "err"); return; }
  try { const r = await api("salvarAviso", dados); toast(r.msg, "ok"); await renderAvisos(); }
  catch (e) { toast(e.message, "err"); }
}

async function carregarAvisos() {
  try {
    const r = await api("listarAvisos", { perfil: "" });
    document.getElementById("tabelaAvisos").innerHTML = tabelaSimples(r.avisos || [], ["Data", "Titulo", "Mensagem", "UnidadeDestino", "Colaboradores", "EnviadoPor", "Prioridade"]);
  } catch (e) { document.getElementById("tabelaAvisos").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`; }
}

/* ===================== AGENDA ===================== */

async function renderAgenda() {
  const hoje = new Date();
  if (!STATE.ag) STATE.ag = { ano: hoje.getFullYear(), mes: hoje.getMonth(), eventos: [] };
  setMain(`
    <div class="page-title"><div><h2>📅 Agenda</h2><p>Calendário da equipe — filtre por responsável (líder/sócio) para ver a agenda de quem quiser.</p></div></div>
    <div class="card" id="agWrap"><div class="loading">Carregando agenda...</div></div>
  `);
  await agCarregar();
}

async function agCarregar() {
  try {
    const r = await api("listarEventosAgenda", {});
    STATE.ag.eventos = r.eventos || [];
  } catch (e) {
    STATE.ag.eventos = [];
    const w = document.getElementById("agWrap");
    if (w) { w.innerHTML = `<div class="msg err">Não consegui carregar: ${escapeHtml(e.message)}</div>`; return; }
  }
  agRender();
}

function agNorm(s) { return String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

const AG_CORES = {
  "REUNIAO": "#2563eb", "ANIVERSARIO": "#db2777", "INTEGRACAO": "#059669",
  "TREINAMENTO": "#d97706", "ENTREVISTA": "#7c3aed", "FERIAS": "#0891b2",
  "PLANTAO": "#dc2626", "OUTRO": "#64748b"
};
const AG_TIPOS = ["Reunião", "Plantão", "Aniversário", "Integração", "Treinamento", "Entrevista", "Férias", "Outro"];

function agCorTipo(tipo) { return AG_CORES[agNorm(tipo)] || AG_CORES["OUTRO"]; }

// Data de um evento -> "YYYY-MM-DD" (aceita ISO ou dd/MM/yyyy)
function agDataISO(v) {
  v = String(v || "").trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}`;
  return "";
}

// Aniversários do mês exibido (derivados dos colaboradores)
function agAniversarios(ano, mes) {
  const out = [];
  (STATE.init.colaboradores || []).forEach(c => {
    const raw = c.Nascimento || c.Aniversario || c["Dt_Nascimento"] || c.DataNascimento || "";
    const s = String(raw).trim(); if (!s) return;
    let dd, mm;
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})/);
    if (m) { dd = +m[1]; mm = +m[2]; } else { return; }
    if (mm - 1 !== mes) return;
    out.push({ dia: dd, tipo: "Aniversário", titulo: "🎂 " + (c.Nome || ""), aniversario: true });
  });
  return out;
}

function agRender() {
  const { ano, mes } = STATE.ag;
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const primeiro = new Date(ano, mes, 1);
  const diaSemInicio = primeiro.getDay(); // 0=Dom
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date(); const hojeISO = `${hoje.getFullYear()}-${("0" + (hoje.getMonth() + 1)).slice(-2)}-${("0" + hoje.getDate()).slice(-2)}`;

  // eventos por dia (ISO), aplicando o filtro por responsável
  const filtro = STATE.ag.filtro || "";
  const porDia = {};
  (STATE.ag.eventos || []).forEach(ev => {
    if (filtro && agNorm(ev.Responsavel) !== agNorm(filtro)) return;
    const iso = agDataISO(ev.Data); if (!iso) return;
    (porDia[iso] = porDia[iso] || []).push(ev);
  });
  // aniversários
  const aniv = agAniversarios(ano, mes);

  const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  let celulas = "";
  // espaços antes do dia 1
  for (let i = 0; i < diaSemInicio; i++) celulas += `<div class="ag-cel ag-vazia"></div>`;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const iso = `${ano}-${("0" + (mes + 1)).slice(-2)}-${("0" + dia).slice(-2)}`;
    const evs = (porDia[iso] || []).slice().sort((a, b) => String(a.HoraInicio || "").localeCompare(String(b.HoraInicio || "")));
    const anivDia = aniv.filter(a => a.dia === dia);
    const isHoje = iso === hojeISO;
    let chips = "";
    anivDia.forEach(a => {
      chips += `<div class="ag-chip" style="background:${agCorTipo("Aniversario")}" title="${escapeHtml(a.titulo)}">${escapeHtml(a.titulo)}</div>`;
    });
    evs.forEach(ev => {
      const hora = ev.HoraInicio ? escapeHtml(ev.HoraInicio) + " " : "";
      chips += `<div class="ag-chip" style="background:${agCorTipo(ev.Tipo)}" title="${escapeHtml((ev.Titulo || "") + (ev.Local ? " @ " + ev.Local : ""))}" onclick="event.stopPropagation(); agAbrirEvento('${escapeHtml(ev.Id)}')">${hora}${escapeHtml(ev.Titulo || "")}</div>`;
    });
    celulas += `
      <div class="ag-cel ${isHoje ? "ag-hoje" : ""}" onclick="agNovoEvento('${iso}')">
        <div class="ag-num">${dia}</div>
        <div class="ag-chips">${chips}</div>
      </div>`;
  }

  document.getElementById("agWrap").innerHTML = `
    <style>
      .ag-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px}
      .ag-top h3{margin:0;color:var(--azul,#1a2b4a)}
      .ag-nav button{margin-left:6px}
      .ag-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#e2e8f0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
      .ag-head{background:#1a2b4a;color:#fff;text-align:center;padding:8px 4px;font-weight:700;font-size:12px}
      .ag-cel{background:#fff;min-height:96px;padding:4px;cursor:pointer;transition:background .1s}
      .ag-cel:hover{background:#f1f5f9}
      .ag-vazia{background:#f8fafc;cursor:default}
      .ag-hoje{background:#fff7ed;box-shadow:inset 0 0 0 2px #f59e0b}
      .ag-num{font-size:12px;font-weight:700;color:#334155;margin-bottom:2px}
      .ag-chips{display:flex;flex-direction:column;gap:2px}
      .ag-chip{color:#fff;font-size:11px;line-height:1.25;padding:2px 5px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
      .ag-legenda{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:12px;color:#475569}
      .ag-legenda span{display:inline-flex;align-items:center;gap:5px}
      .ag-dot{width:10px;height:10px;border-radius:3px;display:inline-block}
      .ag-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}
      .ag-modal{background:#fff;border-radius:12px;max-width:460px;width:100%;padding:18px;max-height:90vh;overflow:auto}
    </style>
    <div class="ag-top">
      <h3>${meses[mes]} de ${ano}</h3>
      <div class="ag-nav" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <select id="agFiltro" onchange="agSetFiltro(this.value)" title="Filtrar por responsável" style="padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px">
          <option value="">👥 Todas as agendas</option>
          ${agResponsaveis().map(r => `<option ${agNorm(r) === agNorm(filtro) ? "selected" : ""}>${escapeHtml(r)}</option>`).join("")}
        </select>
        <button class="btn btn-secondary" onclick="agMes(-1)">◀</button>
        <button class="btn btn-secondary" onclick="agHoje()">Hoje</button>
        <button class="btn btn-secondary" onclick="agMes(1)">▶</button>
        <button class="btn btn-primary" onclick="agNovoEvento('')">+ Novo evento</button>
      </div>
    </div>
    <div class="ag-grid">
      ${semana.map(s => `<div class="ag-head">${s}</div>`).join("")}
      ${celulas}
    </div>
    <div class="ag-legenda">
      ${AG_TIPOS.map(t => `<span><i class="ag-dot" style="background:${agCorTipo(t)}"></i>${t}</span>`).join("")}
    </div>
  `;
}

function agMes(delta) {
  STATE.ag.mes += delta;
  if (STATE.ag.mes < 0) { STATE.ag.mes = 11; STATE.ag.ano--; }
  if (STATE.ag.mes > 11) { STATE.ag.mes = 0; STATE.ag.ano++; }
  agRender();
}
function agHoje() { const h = new Date(); STATE.ag.ano = h.getFullYear(); STATE.ag.mes = h.getMonth(); agRender(); }

// Lista para o filtro da agenda: TODOS os colaboradores + os líderes/sócios do organograma + donos de eventos.
// Lista fixa de responsáveis para o filtro da agenda (definida pela RH).
const AGENDA_RESPONSAVEIS = [
  "Luiza Garzon", "Denayre Monte", "Jéssica Monalisa", "Aline Cardoso", "Alan Souza",
  "Saulo Gomes", "João Ricardo", "Anália Gabriely", "Mariano Maia", "Daniel Jourdain",
  "André Coelho", "Jeffany Alencar", "Victor Pinheiro", "Mary Diane", "Cleylson",
  "Gustavo Freitas", "Victor Farias", "Lucas Nogueira"
];
function agResponsaveis() {
  const set = {};
  AGENDA_RESPONSAVEIS.forEach(n => set[n] = true);
  // inclui também donos de eventos já criados (caso não estejam na lista)
  (STATE.ag.eventos || []).forEach(ev => { const r = String(ev.Responsavel || "").trim(); if (r) set[r] = true; });
  return Object.keys(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt"));
}
function agSetFiltro(v) { STATE.ag.filtro = v || ""; agRender(); }

function agModal(html) {
  agFecharModal();
  const bg = document.createElement("div");
  bg.className = "ag-modal-bg"; bg.id = "agModalBg";
  bg.onclick = (e) => { if (e.target === bg) agFecharModal(); };
  bg.innerHTML = `<div class="ag-modal">${html}</div>`;
  document.body.appendChild(bg);
}
function agFecharModal() { const b = document.getElementById("agModalBg"); if (b) b.remove(); }

function agFormEvento(ev) {
  ev = ev || {};
  const iso = agDataISO(ev.Data) || "";
  return `
    <h3 style="margin-top:0;color:var(--azul,#1a2b4a)">${ev.Id ? "Editar evento" : "Novo evento"}</h3>
    <input type="hidden" id="evId" value="${escapeHtml(ev.Id || "")}">
    <div class="form-row"><label>Título *</label><input id="evTitulo" type="text" value="${escapeHtml(ev.Titulo || "")}"></div>
    <div class="grid g2">
      <div class="form-row"><label>Data *</label><input id="evData" type="date" value="${iso}"></div>
      <div class="form-row"><label>Tipo</label><select id="evTipo">${AG_TIPOS.map(t => `<option ${agNorm(t) === agNorm(ev.Tipo) ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="form-row"><label>Início</label><input id="evIni" type="time" value="${escapeHtml(ev.HoraInicio || "")}"></div>
      <div class="form-row"><label>Fim</label><input id="evFim" type="time" value="${escapeHtml(ev.HoraFim || "")}"></div>
    </div>
    <div class="form-row"><label>Local</label><input id="evLocal" type="text" value="${escapeHtml(ev.Local || "")}"></div>
    <div class="form-row"><label>Responsável (líder / sócio)</label>
      <input id="evResp" type="text" list="dl-ag-resp" placeholder="De quem é este compromisso" value="${escapeHtml(ev.Responsavel || "")}">
      <datalist id="dl-ag-resp">${agResponsaveis().map(r => `<option value="${escapeHtml(r)}"></option>`).join("")}</datalist>
    </div>
    <div class="form-row"><label>Descrição</label><textarea id="evDesc">${escapeHtml(ev.Descricao || "")}</textarea></div>
    <div class="actions" style="justify-content:space-between">
      <div>${ev.Id ? `<button class="btn btn-secondary" onclick="agExcluirEvento('${escapeHtml(ev.Id)}')">Excluir</button>` : ""}</div>
      <div>
        <button class="btn btn-secondary" onclick="agFecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="agSalvarEvento()">Salvar</button>
      </div>
    </div>
  `;
}

function agNovoEvento(iso) { agModal(agFormEvento({ Data: iso || "" })); }
function agAbrirEvento(id) {
  const ev = (STATE.ag.eventos || []).find(e => String(e.Id) === String(id));
  if (ev) agModal(agFormEvento(ev));
}

async function agSalvarEvento() {
  const dados = {
    id: el("#evId").value, titulo: el("#evTitulo").value.trim(), data: el("#evData").value,
    tipo: el("#evTipo").value, horaInicio: el("#evIni").value, horaFim: el("#evFim").value,
    local: el("#evLocal").value.trim(), descricao: el("#evDesc").value,
    responsavel: (el("#evResp") ? el("#evResp").value.trim() : "")
  };
  if (!dados.titulo || !dados.data) { toast("Informe título e data.", "err"); return; }
  try {
    await api("salvarEventoAgenda", dados);
    agFecharModal();
    toast("Evento salvo.", "ok");
    await agCarregar();
  } catch (e) { toast(e.message, "err"); }
}

async function agExcluirEvento(id) {
  if (!confirm("Excluir este evento?")) return;
  try {
    await api("excluirEventoAgenda", { id });
    agFecharModal();
    toast("Evento excluído.", "ok");
    await agCarregar();
  } catch (e) { toast(e.message, "err"); }
}

/* ===================== RECRUTAMENTO / VAGAS ===================== */

async function renderVagas() {
  setMain(`<div class="loading">Carregando recrutamento...</div>`);
  let r;
  try { r = await api("listarVagas"); }
  catch (e) { setMain(`<div class="msg err">${escapeHtml(e.message)}</div>`); return; }

  STATE.cache.vagas = r.vagas || [];
  STATE.cache.vagasUnidades = r.unidades || [];
  const k = r.kpis || {};
  const statusOpts = ["SELEÇÃO", "TESTE", "ENCERRADA", "CANCELADA"];

  setMain(`
    <div class="page-title">
      <div><h2>Recrutamento</h2><p>Vagas do Controle de Vagas — Grupo Evol.</p></div>
      <button class="btn btn-primary" onclick="abrirVagaForm()">+ Abrir Vaga</button>
    </div>

    ${r.erroAba ? `<div class="msg warn">${escapeHtml(r.erroAba)}</div>` : ""}

    <div class="grid g4">
      <div class="kpi" style="border-left-color:var(--warn)"><small>Em Seleção</small><strong>${k.selecao || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>Em Teste</small><strong>${k.teste || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--ok)"><small>Encerradas</small><strong>${k.encerradas || 0}</strong></div>
      <div class="kpi" style="border-left-color:var(--bad)"><small>Canceladas</small><strong>${k.canceladas || 0}</strong></div>
    </div>

    <div class="card">
      <div class="grid g3">
        <div class="form-row"><label>Buscar vaga ou candidato</label>
          <input id="vgBusca" type="text" placeholder="Digite..." oninput="filtrarVagas()"></div>
        <div class="form-row"><label>Unidade</label>
          <select id="vgUnidade" onchange="filtrarVagas()">
            <option value="">Todas</option>
            ${(STATE.cache.vagasUnidades || []).map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row"><label>Status</label>
          <select id="vgStatus" onchange="filtrarVagas()">
            <option value="">Todos</option>
            ${statusOpts.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>
      </div>
      <div id="tabelaVagas"></div>
    </div>
  `);
  filtrarVagas();
}

function vagaGet(row, nomes) {
  const limpa = s => normalize(s).replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  for (const n of nomes) {
    const alvo = limpa(n);
    const k = Object.keys(row).find(h => limpa(h) === alvo);
    if (k && String(row[k]).trim() !== "") return row[k];
  }
  return "";
}

function filtrarVagas() {
  const dados = STATE.cache.vagas || [];
  const busca = normalize(el("#vgBusca") ? el("#vgBusca").value : "");
  const fU = normalize(el("#vgUnidade") ? el("#vgUnidade").value : "");
  const fS = normalize(el("#vgStatus") ? el("#vgStatus").value : "");

  const filtradas = dados.filter(v => {
    const uni = normalize(vagaGet(v, ["UNIDADE"]));
    const st = normalize(vagaGet(v, ["STATUS"]));
    const texto = normalize(vagaGet(v, ["VAGA"]) + " " + vagaGet(v, ["CANDIDATO"]) + " " + vagaGet(v, ["GESTOR"]));
    return (!fU || uni.indexOf(fU) !== -1) &&
           (!fS || st.indexOf(fS) !== -1) &&
           (!busca || texto.indexOf(busca) !== -1);
  });

  const cols = [
    ["ID", ["ID"]], ["VAGA", ["VAGA"]], ["UNIDADE", ["UNIDADE"]], ["SETOR", ["SETOR"]],
    ["MOTIVO", ["MOTIVO"]], ["SUBSTITUÍDO", ["COLAB SUBSTITUIDO", "COLABORADOR SUBSTITUIDO", "SUBSTITUIDO"]],
    ["URGÊNCIA", ["URGENCIA", "URGÊNCIA", "PRIORIDADE"]], ["GESTOR", ["GESTOR"]], ["ABERTURA", ["DATA ABERTURA", "ABERTURA", "ABERTA"]],
    ["DIAS EM ABERTO", ["DIAS EM ABERTO"]], ["CANDIDATO", ["CANDIDATO"]],
    ["STATUS", ["STATUS"]], ["SLA", ["SLA STATUS", "SLA"]]
  ];

  if (!filtradas.length) { el("#tabelaVagas").innerHTML = `<div class="empty">Nenhuma vaga encontrada.</div>`; return; }
  el("#tabelaVagas").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>${cols.map(c => `<th>${escapeHtml(c[0])}</th>`).join("")}<th>Candidato / Status</th></tr></thead>
      <tbody>
        ${filtradas.map(v => {
          const id = vagaGet(v, ["ID"]);
          const st = normalize(vagaGet(v, ["STATUS"]));
          const candAtual = vagaGet(v, ["CANDIDATO"]);
          const opts = ["SELEÇÃO", "TESTE", "ENCERRADA", "CANCELADA"];
          const acao = `
            <div style="display:flex;flex-direction:column;gap:4px;min-width:150px">
              <input type="text" id="cand_${escapeHtml(id)}" value="${escapeHtml(candAtual)}" placeholder="Nome do candidato" style="padding:5px">
              <div style="display:flex;gap:4px">
                <select id="stv_${escapeHtml(id)}" style="flex:1">
                  ${opts.map(o => `<option value="${o}" ${normalize(o) === st ? "selected" : ""}>${o}</option>`).join("")}
                </select>
                <button class="btn btn-primary" style="padding:5px 8px;min-height:auto" onclick="salvarVagaLinha('${escapeHtml(id)}')">Salvar</button>
                <button class="btn btn-secondary" style="padding:5px 8px;min-height:auto;color:#b91c1c" title="Excluir vaga" onclick="excluirVagaUI('${escapeHtml(id)}')">🗑️</button>
              </div>
            </div>`;
          return `<tr>${cols.map(c => `<td>${formatarVagaCelula(c[0], vagaGet(v, c[1]))}</td>`).join("")}<td>${id ? acao : ""}</td></tr>`;
        }).join("")}
      </tbody>
    </table></div>`;
}

async function excluirVagaUI(id) {
  if (!confirm("Excluir esta vaga? Esta ação não pode ser desfeita.")) return;
  try {
    const r = await api("excluirVaga", { id: id });
    toast(r.msg || "Vaga excluída.", "ok");
    await renderVagas();
  } catch (e) { toast(e.message, "err"); }
}

async function salvarVagaLinha(id) {
  const cand = document.getElementById("cand_" + id);
  const stv = document.getElementById("stv_" + id);
  try {
    const r = await api("mudarStatusVaga", { id: id, status: stv ? stv.value : "", candidato: cand ? cand.value.trim() : "" });
    toast(r.msg, "ok");
    await renderVagas();
  } catch (e) { toast(e.message, "err"); }
}

async function mudarStatusVagaUI(id, status) {
  try {
    const r = await api("mudarStatusVaga", { id: id, status: status });
    toast(r.msg, "ok");
    await renderVagas();
  } catch (e) { toast(e.message, "err"); }
}

function formatarVagaCelula(coluna, valor) {
  if (coluna === "STATUS") {
    const v = normalize(valor);
    let cls = "badge";
    if (["ABERTA", "ENCERRADA"].includes(v)) cls += " ok";
    else if (v === "CANCELADA") cls += " bad";
    else if (["SELECAO", "TESTE"].includes(v)) cls += " warn";
    return valor ? `<span class="${cls}">${escapeHtml(valor)}</span>` : "";
  }
  if (coluna === "SLA") {
    const v = normalize(valor);
    let cls = "badge";
    if (v.indexOf("CRITIC") !== -1) cls += " bad";
    else if (v.indexOf("ATENC") !== -1) cls += " warn";
    else if (v.indexOf("NORMAL") !== -1) cls += " ok";
    return valor ? `<span class="${cls}">${escapeHtml(valor)}</span>` : "";
  }
  return escapeHtml(valor);
}

const SETORES = ["Cozinha", "Salão", "Bar", "Almoxarifado", "Administrativo", "Limpeza", "Caixa", "Recepção", "DP", "Compras"];

// Líderes e sócios operadores por unidade (solicitantes de vaga): [nome, unidade, perfil]
const SOLICITANTES = [
  ["Pablo Macedo", "PARRILEIRO ALDEOTA", "Liderança"],
  ["Roger Fernando", "PARRILEIRO ALDEOTA", "Liderança"],
  ["Leidiana Silveira", "PARRILEIRO ALDEOTA", "Liderança"],
  ["David Lira", "PARRILEIRO ALDEOTA", "Liderança"],
  ["Alan Souza", "PARRILEIRO ALDEOTA", "Sócio Operador"],
  ["João Ricardo", "PARRILEIRO ALDEOTA", "Sócio Operador"],
  ["João Ricardo", "PARRILEIRO SUL", "Sócio Operador"],
  ["Amanda Linhares", "PARRILEIRO ALDEOTA", "Liderança"],
  ["Denayre Monte", "EVOL", "Sócio Operador"],
  ["Jeffany Alencar", "EVOL", "RH"],
  ["Jéssica Monalisa", "EVOL", "RH"],
  ["Anália Gabriely", "SEU CONRADO EUSÉBIO", "Sócio Operador"],
  ["Mariano Maia", "SEU CONRADO EUSÉBIO", "Sócio Operador"],
  ["Dney", "PARRILEIRO RIO MAR", "Liderança"],
  ["Saulo Gomes", "PARRILEIRO RIO MAR", "Sócio Operador"],
  ["Ralfo Ifanger", "PARRILEIRO RIO MAR", "Sócio Operador"],
  ["Luiza Garzon", "EVOL", "Liderança"],
  ["Bruno Ribeiro", "PARRILEIRO SUL", "Liderança"],
  ["Cardone Jr", "PARRILEIRO SUL", "Liderança"],
  ["Cardone Jr", "SEU CONRADO EUSÉBIO", "Liderança"],
  ["Paulo Sérgio", "SEU CONRADO EUSÉBIO", "Liderança"],
  ["Larisse Mota", "SEU CONRADO EUSÉBIO", "Liderança"],
  ["Jennifer Marques", "PARRILEIRO SUL", "Liderança"],
  ["Gustavo Freitas", "EVOL", "Diretor"],
  ["Victor Farias", "EVOL", "Diretor"],
  ["Lucas Nogueira", "EVOL", "Diretor"]
];

// Perfil de um solicitante (opcionalmente dentro de uma unidade).
function perfilSolicitante(nome, unidade) {
  const n = normalize(nome), u = normalize(unidade);
  let achou = SOLICITANTES.find(s => normalize(s[0]) === n && (!u || normalize(s[1]) === u));
  if (!achou) achou = SOLICITANTES.find(s => normalize(s[0]) === n);
  return achou ? achou[2] : "";
}

function solicitantesDaUnidade(unidade) {
  const u = normalize(unidade);
  const lider = (STATE.init.lideranca || []).map(l => l.Lider).filter(Boolean);
  const base = !u ? SOLICITANTES.map(s => s[0]) : SOLICITANTES.filter(s => normalize(s[1]) === u).map(s => s[0]);
  return [...new Set(base.concat(lider))].filter(Boolean).sort();
}

// Só os líderes (perfil Liderança + aba Lideranca) de uma unidade.
// Todos que são LIDERANÇA: quem aparece como líder de alguém no organograma + diretoria/sócios.
function todosOsLideres() {
  const set = {};
  (STATE.init.colaboradores || []).forEach(c => {
    // "Fulano e Beltrano" -> dois líderes
    String(c.Lider || "").split(/\s+e\s+/i).forEach(x => { const n = x.trim(); if (n) set[n] = true; });
  });
  (STATE.init.lideranca || []).forEach(l => { if (l.Lider) set[String(l.Lider).trim()] = true; });
  ["Gustavo Freitas", "Victor Farias", "Lucas Nogueira", "Luiza Garzon", "Saulo Gomes",
   "Aline Cardoso", "João Ricardo", "Jeffany Alencar"].forEach(n => set[n] = true);
  return Object.keys(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt"));
}

function lideresDaUnidade(unidade) {
  const u = normalize(unidade);
  const daLista = SOLICITANTES.filter(s => normalize(s[2]) === "LIDERANCA" && (!u || normalize(s[1]) === u)).map(s => s[0]);
  const daAba = (STATE.init.lideranca || []).filter(l => !u || normalize(l.Unidade) === u).map(l => l.Lider);
  return [...new Set(daLista.concat(daAba))].filter(Boolean).sort();
}

function filtrarAvaliadores() {
  const u = el("#tpUnidade") ? el("#tpUnidade").value : "";
  setDatalist("dl-avaliadores", lideresDaUnidade(u));
}

function filtrarSolicitantes() {
  const u = el("#avUnidade") ? el("#avUnidade").value : "";
  setDatalist("dl-solicitantes", solicitantesDaUnidade(u));
}

// Ao escolher o solicitante, já marca o perfil dele automaticamente.
function autoPerfilSolicitante() {
  const nome = el("#avSolicitante") ? el("#avSolicitante").value : "";
  const uni = el("#avUnidade") ? el("#avUnidade").value : "";
  const perfil = perfilSolicitante(nome, uni);
  const sel = document.getElementById("avTipoSolic");
  if (sel && perfil) {
    let existe = Array.from(sel.options).some(o => o.value === perfil);
    if (!existe) { const opt = document.createElement("option"); opt.value = perfil; opt.textContent = perfil; sel.appendChild(opt); }
    sel.value = perfil;
  }
}

function abrirVagaForm() {
  setMain(`
    <div class="page-title"><div><h2>Abrir Vaga</h2><p>A vaga entra no Controle de Vagas com status ABERTA e SLA de 10 dias.</p></div></div>
    <div class="card">
      <div class="grid g3">
        <div class="form-row"><label>Unidade *</label><input id="avUnidade" type="text" list="dl-unidades" onchange="filtrarSolicitantes()"></div>
        <div class="form-row"><label>Vaga (cargo) *</label><input id="avVaga" type="text" list="dl-cargos" placeholder="Ex: Cozinheiro JR"></div>
        <div class="form-row"><label>Setor *</label>
          <select id="avSetor"><option value="">Selecione...</option>${SETORES.map(s => `<option>${s}</option>`).join("")}</select>
        </div>
        <div class="form-row"><label>Motivo *</label>
          <select id="avMotivo">
            <option>Substituição</option><option>Aumento de Quadro</option>
            <option>Quadro Ideal</option><option>Substituição por Promoção</option>
          </select>
        </div>
        <div class="form-row"><label>Urgência *</label>
          <select id="avUrgencia"><option>Baixa</option><option selected>Normal</option><option>Alta</option><option>Crítica</option></select>
        </div>
        <div class="form-row"><label>Colaborador substituído (se substituição)</label><input id="avSubstituido" type="text" list="dl-colaboradores" placeholder="Nome de quem saiu"></div>
        <div class="form-row"><label>Perfil do Solicitante *</label>
          <select id="avTipoSolic"><option value="">Selecione...</option><option>Liderança</option><option>Sócio Operador</option><option>RH</option><option>Diretor</option></select>
        </div>
        <div class="form-row"><label>Solicitante *</label><input id="avSolicitante" type="text" list="dl-solicitantes" placeholder="Nome do solicitante" onchange="autoPerfilSolicitante()"></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" onclick="submitAbrirVaga()">Abrir vaga</button>
        <button class="btn btn-secondary" onclick="renderVagas()">Cancelar</button>
      </div>
    </div>
  `);
  // sugestões de solicitantes = líderes/sócios cadastrados + aba Lideranca
  setDatalist("dl-solicitantes", solicitantesDaUnidade(""));
}

async function submitAbrirVaga() {
  const dados = {
    unidade: el("#avUnidade").value.trim(),
    vaga: el("#avVaga").value.trim(),
    setor: el("#avSetor").value,
    motivo: el("#avMotivo").value,
    urgencia: el("#avUrgencia").value,
    substituido: el("#avSubstituido").value.trim(),
    tipoSolicitante: el("#avTipoSolic").value,
    solicitante: el("#avSolicitante").value.trim()
  };
  if (!dados.unidade || !dados.vaga || !dados.setor || !dados.solicitante) {
    toast("Preencha Unidade, Vaga, Setor e Solicitante.", "err"); return;
  }
  if (normalize(dados.motivo).indexOf("SUBSTITUICAO") !== -1 && !dados.substituido) {
    toast("Informe o colaborador substituído.", "err"); return;
  }
  try {
    const r = await api("abrirVaga", dados);
    toast(r.msg, "ok");
    await carregarInit();
    renderVagas();
  } catch (e) { toast(e.message, "err"); }
}

/* ===================== TESTE PRÁTICO ===================== */

async function renderTestePratico() {
  const etapas = ["Teste Prático", "Entrevista RH", "Entrevista Gestor", "Etapa Final"];
  const criterios = [
    ["crit_tecnico", "Conhecimento técnico", "Domínio dos conteúdos específicos da vaga"],
    ["crit_raciocinio", "Raciocínio lógico", "Capacidade de análise e tomada de decisão"],
    ["crit_comunicacao", "Comunicação e clareza", "Clareza nas respostas e postura comunicativa"],
    ["crit_organizacao", "Organização e tempo", "Cumprimento dos prazos dentro do teste"],
    ["crit_cultura", "Aderência à cultura", "Alinhamento de valores e perfil comportamental"],
    ["crit_experiencia", "Experiência prática", "Evidências de vivência real na área"]
  ];

  // Vagas em aberto para vincular o teste
  let vagasAbertas = [];
  try {
    const rv = await api("listarVagas");
    vagasAbertas = (rv.vagas || []).filter(v => ["ENCERRADA", "CANCELADA"].indexOf(normalize(vagaGet(v, ["STATUS"]))) === -1);
  } catch (e) {}
  const vagaOpts = vagasAbertas.map(v => {
    const id = vagaGet(v, ["ID"]);
    const label = [vagaGet(v, ["VAGA"]), vagaGet(v, ["UNIDADE"]), vagaGet(v, ["SETOR"])].filter(Boolean).join(" · ");
    return `<option value="${escapeHtml(id)}">${escapeHtml(id ? "#" + id + " — " : "")}${escapeHtml(label)}</option>`;
  }).join("");

  setMain(`
    <div class="page-title"><div><h2>Teste Prático</h2><p>Registro de resultado — Dados do candidato.</p></div></div>

    <div class="card">
      <div class="grid g3">
        <div class="form-row"><label>Unidade *</label><input id="tpUnidade" type="text" list="dl-unidades" placeholder="Selecione a unidade..." onchange="filtrarAvaliadores()"></div>
        <div class="form-row"><label>Nome do candidato *</label><input id="tpCandidato" type="text" list="dl-emteste" placeholder="Escolha quem está testando..." onchange="preencherDoTesteRH()"><datalist id="dl-emteste"></datalist></div>
        <div class="form-row"><label>Telefone do candidato</label><input id="tpTelefone" type="text" inputmode="tel" placeholder="(85) 90000-0000"></div>
        <div class="form-row"><label>Currículo (PDF/imagem)</label><input id="tpCurriculo" type="file" accept=".pdf,.doc,.docx,image/*"></div>
        <div class="form-row"><label>Vaga pretendida (cargo)</label><input id="tpCargo" type="text" list="dl-cargos" placeholder="Ex: Cozinheiro JR" onchange="autofillSalarioTeste(this.value)"></div>
        <div class="form-row"><label>Salário do cargo (R$)</label><input id="tpSalario" type="number" step="0.01" class="money" readonly value="0"></div>
        <div class="form-row"><label>Setor</label>
          <select id="tpSetor"><option value="">Selecione...</option>${SETORES.map(s => `<option>${s}</option>`).join("")}</select></div>
        <div class="form-row"><label>Vincular à vaga (Recrutamento)</label>
          <select id="tpVagaId"><option value="">Nenhuma / avulso</option>${vagaOpts}</select></div>
        <div class="form-row"><label>Teste — Dia 1 *</label><input id="tpData" type="date"></div>
        <div class="form-row"><label>Teste — Dia 2</label><input id="tpData2" type="date"></div>
        <div class="form-row"><label>Teste — Dia 3</label><input id="tpData3" type="date"></div>
        <div class="form-row"><label>Etapa do processo seletivo</label>
          <select id="tpEtapa"><option value="">Selecione...</option>${etapas.map(s => `<option>${s}</option>`).join("")}</select></div>
        <div class="form-row"><label>Escala *</label>
          <select id="tpEscala"><option value="">Selecione a escala...</option><option>6X1</option><option>5X2</option><option>12X36</option><option>ROTATIVA</option></select></div>
        <div class="form-row"><label>Dia de folga *</label>
          <select id="tpFolga"><option value="">Selecione o dia...</option><option>Segunda</option><option>Terça</option><option>Quarta</option><option>Quinta</option><option>Sexta</option><option>Sábado</option><option>Domingo</option><option>Rotativa</option></select></div>
        <div class="form-row"><label>Avaliador responsável *</label><input id="tpAvaliador" type="text" list="dl-avaliadores" placeholder="Líder que aplicou o teste"></div>
      </div>

      <h3 style="margin-top:10px">Critérios avaliados</h3>
      <p class="card-subtitle">Marque os critérios em que o candidato foi aprovado.</p>
      <div class="grid g3">
        ${criterios.map(c => `
          <label class="check" style="align-items:flex-start;border:1px solid var(--border);border-radius:10px;padding:10px">
            <input type="checkbox" id="${c[0]}" value="${escapeHtml(c[1])}">
            <span><strong>${escapeHtml(c[1])}</strong><br><span class="muted">${escapeHtml(c[2])}</span></span>
          </label>`).join("")}
      </div>

      <div class="grid g3" style="margin-top:12px">
        <div class="form-row"><label>Nota final (0–10)</label><input id="tpNota" type="number" min="0" max="10" step="0.1" value="0"></div>
        <div class="form-row"><label>Nota mínima</label><input id="tpNotaMin" type="number" min="0" max="10" step="0.1" value="0"></div>
        <div class="form-row"><label>Satisfação do avaliador (1 a 5)</label>
          <select id="tpSatisfacao"><option value="">Selecione...</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>
      </div>

      <div class="form-row"><label>Observações</label><textarea id="tpObs"></textarea></div>

      <div class="actions">
        <button class="btn btn-primary" onclick="salvarTestePratico()">Salvar Resultado</button>
      </div>
    </div>

    <div class="card">
      <h3>Testes Registrados</h3>
      <div id="tabelaTestes"><div class="loading">Carregando...</div></div>
    </div>
  `);
  setDatalist("dl-avaliadores", lideresDaUnidade(""));
  await carregarEmTesteParaParecer();
  await carregarTestesTabela();
}

// Puxa os candidatos agendados pelo RH (quem está testando) para o líder dar o parecer.
async function carregarEmTesteParaParecer() {
  try {
    const r = await api("listarTestesRH");
    STATE.emTesteRH = (r.testesRH || []).filter(t => {
      const s = normalize(t.Status);
      return s === "" || s === "EM TESTE" || s === "EM ANDAMENTO" || s === "TESTANDO";
    });
    setDatalist("dl-emteste", STATE.emTesteRH.map(t => t.NomeCompleto).filter(Boolean));
  } catch (e) { STATE.emTesteRH = []; }
}

// Ao escolher o candidato, preenche unidade/cargo/telefone automaticamente.
function preencherDoTesteRH() {
  const nome = normalize((el("#tpCandidato") || {}).value || "");
  const t = (STATE.emTesteRH || []).find(x => normalize(x.NomeCompleto) === nome);
  if (!t) return;
  if (el("#tpUnidade") && t.Unidade) el("#tpUnidade").value = t.Unidade;
  if (el("#tpCargo") && t.Funcao) { el("#tpCargo").value = t.Funcao; autofillSalarioTeste(t.Funcao); }
  if (el("#tpTelefone") && t.Telefone) el("#tpTelefone").value = t.Telefone;
  if (el("#tpAvaliador") && t.LiderDireto) el("#tpAvaliador").value = t.LiderDireto;
  if (typeof filtrarAvaliadores === "function") filtrarAvaliadores();
  toast("Dados do candidato preenchidos automaticamente.", "info");
}

function autofillSalarioTeste(nomeCargo) {
  const c = STATE.init.cargos.find(x => normalize(x.Cargo) === normalize(nomeCargo));
  const campo = document.getElementById("tpSalario");
  if (campo && c) campo.value = c.SalarioTotal || ((Number(c.SalarioBase) || 0) + (Number(c.Complementar) || 0));
}

async function salvarTestePratico() {
  const candidato = el("#tpCandidato").value.trim();
  const data = el("#tpData").value;
  if (!candidato || !data) { toast("Preencha ao menos Candidato e Data do teste.", "err"); return; }

  const criterios = Array.from(document.querySelectorAll('#main input[id^="crit_"]:checked')).map(i => i.value).join(", ");

  const dados = {
    Unidade: el("#tpUnidade").value.trim(),
    Candidato: candidato,
    Telefone: (el("#tpTelefone") ? el("#tpTelefone").value.trim() : ""),
    Cargo: el("#tpCargo").value.trim(),
    Salario: el("#tpSalario").value,
    Setor: el("#tpSetor").value,
    VagaId: el("#tpVagaId").value,
    DataTeste: data,
    DataTeste2: el("#tpData2").value,
    DataTeste3: el("#tpData3").value,
    Etapa: el("#tpEtapa").value,
    Escala: el("#tpEscala").value,
    Folga: el("#tpFolga").value,
    Avaliador: el("#tpAvaliador").value.trim(),
    Nota: el("#tpNota").value,
    NotaMinima: el("#tpNotaMin").value,
    Satisfacao: el("#tpSatisfacao").value,
    Criterios: criterios,
    Observacoes: el("#tpObs").value
  };

  try {
    const r = await api("salvarTeste", dados);
    toast(r.msg || "Teste salvo.", "ok");
    if (r.resultado) toast("Resultado: " + r.resultado, "info");
    // envia currículo (se houver) vinculado ao candidato
    const fc = el("#tpCurriculo");
    if (fc && fc.files && fc.files[0]) {
      const f = fc.files[0];
      if (f.size > 15 * 1024 * 1024) { toast("Currículo muito grande (máx. 15 MB).", "err"); }
      else {
        try {
          toast("Enviando currículo...", "info");
          const b64 = await fileToBase64(f);
          const cur = { Candidato: candidato, Unidade: dados.Unidade, nomeArquivo: f.name, tipo: f.type || "application/octet-stream", base64: b64 };
          const body = "acao=uploadCurriculo&dados=" + encodeURIComponent(JSON.stringify(cur));
          await fetch(CONFIG.API_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body });
          toast("Currículo enviado.", "ok");
        } catch (e) { toast("Currículo não enviado: " + e.message, "err"); }
      }
    }
    // Dado o parecer, o candidato sai de "Quem está testando"
    try {
      const nomeCand = normalize(candidato);
      const idx = (STATE.emTesteRH || []).findIndex(x => normalize(x.NomeCompleto) === nomeCand);
      if (idx !== -1) {
        const lista = await api("listarTestesRH");
        const real = (lista.testesRH || []).findIndex(x => normalize(x.NomeCompleto) === nomeCand);
        if (real !== -1) {
          const res = (r && r.resultado) ? String(r.resultado) : "AVALIADO";
          await api("atualizarTesteRH", { index: real, dados: { Status: res } });
        }
      }
    } catch (e) { /* não bloqueia o salvamento do parecer */ }
    await renderTestePratico();
  } catch (e) { toast(e.message, "err"); }
}

async function carregarTestesTabela() {
  try {
    const r = await api("listarTestes");
    STATE.testesCache = r.testes || [];
    const cols = ["DataTeste", "Candidato", "Unidade", "Cargo", "Escala", "Folga", "Nota", "Resultado"];
    if (!STATE.testesCache.length) {
      document.getElementById("tabelaTestes").innerHTML = `<div class="empty">Nenhum teste registrado ainda.</div>`;
      return;
    }
    document.getElementById("tabelaTestes").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join("")}<th style="width:1%">Ações</th></tr></thead>
        <tbody>
          ${STATE.testesCache.map((t, i) => `<tr>
            ${cols.map(c => `<td>${formatarCelula(c, t[c])}</td>`).join("")}
            <td style="white-space:nowrap;text-align:right">
              <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" title="Marcar que o candidato desistiu" onclick="marcarDesistenciaTeste(${i})">Desistiu</button>
              <button class="btn btn-secondary" style="padding:4px 8px;font-size:13px;color:#b91c1c" title="Excluir teste" onclick="excluirTeste(${i})">🗑️</button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (e) {
    document.getElementById("tabelaTestes").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

async function excluirTeste(i) {
  const t = (STATE.testesCache || [])[i]; if (!t) return;
  if (!confirm("Excluir este teste? Esta ação não pode ser desfeita.")) return;
  try {
    await api("excluirRegistroModulo", { sheetKey: "testes", index: i, confereCol: "Candidato", confereVal: t.Candidato });
    toast("Teste excluído.", "ok");
    await carregarTestesTabela();
  } catch (e) { toast(e.message, "err"); }
}

async function marcarDesistenciaTeste(i) {
  const t = (STATE.testesCache || [])[i]; if (!t) return;
  if (!confirm("Marcar que o candidato DESISTIU deste teste?")) return;
  try {
    await api("atualizarRegistroModulo", { sheetKey: "testes", index: i, dados: { Resultado: "DESISTIU" } });
    toast("Marcado como desistência.", "ok");
    await carregarTestesTabela();
  } catch (e) { toast(e.message, "err"); }
}

/* ===================== LIDERANÇA (somente leitura) ===================== */

async function renderLideranca() {
  setMain(`
    <div class="page-title"><div><h2>Liderança</h2><p>Quem lidera quem, por unidade. Dados vêm da aba Lideranca da planilha.</p></div></div>
    <div class="card">
      <div class="grid g2">
        <div class="form-row"><label>Filtrar por Unidade</label>
          <input id="ldUnidade" type="text" list="dl-unidades" placeholder="Todas" oninput="filtrarLideranca()">
        </div>
        <div class="form-row"><label>Filtrar por Líder</label>
          <input id="ldLider" type="text" placeholder="Todos" oninput="filtrarLideranca()">
        </div>
      </div>
      <div id="tabelaLideranca"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarLideranca();
}

async function carregarLideranca() {
  try {
    const r = await api("listarLideranca");
    STATE.cache.lideranca = r.lideranca || [];
    filtrarLideranca();
  } catch (e) {
    document.getElementById("tabelaLideranca").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

function filtrarLideranca() {
  const dados = STATE.cache.lideranca || [];
  const fU = normalize((el("#ldUnidade") && el("#ldUnidade").value) || "");
  const fL = normalize((el("#ldLider") && el("#ldLider").value) || "");
  const filtradas = dados.filter(l =>
    (!fU || normalize(l.Unidade).indexOf(fU) !== -1) &&
    (!fL || normalize(l.Lider).indexOf(fL) !== -1)
  );
  document.getElementById("tabelaLideranca").innerHTML =
    tabelaComBadge(filtradas, ["Lider", "Liderado", "Unidade"]);
}

/* ===================== UNIDADES (somente leitura) ===================== */

async function renderUnidades() {
  setMain(`<div class="loading">Carregando unidades...</div>`);
  let info = [];
  try { const r = await api("listarUnidadesInfo"); info = r.unidades || []; } catch (e) {}
  const enderecoDe = {};
  info.forEach(u => { if (u.Unidade) enderecoDe[normalize(u.Unidade)] = u.Endereco || ""; });
  const unis = STATE.init.unidades || [];

  setMain(`
    <div class="page-title">
      <div><h2>Unidades</h2><p>As unidades são criadas automaticamente. Aqui você define o <b>endereço</b> de cada uma (usado no cabeçalho do ponto).</p></div>
    </div>
    <div class="card">
      ${unis.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Unidade</th><th>Endereço</th><th></th></tr></thead>
        <tbody>${unis.map((u, i) => `<tr>
          <td style="font-weight:600">${escapeHtml(u)}</td>
          <td><input id="endUni_${i}" type="text" value="${escapeHtml(enderecoDe[normalize(u)] || "")}" placeholder="Rua, número, bairro, cidade" style="width:100%"></td>
          <td><button class="btn btn-primary" onclick="salvarEnderecoUni('${escapeHtml(u).replace(/'/g, "\\'")}', ${i})">Salvar</button></td>
        </tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Nenhuma unidade cadastrada ainda.</div>`}
    </div>
  `);
}

async function salvarEnderecoUni(unidade, i) {
  const endereco = el("#endUni_" + i) ? el("#endUni_" + i).value.trim() : "";
  try {
    const r = await api("salvarEnderecoUnidade", { Unidade: unidade, Endereco: endereco });
    toast(r.msg || "Endereço salvo.", "ok");
  } catch (e) { toast(e.message, "err"); }
}

/* ===================== MÓDULOS GENÉRICOS (CRUD) ===================== */
/*
 * Cada módulo descreve: ação de listar, chave da resposta, ação de salvar,
 * campos do formulário e colunas exibidas na tabela.
 * O restante (renderização, coleta, envio) é genérico — ver renderModulo().
 */

const MODULES = {
  colaboradores: {
    label: "Colaboradores",
    listAction: "listarColaboradores", listKey: "colaboradores",
    saveAction: "salvarColaborador",
    columns: ["Nome", "CPF", "Unidade", "Cargo", "SalarioTotal", "Status"],
    fields: [
      { name: "Nome", label: "Nome", type: "text", required: true, col: "g2" },
      { name: "CPF", label: "CPF", type: "text" },
      { name: "CTPS", label: "CTPS", type: "text" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", onchange: "calcularVT()" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos", autofillSalario: true },
      { name: "Setor", label: "Setor", type: "text" },
      { name: "Turno", label: "Turno", type: "text" },
      { name: "Folga", label: "Folga", type: "text" },
      { name: "Telefone", label: "Telefone / Celular", type: "text" },
      { name: "SalarioBase", label: "Salário Base", type: "money" },
      { name: "Complementar", label: "Complementar", type: "money" },
      { name: "SalarioTotal", label: "Salário Total", type: "money", readonly: true, computed: true },
      { name: "DataAdmissao", label: "Data de Admissão", type: "date" },
      { name: "DataNascimento", label: "Data de Nascimento", type: "date" },
      { name: "FimExperiencia", label: "Fim da Experiência", type: "date" },
      { name: "Lider", label: "Líder", type: "text" },
      { name: "Bairro", label: "Bairro / Município", type: "datalist", list: "dl-bairros", onchange: "calcularVT()" },
      { name: "CidadeResidencia", label: "Cidade de Residência", type: "text" },
      { name: "QuerValeTransporte", label: "Vale Transporte", type: "select", options: ["Sim", "Não"] },
      { name: "ValeTransporteDia", label: "Vale Transporte por Dia (R$)", type: "money", readonly: true, computed: true },
      { name: "Integrado", label: "Colaborador foi integrado?", type: "select", options: ["Não", "Sim"] },
      { name: "DataIntegracao", label: "Mês/data da integração", type: "date" },
      { name: "PastaCompleta", label: "Pasta completa?", type: "select", options: ["Não", "Sim"] },
      { name: "PagamentoTeste", label: "Pagamento do teste prático (data)", type: "date" },
      { name: "ContaItau", label: "Tem conta Itaú?", type: "select", options: ["Não", "Sim"] },
      { name: "Somapay", label: "Tem Somapay?", type: "select", options: ["Não", "Sim"] },
      { name: "LinkDocumentacao", label: "Link da documentação (Google Drive)", type: "text", col: "g2" },
      { name: "Status", label: "Situação atual", type: "select", options: ["ATIVO", "AFASTADO", "DESLIGADO"], default: "ATIVO" },
      { name: "DataAfastamento", label: "Mês/data do afastamento (se afastado)", type: "date" },
      { name: "DataDesligamento", label: "Mês/data do desligamento (se desligado)", type: "date" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  cargos: {
    label: "Cargos",
    listAction: "listarCargos", listKey: "cargos",
    saveAction: "salvarCargo",
    columns: ["Cargo", "SalarioBase", "Complementar", "SalarioTotal"],
    fields: [
      { name: "Cargo", label: "Nome do Cargo", type: "text", required: true, col: "g2" },
      { name: "SalarioBase", label: "Salário Base", type: "money" },
      { name: "Complementar", label: "Complementar", type: "money" },
      { name: "SalarioTotal", label: "Salário Total", type: "money", readonly: true, computed: true }
    ]
  },

  treinamentos: {
    label: "Treinamentos",
    listAction: "listarTreinamentos", listKey: "treinamentos",
    saveAction: "salvarTreinamento",
    columns: ["Data", "Unidade", "Tema", "Tipo", "Ministrante", "HorasDadas"],
    fields: [
      { name: "Data", label: "Data", type: "date" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Tema", label: "Tema", type: "text", required: true, col: "g2" },
      { name: "Tipo", label: "Tipo", type: "select", options: ["PRESENCIAL", "ONLINE", "PRÁTICO"] },
      { name: "Ministrante", label: "Ministrante / Instrutor", type: "datalist", list: "dl-ministrantes", required: true },
      { name: "HorasDadas", label: "Horas Dadas", type: "number" },
      { name: "HorasAssistidas", label: "Horas Assistidas (média)", type: "number" },
      { name: "ParticipantesManuais", label: "Participantes", type: "textarea", col: "g2" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  fardamento: {
    label: "Fardamento / Estoque",
    listAction: "listarFardamento", listKey: "fardamento",
    saveAction: "salvarFardamento",
    columns: ["Unidade", "Item", "Tamanho", "QuantidadeEstoque", "QuantidadeMinima", "Status"],
    fields: [
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Item", label: "Item", type: "text", required: true },
      { name: "Tipo", label: "Tipo", type: "text" },
      { name: "Tamanho", label: "Tamanho", type: "text" },
      { name: "QuantidadeEstoque", label: "Quantidade em Estoque", type: "number" },
      { name: "QuantidadeMinima", label: "Quantidade Mínima", type: "number" },
      { name: "Fornecedor", label: "Fornecedor", type: "text" }
    ]
  },

  variavel: {
    label: "Variável da Liderança",
    listAction: "listarVariavel", listKey: "variavel",
    saveAction: "salvarVariavel",
    columns: ["Mes", "Ano", "Unidade", "Colaborador", "Cargo", "TipoVariavel", "Valor", "Pago"],
    fields: [
      { name: "Mes", label: "Mês", type: "select", required: true, options: [
        { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" }, { v: 4, l: "Abril" },
        { v: 5, l: "Maio" }, { v: 6, l: "Junho" }, { v: 7, l: "Julho" }, { v: 8, l: "Agosto" },
        { v: 9, l: "Setembro" }, { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" }
      ] },
      { name: "Ano", label: "Ano", type: "number", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "Colaborador", label: "Líder que recebeu", type: "datalist", list: "dl-lideres", required: true, col: "g2", hint: "Somente liderança" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos" },
      { name: "TipoVariavel", label: "Tipo de variável", type: "select", options: ["Bônus", "Premiação", "Comissão", "Participação em resultado", "Outro"] },
      { name: "Valor", label: "Valor pago (R$)", type: "moneyBR", required: true },
      { name: "Pago", label: "Já foi pago?", type: "select", options: ["Sim", "Não"], default: "Sim" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  utensilios: {
    label: "Desconto de Utensílios",
    listAction: "listarUtensilios", listKey: "utensilios",
    saveAction: "salvarUtensilio",
    columns: ["Unidade", "Cargo", "Mes", "Ano", "Percentual", "Ativo"],
    fields: [
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", hint: "Deixe vazio = vale para todas as unidades" },
      { name: "Cargo", label: "Cargo / Função", type: "datalist", list: "dl-cargos", hint: "Deixe vazio = vale para todos os cargos" },
      { name: "Mes", label: "Mês", type: "select", options: [
        { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" }, { v: 4, l: "Abril" },
        { v: 5, l: "Maio" }, { v: 6, l: "Junho" }, { v: 7, l: "Julho" }, { v: 8, l: "Agosto" },
        { v: 9, l: "Setembro" }, { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" }
      ] },
      { name: "Ano", label: "Ano", type: "number" },
      { name: "Percentual", label: "Percentual (%)", type: "number", step: 0.01, required: true, hint: "Ex.: 5 para 5%. Incide SÓ sobre o complementar." },
      { name: "Ativo", label: "Ativo?", type: "select", options: ["Sim", "Não"], default: "Sim" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  entregas: {
    label: "Entrega de Fardamento / EPI",
    listAction: "listarEntregas", listKey: "entregas",
    saveAction: "salvarEntrega",
    columns: ["Data", "Colaborador", "Unidade", "Tipo", "Item", "Tamanho", "Quantidade", "EntreguePor"],
    fields: [
      { name: "Data", label: "Data da entrega", type: "date", required: true },
      { name: "Colaborador", label: "Colaborador", type: "datalist", list: "dl-colaboradores", required: true, col: "g2" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Tipo", label: "Tipo", type: "select", options: ["Fardamento", "EPI"], default: "Fardamento", required: true },
      { name: "Item", label: "Item entregue", type: "text", required: true, hint: "Ex.: Camisa, Calça, Bota, Luva, Avental" },
      { name: "Tamanho", label: "Tamanho", type: "text", hint: "Ex.: P, M, G, 42" },
      { name: "Quantidade", label: "Quantidade", type: "number", min: 1, default: 1 },
      { name: "Motivo", label: "Motivo", type: "select", options: ["Admissão", "Troca / desgaste", "Extra", "Perda", "Devolução"] },
      { name: "AssinouRecebimento", label: "Assinou o recebimento?", type: "select", options: ["Não", "Sim"] },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  desligamentos: {
    label: "Entrevista de Desligamento",
    listAction: "listarDesligamentos", listKey: "desligamentos",
    saveAction: "salvarDesligamento",
    columns: ["Data", "Unidade", "Colaborador", "Cargo", "LiderDireto", "TipoDesligamento", "MotivoPrincipal", "Recontrataria", "PreenchidoPor"],
    fields: [
      { name: "Data", label: "Data da entrevista", type: "date", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "Setor", label: "Setor", type: "text" },
      { name: "Colaborador", label: "Nome do colaborador", type: "datalist", list: "dl-colaboradores", required: true, col: "g2" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos" },
      { name: "LiderDireto", label: "Líder direto", type: "text", hint: "Deixe vazio para preencher automático pelo organograma" },
      { name: "DataAdmissao", label: "Data de admissão", type: "date" },
      { name: "DataDesligamento", label: "Data de desligamento", type: "date" },
      { name: "TipoDesligamento", label: "Tipo de desligamento", type: "select", options: ["Voluntário (pediu demissão)", "Involuntário (empresa desligou)", "Término de contrato", "Justa causa"] },
      { name: "QuisFazerEntrevista", label: "A pessoa quis fazer a entrevista?", type: "select", options: ["Sim", "Não (recusou)", "Não localizada"], default: "Sim", required: true },
      { name: "MotivoPrincipal", label: "Motivos (pode marcar mais de um)", type: "multicheck", col: "g2", options: ["Salário / benefícios", "Clima / liderança", "Distância / transporte", "Outra oportunidade", "Motivos pessoais / saúde", "Desempenho", "Fim de contrato", "Outros"] },
      { name: "MotivoDetalhe", label: "Detalhe do motivo", type: "textarea", col: "g2" },
      { name: "Recontrataria", label: "A empresa recontrataria?", type: "select", options: ["Sim", "Não"] },
      { name: "AvaliacaoEmpresa", label: "Nota para a empresa (1-5)", type: "select", options: ["1", "2", "3", "4", "5"] },
      { name: "AvaliacaoLideranca", label: "Nota para a liderança (1-5)", type: "select", options: ["1", "2", "3", "4", "5"] },
      { name: "PontosPositivos", label: "Pontos positivos (o que era bom)", type: "textarea", col: "g2" },
      { name: "PontosMelhoria", label: "Pontos de melhoria (o que faria a pessoa ficar)", type: "textarea", col: "g2" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },
  indicadores: {
    listAction: "listarIndicadoresMensais", listKey: "indicadores",
    saveAction: "salvarIndicadorMensal",
    columns: ["Mes", "Ano", "Unidade", "Ativos", "Admissoes", "Desligamentos", "AbsenteismoPercentual", "Faturamento"],
    fields: [
      { name: "Mes", label: "Mês", type: "select", required: true, options: [
        { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" }, { v: 4, l: "Abril" },
        { v: 5, l: "Maio" }, { v: 6, l: "Junho" }, { v: 7, l: "Julho" }, { v: 8, l: "Agosto" },
        { v: 9, l: "Setembro" }, { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" }
      ] },
      { name: "Ano", label: "Ano", type: "number", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "Ativos", label: "Ativos no mês", type: "number", min: 0 },
      { name: "Admissoes", label: "Admissões no mês", type: "number", min: 0 },
      { name: "Desligamentos", label: "Desligamentos no mês", type: "number", min: 0 },
      { name: "AbsenteismoPercentual", label: "Absenteísmo (%)", type: "number", step: 0.01 },
      { name: "Faturamento", label: "Faturamento do mês (R$)", type: "moneyBR" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  absenteismo: {
    label: "Absenteísmo",
    listAction: "listarAbsenteismo", listKey: "absenteismo",
    saveAction: "salvarAbsenteismo",
    columns: ["Mes", "Ano", "Unidade", "Colaborador", "Atestados", "TotalFaltas", "PercentualAbsenteismo"],
    fields: [
      { name: "Mes", label: "Mês (1-12)", type: "number", min: 1, max: 12, required: true },
      { name: "Ano", label: "Ano", type: "number", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "Setor", label: "Setor", type: "text" },
      { name: "Colaborador", label: "Colaborador", type: "datalist", list: "dl-colaboradores", required: true },
      { name: "DiasEscala", label: "Dias de Escala no mês", type: "number" },
      { name: "FaltasInjustificadas", label: "Faltas Injustificadas", type: "number" },
      { name: "FaltasJustificadas", label: "Faltas Justificadas", type: "number" },
      { name: "Atestados", label: "Atestados (dias)", type: "number" },
      { name: "CID", label: "CID (do atestado)", type: "text" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  sla: {
    label: "SLA de Vagas",
    listAction: "listarSLA", listKey: "sla",
    saveAction: "salvarSLA",
    columns: ["Mes", "Ano", "Unidade", "SLA_Dias", "VagasFechadas"],
    fields: [
      { name: "Mes", label: "Mês (1-12)", type: "number", min: 1, max: 12, required: true },
      { name: "Ano", label: "Ano", type: "number", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "SLA_Dias", label: "SLA (dias)", type: "number" },
      { name: "VagasFechadas", label: "Vagas Fechadas no Período", type: "number" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  ajustesPonto: {
    label: "Ajustes de Ponto",
    listAction: "listarAjustesPonto", listKey: "ajustes",
    saveAction: "solicitarAjustePonto",
    columns: ["DataRegistro", "Colaborador", "Data", "Hora", "TipoBatida", "Status"],
    fields: [
      { name: "Colaborador", label: "Colaborador", type: "datalist", list: "dl-colaboradores", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Data", label: "Data do Ponto a Ajustar", type: "date", required: true },
      { name: "Hora", label: "Hora Correta", type: "time", required: true },
      { name: "TipoBatida", label: "Tipo de Batida", type: "select", options: ["ENTRADA", "SAÍDA", "INÍCIO INTERVALO", "FIM INTERVALO"] },
      { name: "Justificativa", label: "Justificativa", type: "textarea", col: "g2", required: true }
    ]
  }
};

function campoValorInicial(f) {
  if (f.default !== undefined) return f.default;
  return "";
}

function campoHtml(f) {
  const idc = "campo_" + f.name;
  const req = f.required ? "required" : "";
  const readonly = f.readonly ? "readonly" : "";
  const val = escapeHtml(campoValorInicial(f));
  const wrapClass = f.col ? f.col : "";

  let inputHtml = "";
  const onch = f.onchange ? `onchange="${f.onchange}"` : "";
  if (f.type === "textarea") {
    inputHtml = `<textarea id="${idc}" ${req} ${readonly}>${val}</textarea>`;
  } else if (f.type === "multicheck") {
    inputHtml = `<div id="${idc}" data-multicheck="1" style="display:flex;flex-wrap:wrap;gap:8px 16px;padding:8px 0">
      ${f.options.map((o, ix) => `<label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer;margin:0">
        <input type="checkbox" value="${escapeHtml(o)}" id="${idc}_${ix}" style="width:auto;margin:0"> ${escapeHtml(o)}
      </label>`).join("")}
    </div>`;
  } else if (f.type === "select") {
    inputHtml = `<select id="${idc}" ${req} ${onch}>
      <option value="">Selecione...</option>
      ${f.options.map(o => {
        const v = (o && typeof o === "object") ? o.v : o;
        const l = (o && typeof o === "object") ? o.l : o;
        return `<option value="${escapeHtml(v)}" ${String(v) === String(f.default) ? "selected" : ""}>${escapeHtml(l)}</option>`;
      }).join("")}
    </select>`;
  } else if (f.type === "datalist") {
    inputHtml = `<input id="${idc}" type="text" list="${f.list}" value="${val}" autocomplete="off" ${req} ${readonly}
      ${f.autofillSalario ? `onchange="autofillSalarioPorCargo(this.value); calcularVT();"` : onch}>`;
  } else if (f.type === "moneyBR") {
    inputHtml = `<input id="${idc}" type="text" inputmode="decimal" class="money" value="${val}" ${req} ${readonly}
      placeholder="Ex: 1.490.688">`;
  } else if (f.type === "money" || f.type === "number") {
    inputHtml = `<input id="${idc}" type="number" step="${f.step || "0.01"}" min="${f.min !== undefined ? f.min : ""}"
      max="${f.max !== undefined ? f.max : ""}" value="${val}" ${req} ${readonly}
      class="${f.type === "money" ? "money" : ""}"
      ${(f.name === "SalarioBase" || f.name === "Complementar") ? `oninput="recalcularSalarioTotal()"` : ""}>`;
  } else if (f.type === "date") {
    inputHtml = `<input id="${idc}" type="date" value="${val}" ${req} ${readonly}>`;
  } else if (f.type === "time") {
    inputHtml = `<input id="${idc}" type="time" value="${val}" ${req} ${readonly}>`;
  } else {
    inputHtml = `<input id="${idc}" type="text" value="${val}" ${req} ${readonly} ${onch}>`;
  }

  return `<div class="form-row ${wrapClass}"><label>${escapeHtml(f.label)}${f.required ? " *" : ""}</label>${inputHtml}</div>`;
}

function autofillSalarioPorCargo(nomeCargo) {
  const c = STATE.init.cargos.find(x => normalize(x.Cargo) === normalize(nomeCargo));
  if (!c) return;
  const base = document.getElementById("campo_SalarioBase");
  const comp = document.getElementById("campo_Complementar");
  if (base) base.value = c.SalarioBase || 0;
  if (comp) comp.value = c.Complementar || 0;
  recalcularSalarioTotal();
}

function recalcularSalarioTotal() {
  const base = document.getElementById("campo_SalarioBase");
  const comp = document.getElementById("campo_Complementar");
  const total = document.getElementById("campo_SalarioTotal");
  if (base && comp && total) {
    total.value = (Number(base.value) || 0) + (Number(comp.value) || 0);
  }
}

function coletarCampos(fields) {
  const out = {};
  fields.forEach(f => {
    const elCampo = document.getElementById("campo_" + f.name);
    if (!elCampo) return;
    if (f.type === "multicheck") {
      const marcados = [...elCampo.querySelectorAll("input[type=checkbox]")].filter(x => x.checked).map(x => x.value);
      out[f.name] = marcados.join(", ");
      return;
    }
    out[f.name] = f.type === "moneyBR" ? parseMoedaBR(elCampo.value) : elCampo.value;
  });
  return out;
}

function validarCampos(fields) {
  for (const f of fields) {
    if (f.required) {
      const v = document.getElementById("campo_" + f.name).value;
      if (!String(v || "").trim()) {
        toast("Preencha o campo obrigatório: " + f.label, "err");
        return false;
      }
    }
  }
  return true;
}

async function renderModulo(key) {
  const cfg = MODULES[key];
  STATE.editModulo = null;
  setMain(`
    <div class="page-title">
      <div><h2>${escapeHtml(cfg.label)}</h2>${cfg.note ? `<p>${escapeHtml(cfg.note)}</p>` : ""}</div>
    </div>

    <div class="card">
      <h3>Novo Registro</h3>
      <div id="editBanner" style="display:none;background:#fff7ed;border:1px solid #f59e0b;color:#9a3412;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:13px">
        ✏️ Você está <b>editando</b> um registro existente. Altere e clique em <b>Atualizar registro</b>. Para criar um novo em vez de editar, clique em <b>Limpar</b>.
      </div>
      <form id="formModulo" class="grid g2" onsubmit="return false;">
        ${cfg.fields.map(campoHtml).join("")}
      </form>
      <div class="actions">
        <button class="btn btn-primary" id="btnSalvarModulo" onclick="salvarModulo('${key}')">Salvar</button>
        <button class="btn btn-secondary" onclick="renderModulo('${key}')">Limpar</button>
      </div>
    </div>

    <div class="card">
      <h3>Registros</h3>
      <div id="tabelaModulo"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarTabelaModulo(key);
}

async function carregarTabelaModulo(key) {
  const cfg = MODULES[key];
  try {
    let linhas;
    if (key === "colaboradores") {
      // Usa os dados já traduzidos (Função, salário resolvido) em vez das colunas cruas.
      const r = await api("listarHeadcount");
      linhas = (r.headcount || []).map(c => ({
        Nome: c.Nome,
        CPF: c.CPF,
        Unidade: c.Unidade,
        Cargo: c.Cargo || c.Funcao,
        SalarioTotal: c.Salario,
        Status: c.Status
      }));
    } else {
      const r = await api(cfg.listAction);
      linhas = r[cfg.listKey] || [];
    }
    STATE.cache[key] = linhas;
    document.getElementById("tabelaModulo").innerHTML = tabelaModuloHtml(key, linhas, cfg.columns);
  } catch (e) {
    document.getElementById("tabelaModulo").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

// Módulos que NÃO recebem editar/excluir genérico (têm fluxo próprio ou lista traduzida)
function moduloEditavel(key) { return ["ajustes"].indexOf(key) === -1; }

// Mapeia nome do campo do formulário -> possíveis colunas na planilha (dados importados usam Funcionário, Dt_Admissao, etc.)
// Mapeia campo do formulário -> possíveis colunas na planilha.
// A planilha importada usa Funcionário, Operacao, Dt_Admissao, Salario_Fixo, Fone_Celular...
const COLAB_MAP = {
  Nome: ["Nome", "Funcionário", "Funcionario", "Colaborador"],
  CPF: ["CPF"],
  CTPS: ["CTPS", "RG"],
  Cargo: ["Cargo", "Funcao", "Função"],
  Setor: ["Setor"],
  Unidade: ["Unidade", "Operacao", "Lotacao", "Empresa"],
  SalarioBase: ["SalarioBase", "Salario_Fixo", "Salario Fixo"],
  Complementar: ["Complementar", "Salario_Compl"],
  SalarioTotal: ["SalarioTotal", "Salario Total", "Salario_Total"],
  DataAdmissao: ["DataAdmissao", "Dt_Admissao"],
  DataNascimento: ["DataNascimento", "Dt_Nascimento"],
  FimExperiencia: ["FimExperiencia", "Dt_Contrato_Experiencia"],
  Status: ["Status", "Situacao", "Situação"],
  DataDesligamento: ["DataDesligamento", "Dt_Demissao", "DataDemissao"],
  DataAfastamento: ["DataAfastamento"],
  Integrado: ["Integrado"],
  DataIntegracao: ["DataIntegracao"],
  Lider: ["Lider", "Líder"],
  Telefone: ["Telefone", "Fone_Celular", "Celular"],
  Bairro: ["Bairro"],
  CidadeResidencia: ["CidadeResidencia", "Naturalidade"],
  Folga: ["Folga"],
  Turno: ["Turno"],
  QuerValeTransporte: ["QuerValeTransporte", "Vale_Transporte"],
  ValeTransporteDia: ["ValeTransporteDia"],
  PastaCompleta: ["PastaCompleta"], PagamentoTeste: ["PagamentoTeste"],
  ContaItau: ["ContaItau"], Somapay: ["Somapay"], LinkDocumentacao: ["LinkDocumentacao"],
  Observacoes: ["Observacoes", "Observações"]
};

function valorCampoColab(linha, fieldName) {
  const cols = COLAB_MAP[fieldName] || [fieldName];
  for (const c of cols) {
    if (linha[c] != null && String(linha[c]).trim() !== "") {
      let v = linha[c];
      // a planilha guarda VT como S/N — o formulário usa Sim/Não
      if (fieldName === "QuerValeTransporte") {
        const n = normalize(v);
        if (n === "S" || n === "SIM") return "Sim";
        if (n === "N" || n === "NAO") return "Não";
      }
      return v;
    }
  }
  return "";
}

// Tabela dos módulos com coluna de Ações (Editar/Excluir)
function tabelaModuloHtml(key, linhas, colunas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum registro encontrado.</div>`;
  const editavel = moduloEditavel(key);
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${colunas.map(c => `<th>${escapeHtml(c)}</th>`).join("")}${editavel ? '<th style="width:1%">Ações</th>' : ""}</tr></thead>
        <tbody>
          ${linhas.map((l, i) => `<tr>
            ${colunas.map(c => `<td>${formatarCelula(c, l[c])}</td>`).join("")}
            ${editavel ? `<td style="white-space:nowrap;text-align:right">
              <button class="btn btn-secondary" style="padding:4px 8px;font-size:13px" title="Editar" onclick="editarRegistroModulo('${key}',${i})">✏️</button>
              <button class="btn btn-secondary" style="padding:4px 8px;font-size:13px;color:#b91c1c" title="Excluir" onclick="excluirRegistroModulo('${key}',${i})">🗑️</button>
            </td>` : ""}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// dd/mm/aaaa (ou ISO) -> aaaa-mm-dd para preencher <input type=date>
function dataParaInput(v) {
  v = String(v || "").trim(); if (!v) return "";
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}`;
  return v;
}

async function excluirRegistroModulo(key, i) {
  const cfg = MODULES[key];
  const linha = (STATE.cache[key] || [])[i]; if (!linha) return;
  if (key === "colaboradores") {
    const nome = valorCampoColab(linha, "Nome") || "este colaborador";
    if (!confirm(`ATENÇÃO: excluir "${nome}" apaga a linha da planilha e não pode ser desfeito.\n\nSe a pessoa saiu da empresa, o correto é EDITAR (✏️) e marcar a Situação como DESLIGADO — assim o turnover conta certo.\n\nQuer mesmo EXCLUIR?`)) return;
  } else {
    if (!confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return;
  }
  let confereCol = cfg.columns[0], confereVal = linha[confereCol];
  if (key === "colaboradores") {
    // a planilha importada usa "Funcionário"; acha a coluna que realmente existe na linha
    const cand = ["Funcionário", "Funcionario", "Nome", "Colaborador"];
    for (const c of cand) { if (linha[c] != null && String(linha[c]).trim() !== "") { confereCol = c; confereVal = linha[c]; break; } }
  }
  try {
    await api("excluirRegistroModulo", { sheetKey: cfg.listKey, index: i, confereCol: confereCol, confereVal: confereVal });
    toast("Registro excluído.", "ok");
    await carregarTabelaModulo(key);
  } catch (e) { toast(e.message, "err"); }
}

function editarRegistroModulo(key, i) {
  const cfg = MODULES[key];
  const linha = (STATE.cache[key] || [])[i]; if (!linha) return;
  STATE.editModulo = { key: key, index: i };
  cfg.fields.forEach(f => {
    const elx = document.getElementById("campo_" + f.name);
    if (!elx) return;
    let v = key === "colaboradores" ? valorCampoColab(linha, f.name) : linha[f.name];
    if (v == null) v = "";
    if (f.type === "multicheck") {
      const marcados = String(v).split(",").map(s => normalize(s.trim())).filter(Boolean);
      elx.querySelectorAll("input[type=checkbox]").forEach(cb => { cb.checked = marcados.indexOf(normalize(cb.value)) !== -1; });
      return;
    }
    if (f.type === "date") v = dataParaInput(v);
    elx.value = v;
  });
  const btn = document.getElementById("btnSalvarModulo");
  if (btn) btn.textContent = "Atualizar registro";
  const banner = document.getElementById("editBanner");
  if (banner) banner.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
  toast("Editando — altere os campos e clique em Atualizar.", "info");
}

function tabelaComBadge(linhas, colunas) {
  if (!linhas || !linhas.length) return `<div class="empty">Nenhum registro encontrado.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${colunas.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${linhas.map(l => `<tr>${colunas.map(c => `<td>${formatarCelula(c, l[c])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function formatarCelula(coluna, valor) {
  if (/^(SalarioBase|Complementar|SalarioTotal|CustoProjetado)$/.test(coluna)) {
    return fmtMoeda(valor);
  }
  if (coluna === "Status" || coluna === "Resultado" || coluna === "Prioridade") {
    // ATENÇÃO: normalize() remove acentos, então as listas abaixo NÃO podem ter acento,
    // senão status como "EM ANÁLISE", "NÃO EFETIVAR" e "CRÍTICO" nunca casam.
    const v = normalize(valor);
    let cls = "badge";
    if (["ATIVO", "ABERTA", "APROVADO", "EFETIVAR", "OK", "PENDENTE"].includes(v)) cls += " ok";
    else if (["DESLIGADO", "REPROVADO", "NAO EFETIVAR", "CRITICO", "URGENTE", "CANCELADA", "FECHADA"].includes(v)) cls += " bad";
    else if (["INATIVO", "EM ANALISE", "ACOMPANHAR", "ALTA", "PREVISTA"].includes(v)) cls += " warn";
    return `<span class="${cls}">${escapeHtml(valor)}</span>`;
  }
  return escapeHtml(valor);
}

async function salvarModulo(key) {
  const cfg = MODULES[key];
  if (!validarCampos(cfg.fields)) return;
  const dados = coletarCampos(cfg.fields);
  const edit = STATE.editModulo && STATE.editModulo.key === key ? STATE.editModulo : null;
  try {
    let r;
    if (edit) {
      if (key === "colaboradores") {
        r = await api("atualizarColaborador", dados);
      } else {
        r = await api("atualizarRegistroModulo", { sheetKey: cfg.listKey, index: edit.index, dados: dados });
      }
      STATE.editModulo = null;
      toast(r.msg || "Registro atualizado.", "ok");
    } else {
      r = await api(cfg.saveAction, dados);
      toast(r.msg || "Salvo com sucesso.", "ok");
      if (r.resultado) toast("Resultado da avaliação: " + r.resultado, "info");
    }
    await carregarInit(); // atualiza datalists (nova unidade, etc.)
    await renderModulo(key);
  } catch (e) {
    toast(e.message, "err");
  }
}

/* ===================== ESCALAS (tela dedicada) ===================== */

function selectTurnoHtml(padrao) {
  const op = [["ABERTURA", "Abertura"], ["INTERMEDIARIO", "Intermediário"], ["FECHAMENTO", "Fechamento"]];
  return `<select class="turno-select" style="width:auto;min-width:150px">
    ${op.map(o => `<option value="${o[0]}" ${o[0] === padrao ? "selected" : ""}>${o[1]}</option>`).join("")}
  </select>`;
}

function selectEscalaHtml() {
  return `<select class="escala-select" style="width:auto;min-width:95px">
    <option value="6X1">6x1</option><option value="5X2">5x2</option><option value="12X36">12x36</option>
  </select>`;
}
function selectFolgaHtml() {
  const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  return `<select class="folga-select" style="width:auto;min-width:120px">
    <option value="GIRA">Folga: girar</option>
    ${dias.map(d => `<option value="${d}">Folga: ${d}</option>`).join("")}
  </select>`;
}

function linhasChecklistEscala(nomes) {
  if (!nomes.length) return `<div class="empty">Nenhum colaborador nesta unidade.</div>`;
  return nomes.map(n => `
    <div class="check" style="flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border);padding:8px 0">
      <span style="display:flex;align-items:center;gap:8px;flex:1 1 100%;font-weight:700">
        <input type="checkbox" value="${escapeHtml(n)}"> ${escapeHtml(n)}
      </span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-left:26px">
        ${selectTurnoHtml("INTERMEDIARIO")}
        ${selectEscalaHtml()}
        ${selectFolgaHtml()}
      </div>
    </div>`).join("");
}

function colabsDaUnidade(unidade) {
  const u = normalize(unidade);
  const todos = STATE.init.colaboradores || [];
  const lista = !u ? todos : todos.filter(c => normalize(c.Unidade) === u);
  return lista.map(c => c.Nome).filter(Boolean);
}

function filtrarColabsEscala() {
  const uni = el("#escUnidade") ? el("#escUnidade").value : "";
  const cont = document.getElementById("escChecklist");
  if (cont) cont.innerHTML = linhasChecklistEscala(colabsDaUnidade(uni));
}

async function renderEscalas() {
  setMain(`
    <div class="page-title"><div><h2>Escalas</h2><p>Defina os horários de cada turno e o turno de cada colaborador. A geração respeita abertura, intermediário e fechamento.</p></div></div>

    <div class="card">
      <h3>1. Período e tipo</h3>
      <div class="grid g2">
        <div class="form-row"><label>Unidade</label><input id="escUnidade" type="text" list="dl-unidades" onchange="filtrarColabsEscala()" placeholder="Filtra os colaboradores"></div>
        <div class="form-row"><label>Tipo padrão (opcional — dá pra definir por pessoa abaixo)</label>
          <select id="escTipo">
            <option value="6X1">6x1</option>
            <option value="5X2">5x2</option>
            <option value="12X36">12x36</option>
            <option value="ROTATIVA">Rotativa (gira folga + turnos)</option>
          </select>
        </div>
        <div class="form-row"><label>Início</label><input id="escInicio" type="date"></div>
        <div class="form-row"><label>Fim</label><input id="escFim" type="date"></div>
      </div>
    </div>

    <div class="card">
      <h3>2. Horários dos turnos</h3>
      <p class="card-subtitle">Preencha uma vez. Cada colaborador vai usar o horário do turno dele.</p>
      <div class="grid g3">
        <div>
          <div class="form-row"><label>Abertura — Entrada</label><input id="tAberturaEntrada" type="time" value="08:00"></div>
          <div class="form-row"><label>Abertura — Saída</label><input id="tAberturaSaida" type="time" value="16:20"></div>
        </div>
        <div>
          <div class="form-row"><label>Intermediário — Entrada</label><input id="tIntermEntrada" type="time" value="11:00"></div>
          <div class="form-row"><label>Intermediário — Saída</label><input id="tIntermSaida" type="time" value="19:20"></div>
        </div>
        <div>
          <div class="form-row"><label>Fechamento — Entrada</label><input id="tFechamentoEntrada" type="time" value="15:40"></div>
          <div class="form-row"><label>Fechamento — Saída</label><input id="tFechamentoSaida" type="time" value="00:00"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>3. Colaboradores e turnos</h3>
      <div class="form-row">
        <label>Colaboradores da unidade (marque e escolha o turno de cada um)</label>
        <div class="checklist" id="escChecklist">${linhasChecklistEscala(colabsDaUnidade(""))}</div>
      </div>

      <div class="grid g2">
        <div class="form-row">
          <label>Colaboradores Avulsos (um por linha)</label>
          <textarea id="escAvulsos"></textarea>
        </div>
        <div class="form-row">
          <label>Turno dos avulsos</label>
          ${selectTurnoHtml("INTERMEDIARIO").replace('class="turno-select"', 'id="escAvulsosTurno"')}
        </div>
      </div>

      <div class="form-row">
        <label>Observações</label>
        <textarea id="escObs"></textarea>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick="gerarEscala()">Gerar Escala</button>
        <button class="btn btn-secondary" onclick="excluirEscala()">Excluir escala desta unidade</button>
      </div>
    </div>

    <div class="card">
      <h3>Grade de Escala</h3>
      <div class="form-row" style="max-width:320px">
        <label>Ver grade da unidade</label>
        <select id="gradeUnidade" onchange="montarGradeEscala()"><option value="">Todas</option></select>
      </div>
      <div id="gradeEscala"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarEscalas();
}

async function carregarEscalas() {
  try {
    const r = await api("listarEscalas");
    STATE.cache.escalas = r.escalas || [];
    const unis = [...new Set(STATE.cache.escalas.map(e => e.Unidade).filter(Boolean))].sort();
    const sel = document.getElementById("gradeUnidade");
    if (sel) sel.innerHTML = `<option value="">Todas</option>` + unis.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("");
    montarGradeEscala();
  } catch (e) {
    document.getElementById("gradeEscala").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

function fmtHoraCurta(h) {
  const s = String(h || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return m[2] === "00" ? (m[1].padStart(2, "0") + "H") : (m[1].padStart(2, "0") + ":" + m[2]);
}

function montarGradeEscala() {
  const dados = STATE.cache.escalas || [];
  const uni = el("#gradeUnidade") ? el("#gradeUnidade").value : "";
  const filtradas = uni ? dados.filter(e => normalize(e.Unidade) === normalize(uni)) : dados;
  const cont = document.getElementById("gradeEscala");
  if (!filtradas.length) { cont.innerHTML = `<div class="empty">Nenhuma escala gerada ainda.</div>`; return; }

  const datas = [...new Set(filtradas.map(e => e.Data).filter(Boolean))].sort();
  const colabs = [...new Set(filtradas.map(e => e.Colaborador).filter(Boolean))].sort();
  const diaSemana = {};
  filtradas.forEach(e => { if (e.Data) diaSemana[e.Data] = e.DiaSemana; });
  const mapa = {};
  filtradas.forEach(e => { mapa[e.Colaborador + "|" + e.Data] = e; });

  function labelData(d) {
    const p = String(d).split("-"); // yyyy-MM-dd
    return p.length === 3 ? p[2] + "/" + p[1] : d;
  }
  const TURNO_HR = { ABERTURA: ["08:00", "16:20"], INTERMEDIARIO: ["11:00", "19:20"], FECHAMENTO: ["15:40", "00:00"] };
  const TURNO_NOME = { ABERTURA: "Abertura", INTERMEDIARIO: "Intermediário", FECHAMENTO: "Fechamento" };
  function celula(e) {
    if (!e) return `<td style="text-align:center;color:#9ca3af">-</td>`;
    const folgaVal = (function () { for (const k in e) { if (normalize(k) === "FOLGA") return e[k]; } return e.Folga || ""; })();
    if (normalize(folgaVal).indexOf("SIM") !== -1)
      return `<td style="text-align:center;background:#dcfce7;color:#166534;font-weight:800">FOLGA</td>`;
    const tn = normalize(e.Turno);
    let ent = fmtHoraCurta(e.HorarioEntrada), sai = fmtHoraCurta(e.HorarioSaida);
    if ((!ent || !sai) && TURNO_HR[tn]) {
      if (!ent) ent = fmtHoraCurta(TURNO_HR[tn][0]);
      if (!sai) sai = fmtHoraCurta(TURNO_HR[tn][1]);
    }
    const nome = TURNO_NOME[tn] || "";
    if (ent && sai) {
      return `<td style="text-align:center;background:#fff7ed;white-space:nowrap">
        <div style="color:#9a3412;font-weight:800">${escapeHtml(ent)}–${escapeHtml(sai)}</div>
        ${nome ? `<div style="font-size:10px;color:#c2410c">${escapeHtml(nome)}</div>` : ""}
      </td>`;
    }
    return `<td style="text-align:center;background:#fff7ed;color:#9a3412;font-weight:800">${escapeHtml(nome || "Trabalha")}</td>`;
  }

  cont.innerHTML = `
    <div class="table-wrap"><table>
      <thead>
        <tr><th>Colaborador</th>${datas.map(d => `<th style="text-align:center">${labelData(d)}<br><span style="font-weight:400;font-size:11px">${escapeHtml(diaSemana[d] || "")}</span></th>`).join("")}</tr>
      </thead>
      <tbody>
        ${colabs.map(nome => `<tr><td style="font-weight:800;white-space:nowrap">${escapeHtml(nome)}</td>${datas.map(d => celula(mapa[nome + "|" + d])).join("")}</tr>`).join("")}
      </tbody>
    </table></div>`;
}

async function excluirEscala() {
  const unidade = el("#escUnidade") ? el("#escUnidade").value.trim() : "";
  const inicio = el("#escInicio") ? el("#escInicio").value : "";
  const fim = el("#escFim") ? el("#escFim").value : "";
  if (!unidade) { toast("Escolha a unidade (campo Unidade lá em cima).", "err"); return; }
  const escopo = (inicio && fim) ? `do período ${inicio} a ${fim}` : "TODA a escala";
  if (!confirm(`Excluir ${escopo} da unidade ${unidade}? Isso não pode ser desfeito.`)) return;
  try {
    const r = await api("excluirEscala", { unidade, inicio, fim });
    toast(r.msg || "Escala excluída.", "ok");
    if (typeof montarGradeEscala === "function") montarGradeEscala();
  } catch (e) { toast(e.message, "err"); }
}

async function gerarEscala() {
  const inicio = el("#escInicio").value;
  const fim = el("#escFim").value;
  if (!inicio || !fim) { toast("Informe início e fim da escala.", "err"); return; }

  // Colaboradores marcados + turno, escala e folga de cada um.
  const colaboradores = [];
  document.querySelectorAll("#escChecklist .check").forEach(row => {
    const cb = row.querySelector('input[type="checkbox"]');
    const selTurno = row.querySelector(".turno-select");
    const selEscala = row.querySelector(".escala-select");
    const selFolga = row.querySelector(".folga-select");
    if (cb && cb.checked) {
      colaboradores.push({
        nome: cb.value,
        turno: selTurno ? selTurno.value : "INTERMEDIARIO",
        escala: selEscala ? selEscala.value : "6X1",
        folga: selFolga ? selFolga.value : "GIRA"
      });
    }
  });

  // Avulsos (um por linha), com o turno escolhido; escala 6x1 e folga girando.
  const turnoAvulsos = el("#escAvulsosTurno") ? el("#escAvulsosTurno").value : "INTERMEDIARIO";
  String(el("#escAvulsos").value || "").split(/\r?\n/).forEach(n => {
    n = n.trim();
    if (n) colaboradores.push({ nome: n, turno: turnoAvulsos, escala: "6X1", folga: "GIRA" });
  });

  if (!colaboradores.length) { toast("Selecione ao menos um colaborador.", "err"); return; }

  const dados = {
    unidade: el("#escUnidade").value,
    tipo: el("#escTipo").value,
    inicio: inicio,
    fim: fim,
    turnos: {
      ABERTURA: { entrada: el("#tAberturaEntrada").value, saida: el("#tAberturaSaida").value },
      INTERMEDIARIO: { entrada: el("#tIntermEntrada").value, saida: el("#tIntermSaida").value },
      FECHAMENTO: { entrada: el("#tFechamentoEntrada").value, saida: el("#tFechamentoSaida").value }
    },
    colaboradores: colaboradores,
    observacoes: el("#escObs").value
  };

  try {
    const r = await api("gerarEscala", dados);
    toast(r.msg, "ok");
    await carregarEscalas();
  } catch (e) {
    toast(e.message, "err");
  }
}

/* ===================== PONTO ===================== */

/* ===================== DOCUMENTOS (upload) ===================== */

async function renderDocumentos() {
  setMain(`<div class="loading">Carregando...</div>`);
  const nomes = (STATE.init.colaboradores || []).map(c => c.Nome).filter(Boolean).sort();
  setMain(`
    <div class="page-title">
      <div><h2>Documentos</h2><p>Envie a documentação de cada colaborador. Os arquivos vão para uma pasta no Google Drive, por pessoa.</p></div>
    </div>
    <div class="card">
      <h3>Enviar documento</h3>
      <div class="grid g3">
        <div class="form-row"><label>Unidade</label><input id="docUni" type="text" list="dl-unidades" autocomplete="off"></div>
        <div class="form-row"><label>Colaborador *</label><input id="docColab" type="text" list="dl-colaboradores" autocomplete="off" onchange="docListar(this.value,false)"></div>
        <div class="form-row"><label>Arquivo (PDF ou foto) *</label><input id="docFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" onclick="docUpload()">Enviar</button>
        <button class="btn btn-secondary" onclick="docListar(document.getElementById('docColab').value, true)">Atualizar lista</button>
      </div>
      <div id="docStatus" style="margin-top:8px"></div>
    </div>
    <div class="card"><h3>Documentos do colaborador</h3><div id="docLista"><div class="empty">Escolha um colaborador.</div></div></div>
  `);
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function docUpload() {
  const nome = el("#docColab").value.trim();
  const f = el("#docFile").files[0];
  if (!nome || !f) { toast("Escolha o colaborador e o arquivo.", "err"); return; }
  if (f.size > 15 * 1024 * 1024) { toast("Arquivo muito grande (máx. 15 MB).", "err"); return; }
  el("#docStatus").innerHTML = `<div class="loading">Enviando ${escapeHtml(f.name)}...</div>`;
  try {
    const b64 = await fileToBase64(f);
    const dados = { Colaborador: nome, cpf: "", nomeArquivo: f.name, tipo: f.type || "application/octet-stream", base64: b64 };
    const body = "acao=uploadDocumento&dados=" + encodeURIComponent(JSON.stringify(dados));
    // POST no-cors: o servidor recebe e salva, mas a resposta é opaca — então
    // re-listamos os documentos em seguida pra confirmar.
    await fetch(CONFIG.API_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body
    });
    el("#docFile").value = "";
    setTimeout(() => docListar(nome, true), 3000);
  } catch (e) {
    el("#docStatus").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

async function docListar(nome, aviso) {
  nome = (nome || "").trim();
  if (!nome) { el("#docLista").innerHTML = `<div class="empty">Escolha um colaborador.</div>`; return; }
  try {
    const r = await api("listarDocumentos");
    const meus = (r.documentos || []).filter(x => normalize(x.Colaborador) === normalize(nome));
    el("#docLista").innerHTML = meus.length
      ? (meus[0].PastaUrl ? `<div style="margin-bottom:8px"><a href="${escapeHtml(meus[0].PastaUrl)}" target="_blank" rel="noopener" style="font-weight:600">📁 Abrir pasta no Drive ↗</a></div>` : "")
        + meus.map(x => `<div style="padding:4px 0">📎 <a href="${escapeHtml(x.Url)}" target="_blank" rel="noopener">${escapeHtml(x.Arquivo)}</a> <span class="muted">(${escapeHtml(x.Data)})</span></div>`).join("")
      : `<div class="empty">Nenhum documento ainda para ${escapeHtml(nome)}.</div>`;
    if (aviso) {
      el("#docStatus").innerHTML = meus.length
        ? `<div class="msg ok">Pronto! Se o arquivo recém-enviado não apareceu, clique em "Atualizar lista" daqui a alguns segundos.</div>`
        : `<div class="msg err">Ainda não apareceu. Aguarde uns segundos e clique em "Atualizar lista". Se continuar vazio, me avise.</div>`;
    }
  } catch (e) {
    el("#docLista").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

async function gerarPonto() {
  const unidade = el("#cfUnidade").value.trim();
  const colaborador = el("#cfColab") ? el("#cfColab").value.trim() : "";
  const mes = el("#cfMes").value;
  const ano = el("#cfAno").value;
  if (!unidade) { toast("Escolha a unidade.", "err"); return; }
  el("#cfResultado").innerHTML = `<div class="loading">Gerando o arquivo... pode levar alguns segundos.</div>`;
  try {
    const r = await api("gerarControleFrequencia", { unidade, colaborador, mes, ano });
    el("#cfResultado").innerHTML = `<div class="msg ok">${escapeHtml(r.msg || "Gerado.")}<br>
      <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" style="font-weight:600">Abrir o Controle de Frequência ↗</a></div>`;
    if (r.url) window.open(r.url, "_blank");
  } catch (e) {
    el("#cfResultado").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

// Filtra o datalist de colaboradores do Ponto pela unidade escolhida
function cfFiltrarColab() {
  const u = normalize(el("#cfUnidade") ? el("#cfUnidade").value : "");
  const nomes = (STATE.init.colaboradores || [])
    .filter(c => !u || normalize(c.Unidade) === u)
    .map(c => c.Nome).filter(Boolean).sort();
  setDatalist("dl-cf-colab", nomes);
}

async function renderPonto() {
  const nomesColab = STATE.init.colaboradores.map(c => c.Nome);
  setMain(`
    <div class="page-title"><div><h2>Ponto</h2><p>Registro de entrada, saída e intervalos.</p></div></div>

    <div class="card">
      <h3>🖨️ Gerar Controle de Frequência (para imprimir)</h3>
      <p class="muted">Escolha a unidade. Deixe o colaborador em branco para gerar a unidade toda (uma aba por pessoa), ou escolha um colaborador para gerar só o dele. FOLGA vem da escala do mês.</p>
      <div class="grid g2">
        <div class="form-row"><label>Unidade</label><input id="cfUnidade" type="text" list="dl-unidades" autocomplete="off" oninput="cfFiltrarColab()" onchange="cfFiltrarColab()"></div>
        <div class="form-row"><label>Colaborador <span class="muted">(opcional — vazio = unidade toda)</span></label><input id="cfColab" type="text" list="dl-cf-colab" autocomplete="off" placeholder="Escolha a unidade primeiro"></div>
      </div>
      <div class="grid g2">
        <div class="form-row"><label>Mês</label>
          <select id="cfMes">${["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m,i)=>`<option value="${i+1}" ${i===new Date().getMonth()?"selected":""}>${m}</option>`).join("")}</select>
        </div>
        <div class="form-row"><label>Ano</label><input id="cfAno" type="number" value="${new Date().getFullYear()}"></div>
      </div>
      <datalist id="dl-cf-colab"></datalist>
      <div class="actions"><button class="btn btn-primary" onclick="gerarPonto()">Gerar Controle de Frequência</button></div>
      <div id="cfResultado" style="margin-top:10px"></div>
    </div>

    <div class="card">
      <h3>Espelho de Ponto</h3>
      <div id="tabelaPonto"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarEspelhoPonto();
}

function obterLocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

async function baterPonto() {
  const colaborador = el("#pontoColaborador").value.trim();
  if (!colaborador) { toast("Selecione o colaborador.", "err"); return; }

  toast("Obtendo localização...", "info");
  const loc = await obterLocalizacao();
  if (!loc) toast("Sem localização (permissão negada ou indisponível). Ponto será registrado sem GPS.", "warn");

  const dados = {
    Colaborador: colaborador,
    Unidade: el("#pontoUnidade").value.trim(),
    TipoBatida: el("#pontoTipo").value,
    Dispositivo: navigator.userAgent,
    Latitude: loc ? loc.lat : "",
    Longitude: loc ? loc.lng : ""
  };

  try {
    const r = await api("registrarPonto", dados);
    toast(r.msg, "ok");
    await carregarEspelhoPonto();
  } catch (e) {
    toast(e.message, "err");
  }
}

async function carregarEspelhoPonto() {
  try {
    const r = await api("listarEspelhoPonto");
    document.getElementById("tabelaPonto").innerHTML =
      tabelaComBadge(r.espelho, ["Data", "Colaborador", "Unidade", "Batidas", "Alertas"]);
  } catch (e) {
    document.getElementById("tabelaPonto").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

/* ===================== ASSISTENTE IA ===================== */

async function renderAssistente() {
  setMain(`
    <div class="page-title"><div><h2>🤖 EVA — Evol Virtual Assistant</h2><p>A colaboradora digital do Grupo Evol. Pergunte sobre salários, headcount, folha, vagas, SLA, aniversariantes, turnover, testes, feedbacks, treinamentos e experiência.</p></div></div>
    <div class="card">
      <div id="chatArea" style="display:flex;flex-direction:column;gap:10px;max-height:440px;overflow:auto;margin-bottom:14px;"></div>
      <div class="actions">
        <input id="chatInput" type="text" style="flex:1" placeholder="Ex: qual a folha da Aldeota? / salário de barman / quantas vagas no Sul?" onkeydown="if(event.key==='Enter') perguntarAssistente()">
        <button class="btn btn-primary" onclick="perguntarAssistente()">Perguntar</button>
      </div>
    </div>
  `);
}

async function perguntarAssistente() {
  const input = el("#chatInput");
  const pergunta = input.value.trim();
  if (!pergunta) return;
  input.value = "";

  const area = el("#chatArea");
  area.insertAdjacentHTML("beforeend", `<div class="msg info" style="align-self:flex-end;background:#dbeafe;color:#1e40af;">${escapeHtml(pergunta)}</div>`);
  area.scrollTop = area.scrollHeight;

  try {
    const r = await api("assistenteIA", { pergunta: pergunta });
    area.insertAdjacentHTML("beforeend", `<div class="msg ok" style="white-space:pre-wrap">${escapeHtml(r.resposta)}</div>`);
  } catch (e) {
    area.insertAdjacentHTML("beforeend", `<div class="msg err">${escapeHtml(e.message)}</div>`);
  }
  area.scrollTop = area.scrollHeight;
}
