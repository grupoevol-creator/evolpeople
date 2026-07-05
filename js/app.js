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
  // ↓↓↓ COLE AQUI A URL /exec DA SUA IMPLANTAÇÃO. Sem isto, nada carrega. ↓↓↓
  API_URL: "https://script.google.com/macros/s/AKfycbwJPi1I9tYYHWt470IgA7l-98fxQzt6XtqLlX-so-3N3VMJOcXwp9agbI7O1dYKTIVY/exec"
};

const STATE = {
  user: null,
  init: { unidades: [], cargos: [], colaboradores: [], salarios: [] },
  pagina: "dashboard",
  cache: {} // cache simples por módulo: { colaboradores: [...], vagas: [...] }
};

/* ===================== JSONP (chamada ao backend) ===================== */

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
      reject(new Error("Tempo de resposta excedido."));
    }, 25000);

    const payload = Object.assign({}, dados || {});
    if (STATE.user) payload.__user = STATE.user;

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
}

async function carregarInit() {
  const r = await api("getInit");
  STATE.init.unidades = r.unidades || [];
  STATE.init.cargos = r.cargos || [];
  STATE.init.colaboradores = r.colaboradores || [];
  STATE.init.salarios = r.salarios || [];
  atualizarDatalists();
}

function atualizarDatalists() {
  setDatalist("dl-unidades", STATE.init.unidades);
  setDatalist("dl-cargos", STATE.init.cargos.map(c => c.Cargo));
  setDatalist("dl-colaboradores", STATE.init.colaboradores.map(c => c.Nome));
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
  { titulo: "Visão Geral", itens: [{ key: "dashboard", label: "Dashboard" }] },
  { titulo: "Pessoas", itens: [
    { key: "colaboradores", label: "Colaboradores" },
    { key: "cargos", label: "Cargos e Salários" },
    { key: "unidades", label: "Unidades" }
  ]},
  { titulo: "Recrutamento", itens: [
    { key: "vagas", label: "Vagas" },
    { key: "admissoes", label: "Admissões" },
    { key: "testes", label: "Testes Seletivos" }
  ]},
  { titulo: "Gestão de Pessoas", itens: [
    { key: "escalas", label: "Escalas" },
    { key: "ponto", label: "Ponto" },
    { key: "ajustesPonto", label: "Ajustes de Ponto" },
    { key: "feedbacks", label: "Feedbacks" },
    { key: "experiencia", label: "Avaliação de Experiência" },
    { key: "treinamentos", label: "Treinamentos" }
  ]},
  { titulo: "Operações", itens: [
    { key: "fardamento", label: "Fardamento / Estoque" },
    { key: "mural", label: "Mural" },
    { key: "indicadores", label: "Indicadores Mensais" },
    { key: "sla", label: "SLA de Vagas" }
  ]},
  { titulo: "Assistente", itens: [{ key: "assistente", label: "Assistente IA" }] }
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

  try {
    if (key === "dashboard") return renderDashboard();
    if (key === "unidades") return renderUnidades();
    if (key === "escalas") return renderEscalas();
    if (key === "ponto") return renderPonto();
    if (key === "assistente") return renderAssistente();
    if (MODULES[key]) return renderModulo(key);
    setMain(`<div class="empty">Página não encontrada.</div>`);
  } catch (e) {
    setMain(`<div class="msg err">Erro ao carregar página: ${escapeHtml(e.message)}</div>`);
  }
}

/* ===================== DASHBOARD ===================== */

async function renderDashboard() {
  setMain(`<div class="loading">Carregando dashboard...</div>`);
  const r = await api("dashboard");
  const k = r.dashboard.kpis;

  setMain(`
    <div class="page-title">
      <div><h2>Dashboard</h2><p>Visão geral da operação em tempo real.</p></div>
    </div>

    <div class="grid g4">
      <div class="kpi"><small>Headcount Ativo</small><strong>${k.headcount}</strong></div>
      <div class="kpi"><small>Vagas Abertas</small><strong>${k.vagasAbertas}</strong></div>
      <div class="kpi"><small>Custo Projetado</small><strong>${fmtMoeda(k.custoProjetado)}</strong></div>
      <div class="kpi"><small>Admissões (7 dias)</small><strong>${k.admissoesSemana}</strong></div>
      <div class="kpi"><small>Testes no Mês</small><strong>${k.testesMes}</strong></div>
      <div class="kpi"><small>Testes (7 dias)</small><strong>${k.testesSemana}</strong></div>
      <div class="kpi"><small>Aniversariantes do Mês</small><strong>${k.aniversariantes}</strong></div>
      <div class="kpi"><small>Itens em Estoque Crítico</small><strong>${k.estoqueCritico}</strong></div>
    </div>

    <div class="grid g2">
      <div class="card">
        <h3>🎂 Aniversariantes do Mês</h3>
        ${tabelaSimples(r.dashboard.aniversariantes, ["Nome", "Unidade", "DataNascimento"])}
      </div>
      <div class="card">
        <h3>⏳ Experiência Vencendo (15 dias)</h3>
        ${tabelaSimples(r.dashboard.experienciaProximas, ["Nome", "Unidade", "Cargo", "FimExperiencia"])}
      </div>
    </div>

    <div class="card">
      <h3>📦 Estoque Crítico de Fardamento</h3>
      ${tabelaSimples(r.dashboard.estoqueCritico, ["Unidade", "Item", "Tamanho", "QuantidadeEstoque", "QuantidadeMinima"])}
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

/* ===================== UNIDADES (somente leitura) ===================== */

function renderUnidades() {
  setMain(`
    <div class="page-title">
      <div><h2>Unidades</h2><p>Unidades são criadas automaticamente ao serem usadas em Colaboradores, Vagas, etc.</p></div>
    </div>
    <div class="card">
      ${STATE.init.unidades.length
        ? `<div class="grid g4">${STATE.init.unidades.map(u => `<div class="badge">${escapeHtml(u)}</div>`).join("")}</div>`
        : `<div class="empty">Nenhuma unidade cadastrada ainda.</div>`}
    </div>
  `);
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
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos", autofillSalario: true },
      { name: "SalarioBase", label: "Salário Base", type: "money" },
      { name: "Complementar", label: "Complementar", type: "money" },
      { name: "SalarioTotal", label: "Salário Total", type: "money", readonly: true, computed: true },
      { name: "DataAdmissao", label: "Data de Admissão", type: "date" },
      { name: "DataNascimento", label: "Data de Nascimento", type: "date" },
      { name: "FimExperiencia", label: "Fim da Experiência", type: "date" },
      { name: "Lider", label: "Líder", type: "text" },
      { name: "CidadeResidencia", label: "Cidade de Residência", type: "text" },
      { name: "QuerValeTransporte", label: "Vale Transporte", type: "select", options: ["Sim", "Não"] },
      { name: "Status", label: "Status", type: "select", options: ["ATIVO", "INATIVO", "DESLIGADO"], default: "ATIVO" },
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

  vagas: {
    label: "Vagas",
    listAction: "listarVagas", listKey: "vagas",
    saveAction: "salvarVaga",
    columns: ["Unidade", "Cargo", "Quantidade", "SalarioTotal", "CustoProjetado", "Prioridade", "Status"],
    fields: [
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos", autofillSalario: true, required: true },
      { name: "Quantidade", label: "Quantidade", type: "number", default: 1 },
      { name: "SalarioBase", label: "Salário Base", type: "money" },
      { name: "Complementar", label: "Complementar", type: "money" },
      { name: "Prioridade", label: "Prioridade", type: "select", options: ["BAIXA", "NORMAL", "ALTA", "URGENTE"], default: "NORMAL" },
      { name: "Motivo", label: "Motivo da Vaga", type: "text", col: "g2" },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  admissoes: {
    label: "Admissões",
    listAction: "listarAdmissoes", listKey: "admissoes",
    saveAction: "salvarAdmissao",
    columns: ["Candidato", "Unidade", "Cargo", "DataPrevista", "Status"],
    fields: [
      { name: "Candidato", label: "Candidato", type: "text", required: true },
      { name: "CPF", label: "CPF", type: "text" },
      { name: "Telefone", label: "Telefone", type: "text" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos" },
      { name: "DataPrevista", label: "Data Prevista de Admissão", type: "date" },
      { name: "CidadeResidencia", label: "Cidade de Residência", type: "text" },
      { name: "QuerValeTransporte", label: "Vale Transporte", type: "select", options: ["Sim", "Não"] },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  testes: {
    label: "Testes Seletivos",
    listAction: "listarTestes", listKey: "testes",
    saveAction: "salvarTeste",
    columns: ["DataTeste", "Candidato", "Unidade", "Cargo", "Nota", "Resultado"],
    fields: [
      { name: "DataTeste", label: "Data do Teste", type: "date", required: true },
      { name: "HoraTeste", label: "Hora do Teste", type: "time" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Candidato", label: "Candidato", type: "text", required: true },
      { name: "CPF", label: "CPF", type: "text" },
      { name: "Telefone", label: "Telefone", type: "text" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos" },
      { name: "Avaliador", label: "Avaliador", type: "text" },
      { name: "Nota", label: "Nota (0 a 10)", type: "number", min: 0, max: 10, step: 0.1 },
      { name: "Resultado", label: "Resultado", type: "select", options: ["APROVADO", "REPROVADO", "EM ANÁLISE"] },
      { name: "Observacoes", label: "Observações", type: "textarea", col: "g2" }
    ]
  },

  feedbacks: {
    label: "Feedbacks",
    listAction: "listarFeedbacks", listKey: "feedbacks",
    saveAction: "salvarFeedback",
    columns: ["Data", "Colaborador", "Unidade", "Tipo", "Nota", "Lider"],
    fields: [
      { name: "Data", label: "Data", type: "date" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Colaborador", label: "Colaborador", type: "datalist", list: "dl-colaboradores", required: true },
      { name: "Tipo", label: "Tipo", type: "select", options: ["POSITIVO", "CONSTRUTIVO", "ADVERTÊNCIA"] },
      { name: "Nota", label: "Nota (0 a 10)", type: "number", min: 0, max: 10, step: 0.1 },
      { name: "Prazo", label: "Prazo para Plano de Ação", type: "date" },
      { name: "PontosFortes", label: "Pontos Fortes", type: "textarea" },
      { name: "PontosMelhoria", label: "Pontos de Melhoria", type: "textarea" },
      { name: "PlanoAcao", label: "Plano de Ação", type: "textarea", col: "g2" }
    ]
  },

  experiencia: {
    label: "Avaliação de Experiência",
    listAction: "listarAvaliacoesExperiencia", listKey: "avaliacoes",
    saveAction: "salvarAvaliacaoExperiencia",
    columns: ["Colaborador", "Unidade", "Cargo", "Media", "Resultado"],
    fields: [
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Colaborador", label: "Colaborador", type: "datalist", list: "dl-colaboradores", required: true },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos" },
      { name: "DataAdmissao", label: "Data de Admissão", type: "date" },
      { name: "DiasExperiencia", label: "Dias de Experiência", type: "number" },
      { name: "Produtividade", label: "Produtividade (0-10)", type: "number", min: 0, max: 10 },
      { name: "Comportamento", label: "Comportamento (0-10)", type: "number", min: 0, max: 10 },
      { name: "Pontualidade", label: "Pontualidade (0-10)", type: "number", min: 0, max: 10 },
      { name: "Equipe", label: "Trabalho em Equipe (0-10)", type: "number", min: 0, max: 10 },
      { name: "Tecnica", label: "Técnica (0-10)", type: "number", min: 0, max: 10 },
      { name: "PlanoAcao", label: "Plano de Ação", type: "textarea", col: "g2" }
    ]
  },

  treinamentos: {
    label: "Treinamentos",
    listAction: "listarTreinamentos", listKey: "treinamentos",
    saveAction: "salvarTreinamento",
    columns: ["Data", "Unidade", "Tema", "Tipo", "HorasDadas"],
    fields: [
      { name: "Data", label: "Data", type: "date" },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades" },
      { name: "Tema", label: "Tema", type: "text", required: true, col: "g2" },
      { name: "Tipo", label: "Tipo", type: "select", options: ["PRESENCIAL", "ONLINE", "PRÁTICO"] },
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

  mural: {
    label: "Mural",
    listAction: "listarMural", listKey: "mural",
    saveAction: "salvarMural",
    columns: ["Data", "Titulo", "Unidade", "PublicadoPor"],
    fields: [
      { name: "Titulo", label: "Título", type: "text", required: true },
      { name: "Unidade", label: "Unidade (ou TODAS)", type: "datalist", list: "dl-unidades", default: "TODAS" },
      { name: "Mensagem", label: "Mensagem", type: "textarea", col: "g2", required: true }
    ]
  },

  indicadores: {
    label: "Indicadores Mensais",
    listAction: "listarIndicadoresMensais", listKey: "indicadores",
    saveAction: "salvarIndicadorMensal",
    columns: ["Mes", "Ano", "Unidade", "TurnoverPercentual", "AbsenteismoPercentual"],
    fields: [
      { name: "Mes", label: "Mês (1-12)", type: "number", min: 1, max: 12, required: true },
      { name: "Ano", label: "Ano", type: "number", required: true },
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", required: true },
      { name: "TurnoverPercentual", label: "Turnover (%)", type: "number", step: 0.01 },
      { name: "AbsenteismoPercentual", label: "Absenteísmo (%)", type: "number", step: 0.01 },
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
  if (f.type === "textarea") {
    inputHtml = `<textarea id="${idc}" ${req} ${readonly}>${val}</textarea>`;
  } else if (f.type === "select") {
    inputHtml = `<select id="${idc}" ${req}>
      <option value="">Selecione...</option>
      ${f.options.map(o => `<option value="${escapeHtml(o)}" ${o === f.default ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
    </select>`;
  } else if (f.type === "datalist") {
    inputHtml = `<input id="${idc}" type="text" list="${f.list}" value="${val}" autocomplete="off" ${req} ${readonly}
      ${f.autofillSalario ? `onchange="autofillSalarioPorCargo(this.value)"` : ""}>`;
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
    inputHtml = `<input id="${idc}" type="text" value="${val}" ${req} ${readonly}>`;
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
    if (elCampo) out[f.name] = elCampo.value;
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
  setMain(`
    <div class="page-title">
      <div><h2>${escapeHtml(cfg.label)}</h2>${cfg.note ? `<p>${escapeHtml(cfg.note)}</p>` : ""}</div>
    </div>

    <div class="card">
      <h3>Novo Registro</h3>
      <form id="formModulo" class="grid g2" onsubmit="return false;">
        ${cfg.fields.map(campoHtml).join("")}
      </form>
      <div class="actions">
        <button class="btn btn-primary" onclick="salvarModulo('${key}')">Salvar</button>
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
    const r = await api(cfg.listAction);
    const linhas = r[cfg.listKey] || [];
    STATE.cache[key] = linhas;
    document.getElementById("tabelaModulo").innerHTML = tabelaComBadge(linhas, cfg.columns);
  } catch (e) {
    document.getElementById("tabelaModulo").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
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
  try {
    const r = await api(cfg.saveAction, dados);
    toast(r.msg || "Salvo com sucesso.", "ok");
    if (r.resultado) toast("Resultado da avaliação: " + r.resultado, "info");
    await carregarInit(); // atualiza datalists (nova unidade, etc.)
    await renderModulo(key);
  } catch (e) {
    toast(e.message, "err");
  }
}

/* ===================== ESCALAS (tela dedicada) ===================== */

async function renderEscalas() {
  const nomesColab = STATE.init.colaboradores.map(c => c.Nome);
  setMain(`
    <div class="page-title"><div><h2>Escalas</h2><p>Gere escalas em lote para um período.</p></div></div>

    <div class="card">
      <h3>Gerar Escala</h3>
      <div class="grid g2">
        <div class="form-row"><label>Unidade</label><input id="escUnidade" type="text" list="dl-unidades"></div>
        <div class="form-row"><label>Tipo de Escala</label>
          <select id="escTipo">
            <option value="6X1">6x1</option>
            <option value="5X2">5x2</option>
            <option value="12X36">12x36</option>
          </select>
        </div>
        <div class="form-row"><label>Início</label><input id="escInicio" type="date"></div>
        <div class="form-row"><label>Fim</label><input id="escFim" type="date"></div>
        <div class="form-row"><label>Horário de Entrada</label><input id="escEntrada" type="time"></div>
        <div class="form-row"><label>Horário de Saída</label><input id="escSaida" type="time"></div>
      </div>

      <div class="form-row">
        <label>Colaboradores Cadastrados</label>
        <div class="checklist" id="escChecklist">
          ${nomesColab.length
            ? nomesColab.map(n => `<label class="check"><input type="checkbox" value="${escapeHtml(n)}"> ${escapeHtml(n)}</label>`).join("")
            : `<div class="empty">Nenhum colaborador cadastrado ainda.</div>`}
        </div>
      </div>

      <div class="form-row">
        <label>Colaboradores Avulsos (um por linha, para quem ainda não está cadastrado)</label>
        <textarea id="escAvulsos"></textarea>
      </div>

      <div class="form-row">
        <label>Observações</label>
        <textarea id="escObs"></textarea>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick="gerarEscala()">Gerar Escala</button>
      </div>
    </div>

    <div class="card">
      <h3>Escalas Geradas</h3>
      <div id="tabelaEscalas"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarEscalas();
}

async function carregarEscalas() {
  try {
    const r = await api("listarEscalas");
    document.getElementById("tabelaEscalas").innerHTML =
      tabelaComBadge(r.escalas, ["Data", "DiaSemana", "Unidade", "Colaborador", "Folga", "HorarioEntrada", "HorarioSaida"]);
  } catch (e) {
    document.getElementById("tabelaEscalas").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
}

async function gerarEscala() {
  const inicio = el("#escInicio").value;
  const fim = el("#escFim").value;
  if (!inicio || !fim) { toast("Informe início e fim da escala.", "err"); return; }

  const colaboradores = Array.from(document.querySelectorAll("#escChecklist input:checked")).map(i => i.value);

  const dados = {
    unidade: el("#escUnidade").value,
    tipo: el("#escTipo").value,
    inicio: inicio,
    fim: fim,
    entrada: el("#escEntrada").value,
    saida: el("#escSaida").value,
    colaboradores: colaboradores,
    avulsos: el("#escAvulsos").value,
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

async function renderPonto() {
  const nomesColab = STATE.init.colaboradores.map(c => c.Nome);
  setMain(`
    <div class="page-title"><div><h2>Ponto</h2><p>Registro de entrada, saída e intervalos.</p></div></div>

    <div class="card">
      <h3>Bater Ponto</h3>
      <div class="grid g3">
        <div class="form-row"><label>Colaborador</label>
          <input id="pontoColaborador" type="text" list="dl-colaboradores" autocomplete="off">
        </div>
        <div class="form-row"><label>Unidade</label>
          <input id="pontoUnidade" type="text" list="dl-unidades" autocomplete="off">
        </div>
        <div class="form-row"><label>Tipo de Batida</label>
          <select id="pontoTipo">
            <option value="ENTRADA">Entrada</option>
            <option value="INÍCIO INTERVALO">Início do Intervalo</option>
            <option value="FIM INTERVALO">Fim do Intervalo</option>
            <option value="SAÍDA">Saída</option>
          </select>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" onclick="baterPonto()">Registrar Ponto</button>
      </div>
    </div>

    <div class="card">
      <h3>Espelho de Ponto</h3>
      <div id="tabelaPonto"><div class="loading">Carregando...</div></div>
    </div>
  `);
  await carregarEspelhoPonto();
}

async function baterPonto() {
  const colaborador = el("#pontoColaborador").value.trim();
  if (!colaborador) { toast("Selecione o colaborador.", "err"); return; }

  const dados = {
    Colaborador: colaborador,
    Unidade: el("#pontoUnidade").value.trim(),
    TipoBatida: el("#pontoTipo").value,
    Dispositivo: navigator.userAgent
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
    <div class="page-title"><div><h2>Assistente</h2><p>Pergunte sobre vagas, colaboradores, aniversariantes, estoque ou testes.</p></div></div>
    <div class="card">
      <div id="chatArea" style="display:flex;flex-direction:column;gap:10px;max-height:420px;overflow:auto;margin-bottom:14px;"></div>
      <div class="actions">
        <input id="chatInput" type="text" style="flex:1" placeholder="Ex: quantas vagas estão abertas?" onkeydown="if(event.key==='Enter') perguntarAssistente()">
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
    area.insertAdjacentHTML("beforeend", `<div class="msg ok">${escapeHtml(r.resposta)}</div>`);
  } catch (e) {
    area.insertAdjacentHTML("beforeend", `<div class="msg err">${escapeHtml(e.message)}</div>`);
  }
  area.scrollTop = area.scrollHeight;
}
