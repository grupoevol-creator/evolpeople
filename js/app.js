// ===== EVOL PEOPLE — Frontend v10.0 (Completo e Melhorado) =====
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwUCTuN7465i85rjUBwHTL6E9FSv1oZNLVeq2q29eukg0mWCjLhuUsNb4VB7w4abbA/exec';

let USUARIO = null;
let UNIDADE_SELECIONADA = null;
let TELA_ATUAL = null;
let VAGAS_CACHE = [];
let CARGOS_CACHE = [];
let DOSSIE_LISTA = [];
let SALARIO_TP_TOTAL = null;
let CHART_SLA = null;

// ===== MENUS E PERMISSÕES =====
const MENUS = {
    RH: [
        { id: 'dashboard', nome: '📊 Dashboard', icone: 'dashboard' },
        { id: 'admissoesPrevistas', nome: '📋 Admissões Previstas', icone: 'admissoes' },
        { id: 'vagas', nome: '💼 Vagas', icone: 'vagas' },
        { id: 'colaboradores', nome: '👥 Colaboradores', icone: 'colaboradores' },
        { id: 'testePratico', nome: '✅ Teste Prático', icone: 'teste' },
        { id: 'treinamentos', nome: '🎓 Treinamentos', icone: 'treinamentos' },
        { id: 'universidadeEvol', nome: '🏛️ Universidade EVOL', icone: 'universidade' },
        { id: 'feedback', nome: '💬 Feedback', icone: 'feedback' },
        { id: 'avaliacaoExperiencia', nome: '📝 Aval. Experiência', icone: 'avaliacao' },
        { id: 'pdiGerar', nome: '🎯 PDI (Liderados)', icone: 'pdi' },
        { id: 'escala', nome: '📅 Escala', icone: 'escala' },
        { id: 'cargosSalarios', nome: '💰 Cargos & Salários', icone: 'cargos' },
        { id: 'episFardamento', nome: '👔 EPIs & Fardamento', icone: 'epis' },
        { id: 'turnoverAbsenteismo', nome: '📊 Turnover & Absenteísmo', icone: 'turnover' },
        { id: 'sla', nome: '⏱️ SLA de Vagas', icone: 'sla' },
        { id: 'dossie', nome: '📁 Dossiê', icone: 'dossie' }
    ],
    DP: [
        { id: 'dashboard', nome: '📊 Dashboard', icone: 'dashboard' },
        { id: 'admissoesPrevistas', nome: '📋 Admissões Previstas', icone: 'admissoes' },
        { id: 'colaboradores', nome: '👥 Colaboradores', icone: 'colaboradores' },
        { id: 'treinamentos', nome: '🎓 Treinamentos', icone: 'treinamentos' },
        { id: 'turnoverAbsenteismo', nome: '📊 Turnover & Absenteísmo', icone: 'turnover' },
        { id: 'sla', nome: '⏱️ SLA de Vagas', icone: 'sla' },
        { id: 'dossie', nome: '📁 Dossiê', icone: 'dossie' }
    ],
    DIRETORIA: [
        { id: 'dashboard', nome: '📊 Dashboard', icone: 'dashboard' },
        { id: 'admissoesPrevistas', nome: '📋 Admissões Previstas', icone: 'admissoes' },
        { id: 'colaboradores', nome: '👥 Colaboradores', icone: 'colaboradores' },
        { id: 'turnoverAbsenteismo', nome: '📊 Turnover & Absenteísmo', icone: 'turnover' },
        { id: 'sla', nome: '⏱️ SLA de Vagas', icone: 'sla' },
        { id: 'dossie', nome: '📁 Dossiê', icone: 'dossie' }
    ],
    SOCIO: [
        { id: 'dashboard', nome: '📊 Dashboard', icone: 'dashboard' },
        { id: 'admisoesPrevistas', nome: '📋 Admissões Previstas', icone: 'admissoes' },
        { id: 'vagas', nome: '💼 Vagas', icone: 'vagas' },
        { id: 'testePratico', nome: '✅ Teste Prático', icone: 'teste' },
        { id: 'treinamentos', nome: '🎓 Treinamentos', icone: 'treinamentos' },
        { id: 'feedback', nome: '💬 Feedback', icone: 'feedback' },
        { id: 'avaliacaoExperiencia', nome: '📝 Aval. Experiência', icone: 'avaliacao' },
        { id: 'pdiGerar', nome: '🎯 PDI', icone: 'pdi' },
        { id: 'escala', nome: '📅 Escala', icone: 'escala' },
        { id: 'cargosSalarios', nome: '💰 Cargos & Salários', icone: 'cargos' },
        { id: 'turnoverAbsenteismo', nome: '📊 Turnover & Absenteísmo', icone: 'turnover' },
        { id: 'sla', nome: '⏱️ SLA de Vagas', icone: 'sla' },
        { id: 'dossie', nome: '📁 Dossiê', icone: 'dossie' }
    ],
    LIDER: [
        { id: 'testePratico', nome: '✅ Teste Prático', icone: 'teste' },
        { id: 'treinamentos', nome: '🎓 Treinamentos', icone: 'treinamentos' },
        { id: 'universidadeEvol', nome: '🏛️ Universidade EVOL', icone: 'universidade' },
        { id: 'escala', nome: '📅 Escala', icone: 'escala' },
        { id: 'feedback', nome: '💬 Feedback', icone: 'feedback' },
        { id: 'avaliacaoExperiencia', nome: '📝 Aval. Experiência', icone: 'avaliacao' },
        { id: 'pdiGerar', nome: '🎯 PDI', icone: 'pdi' }
    ],
    COLABORADOR: [
        { id: 'dossie', nome: '📁 Meu Dossiê', icone: 'dossie' },
        { id: 'pdi', nome: '🎯 Meu PDI', icone: 'pdi' }
    ]
};

const TITULOS = {
    dashboard: 'Dashboard',
    admissoesPrevistas: 'Admissões Previstas',
    vagas: 'Vagas',
    colaboradores: 'Colaboradores',
    testePratico: 'Teste Prático',
    treinamentos: 'Treinamentos',
    universidadeEvol: 'Universidade EVOL',
    feedback: 'Feedback',
    avaliacaoExperiencia: 'Avaliação de Experiência',
    escala: 'Escala',
    cargosSalarios: 'Cargos & Salários',
    episFardamento: 'EPIs & Fardamento',
    dossie: 'Dossiê',
    pdi: 'Meu PDI',
    pdiGerar: 'PDI - Liderados',
    turnoverAbsenteismo: 'Turnover & Absenteísmo',
    sla: 'SLA de Vagas'
};

const UNIDADES_OFICIAIS = ['PARRILEIRO SUL', 'PARRILEIRO ALDEOTA', 'PARRILEIRO RIO MAR', 'SEU CONRADO EUSÉBIO', 'EVOL (MATRIZ)'];

// ===== FUNÇÕES AUXILIARES =====
function esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatarMoeda(v) {
    const n = Number(v || 0);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (partes.length === 3) return partes[2] + '/' + partes[1] + '/' + partes[0];
    return dataISO;
}

function converterDataParaBR(valor) {
    const partes = String(valor || '').split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : '';
}

async function api(acao, dados) {
    try {
        const body = JSON.stringify({ acao, ...(dados || {}) });
        const r = await fetch(WEBAPP_URL, { method: 'POST', body });
        return await r.json();
    } catch (e) {
        console.error('Erro na API:', e);
        return { sucesso: false, erro: 'Falha de conexão com o servidor' };
    }
}

function selectUnidadeHtml(id, selecionada) {
    const sel = selecionada || UNIDADE_SELECIONADA || '';
    const ops = UNIDADES_OFICIAIS.map(u =>
        '<option value="' + esc(u) + '" ' + (u === sel ? 'selected' : '') + '>' + esc(u) + '</option>'
    ).join('');
    return '<select id="' + id + '">' + ops + '</select>';
}

function mostrarConteudo(html) {
    const conteudo = document.getElementById('conteudo');
    if (conteudo) conteudo.innerHTML = html;
}

function mostrarLoading(mensagem = 'Carregando...') {
    mostrarConteudo(`<div class="card"><p>${mensagem}</p></div>`);
}

function mostrarErro(mensagem) {
    mostrarConteudo(`<div class="card"><h2>Erro</h2><p>${esc(mensagem)}</p></div>`);
}

// ===== TELA DE LOGIN =====
function telaLogin() {
    TELA_ATUAL = 'login';
    const t = document.getElementById('tituloPagina');
    if (t) t.textContent = 'EVOLPEOPLE - Acesso ao Sistema';
    
    mostrarConteudo(`
        <div class="card" style="max-width: 400px; margin: 60px auto;">
            <h2 style="margin-top: 0; text-align: center;">Entrar no Sistema</h2>
            <form class="formulario" onsubmit="return fazerLogin(event)">
                <div class="campo">
                    <label>CPF (apenas números)</label>
                    <input type="text" id="loginCpf" placeholder="000.000.000-00" required pattern="[0-9]{11}" maxlength="11" oninput="this.value=this.value.replace(/\\D/g,'')"/>
                </div>
                <div class="campo">
                    <label>Senha</label>
                    <input type="password" id="loginSenha" required/>
                </div>
                <button type="submit" class="btn btn-destaque" style="width: 100%;">Entrar</button>
            </form>
        </div>
    `);
}

async function fazerLogin(e) {
    e.preventDefault();
    const cpf = document.getElementById('loginCpf').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    
    const res = await api('login', { cpf, senha });
    
    if (!res.sucesso) {
        alert(res.erro || 'Login inválido. Verifique CPF e senha.');
        return false;
    }
    
    USUARIO = res;
    USUARIO.cpf = cpf;
    USUARIO.senha = senha;
    
    if (USUARIO.unidades && USUARIO.unidades.length > 0) {
        UNIDADE_SELECIONADA = USUARIO.unidades[0];
    }
    
    document.getElementById('userName').textContent = USUARIO.nome || 'Usuário';
    document.getElementById('userInfo').style.display = 'flex';
    
    montarMenu();
    
    const itens = MENUS[USUARIO.perfil] || [];
    if (itens.includes('dashboard')) navegarPara('dashboard');
    else if (itens.length > 0) navegarPara(itens[0].id);
    
    return false;
}

function logout() {
    USUARIO = null;
    UNIDADE_SELECIONADA = null;
    TELA_ATUAL = null;
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('menu').innerHTML = '';
    telaLogin();
}

function montarMenu() {
    const menu = document.getElementById('menu');
    if (!menu || !USUARIO) return;
    
    let html = '';
    
    // Seletor de unidade para perfis com múltiplas unidades
    if (['RH', 'DP', 'DIRETORIA', 'SOCIO'].includes(USUARIO.perfil)) {
        let opcoesUnidade = ['TODAS'].concat(UNIDADES_OFICIAIS);
        
        if (USUARIO.perfil === 'SOCIO' && USUARIO.unidades) {
            opcoesUnidade = ['TODAS'].concat(USUARIO.unidades);
        }
        
        const atual = UNIDADE_SELECIONADA || 'TODAS';
        const ops = opcoesUnidade.map(u =>
            `<option value="${esc(u)}" ${u === atual ? 'selected' : ''}>${u === 'TODAS' ? 'Todas as unidades' : esc(u)}</option>`
        ).join('');
        
        html += `
            <div class="campo" style="padding: 4px 12px; background: transparent;">
                <label style="font-size: 11px; color: rgba(255,255,255,0.7);">Unidade</label>
                <select id="seletorUnidade" onchange="trocarUnidade(this.value)" 
                        style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                    ${ops}
                </select>
            </div>
        `;
    }
    
    // Menu de navegação
    const itens = MENUS[USUARIO.perfil] || [];
    itens.forEach(item => {
        html += `<button class="nav-item" data-pagina="${item.id}" onclick="navegarPara('${item.id}')">${item.nome}</button>`;
    });
    
    menu.innerHTML = html;
}

function trocarUnidade(u) {
    UNIDADE_SELECIONADA = (u === 'TODAS' || !u) ? null : u;
    if (TELA_ATUAL && TELA_ATUAL !== 'login') navegarPara(TELA_ATUAL);
}

function navegarPara(pagina) {
    if (!USUARIO) {
        telaLogin();
        return;
    }
    
    TELA_ATUAL = pagina;
    
    // Atualizar item ativo no menu
    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-pagina') === pagina);
    });
    
    // Atualizar título
    const t = document.getElementById('tituloPagina');
    if (t) t.textContent = TITULOS[pagina] || pagina || 'EVOLPEOPLE';
    
    // Renderizar tela correspondente
    switch (pagina) {
        case 'dashboard':
            telaDashboard();
            break;
        case 'admissoesPrevistas':
            telaAdmissoesPrevistas();
            break;
        case 'vagas':
            telaVagas();
            break;
        case 'colaboradores':
            telaColaboradores();
            break;
        case 'testePratico':
            telaTestePratico();
            break;
        case 'treinamentos':
            telaTreinamentos();
            break;
        case 'universidadeEvol':
            telaUniversidadeEvol();
            break;
        case 'feedback':
            telaFeedback();
            break;
        case 'avaliacaoExperiencia':
            telaAvaliacaoExperiencia();
            break;
        case 'escala':
            telaEscala();
            break;
        case 'cargosSalarios':
            telaCargosSalarios();
            break;
        case 'episFardamento':
            telaEpisFardamento();
            break;
        case 'dossie':
            telaDossie();
            break;
        case 'pdi':
            telaPdi();
            break;
        case 'pdiGerar':
            telaPdiGerar();
            break;
        case 'turnoverAbsenteismo':
            telaTurnoverAbsenteismo();
            break;
        case 'sla':
            telaSla();
            break;
        default:
            mostrarConteudo('<div class="card"><h2>Tela não implementada</h2><p>Esta funcionalidade está em desenvolvimento.</p></div>');
    }
}

// ===== DASHBOARD =====
async function telaDashboard() {
    mostrarLoading('Carregando dashboard...');
    
    const params = { cpf: USUARIO.cpf, senha: USUARIO.senha };
    if (UNIDADE_SELECIONADA) params.unidadeFiltro = UNIDADE_SELECIONADA;
    
    const res = await api('dashboardSocio', params);
    
    if (!res.sucesso) {
        mostrarErro(res.erro || 'Erro ao carregar dashboard');
        return;
    }
    
    const d = res.dashboard || {};
    const headPorUnid = d.headcountPorUnidade || {};
    const headTotal = Object.values(headPorUnid).reduce((a, b) => a + b, 0);
    const estoque = d.estoquePorUnidade || {};
    const turnover = d.turnover || { grupo: 0, porUnidade: {} };
    const absenteismo = d.absenteismo || { grupo: 0, porUnidade: {} };
    const slaData = d.slaPorCasa || { meses: [], porCasa: {} };
    const admissoesSemana = d.admissoesPrevistasPorSemana || [];
    
    const vagasArr = d.vagasAbertasPorCargo
        ? Object.entries(d.vagasAbertasPorCargo).map(([c, q]) => ({ cargo: c, qtd: q }))
        : [];
    
    const html = `
        <div class="grid-kpis">
            ${kpiCard('Headcount Total', headTotal)}
            ${kpiCard('Aniversariantes do Mês', (d.aniversariantesDoMes || []).length)}
            ${kpiCard('Projeção Orçamento', formatarMoeda(d.projecaoOrcamento || 0))}
            ${kpiCard('Experiência Vencendo', (d.periodosExperienciaVencendo || []).length)}
            ${kpiCard('Testes Práticos no Mês', (d.testes || {}).totalMes || 0)}
            ${kpiCard('Contratações no Mês', (d.contratacoes || {}).totalMes || 0)}
        </div>
        
        <div class="grid-dashboard">
            <div class="card">
                <h3>Headcount por Unidade</h3>
                ${tabelaSimples(['Unidade', 'Headcount'], Object.entries(headPorUnid).map(([u, q]) => [esc(u), q]))}
            </div>
            
            <div class="card">
                <h3>Aniversariantes do Mês</h3>
                ${(d.aniversariantesDoMes && d.aniversariantesDoMes.length)
                    ? '<ul>' + d.aniversariantesDoMes.map(p => `<li>${esc(p.nome)} — ${esc(p.unidade)} (${esc(p.dataNascimento)})</li>`).join('') + '</ul>'
                    : '<p>Nenhum aniversariante este mês.</p>'}
            </div>
            
            <div class="card">
                <h3>Período de Experiência Vencendo (15 dias)</h3>
                ${(d.periodosExperienciaVencendo && d.periodosExperienciaVencendo.length)
                    ? '<ul>' + d.periodosExperienciaVencendo.map(p => `<li>${esc(p.nome)} - ${esc(p.unidade)} - ${p.periodo} - Vence ${esc(p.dataVencimento)}</li>`).join('') + '</ul>'
                    : '<p>Nenhum período vencendo.</p>'}
            </div>
            
            <div class="card">
                <h3>EPIs & Fardamento por Unidade</h3>
                ${tabelaSimples(['Unidade', 'EPI', 'Fardamento', 'Total'], Object.entries(estoque).map(([u, v]) => [esc(u), v.EPI || 0, v.FARDAMENTO || 0, v.total || 0]))}
            </div>
            
            <div class="card">
                <h3>Turnover</h3>
                <p style="font-size: 24px; font-weight: 700; margin: 4px 0 12px;">Grupo: ${turnover.grupo.toFixed(2)}%</p>
                ${tabelaSimples(['Unidade', 'Turnover %'], Object.entries(turnover.porUnidade).map(([u, p]) => [esc(u), p.toFixed(2) + '%']))}
            </div>
            
            <div class="card">
                <h3>Absenteísmo</h3>
                <p style="font-size: 24px; font-weight: 700; margin: 4px 0 12px;">Grupo: ${absenteismo.grupo.toFixed(2)}%</p>
                ${tabelaSimples(['Unidade', 'Absenteísmo %'], Object.entries(absenteismo.porUnidade).map(([u, p]) => [esc(u), p.toFixed(2) + '%']))}
            </div>
            
            <div class="card">
                <h3>Vagas Abertas por Cargo</h3>
                ${vagasArr.length
                    ? tabelaSimples(['Cargo', 'Vagas', 'Subtotal'], vagasArr.map(v => [esc(v.cargo), v.qtd, formatarMoeda((d.detalheOrcamento || []).find(x => x.cargo === v.cargo)?.subtotal || 0)]))
                    : '<p>Nenhuma vaga aberta.</p>'}
            </div>
            
            <div class="card">
                <h3>Admissões Previstas por Semana</h3>
                ${tabelaSimples(['Semana', 'Admissões'], admissoesSemana.map(s => [esc(s.semana), s.quantidade]))}
            </div>
        </div>
        
        <div class="card">
            <h3>SLA de Vagas por Unidade — Junho a Dezembro</h3>
            ${slaData.meses && slaData.meses
