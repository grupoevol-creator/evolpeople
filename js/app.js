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
  API_URL: "https://script.google.com/macros/s/AKfycbzXgdgdbAzHZhkBMR6xTkkIw5RPV1UQ3jNwL8K1tM6QgDSv-rWNpT_wsLkJ9_z-ESm_/exec"
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
  STATE.init.lideranca = r.lideranca || [];
  atualizarDatalists();
}

function atualizarDatalists() {
  setDatalist("dl-unidades", STATE.init.unidades);
  setDatalist("dl-cargos", STATE.init.cargos.map(c => c.Cargo));
  setDatalist("dl-colaboradores", STATE.init.colaboradores.map(c => c.Nome));
  setDatalist("dl-bairros", BAIRROS_FORTALEZA.concat(MUNICIPIOS_RMF));
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
    { key: "agenda", label: "Agenda" }
  ] },
  { titulo: "Pessoas", itens: [
    { key: "colaboradores", label: "Colaboradores" },
    { key: "cargos", label: "Cargos e Salários" },
    { key: "unidades", label: "Unidades" },
    { key: "lideranca", label: "Liderança" },
    { key: "dossie", label: "Dossiê" }
  ]},
  { titulo: "Recrutamento", itens: [
    { key: "vagas", label: "Recrutamento (Vagas)" },
    { key: "testes", label: "Teste Prático" }
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
    if (key === "agenda") return renderAgenda();
    if (key === "unidades") return renderUnidades();
    if (key === "lideranca") return renderLideranca();
    if (key === "vagas") return renderVagas();
    if (key === "testes") return renderTestePratico();
    if (key === "experiencia") return renderExperiencia();
    if (key === "feedbacks") return renderFeedback();
    if (key === "dossie") return renderDossie();
    if (key === "universidade") return renderUniversidade();
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
  const r = await api("dashboard", unidade ? { unidade: unidade } : {});
  const dash = r.dashboard;
  const k = dash.kpis;
  const unis = dash.unidades || [];
  const sel = dash.filtroUnidade || "";

  setMain(`
    <div class="page-title">
      <div><h2>Dashboard</h2><p>Visão geral da operação${sel ? " — " + escapeHtml(sel) : ""}.</p></div>
      <div style="min-width:230px">
        <label>Filtrar por Unidade</label>
        <select onchange="renderDashboard(this.value)">
          <option value="">Todas as unidades</option>
          ${unis.map(u => `<option value="${escapeHtml(u)}" ${normalize(u) === normalize(sel) ? "selected" : ""}>${escapeHtml(u)}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="grid g4">
      <div class="kpi"><small>Headcount Ativo</small><strong>${k.headcount}</strong></div>
      <div class="kpi"><small>Vagas em Aberto</small><strong>${k.vagasAbertas}</strong></div>
      <div class="kpi"><small>Custo Projetado</small><strong>${fmtMoeda(k.custoProjetado)}</strong></div>
      <div class="kpi" style="border-left-color:var(--laranja)"><small>Folha Atual (ativos)</small><strong>${fmtMoeda(k.folhaTotal)}</strong></div>
      <div class="kpi" style="border-left-color:var(--info)"><small>SLA Médio de Fechamento</small><strong>${k.slaMedioGeral || 0} dias</strong></div>
      <div class="kpi"><small>Testes no Mês</small><strong>${k.testesMes}</strong></div>
      <div class="kpi"><small>Testes (7 dias)</small><strong>${k.testesSemana}</strong></div>
      <div class="kpi"><small>Aniversariantes do Mês</small><strong>${k.aniversariantes}</strong></div>
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
      </div>
      <div class="card">
        <h3>🔄 Turnover e Absenteísmo por Unidade <span class="muted" style="font-weight:400;font-size:12px">(editável em Indicadores Mensais)</span></h3>
        ${tabelaIndicadores(dash.indicadores)}
      </div>
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
  const lista = STATE.init.lideranca || [];
  const alvo = normalize(nomeColaborador);
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
    <div class="card"><div style="white-space:pre-wrap;line-height:1.65;font-size:14px">${escapeHtml(conteudo)}</div></div>
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
        <div class="form-row"><label>Nome do gestor</label><input id="exGestor" type="text"></div>
        <div class="form-row"><label>Data desta avaliação *</label><input id="exDataAval" type="date"></div>
        <div class="form-row"><label>Unidade</label><input id="exUnidade" type="text" list="dl-unidades"></div>
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
  await carregarExpTabela();
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
    <div class="card"><h3>Feedbacks</h3>${tabelaComBadge(r.feedbacks, ["Data", "Tipo", "Nota", "Lider"])}</div>
    <div class="card"><h3>Avaliações de Experiência</h3>${tabelaComBadge(r.avaliacoes, ["Etapa", "Resultado", "DataAvaliacao"])}</div>
    <div class="card"><h3>Treinamentos</h3>${tabelaComBadge(r.treinamentos, ["Data", "Tema", "Tipo", "HorasAssistidas"])}</div>
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

/* ===================== AGENDA ===================== */

async function renderAgenda() {
  const hoje = new Date().toISOString().slice(0, 10);
  const em14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  setMain(`
    <div class="page-title"><div><h2>📅 Agenda</h2><p>Agendas dos líderes e sócios compartilhadas com a conta central.</p></div></div>

    <div class="card">
      <div class="grid g3">
        <div class="form-row"><label>De</label><input id="agInicio" type="date" value="${hoje}"></div>
        <div class="form-row"><label>Até</label><input id="agFim" type="date" value="${em14}"></div>
        <div class="form-row"><label>Filtrar por agenda</label><select id="agFiltro" onchange="filtrarAgenda()"><option value="">Todas</option></select></div>
      </div>
      <div class="actions"><button class="btn btn-primary" onclick="carregarAgenda()">Atualizar</button></div>
    </div>

    <div class="card">
      <h3>Novo compromisso</h3>
      <div class="grid g3">
        <div class="form-row"><label>Agenda</label><select id="agCal"></select></div>
        <div class="form-row"><label>Título</label><input id="agTitulo" type="text"></div>
        <div class="form-row"><label>Data</label><input id="agData" type="date"></div>
        <div class="form-row"><label>Início</label><input id="agHoraIni" type="time"></div>
        <div class="form-row"><label>Fim</label><input id="agHoraFim" type="time"></div>
        <div class="form-row"><label>Local</label><input id="agLocal" type="text"></div>
      </div>
      <div class="form-row"><label>Descrição</label><textarea id="agDesc"></textarea></div>
      <div class="actions"><button class="btn btn-primary" onclick="criarEventoAgenda()">Criar compromisso</button></div>
    </div>

    <div class="card"><h3>Compromissos</h3><div id="tabelaAgenda"><div class="loading">Carregando...</div></div></div>
  `);
  await carregarAgenda();
}

async function carregarAgenda() {
  const inicio = el("#agInicio").value, fim = el("#agFim").value;
  const cont = document.getElementById("tabelaAgenda");
  cont.innerHTML = `<div class="loading">Carregando...</div>`;
  let r;
  try { r = await api("listarAgenda", { inicio: inicio, fim: fim }); }
  catch (e) { cont.innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`; return; }

  STATE.cache.agenda = r.eventos || [];
  const cals = r.calendarios || [];
  const selCal = document.getElementById("agCal");
  if (selCal) selCal.innerHTML = cals.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nome)}</option>`).join("");
  const selFiltro = document.getElementById("agFiltro");
  if (selFiltro) {
    const nomes = [...new Set(cals.map(c => c.nome))];
    selFiltro.innerHTML = `<option value="">Todas</option>` + nomes.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  }
  filtrarAgenda();
}

function filtrarAgenda() {
  const dados = STATE.cache.agenda || [];
  const f = normalize(el("#agFiltro") ? el("#agFiltro").value : "");
  const filtrados = f ? dados.filter(e => normalize(e.Agenda) === f) : dados;
  document.getElementById("tabelaAgenda").innerHTML = tabelaSimples(filtrados, ["Agenda", "Titulo", "Inicio", "Fim", "Local"]);
}

async function criarEventoAgenda() {
  const dados = {
    calendarId: el("#agCal").value,
    titulo: el("#agTitulo").value.trim(),
    data: el("#agData").value,
    horaInicio: el("#agHoraIni").value,
    horaFim: el("#agHoraFim").value,
    local: el("#agLocal").value.trim(),
    descricao: el("#agDesc").value
  };
  if (!dados.titulo || !dados.data || !dados.horaInicio) { toast("Preencha título, data e horário de início.", "err"); return; }
  try {
    const r = await api("criarEventoAgenda", dados);
    toast(r.msg, "ok");
    await carregarAgenda();
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
  const statusOpts = ["ABERTA", "SELEÇÃO", "TESTE", "ENCERRADA", "CANCELADA"];

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
    ["MOTIVO", ["MOTIVO"]], ["GESTOR", ["GESTOR"]], ["ABERTURA", ["DATA ABERTURA", "ABERTURA", "ABERTA"]],
    ["DIAS EM ABERTO", ["DIAS EM ABERTO"]], ["CANDIDATO", ["CANDIDATO"]],
    ["STATUS", ["STATUS"]], ["SLA", ["SLA STATUS", "SLA"]]
  ];

  if (!filtradas.length) { el("#tabelaVagas").innerHTML = `<div class="empty">Nenhuma vaga encontrada.</div>`; return; }
  el("#tabelaVagas").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>${cols.map(c => `<th>${escapeHtml(c[0])}</th>`).join("")}<th>Alterar Status</th></tr></thead>
      <tbody>
        ${filtradas.map(v => {
          const id = vagaGet(v, ["ID"]);
          const st = normalize(vagaGet(v, ["STATUS"]));
          const opts = ["ABERTA", "SELEÇÃO", "TESTE", "ENCERRADA", "CANCELADA"];
          const selHtml = `<select onchange="mudarStatusVagaUI('${escapeHtml(id)}', this.value)" style="min-width:130px">
            ${opts.map(o => `<option value="${o}" ${normalize(o) === st ? "selected" : ""}>${o}</option>`).join("")}
          </select>`;
          return `<tr>${cols.map(c => `<td>${formatarVagaCelula(c[0], vagaGet(v, c[1]))}</td>`).join("")}<td>${id ? selHtml : ""}</td></tr>`;
        }).join("")}
      </tbody>
    </table></div>`;
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
        <div class="form-row"><label>Nome do candidato *</label><input id="tpCandidato" type="text" placeholder="Nome completo"></div>
        <div class="form-row"><label>Vaga pretendida (cargo)</label><input id="tpCargo" type="text" list="dl-cargos" placeholder="Ex: Cozinheiro JR" onchange="autofillSalarioTeste(this.value)"></div>
        <div class="form-row"><label>Salário do cargo (R$)</label><input id="tpSalario" type="number" step="0.01" class="money" readonly value="0"></div>
        <div class="form-row"><label>Setor</label>
          <select id="tpSetor"><option value="">Selecione...</option>${SETORES.map(s => `<option>${s}</option>`).join("")}</select></div>
        <div class="form-row"><label>Vincular à vaga (Recrutamento)</label>
          <select id="tpVagaId"><option value="">Nenhuma / avulso</option>${vagaOpts}</select></div>
        <div class="form-row"><label>Data do teste *</label><input id="tpData" type="date"></div>
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
  await carregarTestesTabela();
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
    Cargo: el("#tpCargo").value.trim(),
    Salario: el("#tpSalario").value,
    Setor: el("#tpSetor").value,
    VagaId: el("#tpVagaId").value,
    DataTeste: data,
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
    await renderTestePratico();
  } catch (e) { toast(e.message, "err"); }
}

async function carregarTestesTabela() {
  try {
    const r = await api("listarTestes");
    document.getElementById("tabelaTestes").innerHTML =
      tabelaComBadge(r.testes || [], ["DataTeste", "Candidato", "Unidade", "Cargo", "Escala", "Folga", "Nota", "Resultado"]);
  } catch (e) {
    document.getElementById("tabelaTestes").innerHTML = `<div class="msg err">${escapeHtml(e.message)}</div>`;
  }
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
      { name: "Unidade", label: "Unidade", type: "datalist", list: "dl-unidades", onchange: "calcularVT()" },
      { name: "Cargo", label: "Cargo", type: "datalist", list: "dl-cargos", autofillSalario: true },
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
      { name: "Ministrante", label: "Ministrante / Instrutor", type: "text", required: true },
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
      { name: "Faturamento", label: "Faturamento do mês (R$)", type: "money" },
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
  } else if (f.type === "select") {
    inputHtml = `<select id="${idc}" ${req} ${onch}>
      <option value="">Selecione...</option>
      ${f.options.map(o => `<option value="${escapeHtml(o)}" ${o === f.default ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
    </select>`;
  } else if (f.type === "datalist") {
    inputHtml = `<input id="${idc}" type="text" list="${f.list}" value="${val}" autocomplete="off" ${req} ${readonly}
      ${f.autofillSalario ? `onchange="autofillSalarioPorCargo(this.value); calcularVT();"` : onch}>`;
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

function selectTurnoHtml(padrao) {
  const op = [["ABERTURA", "Abertura"], ["INTERMEDIARIO", "Intermediário"], ["FECHAMENTO", "Fechamento"]];
  return `<select class="turno-select" style="width:auto;min-width:150px">
    ${op.map(o => `<option value="${o[0]}" ${o[0] === padrao ? "selected" : ""}>${o[1]}</option>`).join("")}
  </select>`;
}

function linhasChecklistEscala(nomes) {
  if (!nomes.length) return `<div class="empty">Nenhum colaborador nesta unidade.</div>`;
  return nomes.map(n => `
    <div class="check" style="justify-content:space-between;gap:12px">
      <span style="display:flex;align-items:center;gap:8px;flex:1">
        <input type="checkbox" value="${escapeHtml(n)}"> ${escapeHtml(n)}
      </span>
      ${selectTurnoHtml("INTERMEDIARIO")}
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
        <div class="form-row"><label>Tipo de Escala</label>
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
    if (normalize(e.Folga).indexOf("SIM") !== -1)
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

async function gerarEscala() {
  const inicio = el("#escInicio").value;
  const fim = el("#escFim").value;
  if (!inicio || !fim) { toast("Informe início e fim da escala.", "err"); return; }

  // Colaboradores marcados + o turno escolhido em cada linha.
  const colaboradores = [];
  document.querySelectorAll("#escChecklist .check").forEach(row => {
    const cb = row.querySelector('input[type="checkbox"]');
    const sel = row.querySelector("select");
    if (cb && cb.checked) {
      colaboradores.push({ nome: cb.value, turno: sel ? sel.value : "INTERMEDIARIO" });
    }
  });

  // Avulsos (um por linha), todos com o mesmo turno escolhido.
  const turnoAvulsos = el("#escAvulsosTurno") ? el("#escAvulsosTurno").value : "INTERMEDIARIO";
  String(el("#escAvulsos").value || "").split(/\r?\n/).forEach(n => {
    n = n.trim();
    if (n) colaboradores.push({ nome: n, turno: turnoAvulsos });
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
