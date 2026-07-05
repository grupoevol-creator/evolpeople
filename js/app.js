const API_URL = "COLE_AQUI_A_URL_DO_WEB_APP_DO_APPS_SCRIPT_TERMINANDO_COM_EXEC";

let USER = null;
let INIT = {
  unidades: [],
  cargos: [],
  colaboradores: []
};

let TELA = "dashboard";

const MODULOS = [
  [
    "Principal",
    [
      ["dashboard", "📊 Dashboard"],
      ["colaboradores", "👥 Colaboradores"],
      ["cargos", "💰 Cargos & Salários"],
      ["vagas", "💼 Vagas"],
      ["admissoes", "📋 Admissões"],
      ["testes", "✅ Teste Prático"]
    ]
  ],
  [
    "Operação",
    [
      ["escalas", "📅 Gestão de Escalas"],
      ["ponto", "🕒 Ponto / Espelho"],
      ["fardamento", "👕 Fardamento & EPI"]
    ]
  ],
  [
    "Desenvolvimento",
    [
      ["feedbacks", "💬 Feedbacks"],
      ["experiencia", "⭐ Período de Experiência"],
      ["treinamentos", "🎓 Treinamentos"],
      ["mural", "📣 Mural"],
      ["ia", "🤖 IA"]
    ]
  ],
  [
    "Indicadores",
    [
      ["indicadores", "📈 Turnover / Absenteísmo / SLA"]
    ]
  ]
];

document.addEventListener("DOMContentLoaded", () => {
  const salvo = localStorage.getItem("EVOLPEOPLE_USER");

  if (salvo) {
    try {
      USER = JSON.parse(salvo);
      iniciarSistemaLogado();
    } catch (e) {
      localStorage.removeItem("EVOLPEOPLE_USER");
      telaLogin();
    }
  } else {
    telaLogin();
  }
});

function el(id) {
  return document.getElementById(id);
}

function set(html) {
  el("main").innerHTML = html;
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function norm(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function moeda(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function hoje() {
  return new Date().toISOString().substring(0, 10);
}

function mesAtual() {
  return new Date().getMonth() + 1;
}

function anoAtual() {
  return new Date().getFullYear();
}

function getVal(id) {
  const node = el(id);
  return node ? node.value : "";
}

function formData(ids) {
  const obj = {};
  ids.forEach(id => {
    obj[id] = getVal(id);
  });
  return obj;
}

function msgOk(texto) {
  return `<div class="msg ok">${esc(texto)}</div>`;
}

function msgErr(texto) {
  return `<div class="msg err">${esc(texto)}</div>`;
}

function msgWarn(texto) {
  return `<div class="msg warn">${esc(texto)}</div>`;
}

function toast(msg, tipo = "ok") {
  const area = el("toastArea");
  if (!area) return;

  const div = document.createElement("div");
  div.className = `toast ${tipo}`;
  div.textContent = msg;
  area.appendChild(div);

  setTimeout(() => div.remove(), 4200);
}

function modulosUsuario() {
  if (!USER) return [];

  if (Array.isArray(USER.modulos)) return USER.modulos;

  if (typeof USER.modulos === "string") {
    return USER.modulos
      .split(",")
      .map(m => m.trim())
      .filter(Boolean);
  }

  return [
    "dashboard",
    "colaboradores",
    "cargos",
    "vagas",
    "admissoes",
    "testes",
    "escalas",
    "ponto",
    "fardamento",
    "feedbacks",
    "experiencia",
    "treinamentos",
    "mural",
    "ia",
    "indicadores"
  ];
}

function temModulo(id) {
  const mods = modulosUsuario();
  return mods.includes(id) || mods.includes("*") || norm(USER?.perfil) === "ADMIN";
}

function api(acao, dados = {}) {
  return new Promise((resolve) => {
    if (!API_URL || API_URL.includes("COLE_AQUI")) {
      resolve({
        ok: false,
        erro: "Configure a variável API_URL no app.js com a URL /exec do Web App do Apps Script."
      });
      return;
    }

    const callback = "jsonp_" + Date.now() + "_" + Math.floor(Math.random() * 999999);
    const script = document.createElement("script");

    window[callback] = function (res) {
      resolve(res);
      delete window[callback];
      script.remove();
    };

    const payload = {
      ...dados,
      __user: USER
    };

    script.src =
      API_URL +
      "?callback=" +
      encodeURIComponent(callback) +
      "&acao=" +
      encodeURIComponent(acao) +
      "&dados=" +
      encodeURIComponent(JSON.stringify(payload));

    script.onerror = function () {
      resolve({
        ok: false,
        erro: "Falha ao conectar com o Apps Script. Confira a URL do Web App e a implantação."
      });

      delete window[callback];
      script.remove();
    };

    document.body.appendChild(script);
  });
}

function campo(label, id, type = "text", extra = "") {
  return `
    <div>
      <label>${label}</label>
      <input id="${id}" type="${type}" ${extra}>
    </div>
  `;
}

function selectUnidade(id = "Unidade", label = "Unidade") {
  return `
    <div>
      <label>${label}</label>
      <select id="${id}">
        <option value="">Selecione</option>
        ${INIT.unidades.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join("")}
      </select>
    </div>
  `;
}

function selectCargo(id = "Cargo", label = "Cargo") {
  return `
    <div>
      <label>${label}</label>
      <select id="${id}" onchange="preencherSalarioPorCargo()">
        <option value="">Selecione</option>
        ${INIT.cargos.map(c => `
          <option
            value="${esc(c.Cargo)}"
            data-base="${Number(c.SalarioBase || 0)}"
            data-comp="${Number(c.Complementar || 0)}"
            data-total="${Number(c.SalarioTotal || 0)}"
          >
            ${esc(c.Cargo)}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function selectColaborador(id = "Colaborador", label = "Colaborador") {
  return `
    <div>
      <label>${label}</label>
      <select id="${id}">
        <option value="">Selecione</option>
        ${INIT.colaboradores.map(c => `
          <option value="${esc(c.Nome)}">
            ${esc(c.Nome)} — ${esc(c.Unidade || "")}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function tabela(rows, cols) {
  if (!rows || !rows.length) {
    return `<div class="empty">Nenhum registro encontrado.</div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${cols.map(c => `<th>${esc(c[1])}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${cols.map(c => `<td>${esc(r[c[0]] ?? "")}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function telaLogin() {
  el("menu").innerHTML = "";
  el("userBox").style.display = "none";

  set(`
    <section class="login">
      <div class="card">
        <div class="login-logo">
          EVOL
          <span>PEOPLE</span>
        </div>

        <h2 style="text-align:center;margin-bottom:6px;">Acessar sistema</h2>
        <p class="muted" style="text-align:center;margin-bottom:18px;">
          Entre com seu login e senha.
        </p>

        <div class="form-row">
          <label>Login</label>
          <input id="login" autocomplete="username" placeholder="Ex: admin">
        </div>

        <div class="form-row">
          <label>Senha</label>
          <input id="senha" type="password" autocomplete="current-password" placeholder="Digite sua senha">
        </div>

        <button class="btn btn-primary primary" style="width:100%;" onclick="login()">
          Entrar
        </button>

        <div id="loginMsg"></div>

        <p class="muted" style="margin-top:14px;text-align:center;">
          Usuário inicial: admin / 123456
        </p>
      </div>
    </section>
  `);

  setTimeout(() => {
    const input = el("login");
    if (input) input.focus();
  }, 100);
}

async function login() {
  el("loginMsg").innerHTML = "";

  const r = await api("login", {
    login: getVal("login"),
    senha: getVal("senha")
  });

  if (!r.ok) {
    el("loginMsg").innerHTML = msgErr(r.erro || "Erro ao entrar.");
    return;
  }

  USER = r.user || r.usuario || r.data || null;

  if (!USER) {
    el("loginMsg").innerHTML = msgErr("Login realizado, mas o servidor não retornou os dados do usuário.");
    return;
  }

  localStorage.setItem("EVOLPEOPLE_USER", JSON.stringify(USER));

  await iniciarSistemaLogado();
}

async function iniciarSistemaLogado() {
  el("userBox").style.display = "flex";

  if (el("userName")) {
    el("userName").textContent = USER.nome || USER.Nome || USER.login || "Usuário";
  }

  if (el("userPerfil")) {
    el("userPerfil").textContent = USER.perfil || USER.Perfil || "";
  }

  await carregarInit();
  montarMenu();

  const mods = modulosUsuario();
  const primeiraTela = mods.includes("dashboard") || norm(USER?.perfil) === "ADMIN"
    ? "dashboard"
    : (mods[0] || "dashboard");

  abrir(primeiraTela);
}

function logout() {
  USER = null;
  INIT = {
    unidades: [],
    cargos: [],
    colaboradores: []
  };

  localStorage.removeItem("EVOLPEOPLE_USER");
  telaLogin();
}

async function carregarInit() {
  const r = await api("getInit");

  if (r.ok) {
    INIT.unidades = r.unidades || [];
    INIT.cargos = r.cargos || [];
    INIT.colaboradores = r.colaboradores || [];
  } else {
    toast(r.erro || "Erro ao carregar dados iniciais.", "err");
  }
}

function montarMenu() {
  let html = "";

  MODULOS.forEach(([grupo, itens]) => {
    const permitidos = itens.filter(([id]) => temModulo(id));
    if (!permitidos.length) return;

    html += `<div class="nav-title">${grupo}</div>`;

    permitidos.forEach(([id, label]) => {
      html += `<button class="nav" id="nav-${id}" onclick="abrir('${id}')">${label}</button>`;
    });
  });

  el("menu").innerHTML = html;
}

function ativarNav(id) {
  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
  const n = el("nav-" + id);
  if (n) n.classList.add("active");
}

async function abrir(tela) {
  if (!temModulo(tela)) {
    set(`<div class="card">${msgErr("Você não tem permissão para acessar este módulo.")}</div>`);
    return;
  }

  TELA = tela;
  ativarNav(tela);

  if (tela === "dashboard") return telaDashboard();
  if (tela === "colaboradores") return telaColaboradores();
  if (tela === "cargos") return telaCargos();
  if (tela === "vagas") return telaVagas();
  if (tela === "admissoes") return telaAdmissoes();
  if (tela === "testes") return telaTestes();
  if (tela === "escalas") return telaEscalas();
  if (tela === "ponto") return telaPonto();
  if (tela === "feedbacks") return telaFeedbacks();
  if (tela === "experiencia") return telaExperiencia();
  if (tela === "treinamentos") return telaTreinamentos();
  if (tela === "fardamento") return telaFardamento();
  if (tela === "mural") return telaMural();
  if (tela === "ia") return telaIA();
  if (tela === "indicadores") return telaIndicadores();

  set(`<div class="card"><h2>Módulo não encontrado</h2></div>`);
}

async function telaDashboard() {
  set(`<div class="card"><h2>Carregando dashboard...</h2></div>`);

  const r = await api("dashboard");

  if (!r.ok) {
    set(`<div class="card">${msgErr(r.erro || "Erro ao carregar dashboard.")}</div>`);
    return;
  }

  const d = r.dashboard || {};
  const k = d.kpis || {};

  set(`
    <div class="page-title">
      <div>
        <h2>Dashboard</h2>
        <p>Visão geral dos principais indicadores de pessoas e operação.</p>
      </div>
    </div>

    <div class="grid g4">
      <div class="kpi"><small>Headcount</small><strong>${k.headcount || 0}</strong></div>
      <div class="kpi"><small>Vagas abertas</small><strong>${k.vagasAbertas || 0}</strong></div>
      <div class="kpi"><small>Custo projetado</small><strong>${moeda(k.custoProjetado || 0)}</strong></div>
      <div class="kpi"><small>Admissões na semana</small><strong>${k.admissoesSemana || 0}</strong></div>
      <div class="kpi"><small>Testes no mês</small><strong>${k.testesMes || 0}</strong></div>
      <div class="kpi"><small>Testes na semana</small><strong>${k.testesSemana || 0}</strong></div>
      <div class="kpi"><small>Aniversariantes</small><strong>${k.aniversariantes || 0}</strong></div>
      <div class="kpi"><small>Estoque crítico</small><strong>${k.estoqueCritico || 0}</strong></div>
    </div>

    <div class="card">
      <h3>Aniversariantes do mês</h3>
      ${tabela(d.aniversariantes || [], [
        ["Nome", "Nome"],
        ["Unidade", "Unidade"],
        ["DataNascimento", "Nascimento"]
      ])}
    </div>

    <div class="card">
      <h3>Experiências próximas do vencimento</h3>
      ${tabela(d.experienciaProximas || [], [
        ["Nome", "Nome"],
        ["Unidade", "Unidade"],
        ["Cargo", "Cargo"],
        ["FimExperiencia", "Fim Experiência"]
      ])}
    </div>

    <div class="card">
      <h3>Estoque crítico</h3>
      ${tabela(d.estoqueCritico || [], [
        ["Unidade", "Unidade"],
        ["Item", "Item"],
        ["Tamanho", "Tamanho"],
        ["QuantidadeEstoque", "Estoque"],
        ["QuantidadeMinima", "Mínimo"],
        ["Status", "Status"]
      ])}
    </div>
  `);
}

async function telaColaboradores() {
  set(`
    <div class="card">
      <h2>Colaboradores</h2>

      <div class="grid g3">
        ${campo("Nome", "Nome")}
        ${campo("CPF", "CPF")}
        ${selectUnidade()}
        ${selectCargo()}
        ${campo("Salário Base", "SalarioBase", "number", 'class="money" step="0.01"')}
        ${campo("Complementar", "Complementar", "number", 'class="money" step="0.01"')}
        ${campo("Data de Admissão", "DataAdmissao", "date")}
        ${campo("Data de Nascimento", "DataNascimento", "date")}
        ${campo("Fim da Experiência", "FimExperiencia", "date")}
        ${campo("Líder", "Lider")}
        ${campo("Cidade Residência", "CidadeResidencia")}
        <div>
          <label>Quer Vale Transporte?</label>
          <select id="QuerValeTransporte">
            <option value="">Selecione</option>
            <option>SIM</option>
            <option>NÃO</option>
          </select>
        </div>
      </div>

      <label style="margin-top:14px">Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarColaborador()">Salvar colaborador</button>
        <button class="btn btn-secondary secondary" onclick="telaColaboradores()">Atualizar lista</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Base CONTROLE DE C&P</h3>
      <div id="listaColaboradores">Carregando...</div>
    </div>
  `);

  await listarColaboradoresTela();
}

async function listarColaboradoresTela() {
  const r = await api("listarColaboradores");

  if (r.ok) {
    INIT.colaboradores = r.colaboradores || [];

    el("listaColaboradores").innerHTML = tabela(r.colaboradores || [], [
      ["Nome", "Nome"],
      ["CPF", "CPF"],
      ["Unidade", "Unidade"],
      ["Cargo", "Cargo"],
      ["SalarioTotal", "Salário Total"],
      ["Lider", "Líder"],
      ["Status", "Status"]
    ]);
  } else {
    el("listaColaboradores").innerHTML = msgErr(r.erro || "Erro ao listar colaboradores.");
  }
}

async function salvarColaborador() {
  const dados = formData([
    "Nome",
    "CPF",
    "Unidade",
    "Cargo",
    "SalarioBase",
    "Complementar",
    "DataAdmissao",
    "DataNascimento",
    "FimExperiencia",
    "Lider",
    "CidadeResidencia",
    "QuerValeTransporte",
    "Observacoes"
  ]);

  const r = await api("salvarColaborador", dados);
  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Colaborador salvo.") : msgErr(r.erro);

  if (r.ok) {
    await carregarInit();
    await listarColaboradoresTela();
    toast("Colaborador salvo com sucesso.");
  }
}

function preencherSalarioPorCargo() {
  const s = el("Cargo");
  if (!s) return;

  const opt = s.options[s.selectedIndex];
  if (!opt) return;

  if (el("SalarioBase")) el("SalarioBase").value = opt.dataset.base || "";
  if (el("Complementar")) el("Complementar").value = opt.dataset.comp || "";
}

async function telaCargos() {
  set(`
    <div class="card">
      <h2>Cargos & Salários</h2>

      <div class="grid g3">
        ${campo("Cargo", "Cargo")}
        ${campo("Salário Base", "SalarioBase", "number", 'class="money" step="0.01"')}
        ${campo("Complementar", "Complementar", "number", 'class="money" step="0.01"')}
      </div>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarCargo()">Salvar cargo</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Cargos cadastrados</h3>
      <div id="listaCargos">Carregando...</div>
    </div>
  `);

  const r = await api("listarCargos");

  if (r.ok) {
    INIT.cargos = r.cargos || [];
    el("listaCargos").innerHTML = tabela(r.cargos || [], [
      ["Cargo", "Cargo"],
      ["SalarioBase", "Salário Base"],
      ["Complementar", "Complementar"],
      ["SalarioTotal", "Total"]
    ]);
  } else {
    el("listaCargos").innerHTML = msgErr(r.erro || "Erro ao listar cargos.");
  }
}

async function salvarCargo() {
  const r = await api("salvarCargo", formData(["Cargo", "SalarioBase", "Complementar"]));
  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Cargo salvo.") : msgErr(r.erro);

  if (r.ok) {
    await carregarInit();
    telaCargos();
  }
}

async function telaVagas() {
  set(`
    <div class="card">
      <h2>Vagas</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${selectCargo()}
        ${campo("Quantidade", "Quantidade", "number", 'value="1"')}
        ${campo("Salário Base", "SalarioBase", "number", 'class="money" step="0.01"')}
        ${campo("Complementar", "Complementar", "number", 'class="money" step="0.01"')}
        <div>
          <label>Prioridade</label>
          <select id="Prioridade">
            <option>NORMAL</option>
            <option>ALTA</option>
            <option>URGENTE</option>
          </select>
        </div>
      </div>

      <label style="margin-top:14px">Motivo</label>
      <textarea id="Motivo"></textarea>

      <label>Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarVaga()">Abrir vaga</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Vagas registradas</h3>
      <div id="listaVagas">Carregando...</div>
    </div>
  `);

  await listarVagas();
}

async function listarVagas() {
  const r = await api("listarVagas");

  if (r.ok) {
    el("listaVagas").innerHTML = tabela(r.vagas || [], [
      ["DataRegistro", "Data"],
      ["Unidade", "Unidade"],
      ["Cargo", "Cargo"],
      ["Quantidade", "Qtd"],
      ["SalarioTotal", "Salário"],
      ["CustoProjetado", "Custo"],
      ["Status", "Status"],
      ["Prioridade", "Prioridade"]
    ]);
  } else {
    el("listaVagas").innerHTML = msgErr(r.erro || "Erro ao listar vagas.");
  }
}

async function salvarVaga() {
  const r = await api("salvarVaga", formData([
    "Unidade",
    "Cargo",
    "Quantidade",
    "SalarioBase",
    "Complementar",
    "Prioridade",
    "Motivo",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Vaga salva.") : msgErr(r.erro);
  if (r.ok) listarVagas();
}

async function telaAdmissoes() {
  set(`
    <div class="card">
      <h2>Admissões Previstas</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${campo("Candidato", "Candidato")}
        ${campo("CPF", "CPF")}
        ${campo("Telefone", "Telefone")}
        ${selectCargo()}
        ${campo("Data Prevista", "DataPrevista", "date")}
        ${campo("Cidade Residência", "CidadeResidencia")}
        <div>
          <label>Quer VT?</label>
          <select id="QuerValeTransporte">
            <option>NÃO</option>
            <option>SIM</option>
          </select>
        </div>
      </div>

      <label style="margin-top:14px">Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarAdmissao()">Registrar admissão</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Admissões registradas</h3>
      <div id="listaAdmissoes">Carregando...</div>
    </div>
  `);

  await listarAdmissoes();
}

async function listarAdmissoes() {
  const r = await api("listarAdmissoes");

  if (r.ok) {
    el("listaAdmissoes").innerHTML = tabela(r.admissoes || [], [
      ["DataRegistro", "Registro"],
      ["Unidade", "Unidade"],
      ["Candidato", "Candidato"],
      ["Cargo", "Cargo"],
      ["DataPrevista", "Prevista"],
      ["Status", "Status"]
    ]);
  } else {
    el("listaAdmissoes").innerHTML = msgErr(r.erro || "Erro ao listar admissões.");
  }
}

async function salvarAdmissao() {
  const r = await api("salvarAdmissao", formData([
    "Unidade",
    "Candidato",
    "CPF",
    "Telefone",
    "Cargo",
    "DataPrevista",
    "CidadeResidencia",
    "QuerValeTransporte",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Admissão salva.") : msgErr(r.erro);
  if (r.ok) listarAdmissoes();
}

async function telaTestes() {
  set(`
    <div class="card">
      <h2>Teste Prático</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${campo("Candidato", "Candidato")}
        ${campo("CPF", "CPF")}
        ${campo("Telefone", "Telefone")}
        ${selectCargo()}
        ${campo("Data do Teste", "DataTeste", "date")}
        ${campo("Hora do Teste", "HoraTeste", "time")}
        ${campo("Avaliador", "Avaliador")}
        ${campo("Nota", "Nota", "number", 'step="0.1"')}
      </div>

      <label style="margin-top:14px">Resultado</label>
      <select id="Resultado">
        <option value="">Selecione</option>
        <option>APROVADO</option>
        <option>REPROVADO</option>
        <option>EM AVALIAÇÃO</option>
      </select>

      <label>Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarTeste()">Salvar teste</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Testes registrados</h3>
      <div id="listaTestes">Carregando...</div>
    </div>
  `);

  await listarTestes();
}

async function listarTestes() {
  const r = await api("listarTestes");

  if (r.ok) {
    el("listaTestes").innerHTML = tabela(r.testes || [], [
      ["DataTeste", "Data"],
      ["HoraTeste", "Hora"],
      ["Unidade", "Unidade"],
      ["Candidato", "Candidato"],
      ["Cargo", "Cargo"],
      ["Avaliador", "Avaliador"],
      ["Nota", "Nota"],
      ["Resultado", "Resultado"]
    ]);
  } else {
    el("listaTestes").innerHTML = msgErr(r.erro || "Erro ao listar testes.");
  }
}

async function salvarTeste() {
  const r = await api("salvarTeste", formData([
    "Unidade",
    "Candidato",
    "CPF",
    "Telefone",
    "Cargo",
    "DataTeste",
    "HoraTeste",
    "Avaliador",
    "Nota",
    "Resultado",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Teste salvo.") : msgErr(r.erro);
  if (r.ok) listarTestes();
}

async function telaEscalas() {
  set(`
    <div class="card">
      <h2>Gestão de Escalas</h2>

      <div class="grid g3">
        ${selectUnidade()}
        <div>
          <label>Tipo de escala</label>
          <select id="tipo">
            <option>6X1</option>
            <option>5X2</option>
            <option>12X36</option>
          </select>
        </div>
        ${campo("Início", "inicio", "date")}
        ${campo("Fim", "fim", "date")}
        ${campo("Entrada", "entrada", "time", 'value="08:00"')}
        ${campo("Saída", "saida", "time", 'value="16:20"')}
        ${campo("Intervalo", "intervalo", "time", 'value="01:00"')}
      </div>

      <label style="margin-top:14px">Colaboradores</label>
      <div class="checklist">
        ${INIT.colaboradores.map(c => `
          <label class="check">
            <input type="checkbox" name="colaboradorEscala" value="${esc(c.Nome)}">
            ${esc(c.Nome)} — ${esc(c.Unidade || "")}
          </label>
        `).join("")}
      </div>

      <label style="margin-top:14px">Avulsos / Teste prático</label>
      <textarea id="avulsos" placeholder="Um nome por linha"></textarea>

      <label>Observações</label>
      <textarea id="observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="gerarEscala()">Gerar escala</button>
        <button class="btn btn-secondary secondary" onclick="listarEscalas()">Atualizar lista</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Escalas geradas</h3>
      <div id="listaEscalas">Carregando...</div>
    </div>
  `);

  listarEscalas();
}

async function gerarEscala() {
  const colaboradores = Array
    .from(document.querySelectorAll('input[name="colaboradorEscala"]:checked'))
    .map(x => x.value);

  const r = await api("gerarEscala", {
    unidade: getVal("Unidade"),
    tipo: getVal("tipo"),
    inicio: getVal("inicio"),
    fim: getVal("fim"),
    entrada: getVal("entrada"),
    saida: getVal("saida"),
    intervalo: getVal("intervalo"),
    colaboradores,
    avulsos: getVal("avulsos"),
    observacoes: getVal("observacoes")
  });

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Escala gerada.") : msgErr(r.erro);
  if (r.ok) listarEscalas();
}

async function listarEscalas() {
  const r = await api("listarEscalas");

  if (r.ok) {
    el("listaEscalas").innerHTML = tabela(r.escalas || [], [
      ["Data", "Data"],
      ["DiaSemana", "Dia"],
      ["Unidade", "Unidade"],
      ["Colaborador", "Colaborador"],
      ["TipoEscala", "Tipo"],
      ["HorarioEntrada", "Entrada"],
      ["HorarioSaida", "Saída"],
      ["Folga", "Folga"],
      ["SugestaoFolga", "Sugestão"]
    ]);
  } else {
    el("listaEscalas").innerHTML = msgErr(r.erro || "Erro ao listar escalas.");
  }
}

async function telaPonto() {
  set(`
    <div class="card">
      <h2>Ponto / Espelho</h2>

      <div class="grid g3">
        ${selectColaborador()}
        ${selectUnidade()}
        <div>
          <label>Tipo de Batida</label>
          <select id="TipoBatida">
            <option>ENTRADA</option>
            <option>SAÍDA INTERVALO</option>
            <option>RETORNO INTERVALO</option>
            <option>SAÍDA</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="registrarPonto()">Registrar ponto</button>
        <button class="btn btn-secondary secondary" onclick="listarEspelho()">Atualizar espelho</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Solicitar Ajuste</h3>

      <div class="grid g3">
        ${campo("Data", "Data", "date")}
        ${campo("Hora", "Hora", "time")}
        <div>
          <label>Tipo de Batida</label>
          <select id="TipoBatidaAjuste">
            <option>ENTRADA</option>
            <option>SAÍDA INTERVALO</option>
            <option>RETORNO INTERVALO</option>
            <option>SAÍDA</option>
          </select>
        </div>
      </div>

      <label style="margin-top:14px">Justificativa</label>
      <textarea id="Justificativa"></textarea>

      <div class="actions">
        <button class="btn warning" onclick="solicitarAjustePonto()">Solicitar ajuste</button>
      </div>
    </div>

    <div class="card">
      <h3>Espelho de ponto</h3>
      <div id="espelho">Carregando...</div>
    </div>
  `);

  listarEspelho();
}

async function registrarPonto() {
  const r = await api("registrarPonto", {
    Colaborador: getVal("Colaborador"),
    Unidade: getVal("Unidade"),
    TipoBatida: getVal("TipoBatida"),
    Dispositivo: navigator.userAgent
  });

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Ponto registrado.") : msgErr(r.erro);
  listarEspelho();
}

async function listarEspelho() {
  const r = await api("listarEspelhoPonto");

  if (r.ok) {
    el("espelho").innerHTML = tabela(r.espelho || [], [
      ["Data", "Data"],
      ["Colaborador", "Colaborador"],
      ["Unidade", "Unidade"],
      ["Batidas", "Batidas"],
      ["HorasTrabalhadas", "Horas"],
      ["Alertas", "Alertas"]
    ]);
  } else {
    el("espelho").innerHTML = msgErr(r.erro || "Erro ao listar espelho.");
  }
}

async function solicitarAjustePonto() {
  const r = await api("solicitarAjustePonto", {
    Colaborador: getVal("Colaborador"),
    Unidade: getVal("Unidade"),
    Data: getVal("Data"),
    Hora: getVal("Hora"),
    TipoBatida: getVal("TipoBatidaAjuste"),
    Justificativa: getVal("Justificativa")
  });

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Solicitação enviada.") : msgErr(r.erro);
}

async function telaFeedbacks() {
  set(`
    <div class="card">
      <h2>Feedbacks</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${selectColaborador()}
        ${campo("Data", "Data", "date")}
        ${campo("Nota", "Nota", "number", 'step="0.1"')}
        <div>
          <label>Tipo</label>
          <select id="Tipo">
            <option>FEEDBACK DE DESENVOLVIMENTO</option>
            <option>FEEDBACK POSITIVO</option>
            <option>FEEDBACK CORRETIVO</option>
          </select>
        </div>
        ${campo("Prazo", "Prazo", "date")}
      </div>

      <label style="margin-top:14px">Pontos fortes</label>
      <textarea id="PontosFortes"></textarea>

      <label>Pontos de melhoria</label>
      <textarea id="PontosMelhoria"></textarea>

      <label>Plano de ação</label>
      <textarea id="PlanoAcao"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarFeedback()">Salvar feedback</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Feedbacks registrados</h3>
      <div id="listaFeedbacks">Carregando...</div>
    </div>
  `);

  await listarFeedbacks();
}

async function listarFeedbacks() {
  const r = await api("listarFeedbacks");

  if (r.ok) {
    el("listaFeedbacks").innerHTML = tabela(r.feedbacks || [], [
      ["Data", "Data"],
      ["Unidade", "Unidade"],
      ["Lider", "Líder"],
      ["Colaborador", "Colaborador"],
      ["Tipo", "Tipo"],
      ["Nota", "Nota"],
      ["PlanoAcao", "Plano"]
    ]);
  } else {
    el("listaFeedbacks").innerHTML = msgErr(r.erro || "Erro ao listar feedbacks.");
  }
}

async function salvarFeedback() {
  const r = await api("salvarFeedback", formData([
    "Unidade",
    "Colaborador",
    "Data",
    "Nota",
    "Tipo",
    "Prazo",
    "PontosFortes",
    "PontosMelhoria",
    "PlanoAcao"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Feedback salvo.") : msgErr(r.erro);
  if (r.ok) listarFeedbacks();
}

async function telaExperiencia() {
  set(`
    <div class="card">
      <h2>Período de Experiência</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${selectColaborador()}
        ${campo("Cargo", "Cargo")}
        ${campo("Data de Admissão", "DataAdmissao", "date")}
        ${campo("Dias de Experiência", "DiasExperiencia", "number", 'value="90"')}
        ${campo("Produtividade", "Produtividade", "number", 'step="0.1"')}
        ${campo("Comportamento", "Comportamento", "number", 'step="0.1"')}
        ${campo("Pontualidade", "Pontualidade", "number", 'step="0.1"')}
        ${campo("Equipe", "Equipe", "number", 'step="0.1"')}
        ${campo("Técnica", "Tecnica", "number", 'step="0.1"')}
      </div>

      <label style="margin-top:14px">Plano de ação</label>
      <textarea id="PlanoAcao"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarExperiencia()">Salvar avaliação</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Avaliações registradas</h3>
      <div id="listaAvaliacoes">Carregando...</div>
    </div>
  `);

  await listarAvaliacoesExperiencia();
}

async function listarAvaliacoesExperiencia() {
  const r = await api("listarAvaliacoesExperiencia");

  if (r.ok) {
    el("listaAvaliacoes").innerHTML = tabela(r.avaliacoes || [], [
      ["Data", "Data"],
      ["Unidade", "Unidade"],
      ["Lider", "Líder"],
      ["Colaborador", "Colaborador"],
      ["Media", "Média"],
      ["Resultado", "Resultado"],
      ["Parecer", "Parecer"]
    ]);
  } else {
    el("listaAvaliacoes").innerHTML = msgErr(r.erro || "Erro ao listar avaliações.");
  }
}

async function salvarExperiencia() {
  const r = await api("salvarAvaliacaoExperiencia", formData([
    "Unidade",
    "Colaborador",
    "Cargo",
    "DataAdmissao",
    "DiasExperiencia",
    "Produtividade",
    "Comportamento",
    "Pontualidade",
    "Equipe",
    "Tecnica",
    "PlanoAcao"
  ]));

  el("msg").innerHTML = r.ok
    ? msgOk(`${r.msg || "Avaliação salva."} ${r.resultado ? "Resultado: " + r.resultado : ""}`)
    : msgErr(r.erro);

  if (r.ok) listarAvaliacoesExperiencia();
}

async function telaTreinamentos() {
  set(`
    <div class="card">
      <h2>Treinamentos</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${campo("Data", "Data", "date")}
        ${campo("Tema", "Tema")}
        <div>
          <label>Tipo</label>
          <select id="Tipo">
            <option>OPERACIONAL</option>
            <option>COMPORTAMENTAL</option>
            <option>OBRIGATÓRIO</option>
            <option>SEGURANÇA</option>
          </select>
        </div>
        ${campo("Horas Dadas", "HorasDadas", "number", 'step="0.1"')}
        ${campo("Horas Assistidas", "HorasAssistidas", "number", 'step="0.1"')}
      </div>

      <label style="margin-top:14px">Participantes manuais</label>
      <textarea id="ParticipantesManuais"></textarea>

      <label>Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarTreinamento()">Salvar treinamento</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Treinamentos registrados</h3>
      <div id="listaTreinamentos">Carregando...</div>
    </div>
  `);

  await listarTreinamentos();
}

async function listarTreinamentos() {
  const r = await api("listarTreinamentos");

  if (r.ok) {
    el("listaTreinamentos").innerHTML = tabela(r.treinamentos || [], [
      ["Data", "Data"],
      ["Unidade", "Unidade"],
      ["Tema", "Tema"],
      ["Tipo", "Tipo"],
      ["LiderResponsavel", "Responsável"],
      ["HorasDadas", "Horas Dadas"],
      ["HorasAssistidas", "Horas Assistidas"]
    ]);
  } else {
    el("listaTreinamentos").innerHTML = msgErr(r.erro || "Erro ao listar treinamentos.");
  }
}

async function salvarTreinamento() {
  const r = await api("salvarTreinamento", formData([
    "Unidade",
    "Data",
    "Tema",
    "Tipo",
    "HorasDadas",
    "HorasAssistidas",
    "ParticipantesManuais",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Treinamento salvo.") : msgErr(r.erro);
  if (r.ok) listarTreinamentos();
}

async function telaFardamento() {
  set(`
    <div class="card">
      <h2>Fardamento & EPI</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${campo("Item", "Item")}
        <div>
          <label>Tipo</label>
          <select id="Tipo">
            <option>FARDAMENTO</option>
            <option>EPI</option>
          </select>
        </div>
        ${campo("Tamanho", "Tamanho")}
        ${campo("Quantidade Estoque", "QuantidadeEstoque", "number")}
        ${campo("Quantidade Mínima", "QuantidadeMinima", "number")}
        ${campo("Fornecedor", "Fornecedor")}
      </div>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarFardamento()">Salvar estoque</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Estoque</h3>
      <div id="listaFardamento">Carregando...</div>
    </div>
  `);

  await listarFardamento();
}

async function listarFardamento() {
  const r = await api("listarFardamento");

  if (r.ok) {
    el("listaFardamento").innerHTML = tabela(r.fardamento || [], [
      ["Unidade", "Unidade"],
      ["Item", "Item"],
      ["Tipo", "Tipo"],
      ["Tamanho", "Tamanho"],
      ["QuantidadeEstoque", "Estoque"],
      ["QuantidadeMinima", "Mínimo"],
      ["Status", "Status"]
    ]);
  } else {
    el("listaFardamento").innerHTML = msgErr(r.erro || "Erro ao listar fardamento.");
  }
}

async function salvarFardamento() {
  const r = await api("salvarFardamento", formData([
    "Unidade",
    "Item",
    "Tipo",
    "Tamanho",
    "QuantidadeEstoque",
    "QuantidadeMinima",
    "Fornecedor"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Estoque salvo.") : msgErr(r.erro);
  if (r.ok) listarFardamento();
}

async function telaMural() {
  set(`
    <div class="card">
      <h2>Mural</h2>

      <div class="grid g2">
        ${campo("Título", "Titulo")}
        ${selectUnidade("Unidade", "Unidade ou TODAS")}
      </div>

      <label style="margin-top:14px">Mensagem</label>
      <textarea id="Mensagem"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarMural()">Publicar</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Publicações</h3>
      <div id="listaMural">Carregando...</div>
    </div>
  `);

  await listarMural();
}

async function listarMural() {
  const r = await api("listarMural");

  if (r.ok) {
    el("listaMural").innerHTML = tabela(r.mural || [], [
      ["Data", "Data"],
      ["Titulo", "Título"],
      ["Mensagem", "Mensagem"],
      ["Unidade", "Unidade"],
      ["PublicadoPor", "Publicado por"]
    ]);
  } else {
    el("listaMural").innerHTML = msgErr(r.erro || "Erro ao listar mural.");
  }
}

async function salvarMural() {
  const unidade = getVal("Unidade") || "TODAS";

  const r = await api("salvarMural", {
    Titulo: getVal("Titulo"),
    Mensagem: getVal("Mensagem"),
    Unidade: unidade
  });

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Publicação salva.") : msgErr(r.erro);
  if (r.ok) listarMural();
}

async function telaIA() {
  set(`
    <div class="card">
      <h2>Assistente IA</h2>
      <p class="muted">
        Pergunte sobre escala, ponto, feedback, experiência, vagas, fardamento, indicadores e SLA.
      </p>

      <label>Pergunta</label>
      <textarea id="pergunta"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="perguntarIA()">Perguntar</button>
      </div>

      <div id="respostaIA" style="margin-top:14px"></div>
    </div>
  `);
}

async function perguntarIA() {
  el("respostaIA").innerHTML = `<div class="loading">Consultando assistente...</div>`;

  const r = await api("assistenteIA", {
    pergunta: getVal("pergunta")
  });

  el("respostaIA").innerHTML = r.ok
    ? `<div class="card"><strong>Resposta:</strong><p>${esc(r.resposta || "")}</p></div>`
    : msgErr(r.erro || "Erro ao consultar IA.");
}

async function telaIndicadores() {
  set(`
    <div class="card">
      <h2>Turnover / Absenteísmo / SLA</h2>

      <div class="grid g3">
        ${selectUnidade()}
        ${campo("Mês", "Mes", "number", `value="${mesAtual()}"`)}
        ${campo("Ano", "Ano", "number", `value="${anoAtual()}"`)}
        ${campo("Turnover %", "TurnoverPercentual", "number", 'step="0.01"')}
        ${campo("Absenteísmo %", "AbsenteismoPercentual", "number", 'step="0.01"')}
        ${campo("SLA Dias", "SLA_Dias", "number", 'step="0.1"')}
        ${campo("Vagas Fechadas", "VagasFechadas", "number")}
      </div>

      <label style="margin-top:14px">Observações</label>
      <textarea id="Observacoes"></textarea>

      <div class="actions">
        <button class="btn btn-primary primary" onclick="salvarIndicador()">Salvar Turnover/Absenteísmo</button>
        <button class="btn btn-secondary secondary" onclick="salvarSLA()">Salvar SLA</button>
      </div>

      <div id="msg"></div>
    </div>

    <div class="card">
      <h3>Indicadores mensais</h3>
      <div id="listaIndicadores">Carregando...</div>
    </div>
  `);

  await listarIndicadores();
}

async function listarIndicadores() {
  const r = await api("listarIndicadoresMensais");

  if (r.ok) {
    el("listaIndicadores").innerHTML = tabela(r.indicadores || [], [
      ["Mes", "Mês"],
      ["Ano", "Ano"],
      ["Unidade", "Unidade"],
      ["TurnoverPercentual", "Turnover %"],
      ["AbsenteismoPercentual", "Absenteísmo %"],
      ["AtualizadoPor", "Atualizado por"]
    ]);
  } else {
    el("listaIndicadores").innerHTML = msgErr(r.erro || "Erro ao listar indicadores.");
  }
}

async function salvarIndicador() {
  const r = await api("salvarIndicadorMensal", formData([
    "Unidade",
    "Mes",
    "Ano",
    "TurnoverPercentual",
    "AbsenteismoPercentual",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "Indicador salvo.") : msgErr(r.erro);
  if (r.ok) listarIndicadores();
}

async function salvarSLA() {
  const r = await api("salvarSLA", formData([
    "Unidade",
    "Mes",
    "Ano",
    "SLA_Dias",
    "VagasFechadas",
    "Observacoes"
  ]));

  el("msg").innerHTML = r.ok ? msgOk(r.msg || "SLA salvo.") : msgErr(r.erro);
}
