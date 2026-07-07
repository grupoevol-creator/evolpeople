/*************************************************************
 * EVOLPEOPLE - Backend (Google Apps Script)
 * Responde às chamadas JSONP feitas pelo app.js.
 *
 * COMO USAR:
 *  1) Abra a planilha que vai guardar os dados.
 *  2) Extensões > Apps Script.
 *  3) Cole TODO este arquivo no Code.gs (substituindo o que houver).
 *  4) (Opcional) Preencha CONFIG.SPREADSHEET_ID com o ID da planilha.
 *     Se deixar em branco, ele usa a planilha à qual o script está vinculado.
 *  5) Implante > Nova implantação > Tipo "App da Web".
 *       - Executar como: Eu
 *       - Quem tem acesso: Qualquer pessoa
 *  6) Copie a URL /exec e cole em API_URL no app.js.
 *  7) Rode a função instalar() uma vez para já criar as abas.
 *
 *  IMPORTANTE: sempre que editar este arquivo, faça
 *  Implantar > Gerenciar implantações > (lápis) > Nova versão > Implantar,
 *  senão a URL /exec continua servindo a versão antiga.
 *************************************************************/

const CONFIG = {
  // ID da planilha (já preenchido):
  SPREADSHEET_ID: "1Rt-20rITt5YoAVB4QjLWyLasG4yd93NbA4DXhBvbFsI",
  // E-mails que recebem os aniversariantes do dia (usado no gatilho diário):
  EMAILS_AVISO: []
};

/* ===================== DEFINIÇÃO DAS ABAS ===================== */

const SHEETS = {
  usuarios: {
    sheetName: "Usuarios",
    headers: ["CPF", "Nome", "Senha", "Perfil", "Unidade", "Email", "Telefone"]
  },
  unidades: {
    sheetName: "Unidades",
    headers: ["Unidade"]
  },
  colaboradores: {
    sheetName: "Colaboradores",
    headers: ["Nome", "CPF", "Unidade", "Cargo", "SalarioBase", "Complementar", "SalarioTotal",
      "DataAdmissao", "DataNascimento", "FimExperiencia", "Lider", "CidadeResidencia",
      "QuerValeTransporte", "Observacoes", "Status"]
  },
  cargos: {
    sheetName: "Cargos",
    headers: ["Cargo", "SalarioBase", "Complementar", "SalarioTotal"]
  },
  vagas: {
    sheetName: "Vagas",
    headers: ["DataRegistro", "Unidade", "Cargo", "Quantidade", "SalarioBase", "Complementar",
      "SalarioTotal", "CustoProjetado", "Prioridade", "Motivo", "Observacoes", "Status"]
  },
  admissoes: {
    sheetName: "Admissoes",
    headers: ["DataRegistro", "Unidade", "Candidato", "CPF", "Telefone", "Cargo", "DataPrevista",
      "CidadeResidencia", "QuerValeTransporte", "Observacoes", "Status"]
  },
  testes: {
    sheetName: "Testes",
    headers: ["DataTeste", "HoraTeste", "Unidade", "Candidato", "CPF", "Telefone", "Cargo",
      "Setor", "Etapa", "Escala", "Folga", "Avaliador", "Nota", "NotaMinima", "Satisfacao",
      "Criterios", "Resultado", "Observacoes"]
  },
  escalas: {
    sheetName: "Escalas",
    headers: ["Data", "DiaSemana", "Unidade", "Colaborador", "Turno", "TipoEscala", "HorarioEntrada",
      "HorarioSaida", "Folga", "SugestaoFolga", "Observacoes"]
  },
  ponto: {
    sheetName: "Ponto",
    headers: ["DataHora", "Data", "Hora", "Colaborador", "Unidade", "TipoBatida", "Dispositivo", "Latitude", "Longitude"]
  },
  lideranca: {
    sheetName: "Lideranca",
    headers: ["Lider", "Liderado", "Unidade"]
  },
  ocorrencias: {
    sheetName: "Ocorrencias",
    headers: ["Data", "Colaborador", "Unidade", "Tipo", "Descricao", "RegistradoPor"]
  },
  avisos: {
    sheetName: "Avisos",
    headers: ["Data", "Titulo", "Mensagem", "Publico", "Prioridade", "Expira", "CriadoPor"]
  },
  ajustesPonto: {
    sheetName: "AjustesPonto",
    headers: ["DataRegistro", "Colaborador", "Unidade", "Data", "Hora", "TipoBatida", "Justificativa", "Status"]
  },
  feedbacks: {
    sheetName: "Feedbacks",
    headers: ["Data", "Unidade", "Lider", "Gestor", "Colaborador", "Tipo", "Pontuacao", "Classificacao",
      "DecisaoGestor", "Potencial", "RiscoDesligamento", "ProntidaoPromocao", "Engajamento",
      "PlanoDesenvolvimento", "PrazoReavaliacao", "DataProxima", "Evolucao", "Indicadores",
      "StatusFinal", "Nota", "Prazo", "PontosFortes", "PontosMelhoria", "PlanoAcao"]
  },
  experiencia: {
    sheetName: "Experiencia",
    headers: ["Data", "Unidade", "Lider", "Colaborador", "Cargo", "DataAdmissao", "DiasExperiencia",
      "Produtividade", "Comportamento", "Pontualidade", "Equipe", "Tecnica", "Media", "Resultado",
      "Parecer", "PlanoAcao"]
  },
  treinamentos: {
    sheetName: "Treinamentos",
    headers: ["Data", "Unidade", "Tema", "Tipo", "Ministrante", "LiderResponsavel", "HorasDadas",
      "HorasAssistidas", "ParticipantesManuais", "Observacoes"]
  },
  fardamento: {
    sheetName: "Fardamento",
    headers: ["Unidade", "Item", "Tipo", "Tamanho", "QuantidadeEstoque", "QuantidadeMinima",
      "Fornecedor", "Status"]
  },
  mural: {
    sheetName: "Mural",
    headers: ["Data", "Titulo", "Mensagem", "Unidade", "PublicadoPor"]
  },
  indicadores: {
    sheetName: "Indicadores",
    headers: ["Mes", "Ano", "Unidade", "TurnoverPercentual", "AbsenteismoPercentual",
      "Faturamento", "AtualizadoPor", "Observacoes"]
  },
  sla: {
    sheetName: "SLA",
    headers: ["Mes", "Ano", "Unidade", "SLA_Dias", "VagasFechadas", "AtualizadoPor", "Observacoes"]
  },
  salariosRiomar: {
    sheetName: "SalariosRioMar",
    headers: ["Setor", "Cargo", "Quantidade", "SalarioFixo", "VariavelTeto"]
  }
};

/* ===================== ENTRADA (JSONP) ===================== */

function doGet(e) { return handle_(e); }
function doPost(e) { return handle_(e); }

function handle_(e) {
  const params = (e && e.parameter) || {};
  const callback = params.callback || "";
  const acao = params.acao || "";
  let dados = {};
  try { dados = params.dados ? JSON.parse(params.dados) : {}; } catch (err) { dados = {}; }

  let res;
  try {
    res = roteador_(acao, dados);
  } catch (err) {
    res = { ok: false, erro: String((err && err.message) || err) };
  }

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(res) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

function roteador_(acao, d) {
  const user = d.__user || null;
  switch (acao) {
    case "login": return login_(d);
    case "getInit": return getInit_();
    case "dashboard": return dashboard_(d);

    case "listarColaboradores": return { ok: true, colaboradores: rows_("colaboradores") };
    case "salvarColaborador": return salvarColaborador_(d);

    case "listarCargos": return { ok: true, cargos: cargosNormalizados_() };
    case "salvarCargo": return salvarCargo_(d);

    case "listarVagas": return listarVagas_();
    case "salvarVaga": return salvarVaga_(d);
    case "abrirVaga": return abrirVaga_(d, user);
    case "mudarStatusVaga": return mudarStatusVaga_(d);

    case "listarAdmissoes": return { ok: true, admissoes: rows_("admissoes") };
    case "salvarAdmissao": return salvarAdmissao_(d);

    case "listarTestes": return { ok: true, testes: rows_("testes") };
    case "salvarTeste": return salvarTeste_(d);

    case "gerarEscala": return gerarEscala_(d);
    case "listarEscalas": return { ok: true, escalas: rows_("escalas") };

    case "registrarPonto": return registrarPonto_(d);
    case "listarEspelhoPonto": return listarEspelho_();
    case "solicitarAjustePonto": return solicitarAjuste_(d);
    case "listarAjustesPonto": return { ok: true, ajustes: rows_("ajustesPonto") };

    case "listarLideranca": return { ok: true, lideranca: rows_("lideranca") };

    case "listarAgenda": return listarAgenda_(d);
    case "criarEventoAgenda": return criarEventoAgenda_(d);

    case "dossie": return dossie_(d);
    case "salvarOcorrencia": return salvarOcorrencia_(d, user);
    case "listarOcorrencias": return { ok: true, ocorrencias: rows_("ocorrencias") };

    case "listarFeedbacks": return { ok: true, feedbacks: rows_("feedbacks") };
    case "salvarFeedback": return salvarFeedback_(d, user);

    case "listarAvaliacoesExperiencia": return { ok: true, avaliacoes: rows_("experiencia") };
    case "salvarAvaliacaoExperiencia": return salvarExperiencia_(d, user);

    case "listarTreinamentos": return { ok: true, treinamentos: rows_("treinamentos") };
    case "salvarTreinamento": return salvarTreinamento_(d, user);

    case "listarFardamento": return { ok: true, fardamento: rows_("fardamento") };
    case "salvarFardamento": return salvarFardamento_(d);

    case "listarMural": return { ok: true, mural: rows_("mural") };
    case "salvarMural": return salvarMural_(d, user);

    case "assistenteIA": return assistenteIA_(d);

    case "salvarAviso": return salvarAviso_(d, user);
    case "listarAvisos": return listarAvisos_(d);

    case "listarIndicadoresMensais": return { ok: true, indicadores: rows_("indicadores") };
    case "salvarIndicadorMensal": return salvarIndicador_(d, user);

    case "listarSLA": return { ok: true, sla: rows_("sla") };
    case "salvarSLA": return salvarSLA_(d, user);

    default:
      return { ok: false, erro: "Ação desconhecida: " + acao };
  }
}

/* ===================== INFRA DE PLANILHA ===================== */

function tz_() { return "America/Fortaleza"; }

function ss_() {
  if (CONFIG.SPREADSHEET_ID && String(CONFIG.SPREADSHEET_ID).trim()) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error("Nenhuma planilha vinculada. Vincule o script a uma planilha ou preencha CONFIG.SPREADSHEET_ID.");
  }
  return active;
}

// Retorna a aba pela CHAVE do SHEETS (ex.: "colaboradores"). Cria se não existir.
function sheetByKey_(key) {
  const config = SHEETS[key];
  if (!config) throw new Error('Configuração da aba "' + key + '" não encontrada.');
  const ss = ss_();
  let sh = ss.getSheetByName(config.sheetName);
  if (!sh) {
    sh = ss.insertSheet(config.sheetName);
    sh.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function rows_(key) {
  const sh = sheetByKey_(key);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values.shift().map(String);

  return values
    .filter(row => row.some(v => String(v).trim() !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cleanValue_(h, row[i]); });
      return obj;
    });
}

function append_(key, obj) {
  const sh = sheetByKey_(key);
  const headers = headers_(sh);
  const row = headers.map(h => (obj[h] !== undefined && obj[h] !== null) ? obj[h] : "");
  sh.appendRow(row);
  return obj;
}

// Atualiza a linha cujas colunas-chave batem; se não achar, adiciona.
function upsert_(key, obj, chaveCols) {
  const sh = sheetByKey_(key);
  const headers = headers_(sh);
  const lastRow = sh.getLastRow();

  if (lastRow >= 2) {
    const data = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (let i = 0; i < data.length; i++) {
      const bate = chaveCols.every(c => {
        const idx = headers.indexOf(c);
        return idx !== -1 && norm(data[i][idx]) === norm(obj[c]);
      });
      if (bate) {
        const nova = headers.map(h => (obj[h] !== undefined) ? obj[h] : data[i][headers.indexOf(h)]);
        sh.getRange(i + 2, 1, 1, headers.length).setValues([nova]);
        return { atualizado: true };
      }
    }
  }
  append_(key, obj);
  return { atualizado: false };
}

function cleanValue_(header, v) {
  if (v instanceof Date) {
    const h = String(header).toLowerCase();
    if (h.indexOf("hora") !== -1 && h.indexOf("horas") === -1) {
      return Utilities.formatDate(v, tz_(), "HH:mm");
    }
    return Utilities.formatDate(v, tz_(), "yyyy-MM-dd");
  }
  if (typeof v === "string") return v.trim();
  return v;
}

/* ===================== UTILITÁRIOS ===================== */

function norm(v) {
  return String(v == null ? "" : v)
    .trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function num_(v) {
  if (v === "" || v == null) return 0;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  const n2 = parseFloat(String(v));
  const val = isNaN(n2) ? n : n2;
  return isNaN(val) ? 0 : val;
}

function agora_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd HH:mm"); }
function hoje_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd"); }

function parseDate_(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);        // yyyy-MM-dd
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);           // dd/MM/yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function diffDays_(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Normaliza nome de cargo para casar por aproximação:
// remove "(A)", "(KPI 20%)", "(PJ)", "(5X2)", "<3 MESES", acentos, etc.
function normCargo_(s) {
  return String(s || "")
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")     // qualquer coisa entre parênteses
    .replace(/<[^>]*>/g, " ")       // <3 MESES
    .replace(/KPI\s*\d*\s*%?/g, " ")
    .replace(/\bNAO CONTRATAR\b/g, " ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tabela de referência do Parrileiro Rio Mar (fixo + variável/teto por cargo).
// [Setor, Cargo, Quantidade, SalarioFixo, VariavelTeto]
const SALARIOS_RIOMAR = [
  ["ADMINISTRATIVO", "ASSISTENTE DE C&P (KPI 20%)", 1, 1800, 360],
  ["ALMOXARIFADO", "ALMOXARIFE (KPI 20%)", 1, 2500, 500],
  ["ALMOXARIFADO", "AUXILIAR DE ALMOXARIFE (KPI 20%)", 0, 1674, 334.80],
  ["BAR", "BARMAN SR", 0, 1971.19, 500],
  ["BAR", "BARMAN PL", 2, 1798.85, 500],
  ["BAR", "BARMAN JR", 0, 1674, 445.64],
  ["BAR", "AUXILIAR DE BAR", 2, 1674, 200],
  ["COZINHA", "CHEFE COZINHA (PJ) (KPI 20%) <3 MESES", 1, 7000, 700],
  ["COZINHA", "SUB CHEFE (PJ) (KPI 20%)", 1, 5000, 1000],
  ["COZINHA", "COZINHEIRO SR", 2, 1986.31, 1400],
  ["COZINHA", "COZINHEIRO PL", 2, 1738.02, 1100],
  ["COZINHA", "COZINHEIRO JR", 3, 1674, 750],
  ["COZINHA", "CHURRASQUEIRO SR", 0, 1986.31, 1400],
  ["COZINHA", "CHURRASQUEIRO PL", 2, 1738.02, 1100],
  ["COZINHA", "CHURRASQUEIRO JR", 2, 1674, 750],
  ["COZINHA", "AJUDANTE DE COZINHA", 3, 1674, 245.64],
  ["LIMPEZA", "AUXILIAR DE LIMPEZA", 2, 1674, 245.64],
  ["CAIXA", "OPERADOR DE CAIXA - BAR - DELIVERY (NÃO CONTRATAR)", 0, 1674, 200],
  ["SALÃO", "CUMIM (5X2)", 4, 1674, 400],
  ["SALÃO", "SUPERVISOR OPERACIONAL (PJ) (KPI 30%)", 1, 6500, 1300],
  ["SALÃO", "MAITRE (KPI 60%)", 1, 4000, 1600],
  ["SALÃO", "CONSULTOR DE VENDAS", 7, 1674, 0],
  ["SALÃO", "RECEPCIONISTA (5X2) (KPI 60%)", 1, 1674, 1004.40]
];

// Monta a referência salarial por Unidade + Cargo.
// - Outras unidades: derivadas da base de colaboradores (moda de fixo/complemento).
// - Rio Mar: usa a tabela SalariosRioMar (fixo + variável teto).
function salariosPorUnidade_() {
  const out = [];
  const base = rows_("colaboradores");
  const mapa = {};

  base.forEach(r => {
    const uni = String(r.Operacao || r.Unidade || r.Lotacao || "").trim();
    const cargo = String(r.Cargo || "").trim();
    if (!uni || !cargo) return;
    const fixo = num_(r.Salario_Fixo || r["Salario Fixo"] || r.SalarioBase || r.SalarioFixo);
    const comp = num_(r.Salario_Compl || r["Salario Compl"] || r.Complementar || r.Complemento);
    const key = norm(uni) + "|" + normCargo_(cargo);
    if (!mapa[key]) mapa[key] = { Unidade: uni, Cargo: cargo, fixos: {}, comps: {} };
    mapa[key].fixos[fixo] = (mapa[key].fixos[fixo] || 0) + 1;
    mapa[key].comps[comp] = (mapa[key].comps[comp] || 0) + 1;
  });

  const moda = obj => {
    let melhor = null, cont = -1;
    Object.keys(obj).forEach(k => {
      if (obj[k] > cont || (obj[k] === cont && Number(k) > Number(melhor))) { cont = obj[k]; melhor = k; }
    });
    return melhor === null ? 0 : Number(melhor);
  };

  Object.keys(mapa).forEach(k => {
    const e = mapa[k];
    // Não inclui Rio Mar aqui — ele vem da tabela de referência abaixo.
    if (norm(e.Unidade).indexOf("RIOMAR") !== -1 || norm(e.Unidade).indexOf("RIO MAR") !== -1) return;
    out.push({
      Unidade: e.Unidade, Cargo: e.Cargo,
      SalarioFixo: moda(e.fixos), Complemento: moda(e.comps), VariavelTeto: 0
    });
  });

  // Rio Mar: da aba SalariosRioMar (ou da tabela embutida, se a aba não existir)
  let rm = [];
  try { rm = rows_("salariosRiomar"); } catch (e) { rm = []; }
  if (!rm.length) {
    rm = SALARIOS_RIOMAR.map(a => ({
      Setor: a[0], Cargo: a[1], Quantidade: a[2], SalarioFixo: a[3], VariavelTeto: a[4]
    }));
  }
  rm.forEach(r => {
    const cargo = String(r.Cargo || "").trim();
    if (!cargo) return;
    out.push({
      Unidade: "PARRILEIRO RIOMAR",
      Cargo: cargo,
      SalarioFixo: num_(r.SalarioFixo),
      Complemento: 0,
      VariavelTeto: num_(r.VariavelTeto)
    });
  });

  return out;
}

/* ===================== HANDLERS ===================== */

// Lê a aba Cargos e traduz as colunas reais (ID, Tabela, Cargo, "Salario Fixo",
// "Complemento") para o formato que o app.js espera
// (Cargo, SalarioBase, Complementar, SalarioTotal). Calcula o total sozinho.
function cargosNormalizados_() {
  return rows_("cargos").map(c => {
    const base = num_(getCampo_(c, ["SalarioBase", "Salario Base", "Salário Base", "Salario Fixo", "Salário Fixo", "SalarioFixo", "Fixo"]));
    const comp = num_(getCampo_(c, ["Complementar", "Complemento", "Variavel", "Variável", "Salario Compl", "Salário Compl"]));
    let total = num_(getCampo_(c, ["SalarioTotal", "Salario Total", "Salário Total", "Total"]));
    if (!total) total = base + comp;
    return {
      Cargo: getCampo_(c, ["Cargo", "Nome do Cargo", "Funcao", "Função"]),
      Tabela: c.Tabela || "",
      SalarioBase: base,
      Complementar: comp,
      SalarioTotal: total
    };
  }).filter(c => String(c.Cargo || "").trim() !== "");
}

function login_(d) {
  seedInicial_();
  const login = norm(d.login);
  const senha = String(d.senha || "");
  const us = rows_("usuarios");

  const achou = us.filter(u => {
    const ids = [u.Login, u.Nome, u.CPF, u.Email].map(norm);
    // Aceita login pelo Nome, CPF (com ou sem pontos) ou Email.
    const cpfLimpo = String(u.CPF || "").replace(/[.\-\s]/g, "");
    const loginLimpo = login.replace(/[.\-\s]/g, "");
    const bateId = ids.indexOf(login) !== -1 || cpfLimpo === loginLimpo;
    return bateId && String(u.Senha).trim() === senha;
  })[0];

  if (!achou) return { ok: false, erro: "Login ou senha inválidos." };

  // Se a planilha não tiver coluna "Modulos", o usuário vê todos os módulos.
  const mods = String(achou.Modulos || "").trim();

  return {
    ok: true,
    user: {
      login: achou.Login || achou.Nome,
      nome: achou.Nome,
      perfil: achou.Perfil,
      unidade: achou.Unidade,
      modulos: mods ? mods : "*"
    }
  };
}

function getInit_() {
  const cols = rows_("colaboradores");
  const uni = {};
  rows_("unidades").forEach(u => { if (u.Unidade) uni[String(u.Unidade).trim()] = true; });
  cols.forEach(c => { const u = unidadeDe_(c); if (u) uni[String(u).trim()] = true; });

  let lideranca = [];
  try { lideranca = rows_("lideranca"); } catch (e) { lideranca = []; }

  return {
    ok: true,
    unidades: Object.keys(uni).sort(),
    cargos: cargosNormalizados_(),
    salarios: salariosPorUnidade_(),
    lideranca: lideranca,
    colaboradores: cols.map(c => ({ Nome: nomeDe_(c), Unidade: unidadeDe_(c) }))
  };
}

function dashboard_(d) {
  d = d || {};
  const user = d.__user || {};
  const filtroUni = norm(d.unidade || "");
  const cols = rows_("colaboradores");
  const testes = rows_("testes");
  const fard = rows_("fardamento");

  const ativosTodos = cols.filter(c => ["DESLIGADO", "INATIVO"].indexOf(norm(statusDe_(c))) === -1);
  const ativos = filtroUni ? ativosTodos.filter(c => norm(unidadeDe_(c)) === filtroUni) : ativosTodos;

  // Referência de salário (fixo+complemento) por unidade+cargo. Montada UMA vez (cache).
  const salRef = salariosPorUnidadeCache_();
  const cargoSalMap = {};
  cargosNormalizados_().forEach(cg => { cargoSalMap[normCargo_(cg.Cargo)] = cg.SalarioTotal; });
  // índices rápidos: por (unidade|cargo) e por cargo
  const idxUniCargo = {}, idxCargo = {};
  salRef.forEach(s => {
    const nc = normCargo_(s.Cargo), val = num_(s.SalarioFixo) + num_(s.Complemento);
    idxUniCargo[norm(s.Unidade) + "|" + nc] = val;
    if (idxCargo[nc] === undefined) idxCargo[nc] = val;
  });
  function salarioResolvido_(cargo, unidade, salarioProprio) {
    if (salarioProprio && num_(salarioProprio) > 0) return num_(salarioProprio);
    const nc = normCargo_(cargo);
    let v = idxUniCargo[norm(unidade) + "|" + nc];
    if (v === undefined) v = idxCargo[nc];
    if (v === undefined) v = num_(cargoSalMap[nc]) || 0;
    return v;
  }

  // Vagas em aberto vêm do Controle de Vagas
  let vagasInfo = { linhas: [], headers: [] };
  try { vagasInfo = rowsControleVagas_(); } catch (e) {}
  const cStatusV = hcol_(vagasInfo.headers, "STATUS");
  const cUniV = hcol_(vagasInfo.headers, "UNIDADE");
  const vagasAbertasTodas = vagasInfo.linhas.filter(v =>
    ["ENCERRADA", "CANCELADA"].indexOf(norm(cStatusV ? v[cStatusV] : "")) === -1);
  const vagasAbertas = filtroUni
    ? vagasAbertasTodas.filter(v => norm(cUniV ? v[cUniV] : "") === filtroUni)
    : vagasAbertasTodas;

  // Headcount, folha e vagas por unidade
  const porUnidade = {};
  function slot(u) { u = String(u || "—").trim() || "—"; if (!porUnidade[u]) porUnidade[u] = { Unidade: u, Headcount: 0, Folha: 0, VagasAbertas: 0 }; return porUnidade[u]; }
  ativosTodos.forEach(c => { const s = slot(unidadeDe_(c)); s.Headcount++; s.Folha += salarioResolvido_(cargoDe_(c), unidadeDe_(c), salarioTotalDe_(c)); });
  vagasAbertasTodas.forEach(v => { slot(cUniV ? v[cUniV] : "").VagasAbertas++; });
  const folhaTotal = ativosTodos.reduce((s, c) => s + salarioResolvido_(cargoDe_(c), unidadeDe_(c), salarioTotalDe_(c)), 0);
  const folhaTotalFiltro = ativos.reduce((s, c) => s + salarioResolvido_(cargoDe_(c), unidadeDe_(c), salarioTotalDe_(c)), 0);
  const breakdown = Object.keys(porUnidade).sort().map(k => porUnidade[k]);

  // Lista de unidades para o filtro
  const unis = {};
  ativosTodos.forEach(c => { const u = String(unidadeDe_(c) || "").trim(); if (u) unis[u] = true; });
  vagasAbertasTodas.forEach(v => { const u = String((cUniV ? v[cUniV] : "") || "").trim(); if (u) unis[u] = true; });

  const mesAtual = new Date().getMonth();
  const aniversariantes = ativos.filter(c => {
    const dn = parseDate_(nascDe_(c)); return dn && dn.getMonth() === mesAtual;
  }).map(c => ({ Nome: nomeDe_(c), Unidade: unidadeDe_(c), DataNascimento: nascDe_(c) }));

  const hoje = new Date();
  const experienciaProximas = ativos.filter(c => {
    const fe = parseDate_(fimExpDe_(c)); if (!fe) return false;
    const dd = diffDays_(hoje, fe); return dd >= 0 && dd <= 15;
  }).map(c => ({ Nome: nomeDe_(c), Unidade: unidadeDe_(c), Cargo: cargoDe_(c), FimExperiencia: fimExpDe_(c) }));

  const criticos = fard
    .filter(f => num_(f.QuantidadeEstoque) <= num_(f.QuantidadeMinima))
    .filter(f => !filtroUni || norm(f.Unidade) === filtroUni);

  const seteDias = new Date(); seteDias.setDate(seteDias.getDate() - 7);
  const testesF = filtroUni ? testes.filter(t => norm(t.Unidade) === filtroUni) : testes;
  const testesMes = testesF.filter(t => { const x = parseDate_(t.DataTeste); return x && x.getMonth() === mesAtual; }).length;
  const testesSemana = testesF.filter(t => { const x = parseDate_(t.DataTeste); return x && x >= seteDias; }).length;

  // Custo projetado = custo de preencher as VAGAS EM ABERTO (salário do cargo de cada vaga).
  const cVagaCol = hcol_(vagasInfo.headers, "VAGA");
  const custoProjetado = vagasAbertas.reduce((s, v) => {
    const cargo = cVagaCol ? v[cVagaCol] : "";
    const uni = cUniV ? v[cUniV] : "";
    return s + salarioResolvido_(cargo, uni, 0);
  }, 0);

  // SLA por mês (tempo médio de fechamento por mês de encerramento)
  const cEncV = hcol_(vagasInfo.headers, "DATA ENCERRAMENTO") || hcol_(vagasInfo.headers, "ENCERRADA");
  const cAbV = hcol_(vagasInfo.headers, "DATA ABERTURA") || hcol_(vagasInfo.headers, "ABERTA");
  const slaMes = {};
  const nomesMes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  vagasInfo.linhas.forEach(v => {
    if (norm(cStatusV ? v[cStatusV] : "") !== "ENCERRADA") return;
    if (filtroUni && norm(cUniV ? v[cUniV] : "") !== filtroUni) return;
    const dtEnc = parseDate_(cEncV ? v[cEncV] : "") || parseDate_(cAbV ? v[cAbV] : "");
    if (!dtEnc) return;
    const key = dtEnc.getFullYear() * 100 + dtEnc.getMonth();
    const dias = num_(cDiasV ? v[cDiasV] : 0);
    if (!slaMes[key]) slaMes[key] = { Mes: nomesMes[dtEnc.getMonth()] + "/" + dtEnc.getFullYear(), Encerradas: 0, soma: 0, ord: key };
    slaMes[key].Encerradas++; if (dias > 0) slaMes[key].soma += dias;
  });
  const slaPorMes = Object.keys(slaMes).map(k => slaMes[k]).sort((a, b) => a.ord - b.ord)
    .map(m => ({ Mes: m.Mes, Encerradas: m.Encerradas, SLADias: m.Encerradas ? Math.round(m.soma / m.Encerradas) : "" }));

  // Avaliações de período de experiência (por resultado)
  let exps = []; try { exps = rows_("experiencia"); } catch (e) { exps = []; }
  const expF = filtroUni ? exps.filter(e => norm(pick_(e, ["Unidade"])) === filtroUni) : exps;
  const avaliacoesExp = {
    total: expF.length,
    efetivar: expF.filter(e => norm(e.Resultado) === "EFETIVAR").length,
    acompanhar: expF.filter(e => norm(e.Resultado) === "ACOMPANHAR").length,
    naoEfetivar: expF.filter(e => norm(e.Resultado).indexOf("NAO EFETIVAR") !== -1).length,
    recentes: expF.slice(-8).reverse().map(e => ({ Colaborador: pick_(e, ["Colaborador"]), Unidade: pick_(e, ["Unidade"]), Etapa: pick_(e, ["Etapa"]), Resultado: e.Resultado }))
  };

  // Treinamentos do mês (para o Dashboard)
  let trein = []; try { trein = rows_("treinamentos"); } catch (e) { trein = []; }
  const treinF = filtroUni ? trein.filter(t => norm(t.Unidade) === filtroUni) : trein;
  const treinMes = treinF.filter(t => { const x = parseDate_(t.Data); return x && x.getMonth() === mesAtual; });
  const horasTreinMes = treinMes.reduce((s, t) => s + num_(getCampo_(t, ["HorasDadas", "Horas Dadas"])), 0);

  // SLA de vagas por unidade — calculado automaticamente do Controle de Vagas.
  const cDiasV = hcol_(vagasInfo.headers, "DIAS EM ABERTO");
  const cSlaV = hcol_(vagasInfo.headers, "SLA STATUS");
  const slaAcc = {};
  function slaSlot(u) { u = String(u || "—").trim() || "—"; if (!slaAcc[u]) slaAcc[u] = { Unidade: u, Encerradas: 0, somaDias: 0, ForaSLA: 0 }; return slaAcc[u]; }
  vagasInfo.linhas.forEach(v => {
    const st = norm(cStatusV ? v[cStatusV] : "");
    const u = cUniV ? v[cUniV] : "";
    const dias = num_(cDiasV ? v[cDiasV] : 0);
    const sla = norm(cSlaV ? v[cSlaV] : "");
    if (st === "ENCERRADA") { const s = slaSlot(u); s.Encerradas++; if (dias > 0) s.somaDias += dias; }
    if (["ENCERRADA", "CANCELADA"].indexOf(st) === -1 && sla.indexOf("CRITIC") !== -1) slaSlot(u).ForaSLA++;
  });
  let slaPorUnidade = Object.keys(slaAcc).sort().map(k => {
    const s = slaAcc[k];
    return { Unidade: s.Unidade, Encerradas: s.Encerradas, SLADias: s.Encerradas ? Math.round(s.somaDias / s.Encerradas) : "", ForaSLA: s.ForaSLA };
  });
  let somaG = 0, nG = 0;
  slaPorUnidade.forEach(s => { if (s.SLADias !== "") { somaG += s.SLADias * s.Encerradas; nG += s.Encerradas; } });
  const slaMedioGeral = nG ? Math.round(somaG / nG) : 0;

  // Turnover / Absenteísmo por unidade — do que você edita em Indicadores (registro mais recente).
  let indicRows = []; try { indicRows = rows_("indicadores"); } catch (e) { indicRows = []; }
  const indicUni = {};
  indicRows.forEach(r => {
    const u = String(r.Unidade || "").trim(); if (!u) return;
    const ord = num_(r.Ano) * 100 + num_(r.Mes);
    if (!indicUni[u] || ord >= indicUni[u].ord)
      indicUni[u] = { Unidade: u, Turnover: num_(r.TurnoverPercentual), Absenteismo: num_(r.AbsenteismoPercentual), Faturamento: num_(getCampo_(r, ["Faturamento", "Faturamento (R$)"])), Periodo: (r.Mes + "/" + r.Ano), ord: ord };
  });
  // Mescla folha e faturamento por unidade
  breakdown.forEach(row => {
    const key = Object.keys(indicUni).find(k => norm(k) === norm(row.Unidade));
    const fat = key ? num_(indicUni[key].Faturamento) : 0;
    row.Faturamento = fat;
    row.FatPorColab = row.Headcount ? Math.round(fat / row.Headcount) : 0;
    row.Folha = Math.round(row.Folha);
  });
  let indicadores = Object.keys(indicUni).sort().map(k => {
    const x = indicUni[k];
    return { Unidade: x.Unidade, Turnover: x.Turnover, Absenteismo: x.Absenteismo, Periodo: x.Periodo };
  });

  if (filtroUni) {
    slaPorUnidade = slaPorUnidade.filter(s => norm(s.Unidade) === filtroUni);
    indicadores = indicadores.filter(s => norm(s.Unidade) === filtroUni);
  }

  // Avisos ativos para o perfil de quem está logado
  let avisos = [];
  try { avisos = listarAvisos_({ perfil: user.perfil || "" }).avisos; } catch (e) { avisos = []; }

  // Insights automáticos (comparações e alertas)
  const insights = [];
  if (experienciaProximas.length) insights.push("⏳ " + experienciaProximas.length + " colaborador(es) com experiência vencendo em 15 dias.");
  const criticasTotal = slaPorUnidade.reduce((s, x) => s + (x.ForaSLA || 0), 0);
  if (criticasTotal > 0) insights.push("🚨 " + criticasTotal + " vaga(s) em aberto com SLA crítico.");
  if (criticos.length) insights.push("📦 " + criticos.length + " item(ns) de fardamento em estoque crítico.");
  if (aniversariantes.length) insights.push("🎂 " + aniversariantes.length + " aniversariante(s) neste mês.");
  if (avaliacoesExp.naoEfetivar > 0) insights.push("⚠️ " + avaliacoesExp.naoEfetivar + " avaliação(ões) de experiência com parecer NÃO EFETIVAR.");

  return {
    ok: true,
    dashboard: {
      filtroUnidade: d.unidade || "",
      unidades: Object.keys(unis).sort(),
      avisos: avisos,
      insights: insights,
      kpis: {
        headcount: ativos.length,
        vagasAbertas: vagasAbertas.length,
        custoProjetado: custoProjetado,
        folhaTotal: Math.round(folhaTotalFiltro),
        slaMedioGeral: slaMedioGeral,
        testesMes: testesMes,
        testesSemana: testesSemana,
        aniversariantes: aniversariantes.length,
        estoqueCritico: criticos.length,
        treinamentosMes: treinMes.length,
        horasTreinMes: Math.round(horasTreinMes * 10) / 10
      },
      porUnidade: breakdown,
      slaPorUnidade: slaPorUnidade,
      slaPorMes: slaPorMes,
      indicadores: indicadores,
      avaliacoesExp: avaliacoesExp,
      aniversariantes: aniversariantes,
      experienciaProximas: experienciaProximas,
      estoqueCritico: criticos
    }
  };
}

function salvarColaborador_(d) {
  if (!String(d.Nome || "").trim()) return { ok: false, erro: "Informe o nome do colaborador." };
  ["Bairro", "ValeTransporteDia"].forEach(c => garantirColuna_("colaboradores", c));
  const base = num_(d.SalarioBase), comp = num_(d.Complementar);
  const obj = {
    Nome: d.Nome, CPF: d.CPF, Unidade: d.Unidade, Cargo: d.Cargo,
    SalarioBase: base, Complementar: comp, SalarioTotal: base + comp,
    DataAdmissao: d.DataAdmissao, DataNascimento: d.DataNascimento, FimExperiencia: d.FimExperiencia,
    Lider: d.Lider, CidadeResidencia: d.CidadeResidencia, Bairro: d.Bairro,
    QuerValeTransporte: d.QuerValeTransporte, ValeTransporteDia: num_(d.ValeTransporteDia),
    Observacoes: d.Observacoes, Status: d.Status || "ATIVO"
  };
  const r = String(d.CPF || "").trim()
    ? upsert_("colaboradores", obj, ["CPF"])
    : (append_("colaboradores", obj), { atualizado: false });
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: r.atualizado ? "Colaborador atualizado." : "Colaborador salvo." };
}

function salvarCargo_(d) {
  if (!String(d.Cargo || "").trim()) return { ok: false, erro: "Informe o nome do cargo." };
  const base = num_(d.SalarioBase), comp = num_(d.Complementar);
  // Grava usando os DOIS padrões de nome de coluna. O append_/upsert_ só
  // preenche as colunas que existem de fato na sua aba, então funciona
  // tanto na estrutura "Salario Fixo/Complemento" quanto na "SalarioBase/...".
  const r = upsert_("cargos", {
    Cargo: d.Cargo,
    "Salario Fixo": base,
    "Complemento": comp,
    SalarioBase: base,
    Complementar: comp,
    SalarioTotal: base + comp
  }, ["Cargo"]);
  return { ok: true, msg: r.atualizado ? "Cargo atualizado." : "Cargo salvo." };
}

function salvarVaga_(d) {
  const base = num_(d.SalarioBase), comp = num_(d.Complementar), qtd = num_(d.Quantidade) || 1;
  const total = base + comp;
  append_("vagas", {
    DataRegistro: hoje_(), Unidade: d.Unidade, Cargo: d.Cargo, Quantidade: qtd,
    SalarioBase: base, Complementar: comp, SalarioTotal: total, CustoProjetado: total * qtd,
    Prioridade: d.Prioridade || "NORMAL", Motivo: d.Motivo, Observacoes: d.Observacoes,
    Status: "ABERTA"
  });
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: "Vaga registrada." };
}

function salvarAdmissao_(d) {
  append_("admissoes", {
    DataRegistro: hoje_(), Unidade: d.Unidade, Candidato: d.Candidato, CPF: d.CPF,
    Telefone: d.Telefone, Cargo: d.Cargo, DataPrevista: d.DataPrevista,
    CidadeResidencia: d.CidadeResidencia, QuerValeTransporte: d.QuerValeTransporte,
    Observacoes: d.Observacoes, Status: "PREVISTA"
  });
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: "Admissão registrada." };
}

function salvarTeste_(d) {
  ["Setor", "Etapa", "Escala", "Folga", "NotaMinima", "Satisfacao", "Criterios", "Salario", "VagaId"].forEach(c => garantirColuna_("testes", c));
  const nota = num_(d.Nota);
  const notaMin = num_(d.NotaMinima);
  let resultado = d.Resultado || "";
  if (!resultado) {
    const minimo = notaMin > 0 ? notaMin : 7;
    resultado = (nota > 0 && nota >= minimo) ? "APROVADO" : "REPROVADO";
  }
  append_("testes", {
    DataTeste: d.DataTeste, HoraTeste: d.HoraTeste, Unidade: d.Unidade, Candidato: d.Candidato,
    CPF: d.CPF, Telefone: d.Telefone, Cargo: d.Cargo, Setor: d.Setor, Etapa: d.Etapa,
    Escala: d.Escala, Folga: d.Folga, Avaliador: d.Avaliador,
    Nota: nota, NotaMinima: notaMin, Satisfacao: num_(d.Satisfacao),
    Criterios: d.Criterios || "", Salario: num_(d.Salario), VagaId: d.VagaId || "",
    Resultado: resultado, Observacoes: d.Observacoes
  });
  garantirUnidade_(d.Unidade);

  // Vincula à vaga: marca a vaga como TESTE e coloca o candidato no Controle de Vagas.
  let vinc = false;
  if (String(d.VagaId || "").trim()) {
    try { vinc = atualizarVagaStatus_(d.VagaId, "TESTE", d.Candidato); } catch (e) {}
  }
  return {
    ok: true,
    msg: "Teste salvo. Resultado: " + resultado + (vinc ? ". Vaga atualizada para TESTE." : "."),
    resultado: resultado
  };
}

/* ===================== CONTROLE DE VAGAS (lê a aba existente) ===================== */

function sheetControleVagas_() {
  const ss = ss_();
  const shs = ss.getSheets();
  for (var i = 0; i < shs.length; i++) {
    if (norm(shs[i].getName()).indexOf("CONTROLE DE VAGAS") !== -1) return shs[i];
  }
  throw new Error('Aba "Controle de Vagas" não encontrada na planilha.');
}

// Lê a aba, detectando a linha de cabeçalho (que tem VAGA e STATUS),
// pois a linha 1 costuma ser um título mesclado.
function rowsControleVagas_() {
  const sh = sheetControleVagas_();
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2) return { sheet: sh, headers: [], linhas: [], hRow: 0 };
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var hRow = 0;
  for (var i = 0; i < Math.min(values.length, 6); i++) {
    var linha = values[i].map(function (x) { return norm(x); });
    if (linha.indexOf("VAGA") !== -1 && linha.indexOf("STATUS") !== -1) { hRow = i; break; }
  }
  const headers = values[hRow].map(String);
  const linhas = values.slice(hRow + 1)
    .filter(function (r) { return r.some(function (v) { return String(v).trim() !== ""; }); })
    .map(function (r) {
      var o = {}; headers.forEach(function (h, idx) { o[h] = cleanValue_(h, r[idx]); }); return o;
    });
  return { sheet: sh, headers: headers, linhas: linhas, hRow: hRow };
}

// Atualiza a linha da vaga (por ID) no Controle de Vagas: status e candidato.
function atualizarVagaStatus_(vagaId, novoStatus, candidato) {
  if (!String(vagaId || "").trim()) return false;
  const info = rowsControleVagas_();
  const sh = info.sheet, headers = info.headers, hRow = info.hRow;
  const cId = hcol_(headers, "ID"), cStatus = hcol_(headers, "STATUS"), cCand = hcol_(headers, "CANDIDATO");
  if (!cId) return false;
  const idIdx = headers.indexOf(cId), stIdx = headers.indexOf(cStatus), candIdx = headers.indexOf(cCand);
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  for (var r = hRow + 1; r < values.length; r++) {
    if (norm(values[r][idIdx]) === norm(vagaId)) {
      if (stIdx >= 0 && novoStatus) sh.getRange(r + 1, stIdx + 1).setValue(novoStatus);
      if (candIdx >= 0 && candidato) sh.getRange(r + 1, candIdx + 1).setValue(candidato);
      return true;
    }
  }
  return false;
}

function hcol_(headers, alvo) {
  function limpa(s) { return norm(s).replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
  var a = limpa(alvo);
  for (var i = 0; i < headers.length; i++) if (limpa(headers[i]) === a) return headers[i];
  for (var j = 0; j < headers.length; j++) if (a && limpa(headers[j]).indexOf(a) !== -1) return headers[j];
  return null;
}

function listarVagas_() {
  var info;
  try { info = rowsControleVagas_(); }
  catch (e) { return { ok: true, vagas: [], kpis: { aberto: 0, slaCritico: 0, encerradas: 0, canceladas: 0 }, unidades: [], erroAba: String(e.message) }; }
  var H = info.headers, L = info.linhas;
  var cStatus = hcol_(H, "STATUS"), cSla = hcol_(H, "SLA STATUS"), cUni = hcol_(H, "UNIDADE");
  var aberto = 0, slaCritico = 0, encerradas = 0, canceladas = 0, selecao = 0, teste = 0, unidades = {};
  L.forEach(function (v) {
    var st = norm(cStatus ? v[cStatus] : "");
    var sla = norm(cSla ? v[cSla] : "");
    var aberta = ["ENCERRADA", "CANCELADA"].indexOf(st) === -1;
    if (aberta) { aberto++; if (sla.indexOf("CRITIC") !== -1) slaCritico++; }
    if (st === "ENCERRADA") encerradas++;
    if (st === "CANCELADA") canceladas++;
    if (st === "SELECAO") selecao++;
    if (st === "TESTE") teste++;
    if (cUni && v[cUni]) unidades[String(v[cUni]).trim()] = true;
  });
  return {
    ok: true, vagas: L,
    kpis: { aberto: aberto, slaCritico: slaCritico, encerradas: encerradas, canceladas: canceladas, selecao: selecao, teste: teste },
    unidades: Object.keys(unidades).sort()
  };
}

// Muda o status de uma vaga (por ID). Se ENCERRADA, grava a data de
// encerramento e calcula os dias em aberto automaticamente.
function mudarStatusVaga_(d) {
  const info = rowsControleVagas_();
  const sh = info.sheet, headers = info.headers, hRow = info.hRow;
  const cId = hcol_(headers, "ID"), cStatus = hcol_(headers, "STATUS");
  const cEnc = hcol_(headers, "DATA ENCERRAMENTO") || hcol_(headers, "ENCERRADA");
  const cAb = hcol_(headers, "DATA ABERTURA") || hcol_(headers, "ABERTA");
  const cDias = hcol_(headers, "DIAS EM ABERTO");
  if (!cId || !cStatus) return { ok: false, erro: "Colunas ID/STATUS não encontradas." };
  const idIdx = headers.indexOf(cId), stIdx = headers.indexOf(cStatus);
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  for (var r = hRow + 1; r < values.length; r++) {
    if (norm(values[r][idIdx]) === norm(d.id)) {
      sh.getRange(r + 1, stIdx + 1).setValue(d.status);
      if (norm(d.status) === "ENCERRADA") {
        const hoje = new Date();
        if (cEnc) sh.getRange(r + 1, headers.indexOf(cEnc) + 1).setValue(Utilities.formatDate(hoje, tz_(), "dd/MM/yyyy"));
        if (cDias && cAb) {
          const dtAb = parseDate_(values[r][headers.indexOf(cAb)]);
          if (dtAb) sh.getRange(r + 1, headers.indexOf(cDias) + 1).setValue(diffDays_(dtAb, hoje));
        }
      }
      return { ok: true, msg: "Status atualizado para " + d.status + "." };
    }
  }
  return { ok: false, erro: "Vaga não encontrada." };
}

function abrirVaga_(d, user) {
  var info = rowsControleVagas_();
  var sh = info.sheet, headers = info.headers;
  var hoje = new Date(); var sla = new Date(hoje); sla.setDate(sla.getDate() + 10);
  var fmt = function (dt) { return Utilities.formatDate(dt, tz_(), "dd/MM/yyyy"); };
  var resp = d.solicitante || (user && user.nome) || "";
  var valores = {};
  function setv(nomes, valor) {
    nomes.forEach(function (n) { var h = hcol_(headers, n); if (h) valores[h] = valor; });
  }
  setv(["VAGA"], d.vaga);
  setv(["UNIDADE"], d.unidade);
  setv(["SETOR"], d.setor);
  setv(["GESTOR"], d.gestor || "");
  setv(["MOTIVO"], d.motivo);
  setv(["DATA ABERTURA", "ABERTURA"], fmt(hoje));
  setv(["SLA PREVISTO"], fmt(sla));
  setv(["COLAB SUBSTITUIDO", "COLABORADOR SUBSTITUIDO"], d.substituido || "");
  setv(["STATUS"], "ABERTA");
  setv(["RESPONSAVEL", "SOLICITANTE"], resp);
  setv(["TIPO SOLICITANTE", "TIPO DE SOLICITANTE", "PERFIL SOLICITANTE"], d.tipoSolicitante || "");

  // Urgência: usa a coluna existente ou cria "URGENCIA" no Controle de Vagas.
  let hUrg = hcol_(headers, "URGENCIA") || hcol_(headers, "URGÊNCIA") || hcol_(headers, "PRIORIDADE");
  if (!hUrg) {
    sh.getRange(info.hRow + 1, headers.length + 1).setValue("URGENCIA");
    headers.push("URGENCIA");
    hUrg = "URGENCIA";
  }
  valores[hUrg] = d.urgencia || "Normal";
  var cId = hcol_(headers, "ID");
  if (cId) {
    var maxId = 0;
    info.linhas.forEach(function (l) { var n = num_(l[cId]); if (n > maxId) maxId = n; });
    valores[cId] = maxId + 1;
  }
  var row = headers.map(function (h) { return (valores[h] !== undefined) ? valores[h] : ""; });
  sh.appendRow(row);
  garantirUnidade_(d.unidade);
  return { ok: true, msg: "Vaga aberta no Controle de Vagas (status ABERTA, SLA 10 dias)." };
}

function gerarEscala_(d) {
  const inicio = parseDate_(d.inicio), fim = parseDate_(d.fim);
  if (!inicio || !fim) return { ok: false, erro: "Informe início e fim da escala." };
  if (fim < inicio) return { ok: false, erro: "A data final não pode ser antes da inicial." };

  // Aceita o formato novo [{nome, turno}] e também o antigo ["nome"] / avulsos em texto.
  let lista = [];
  (d.colaboradores || []).forEach(c => {
    if (typeof c === "string") { if (c.trim()) lista.push({ nome: c.trim(), turno: "INTERMEDIARIO", escala: norm(d.tipo) || "6X1", folga: "GIRA" }); }
    else if (c && c.nome) lista.push({ nome: String(c.nome).trim(), turno: norm(c.turno) || "INTERMEDIARIO", escala: norm(c.escala) || norm(d.tipo) || "6X1", folga: norm(c.folga) || "GIRA" });
  });
  String(d.avulsos || "").split(/\r?\n/).forEach(n => { n = n.trim(); if (n) lista.push({ nome: n, turno: "INTERMEDIARIO", escala: norm(d.tipo) || "6X1", folga: "GIRA" }); });
  lista = lista.filter(c => c.nome);
  if (!lista.length) return { ok: false, erro: "Selecione ao menos um colaborador." };

  // Horários por turno. Volta para d.entrada/d.saida se algum turno não veio.
  const turnos = d.turnos || {};
  function horarioDoTurno_(turno) {
    const t = norm(turno);
    let cfg;
    if (t.indexOf("ABERT") !== -1) cfg = turnos.ABERTURA || turnos.abertura;
    else if (t.indexOf("FECH") !== -1) cfg = turnos.FECHAMENTO || turnos.fechamento;
    else cfg = turnos.INTERMEDIARIO || turnos.intermediario;
    cfg = cfg || {};
    return { entrada: cfg.entrada || d.entrada || "", saida: cfg.saida || d.saida || "" };
  }
  function rotuloTurno_(turno) {
    const t = norm(turno);
    if (t.indexOf("ABERT") !== -1) return "ABERTURA";
    if (t.indexOf("FECH") !== -1) return "FECHAMENTO";
    return "INTERMEDIARIO";
  }

  garantirColunaEscala_("Turno");

  const diasNome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const tipo = d.tipo || "6X1";

  // Gravação em lote (muito mais rápido que appendRow linha a linha).
  const sh = sheetByKey_("escalas");
  const headers = headers_(sh);
  const linhas = [];

  const cur = new Date(inicio);
  while (cur <= fim) {
    const dow = cur.getDay();
    const idxDia = diffDays_(inicio, cur);
    const dataStr = Utilities.formatDate(cur, tz_(), "yyyy-MM-dd");

    lista.forEach((colab, i) => {
      const escalaP = colab.escala || tipo || "6X1";
      const folgaCfg = colab.folga || "GIRA";
      let folga = "NÃO", sugestao = "", turnoUsado = colab.turno;

      if (escalaP === "ROTATIVA") {
        const semana = Math.floor(idxDia / 7);
        turnoUsado = ["ABERTURA", "FECHAMENTO", "INTERMEDIARIO"][(semana + i) % 3];
        if (((idxDia + i) % 7) === 6) folga = "SIM";
        sugestao = diasNome[(6 + i + semana) % 7];
      } else if (folgaCfg !== "GIRA") {
        // Folga fixa num dia da semana
        if (norm(diasNome[dow]) === folgaCfg) folga = "SIM";
        sugestao = folgaCfg;
      } else if (escalaP === "5X2") {
        if (dow === 0 || dow === 6) folga = "SIM"; // sábado e domingo
      } else if (escalaP === "12X36") {
        if ((idxDia % 2) === 1) folga = "SIM";
      } else { // 6X1 girando
        if (((idxDia + i) % 7) === 6) folga = "SIM";
        sugestao = diasNome[(6 + i) % 7];
      }
      const h = horarioDoTurno_(turnoUsado);
      const obj = {
        Data: dataStr, DiaSemana: diasNome[dow], Unidade: d.unidade,
        Colaborador: colab.nome, Turno: rotuloTurno_(turnoUsado), TipoEscala: escalaP,
        HorarioEntrada: folga === "SIM" ? "" : h.entrada,
        HorarioSaida: folga === "SIM" ? "" : h.saida,
        Folga: folga, SugestaoFolga: sugestao, Observacoes: d.observacoes || ""
      };
      linhas.push(headers.map(hd => (obj[hd] !== undefined && obj[hd] !== null) ? obj[hd] : ""));
    });
    cur.setDate(cur.getDate() + 1);
  }

  if (linhas.length) {
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, headers.length).setValues(linhas);
  }
  garantirUnidade_(d.unidade);
  return { ok: true, msg: linhas.length + " registros de escala gerados." };
}

// Garante que a coluna exista na aba Escalas (para planilhas já criadas
// antes da coluna Turno). Se faltar, cria no fim, sem apagar nada.
function garantirColunaEscala_(nomeColuna) {
  const sh = sheetByKey_("escalas");
  const headers = headers_(sh);
  if (headers.indexOf(nomeColuna) === -1) {
    sh.getRange(1, headers.length + 1).setValue(nomeColuna);
  }
}

function registrarPonto_(d) {
  if (!String(d.Colaborador || "").trim()) return { ok: false, erro: "Selecione o colaborador." };
  garantirColuna_("ponto", "Latitude");
  garantirColuna_("ponto", "Longitude");
  const now = new Date();
  append_("ponto", {
    DataHora: agora_(),
    Data: Utilities.formatDate(now, tz_(), "yyyy-MM-dd"),
    Hora: Utilities.formatDate(now, tz_(), "HH:mm"),
    Colaborador: d.Colaborador, Unidade: d.Unidade, TipoBatida: d.TipoBatida,
    Dispositivo: d.Dispositivo || "",
    Latitude: d.Latitude || "", Longitude: d.Longitude || ""
  });
  const coord = (d.Latitude && d.Longitude) ? " (localização registrada)" : "";
  return { ok: true, msg: "Ponto registrado às " + Utilities.formatDate(now, tz_(), "HH:mm") + coord + "." };
}

// Igual ao pick_, mas casa ignorando acentos, espaços e maiúsculas no NOME da coluna.
function getCampo_(obj, nomes) {
  const keys = Object.keys(obj);
  function limpa(s) { return norm(s).replace(/[^A-Z0-9]/g, ""); }
  for (var i = 0; i < nomes.length; i++) {
    var alvo = limpa(nomes[i]);
    var k = keys.find(function (h) { return limpa(h) === alvo; });
    if (k && String(obj[k]).trim() !== "") return obj[k];
  }
  return "";
}

// Salário total de um colaborador, tolerante a nomes de coluna.
function salarioTotalDe_(c) {
  var total = num_(getCampo_(c, ["SalarioTotal", "Salario Total", "Salário Total", "Remuneracao", "Remuneração", "Salario", "Salário"]));
  if (total) return total;
  var base = num_(getCampo_(c, ["SalarioBase", "Salario Base", "Salário Base", "Salario Fixo", "Salário Fixo", "SalarioFixo", "Fixo"]));
  var comp = num_(getCampo_(c, ["Complementar", "Complemento", "Salario Compl", "Variavel", "Variável"]));
  return base + comp;
}

// Lê um campo tentando vários nomes de coluna possíveis (tolerante a
// diferenças de cabeçalho na planilha). Retorna o primeiro não vazio.
function pick_(obj, nomes) {
  for (var i = 0; i < nomes.length; i++) {
    var k = nomes[i];
    if (obj[k] !== undefined && String(obj[k]).trim() !== "") return obj[k];
  }
  return "";
}
function nomeDe_(c) { return pick_(c, ["Nome", "NOME", "Nome Completo", "NomeCompleto", "Colaborador", "Funcionario", "Funcionário"]); }
function nascDe_(c) { return pick_(c, ["DataNascimento", "Data de Nascimento", "Data Nascimento", "DataNasc", "Nascimento", "Aniversario", "Aniversário"]); }
function statusDe_(c) { return pick_(c, ["Status", "STATUS", "Situacao", "Situação"]); }
function unidadeDe_(c) { return pick_(c, ["Unidade", "UNIDADE", "Operacao", "Operação", "Lotacao", "Lotação", "Loja"]); }
function cargoDe_(c) { return pick_(c, ["Cargo", "CARGO", "Funcao", "Função"]); }
function fimExpDe_(c) { return pick_(c, ["FimExperiencia", "Fim da Experiencia", "Fim da Experiência", "FimContrato", "Fim Contrato"]); }

// Garante que a coluna exista na aba (para planilhas criadas antes de
// uma coluna nova). Se faltar, cria no fim, sem apagar nada.
function garantirColuna_(key, nomeColuna) {
  const sh = sheetByKey_(key);
  const headers = headers_(sh);
  if (headers.indexOf(nomeColuna) === -1) {
    sh.getRange(1, headers.length + 1).setValue(nomeColuna);
  }
}

function listarEspelho_() {
  const pts = rows_("ponto");
  const mapa = {};
  pts.forEach(p => {
    const chave = (p.Data || "") + "|" + (p.Colaborador || "");
    if (!mapa[chave]) mapa[chave] = { Data: p.Data, Colaborador: p.Colaborador, Unidade: p.Unidade, batidas: [] };
    mapa[chave].batidas.push(String(p.Hora || "") + " " + String(p.TipoBatida || ""));
  });
  const espelho = Object.keys(mapa).map(k => {
    const e = mapa[k];
    return {
      Data: e.Data, Colaborador: e.Colaborador, Unidade: e.Unidade,
      Batidas: e.batidas.join("  |  "),
      HorasTrabalhadas: "",
      Alertas: (e.batidas.length % 2 !== 0) ? "Batidas ímpares" : ""
    };
  });
  return { ok: true, espelho: espelho };
}

function solicitarAjuste_(d) {
  append_("ajustesPonto", {
    DataRegistro: agora_(), Colaborador: d.Colaborador, Unidade: d.Unidade,
    Data: d.Data, Hora: d.Hora, TipoBatida: d.TipoBatida,
    Justificativa: d.Justificativa, Status: "PENDENTE"
  });
  return { ok: true, msg: "Solicitação de ajuste enviada." };
}

function classificarFeedback_(p) {
  if (!p || p <= 0) return "NÃO PONTUADO";
  if (p >= 90) return "DESTAQUE";
  if (p >= 80) return "ACIMA DAS EXPECTATIVAS";
  if (p >= 70) return "DENTRO DAS EXPECTATIVAS";
  if (p >= 50) return "NECESSITA DESENVOLVIMENTO";
  return "PLANO DE AÇÃO IMEDIATO";
}

function salvarFeedback_(d, user) {
  ["Gestor", "Pontuacao", "Classificacao", "DecisaoGestor", "Potencial", "RiscoDesligamento",
    "ProntidaoPromocao", "Engajamento", "PlanoDesenvolvimento", "PrazoReavaliacao", "DataProxima",
    "Evolucao", "Indicadores", "StatusFinal"].forEach(c => garantirColuna_("feedbacks", c));

  const pont = num_(d.Pontuacao);
  const classificacao = classificarFeedback_(pont);

  append_("feedbacks", {
    Data: d.Data || hoje_(), Unidade: d.Unidade, Lider: (user && user.nome) || "", Gestor: d.Gestor || "",
    Colaborador: d.Colaborador, Tipo: d.Tipo || "", Pontuacao: pont, Classificacao: classificacao,
    DecisaoGestor: d.DecisaoGestor || "", Potencial: d.Potencial || "",
    RiscoDesligamento: d.RiscoDesligamento || "", ProntidaoPromocao: d.ProntidaoPromocao || "",
    Engajamento: d.Engajamento || "", PlanoDesenvolvimento: d.PlanoDesenvolvimento || "",
    PrazoReavaliacao: d.PrazoReavaliacao || "", DataProxima: d.DataProxima || "",
    Evolucao: d.Evolucao || "", Indicadores: d.Indicadores || "", StatusFinal: d.StatusFinal || "",
    Nota: pont, Prazo: d.Prazo || "",
    PontosFortes: d.PontosFortes || "", PontosMelhoria: d.PontosMelhoria || "", PlanoAcao: d.PlanoAcao || ""
  });
  return { ok: true, msg: "Feedback salvo. Classificação: " + classificacao + ".", classificacao: classificacao };
}

function conceitoNum_(v) {
  v = norm(v);
  if (v.indexOf("SUPERA") !== -1) return 2;
  if (v.indexOf("ATENDE") !== -1) return 1;
  if (v.indexOf("ABAIXO") !== -1) return 0;
  return -1;
}

function salvarExperiencia_(d, user) {
  ["Etapa", "Gestor", "DataAvaliacao", "ProdutividadeEficiencia", "TrabalhoEquipe",
    "SensoDono", "Inovacao", "FazerDiferenca"].forEach(c => garantirColuna_("experiencia", c));

  const valores = [d.Produtividade, d.TrabalhoEquipe, d.SensoDono, d.Inovacao, d.FazerDiferenca];
  let abaixo = 0;
  valores.forEach(v => { if (conceitoNum_(v) === 0) abaixo++; });
  const resultado = abaixo === 0 ? "EFETIVAR" : (abaixo <= 2 ? "ACOMPANHAR" : "NÃO EFETIVAR");

  append_("experiencia", {
    Data: hoje_(), DataAvaliacao: d.DataAvaliacao || hoje_(),
    Unidade: d.Unidade, Lider: (user && user.nome) || "", Gestor: d.Gestor || "",
    Colaborador: d.Colaborador, Cargo: d.Cargo, DataAdmissao: d.DataAdmissao,
    Etapa: d.Etapa,
    ProdutividadeEficiencia: d.Produtividade, TrabalhoEquipe: d.TrabalhoEquipe,
    SensoDono: d.SensoDono, Inovacao: d.Inovacao, FazerDiferenca: d.FazerDiferenca,
    Resultado: resultado, Parecer: resultado, PlanoAcao: d.PlanoAcao
  });
  return { ok: true, msg: "Avaliação salva. Resultado: " + resultado + ".", resultado: resultado };
}

/* ===================== OCORRÊNCIAS / DOSSIÊ ===================== */

function salvarOcorrencia_(d, user) {
  if (!String(d.Colaborador || "").trim()) return { ok: false, erro: "Selecione o colaborador." };
  append_("ocorrencias", {
    Data: d.Data || hoje_(), Colaborador: d.Colaborador, Unidade: d.Unidade || "",
    Tipo: d.Tipo || "OUTRO", Descricao: d.Descricao || "", RegistradoPor: (user && user.nome) || ""
  });
  return { ok: true, msg: "Ocorrência registrada." };
}

function dossie_(d) {
  const nome = String(d.colaborador || "").trim();
  if (!nome) return { ok: false, erro: "Selecione um colaborador." };
  const nomeN = norm(nome);

  const cols = rows_("colaboradores");
  const c = cols.filter(x => norm(nomeDe_(x)) === nomeN)[0] || {};
  const colab = {
    Nome: nomeDe_(c) || nome, Cargo: cargoDe_(c), Unidade: unidadeDe_(c),
    Status: statusDe_(c),
    DataAdmissao: pick_(c, ["DataAdmissao", "Data de Admissao", "Data de Admissão", "Admissao", "Admissão"])
  };

  var ocs = [];
  try { ocs = rows_("ocorrencias"); } catch (e) { ocs = []; }
  const ocsC = ocs.filter(o => norm(pick_(o, ["Colaborador", "Nome"])) === nomeN);
  function contaTipo(termo) { return ocsC.filter(o => norm(pick_(o, ["Tipo"])).indexOf(termo) !== -1).length; }

  const fbs = rows_("feedbacks").filter(f => norm(pick_(f, ["Colaborador", "Nome"])) === nomeN);
  const avs = rows_("experiencia").filter(a => norm(pick_(a, ["Colaborador", "Nome"])) === nomeN);

  const treinos = rows_("treinamentos");
  const treinosC = treinos.filter(t => norm(pick_(t, ["ParticipantesManuais", "Participantes"])).indexOf(nomeN) !== -1);
  const horasTrein = treinosC.reduce((s, t) => s + num_(pick_(t, ["HorasAssistidas", "HorasDadas"])), 0);

  return {
    ok: true, colaborador: colab,
    kpis: {
      atrasos: contaTipo("ATRASO"),
      faltas: contaTipo("FALTA"),
      advertencias: contaTipo("ADVERT"),
      horasTreinamento: Math.round(horasTrein * 10) / 10
    },
    ocorrencias: ocsC, feedbacks: fbs, avaliacoes: avs, treinamentos: treinosC
  };
}

function salvarTreinamento_(d, user) {
  garantirColuna_("treinamentos", "Ministrante");
  append_("treinamentos", {
    Data: d.Data || hoje_(), Unidade: d.Unidade, Tema: d.Tema, Tipo: d.Tipo,
    Ministrante: d.Ministrante || "", LiderResponsavel: (user && user.nome) || "",
    HorasDadas: num_(d.HorasDadas), HorasAssistidas: num_(d.HorasAssistidas),
    ParticipantesManuais: d.ParticipantesManuais, Observacoes: d.Observacoes
  });
  return { ok: true, msg: "Treinamento salvo." };
}

function salvarFardamento_(d) {
  const est = num_(d.QuantidadeEstoque), min = num_(d.QuantidadeMinima);
  const obj = {
    Unidade: d.Unidade, Item: d.Item, Tipo: d.Tipo, Tamanho: d.Tamanho,
    QuantidadeEstoque: est, QuantidadeMinima: min, Fornecedor: d.Fornecedor,
    Status: est <= min ? "CRÍTICO" : "OK"
  };
  const r = upsert_("fardamento", obj, ["Unidade", "Item", "Tamanho"]);
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: r.atualizado ? "Estoque atualizado." : "Estoque salvo." };
}

function salvarMural_(d, user) {
  append_("mural", {
    Data: hoje_(), Titulo: d.Titulo, Mensagem: d.Mensagem,
    Unidade: d.Unidade || "TODAS", PublicadoPor: (user && user.nome) || "Sistema"
  });
  return { ok: true, msg: "Publicação salva." };
}

function salvarIndicador_(d, user) {
  garantirColuna_("indicadores", "Faturamento");
  const r = upsert_("indicadores", {
    Mes: num_(d.Mes), Ano: num_(d.Ano), Unidade: d.Unidade,
    TurnoverPercentual: num_(d.TurnoverPercentual), AbsenteismoPercentual: num_(d.AbsenteismoPercentual),
    Faturamento: num_(d.Faturamento),
    AtualizadoPor: (user && user.nome) || "", Observacoes: d.Observacoes
  }, ["Mes", "Ano", "Unidade"]);
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: r.atualizado ? "Indicador atualizado." : "Indicador salvo." };
}

function salvarSLA_(d, user) {
  const r = upsert_("sla", {
    Mes: num_(d.Mes), Ano: num_(d.Ano), Unidade: d.Unidade,
    SLA_Dias: num_(d.SLA_Dias), VagasFechadas: num_(d.VagasFechadas),
    AtualizadoPor: (user && user.nome) || "", Observacoes: d.Observacoes
  }, ["Mes", "Ano", "Unidade"]);
  garantirUnidade_(d.Unidade);
  return { ok: true, msg: r.atualizado ? "SLA atualizado." : "SLA salvo." };
}

/* ===================== ASSISTENTE (simples, sem custo) ===================== */

let _SALREF_CACHE = null;
function salariosPorUnidadeCache_() {
  if (_SALREF_CACHE) return _SALREF_CACHE;
  try { _SALREF_CACHE = salariosPorUnidade_(); } catch (e) { _SALREF_CACHE = []; }
  return _SALREF_CACHE;
}

function fmtBRL_(n) {
  n = num_(n);
  return "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function matchUniStr_(unidade, termo) {
  const u = norm(unidade);
  if (termo === "RIO MAR" || termo === "RIOMAR") return u.indexOf("RIO MAR") !== -1 || u.indexOf("RIOMAR") !== -1;
  if (termo === "CONRADO" || termo === "EUSEBIO") return u.indexOf("EUSEBIO") !== -1 || u.indexOf("CONRADO") !== -1;
  return u.indexOf(termo) !== -1;
}

function salarioPorCargo_(cargo, unidade) {
  const salRef = salariosPorUnidadeCache_();
  const nc = normCargo_(cargo), nu = norm(unidade);
  let m = salRef.find(s => norm(s.Unidade) === nu && normCargo_(s.Cargo) === nc);
  if (!m) m = salRef.find(s => normCargo_(s.Cargo) === nc);
  if (m) return num_(m.SalarioFixo) + num_(m.Complemento);
  return 0;
}

// EVA — Evol Virtual Assistant (assistente por palavras-chave sobre os dados)
function assistenteIA_(d) {
  const pRaw = String(d.pergunta || "");
  const p = norm(pRaw);
  if (!p) return { ok: true, resposta: "Oi! Eu sou a EVA 🤖. Pergunte sobre: salário de um cargo, headcount, folha, vagas, SLA, aniversariantes, turnover, absenteísmo, testes, feedbacks, treinamentos ou experiência — e pode citar a unidade (Aldeota, Sul, Evol, Eusébio, Rio Mar)." };

  const cols = rows_("colaboradores");
  const ativos = cols.filter(c => ["DESLIGADO", "INATIVO"].indexOf(norm(statusDe_(c))) === -1);
  let uniCitada = "";
  ["ALDEOTA", "SUL", "RIO MAR", "RIOMAR", "EVOL", "EUSEBIO", "CONRADO"].forEach(u => { if (p.indexOf(u) !== -1 && !uniCitada) uniCitada = u; });
  const matchUni = c => !uniCitada || matchUniStr_(unidadeDe_(c), uniCitada);
  const suf = uniCitada ? " (" + uniCitada + ")" : "";

  if (p.indexOf("SALARIO") !== -1 || p.indexOf("GANHA") !== -1) {
    const salRef = salariosPorUnidade_();
    const vistos = {}; const achados = [];
    salRef.forEach(s => {
      const nc = normCargo_(s.Cargo);
      if (!nc) return;
      const primeira = nc.split(" ")[0];
      if (primeira.length >= 3 && p.indexOf(primeira) !== -1 && !vistos[nc]) { vistos[nc] = 1; achados.push(s); }
    });
    if (achados.length) {
      const linhas = achados.slice(0, 8).map(s => "• " + s.Cargo + ": " + fmtBRL_(num_(s.SalarioFixo) + num_(s.Complemento)) + (num_(s.VariavelTeto) ? " (+ variável até " + fmtBRL_(s.VariavelTeto) + ")" : ""));
      return { ok: true, resposta: "Salários encontrados:\n" + linhas.join("\n") };
    }
    return { ok: true, resposta: "Não achei esse cargo na tabela de salários. Tente o nome como está cadastrado (ex.: 'salário de cozinheiro')." };
  }
  if (p.indexOf("HEADCOUNT") !== -1 || p.indexOf("QUANTAS PESSOAS") !== -1 || p.indexOf("QUANTOS COLAB") !== -1 || p.indexOf("QUANTOS FUNC") !== -1) {
    return { ok: true, resposta: "Headcount ativo" + suf + ": " + ativos.filter(matchUni).length + " colaborador(es)." };
  }
  if (p.indexOf("FOLHA") !== -1 || p.indexOf("CUSTO DE PESSOAL") !== -1) {
    const total = ativos.filter(matchUni).reduce((s, c) => s + salarioPorCargo_(cargoDe_(c), unidadeDe_(c)), 0);
    return { ok: true, resposta: "Folha atual" + suf + ": " + fmtBRL_(total) + "." };
  }
  if (p.indexOf("VAGA") !== -1) {
    let info; try { info = rowsControleVagas_(); } catch (e) { return { ok: true, resposta: "Não consegui ler o Controle de Vagas." }; }
    const cSt = hcol_(info.headers, "STATUS"), cU = hcol_(info.headers, "UNIDADE");
    const abertas = info.linhas
      .filter(v => ["ENCERRADA", "CANCELADA"].indexOf(norm(cSt ? v[cSt] : "")) === -1)
      .filter(v => !uniCitada || (cU && matchUniStr_(v[cU], uniCitada)));
    return { ok: true, resposta: abertas.length + " vaga(s) em aberto" + suf + "." };
  }
  if (p.indexOf("SLA") !== -1) {
    let info; try { info = rowsControleVagas_(); } catch (e) { info = { headers: [], linhas: [] }; }
    const cSt = hcol_(info.headers, "STATUS"), cD = hcol_(info.headers, "DIAS EM ABERTO"), cU = hcol_(info.headers, "UNIDADE");
    const enc = info.linhas.filter(v => norm(cSt ? v[cSt] : "") === "ENCERRADA").filter(v => !uniCitada || (cU && matchUniStr_(v[cU], uniCitada)));
    if (!enc.length) return { ok: true, resposta: "Ainda não há vagas encerradas para calcular o SLA" + suf + "." };
    const media = Math.round(enc.reduce((s, v) => s + num_(cD ? v[cD] : 0), 0) / enc.length);
    return { ok: true, resposta: "SLA médio de fechamento" + suf + ": " + media + " dias (" + enc.length + " vagas encerradas)." };
  }
  if (p.indexOf("ANIVERS") !== -1) {
    const mes = new Date().getMonth();
    const nomes = ativos.filter(matchUni).filter(c => { const dn = parseDate_(nascDe_(c)); return dn && dn.getMonth() === mes; }).map(c => nomeDe_(c));
    return { ok: true, resposta: nomes.length ? "Aniversariantes do mês" + suf + ": " + nomes.join(", ") + "." : "Nenhum aniversariante neste mês" + suf + "." };
  }
  if (p.indexOf("TURNOVER") !== -1 || p.indexOf("ROTATIVIDADE") !== -1 || p.indexOf("ABSENTE") !== -1) {
    let ind = []; try { ind = rows_("indicadores"); } catch (e) {}
    let melhor = null;
    ind.forEach(r => { if (uniCitada && !matchUniStr_(r.Unidade, uniCitada)) return; const ord = num_(r.Ano) * 100 + num_(r.Mes); if (!melhor || ord >= melhor.ord) melhor = { turnover: num_(r.TurnoverPercentual), absent: num_(r.AbsenteismoPercentual), ord: ord, uni: r.Unidade }; });
    if (!melhor) return { ok: true, resposta: "Ainda não há indicadores lançados" + suf + ". Lance em Indicadores Mensais." };
    return { ok: true, resposta: (melhor.uni || "") + " → Turnover: " + melhor.turnover + "% | Absenteísmo: " + melhor.absent + "%." };
  }
  if (p.indexOf("TESTE") !== -1) {
    const mes = new Date().getMonth();
    const n = rows_("testes").filter(x => { const dd = parseDate_(x.DataTeste); return dd && dd.getMonth() === mes; }).filter(x => !uniCitada || matchUniStr_(x.Unidade, uniCitada)).length;
    return { ok: true, resposta: n + " teste(s) realizados este mês" + suf + "." };
  }
  if (p.indexOf("FEEDBACK") !== -1) {
    const f = rows_("feedbacks").filter(x => !uniCitada || matchUniStr_(x.Unidade, uniCitada));
    return { ok: true, resposta: f.length + " feedback(s) registrados" + suf + "." };
  }
  if (p.indexOf("EXPERIENCIA") !== -1 || p.indexOf("VENCENDO") !== -1 || p.indexOf("VENCER") !== -1) {
    const hoje = new Date();
    const venc = ativos.filter(matchUni).filter(c => { const fe = parseDate_(fimExpDe_(c)); if (!fe) return false; const dd = diffDays_(hoje, fe); return dd >= 0 && dd <= 15; }).map(c => nomeDe_(c));
    return { ok: true, resposta: venc.length ? "Experiência vencendo em 15 dias" + suf + ": " + venc.join(", ") + "." : "Ninguém com experiência vencendo nos próximos 15 dias" + suf + "." };
  }
  if (p.indexOf("TREINAMENTO") !== -1) {
    const tr = rows_("treinamentos").filter(x => !uniCitada || matchUniStr_(x.Unidade, uniCitada));
    const horas = tr.reduce((s, x) => s + num_(getCampo_(x, ["HorasDadas", "Horas Dadas"])), 0);
    return { ok: true, resposta: tr.length + " treinamento(s), somando " + horas + "h" + suf + "." };
  }
  if (p.indexOf("ESTOQUE") !== -1 || p.indexOf("FARDA") !== -1 || p.indexOf("EPI") !== -1) {
    const crit = rows_("fardamento").filter(f => num_(f.QuantidadeEstoque) <= num_(f.QuantidadeMinima));
    return { ok: true, resposta: crit.length ? "Itens em nível crítico: " + crit.map(c => c.Item + " (" + c.Tamanho + ")").join(", ") + "." : "Nenhum item em estoque crítico." };
  }
  if (p.indexOf("ATRASAD") !== -1 || p.indexOf("FALTOU") !== -1 || p.indexOf("FERIAS") !== -1 || p.indexOf("HORA EXTRA") !== -1 || p.indexOf("BANCO DE HORA") !== -1 || p.indexOf("DOCUMENTO") !== -1) {
    return { ok: true, resposta: "Esse dado ainda não é coletado pelo sistema (depende do controle de ponto/documentos, que entra numa próxima etapa)." };
  }
  return { ok: true, resposta: "Ainda não sei responder isso. Tente: salário de um cargo, headcount, folha, vagas, SLA, aniversariantes, turnover, testes, feedbacks, treinamentos ou experiência." };
}

/* ===================== AVISOS ===================== */

function salvarAviso_(d, user) {
  if (!String(d.Titulo || d.Mensagem || "").trim()) return { ok: false, erro: "Escreva o aviso." };
  append_("avisos", {
    Data: hoje_(), Titulo: d.Titulo || "", Mensagem: d.Mensagem || "",
    Publico: d.Publico || "Todos", Prioridade: d.Prioridade || "Normal",
    Expira: d.Expira || "", CriadoPor: (user && user.nome) || ""
  });
  return { ok: true, msg: "Aviso publicado." };
}

function listarAvisos_(d) {
  let linhas = []; try { linhas = rows_("avisos"); } catch (e) { linhas = []; }
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const perfil = norm((d && d.perfil) || "");
  const ativos = linhas.filter(a => {
    const exp = parseDate_(a.Expira);
    if (exp && exp < hoje) return false;
    const pub = norm(a.Publico || "");
    if (!pub || pub === "TODOS") return true;
    if (!perfil) return true;
    return pub.indexOf(perfil) !== -1 ||
      (perfil.indexOf("SOCIO") !== -1 && pub.indexOf("SOCIO") !== -1) ||
      (perfil.indexOf("DIRET") !== -1 && pub.indexOf("DIRET") !== -1);
  });
  return { ok: true, avisos: ativos.reverse() };
}

/* ===================== AGENDA (Google Calendar) ===================== */

function parseDataHora_(data, hora) {
  const d = parseDate_(data);
  if (!d) return null;
  const m = String(hora || "").match(/^(\d{1,2}):(\d{2})/);
  if (m) d.setHours(+m[1], +m[2], 0, 0); else d.setHours(9, 0, 0, 0);
  return d;
}

function listarAgenda_(d) {
  const inicio = parseDate_(d.inicio) || new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = parseDate_(d.fim) || new Date(inicio.getTime() + 14 * 86400000);
  fim.setHours(23, 59, 59, 999);

  let cals = [];
  try { cals = CalendarApp.getAllCalendars(); } catch (e) { return { ok: false, erro: "Sem acesso ao Google Agenda. Publique nova versão e autorize o Calendar." }; }

  const eventos = [];
  const calendarios = [];
  cals.forEach(function (cal) {
    calendarios.push({ id: cal.getId(), nome: cal.getName() });
    let evs = [];
    try { evs = cal.getEvents(inicio, fim); } catch (e) { evs = []; }
    evs.forEach(function (ev) {
      eventos.push({
        Agenda: cal.getName(),
        Titulo: ev.getTitle(),
        Inicio: Utilities.formatDate(ev.getStartTime(), tz_(), "dd/MM HH:mm"),
        Fim: Utilities.formatDate(ev.getEndTime(), tz_(), "dd/MM HH:mm"),
        Local: ev.getLocation() || "",
        _ord: ev.getStartTime().getTime()
      });
    });
  });
  eventos.sort(function (a, b) { return a._ord - b._ord; });
  eventos.forEach(function (e) { delete e._ord; });
  return { ok: true, eventos: eventos, calendarios: calendarios };
}

function criarEventoAgenda_(d) {
  let cal = null;
  try { cal = d.calendarId ? CalendarApp.getCalendarById(d.calendarId) : CalendarApp.getDefaultCalendar(); }
  catch (e) { return { ok: false, erro: "Sem acesso ao Google Agenda." }; }
  if (!cal) return { ok: false, erro: "Agenda não encontrada." };

  const inicio = parseDataHora_(d.data, d.horaInicio);
  let fim = parseDataHora_(d.data, d.horaFim);
  if (!inicio) return { ok: false, erro: "Informe a data e o horário de início." };
  if (!fim || fim <= inicio) fim = new Date(inicio.getTime() + 60 * 60000);

  try {
    cal.createEvent(d.titulo || "Sem título", inicio, fim, { description: d.descricao || "", location: d.local || "" });
  } catch (e) {
    return { ok: false, erro: "Não foi possível criar o evento (sem permissão de edição nesta agenda?). " + String(e.message || e) };
  }
  return { ok: true, msg: "Compromisso criado na agenda." };
}

/* ===================== SEED / MANUTENÇÃO ===================== */

function garantirUnidade_(u) {
  u = String(u || "").trim();
  if (!u || u.toUpperCase() === "TODAS") return;
  const existentes = rows_("unidades").map(x => norm(x.Unidade));
  if (existentes.indexOf(norm(u)) === -1) append_("unidades", { Unidade: u });
}

// >>> Rode ESTA função para arrumar a planilha: organiza as abas do app
// no início e ESCONDE (não apaga) as abas que o app não usa. <<<
function organizarPlanilha() {
  const ss = ss_();
  bootstrap_(); // garante que todas as abas do app existam

  const ordem = ["Usuarios", "Colaboradores", "Cargos", "Lideranca", "Unidades",
    "Testes", "Escalas", "Ponto", "AjustesPonto", "Feedbacks", "Experiencia",
    "Ocorrencias", "Treinamentos", "Fardamento", "Indicadores", "SLA", "SalariosRioMar"];

  const usadas = {};
  ordem.forEach(n => usadas[norm(n)] = true);

  // Reordena as abas do app para o início
  let pos = 1;
  ordem.forEach(nome => {
    const sh = ss.getSheetByName(nome);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(pos++); }
  });

  // Esconde (NÃO apaga) as abas que o app não usa.
  // Mantém sempre visível a aba "Controle de Vagas".
  const escondidas = [];
  ss.getSheets().forEach(sh => {
    const nn = norm(sh.getName());
    const ehUsada = usadas[nn] || nn.indexOf("CONTROLE DE VAGAS") !== -1;
    if (!ehUsada) {
      try { sh.hideSheet(); escondidas.push(sh.getName()); } catch (e) {}
    }
  });

  return "Planilha organizada. Abas escondidas (não apagadas): " + (escondidas.join(", ") || "nenhuma") +
    ". Para reexibir qualquer uma: menu Ver > Mostrar > (nome da aba).";
}

function seedInicial_() {
  // Só cria um admin de emergência se a aba de usuários estiver totalmente vazia.
  // Como a sua aba já tem usuários reais, isto NÃO será executado.
  if (!rows_("usuarios").length) {
    append_("usuarios", {
      CPF: "", Nome: "Admin", Senha: "123456", Perfil: "ADMIN",
      Unidade: "Matriz", Email: "", Telefone: ""
    });
  }
}

// >>> Rode ESTA função no editor (menu de execução) para instalar/criar as abas. <<<
function instalar() {
  bootstrap_();
  return "Abas criadas e usuário admin gerado com sucesso.";
}

// Cria todas as abas e o usuário admin. (Chamada por instalar().)
function bootstrap_() {
  const lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
    Object.keys(SHEETS).forEach(k => sheetByKey_(k));
    seedInicial_();
    seedSalariosRioMar_();
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// Preenche a aba SalariosRioMar com a tabela de referência, se estiver vazia.
function seedSalariosRioMar_() {
  if (rows_("salariosRiomar").length) return;
  SALARIOS_RIOMAR.forEach(a => {
    append_("salariosRiomar", {
      Setor: a[0], Cargo: a[1], Quantidade: a[2], SalarioFixo: a[3], VariavelTeto: a[4]
    });
  });
}

/* ===================== GATILHO DE ANIVERSÁRIO (opcional) ===================== */

function enviarAniversariantesDoDia() {
  const dataHoje = Utilities.formatDate(new Date(), tz_(), "dd/MM");
  const lista = rows_("colaboradores").filter(c => {
    const dn = parseDate_(c.DataNascimento);
    return dn && Utilities.formatDate(dn, tz_(), "dd/MM") === dataHoje;
  });
  if (!lista.length || !CONFIG.EMAILS_AVISO.length) return;

  MailApp.sendEmail(
    CONFIG.EMAILS_AVISO.join(","),
    "Aniversariantes do Dia - EVOLPEOPLE",
    "Hoje é aniversário de:\n\n" + lista.map(a => a.Nome + " (" + a.Cargo + " - " + a.Unidade + ")").join("\n")
  );
}

// Cria o gatilho diário sem duplicar.
function agendarEnvio() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "enviarAniversariantesDoDia") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("enviarAniversariantesDoDia").timeBased().everyDays(1).atHour(8).create();
}
