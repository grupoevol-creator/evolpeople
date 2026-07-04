// ===== EVOL PEOPLE — app.js (v6: login por CPF + perfis + recrutamento) =====

const API_URL = "https://script.google.com/macros/s/AKfycbw87GkMPg8Zf07i0j7Pecfv_ofxTQYVxuO0THmqBvIxyD2H27GnHMJfAmSJB00XneV_/exec";

// ===== UNIDADES DO GRUPO EVOL =====
const UNIDADES = [
    "PARRILEIRO SUL",
    "PARRILEIRO ALDEOTA",
    "PARRILEIRO RIO MAR",
    "SEU CONRADO EUSÉBIO",
    "EVOL"
];

const UNIDADE_VARIAVEL = "PARRILEIRO RIO MAR";

// ===== FUNÇÕES PADRÃO: SALÁRIO FIXO + COMPLEMENTO =====
const FUNCOES = {
    "AGENTE DE MANUTENÇÃO": { fixo: 2774.02, compl: 0.00 },
    "AJUDANTE DE BAR": { fixo: 1674.49, compl: 320.00 },
    "AJUDANTE DE COZINHA": { fixo: 1674.49, compl: 0.00 },
    "ALMOXARIFE JR": { fixo: 2500.00, compl: 0.00 },
    "ANALISTA DE COMPRAS": { fixo: 3000.00, compl: 0.00 },
    "ANALISTA DE DEPARTAMENTO PESSOAL JR": { fixo: 3000.00, compl: 0.00 },
    "ANALISTA DE PCP": { fixo: 3000.00, compl: 0.00 },
    "ASSISTENTE COMERCIAL JR": { fixo: 900.00, compl: 0.00 },
    "ASSISTENTE DE MKT": { fixo: 2000.00, compl: 0.00 },
    "ASSISTENTE DE RH": { fixo: 2000.00, compl: 0.00 },
    "ATENDENTE JR": { fixo: 1674.49, compl: 350.00 },
    "ATENDENTE PL": { fixo: 1869.59, compl: 0.00 },
    "ATENDENTE SR": { fixo: 2095.56, compl: 350.00 },
    "AUXILIAR DE ALMOXARIFADO": { fixo: 1674.49, compl: 0.00 },
    "AUXILIAR DE BAR": { fixo: 1674.49, compl: 0.00 },
    "AUXILIAR DE BOQUETA": { fixo: 1674.49, compl: 758.25 },
    "AUXILIAR DE COZINHA": { fixo: 1674.49, compl: 450.00 },
    "BARMAN JR": { fixo: 1674.49, compl: 445.64 },
    "BARMAN LÍDER": { fixo: 2110.00, compl: 0.00 },
    "BARMAN PL": { fixo: 1758.02, compl: 833.63 },
    "BARMAN SR": { fixo: 1971.19, compl: 0.00 },
    "BENEFICIADOR": { fixo: 1674.49, compl: 295.00 },
    "CAIXA JR": { fixo: 1674.49, compl: 70.99 },
    "CAIXA SR": { fixo: 1846.25, compl: 250.00 },
    "CHAPEIRO": { fixo: 1674.49, compl: 645.64 },
    "CHEFE DE COZINHA": { fixo: 2954.00, compl: 0.00 },
    "CHURRASQUEIRO(A) JR": { fixo: 1674.49, compl: 745.64 },
    "CHURRASQUEIRO(A) LÍDER": { fixo: 2110.00, compl: 1500.00 },
    "CHURRASQUEIRO(A) PL": { fixo: 1758.02, compl: 1033.63 },
    "CHURRASQUEIRO(A) SR": { fixo: 2095.56, compl: 0.00 },
    "COMPRADOR": { fixo: 5000.00, compl: 0.00 },
    "CONSULTOR (A) DE VENDAS JR": { fixo: 1674.49, compl: 0.00 },
    "CONSULTOR (A) DE VENDAS PL": { fixo: 1833.60, compl: 155.50 },
    "CONSULTOR (A) DE VENDAS SR": { fixo: 2168.89, compl: 289.56 },
    "CONSULTOR DE VENDAS LÍDER": { fixo: 3496.85, compl: 2332.10 },
    "COORDENADOR(A) DE DELIVERY": { fixo: 4348.51, compl: 0.00 },
    "COORDENADOR(A) DE MARKETING": { fixo: 6000.00, compl: 0.00 },
    "COZINHEIRO(A) JR": { fixo: 1674.49, compl: 745.64 },
    "COZINHEIRO(A) PL": { fixo: 1897.79, compl: 875.31 },
    "COZINHEIRO(A) SR": { fixo: 2095.56, compl: 1028.93 },
    "CUMIM": { fixo: 1674.49, compl: 445.54 },
    "GERENTE DE RH": { fixo: 7000.00, compl: 0.00 },
    "HOSTESS": { fixo: 1674.49, compl: 0.00 },
    "MAITRE": { fixo: 4500.00, compl: 0.00 },
    "PORTEIRO": { fixo: 1674.49, compl: 0.00 },
    "SERVIÇOS GERAIS JR": { fixo: 1674.49, compl: 0.00 },
    "SOCIO (A) OPERADOR": { fixo: 0.00, compl: 0.00 },
    "SOCIO DIRETOR": { fixo: 0.00, compl: 0.00 },
    "SUB CHEFE": { fixo: 4500.00, compl: 0.00 },
    "SUPERVISOR (A) DE DELIVERY": { fixo: 2335.77, compl: 486.00 },
    "SUPERVISOR (A) OPERACIONAL": { fixo: 4220.00, compl: 0.00 },
    "TÉCNICO EM AUDIO": { fixo: 2110.00, compl: 0.00 },
    "VIGIA NOTURNO": { fixo: 1674.49, compl: 0.00 }
};

// ===== FUNÇÕES DO RIO MAR: SALÁRIO BASE + VARIÁVEL (teto) =====
const FUNCOES_RIOMAR = {
    "ASSISTENTE DE C&P (KPI 20%)": { fixo: 1800.00, compl: 360.00 },
    "ALMOXARIFE (KPI 20%)": { fixo: 2500.00, compl: 500.00 },
    "AUXILIAR DE ALMOXARIFE (KPI 20%)": { fixo: 1674.00, compl: 334.80 },
    "BARMAN SR": { fixo: 1971.19, compl: 500.00 },
    "BARMAN PL": { fixo: 1798.85, compl: 500.00 },
    "BARMAN JR": { fixo: 1674.00, compl: 445.64 },
    "AUXILIAR DE BAR": { fixo: 1674.00, compl: 200.00 },
    "CHEFE DE COZINHA (PJ) (KPI 20%)": { fixo: 7000.00, compl: 700.00 },
    "SUB CHEFE (PJ) (KPI 20%)": { fixo: 5000.00, compl: 1000.00 },
    "COZINHEIRO SR": { fixo: 1986.31, compl: 1400.00 },
    "COZINHEIRO PL": { fixo: 1738.02, compl: 1100.00 },
    "COZINHEIRO JR": { fixo: 1674.00, compl: 750.00 },
    "CHURRASQUEIRO SR": { fixo: 1986.31, compl: 1400.00 },
    "CHURRASQUEIRO PL": { fixo: 1738.02, compl: 1100.00 },
    "CHURRASQUEIRO JR": { fixo: 1674.00, compl: 750.00 },
    "AJUDANTE DE COZINHA": { fixo: 1674.00, compl: 245.64 },
    "AUXILIAR DE LIMPEZA": { fixo: 1674.00, compl: 245.64 },
    "OPERADOR DE CAIXA - BAR - DELIVERY": { fixo: 1674.00, compl: 200.00 },
    "CUMIM (5X2)": { fixo: 1674.00, compl: 400.00 },
    "SUPERVISOR OPERACIONAL (PJ) (KPI 30%)": { fixo: 6500.00, compl: 1300.00 },
    "MAITRE (KPI 60%)": { fixo: 4000.00, compl: 1600.00 },
    "CONSULTOR DE VENDAS": { fixo: 1674.00, compl: 0.00 },
    "RECEPCIONISTA (5X2) (KPI 60%)": { fixo: 1674.00, compl: 1004.40 }
};

const ROTULOS = {
    padrao: { fixo: "Salário Fixo (automático)", compl: "Complemento (automático)", total: "Salário Total" },
    variavel: { fixo: "Salário Base (automático)", compl: "Variável — até (teto)", total: "Remuneração Total — até" }
};

const OPCOES = {
    valeTransporte: ["SIM", "NÃO"],
    statusAprovacao: ["EM TESTE", "APROVADO", "REPROVADO"],
    aso: ["PENDENTE", "AGENDADO", "REALIZADO"],
    pastaDocumentacao: ["PENDENTE", "INCOMPLETA", "COMPLETA"],
    folga: ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO", "DOMINGO"],
    statusAdmissao: ["EM PROCESSO", "ADMITIDO", "CANCELADO"]
};

const TITULOS = {
    inicio: "Início",
    dashboard: "Dashboard",
    pessoas: "Pessoas",
    recrutamento: "Recrutamento",
    avaliacao: "Avaliação de Experiência",
    teste: "Teste Prático",
    feedback: "Feedback",
    dossie: "Dossiê do Colaborador",
    estoque: "Estoque — EPI & Fardamento",
    cargos: "Cargos & Salários",
    treinamento: "Universidade Evol",
    pdi: "PDI"
};

// ===== OPÇÕES DOS NOVOS MÓDULOS (v7) =====
const ESCALAS = ["5X2", "6X1", "12X36"];

const NIVEIS = ["EXCELENTE", "BOM", "REGULAR", "INSUFICIENTE"];

const CRITERIOS_TESTE = [
    { id: "critTecnico", nome: "Conhecimento técnico", desc: "Domínio dos conteúdos específicos da vaga" },
    { id: "critLogico", nome: "Raciocínio lógico", desc: "Capacidade de análise e tomada de decisão" },
    { id: "critComunicacao", nome: "Comunicação e clareza", desc: "Clareza nas respostas e postura comunicativa" },
    { id: "critOrganizacao", nome: "Organização e tempo", desc: "Cumprimento dos prazos dentro do teste" },
    { id: "critCultura", nome: "Aderência à cultura", desc: "Alinhamento de valores e perfil comportamental" },
    { id: "critExperiencia", nome: "Experiência prática", desc: "Evidências de vivência real na área" }
];

const ETAPAS_PROCESSO = ["TRIAGEM", "ENTREVISTA", "TESTE PRÁTICO", "PROPOSTA"];

const RECOMENDACOES_TESTE = [
    { valor: "APROVAR E CONTRATAR", desc: "Candidato atende aos requisitos da vaga" },
    { valor: "AVANÇAR PARA PRÓXIMA FASE", desc: "Potencial identificado, mas requer mais avaliação" },
    { valor: "BANCO DE TALENTOS", desc: "Bom perfil, mas não para esta vaga agora" },
    { valor: "REPROVAR", desc: "Não atende aos requisitos mínimos" }
];

const VALORES_EVOL = [
    { id: "avProdutividade", nome: "Produtividade e eficiência" },
    { id: "avEquipe", nome: "Trabalho em equipe" },
    { id: "avSensoDono", nome: "Senso de dono" },
    { id: "avInovacao", nome: "Inovação" },
    { id: "avDiferenca", nome: "Fazer a diferença" }
];

const POSTURA_DISCIPLINA = [
    { id: "avPontualidade", nome: "Pontualidade" },
    { id: "avUniforme", nome: "Uso do uniforme / apresentação" },
    { id: "avComportamento", nome: "Comportamento geral" }
];

const RESULTADOS_AVALIACAO = [
    { valor: "EFETIVAÇÃO", desc: "Colaborador atende ao esperado, será efetivado" },
    { valor: "PRORROGAÇÃO", desc: "Segue no período de experiência para nova avaliação" },
    { valor: "DESLIGAMENTO", desc: "Não atende ao esperado, será desligado" }
];

const TIPOS_FEEDBACK = ["FEEDBACK RÁPIDO", "1:1", "90 DIAS", "180 DIAS", "360°", "FEEDBACK CONTÍNUO"];

const TIPOS_OCORRENCIA = [
    "ATRASO", "FALTA INJUSTIFICADA", "ADVERTÊNCIA", "ATESTADO",
    "EPI ENTREGUE", "FARDAMENTO ENTREGUE", "PROMOÇÃO", "ELOGIO / RECONHECIMENTO",
    "INTEGRAÇÃO REALIZADA"
];

// ===== MENU POR PERFIL =====
const MENUS = {
    "RH": [
        { pagina: "dashboard", rotulo: "🏠 Dashboard" },
        { pagina: "pessoas", rotulo: "👥 Pessoas" },
        { pagina: "recrutamento", rotulo: "📋 Recrutamento" },
        { pagina: "avaliacao", rotulo: "📝 Avaliação Experiência" },
        { pagina: "teste", rotulo: "🧪 Teste Prático" },
        { pagina: "feedback", rotulo: "💬 Feedback" },
        { pagina: "dossie", rotulo: "📁 Dossiê" },
        { pagina: "estoque", rotulo: "🦺 Estoque EPI/Fardas" },
        { pagina: "cargos", rotulo: "⚙️ Cargos & Salários" },
        { pagina: "treinamento", rotulo: "🎓 Universidade Evol" },
        { pagina: "pdi", rotulo: "🎯 PDI" }
    ],
    "SOCIO": [
        { pagina: "recrutamento", rotulo: "📋 Recrutamento" },
        { pagina: "avaliacao", rotulo: "📝 Avaliação Experiência" },
        { pagina: "teste", rotulo: "🧪 Teste Prático" },
        { pagina: "feedback", rotulo: "💬 Feedback" },
        { pagina: "treinamento", rotulo: "👑 Academia de Líderes" },
        { pagina: "dossie", rotulo: "📁 Dossiê" },
        { pagina: "estoque", rotulo: "🦺 Estoque EPI/Fardas" }
    ],
    "LIDER": [
        { pagina: "avaliacao", rotulo: "📝 Avaliação Experiência" },
        { pagina: "teste", rotulo: "🧪 Teste Prático" },
        { pagina: "feedback", rotulo: "💬 Feedback" },
        { pagina: "treinamento", rotulo: "👑 Academia de Líderes" }
    ],
    "COLABORADOR": [
        { pagina: "inicio", rotulo: "🏠 Início" },
        { pagina: "treinamento", rotulo: "🌱 Minha Trilha" }
    ],
    "DIRETORIA": [
        { pagina: "dashboard", rotulo: "🏠 Dashboard" },
        { pagina: "pessoas", rotulo: "👥 Pessoas" },
        { pagina: "recrutamento", rotulo: "📋 Recrutamento" },
        { pagina: "dossie", rotulo: "📁 Dossiê" },
        { pagina: "estoque", rotulo: "🦺 Estoque EPI/Fardas" },
        { pagina: "cargos", rotulo: "⚙️ Cargos & Salários" },
        { pagina: "treinamento", rotulo: "🎓 Universidade Evol" }
    ],
    "DP": [
        { pagina: "dashboard", rotulo: "🏠 Dashboard" },
        { pagina: "pessoas", rotulo: "👥 Pessoas" },
        { pagina: "dossie", rotulo: "📁 Dossiê" }
    ]
};

// Índices das colunas da aba Colaboradores
const COL = {
    id: 0, nome: 1, funcao: 2, fixo: 3, compl: 4, total: 5, unidade: 6,
    teste1: 7, teste2: 8, teste3: 9, valeTransporte: 10, statusAprovacao: 11,
    aso: 12, pastaDoc: 13, horario: 14, folga: 15, statusAdmissao: 16, observacoes: 17,
    dataAdmissao: 18, dataNascimento: 19
};

// ===== ESTADO =====
let USUARIO = null;          // { cpf, senha, nome, perfil, unidade }
let COLABORADORES = [];
let EQUIPE = [];             // colaboradores visíveis pro usuário (líder: só da unidade dele)
let VAGAS = [];
let GRAFICOS = [];

// ===== HELPERS =====
function formatarMoeda(valor) {
    return "R$ " + Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moedaParaNumero(texto) {
    if (!texto) return 0;
    const limpo = String(texto).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(limpo);
    return isNaN(n) ? 0 : n;
}

function lerNumero(id) {
    const v = document.getElementById(id).value;
    return v === "" ? 0 : parseFloat(v);
}

function formatarData(valorInput) {
    if (!valorInput) return "";
    const [ano, mes, dia] = valorInput.split("-");
    return `${dia}/${mes}/${ano}`;
}

function dataParaInput(valorBr) {
    if (!valorBr || !valorBr.includes("/")) return "";
    const [dia, mes, ano] = valorBr.split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function somenteNumeros(texto) {
    return String(texto || "").replace(/\D/g, "");
}

// ===== COMUNICAÇÃO COM O SERVIDOR =====
async function api(acao, extras = {}) {
    const resposta = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            acao: acao,
            cpf: USUARIO ? USUARIO.cpf : "",
            senha: USUARIO ? USUARIO.senha : "",
            ...extras
        })
    });
    const dados = await resposta.json();

    if (dados.erro === "LOGIN_INVALIDO") {
        USUARIO = null;
        telaLogin("CPF ou senha incorretos. Tente novamente.");
        throw new Error("login inválido");
    }

    if (dados.erro === "SEM_PERMISSAO") {
        alert("Seu perfil não tem permissão para esta ação.");
        throw new Error("sem permissão");
    }

    return dados;
}

// ===== LOGIN =====
function telaLogin(mensagem) {
    document.getElementById("menu").innerHTML = "";
    document.getElementById("tituloPagina").textContent = "Acesso Restrito";
    document.getElementById("app").innerHTML = `
        <div class="card login-card">
            <h2>🔒 Evol People</h2>
            <p class="subtitulo">Sistema de Gestão de Pessoas — Grupo Evol</p>
            ${mensagem ? `<p class="erro-login">${mensagem}</p>` : ""}
            <div class="campo">
                <label>CPF</label>
                <input id="cpfLogin" placeholder="Somente números" inputmode="numeric"
                       onkeydown="if(event.key==='Enter') entrar()">
            </div>
            <div class="campo">
                <label>Senha</label>
                <input id="senhaLogin" type="password" placeholder="Sua senha"
                       onkeydown="if(event.key==='Enter') entrar()">
            </div>
            <button class="btn" onclick="entrar()">Entrar</button>
            <p class="aviso-lgpd">🔒 Ao entrar, você concorda com o tratamento dos seus dados pelo Grupo Evol
            exclusivamente para gestão de pessoas, conforme a LGPD (Lei 13.709/2018).
            Dados acessíveis apenas a perfis autorizados.</p>
        </div>
    `;
    setTimeout(() => document.getElementById("cpfLogin").focus(), 100);
}

async function entrar() {
    const cpf = somenteNumeros(document.getElementById("cpfLogin").value);
    const senha = document.getElementById("senhaLogin").value.trim();

    if (!cpf || !senha) {
        alert("Informe CPF e senha.");
        return;
    }

    USUARIO = { cpf: cpf, senha: senha };
    document.getElementById("app").innerHTML = "<p>Verificando...</p>";

    try {
        const resposta = await api("login");
        if (resposta.sucesso) {
            USUARIO.nome = resposta.nome;
            USUARIO.perfil = resposta.perfil;
            USUARIO.unidade = resposta.unidade;

            if (["RH", "LIDER", "SOCIO", "DIRETORIA", "DP"].includes(USUARIO.perfil)) {
                await carregarCargos();
            }

            montarMenu();
            const primeira = MENUS[USUARIO.perfil][0].pagina;
            mostrar(primeira, document.querySelector(".nav-item"));
        }
    } catch (e) { /* login já reexibido pela api() */ }
}

function sair() {
    USUARIO = null;
    telaLogin();
}

function montarMenu() {
    const itens = MENUS[USUARIO.perfil] || [];
    let html = "";
    itens.forEach(i => {
        html += `<button class="nav-item" onclick="mostrar('${i.pagina}', this)">${i.rotulo}</button>`;
    });
    html += `<div class="menu-usuario">
        <span class="menu-nome">👤 ${USUARIO.nome || ""}</span>
        <button class="nav-item nav-sair" onclick="sair()">🚪 Sair</button>
    </div>`;
    document.getElementById("menu").innerHTML = html;
}

function podeVer(pagina) {
    return (MENUS[USUARIO?.perfil] || []).some(i => i.pagina === pagina);
}

// ===== NAVEGAÇÃO =====
function mostrar(pagina, botao) {
    if (!USUARIO || !USUARIO.perfil) { telaLogin(); return; }
    if (!podeVer(pagina)) { alert("Seu perfil não tem acesso a esta área."); return; }

    const app = document.getElementById("app");
    document.getElementById("tituloPagina").textContent = TITULOS[pagina] || "Evol People";

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    if (botao) botao.classList.add("active");

    if (pagina === "inicio") {
        app.innerHTML = `
            <div class="card">
                <h2>Olá, ${USUARIO.nome}! 👋</h2>
                <p>Bem-vindo(a) ao Evol People.</p>
                <p class="subtitulo">Em breve: registro de ponto, trilhas da Universidade Evol e muito mais.</p>
            </div>
        `;
    }

    if (pagina === "dashboard") {
        carregarDashboard();
    }

    if (pagina === "pessoas") {
        app.innerHTML = `
            <div class="toolbar">
                ${["RH", "DP"].includes(USUARIO.perfil) ? `<button class="btn" onclick="abrirFormulario()">+ Novo Colaborador</button>` : ""}
                <input id="filtroBusca" class="filtro-busca" placeholder="🔍 Buscar por nome..." oninput="renderizarLista()">
                <select id="filtroUnidade" onchange="renderizarLista()">
                    <option value="">Todas as unidades</option>
                    ${UNIDADES.map(u => `<option value="${u}">${u}</option>`).join("")}
                </select>
                <select id="filtroStatus" onchange="renderizarLista()">
                    <option value="">Todos os status</option>
                    ${OPCOES.statusAdmissao.map(s => `<option value="${s}">${s}</option>`).join("")}
                </select>
            </div>
            <div id="listaColaboradores"><p>Carregando colaboradores...</p></div>
        `;
        carregarColaboradores();
    }

    if (pagina === "recrutamento") {
        app.innerHTML = `<div id="areaVagas"><p>Carregando vagas...</p></div>`;
        carregarVagas();
    }

    if (pagina === "avaliacao") {
        telaAvaliacao();
    }

    if (pagina === "teste") {
        telaTestePratico();
    }

    if (pagina === "feedback") {
        telaFeedback();
    }

    if (pagina === "dossie") {
        telaDossie();
    }

    if (pagina === "estoque") {
        telaEstoque();
    }

    if (pagina === "cargos") {
        telaCargos();
    }

    if (pagina === "treinamento") {
        telaUniversidade();
    }

    if (pagina === "pdi") {
        app.innerHTML = `<div class="card"><h2>PDI</h2><p>Plano de desenvolvimento individual — em construção.</p></div>`;
    }
}

// ===== RECRUTAMENTO (VAGAS) =====
async function carregarVagas() {
    const area = document.getElementById("areaVagas");

    try {
        const resposta = await api("listarVagas");
        if (!resposta.sucesso) {
            area.innerHTML = `<div class="card"><p>Erro ao carregar vagas: ${resposta.erro || ""}</p></div>`;
            return;
        }

        VAGAS = resposta.vagas || [];
        montarTelaVagas();

    } catch (e) {
        const areaAinda = document.getElementById("areaVagas");
        if (USUARIO && areaAinda) areaAinda.innerHTML = "<p>Erro ao conectar com servidor</p>";
    }
}

function vagaAberta(v) {
    const s = (v.status || "").toUpperCase();
    return s !== "ENCERRADA" && s !== "CANCELADA";
}

function montarTelaVagas() {
    const area = document.getElementById("areaVagas");

    const abertas = VAGAS.filter(vagaAberta).length;
    const encerradas = VAGAS.filter(v => (v.status || "").toUpperCase() === "ENCERRADA").length;
    const canceladas = VAGAS.filter(v => (v.status || "").toUpperCase() === "CANCELADA").length;
    const criticas = VAGAS.filter(v => vagaAberta(v) && (v.slaStatus || "").toUpperCase().includes("CRÍTIC")).length;

    // opções de status e unidades existentes nos dados
    const statusUnicos = [...new Set(VAGAS.map(v => v.status).filter(Boolean))];
    const unidadesUnicas = [...new Set(VAGAS.map(v => v.unidade).filter(Boolean))];

    const filtroUnidadeHtml = USUARIO.perfil === "RH"
        ? `<select id="vFiltroUnidade" onchange="renderizarVagas()">
              <option value="">Todas as unidades</option>
              ${unidadesUnicas.map(u => `<option value="${u}">${u}</option>`).join("")}
           </select>`
        : `<span class="badge badge-azul">Unidade: ${USUARIO.unidade || "-"}</span>`;

    area.innerHTML = `
        <div class="cards-grid">
            <div class="card card-indicador">
                <span class="indicador-numero">${abertas}</span>
                <span class="indicador-rotulo">Vagas em seleção</span>
            </div>
            <div class="card card-indicador ind-vermelho">
                <span class="indicador-numero">${criticas}</span>
                <span class="indicador-rotulo">Abertas com SLA crítico</span>
            </div>
            <div class="card card-indicador ind-verde">
                <span class="indicador-numero">${encerradas}</span>
                <span class="indicador-rotulo">Encerradas</span>
            </div>
            <div class="card card-indicador ind-amarelo">
                <span class="indicador-numero">${canceladas}</span>
                <span class="indicador-rotulo">Canceladas</span>
            </div>
        </div>

        <div class="toolbar">
            ${USUARIO.perfil !== "DIRETORIA" ? `<button class="btn" onclick="telaAbrirVaga()">+ Abrir Vaga</button>` : ""}
            <button class="btn btn-secundario" onclick="telaProcessoSeletivo()">🧪 Candidatos em Teste</button>
            <input id="vFiltroBusca" class="filtro-busca" placeholder="🔍 Buscar vaga ou candidato..." oninput="renderizarVagas()">
            ${filtroUnidadeHtml}
            <select id="vFiltroStatus" onchange="renderizarVagas()">
                <option value="">Todos os status</option>
                ${statusUnicos.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>
        </div>

        <div id="tabelaVagas"></div>
    `;

    renderizarVagas();
}

function renderizarVagas() {
    const alvo = document.getElementById("tabelaVagas");
    if (!alvo) return;

    const busca = (document.getElementById("vFiltroBusca")?.value || "").toUpperCase();
    const fUnidade = document.getElementById("vFiltroUnidade")?.value || "";
    const fStatus = document.getElementById("vFiltroStatus")?.value || "";

    const filtradas = VAGAS.filter(v => {
        const texto = `${v.vaga} ${v.candidato}`.toUpperCase();
        const okBusca = !busca || texto.includes(busca);
        const okUnidade = !fUnidade || v.unidade === fUnidade;
        const okStatus = !fStatus
            || (fStatus === "__ABERTAS__" ? vagaAberta(v) : v.status === fStatus);
        return okBusca && okUnidade && okStatus;
    });

    if (VAGAS.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhuma vaga encontrada${USUARIO.perfil === "SOCIO" ? " para a sua unidade" : ""}.</p></div>`;
        return;
    }

    if (filtradas.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhuma vaga com esses filtros.</p></div>`;
        return;
    }

    let html = `
        <div class="card tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Vaga</th>
                        <th>Unidade</th>
                        <th>Setor</th>
                        <th>Gestor</th>
                        <th>Abertura</th>
                        <th>Dias em aberto</th>
                        <th>Candidato</th>
                        <th>Status</th>
                        <th>SLA</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filtradas.forEach(v => {
        html += `
            <tr>
                <td>${v.id}</td>
                <td><strong>${v.vaga}</strong></td>
                <td>${v.unidade}</td>
                <td>${v.setor}</td>
                <td>${v.gestor}</td>
                <td>${v.dataAbertura}</td>
                <td>${v.diasAberto}</td>
                <td>${v.candidato}</td>
                <td><span class="badge badge-${badgeStatusVaga(v.status)}">${v.status || "-"}</span></td>
                <td><span class="badge badge-${badgeSla(v.slaStatus)}">${v.slaStatus || "-"}</span></td>
            </tr>
        `;
    });

    html += `</tbody></table></div>
        <p class="contagem">${filtradas.length} vaga(s) exibida(s) de ${VAGAS.length} no total</p>`;
    alvo.innerHTML = html;
}

function badgeStatusVaga(status) {
    const s = (status || "").toUpperCase();
    if (s === "ENCERRADA") return "verde";
    if (s === "CANCELADA") return "vermelho";
    return "azul"; // em aberto / em andamento
}

function badgeSla(sla) {
    const s = (sla || "").toUpperCase();
    if (s.includes("CRÍTIC") || s.includes("CRITIC")) return "vermelho";
    if (s.includes("ATEN")) return "amarelo";
    return "verde";
}

// ===== DASHBOARD (RH) =====
async function carregarDashboard() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando indicadores...</p>";

    try {
        const dados = await api("listarColaboradores");
        if (!dados.sucesso) { app.innerHTML = "<p>Erro ao carregar</p>"; return; }

        COLABORADORES = dados.dados.slice(1);

        const total = COLABORADORES.length;
        const contar = (status) => COLABORADORES.filter(l => l[COL.statusAdmissao] === status).length;
        const emProcesso = contar("EM PROCESSO");
        const admitidos = contar("ADMITIDO");
        const cancelados = contar("CANCELADO");

        const porUnidade = {};
        UNIDADES.forEach(u => porUnidade[u] = 0);
        COLABORADORES.forEach(l => {
            const u = l[COL.unidade];
            if (u in porUnidade) porUnidade[u]++;
        });

        app.innerHTML = `
            <div class="cards-grid">
                <div class="card card-indicador">
                    <span class="indicador-numero">${total}</span>
                    <span class="indicador-rotulo">Colaboradores cadastrados</span>
                </div>
                <div class="card card-indicador ind-amarelo">
                    <span class="indicador-numero">${emProcesso}</span>
                    <span class="indicador-rotulo">Em processo de admissão</span>
                </div>
                <div class="card card-indicador ind-verde">
                    <span class="indicador-numero">${admitidos}</span>
                    <span class="indicador-rotulo">Admitidos</span>
                </div>
                <div class="card card-indicador ind-vermelho">
                    <span class="indicador-numero">${cancelados}</span>
                    <span class="indicador-rotulo">Cancelados</span>
                </div>
            </div>

            <div class="graficos-grid">
                <div class="card">
                    <h3>Colaboradores por unidade</h3>
                    <canvas id="graficoUnidades"></canvas>
                </div>
                <div class="card">
                    <h3>Status de admissão</h3>
                    <canvas id="graficoStatus"></canvas>
                </div>
            </div>
        `;

        GRAFICOS.forEach(g => g.destroy());
        GRAFICOS = [];

        if (total > 0) {
            GRAFICOS.push(new Chart(document.getElementById("graficoUnidades"), {
                type: "bar",
                data: {
                    labels: Object.keys(porUnidade),
                    datasets: [{
                        label: "Colaboradores",
                        data: Object.values(porUnidade),
                        backgroundColor: "#163A70",
                        borderRadius: 6
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            }));

            GRAFICOS.push(new Chart(document.getElementById("graficoStatus"), {
                type: "doughnut",
                data: {
                    labels: ["Em processo", "Admitidos", "Cancelados"],
                    datasets: [{
                        data: [emProcesso, admitidos, cancelados],
                        backgroundColor: ["#F59E0B", "#16A34A", "#DC2626"]
                    }]
                },
                options: { plugins: { legend: { position: "bottom" } } }
            }));
        }

    } catch (e) {
        if (USUARIO) app.innerHTML = "<p>Erro ao conectar com servidor</p>";
    }
}

// ===== LISTAGEM DE COLABORADORES (RH) =====
async function carregarColaboradores() {
    const lista = document.getElementById("listaColaboradores");
    lista.innerHTML = "<p>Carregando...</p>";

    try {
        const dados = await api("listarColaboradores");
        if (!dados.sucesso) { lista.innerHTML = "<p>Erro ao carregar</p>"; return; }

        COLABORADORES = dados.dados.slice(1);
        renderizarLista();

    } catch (e) {
        if (USUARIO) lista.innerHTML = "<p>Erro ao conectar com servidor</p>";
    }
}

function renderizarLista() {
    const lista = document.getElementById("listaColaboradores");
    if (!lista) return;

    const busca = (document.getElementById("filtroBusca")?.value || "").toUpperCase();
    const fUnidade = document.getElementById("filtroUnidade")?.value || "";
    const fStatus = document.getElementById("filtroStatus")?.value || "";

    const filtrados = COLABORADORES.filter(l => {
        const okBusca = !busca || String(l[COL.nome]).toUpperCase().includes(busca);
        const okUnidade = !fUnidade || l[COL.unidade] === fUnidade;
        const okStatus = !fStatus || l[COL.statusAdmissao] === fStatus;
        return okBusca && okUnidade && okStatus;
    });

    if (COLABORADORES.length === 0) {
        lista.innerHTML = `<div class="card"><p>Nenhum colaborador cadastrado ainda. Clique em <strong>+ Novo Colaborador</strong> para começar.</p></div>`;
        return;
    }

    if (filtrados.length === 0) {
        lista.innerHTML = `<div class="card"><p>Nenhum colaborador encontrado com esses filtros.</p></div>`;
        return;
    }

    let html = `
        <div class="card tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome Completo</th>
                        <th>Função</th>
                        <th>Unidade</th>
                        <th>Remuneração</th>
                        <th>Status Admissão</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filtrados.forEach(l => {
        html += `
            <tr>
                <td>${l[COL.id]}</td>
                <td><strong>${l[COL.nome]}</strong></td>
                <td>${l[COL.funcao]}</td>
                <td>${l[COL.unidade]}</td>
                <td>${l[COL.total]}</td>
                <td><span class="badge badge-${classeStatus(l[COL.statusAdmissao])}">${l[COL.statusAdmissao] || "-"}</span></td>
                <td class="acoes">${podeEditarPessoas()
                    ? `<button class="btn-acao" title="Editar" onclick="abrirFormulario(${l[COL.id]})">✏️</button>
                       <button class="btn-acao" title="Excluir" onclick="confirmarExclusao(${l[COL.id]})">🗑️</button>`
                    : "—"}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>
        <p class="contagem">${filtrados.length} colaborador(es) exibido(s) de ${COLABORADORES.length} no total</p>`;
    lista.innerHTML = html;
}

function classeStatus(status) {
    if (status === "ADMITIDO") return "verde";
    if (status === "CANCELADO") return "vermelho";
    return "amarelo";
}

// ===== EXCLUIR =====
async function confirmarExclusao(id) {
    const registro = COLABORADORES.find(l => String(l[COL.id]) === String(id));
    const nome = registro ? registro[COL.nome] : "este colaborador";

    if (!confirm(`Tem certeza que deseja EXCLUIR "${nome}"?\n\nEssa ação não pode ser desfeita.`)) return;

    try {
        const resposta = await api("excluirColaborador", { id: id });
        if (resposta.sucesso) {
            carregarColaboradores();
        } else {
            alert("Não foi possível excluir: " + (resposta.erro || "erro desconhecido"));
        }
    } catch (e) { }
}

// ===== FORMULÁRIO (novo OU edição) =====
function ehRioMarSelecionado() {
    return document.getElementById("unidade").value === UNIDADE_VARIAVEL;
}

function tabelaAtual() {
    return ehRioMarSelecionado() ? FUNCOES_RIOMAR : FUNCOES;
}

function gerarSelect(id, opcoes, placeholder) {
    let html = `<select id="${id}"><option value="">${placeholder}</option>`;
    opcoes.forEach(o => { html += `<option value="${o}">${o}</option>`; });
    html += `</select>`;
    return html;
}

function abrirFormulario(idEdicao) {
    const app = document.getElementById("app");
    const editando = idEdicao !== undefined;
    const registro = editando ? COLABORADORES.find(l => String(l[COL.id]) === String(idEdicao)) : null;

    app.innerHTML = `
        <div class="card formulario">
            <h2>${editando ? "Editar Colaborador #" + idEdicao : "Novo Colaborador"}</h2>
            <p class="subtitulo">Controle de Admissões — Grupo Evol</p>

            <div class="grid-form">

                <div class="campo campo-cheio">
                    <label>Nome Completo *</label>
                    <input id="nome" placeholder="Nome completo do colaborador">
                </div>

                <div class="campo">
                    <label>Unidade (Operação) *</label>
                    ${gerarSelect("unidade", UNIDADES, "Selecione a unidade")}
                </div>

                <div class="campo">
                    <label>Função *</label>
                    <select id="funcao" disabled>
                        <option value="">Escolha a unidade primeiro</option>
                    </select>
                </div>

                <div class="campo">
                    <label>Horário</label>
                    <input id="horario" placeholder="Ex.: 08H ÀS 16H">
                </div>

                <div class="campo">
                    <label id="rotuloFixo">Salário Fixo (automático)</label>
                    <input id="salarioFixo" type="number" step="0.01" min="0" placeholder="0,00">
                </div>

                <div class="campo" id="campoCompl">
                    <label id="rotuloCompl">Complemento (automático)</label>
                    <input id="salarioCompl" type="number" step="0.01" min="0" placeholder="0,00">
                </div>

                <div class="campo">
                    <label id="rotuloTotal">Salário Total</label>
                    <input id="salarioTotal" readonly class="campo-total" placeholder="R$ 0,00">
                </div>

                <div class="campo">
                    <label>Data de Admissão</label>
                    <input id="dataAdmissao" type="date">
                </div>

                <div class="campo">
                    <label>Data de Nascimento 🎂</label>
                    <input id="dataNascimento" type="date">
                </div>

                <div class="campo">
                    <label>1º Dia de Teste</label>
                    <input id="teste1" type="date">
                </div>

                <div class="campo">
                    <label>2º Dia de Teste</label>
                    <input id="teste2" type="date">
                </div>

                <div class="campo">
                    <label>3º Dia de Teste</label>
                    <input id="teste3" type="date">
                </div>

                <div class="campo">
                    <label>Vale Transporte (Teste)</label>
                    ${gerarSelect("valeTransporte", OPCOES.valeTransporte, "Selecione")}
                </div>

                <div class="campo">
                    <label>Status de Aprovação</label>
                    ${gerarSelect("statusAprovacao", OPCOES.statusAprovacao, "Selecione")}
                </div>

                <div class="campo">
                    <label>ASO</label>
                    ${gerarSelect("aso", OPCOES.aso, "Selecione")}
                </div>

                <div class="campo">
                    <label>Pasta de Documentação</label>
                    ${gerarSelect("pastaDoc", OPCOES.pastaDocumentacao, "Selecione")}
                </div>

                <div class="campo">
                    <label>Folga</label>
                    ${gerarSelect("folga", OPCOES.folga, "Selecione o dia")}
                </div>

                <div class="campo">
                    <label>Status de Admissão *</label>
                    ${gerarSelect("statusAdmissao", OPCOES.statusAdmissao, "Selecione")}
                </div>

                <div class="campo campo-cheio">
                    <label>Observações</label>
                    <textarea id="observacoes" rows="3" placeholder="Anotações sobre o processo de admissão"></textarea>
                </div>

            </div>

            <button class="btn" onclick="salvarColaborador(${editando ? idEdicao : ""})">
                ${editando ? "Salvar Alterações" : "Salvar Colaborador"}
            </button>
            <button class="btn btn-secundario" onclick="mostrar('pessoas', document.querySelectorAll('.nav-item')[1])">Cancelar</button>
        </div>
    `;

    document.getElementById("unidade").addEventListener("change", function () {
        atualizarListaFuncoes();
        atualizarRotulos();
        limparSalarios();
    });

    document.getElementById("funcao").addEventListener("change", function () {
        const f = tabelaAtual()[this.value];
        if (f) {
            document.getElementById("salarioFixo").value = f.fixo.toFixed(2);
            document.getElementById("salarioCompl").value = f.compl.toFixed(2);
        }
        atualizarTotal();
    });

    document.getElementById("salarioFixo").addEventListener("input", atualizarTotal);
    document.getElementById("salarioCompl").addEventListener("input", atualizarTotal);

    if (registro) {
        document.getElementById("nome").value = registro[COL.nome] || "";
        document.getElementById("unidade").value = registro[COL.unidade] || "";

        atualizarListaFuncoes();
        atualizarRotulos();

        const selectFuncao = document.getElementById("funcao");
        const funcaoSalva = registro[COL.funcao] || "";
        if (funcaoSalva && !Object.keys(tabelaAtual()).includes(funcaoSalva)) {
            selectFuncao.innerHTML += `<option value="${funcaoSalva}">${funcaoSalva}</option>`;
        }
        selectFuncao.value = funcaoSalva;

        document.getElementById("salarioFixo").value = moedaParaNumero(registro[COL.fixo]).toFixed(2);
        document.getElementById("salarioCompl").value = moedaParaNumero(registro[COL.compl]).toFixed(2);
        atualizarTotal();

        document.getElementById("horario").value = registro[COL.horario] || "";
        document.getElementById("dataAdmissao").value = dataParaInput(registro[COL.dataAdmissao]);
        document.getElementById("dataNascimento").value = dataParaInput(registro[COL.dataNascimento]);
        document.getElementById("teste1").value = dataParaInput(registro[COL.teste1]);
        document.getElementById("teste2").value = dataParaInput(registro[COL.teste2]);
        document.getElementById("teste3").value = dataParaInput(registro[COL.teste3]);
        document.getElementById("valeTransporte").value = registro[COL.valeTransporte] || "";
        document.getElementById("statusAprovacao").value = registro[COL.statusAprovacao] || "";
        document.getElementById("aso").value = registro[COL.aso] || "";
        document.getElementById("pastaDoc").value = registro[COL.pastaDoc] || "";
        document.getElementById("folga").value = registro[COL.folga] || "";
        document.getElementById("statusAdmissao").value = registro[COL.statusAdmissao] || "";
        document.getElementById("observacoes").value = registro[COL.observacoes] || "";
    }
}

function atualizarListaFuncoes() {
    const select = document.getElementById("funcao");
    const unidade = document.getElementById("unidade").value;

    if (!unidade) {
        select.disabled = true;
        select.innerHTML = `<option value="">Escolha a unidade primeiro</option>`;
        return;
    }

    select.disabled = false;
    let html = `<option value="">Selecione a função</option>`;
    Object.keys(tabelaAtual()).forEach(f => { html += `<option value="${f}">${f}</option>`; });
    select.innerHTML = html;
}

function atualizarRotulos() {
    const r = ehRioMarSelecionado() ? ROTULOS.variavel : ROTULOS.padrao;
    document.getElementById("rotuloFixo").textContent = r.fixo;
    document.getElementById("rotuloCompl").textContent = r.compl;
    document.getElementById("rotuloTotal").textContent = r.total;
    document.getElementById("campoCompl").classList.toggle("campo-variavel", ehRioMarSelecionado());
}

function limparSalarios() {
    document.getElementById("salarioFixo").value = "";
    document.getElementById("salarioCompl").value = "";
    document.getElementById("salarioTotal").value = "";
}

function atualizarTotal() {
    const total = lerNumero("salarioFixo") + lerNumero("salarioCompl");
    const prefixo = ehRioMarSelecionado() ? "até " : "";
    document.getElementById("salarioTotal").value = prefixo + formatarMoeda(total);
}

// ===== SALVAR (novo ou edição) =====
async function salvarColaborador(idEdicao) {
    const nome = document.getElementById("nome").value.trim();
    const unidade = document.getElementById("unidade").value;
    const funcao = document.getElementById("funcao").value;
    const statusAdmissao = document.getElementById("statusAdmissao").value;

    if (!nome || !unidade || !funcao || !statusAdmissao) {
        alert("Preencha os campos obrigatórios (*): Nome, Unidade, Função e Status de Admissão.");
        return;
    }

    const fixo = lerNumero("salarioFixo");
    const compl = lerNumero("salarioCompl");
    const rioMar = unidade === UNIDADE_VARIAVEL;
    const editando = idEdicao !== undefined && idEdicao !== "";

    const dados = {
        nome: nome,
        funcao: funcao,
        salarioFixo: formatarMoeda(fixo),
        salarioCompl: formatarMoeda(compl) + (rioMar ? " (variável)" : ""),
        salarioTotal: (rioMar ? "até " : "") + formatarMoeda(fixo + compl),
        unidade: unidade,
        teste1: formatarData(document.getElementById("teste1").value),
        teste2: formatarData(document.getElementById("teste2").value),
        teste3: formatarData(document.getElementById("teste3").value),
        valeTransporte: document.getElementById("valeTransporte").value,
        statusAprovacao: document.getElementById("statusAprovacao").value,
        aso: document.getElementById("aso").value,
        pastaDoc: document.getElementById("pastaDoc").value,
        horario: document.getElementById("horario").value.trim(),
        folga: document.getElementById("folga").value,
        statusAdmissao: statusAdmissao,
        observacoes: document.getElementById("observacoes").value.trim(),
        dataAdmissao: formatarData(document.getElementById("dataAdmissao").value),
        dataNascimento: formatarData(document.getElementById("dataNascimento").value)
    };

    try {
        let resposta;
        if (editando) {
            resposta = await api("atualizarColaborador", { id: idEdicao, ...dados });
        } else {
            resposta = await api("salvarColaborador", dados);
        }

        if (resposta.sucesso) {
            alert(editando ? "Alterações salvas com sucesso!" : "Colaborador salvo com sucesso!");
            mostrar("pessoas", document.querySelectorAll(".nav-item")[1]);
        } else {
            alert("Erro ao salvar: " + (resposta.erro || "erro desconhecido"));
        }
    } catch (e) { }
}

// ===================================================================
// ===== MÓDULOS v7: AVALIAÇÃO, TESTE PRÁTICO, FEEDBACK E DOSSIÊ =====
// ===================================================================

// ===== EQUIPE (colaboradores visíveis pro usuário logado) =====
async function carregarEquipe() {
    const resposta = await api("listarEquipe");
    EQUIPE = resposta.sucesso ? (resposta.equipe || []) : [];
    return EQUIPE;
}

function selectColaboradores(id) {
    let html = `<select id="${id}"><option value="">Selecione o colaborador</option>`;
    EQUIPE.forEach(c => {
        html += `<option value="${c.id}">${c.nome} — ${c.funcao} (${c.unidade})</option>`;
    });
    html += `</select>`;
    return html;
}

function colaboradorPorId(id) {
    return EQUIPE.find(c => String(c.id) === String(id));
}

function gerarRadios(nomeGrupo, opcoes) {
    let html = `<div class="radio-grid">`;
    opcoes.forEach((o, i) => {
        html += `
            <label class="radio-card">
                <input type="radio" name="${nomeGrupo}" value="${o.valor}">
                <span><strong>${o.valor}</strong><small>${o.desc}</small></span>
            </label>
        `;
    });
    html += `</div>`;
    return html;
}

function valorRadio(nomeGrupo) {
    const marcado = document.querySelector(`input[name="${nomeGrupo}"]:checked`);
    return marcado ? marcado.value : "";
}

function selectNiveis(id) {
    return gerarSelect(id, NIVEIS, "Selecione...");
}

// ===================================================================
// ===== TESTE PRÁTICO (candidatos) ==================================
// ===================================================================
function telaTestePratico() {
    const app = document.getElementById("app");
    const unidadeLider = ["LIDER", "SOCIO"].includes(USUARIO.perfil) ? USUARIO.unidade : "";

    let criteriosHtml = "";
    CRITERIOS_TESTE.forEach(c => {
        criteriosHtml += `
            <label class="check-card">
                <input type="checkbox" id="${c.id}">
                <span><strong>${c.nome}</strong><small>${c.desc}</small></span>
            </label>
        `;
    });

    app.innerHTML = `
        <div class="card formulario">
            <h2>🧪 Teste Prático</h2>
            <p class="subtitulo">Registro de resultado — Dados do candidato</p>

            <div class="grid-form">
                <div class="campo">
                    <label>Unidade *</label>
                    ${["LIDER", "SOCIO"].includes(USUARIO.perfil)
                        ? `<input id="tUnidade" value="${unidadeLider}" readonly class="campo-total">`
                        : gerarSelect("tUnidade", UNIDADES, "Selecione a unidade...")}
                </div>

                <div class="campo">
                    <label>Nome do candidato *</label>
                    <input id="tCandidato" placeholder="Nome completo">
                </div>

                <div class="campo">
                    <label>Vaga pretendida *</label>
                    <select id="tVaga"><option value="">Escolha a unidade primeiro</option></select>
                    <small id="tVagaSalario" class="nota-salario"></small>
                </div>

                <div class="campo">
                    <label>Setor</label>
                    ${gerarSelect("tSetor", ["SALÃO", "COZINHA", "BAR", "PARRILLA", "BURGER&PONTO", "ADMINISTRATIVO", "DELIVERY", "ALMOXARIFADO", "OUTRO"], "Selecione...")}
                </div>

                <div class="campo">
                    <label>Data do teste *</label>
                    <input id="tData" type="date">
                </div>

                <div class="campo">
                    <label>Etapa do processo seletivo</label>
                    ${gerarSelect("tEtapa", ETAPAS_PROCESSO, "Selecione...")}
                </div>

                <div class="campo">
                    <label>Escala *</label>
                    ${gerarSelect("tEscala", ESCALAS, "Selecione a escala...")}
                </div>

                <div class="campo">
                    <label>Dia de folga *</label>
                    ${gerarSelect("tFolga", OPCOES.folga, "Selecione o dia...")}
                </div>

                <div class="campo">
                    <label>Avaliador responsável *</label>
                    ${gerarSelect("tAvaliador", RESPONSAVEIS_TESTE, "Selecione o responsável...")}
                </div>
            </div>

            <h3 class="secao-form">Critérios avaliados</h3>
            <p class="subtitulo">Marque os critérios em que o candidato foi aprovado</p>
            <div class="check-grid">${criteriosHtml}</div>

            <div class="grid-form" style="margin-top:16px">
                <div class="campo">
                    <label>Nota final (0–10)</label>
                    <input id="tNota" type="number" min="0" max="10" step="0.1" placeholder="0.0">
                </div>
                <div class="campo">
                    <label>Nota mínima</label>
                    <input id="tNotaMinima" type="number" min="0" max="10" step="0.1" placeholder="0.0">
                </div>
                <div class="campo">
                    <label>Satisfação do avaliador (1 a 5)</label>
                    ${gerarSelect("tSatisfacao", ["1 — Muito insatisfeito", "2 — Insatisfeito", "3 — Neutro", "4 — Satisfeito", "5 — Muito satisfeito"], "Selecione...")}
                </div>
            </div>

            <h3 class="secao-form">Parecer do avaliador</h3>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos fortes do candidato</label>
                <textarea id="tPontosFortes" rows="3"></textarea>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos de atenção</label>
                <textarea id="tPontosAtencao" rows="3"></textarea>
            </div>

            <label class="rotulo-grupo">Recomendação final *</label>
            ${gerarRadios("tRecomendacao", RECOMENDACOES_TESTE)}

            <br>
            <button class="btn" onclick="salvarTeste()">Registrar resultado do teste</button>
        </div>
    `;

    // ===== vagas do teste vêm da tabela de cargos, conforme a unidade =====
    const atualizarVagasTeste = () => {
        const unidade = document.getElementById("tUnidade").value;
        const select = document.getElementById("tVaga");
        if (!unidade) {
            select.innerHTML = `<option value="">Escolha a unidade primeiro</option>`;
            return;
        }
        let html = `<option value="">Selecione o cargo da vaga</option>`;
        Object.keys(mapaPorUnidade(unidade)).forEach(c => { html += `<option value="${c}">${c}</option>`; });
        select.innerHTML = html;
        document.getElementById("tVagaSalario").textContent = "";
    };

    const campoUnidadeTeste = document.getElementById("tUnidade");
    if (campoUnidadeTeste.tagName === "SELECT") {
        campoUnidadeTeste.addEventListener("change", atualizarVagasTeste);
    }
    document.getElementById("tVaga").addEventListener("change", function () {
        document.getElementById("tVagaSalario").textContent = textoSalario(document.getElementById("tUnidade").value, this.value);
    });

    atualizarVagasTeste();
}

async function salvarTeste() {
    const unidade = ["LIDER", "SOCIO"].includes(USUARIO.perfil) ? USUARIO.unidade : document.getElementById("tUnidade").value;
    const candidato = document.getElementById("tCandidato").value.trim();
    const vaga = document.getElementById("tVaga").value.trim();
    const dataTeste = document.getElementById("tData").value;
    const escala = document.getElementById("tEscala").value;
    const folga = document.getElementById("tFolga").value;
    const avaliador = document.getElementById("tAvaliador").value.trim();
    const recomendacao = valorRadio("tRecomendacao");

    if (!unidade || !candidato || !vaga || !dataTeste || !escala || !folga || !avaliador || !recomendacao) {
        alert("Preencha os campos obrigatórios (*): Unidade, Candidato, Vaga, Data, Escala, Folga, Avaliador e Recomendação.");
        return;
    }

    const criteriosAprovados = CRITERIOS_TESTE
        .filter(c => document.getElementById(c.id).checked)
        .map(c => c.nome)
        .join("; ");

    const dados = {
        unidade: unidade,
        candidato: candidato,
        vaga: vaga,
        setor: document.getElementById("tSetor").value,
        dataTeste: formatarData(dataTeste),
        etapa: document.getElementById("tEtapa").value,
        escala: escala,
        folga: folga,
        avaliador: avaliador,
        criterios: criteriosAprovados,
        nota: document.getElementById("tNota").value,
        notaMinima: document.getElementById("tNotaMinima").value,
        satisfacao: document.getElementById("tSatisfacao").value,
        pontosFortes: document.getElementById("tPontosFortes").value.trim(),
        pontosAtencao: document.getElementById("tPontosAtencao").value.trim(),
        recomendacao: recomendacao
    };

    try {
        const resposta = await api("salvarTeste", dados);
        if (resposta.sucesso) {
            alert("Resultado do teste registrado com sucesso!");
            telaTestePratico();
        } else {
            alert("Erro ao registrar: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== AVALIAÇÃO DE PERÍODO DE EXPERIÊNCIA =========================
// ===================================================================
async function telaAvaliacao() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando colaboradores...</p>";

    try {
        await carregarEquipe();
    } catch (e) { return; }

    let valoresHtml = "";
    VALORES_EVOL.forEach(v => {
        valoresHtml += `
            <div class="campo">
                <label>${v.nome} *</label>
                ${selectNiveis(v.id)}
            </div>
        `;
    });

    let posturaHtml = "";
    POSTURA_DISCIPLINA.forEach(v => {
        posturaHtml += `
            <div class="campo">
                <label>${v.nome} *</label>
                ${selectNiveis(v.id)}
            </div>
        `;
    });

    app.innerHTML = `
        <div class="card formulario">
            <h2>📝 Avaliação de Período de Experiência</h2>
            <p class="subtitulo">Identificação e etapa da avaliação</p>

            <div class="grid-form">
                <div class="campo campo-cheio">
                    <label>Colaborador *</label>
                    ${selectColaboradores("aColaborador")}
                </div>

                <div class="campo">
                    <label>Nome do gestor *</label>
                    <input id="aGestor" value="${USUARIO.nome || ""}" placeholder="Quem está avaliando">
                </div>

                <div class="campo">
                    <label>Data de admissão</label>
                    <input id="aAdmissao" type="date">
                </div>

                <div class="campo">
                    <label>Data desta avaliação *</label>
                    <input id="aData" type="date">
                </div>
            </div>

            <label class="rotulo-grupo">Etapa da avaliação *</label>
            ${gerarRadios("aEtapa", [
                { valor: "1ª AVALIAÇÃO — 45 DIAS", desc: "Primeira metade do período de experiência" },
                { valor: "2ª AVALIAÇÃO — 90 DIAS", desc: "Segunda metade (total de 90 dias)" }
            ])}

            <h3 class="secao-form">Nossos valores</h3>
            <p class="subtitulo">Avalie a conduta do colaborador em cada valor do Grupo Evol</p>
            <div class="grid-form">${valoresHtml}</div>

            <h3 class="secao-form">Postura e disciplina</h3>
            <p class="subtitulo">Comportamento no dia a dia</p>
            <div class="grid-form">${posturaHtml}</div>

            <h3 class="secao-form">Parecer e resultado</h3>
            <p class="subtitulo">Conclusão desta etapa da avaliação</p>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos fortes observados</label>
                <textarea id="aPontosFortes" rows="3"></textarea>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos de atenção / desenvolvimento</label>
                <textarea id="aPontosAtencao" rows="3"></textarea>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Plano de ação (se houver prorrogação)</label>
                <textarea id="aPlanoAcao" rows="3" placeholder="O que precisa melhorar até a próxima avaliação"></textarea>
            </div>

            <label class="rotulo-grupo">Resultado desta avaliação *</label>
            ${gerarRadios("aResultado", RESULTADOS_AVALIACAO)}

            <br>
            <button class="btn" onclick="salvarAvaliacao()">Registrar avaliação</button>
        </div>
    `;

    // preenche a data de admissão automaticamente ao escolher o colaborador
    document.getElementById("aColaborador").addEventListener("change", function () {
        const c = colaboradorPorId(this.value);
        if (c && c.dataAdmissao) {
            document.getElementById("aAdmissao").value = dataParaInput(c.dataAdmissao);
        }
    });
}

async function salvarAvaliacao() {
    const idColab = document.getElementById("aColaborador").value;
    const gestor = document.getElementById("aGestor").value.trim();
    const dataAvaliacao = document.getElementById("aData").value;
    const etapa = valorRadio("aEtapa");
    const resultado = valorRadio("aResultado");

    if (!idColab || !gestor || !dataAvaliacao || !etapa || !resultado) {
        alert("Preencha os campos obrigatórios (*): Colaborador, Gestor, Data, Etapa e Resultado.");
        return;
    }

    // todos os selects de nível são obrigatórios
    for (const v of [...VALORES_EVOL, ...POSTURA_DISCIPLINA]) {
        if (!document.getElementById(v.id).value) {
            alert(`Avalie o item: ${v.nome}`);
            return;
        }
    }

    const c = colaboradorPorId(idColab);

    const dados = {
        colaboradorId: idColab,
        colaborador: c ? c.nome : "",
        unidade: c ? c.unidade : "",
        gestor: gestor,
        dataAdmissao: formatarData(document.getElementById("aAdmissao").value),
        dataAvaliacao: formatarData(dataAvaliacao),
        etapa: etapa,
        produtividade: document.getElementById("avProdutividade").value,
        trabalhoEquipe: document.getElementById("avEquipe").value,
        sensoDono: document.getElementById("avSensoDono").value,
        inovacao: document.getElementById("avInovacao").value,
        fazerDiferenca: document.getElementById("avDiferenca").value,
        pontualidade: document.getElementById("avPontualidade").value,
        uniforme: document.getElementById("avUniforme").value,
        comportamento: document.getElementById("avComportamento").value,
        pontosFortes: document.getElementById("aPontosFortes").value.trim(),
        pontosAtencao: document.getElementById("aPontosAtencao").value.trim(),
        planoAcao: document.getElementById("aPlanoAcao").value.trim(),
        resultado: resultado
    };

    try {
        const resposta = await api("salvarAvaliacao", dados);
        if (resposta.sucesso) {
            alert("Avaliação registrada com sucesso!");
            telaAvaliacao();
        } else {
            alert("Erro ao registrar: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== FEEDBACK ====================================================
// ===================================================================
async function telaFeedback() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando colaboradores...</p>";

    try {
        await carregarEquipe();
    } catch (e) { return; }

    app.innerHTML = `
        <div class="card formulario">
            <h2>💬 Registro de Feedback</h2>
            <p class="subtitulo">Feedback estruturado para o colaborador</p>

            <div class="grid-form">
                <div class="campo campo-cheio">
                    <label>Colaborador *</label>
                    ${selectColaboradores("fColaborador")}
                </div>

                <div class="campo">
                    <label>Tipo de feedback *</label>
                    ${gerarSelect("fTipo", TIPOS_FEEDBACK, "Selecione...")}
                </div>

                <div class="campo">
                    <label>Data do feedback *</label>
                    <input id="fData" type="date">
                </div>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos fortes / reconhecimentos</label>
                <textarea id="fPontosFortes" rows="3" placeholder="O que o colaborador está fazendo bem"></textarea>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Pontos de melhoria</label>
                <textarea id="fPontosMelhoria" rows="3" placeholder="O que precisa desenvolver"></textarea>
            </div>

            <div class="campo" style="margin-bottom:14px">
                <label>Acordos e próximos passos</label>
                <textarea id="fAcordos" rows="3" placeholder="O que foi combinado entre líder e colaborador"></textarea>
            </div>

            <button class="btn" onclick="salvarFeedback()">Registrar feedback</button>
        </div>
    `;
}

async function salvarFeedback() {
    const idColab = document.getElementById("fColaborador").value;
    const tipo = document.getElementById("fTipo").value;
    const data = document.getElementById("fData").value;

    if (!idColab || !tipo || !data) {
        alert("Preencha os campos obrigatórios (*): Colaborador, Tipo e Data.");
        return;
    }

    const c = colaboradorPorId(idColab);

    const dados = {
        colaboradorId: idColab,
        colaborador: c ? c.nome : "",
        unidade: c ? c.unidade : "",
        tipo: tipo,
        dataFeedback: formatarData(data),
        pontosFortes: document.getElementById("fPontosFortes").value.trim(),
        pontosMelhoria: document.getElementById("fPontosMelhoria").value.trim(),
        acordos: document.getElementById("fAcordos").value.trim()
    };

    try {
        const resposta = await api("salvarFeedback", dados);
        if (resposta.sucesso) {
            alert("Feedback registrado com sucesso!");
            telaFeedback();
        } else {
            alert("Erro ao registrar: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== DOSSIÊ DO COLABORADOR (RH) ==================================
// ===================================================================
async function telaDossie() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando colaboradores...</p>";

    try {
        await carregarEquipe();
    } catch (e) { return; }

    app.innerHTML = `
        <div class="card">
            <h2>📁 Dossiê do Colaborador</h2>
            <p class="subtitulo">Histórico completo: ocorrências, avaliações, feedbacks e treinamentos</p>
            <div class="toolbar" style="margin-bottom:0">
                ${selectColaboradores("dColaborador")}
                <button class="btn" onclick="abrirDossie()">Abrir dossiê</button>
            </div>
        </div>
        <div id="areaDossie"></div>
    `;
}

async function abrirDossie() {
    const id = document.getElementById("dColaborador").value;
    if (!id) { alert("Selecione um colaborador."); return; }

    const area = document.getElementById("areaDossie");
    area.innerHTML = "<p>Montando dossiê...</p>";

    try {
        const resposta = await api("dossie", { id: id });
        if (!resposta.sucesso) {
            area.innerHTML = `<div class="card"><p>Erro: ${resposta.erro || ""}</p></div>`;
            return;
        }

        renderizarDossie(resposta);

    } catch (e) {
        if (USUARIO) area.innerHTML = "<p>Erro ao conectar com servidor</p>";
    }
}

function contarTipo(ocorrencias, tipo) {
    return ocorrencias.filter(o => (o.tipo || "").toUpperCase() === tipo).length;
}

function linhaVazia(mensagem) {
    return `<p class="subtitulo" style="margin:0">${mensagem}</p>`;
}

function renderizarDossie(d) {
    const area = document.getElementById("areaDossie");
    const c = d.colaborador;
    const oc = d.ocorrencias || [];
    const fb = d.feedbacks || [];
    const av = d.avaliacoes || [];
    const tr = d.treinamentos || [];
    const tv = d.trilhas || [];

    const trilhaConcluidos = tv.filter(t => t.acao === "CONCLUIU");
    const trilhaHoras = trilhaConcluidos.reduce((s, t) => s + (parseFloat(String(t.horas).replace(",", ".")) || 0), 0);
    const trilhaDownloads = tv.filter(t => t.acao === "BAIXOU").length;

    // ===== frequência de treinamentos =====
    const presencas = tr.filter(t => (t.presenca || "").toUpperCase() === "PRESENTE").length;
    const frequencia = tr.length > 0 ? Math.round((presencas / tr.length) * 100) : null;
    const horas = tr.reduce((soma, t) => soma + (parseFloat(String(t.cargaHoraria).replace(",", ".")) || 0), 0);

    const listaOc = (tipo, vazio) => {
        const itens = oc.filter(o => (o.tipo || "").toUpperCase() === tipo);
        if (itens.length === 0) return linhaVazia(vazio);
        return `<ul class="lista-dossie">` + itens.map(o =>
            `<li><strong>${o.dataOcorrencia || o.dataRegistro}</strong> — ${o.descricao || "(sem descrição)"} <small>por ${o.registradoPor}</small></li>`
        ).join("") + `</ul>`;
    };

    area.innerHTML = `
        <div class="card">
            <h2>${c.nome}</h2>
            <p class="subtitulo">
                ${c.funcao} · ${c.unidade} · Status: ${c.statusAdmissao || "-"}<br>
                📅 Admissão: <strong>${c.dataAdmissao || "não informada"}</strong>
                &nbsp;·&nbsp; 🕐 Horário: ${c.horario || "-"} &nbsp;·&nbsp; 🛌 Folga: ${c.folga || "-"}
            </p>
        </div>

        <div class="cards-grid">
            <div class="card card-indicador ind-amarelo">
                <span class="indicador-numero">${contarTipo(oc, "ATRASO")}</span>
                <span class="indicador-rotulo">Atrasos registrados</span>
            </div>
            <div class="card card-indicador ind-vermelho">
                <span class="indicador-numero">${contarTipo(oc, "FALTA INJUSTIFICADA")}</span>
                <span class="indicador-rotulo">Faltas injustificadas</span>
            </div>
            <div class="card card-indicador ind-vermelho">
                <span class="indicador-numero">${contarTipo(oc, "ADVERTÊNCIA")}</span>
                <span class="indicador-rotulo">Advertências</span>
            </div>
            <div class="card card-indicador ${frequencia === null ? "" : (frequencia >= 80 ? "ind-verde" : "ind-amarelo")}">
                <span class="indicador-numero">${frequencia === null ? "—" : frequencia + "%"}</span>
                <span class="indicador-rotulo">Frequência em treinamentos (${horas}h)</span>
            </div>
        </div>

        <div class="card">
            <div class="toolbar" style="margin-bottom:0">
                <button class="btn" onclick="formularioOcorrencia(${c.id})">+ Nova Ocorrência</button>
                <button class="btn btn-secundario" onclick="formularioTreinamento(${c.id})">+ Registrar Treinamento</button>
            </div>
            <div id="areaRegistroRapido"></div>
        </div>

        <div class="card"><h3>🕐 Atrasos</h3>${listaOc("ATRASO", "Nenhum atraso registrado.")}</div>
        <div class="card"><h3>🚫 Faltas injustificadas</h3>${listaOc("FALTA INJUSTIFICADA", "Nenhuma falta injustificada.")}</div>
        <div class="card"><h3>⚠️ Advertências</h3>${listaOc("ADVERTÊNCIA", "Nenhuma advertência registrada.")}</div>
        <div class="card"><h3>🏥 Atestados</h3>${listaOc("ATESTADO", "Nenhum atestado registrado.")}</div>
        <div class="card"><h3>🦺 EPIs entregues</h3>${listaOc("EPI ENTREGUE", "Nenhum EPI registrado.")}</div>
        <div class="card"><h3>👕 Fardamentos entregues</h3>${listaOc("FARDAMENTO ENTREGUE", "Nenhum fardamento registrado.")}</div>
        <div class="card"><h3>🤝 Integração</h3>${
            contarTipo(oc, "INTEGRAÇÃO REALIZADA") > 0
                ? `<span class="badge badge-verde">✅ INTEGRAÇÃO REALIZADA</span>` + listaOc("INTEGRAÇÃO REALIZADA", "")
                : `<span class="badge badge-amarelo">PENDENTE</span> <small class="subtitulo">Registre com uma ocorrência do tipo INTEGRAÇÃO REALIZADA.</small>`
        }</div>
        <div class="card"><h3>📈 Promoções</h3>${listaOc("PROMOÇÃO", "Nenhuma promoção registrada.")}</div>
        <div class="card"><h3>🌟 Elogios / Reconhecimentos</h3>${listaOc("ELOGIO / RECONHECIMENTO", "Nenhum elogio registrado.")}</div>

        <div class="card">
            <h3>💬 Feedbacks (${fb.length})</h3>
            ${fb.length === 0 ? linhaVazia("Nenhum feedback registrado.") :
                `<ul class="lista-dossie">` + fb.map(f =>
                    `<li><strong>${f.dataFeedback}</strong> — ${f.tipo}<br>
                     <small>✅ ${f.pontosFortes || "-"}<br>🔧 ${f.pontosMelhoria || "-"}<br>🤝 ${f.acordos || "-"} · por ${f.registradoPor}</small></li>`
                ).join("") + `</ul>`}
        </div>

        <div class="card">
            <h3>📝 Avaliações de experiência (${av.length})</h3>
            ${av.length === 0 ? linhaVazia("Nenhuma avaliação registrada.") :
                `<ul class="lista-dossie">` + av.map(a =>
                    `<li><strong>${a.dataAvaliacao}</strong> — ${a.etapa} → <span class="badge badge-${a.resultado === "EFETIVAÇÃO" ? "verde" : (a.resultado === "DESLIGAMENTO" ? "vermelho" : "amarelo")}">${a.resultado}</span><br>
                     <small>Gestor: ${a.gestor} · Valores: ${a.produtividade}/${a.trabalhoEquipe}/${a.sensoDono}/${a.inovacao}/${a.fazerDiferenca}</small></li>`
                ).join("") + `</ul>`}
        </div>

        <div class="card">
            <h3>🎓 Treinamentos (${tr.length})</h3>
            ${tr.length === 0 ? linhaVazia("Nenhum treinamento registrado.") :
                `<div class="tabela-wrap"><table class="tabela">
                    <thead><tr><th>Data</th><th>Treinamento</th><th>Carga</th><th>Presença</th></tr></thead>
                    <tbody>` + tr.map(t =>
                        `<tr><td>${t.dataTreinamento}</td><td>${t.treinamento}</td><td>${t.cargaHoraria}h</td>
                         <td><span class="badge badge-${(t.presenca || "").toUpperCase() === "PRESENTE" ? "verde" : "vermelho"}">${t.presenca}</span></td></tr>`
                    ).join("") + `</tbody></table></div>`}
        </div>

        <div class="card">
            <h3>🎓 Universidade Evol — Trilhas</h3>
            <p class="subtitulo">
                ✅ ${trilhaConcluidos.length} módulo(s) concluído(s) · 🕐 ${trilhaHoras}h de trilha · 📥 ${trilhaDownloads} material(is) baixado(s)
            </p>
            ${trilhaConcluidos.length === 0 ? linhaVazia("Nenhum módulo de trilha concluído ainda.") :
                `<ul class="lista-dossie">` + trilhaConcluidos.map(t =>
                    `<li><strong>${t.data}</strong> — ${t.academia}: ${t.modulo} <small>(${t.horas}h)</small></li>`
                ).join("") + `</ul>`}
        </div>
    `;
}

// ===== REGISTRO RÁPIDO: OCORRÊNCIA =====
function formularioOcorrencia(idColab) {
    document.getElementById("areaRegistroRapido").innerHTML = `
        <div class="formulario" style="margin-top:16px">
            <div class="grid-form">
                <div class="campo">
                    <label>Tipo de ocorrência *</label>
                    ${gerarSelect("oTipo", TIPOS_OCORRENCIA, "Selecione...")}
                </div>
                <div class="campo">
                    <label>Data da ocorrência *</label>
                    <input id="oData" type="date">
                </div>
                <div class="campo campo-cheio">
                    <label>Descrição</label>
                    <textarea id="oDescricao" rows="2" placeholder="Detalhes (ex.: motivo do atraso, item de EPI entregue, cargo da promoção...)"></textarea>
                </div>
            </div>
            <button class="btn" onclick="salvarOcorrencia(${idColab})">Salvar ocorrência</button>
        </div>
    `;
}

async function salvarOcorrencia(idColab) {
    const tipo = document.getElementById("oTipo").value;
    const data = document.getElementById("oData").value;

    if (!tipo || !data) { alert("Informe o tipo e a data da ocorrência."); return; }

    const c = colaboradorPorId(idColab);

    try {
        const resposta = await api("salvarOcorrencia", {
            colaboradorId: idColab,
            colaborador: c ? c.nome : "",
            tipo: tipo,
            dataOcorrencia: formatarData(data),
            descricao: document.getElementById("oDescricao").value.trim()
        });

        if (resposta.sucesso) {
            document.getElementById("dColaborador").value = idColab;
            abrirDossie();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===== REGISTRO RÁPIDO: TREINAMENTO =====
function formularioTreinamento(idColab) {
    document.getElementById("areaRegistroRapido").innerHTML = `
        <div class="formulario" style="margin-top:16px">
            <div class="grid-form">
                <div class="campo">
                    <label>Treinamento *</label>
                    <input id="trNome" placeholder="Ex.: Integração, Atendimento, Módulo 1 Academia...">
                </div>
                <div class="campo">
                    <label>Data *</label>
                    <input id="trData" type="date">
                </div>
                <div class="campo">
                    <label>Carga horária (h) *</label>
                    <input id="trCarga" type="number" min="0" step="0.5" placeholder="2">
                </div>
                <div class="campo">
                    <label>Presença *</label>
                    ${gerarSelect("trPresenca", ["PRESENTE", "FALTOU"], "Selecione...")}
                </div>
            </div>
            <button class="btn" onclick="salvarTreinamento(${idColab})">Salvar treinamento</button>
        </div>
    `;
}

async function salvarTreinamento(idColab) {
    const nome = document.getElementById("trNome").value.trim();
    const data = document.getElementById("trData").value;
    const carga = document.getElementById("trCarga").value;
    const presenca = document.getElementById("trPresenca").value;

    if (!nome || !data || !carga || !presenca) { alert("Preencha todos os campos do treinamento."); return; }

    const c = colaboradorPorId(idColab);

    try {
        const resposta = await api("salvarTreinamento", {
            colaboradorId: idColab,
            colaborador: c ? c.nome : "",
            treinamento: nome,
            dataTreinamento: formatarData(data),
            cargaHoraria: carga,
            presenca: presenca
        });

        if (resposta.sucesso) {
            document.getElementById("dColaborador").value = idColab;
            abrirDossie();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== MÓDULOS v8: ABRIR VAGA, ESTOQUE E CARGOS ====================
// ===================================================================

const UNIDADES_CURTAS = ["Aldeota", "Sul", "Eusébio", "Rio Mar", "Evol"];

const SOLICITANTES = ["Aline Cardoso", "João Ricardo", "Alan Souza", "Luiza Garzon",
    "Jeffany Alencar", "Denayre Monte", "Jéssica Monalisa", "Anália Gabrielly",
    "Mariano Maia", "Saulo Gomes", "Gustavo Freitas", "Lucas Nogueira", "Victor Farias"];

const RESPONSAVEIS_TESTE = ["Amanda Linhares", "Pablo Macedo", "Bruno Ribeiro",
    "Leidiana Silveira", "David Lira", "Roger Fernando", "Pablo Roberto", "Vilma Morais",
    "Cardone Junior", "Paulo Sérgio", "Ralfo Ifanger", "Júlio César", "Dney",
    "Davi Costa", "José Junior", "Emanuel Pontes", "Luiza Garzon"];
const MOTIVOS_VAGA = ["Substituição", "Aumento de Quadro", "Quadro ideal", "Substituição por promoção"];
const SETORES = ["SALÃO", "COZINHA", "BAR", "PARRILLA", "BURGER&PONTO", "ADMINISTRATIVO", "DELIVERY", "ALMOXARIFADO", "DH", "COMPRAS", "OUTRO"];
const TIPOS_ESTOQUE = ["FARDAMENTO", "EPI"];

let CARGOS = [];
let ESTOQUE = [];

// ===== CARGOS DINÂMICOS (vêm da aba Cargos da planilha) =====
function aplicarCargos(lista) {
    if (!lista || lista.length === 0) return;
    [FUNCOES, FUNCOES_RIOMAR].forEach(o => Object.keys(o).forEach(k => delete o[k]));
    lista.forEach(c => {
        const alvo = String(c.tabela).toUpperCase() === "RIOMAR" ? FUNCOES_RIOMAR : FUNCOES;
        alvo[c.nome] = { fixo: Number(c.fixo) || 0, compl: Number(c.compl) || 0 };
    });
}

async function carregarCargos() {
    try {
        const r = await api("listarCargos");
        if (r.sucesso) {
            CARGOS = r.cargos || [];
            aplicarCargos(CARGOS);
        }
    } catch (e) { }
}

function mapaPorUnidade(unidade) {
    return String(unidade || "").toUpperCase().includes("RIO MAR") ? FUNCOES_RIOMAR : FUNCOES;
}

function textoSalario(unidade, cargo) {
    const f = mapaPorUnidade(unidade)[cargo];
    if (!f) return "";
    const total = (f.fixo || 0) + (f.compl || 0);
    const ate = String(unidade || "").toUpperCase().includes("RIO MAR") ? "até " : "";
    return `💰 ${formatarMoeda(f.fixo)} + ${formatarMoeda(f.compl)} = ${ate}${formatarMoeda(total)}`;
}

// ===================================================================
// ===== ABRIR VAGA (RH e SÓCIO) =====================================
// ===================================================================
function telaAbrirVaga() {
    const app = document.getElementById("app");
    document.getElementById("tituloPagina").textContent = "Abrir Vaga";

    const socio = USUARIO.perfil === "SOCIO";

    app.innerHTML = `
        <div class="card formulario">
            <h2>📋 Solicitação de Abertura de Vaga</h2>
            <p class="subtitulo">A vaga entra direto no Controle de Vagas com status ABERTA e SLA de 10 dias</p>

            <div class="grid-form">
                <div class="campo">
                    <label>Unidade *</label>
                    ${socio
                        ? `<input id="nvUnidade" value="${USUARIO.unidade}" readonly class="campo-total">`
                        : gerarSelect("nvUnidade", UNIDADES_CURTAS, "Selecione a unidade...")}
                </div>

                <div class="campo">
                    <label>Vaga (cargo) *</label>
                    <select id="nvCargo"><option value="">Escolha a unidade primeiro</option></select>
                    <small id="nvSalario" class="nota-salario"></small>
                </div>

                <div class="campo">
                    <label>Setor *</label>
                    ${gerarSelect("nvSetor", SETORES, "Selecione...")}
                </div>

                <div class="campo">
                    <label>Motivo *</label>
                    ${gerarSelect("nvMotivo", MOTIVOS_VAGA, "Selecione...")}
                </div>

                <div class="campo">
                    <label>Colaborador substituído (se substituição)</label>
                    <input id="nvSubstituido" placeholder="Nome de quem saiu">
                </div>

                <div class="campo">
                    <label>Solicitante *</label>
                    ${gerarSelect("nvGestor", SOLICITANTES, "Selecione o solicitante...")}
                </div>
            </div>

            <button class="btn" onclick="salvarVaga()">Abrir vaga</button>
            <button class="btn btn-secundario" onclick="mostrar('recrutamento', null)">Cancelar</button>
        </div>
    `;

    const atualizarCargosVaga = () => {
        const unidade = document.getElementById("nvUnidade").value;
        const select = document.getElementById("nvCargo");
        if (!unidade) {
            select.innerHTML = `<option value="">Escolha a unidade primeiro</option>`;
            return;
        }
        let html = `<option value="">Selecione o cargo</option>`;
        Object.keys(mapaPorUnidade(unidade)).forEach(c => { html += `<option value="${c}">${c}</option>`; });
        select.innerHTML = html;
        document.getElementById("nvSalario").textContent = "";
    };

    if (!socio) document.getElementById("nvUnidade").addEventListener("change", atualizarCargosVaga);
    document.getElementById("nvCargo").addEventListener("change", function () {
        document.getElementById("nvSalario").textContent = textoSalario(document.getElementById("nvUnidade").value, this.value);
    });

    atualizarCargosVaga();
}

async function salvarVaga() {
    const unidade = document.getElementById("nvUnidade").value;
    const cargo = document.getElementById("nvCargo").value;
    const setor = document.getElementById("nvSetor").value;
    const motivo = document.getElementById("nvMotivo").value;
    const gestor = document.getElementById("nvGestor").value.trim();

    if (!unidade || !cargo || !setor || !motivo || !gestor) {
        alert("Preencha os campos obrigatórios (*): Unidade, Vaga, Setor, Motivo e Gestor.");
        return;
    }

    try {
        const resposta = await api("salvarVaga", {
            unidade: unidade,
            vaga: cargo,
            setor: setor,
            motivo: motivo,
            substituido: document.getElementById("nvSubstituido").value.trim(),
            gestor: gestor
        });

        if (resposta.sucesso) {
            alert("Vaga aberta com sucesso! Ela já aparece no Controle de Vagas.");
            mostrar("recrutamento", null);
        } else {
            alert("Erro ao abrir vaga: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== ESTOQUE DE FARDAMENTO E EPI (RH edita, SÓCIO vê) ===========
// ===================================================================
async function telaEstoque() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando estoque...</p>";

    try {
        const resposta = await api("listarEstoque");
        if (!resposta.sucesso) {
            app.innerHTML = `<div class="card"><p>Erro: ${resposta.erro || ""}</p></div>`;
            return;
        }
        ESTOQUE = resposta.itens || [];
    } catch (e) { return; }

    const rh = USUARIO.perfil === "RH";

    app.innerHTML = `
        <div class="toolbar">
            ${rh ? `<button class="btn" onclick="formNovoItemEstoque()">+ Novo Item</button>` : ""}
            <input id="eBusca" class="filtro-busca" placeholder="🔍 Buscar item..." oninput="renderizarEstoque()">
            <select id="eTipo" onchange="renderizarEstoque()">
                <option value="">Fardamento + EPI</option>
                ${TIPOS_ESTOQUE.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>
        </div>
        <div id="areaNovoItem"></div>
        <div id="tabelaEstoque"></div>
    `;

    renderizarEstoque();
}

function renderizarEstoque() {
    const alvo = document.getElementById("tabelaEstoque");
    if (!alvo) return;

    const busca = (document.getElementById("eBusca")?.value || "").toUpperCase();
    const fTipo = document.getElementById("eTipo")?.value || "";
    const rh = USUARIO.perfil === "RH";

    const filtrados = ESTOQUE.filter(i => {
        const okBusca = !busca || `${i.item} ${i.tamanho}`.toUpperCase().includes(busca);
        const okTipo = !fTipo || String(i.tipo).toUpperCase() === fTipo;
        return okBusca && okTipo;
    });

    if (ESTOQUE.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhum item cadastrado no estoque ainda.${rh ? " Clique em <strong>+ Novo Item</strong> para começar." : ""}</p></div>`;
        return;
    }

    if (filtrados.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhum item com esses filtros.</p></div>`;
        return;
    }

    let html = `
        <div class="card tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Item</th>
                        <th>Tamanho</th>
                        <th>Unidade</th>
                        <th>Quantidade</th>
                        ${rh ? "<th>Ajustar</th>" : ""}
                    </tr>
                </thead>
                <tbody>
    `;

    filtrados.forEach(i => {
        const qtd = Number(i.quantidade) || 0;
        const corQtd = qtd === 0 ? "vermelho" : (qtd <= 5 ? "amarelo" : "verde");
        html += `
            <tr>
                <td><span class="badge badge-azul">${i.tipo}</span></td>
                <td><strong>${i.item}</strong></td>
                <td>${i.tamanho || "-"}</td>
                <td>${i.unidade || "Todas"}</td>
                <td><span class="badge badge-${corQtd}">${qtd}</span></td>
                ${rh ? `<td class="acoes">
                    <button class="btn-acao" title="Saída (-1)" onclick="ajustarEstoque(${i.id}, -1)">➖</button>
                    <button class="btn-acao" title="Entrada (+1)" onclick="ajustarEstoque(${i.id}, 1)">➕</button>
                </td>` : ""}
            </tr>
        `;
    });

    html += `</tbody></table></div>
        <p class="contagem">${filtrados.length} item(ns) exibido(s) · Itens com 5 ou menos aparecem em amarelo (repor!)</p>`;
    alvo.innerHTML = html;
}

function formNovoItemEstoque() {
    document.getElementById("areaNovoItem").innerHTML = `
        <div class="card formulario">
            <h3>Novo item de estoque</h3><br>
            <div class="grid-form">
                <div class="campo">
                    <label>Tipo *</label>
                    ${gerarSelect("niTipo", TIPOS_ESTOQUE, "Selecione...")}
                </div>
                <div class="campo">
                    <label>Item *</label>
                    <input id="niItem" placeholder="Ex.: Camisa polo preta, Bota antiderrapante...">
                </div>
                <div class="campo">
                    <label>Tamanho</label>
                    <input id="niTamanho" placeholder="Ex.: P, M, G, GG, 40, 42...">
                </div>
                <div class="campo">
                    <label>Unidade (vazio = todas)</label>
                    ${gerarSelect("niUnidade", UNIDADES_CURTAS, "Todas as unidades")}
                </div>
                <div class="campo">
                    <label>Quantidade inicial *</label>
                    <input id="niQtd" type="number" min="0" placeholder="0">
                </div>
            </div>
            <button class="btn" onclick="salvarItemEstoque()">Salvar item</button>
            <button class="btn btn-secundario" onclick="document.getElementById('areaNovoItem').innerHTML=''">Cancelar</button>
        </div>
    `;
}

async function salvarItemEstoque() {
    const tipo = document.getElementById("niTipo").value;
    const item = document.getElementById("niItem").value.trim();
    const qtd = document.getElementById("niQtd").value;

    if (!tipo || !item || qtd === "") {
        alert("Preencha Tipo, Item e Quantidade.");
        return;
    }

    try {
        const resposta = await api("salvarItemEstoque", {
            tipo: tipo,
            item: item,
            tamanho: document.getElementById("niTamanho").value.trim(),
            unidade: document.getElementById("niUnidade").value,
            quantidade: qtd
        });

        if (resposta.sucesso) {
            telaEstoque();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

async function ajustarEstoque(id, delta) {
    try {
        const resposta = await api("ajustarEstoque", { id: id, delta: delta });
        if (resposta.sucesso) {
            const item = ESTOQUE.find(i => String(i.id) === String(id));
            if (item) item.quantidade = resposta.quantidade;
            renderizarEstoque();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== CARGOS & SALÁRIOS (RH) ======================================
// ===================================================================
async function telaCargos() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando cargos...</p>";

    await carregarCargos();

    app.innerHTML = `
        <div class="toolbar">
            ${USUARIO.perfil === "RH" ? `<button class="btn" onclick="formNovoCargo()">+ Novo Cargo</button>` : ""}
            <input id="cBusca" class="filtro-busca" placeholder="🔍 Buscar cargo..." oninput="renderizarCargos()">
            <select id="cTabela" onchange="renderizarCargos()">
                <option value="">Todas as tabelas</option>
                <option value="PADRAO">PADRÃO (demais unidades)</option>
                <option value="RIOMAR">RIO MAR (base + variável)</option>
            </select>
        </div>
        <div id="areaFormCargo"></div>
        <div id="tabelaCargos"></div>
    `;

    renderizarCargos();
}

function renderizarCargos() {
    const alvo = document.getElementById("tabelaCargos");
    if (!alvo) return;

    const busca = (document.getElementById("cBusca")?.value || "").toUpperCase();
    const fTabela = document.getElementById("cTabela")?.value || "";

    const filtrados = CARGOS.filter(c => {
        const okBusca = !busca || String(c.nome).toUpperCase().includes(busca);
        const okTabela = !fTabela || String(c.tabela).toUpperCase() === fTabela;
        return okBusca && okTabela;
    });

    if (CARGOS.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhum cargo cadastrado. Importe a planilha de cargos ou clique em <strong>+ Novo Cargo</strong>.</p></div>`;
        return;
    }

    let html = `
        <div class="card tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Tabela</th>
                        <th>Cargo</th>
                        <th>Fixo / Base</th>
                        <th>Complemento / Variável</th>
                        <th>Total</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filtrados.forEach(c => {
        const fixo = Number(c.fixo) || 0;
        const compl = Number(c.compl) || 0;
        const riomar = String(c.tabela).toUpperCase() === "RIOMAR";
        html += `
            <tr>
                <td><span class="badge badge-${riomar ? "vermelho" : "azul"}">${riomar ? "RIO MAR" : "PADRÃO"}</span></td>
                <td><strong>${c.nome}</strong></td>
                <td>${formatarMoeda(fixo)}</td>
                <td>${formatarMoeda(compl)}${riomar ? " (até)" : ""}</td>
                <td><strong>${riomar ? "até " : ""}${formatarMoeda(fixo + compl)}</strong></td>
                <td class="acoes">${USUARIO.perfil === "RH"
                    ? `<button class="btn-acao" title="Editar salários" onclick="formEditarCargo(${c.id})">✏️</button>`
                    : "—"}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>
        <p class="contagem">${filtrados.length} cargo(s) exibido(s) de ${CARGOS.length} no total</p>`;
    alvo.innerHTML = html;
}

function formNovoCargo() {
    document.getElementById("areaFormCargo").innerHTML = `
        <div class="card formulario">
            <h3>Novo cargo</h3><br>
            <div class="grid-form">
                <div class="campo">
                    <label>Tabela *</label>
                    <select id="ncTabela">
                        <option value="">Selecione...</option>
                        <option value="PADRAO">PADRÃO (demais unidades)</option>
                        <option value="RIOMAR">RIO MAR (base + variável)</option>
                    </select>
                </div>
                <div class="campo">
                    <label>Nome do cargo *</label>
                    <input id="ncNome" placeholder="Ex.: PIZZAIOLO JR" style="text-transform:uppercase">
                </div>
                <div class="campo">
                    <label>Salário fixo / base (R$) *</label>
                    <input id="ncFixo" type="number" min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="campo">
                    <label>Complemento / variável (R$)</label>
                    <input id="ncCompl" type="number" min="0" step="0.01" placeholder="0.00">
                </div>
            </div>
            <button class="btn" onclick="salvarNovoCargo()">Salvar cargo</button>
            <button class="btn btn-secundario" onclick="document.getElementById('areaFormCargo').innerHTML=''">Cancelar</button>
        </div>
    `;
}

async function salvarNovoCargo() {
    const tabela = document.getElementById("ncTabela").value;
    const nome = document.getElementById("ncNome").value.trim().toUpperCase();
    const fixo = document.getElementById("ncFixo").value;

    if (!tabela || !nome || fixo === "") {
        alert("Preencha Tabela, Nome e Salário fixo.");
        return;
    }

    try {
        const resposta = await api("salvarCargo", {
            tabela: tabela,
            nome: nome,
            fixo: fixo,
            compl: document.getElementById("ncCompl").value || 0
        });

        if (resposta.sucesso) {
            document.getElementById("areaFormCargo").innerHTML = "";
            telaCargos();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

function formEditarCargo(id) {
    const c = CARGOS.find(x => String(x.id) === String(id));
    if (!c) return;

    document.getElementById("areaFormCargo").innerHTML = `
        <div class="card formulario">
            <h3>Editar: ${c.nome}</h3><br>
            <div class="grid-form">
                <div class="campo">
                    <label>Salário fixo / base (R$) *</label>
                    <input id="ecFixo" type="number" min="0" step="0.01" value="${Number(c.fixo) || 0}">
                </div>
                <div class="campo">
                    <label>Complemento / variável (R$)</label>
                    <input id="ecCompl" type="number" min="0" step="0.01" value="${Number(c.compl) || 0}">
                </div>
            </div>
            <button class="btn" onclick="salvarEdicaoCargo(${c.id})">Salvar alterações</button>
            <button class="btn btn-secundario" onclick="document.getElementById('areaFormCargo').innerHTML=''">Cancelar</button>
        </div>
    `;
}

async function salvarEdicaoCargo(id) {
    const fixo = document.getElementById("ecFixo").value;
    if (fixo === "") { alert("Informe o salário fixo."); return; }

    try {
        const resposta = await api("atualizarCargo", {
            id: id,
            fixo: fixo,
            compl: document.getElementById("ecCompl").value || 0
        });

        if (resposta.sucesso) {
            document.getElementById("areaFormCargo").innerHTML = "";
            telaCargos();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===================================================================
// ===== MÓDULOS v9: UNIVERSIDADE EVOL (TRILHAS DAS ACADEMIAS) =======
// ===================================================================

const ACADEMIAS = {
    "LIDERES": { nome: "👑 Academia de Líderes", desc: "12 módulos mensais de desenvolvimento de lideranças" },
    "NOVOS TALENTOS": { nome: "🌱 Academia de Novos Talentos", desc: "12 módulos mensais de desenvolvimento pessoal e profissional" }
};

let TRILHA_ATUAL = null;
let MODULOS_TRILHA = [];
let PROGRESSO_TRILHA = [];

function podeEditarPessoas() {
    return ["RH", "DP"].includes(USUARIO?.perfil);
}

// ===== HUB DA UNIVERSIDADE =====
function telaUniversidade() {
    const app = document.getElementById("app");

    // Líder e colaborador vão direto pra trilha deles
    if (USUARIO.perfil === "LIDER" || USUARIO.perfil === "SOCIO") { carregarTrilha("LIDERES"); return; }
    if (USUARIO.perfil === "COLABORADOR") { carregarTrilha("NOVOS TALENTOS"); return; }

    // RH e Diretoria escolhem a academia
    const rh = USUARIO.perfil === "RH";
    app.innerHTML = `
        <div class="cards-grid" style="grid-template-columns: 1fr 1fr">
            <div class="card">
                <h2>${ACADEMIAS["LIDERES"].nome}</h2>
                <p class="subtitulo">${ACADEMIAS["LIDERES"].desc}</p>
                <button class="btn" onclick="carregarTrilha('LIDERES')">Abrir trilha</button>
            </div>
            <div class="card">
                <h2>${ACADEMIAS["NOVOS TALENTOS"].nome}</h2>
                <p class="subtitulo">${ACADEMIAS["NOVOS TALENTOS"].desc}</p>
                <button class="btn" onclick="carregarTrilha('NOVOS TALENTOS')">Abrir trilha</button>
                ${rh ? `<button class="btn btn-secundario" onclick="telaAcessosTrilha()">🔑 Gerenciar acessos</button>` : ""}
            </div>
        </div>
        ${rh ? `<div class="card"><button class="btn" onclick="formNovoModulo()">+ Novo Módulo</button><div id="areaFormModulo"></div></div>` : ""}
    `;
}

// ===== TRILHA (lista de módulos com progresso) =====
async function carregarTrilha(academia) {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando trilha...</p>";

    try {
        const resposta = await api("listarTrilha", { academia: academia });
        if (!resposta.sucesso) {
            app.innerHTML = `<div class="card"><p>${resposta.erro === "SEM_ACESSO_TRILHA"
                ? "Você ainda não tem acesso a esta academia. Fale com o RH. 😉"
                : "Erro: " + (resposta.erro || "")}</p></div>`;
            return;
        }

        TRILHA_ATUAL = academia;
        MODULOS_TRILHA = (resposta.modulos || []).sort((a, b) => Number(a.ordem) - Number(b.ordem));
        PROGRESSO_TRILHA = resposta.progresso || [];
        renderizarTrilha();

    } catch (e) { }
}

function statusModulo(moduloId) {
    const eventos = PROGRESSO_TRILHA.filter(p => String(p.moduloId) === String(moduloId));
    if (eventos.some(e => e.acao === "CONCLUIU")) return "CONCLUIDO";
    if (eventos.length > 0) return "EM ANDAMENTO";
    return "PENDENTE";
}

function renderizarTrilha() {
    const app = document.getElementById("app");
    const info = ACADEMIAS[TRILHA_ATUAL];
    const rh = USUARIO.perfil === "RH";

    const concluidos = MODULOS_TRILHA.filter(m => statusModulo(m.id) === "CONCLUIDO").length;
    const horas = PROGRESSO_TRILHA
        .filter(p => p.acao === "CONCLUIU")
        .reduce((s, p) => s + (parseFloat(String(p.horas).replace(",", ".")) || 0), 0);
    const pct = MODULOS_TRILHA.length > 0 ? Math.round((concluidos / MODULOS_TRILHA.length) * 100) : 0;

    let cards = "";
    MODULOS_TRILHA.forEach(m => {
        const st = statusModulo(m.id);
        const badge = st === "CONCLUIDO"
            ? `<span class="badge badge-verde">✅ Concluído</span>`
            : (st === "EM ANDAMENTO" ? `<span class="badge badge-amarelo">Em andamento</span>` : `<span class="badge badge-azul">Módulo ${m.ordem}</span>`);

        cards += `
            <div class="card modulo-card">
                <div class="modulo-topo">
                    ${badge}
                    <span class="modulo-carga">🕐 ${m.carga}h</span>
                </div>
                <h3>${m.nome}</h3>
                <p class="subtitulo" style="margin-bottom:8px">${m.descricao || ""}</p>
                ${m.ferramentas ? `<p class="modulo-ferramentas">🛠️ <strong>Ferramentas:</strong> ${m.ferramentas}</p>` : ""}
                <div class="modulo-botoes">
                    ${m.link
                        ? `<button class="btn" onclick="abrirConteudo(${m.id})">▶ Abrir conteúdo</button>`
                        : `<span class="subtitulo">📎 Conteúdo ainda não anexado</span>`}
                    ${st !== "CONCLUIDO" ? `<button class="btn btn-secundario" onclick="concluirModulo(${m.id})">✅ Concluir módulo</button>` : ""}
                    ${m.link ? `<button class="btn btn-secundario" onclick="baixouMaterial(${m.id})">📥 Baixei o material</button>` : ""}
                    ${rh ? `<button class="btn-acao" title="Editar módulo" onclick="formEditarModulo(${m.id})">✏️</button>` : ""}
                </div>
            </div>
        `;
    });

    app.innerHTML = `
        <div class="card">
            <h2>${info.nome}</h2>
            <p class="subtitulo">${info.desc}</p>
            <div class="barra-progresso"><div class="barra-preenchida" style="width:${pct}%"></div></div>
            <p class="contagem" style="margin-top:8px">
                <strong>${concluidos}/${MODULOS_TRILHA.length} módulos concluídos (${pct}%)</strong> · ${horas}h de trilha
            </p>
            ${["RH", "DIRETORIA"].includes(USUARIO.perfil)
                ? `<button class="btn btn-secundario" onclick="telaUniversidade()">← Voltar às academias</button>` : ""}
        </div>
        <div id="areaFormModulo"></div>
        ${cards}
    `;
}

function moduloPorId(id) {
    return MODULOS_TRILHA.find(m => String(m.id) === String(id));
}

async function registrarProgresso(moduloId, acao) {
    const m = moduloPorId(moduloId);
    if (!m) return;

    try {
        const resposta = await api("registrarProgresso", {
            academia: TRILHA_ATUAL,
            moduloId: m.id,
            modulo: m.nome,
            evento: acao,
            horas: acao === "CONCLUIU" ? m.carga : ""
        });

        if (resposta.sucesso) {
            PROGRESSO_TRILHA.push({ moduloId: m.id, acao: acao, horas: acao === "CONCLUIU" ? m.carga : "" });
            renderizarTrilha();
        }
    } catch (e) { }
}

function abrirConteudo(moduloId) {
    const m = moduloPorId(moduloId);
    if (!m || !m.link) return;
    window.open(m.link, "_blank");
    registrarProgresso(moduloId, "ABRIU");
}

function concluirModulo(moduloId) {
    if (confirm("Confirmar conclusão deste módulo? As horas serão contabilizadas na sua trilha.")) {
        registrarProgresso(moduloId, "CONCLUIU");
    }
}

function baixouMaterial(moduloId) {
    registrarProgresso(moduloId, "BAIXOU");
    alert("Download registrado! 📥");
}

// ===== GESTÃO DE MÓDULOS (RH) =====
function formNovoModulo() {
    const area = document.getElementById("areaFormModulo");
    area.innerHTML = formModuloHtml(null);
    area.scrollIntoView({ behavior: "smooth" });
}

function formEditarModulo(id) {
    const m = moduloPorId(id);
    if (!m) return;
    const area = document.getElementById("areaFormModulo");
    area.innerHTML = formModuloHtml(m);
    area.scrollIntoView({ behavior: "smooth" });
}

function formModuloHtml(m) {
    const editando = !!m;
    return `
        <div class="card formulario">
            <h3>${editando ? "Editar: " + m.nome : "Novo módulo"}</h3><br>
            <div class="grid-form">
                <div class="campo">
                    <label>Academia *</label>
                    <select id="mAcademia" ${editando ? "disabled" : ""}>
                        <option value="LIDERES" ${editando && m.academia === "LIDERES" ? "selected" : ""}>Academia de Líderes</option>
                        <option value="NOVOS TALENTOS" ${editando && m.academia === "NOVOS TALENTOS" ? "selected" : ""}>Novos Talentos</option>
                    </select>
                </div>
                <div class="campo">
                    <label>Ordem *</label>
                    <input id="mOrdem" type="number" min="1" value="${editando ? m.ordem : ""}">
                </div>
                <div class="campo">
                    <label>Carga horária (h) *</label>
                    <input id="mCarga" type="number" min="0" step="0.5" value="${editando ? m.carga : "2"}">
                </div>
                <div class="campo campo-cheio">
                    <label>Nome do módulo *</label>
                    <input id="mNome" value="${editando ? m.nome : ""}" placeholder="Ex.: MÓDULO 01 — Autoconhecimento">
                </div>
                <div class="campo campo-cheio">
                    <label>Descrição</label>
                    <textarea id="mDescricao" rows="2">${editando ? (m.descricao || "") : ""}</textarea>
                </div>
                <div class="campo campo-cheio">
                    <label>Ferramentas do módulo</label>
                    <textarea id="mFerramentas" rows="2" placeholder="Separadas por ; ">${editando ? (m.ferramentas || "") : ""}</textarea>
                </div>
                <div class="campo">
                    <label>Tipo de conteúdo</label>
                    ${gerarSelect("mTipo", ["APRESENTACAO", "VIDEO", "PDF", "QUIZ"], "Selecione...")}
                </div>
                <div class="campo campo-cheio">
                    <label>Link do conteúdo (YouTube não listado / Google Drive)</label>
                    <input id="mLink" value="${editando ? (m.link || "") : ""}" placeholder="https://...">
                </div>
            </div>
            <button class="btn" onclick="salvarModulo(${editando ? m.id : "''"})">Salvar módulo</button>
            <button class="btn btn-secundario" onclick="document.getElementById('areaFormModulo').innerHTML=''">Cancelar</button>
        </div>
    `;
}

async function salvarModulo(id) {
    const nome = document.getElementById("mNome").value.trim();
    const ordem = document.getElementById("mOrdem").value;
    const carga = document.getElementById("mCarga").value;

    if (!nome || !ordem || carga === "") {
        alert("Preencha Academia, Ordem, Carga e Nome.");
        return;
    }

    const dados = {
        academia: document.getElementById("mAcademia").value,
        ordem: ordem,
        nome: nome,
        descricao: document.getElementById("mDescricao").value.trim(),
        ferramentas: document.getElementById("mFerramentas").value.trim(),
        tipo: document.getElementById("mTipo").value,
        link: document.getElementById("mLink").value.trim(),
        carga: carga
    };

    try {
        const resposta = id
            ? await api("atualizarModulo", { id: id, ...dados })
            : await api("salvarModulo", dados);

        if (resposta.sucesso) {
            document.getElementById("areaFormModulo").innerHTML = "";
            if (TRILHA_ATUAL) carregarTrilha(dados.academia);
            else telaUniversidade();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===== GESTÃO DE ACESSOS À ACADEMIA DE NOVOS TALENTOS (RH) =====
async function telaAcessosTrilha() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Carregando usuários...</p>";

    try {
        const [rUsuarios, rAcessos] = await Promise.all([
            api("listarColabUsuarios"),
            api("listarAcessos")
        ]);

        const usuarios = rUsuarios.usuarios || [];
        const acessos = rAcessos.acessos || [];
        const temAcesso = (cpf) => acessos.some(a => String(a.cpf) === String(cpf));

        let linhas = "";
        usuarios.forEach(u => {
            const ok = temAcesso(u.cpf);
            linhas += `
                <tr>
                    <td><strong>${u.nome}</strong></td>
                    <td>${String(u.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4")}</td>
                    <td><span class="badge badge-${ok ? "verde" : "amarelo"}">${ok ? "COM ACESSO" : "SEM ACESSO"}</span></td>
                    <td class="acoes">
                        ${ok
                            ? `<button class="btn-acao" onclick="mudarAcesso('${u.cpf}', '${u.nome.replace(/'/g, "")}', false)">🚫 Revogar</button>`
                            : `<button class="btn-acao" onclick="mudarAcesso('${u.cpf}', '${u.nome.replace(/'/g, "")}', true)">🔑 Conceder</button>`}
                    </td>
                </tr>
            `;
        });

        app.innerHTML = `
            <div class="card">
                <h2>🔑 Acessos — Academia de Novos Talentos</h2>
                <p class="subtitulo">Somente colaboradores com acesso concedido enxergam a trilha. (A Academia de Líderes é automática para o perfil LIDER.)</p>
                <button class="btn btn-secundario" onclick="telaUniversidade()">← Voltar</button>
            </div>
            <div class="card tabela-wrap">
                ${usuarios.length === 0
                    ? `<div style="padding:20px"><p>Nenhum usuário com perfil COLABORADOR na aba Usuarios ainda. Cadastre-os lá (CPF, nome, senha, perfil COLABORADOR).</p></div>`
                    : `<table class="tabela">
                        <thead><tr><th>Nome</th><th>CPF</th><th>Status</th><th>Ação</th></tr></thead>
                        <tbody>${linhas}</tbody>
                    </table>`}
            </div>
        `;

    } catch (e) { }
}

async function mudarAcesso(cpf, nome, conceder) {
    try {
        const resposta = await api(conceder ? "concederAcesso" : "revogarAcesso", { cpfColab: cpf, nomeColab: nome });
        if (resposta.sucesso) telaAcessosTrilha();
        else alert("Erro: " + (resposta.erro || ""));
    } catch (e) { }
}

// ===================================================================
// ===== MÓDULO v10: PROCESSO SELETIVO (CANDIDATOS EM TESTE) =========
// ===================================================================

let PROCESSOS = [];

const OPCOES_PROCESSO = {
    entrevista: ["ONLINE", "PRESENCIAL"],
    checagem: ["PENDENTE", "APROVADA", "REPROVADA"],
    simNao: ["SIM", "NÃO"],
    compareceu: ["PENDENTE", "SIM", "NÃO"],
    resultadoTeste: ["PENDENTE", "APROVADO", "REPROVADO"],
    statusProcesso: ["EM PROCESSO", "APROVADO", "REPROVADO", "DESISTIU"]
};

async function telaProcessoSeletivo() {
    const app = document.getElementById("app");
    document.getElementById("tituloPagina").textContent = "Candidatos em Teste";
    app.innerHTML = "<p>Carregando candidatos...</p>";

    try {
        const resposta = await api("listarProcessos");
        if (!resposta.sucesso) {
            app.innerHTML = `<div class="card"><p>Erro: ${resposta.erro || ""}</p></div>`;
            return;
        }
        PROCESSOS = resposta.processos || [];
    } catch (e) { return; }

    const rh = USUARIO.perfil === "RH";

    app.innerHTML = `
        <div class="toolbar">
            ${rh ? `<button class="btn" onclick="formProcesso()">+ Novo Candidato em Teste</button>` : ""}
            <button class="btn btn-secundario" onclick="mostrar('recrutamento', null)">← Voltar às vagas</button>
            <select id="pFiltroStatus" onchange="renderizarProcessos()">
                <option value="">Todos os status</option>
                ${OPCOES_PROCESSO.statusProcesso.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>
        </div>
        <div id="areaFormProcesso"></div>
        <div id="tabelaProcessos"></div>
    `;

    renderizarProcessos();
}

function iconeSN(valor) {
    return String(valor).toUpperCase() === "SIM" ? "✅" : (String(valor).toUpperCase() === "NÃO" ? "❌" : "⬜");
}

function renderizarProcessos() {
    const alvo = document.getElementById("tabelaProcessos");
    if (!alvo) return;

    const fStatus = document.getElementById("pFiltroStatus")?.value || "";
    const filtrados = PROCESSOS.filter(p => !fStatus || p.status === fStatus);
    const rh = USUARIO.perfil === "RH";

    if (PROCESSOS.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhum candidato em processo${USUARIO.perfil === "SOCIO" ? " na sua casa" : ""}.${rh ? " Clique em <strong>+ Novo Candidato em Teste</strong>." : ""}</p></div>`;
        return;
    }

    if (filtrados.length === 0) {
        alvo.innerHTML = `<div class="card"><p>Nenhum candidato com esse status.</p></div>`;
        return;
    }

    let html = `
        <div class="card tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Candidato</th>
                        <th>Vaga · Casa</th>
                        <th>Entrevista</th>
                        <th>Checagem</th>
                        <th title="Alinhado com o sócio">🤝 Sócio</th>
                        <th title="Fardamento separado">👕 Farda</th>
                        <th title="Passagem entregue">🎫 Passagem</th>
                        <th>Teste</th>
                        <th>Compareceu</th>
                        <th>Resultado</th>
                        <th>Status</th>
                        ${rh ? "<th>Ações</th>" : ""}
                    </tr>
                </thead>
                <tbody>
    `;

    filtrados.forEach(p => {
        const corStatus = p.status === "APROVADO" ? "verde" : (p.status === "REPROVADO" || p.status === "DESISTIU" ? "vermelho" : "amarelo");
        const corResultado = p.resultadoTeste === "APROVADO" ? "verde" : (p.resultadoTeste === "REPROVADO" ? "vermelho" : "amarelo");
        const corCompareceu = p.compareceu === "SIM" ? "verde" : (p.compareceu === "NÃO" ? "vermelho" : "amarelo");
        const corChecagem = p.checagem === "APROVADA" ? "verde" : (p.checagem === "REPROVADA" ? "vermelho" : "amarelo");

        html += `
            <tr>
                <td><strong>${p.candidato}</strong><br><small>Resp.: ${p.responsavel || "-"}</small></td>
                <td>${p.vaga}<br><small>${p.unidade}${p.localTeste ? " · 📍 " + p.localTeste : ""}</small></td>
                <td>${p.entrevista || "-"}</td>
                <td><span class="badge badge-${corChecagem}">${p.checagem || "PENDENTE"}</span></td>
                <td>${iconeSN(p.alinhadoSocio)}</td>
                <td>${iconeSN(p.fardamento)}</td>
                <td>${iconeSN(p.passagem)}</td>
                <td>${p.dataTeste || "-"}</td>
                <td><span class="badge badge-${corCompareceu}">${p.compareceu || "PENDENTE"}</span></td>
                <td><span class="badge badge-${corResultado}">${p.resultadoTeste || "PENDENTE"}</span></td>
                <td><span class="badge badge-${corStatus}">${p.status || "EM PROCESSO"}</span></td>
                ${rh ? `<td class="acoes"><button class="btn-acao" title="Atualizar (notifica sócio/diretoria)" onclick="formProcesso(${p.id})">✏️</button></td>` : ""}
            </tr>
        `;
    });

    html += `</tbody></table></div>
        <p class="contagem">${filtrados.length} candidato(s) · Cada atualização notifica automaticamente sócio da casa, RH e diretoria 📲</p>`;
    alvo.innerHTML = html;
}

function processoPorId(id) {
    return PROCESSOS.find(p => String(p.id) === String(id));
}

function formProcesso(id) {
    const p = id !== undefined ? processoPorId(id) : null;
    const editando = !!p;
    const area = document.getElementById("areaFormProcesso");

    const sel = (campoId, opcoes, valorAtual) => {
        let html = `<select id="${campoId}"><option value="">Selecione...</option>`;
        opcoes.forEach(o => {
            html += `<option value="${o}" ${editando && valorAtual === o ? "selected" : ""}>${o}</option>`;
        });
        return html + `</select>`;
    };

    area.innerHTML = `
        <div class="card formulario">
            <h3>${editando ? "Atualizar: " + p.candidato : "Novo candidato em teste"}</h3>
            <p class="subtitulo">Ao salvar, sócio da casa, RH e diretoria recebem a notificação automática 📲</p>

            <div class="grid-form">
                <div class="campo">
                    <label>Casa (unidade) *</label>
                    ${editando
                        ? `<input value="${p.unidade}" readonly class="campo-total"><input type="hidden" id="pUnidade" value="${p.unidade}">`
                        : gerarSelect("pUnidade", UNIDADES_CURTAS, "Selecione a casa...")}
                </div>
                <div class="campo">
                    <label>Candidato *</label>
                    <input id="pCandidato" value="${editando ? p.candidato : ""}" ${editando ? "readonly" : ""} placeholder="Nome completo">
                </div>
                <div class="campo">
                    <label>Vaga *</label>
                    <input id="pVaga" value="${editando ? p.vaga : ""}" placeholder="Ex.: CUMIM">
                </div>

                <div class="campo">
                    <label>Local do teste</label>
                    <input id="pLocal" value="${editando ? (p.localTeste || "") : ""}" placeholder="Ex.: Parrileiro Aldeota">
                </div>
                <div class="campo">
                    <label>Dias do teste</label>
                    <input id="pDias" value="${editando ? (p.diasTeste || "") : ""}" placeholder="Ex.: 08/07 e 09/07">
                </div>
                <div class="campo">
                    <label>Responsável pelo teste</label>
                    ${sel("pResponsavel", RESPONSAVEIS_TESTE, p?.responsavel)}
                </div>

                <div class="campo">
                    <label>Valor da passagem (R$)</label>
                    <input id="pValorPassagem" type="number" min="0" step="0.01" value="${editando ? (p.valorPassagem || "") : ""}">
                </div>
                <div class="campo">
                    <label>Valor a separar p/ colaborador (R$)</label>
                    <input id="pValorSeparado" type="number" min="0" step="0.01" value="${editando ? (p.valorSeparado || "") : ""}">
                </div>
                <div class="campo">
                    <label>Entrevista</label>
                    ${sel("pEntrevista", OPCOES_PROCESSO.entrevista, p?.entrevista)}
                </div>
                <div class="campo">
                    <label>Checagem de referência</label>
                    ${sel("pChecagem", OPCOES_PROCESSO.checagem, p?.checagem)}
                </div>
                <div class="campo">
                    <label>Alinhado com o sócio</label>
                    ${sel("pAlinhado", OPCOES_PROCESSO.simNao, p?.alinhadoSocio)}
                </div>

                <div class="campo">
                    <label>Fardamento entregue</label>
                    ${sel("pFardamento", OPCOES_PROCESSO.simNao, p?.fardamento)}
                </div>
                <div class="campo">
                    <label>Passagem entregue</label>
                    ${sel("pPassagem", OPCOES_PROCESSO.simNao, p?.passagem)}
                </div>
                <div class="campo">
                    <label>Data do teste</label>
                    <input id="pDataTeste" type="date" value="${editando ? dataParaInput(p.dataTeste) : ""}">
                </div>

                <div class="campo">
                    <label>Compareceu ao teste</label>
                    ${sel("pCompareceu", OPCOES_PROCESSO.compareceu, p?.compareceu)}
                </div>
                <div class="campo">
                    <label>Resultado do teste</label>
                    ${sel("pResultado", OPCOES_PROCESSO.resultadoTeste, p?.resultadoTeste)}
                </div>
                <div class="campo">
                    <label>Status geral *</label>
                    ${sel("pStatus", OPCOES_PROCESSO.statusProcesso, p?.status || "EM PROCESSO")}
                </div>

                <div class="campo campo-cheio">
                    <label>Observações</label>
                    <textarea id="pObs" rows="2">${editando ? (p.observacoes || "") : ""}</textarea>
                </div>
            </div>

            <button class="btn" onclick="salvarProcesso(${editando ? p.id : "''"})">Salvar e notificar 📲</button>
            <button class="btn btn-secundario" onclick="document.getElementById('areaFormProcesso').innerHTML=''">Cancelar</button>
        </div>
    `;
    area.scrollIntoView({ behavior: "smooth" });
}

async function salvarProcesso(id) {
    const unidade = document.getElementById("pUnidade").value;
    const candidato = document.getElementById("pCandidato").value.trim();
    const vaga = document.getElementById("pVaga").value.trim();
    const status = document.getElementById("pStatus").value;

    if (!unidade || !candidato || !vaga || !status) {
        alert("Preencha Casa, Candidato, Vaga e Status.");
        return;
    }

    const dados = {
        unidade: unidade,
        candidato: candidato,
        vaga: vaga,
        localTeste: document.getElementById("pLocal").value.trim(),
        diasTeste: document.getElementById("pDias").value.trim(),
        responsavel: document.getElementById("pResponsavel").value,
        valorPassagem: document.getElementById("pValorPassagem").value,
        valorSeparado: document.getElementById("pValorSeparado").value,
        entrevista: document.getElementById("pEntrevista").value,
        checagem: document.getElementById("pChecagem").value,
        alinhadoSocio: document.getElementById("pAlinhado").value,
        fardamento: document.getElementById("pFardamento").value,
        passagem: document.getElementById("pPassagem").value,
        dataTeste: formatarData(document.getElementById("pDataTeste").value),
        compareceu: document.getElementById("pCompareceu").value,
        resultadoTeste: document.getElementById("pResultado").value,
        statusProcesso: status,
        observacoes: document.getElementById("pObs").value.trim()
    };

    try {
        const resposta = id
            ? await api("atualizarProcesso", { id: id, ...dados })
            : await api("salvarProcesso", dados);

        if (resposta.sucesso) {
            let msg = "Salvo! Notificações enviadas para sócio da casa, RH e diretoria. 📲";
            if (resposta.vagaEncerrada) {
                msg += "\n\n🏁 APROVADO: a vaga foi ENCERRADA automaticamente no Recrutamento (" +
                    resposta.diasAberto + " dias em aberto) e registrada na aba do DP!";
            }
            alert(msg);
            telaProcessoSeletivo();
        } else {
            alert("Erro: " + (resposta.erro || ""));
        }
    } catch (e) { }
}

// ===== INÍCIO =====
telaLogin();
