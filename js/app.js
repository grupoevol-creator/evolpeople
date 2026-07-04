// ===== EVOL PEOPLE — Frontend v8 =====
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby-EYnZaursYaJV5YNCF9bxGEaIBsDp0eHofZfwLfSGE_M2r0oAnSmJgBQDKe5nzBZR/exec';

let USUARIO = null;
let UNIDADE_SELECIONADA = null;
let COLABORADORES_CACHE = [];
let TELA_ATUAL = null;

const MENUS = {
  RH: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','escala','cargosSalarios','episFardamento','dossie'],
  DP: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','escala','cargosSalarios','episFardamento','dossie'],
  DIRETORIA: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','escala','cargosSalarios','episFardamento','dossie'],
  SOCIO: ['vagas','avaliacaoExperiencia','universidadeEvol','escala','cargosSalarios','dashboard','episFardamento','dossie'],
  LIDER: ['testePratico','treinamentos','universidadeEvol','escala','feedback','avaliacaoExperiencia'],
  COLABORADOR: ['dossie','pdi']
};
const TITULOS = {
  dashboard: 'Dashboard', vagas: 'Vagas', colaboradores: 'Colaboradores',
  testePratico: 'Teste Pratico', treinamentos: 'Treinamentos',
  universidadeEvol: 'Universidade Evol', feedback: 'Feedback',
  avaliacaoExperiencia: 'Avaliacao de Experiencia', escala: 'Escala',
  cargosSalarios: 'Cargos & Salarios', episFardamento: 'EPIs & Fardamento',
  dossie: 'Dossie', pdi: 'Meu PDI'
};

async function api(acao, dados) {
  try {
    const body = JSON.stringify({ acao, ...(dados || {}) });
    const r = await fetch(WEBAPP_URL, { method: 'POST', body });
    return await r.json();
  } catch (e) { console.error(e); return { sucesso: false, erro: 'Falha de conexao' }; }
}

function formatarMoeda(v) { const n = Number(v||0); return 'R$ ' + n.toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2}); }
function esc(t) { return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function renderApp(h) { const a = document.getElementById('app'); if (a) a.innerHTML = h; }

function telaLogin() {
  TELA_ATUAL = 'login';
  const t = document.getElementById('tituloPagina'); if (t) t.textContent = 'Evol People - Acesso';
  renderApp('<div class="card" style="max-width:420px;margin:40px auto;">'
    + '<h2 style="margin-top:0;">Entrar no sistema</h2>'
    + '<form class="formulario" onsubmit="return fazerLogin(event)">'
    + '<div class="campo"><label>CPF</label><input type="text" id="loginCpf" required/></div>'
    + '<div class="campo"><label>Senha</label><input type="password" id="loginSenha" required/></div>'
    + '<button type="submit" class="btn btn-destaque" style="width:100%;">Entrar</button>'
    + '</form></div>');
}

async function fazerLogin(e) {
  e.preventDefault();
  const cpf = document.getElementById('loginCpf').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const res = await api('login', { cpf, senha });
  if (!res.sucesso) { alert(res.erro || 'Login invalido'); return false; }
  USUARIO = res;
  USUARIO.cpf = cpf;
  USUARIO.senha = senha;
  if (USUARIO.unidades && USUARIO.unidades.length > 0) UNIDADE_SELECIONADA = USUARIO.unidades[0];
  montarMenu();
  const itens = MENUS[USUARIO.perfil] || [];
  if (itens.includes('dashboard')) navegarPara('dashboard');
  else if (itens.length > 0) navegarPara(itens[0]);
  return false;
}

function montarMenu() {
  const menu = document.getElementById('menu'); if (!menu || !USUARIO) return;
  let html = '';
  if ((USUARIO.perfil === 'SOCIO' || USUARIO.perfil === 'LIDER') && USUARIO.unidades && USUARIO.unidades.length > 1) {
    const ops = USUARIO.unidades.map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
    html += '<div class="campo" style="padding:8px 12px;"><label style="font-size:12px;color:#666;">Unidade</label>'
      + '<select id="seletorUnidade" onchange="trocarUnidade(this.value)">'+ops+'</select></div><hr style="border:none;border-top:1px solid #eee;margin:4px 0;"/>';
  }
  (MENUS[USUARIO.perfil] || []).forEach(chave => {
    html += '<button class="nav-item" data-pagina="'+chave+'" onclick="navegarPara(\''+chave+'\')">'+(TITULOS[chave]||chave)+'</button>';
  });
  menu.innerHTML = html;
}

function trocarUnidade(u) { UNIDADE_SELECIONADA = u; if (TELA_ATUAL && TELA_ATUAL!=='login') navegarPara(TELA_ATUAL); }

function navegarPara(pagina) {
  TELA_ATUAL = pagina;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.getAttribute('data-pagina')===pagina));
  const t = document.getElementById('tituloPagina'); if (t) t.textContent = TITULOS[pagina]||pagina;
  ({
    dashboard: telaDashboard, vagas: telaVagas, colaboradores: telaColaboradores,
    testePratico: telaTestePratico, treinamentos: telaTreinamentos,
    universidadeEvol: telaUniversidadeEvol, feedback: telaFeedback,
    avaliacaoExperiencia: telaAvaliacaoExperiencia, escala: telaEscala,
    cargosSalarios: telaCargosSalarios, episFardamento: telaEpisFardamento,
    dossie: telaDossie, pdi: telaPdi
  }[pagina] || (() => renderApp('<div class="card"><p>Tela nao implementada.</p></div>')))();
}

// ===== DASHBOARD =====
async function telaDashboard() {
  renderApp('<div class="card"><p>Carregando dashboard...</p></div>');
  const params = { cpf: USUARIO.cpf, senha: USUARIO.senha };
  if (USUARIO.perfil === 'SOCIO' && UNIDADE_SELECIONADA) params.unidadeFiltro = UNIDADE_SELECIONADA;
  const res = await api('dashboardSocio', params);
  if (!res.sucesso) { renderApp('<div class="card"><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const d = res.dashboard;
  const vagasArr = d && d.vagasAbertasPorCargo ? Object.entries(d.vagasAbertasPorCargo).map(([c, q]) => ({cargo:c, qtd:q})) : [];
  const headTotal = d && d.headcountPorUnidade ? Object.values(d.headcountPorUnidade).reduce((a,b)=>a+b,0) : 0;
  renderApp(
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:24px 32px;">'
    + '<div class="card"><h3>Headcount</h3><p style="font-size:28px;font-weight:700;">'+headTotal+'</p></div>'
    + '<div class="card"><h3>Aniversariantes</h3><p style="font-size:28px;font-weight:700;">'+(d&&d.aniversariantesDoMes?d.aniversariantesDoMes.length:0)+'</p></div>'
    + '<div class="card"><h3>Projecao Orcamento</h3><p style="font-size:20px;font-weight:700;">'+formatarMoeda(d&&d.projecaoOrcamento?d.projecaoOrcamento:0)+'</p></div>'
    + '<div class="card"><h3>Exp. Vencendo</h3><p style="font-size:28px;font-weight:700;">'+(d&&d.periodosExperienciaVencendo?d.periodosExperienciaVencendo.length:0)+'</p></div>'
    + '</div>'
    + '<div class="card"><h3>Vagas abertas por cargo</h3>'
    + (vagasArr.length
      ? '<table class="tabela"><thead><tr><th>Cargo</th><th>Vagas</th><th>Subtotal</th></tr></thead><tbody>'
        + vagasArr.map(v => '<tr><td>'+esc(v.cargo)+'</td><td>'+v.qtd+'</td><td>'+formatarMoeda((d.detalheOrcamento||[]).find(x=>x.cargo===v.cargo)?.subtotal||0)+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Nenhuma vaga aberta.</p>')
    + '</div>'
    + '<div class="card"><h3>Experiencia vencendo (15 dias)</h3>'
    + (d&&d.periodosExperienciaVencendo&&d.periodosExperienciaVencendo.length
      ? '<ul>'+d.periodosExperienciaVencendo.map(p => '<li>'+esc(p.nome)+' - '+p.periodo+' - vence '+esc(p.dataVencimento)+'</li>').join('')+'</ul>'
      : '<p>Nenhum periodo vencendo.</p>')
    + '</div>'
  );
}

// ===== VAGAS =====
async function telaVagas() {
  renderApp('<div class="card"><p>Carregando vagas...</p></div>');
  const res = await api('listarVagas', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  if (!res.sucesso) { renderApp('<div class="card"><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const vagas = res.vagas || [];
  renderApp('<div class="card">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    + '<h2 style="margin:0;">Vagas</h2>'
    + '<button class="btn btn-destaque" onclick="mostrarFormVaga()">+ Abrir Vaga</button></div>'
    + '<div id="formVagaContainer"></div>'
    + (vagas.length
      ? '<table class="tabela"><thead><tr><th>Vaga</th><th>Unidade</th><th>Setor</th><th>Status</th><th>Candidato</th></tr></thead><tbody>'
        + vagas.map(v => '<tr><td>'+esc(v.vaga)+'</td><td>'+esc(v.unidade)+'</td><td>'+esc(v.setor)+'</td>'
          + '<td><span style="background:'+((v.status||'').toUpperCase()==='ABERTA'||(v.status||'').toUpperCase()==='SELECAO'?'#facc15':'#22c55e')+';padding:2px 8px;border-radius:6px;font-size:12px;">'+esc(v.status)+'</span></td>'
          + '<td>'+esc(v.candidato||'-')+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Nenhuma vaga.</p>')
    + '</div>');
}

function mostrarFormVaga() {
  const c = document.getElementById('formVagaContainer'); if (!c) return;
  c.innerHTML = '<div class="card" style="margin-top:16px;"><h3>Nova Vaga</h3>'
    + '<form class="formulario" onsubmit="return salvarVaga(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Vaga</label><input type="text" id="vagaTitulo" required/></div>'
    + '<div class="campo"><label>Setor</label><input type="text" id="vagaSetor" required/></div>'
    + '<div class="campo"><label>Unidade</label><input type="text" id="vagaUnidade" value="'+esc(UNIDADE_SELECIONADA||'')+'" required/></div>'
    + '<div class="campo"><label>Gestor</label><input type="text" id="vagaGestor"/></div>'
    + '<div class="campo"><label>Motivo</label><input type="text" id="vagaMotivo"/></div>'
    + '</div>'
    + '<button type="submit" class="btn btn-destaque">Salvar Vaga</button>'
    + '<button type="button" class="btn btn-secundario" onclick="this.closest(\'.card\').remove()">Cancelar</button>'
    + '</form></div>';
}

async function salvarVaga(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    vaga: document.getElementById('vagaTitulo').value.trim(),
    setor: document.getElementById('vagaSetor').value.trim(),
    unidade: document.getElementById('vagaUnidade').value.trim(),
    gestor: document.getElementById('vagaGestor').value.trim(),
    motivo: document.getElementById('vagaMotivo').value.trim()
  };
  const res = await api('salvarVaga', dados);
  if (res.sucesso) { alert('Vaga aberta!'); navegarPara('vagas'); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== COLABORADORES =====
async function telaColaboradores() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarColaboradores', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  if (!res.sucesso) { renderApp('<div class="card"><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const cols = res.dados || [];
  renderApp('<div class="card"><h2>Colaboradores</h2>'
    + (cols.length
      ? '<table class="tabela"><thead><tr><th>ID</th><th>Nome</th><th>Funcao</th><th>Unidade</th><th>Admissao</th></tr></thead><tbody>'
        + cols.map(l => '<tr><td>'+esc(l[0])+'</td><td>'+esc(l[1])+'</td><td>'+esc(l[2])+'</td><td>'+esc(l[6])+'</td><td>'+esc(l[18]||'')+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Sem colaboradores.</p>')
    + '</div>');
}

// ===== TESTE PRATICO =====
function telaTestePratico() {
  const opsU = (USUARIO.unidades||[UNIDADE_SELECIONADA||'']).map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
  renderApp('<div class="card"><h2>Teste Pratico</h2>'
    + '<form class="formulario" onsubmit="return salvarTestePratico(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Candidato</label><input type="text" id="tpCandidato" required/></div>'
    + '<div class="campo"><label>Cargo</label><input type="text" id="tpCargo" onchange="buscarSalarioTP()" placeholder="Ex: COZINHEIRO JR"/></div>'
    + '<div class="campo"><label>Unidade</label><select id="tpUnidade" onchange="buscarSalarioTP()">'+opsU+'</select></div>'
    + '<div class="campo"><label>Salario Fixo</label><input type="text" id="tpFixo" readonly/></div>'
    + '<div class="campo"><label>Complemento</label><input type="text" id="tpCompl" readonly/></div>'
    + '<div class="campo"><label>Salario Total</label><input type="text" id="tpTotal" readonly/></div>'
    + '<div class="campo"><label>Vaga</label><input type="text" id="tpVaga" placeholder="Nome da vaga"/></div>'
    + '<div class="campo"><label>Resultado</label><select id="tpResultado"><option value="APROVADO">APROVADO</option><option value="REPROVADO">REPROVADO</option></select></div>'
    + '</div><button type="submit" class="btn btn-destaque">Salvar Teste Pratico</button></form></div>');
}

async function buscarSalarioTP() {
  const cargo = document.getElementById('tpCargo').value.trim();
  const unidade = document.getElementById('tpUnidade').value;
  if (!cargo || !unidade) return;
  const res = await api('buscarSalarioCargo', { cpf: USUARIO.cpf, senha: USUARIO.senha, cargo, tabela: unidade });
  if (res.sucesso && res.salario) {
    document.getElementById('tpFixo').value = formatarMoeda(res.salario.fixo);
    document.getElementById('tpCompl').value = formatarMoeda(res.salario.compl);
    document.getElementById('tpTotal').value = formatarMoeda(res.salario.total);
  } else {
    document.getElementById('tpFixo').value = ''; document.getElementById('tpCompl').value = ''; document.getElementById('tpTotal').value = '';
    if (confirm('Salario nao encontrado para '+cargo+' em '+unidade+'. Cadastrar agora?')) {
      const f = prompt('Salario fixo (R$):'); if (!f) return;
      const c = prompt('Complemento (R$):') || 0;
      const r2 = await api('cadastrarSalarioCargo', { cpf: USUARIO.cpf, senha: USUARIO.senha, cargo, tabela: unidade, fixo: Number(f), compl: Number(c) });
      if (r2.sucesso) { document.getElementById('tpFixo').value = formatarMoeda(f); document.getElementById('tpCompl').value = formatarMoeda(c); document.getElementById('tpTotal').value = formatarMoeda(Number(f)+Number(c)); alert('Salario cadastrado!'); }
      else alert(r2.erro || 'Erro');
    }
  }
}

async function salvarTestePratico(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    candidato: document.getElementById('tpCandidato').value.trim(),
    vaga: document.getElementById('tpVaga').value.trim(),
    unidade: document.getElementById('tpUnidade').value,
    criterios: '', nota: '', recomendacao: document.getElementById('tpResultado').value
  };
  const res = await api('salvarTeste', dados);
  if (res.sucesso) { alert(dados.recomendacao === 'APROVADO' ? 'Teste salvo! Vaga encerrada automaticamente.' : 'Teste salvo!'); telaTestePratico(); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== ESCALA =====
async function telaEscala() {
  renderApp('<div class="card"><p>Carregando equipe...</p></div>');
  const res = await api('listarEquipe', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  if (!res.sucesso) { renderApp('<div class="card"><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const equipe = res.equipe || [];
  const checks = equipe.map(c => '<label class="check-card"><input type="checkbox" class="chkEscala" value="'+esc(c.nome)+'"/>'+esc(c.nome)+'</label>').join('');
  renderApp('<div class="card"><h2>Escala</h2>'
    + '<form class="formulario" onsubmit="return gerarEscalas(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Tipo</label><select id="escTipo"><option value="6X1">6X1</option><option value="12X36">12X36</option><option value="5X2">5X2</option></select></div>'
    + '<div class="campo"><label>Inicio</label><input type="date" id="escInicio" required/></div>'
    + '<div class="campo"><label>Dias</label><input type="number" id="escDias" value="30" min="1"/></div>'
    + '</div><h3>Colaboradores</h3>'
    + '<div class="check-grid">'+(checks||'<p>Nenhum colaborador disponivel.</p>')+'</div>'
    + '<button type="submit" class="btn btn-destaque">Gerar Escala</button></form>'
    + '<div id="escResultado"></div></div>');
}

function gerarPadraoEscala(tipo, inicioStr, dias) {
  const r = []; const ini = new Date(inicioStr+'T00:00:00'); if (isNaN(ini.getTime())) return r;
  for (let i = 0; i < dias; i++) {
    const d = new Date(ini); d.setDate(ini.getDate()+i); let trab = true;
    if (tipo === '6X1') trab = (i % 7) !== 6;
    else if (tipo === '12X36') trab = (i % 2) === 0;
    else if (tipo === '5X2') { const ds = d.getDay(); trab = ds >= 1 && ds <= 5; }
    r.push({ data: d.toISOString().slice(0,10), status: trab ? 'TRABALHO' : 'FOLGA' });
  }
  return r;
}

async function gerarEscalas(e) {
  e.preventDefault();
  const tipo = document.getElementById('escTipo').value;
  const inicio = document.getElementById('escInicio').value;
  const dias = parseInt(document.getElementById('escDias').value,10)||30;
  const selec = Array.from(document.querySelectorAll('.chkEscala:checked')).map(el => el.value);
  if (!selec.length) { alert('Selecione ao menos 1 colaborador.'); return false; }
  const padrao = gerarPadraoEscala(tipo, inicio, dias);
  document.getElementById('escResultado').innerHTML = '<p>Gerando...</p>';
  let ok = 0, err = 0;
  for (const nome of selec) {
    const r = await api('salvarEscala', { cpf: USUARIO.cpf, senha: USUARIO.senha, colaborador: nome, tipo, dias: padrao, unidade: UNIDADE_SELECIONADA });
    if (r.sucesso) ok++; else err++;
  }
  document.getElementById('escResultado').innerHTML = '<p>'+ok+' sucesso(s), '+err+' erro(s).</p>';
  return false;
}

// ===== FEEDBACK =====
async function telaFeedback() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarEquipe', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const equipe = (res.sucesso ? res.equipe : []) || [];
  const ops = equipe.map(c => '<option value="'+esc(c.nome)+'">'+esc(c.nome)+'</option>').join('');
  renderApp('<div class="card"><h2>Feedback</h2>'
    + '<form class="formulario" onsubmit="return salvarFeedback(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Modelo</label><select id="fbModelo" onchange="trocarModeloFB()">'
    + '<option value="90dias">Feedback 90 dias</option><option value="trimestral">Desempenho Trimestral</option>'
    + '<option value="lideranca">Feedback de Lideranca</option><option value="pontual">Feedback Pontual</option></select></div>'
    + '<div class="campo"><label>Colaborador</label><select id="fbColab">'+ops+'</select></div></div>'
    + '<div id="fbCampos"></div>'
    + '<button type="submit" class="btn btn-destaque">Salvar Feedback</button></form></div>');
  trocarModeloFB();
}

function trocarModeloFB() {
  const m = document.getElementById('fbModelo').value;
  const div = document.getElementById('fbCampos'); if (!div) return;
  const map = {
    '90dias': '<div class="grid-form"><div class="campo"><label>Adaptacao</label><textarea id="fb1"></textarea></div><div class="campo"><label>Comunicacao</label><textarea id="fb2"></textarea></div><div class="campo"><label>Pontualidade</label><textarea id="fb3"></textarea></div></div>',
    'trimestral': '<div class="grid-form"><div class="campo"><label>Metas</label><textarea id="fb1"></textarea></div><div class="campo"><label>Resultados</label><textarea id="fb2"></textarea></div><div class="campo"><label>Melhorias</label><textarea id="fb3"></textarea></div></div>',
    'lideranca': '<div class="grid-form"><div class="campo"><label>Visao Estrategica</label><textarea id="fb1"></textarea></div><div class="campo"><label>Gestao de Pessoas</label><textarea id="fb2"></textarea></div></div>',
    'pontual': '<div class="campo"><label>Texto Livre</label><textarea id="fb1"></textarea></div>'
  };
  div.innerHTML = map[m] || '';
}

async function salvarFeedback(e) {
  e.preventDefault();
  const modelo = document.getElementById('fbModelo').value;
  const pts = []; ['fb1','fb2','fb3'].forEach(id => { const el = document.getElementById(id); if (el) pts.push(el.value); });
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    colaborador: document.getElementById('fbColab').value, tipo: modelo,
    pontosFortes: pts[0]||'', pontosMelhoria: pts[1]||'', acordos: pts[2]||'',
    unidade: UNIDADE_SELECIONADA
  };
  const res = await api('salvarFeedback', dados);
  if (res.sucesso) { alert('Feedback salvo!'); navegarPara('feedback'); }
  else alert(res.erro || 'Erro. Lembrando: lider so pode dar feedback aos proprios liderados.');
  return false;
}

// ===== TREINAMENTOS =====
function telaTreinamentos() {
  const opsU = (USUARIO.unidades||[UNIDADE_SELECIONADA||'']).map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
  renderApp('<div class="card"><h2>Treinamentos</h2>'
    + '<form class="formulario" onsubmit="return salvarTreinamento(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Titulo</label><input type="text" id="trTitulo" required/></div>'
    + '<div class="campo"><label>Carga Horaria (h)</label><input type="number" id="trCarga" step="0.5" required/></div>'
    + '<div class="campo"><label>Data</label><input type="date" id="trData" required/></div>'
    + '<div class="campo"><label>Participantes</label><input type="text" id="trPart" placeholder="Separados por virgula"/></div>'
    + '<div class="campo"><label>Unidade</label><select id="trUnidade">'+opsU+'</select></div>'
    + '</div><button type="submit" class="btn btn-destaque">Salvar Treinamento</button></form></div>');
}

async function salvarTreinamento(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    treinamento: document.getElementById('trTitulo').value.trim(),
    cargaHoraria: document.getElementById('trCarga').value,
    dataTreinamento: document.getElementById('trData').value,
    colaborador: document.getElementById('trPart').value,
    unidade: document.getElementById('trUnidade').value
  };
  const res = await api('salvarTreinamento', dados);
  if (res.sucesso) { alert('Treinamento salvo!'); navegarPara('treinamentos'); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== UNIVERSIDADE EVOL =====
function telaUniversidadeEvol() {
  const ctx = USUARIO.perfil === 'LIDER' ? 'Academia de Lideres' : 'Academias';
  renderApp('<div class="card"><h2>Universidade Evol - '+esc(ctx)+'</h2><p>Trilhas de desenvolvimento disponiveis.</p>'
    + '<div class="grid-form">'
    + '<div class="card"><h3>Trilha Operacional</h3><p>Rotinas e processos.</p></div>'
    + '<div class="card"><h3>Trilha Lideranca</h3><p>Gestao de pessoas.</p></div>'
    + '<div class="card"><h3>Trilha Tecnica</h3><p>Especializacao.</p></div>'
    + '</div></div>');
}

// ===== AVALIACAO EXPERIENCIA =====
async function telaAvaliacaoExperiencia() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarEquipe', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const eq = (res.sucesso ? res.equipe : []) || [];
  const ops = eq.map(c => '<option value="'+esc(c.nome)+'">'+esc(c.nome)+'</option>').join('');
  renderApp('<div class="card"><h2>Avaliacao de Experiencia</h2>'
    + '<form class="formulario" onsubmit="return salvarAvaliacaoExp(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Colaborador</label><select id="aeColab">'+ops+'</select></div>'
    + '<div class="campo"><label>Periodo</label><select id="aePeriodo"><option value="45">45 dias</option><option value="90">90 dias</option></select></div>'
    + '<div class="campo"><label>Resultado</label><select id="aeResultado"><option value="APROVADO">Aprovado</option><option value="PRORROGACAO">Prorrogacao</option><option value="NAO APROVADO">Nao Aprovado</option></select></div>'
    + '</div><div class="campo"><label>Observacoes</label><textarea id="aeObs"></textarea></div>'
    + '<button type="submit" class="btn btn-destaque">Salvar Avaliacao</button></form></div>');
}

async function salvarAvaliacaoExp(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    colaborador: document.getElementById('aeColab').value,
    etapa: document.getElementById('aePeriodo').value,
    resultado: document.getElementById('aeResultado').value,
    observacoes: document.getElementById('aeObs').value,
    unidade: UNIDADE_SELECIONADA
  };
  const res = await api('salvarAvaliacao', dados);
  if (res.sucesso) { alert('Avaliacao salva!'); navegarPara('avaliacaoExperiencia'); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== CARGOS & SALARIOS =====
function telaCargosSalarios() {
  renderApp('<div class="card"><h2>Cargos & Salarios</h2><p>Consulta de tabela de cargos.</p>'
    + '<button class="btn btn-destaque" onclick="carregarTabelaCargos()">Carregar Tabela</button>'
    + '<div id="tabelaCargos"></div></div>');
}

async function carregarTabelaCargos() {
  const div = document.getElementById('tabelaCargos'); if (!div) return;
  div.innerHTML = '<p>Carregando...</p>';
  const res = await api('listarCargos', { cpf: USUARIO.cpf, senha: USUARIO.senha });
  if (!res.sucesso) { div.innerHTML = '<p>Erro: '+esc(res.erro||'')+'</p>'; return; }
  const cargos = res.cargos || [];
  div.innerHTML = cargos.length
    ? '<table class="tabela"><thead><tr><th>Cargo</th><th>Tabela</th><th>Fixo</th><th>Complemento</th><th>Total</th></tr></thead><tbody>'
      + cargos.map(c => '<tr><td>'+esc(c.nome)+'</td><td>'+esc(c.tabela)+'</td><td>'+formatarMoeda(c.fixo)+'</td><td>'+formatarMoeda(c.compl)+'</td><td>'+formatarMoeda(c.fixo+c.compl)+'</td></tr>').join('')
      + '</tbody></table>'
    : '<p>Nenhum cargo cadastrado.</p>';
}

// ===== EPIS & FARDAMENTO =====
function telaEpisFardamento() { renderApp('<div class="card"><h2>EPIs & Fardamento</h2><p>Consulte na tela de Estoque (RH).</p></div>'); }

// ===== DOSSIÊ =====
function telaDossie() {
  renderApp('<div class="card"><h2>Dossie</h2><div class="grid-form">'
    + '<div class="campo"><label>Nome</label><p>'+esc(USUARIO.nome||'')+'</p></div>'
    + '<div class="campo"><label>Perfil</label><p>'+esc(USUARIO.perfil||'')+'</p></div>'
    + '<div class="campo"><label>Unidade(s)</label><p>'+esc((USUARIO.unidades||[]).join(', '))+'</p></div>'
    + '</div></div>');
}

// ===== PDI =====
function telaPdi() {
  renderApp('<div class="card"><h2>Meu PDI</h2>'
    + '<form class="formulario" onsubmit="return false;">'
    + '<div class="campo"><label>Objetivo</label><input type="text"/></div>'
    + '<div class="campo"><label>Acoes</label><textarea></textarea></div>'
    + '<div class="campo"><label>Prazo</label><input type="date"/></div>'
    + '<button type="button" class="btn btn-destaque" onclick="alert(\'Funcionalidade em desenvolvimento.\')">Salvar PDI</button>'
    + '</form></div>');
}

// ===== INIT =====
(function init() { if (!USUARIO) telaLogin(); })();
