// ===== EVOL PEOPLE — Frontend v9.0 =====
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby-EYnZaursYaJV5YNCF9bxGEaIBsDp0eHofZfwLfSGE_M2r0oAnSmJgBQDKe5nzBZR/exec';

let USUARIO = null;
let UNIDADE_SELECIONADA = null;
let COLABORADORES_CACHE = [];
let TELA_ATUAL = null;
let SALARIO_TP_TOTAL = null; // salario total (fixo+compl) consultado no Teste Pratico
let CHART_SLA = null; // instancia do grafico de SLA (Chart.js) para poder destruir/redesenhar

const MENUS = {
  RH: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','pdiGerar','escala','cargosSalarios','episFardamento','turnoverAbsenteismo','sla','admissoesPrevistas','dossie'],
  DP: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','pdiGerar','escala','cargosSalarios','episFardamento','turnoverAbsenteismo','sla','admissoesPrevistas','dossie'],
  DIRETORIA: ['dashboard','vagas','colaboradores','testePratico','treinamentos','universidadeEvol','feedback','avaliacaoExperiencia','escala','cargosSalarios','episFardamento','turnoverAbsenteismo','sla','admissoesPrevistas','dossie'],
  SOCIO: ['dashboard','vagas','testePratico','treinamentos','feedback','avaliacaoExperiencia','pdiGerar','escala','cargosSalarios','universidadeEvol','episFardamento','turnoverAbsenteismo','sla','admissoesPrevistas','dossie'],
  LIDER: ['testePratico','treinamentos','universidadeEvol','escala','feedback','avaliacaoExperiencia','pdiGerar'],
  COLABORADOR: ['dossie','pdi']
};
const TITULOS = {
  dashboard: 'Dashboard', vagas: 'Vagas', colaboradores: 'Colaboradores',
  testePratico: 'Teste Pratico', treinamentos: 'Treinamentos',
  universidadeEvol: 'Universidade Evol', feedback: 'Feedback',
  avaliacaoExperiencia: 'Avaliacao de Experiencia', escala: 'Escala',
  cargosSalarios: 'Cargos & Salarios', episFardamento: 'EPIs & Fardamento',
  dossie: 'Dossie', pdi: 'Meu PDI', pdiGerar: 'PDI - Liderados',
  turnoverAbsenteismo: 'Turnover & Absenteismo', sla: 'SLA de Vagas',
  admissoesPrevistas: 'Admissoes Previstas'
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
    dossie: telaDossie, pdi: telaPdi, pdiGerar: telaPdiGerar,
    turnoverAbsenteismo: telaTurnoverAbsenteismo, sla: telaSla,
    admissoesPrevistas: telaAdmissoesPrevistas
  }[pagina] || (() => renderApp('<div class="card"><p>Tela nao implementada.</p></div>')))();
}

// ===== DASHBOARD =====
async function telaDashboard() {
  renderApp('<div class="card"><p>Carregando dashboard...</p></div>');
  const params = { cpf: USUARIO.cpf, senha: USUARIO.senha };
  if (USUARIO.perfil === 'SOCIO' && UNIDADE_SELECIONADA) params.unidadeFiltro = UNIDADE_SELECIONADA;
  const res = await api('dashboardSocio', params);
  if (!res.sucesso) { renderApp('<div class="card"><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const d = res.dashboard || {};
  const vagasArr = d.vagasAbertasPorCargo ? Object.entries(d.vagasAbertasPorCargo).map(([c, q]) => ({cargo:c, qtd:q})) : [];
  const headPorUnid = d.headcountPorUnidade || {};
  const headTotal = Object.values(headPorUnid).reduce((a,b)=>a+b,0);
  const estoque = d.estoquePorUnidade || {};
  const turnover = d.turnover || { grupo: 0, porUnidade: {}, porUnidadeSetor: {} };
  const absenteismo = d.absenteismo || { grupo: 0, porUnidade: {}, porUnidadeSetor: {} };
  const slaData = d.slaPorCasa || { meses: [], porCasa: {} };
  const testes = d.testes || { totalMes: 0, totalGeral: 0 };
  const admissoesSemana = d.admissoesPrevistasPorSemana || [];
  const contratacoes = d.contratacoes || { totalMes: 0, totalGeral: 0 };

  renderApp(
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin:24px 32px 8px;">'
    + kpiCard('Headcount total', headTotal)
    + kpiCard('Aniversariantes no mes', (d.aniversariantesDoMes||[]).length)
    + kpiCard('Projecao de Orcamento (vagas)', formatarMoeda(d.projecaoOrcamento||0), true)
    + kpiCard('Exp. vencendo (15 dias)', (d.periodosExperienciaVencendo||[]).length)
    + kpiCard('Testes praticos no mes', testes.totalMes)
    + kpiCard('Contratacoes no mes', contratacoes.totalMes)
    + '</div>'

    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin:0 32px 16px;">'

    + '<div class="card"><h3>Headcount por casa</h3>'
    + tabelaSimples(['Casa','Headcount'], Object.entries(headPorUnid).map(([u,q])=>[esc(u), q]))
    + '</div>'

    + '<div class="card"><h3>Aniversariantes do mes</h3>'
    + (d.aniversariantesDoMes && d.aniversariantesDoMes.length
      ? '<ul>'+d.aniversariantesDoMes.map(p => '<li>'+esc(p.nome)+' — '+esc(p.unidade)+' ('+esc(p.dataNascimento)+')</li>').join('')+'</ul>'
      : '<p>Nenhum aniversariante este mes.</p>')
    + '</div>'

    + '<div class="card"><h3>Periodo de experiencia vencendo (15 dias)</h3>'
    + (d.periodosExperienciaVencendo && d.periodosExperienciaVencendo.length
      ? '<ul>'+d.periodosExperienciaVencendo.map(p => '<li>'+esc(p.nome)+' - '+esc(p.unidade)+' - '+p.periodo+' - vence '+esc(p.dataVencimento)+'</li>').join('')+'</ul>'
      : '<p>Nenhum periodo vencendo.</p>')
    + '</div>'

    + '<div class="card"><h3>EPIs & Fardamento por casa</h3>'
    + tabelaSimples(['Casa','EPI','Fardamento','Total'], Object.entries(estoque).map(([u,v])=>[esc(u), v.EPI||0, v.FARDAMENTO||0, v.total||0]))
    + '</div>'

    + '<div class="card"><h3>Turnover'+(turnover.mesReferencia?' — '+esc(turnover.mesReferencia):'')+'</h3>'
    + '<p style="font-size:22px;font-weight:700;margin:4px 0 12px;">Grupo: '+turnover.grupo.toFixed(2)+'%</p>'
    + tabelaSimples(['Casa','Turnover %'], Object.entries(turnover.porUnidade).map(([u,p])=>[esc(u), p.toFixed(2)+'%']))
    + '</div>'

    + '<div class="card"><h3>Absenteismo'+(absenteismo.mesReferencia?' — '+esc(absenteismo.mesReferencia):'')+'</h3>'
    + '<p style="font-size:22px;font-weight:700;margin:4px 0 12px;">Grupo: '+absenteismo.grupo.toFixed(2)+'%</p>'
    + tabelaSimples(['Casa','Absenteismo %'], Object.entries(absenteismo.porUnidade).map(([u,p])=>[esc(u), p.toFixed(2)+'%']))
    + '</div>'

    + '<div class="card"><h3>Vagas abertas por cargo</h3>'
    + (vagasArr.length
      ? '<table class="tabela"><thead><tr><th>Cargo</th><th>Vagas</th><th>Subtotal</th></tr></thead><tbody>'
        + vagasArr.map(v => '<tr><td>'+esc(v.cargo)+'</td><td>'+v.qtd+'</td><td>'+formatarMoeda((d.detalheOrcamento||[]).find(x=>x.cargo===v.cargo)?.subtotal||0)+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Nenhuma vaga aberta.</p>')
    + '</div>'

    + '<div class="card"><h3>Admissoes previstas por semana</h3>'
    + tabelaSimples(['Semana','Admissoes previstas'], admissoesSemana.map(s=>[esc(s.semana), s.quantidade]))
    + '</div>'

    + '</div>'

    + '<div class="card" style="margin:0 32px 24px;"><h3>SLA de vagas por casa — Junho a Dezembro</h3>'
    + '<canvas id="graficoSla" height="90"></canvas>'
    + '</div>'
  );

  desenharGraficoSla(slaData);
}

function kpiCard(titulo, valor, destaque) {
  return '<div class="card"><h3>'+esc(titulo)+'</h3><p style="font-size:'+(destaque?'20px':'28px')+';font-weight:700;">'+valor+'</p></div>';
}
function tabelaSimples(cabecalhos, linhas) {
  if (!linhas.length) return '<p>Sem dados registrados ainda.</p>';
  return '<table class="tabela"><thead><tr>'+cabecalhos.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'
    + linhas.map(l => '<tr>'+l.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')
    + '</tbody></table>';
}
function desenharGraficoSla(slaData) {
  const canvas = document.getElementById('graficoSla');
  if (!canvas || typeof Chart === 'undefined') return;
  if (CHART_SLA) { CHART_SLA.destroy(); CHART_SLA = null; }
  const meses = slaData.meses || [];
  const casas = Object.keys(slaData.porCasa || {});
  if (!casas.length) { canvas.parentElement.insertAdjacentHTML('beforeend', '<p>Nenhum SLA cadastrado ainda. Use a tela "SLA de Vagas" para alimentar mes a mes (Junho a Dezembro).</p>'); return; }
  const cores = ['#e07b39','#1b2a4a','#c0522f','#3d6b8a','#8a7d3d','#5a8a5a','#a35a8a'];
  const datasets = casas.map((c,i) => ({
    label: c,
    data: meses.map(m => (slaData.porCasa[c] && slaData.porCasa[c][m]) || null),
    borderColor: cores[i % cores.length], backgroundColor: cores[i % cores.length],
    tension: 0.25, spanGaps: true
  }));
  CHART_SLA = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels: meses.map(m => m.charAt(0)+m.slice(1).toLowerCase()), datasets: datasets },
    options: { responsive: true, scales: { y: { min: 0, max: 100, ticks: { callback: v => v+'%' } } } }
  });
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
  SALARIO_TP_TOTAL = null;
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
    + '<div class="campo"><label>Dias de Teste</label><input type="number" id="tpDias" value="1" min="1" oninput="calcularValorTesteTP()"/></div>'
    + '<div class="campo"><label>Valor Teste (se Reprovado)</label><input type="text" id="tpValorTeste" readonly placeholder="(Salario+Compl)/30 x dias"/></div>'
    + '<div class="campo"><label>Vaga</label><input type="text" id="tpVaga" placeholder="Nome da vaga"/></div>'
    + '<div class="campo"><label>Resultado</label><select id="tpResultado" onchange="calcularValorTesteTP()"><option value="APROVADO">APROVADO</option><option value="REPROVADO">REPROVADO</option></select></div>'
    + '</div><button type="submit" class="btn btn-destaque">Salvar Teste Pratico</button></form></div>');
}

// Valor do teste nao aprovado = (salario fixo + complemento) / 30 x dias de teste
function calcularValorTesteTP() {
  const campo = document.getElementById('tpValorTeste'); if (!campo) return;
  const dias = parseInt((document.getElementById('tpDias')||{value:0}).value, 10) || 0;
  if (SALARIO_TP_TOTAL === null || dias <= 0) { campo.value = ''; return; }
  campo.value = formatarMoeda((SALARIO_TP_TOTAL / 30) * dias);
}

async function buscarSalarioTP() {
  const cargo = document.getElementById('tpCargo').value.trim();
  const unidade = document.getElementById('tpUnidade').value;
  if (!cargo || !unidade) return;
  const res = await api('buscarSalarioCargo', { cpf: USUARIO.cpf, senha: USUARIO.senha, cargo, tabela: unidade });
  if (res.sucesso && res.salario) {
    SALARIO_TP_TOTAL = Number(res.salario.total) || 0;
    document.getElementById('tpFixo').value = formatarMoeda(res.salario.fixo);
    document.getElementById('tpCompl').value = formatarMoeda(res.salario.compl);
    document.getElementById('tpTotal').value = formatarMoeda(res.salario.total);
    calcularValorTesteTP();
  } else {
    SALARIO_TP_TOTAL = null;
    document.getElementById('tpFixo').value = ''; document.getElementById('tpCompl').value = ''; document.getElementById('tpTotal').value = '';
    calcularValorTesteTP();
    if (confirm('Salario nao encontrado para '+cargo+' em '+unidade+'. Cadastrar agora?')) {
      const f = prompt('Salario fixo (R$):'); if (!f) return;
      const c = prompt('Complemento (R$):') || 0;
      const r2 = await api('cadastrarSalarioCargo', { cpf: USUARIO.cpf, senha: USUARIO.senha, cargo, tabela: unidade, fixo: Number(f), compl: Number(c) });
      if (r2.sucesso) {
        SALARIO_TP_TOTAL = (Number(f)||0) + (Number(c)||0);
        document.getElementById('tpFixo').value = formatarMoeda(f); document.getElementById('tpCompl').value = formatarMoeda(c); document.getElementById('tpTotal').value = formatarMoeda(Number(f)+Number(c));
        calcularValorTesteTP();
        alert('Salario cadastrado!');
      }
      else alert(r2.erro || 'Erro');
    }
  }
}

async function salvarTestePratico(e) {
  e.preventDefault();
  const resultado = document.getElementById('tpResultado').value;
  const dias = parseInt(document.getElementById('tpDias').value, 10) || 0;
  let criterios = '';
  if (resultado === 'REPROVADO' && SALARIO_TP_TOTAL !== null && dias > 0) {
    criterios = 'Dias de teste: ' + dias + ' | Valor teste reprovado: ' + formatarMoeda((SALARIO_TP_TOTAL / 30) * dias);
  }
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    candidato: document.getElementById('tpCandidato').value.trim(),
    vaga: document.getElementById('tpVaga').value.trim(),
    unidade: document.getElementById('tpUnidade').value,
    criterios: criterios, nota: '', recomendacao: resultado
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
let CARGOS_CACHE = [];

async function telaCargosSalarios() {
  renderApp('<div class="card"><p>Carregando tabela de cargos...</p></div>');
  const res = await api('listarCargos', { cpf: USUARIO.cpf, senha: USUARIO.senha });
  if (!res.sucesso) { renderApp('<div class="card"><h2>Cargos & Salarios</h2><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  CARGOS_CACHE = res.cargos || [];
  const tabelas = Array.from(new Set(CARGOS_CACHE.map(c => c.tabela))).sort();
  // Entra automaticamente na tabela da unidade selecionada, se existir
  const uSel = String(UNIDADE_SELECIONADA||'').toUpperCase().trim();
  const tabelaInicial = (uSel && tabelas.indexOf(uSel) !== -1) ? uSel : 'TODAS';
  const ops = ['TODAS'].concat(tabelas).map(t =>
    '<option value="'+esc(t)+'" '+(t===tabelaInicial?'selected':'')+'>'+esc(t)+'</option>').join('');
  renderApp('<div class="card"><h2>Cargos & Salarios</h2>'
    + '<div class="campo" style="max-width:320px;"><label>Tabela / Unidade</label>'
    + '<select id="selTabelaCargos" onchange="filtrarCargos(this.value)">'+ops+'</select></div>'
    + '<div id="tabelaCargos"></div></div>');
  filtrarCargos(tabelaInicial);
}

function filtrarCargos(tab) {
  const div = document.getElementById('tabelaCargos'); if (!div) return;
  const lista = tab === 'TODAS' ? CARGOS_CACHE : CARGOS_CACHE.filter(c => c.tabela === tab);
  div.innerHTML = lista.length
    ? '<table class="tabela"><thead><tr><th>Cargo</th><th>Tabela</th><th>Fixo</th><th>Complemento</th><th>Total</th></tr></thead><tbody>'
      + lista.map(c => '<tr><td>'+esc(c.nome)+'</td><td>'+esc(c.tabela)+'</td><td>'+formatarMoeda(c.fixo)+'</td><td>'+formatarMoeda(c.compl)+'</td><td>'+formatarMoeda(c.fixo+c.compl)+'</td></tr>').join('')
      + '</tbody></table>'
    : '<p>Nenhum cargo cadastrado'+(tab!=='TODAS' ? ' para a tabela '+esc(tab)+'. Dica: cargos sem tabela propria usam a tabela PADRAO.' : '.')+'</p>';
}

// ===== EPIS & FARDAMENTO =====
async function telaEpisFardamento() {
  if (!['RH','SOCIO','DIRETORIA'].includes(USUARIO.perfil)) {
    renderApp('<div class="card"><h2>EPIs & Fardamento</h2><p>Consulte o RH da sua unidade.</p></div>');
    return;
  }
  renderApp('<div class="card"><p>Carregando estoque...</p></div>');
  const res = await api('listarEstoque', { cpf: USUARIO.cpf, senha: USUARIO.senha });
  if (!res.sucesso) { renderApp('<div class="card"><h2>EPIs & Fardamento</h2><p>Erro: '+esc(res.erro||'')+'</p></div>'); return; }
  const itens = res.itens || [];
  renderApp('<div class="card"><h2>EPIs & Fardamento — Estoque</h2>'
    + (itens.length
      ? '<table class="tabela"><thead><tr><th>Tipo</th><th>Item</th><th>Tamanho</th><th>Unidade</th><th>Quantidade</th></tr></thead><tbody>'
        + itens.map(l => '<tr><td>'+esc(l[1])+'</td><td>'+esc(l[2])+'</td><td>'+esc(l[3])+'</td><td>'+esc(l[4])+'</td><td>'+esc(l[5])+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Nenhum item cadastrado no estoque.</p>')
    + '</div>');
}

// ===== DOSSIE =====
function telaDossie() {
  renderApp('<div class="card"><h2>Dossie</h2><div class="grid-form">'
    + '<div class="campo"><label>Nome</label><p>'+esc(USUARIO.nome||'')+'</p></div>'
    + '<div class="campo"><label>Perfil</label><p>'+esc(USUARIO.perfil||'')+'</p></div>'
    + '<div class="campo"><label>Unidade(s)</label><p>'+esc((USUARIO.unidades||[]).join(', '))+'</p></div>'
    + '</div></div>');
}

// ===== PDI (visualizacao do colaborador) =====
async function telaPdi() {
  renderApp('<div class="card"><p>Carregando seu PDI...</p></div>');
  const res = await api('listarPdi', { cpf: USUARIO.cpf, senha: USUARIO.senha });
  const registros = (res.sucesso ? res.registros : []) || [];
  renderApp('<div class="card"><h2>Meu PDI - Plano de Desenvolvimento Individual</h2>'
    + (registros.length
      ? registros.map(p => cardPdi(p)).join('')
      : '<p>Voce ainda nao possui um PDI cadastrado. Fale com seu lider ou com o RH.</p>')
    + '</div>');
}
function cardPdi(p) {
  return '<div class="card" style="margin-top:12px;">'
    + '<p><strong>Objetivo:</strong> '+esc(p.objetivo)+'</p>'
    + '<p><strong>Acoes:</strong> '+esc(p.acoes)+'</p>'
    + '<p><strong>Prazo:</strong> '+esc(p.prazo)+' &nbsp;|&nbsp; <strong>Status:</strong> '+esc(p.status)+'</p>'
    + '<p style="font-size:12px;color:#777;">Lider responsavel: '+esc(p.lider)+' — criado em '+esc(p.dataCriacao)+'</p>'
    + '</div>';
}

// ===== PDI (geracao pelo lider/RH/socio) =====
async function telaPdiGerar() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarEquipe', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const equipe = (res.sucesso ? res.equipe : []) || [];
  const resPdi = await api('listarPdi', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const registros = (resPdi.sucesso ? resPdi.registros : []) || [];
  const ops = equipe.map(c => '<option value="'+esc(c.nome)+'" data-id="'+esc(c.id)+'" data-unidade="'+esc(c.unidade)+'">'+esc(c.nome)+'</option>').join('');
  renderApp('<div class="card"><h2>Gerar PDI para liderado</h2>'
    + '<form class="formulario" onsubmit="return salvarPdiGerado(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Colaborador</label><select id="pdiColab">'+ops+'</select></div>'
    + '<div class="campo"><label>Prazo</label><input type="date" id="pdiPrazo" required/></div>'
    + '<div class="campo"><label>Status</label><select id="pdiStatus"><option value="EM ANDAMENTO">Em andamento</option><option value="CONCLUIDO">Concluido</option><option value="ATRASADO">Atrasado</option></select></div>'
    + '</div>'
    + '<div class="campo"><label>Objetivo</label><textarea id="pdiObjetivo" placeholder="Ex: Desenvolver habilidade de lideranca de equipe" required></textarea></div>'
    + '<div class="campo"><label>Acoes / Plano</label><textarea id="pdiAcoes" placeholder="Ex: Participar da trilha de lideranca; receber feedback quinzenal; sombra com gestor de unidade" required></textarea></div>'
    + '<button type="submit" class="btn btn-destaque">Salvar PDI</button></form></div>'
    + '<div class="card" style="margin-top:16px;"><h3>PDIs ja criados</h3>'
    + (registros.length ? registros.map(p => '<div class="card" style="margin-top:8px;"><p><strong>'+esc(p.colaborador)+'</strong> — '+esc(p.status)+' (prazo '+esc(p.prazo)+')</p><p>'+esc(p.objetivo)+'</p></div>').join('') : '<p>Nenhum PDI criado ainda.</p>')
    + '</div>');
}
async function salvarPdiGerado(e) {
  e.preventDefault();
  const sel = document.getElementById('pdiColab');
  const op = sel.options[sel.selectedIndex];
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    colaborador: sel.value, colaboradorId: op ? op.getAttribute('data-id') : '',
    unidade: op ? op.getAttribute('data-unidade') : UNIDADE_SELECIONADA,
    lider: USUARIO.nome, objetivo: document.getElementById('pdiObjetivo').value,
    acoes: document.getElementById('pdiAcoes').value, prazo: document.getElementById('pdiPrazo').value,
    status: document.getElementById('pdiStatus').value
  };
  const res = await api('salvarPdi', dados);
  if (res.sucesso) { alert('PDI salvo!'); navegarPara('pdiGerar'); }
  else alert(res.erro || 'Erro. Lembrando: lider so pode criar PDI para seus liderados diretos.');
  return false;
}

// ===== TURNOVER & ABSENTEISMO (alimentacao mensal, calculo automatico) =====
async function telaTurnoverAbsenteismo() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const [resT, resA] = await Promise.all([
    api('listarTurnover', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA }),
    api('listarAbsenteismo', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA })
  ]);
  const turnovers = (resT.sucesso ? resT.registros : []) || [];
  const absenteismos = (resA.sucesso ? resA.registros : []) || [];
  const opsU = (USUARIO.unidades||[UNIDADE_SELECIONADA||'']).map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
  renderApp('<div class="card"><h2>Turnover & Absenteismo</h2><p>Alimente os numeros brutos por mes/casa/setor — o percentual e calculado automaticamente.</p>'
    + '<div class="grid-form">'

    + '<div class="card"><h3>Alimentar Turnover</h3>'
    + '<form class="formulario" onsubmit="return salvarTurnoverForm(event)">'
    + '<div class="campo"><label>Mes/Competencia</label><input type="month" id="tvMes" required/></div>'
    + '<div class="campo"><label>Unidade (casa)</label><select id="tvUnidade">'+opsU+'</select></div>'
    + '<div class="campo"><label>Setor</label><input type="text" id="tvSetor" placeholder="Ex: Cozinha, Salao, Bar..." required/></div>'
    + '<div class="campo"><label>Admissoes no mes</label><input type="number" id="tvAdmissoes" min="0" required/></div>'
    + '<div class="campo"><label>Demissoes no mes</label><input type="number" id="tvDemissoes" min="0" required/></div>'
    + '<div class="campo"><label>Headcount medio do mes</label><input type="number" id="tvHeadcount" min="0" required/></div>'
    + '<button type="submit" class="btn btn-destaque">Salvar Turnover</button></form></div>'

    + '<div class="card"><h3>Alimentar Absenteismo</h3>'
    + '<form class="formulario" onsubmit="return salvarAbsenteismoForm(event)">'
    + '<div class="campo"><label>Mes/Competencia</label><input type="month" id="abMes" required/></div>'
    + '<div class="campo"><label>Unidade (casa)</label><select id="abUnidade">'+opsU+'</select></div>'
    + '<div class="campo"><label>Setor</label><input type="text" id="abSetor" placeholder="Ex: Cozinha, Salao, Bar..." required/></div>'
    + '<div class="campo"><label>Horas previstas no mes</label><input type="number" id="abHorasPrevistas" min="0" required/></div>'
    + '<div class="campo"><label>Horas de falta no mes</label><input type="number" id="abHorasFalta" min="0" required/></div>'
    + '<button type="submit" class="btn btn-destaque">Salvar Absenteismo</button></form></div>'

    + '</div>'
    + '<div class="card" style="margin-top:16px;"><h3>Historico de Turnover</h3>'
    + tabelaSimples(['Mes','Unidade','Setor','Admissoes','Demissoes','HC medio','Turnover %'], turnovers.map(t=>[esc(t.mes),esc(t.unidade),esc(t.setor),t.admissoes,t.demissoes,t.headcountMedio,t.turnoverPercentual.toFixed(2)+'%']))
    + '</div>'
    + '<div class="card" style="margin-top:16px;"><h3>Historico de Absenteismo</h3>'
    + tabelaSimples(['Mes','Unidade','Setor','Horas previstas','Horas falta','Absenteismo %'], absenteismos.map(a=>[esc(a.mes),esc(a.unidade),esc(a.setor),a.horasPrevistas,a.horasFalta,a.absenteismoPercentual.toFixed(2)+'%']))
    + '</div></div>');
}
function competenciaDoInputMonth(valor) { // 'yyyy-MM' -> 'MM/yyyy'
  const p = String(valor||'').split('-'); return p.length === 2 ? (p[1]+'/'+p[0]) : '';
}
async function salvarTurnoverForm(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    mes: competenciaDoInputMonth(document.getElementById('tvMes').value),
    unidade: document.getElementById('tvUnidade').value,
    setor: document.getElementById('tvSetor').value,
    admissoes: document.getElementById('tvAdmissoes').value,
    demissoes: document.getElementById('tvDemissoes').value,
    headcountMedio: document.getElementById('tvHeadcount').value
  };
  const res = await api('salvarTurnover', dados);
  if (res.sucesso) { alert('Turnover salvo! Percentual calculado: '+res.turnoverPercentual+'%'); navegarPara('turnoverAbsenteismo'); }
  else alert(res.erro || 'Erro');
  return false;
}
async function salvarAbsenteismoForm(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    mes: competenciaDoInputMonth(document.getElementById('abMes').value),
    unidade: document.getElementById('abUnidade').value,
    setor: document.getElementById('abSetor').value,
    horasPrevistas: document.getElementById('abHorasPrevistas').value,
    horasFalta: document.getElementById('abHorasFalta').value
  };
  const res = await api('salvarAbsenteismo', dados);
  if (res.sucesso) { alert('Absenteismo salvo! Percentual calculado: '+res.absenteismoPercentual+'%'); navegarPara('turnoverAbsenteismo'); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== SLA de vagas por casa (Junho a Dezembro) =====
const MESES_SLA_FRONT = ['JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
async function telaSla() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarSla', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const registros = (res.sucesso ? res.registros : []) || [];
  const opsU = (USUARIO.unidades||[UNIDADE_SELECIONADA||'']).map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
  const opsM = MESES_SLA_FRONT.map(m => '<option value="'+m+'">'+m.charAt(0)+m.slice(1).toLowerCase()+'</option>').join('');
  renderApp('<div class="card"><h2>SLA de Vagas por Casa (Junho a Dezembro)</h2>'
    + '<p>Informe o SLA do mes — pode digitar o percentual direto ou a quantidade de vagas dentro do prazo / total (o sistema calcula).</p>'
    + '<form class="formulario" onsubmit="return salvarSlaForm(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Mes</label><select id="slaMes">'+opsM+'</select></div>'
    + '<div class="campo"><label>Unidade (casa)</label><select id="slaUnidade">'+opsU+'</select></div>'
    + '<div class="campo"><label>SLA % (opcional se informar as vagas abaixo)</label><input type="number" id="slaPercentual" step="0.01" min="0" max="100"/></div>'
    + '<div class="campo"><label>Vagas dentro do prazo</label><input type="number" id="slaDentro" min="0"/></div>'
    + '<div class="campo"><label>Total de vagas do mes</label><input type="number" id="slaTotal" min="0"/></div>'
    + '</div><button type="submit" class="btn btn-destaque">Salvar SLA</button></form></div>'
    + '<div class="card" style="margin-top:16px;"><h3>Historico de SLA</h3>'
    + tabelaSimples(['Mes','Unidade','SLA %','Dentro do prazo','Total'], registros.map(r=>[esc(r.mes),esc(r.unidade),r.slaPercentual.toFixed(2)+'%',r.vagasDentroPrazo,r.vagasTotal]))
    + '</div>');
}
async function salvarSlaForm(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    mes: document.getElementById('slaMes').value,
    unidade: document.getElementById('slaUnidade').value,
    slaPercentual: document.getElementById('slaPercentual').value,
    vagasDentroPrazo: document.getElementById('slaDentro').value,
    vagasTotal: document.getElementById('slaTotal').value
  };
  const res = await api('salvarSla', dados);
  if (res.sucesso) { alert('SLA salvo: '+res.slaPercentual+'%'); navegarPara('sla'); }
  else alert(res.erro || 'Erro');
  return false;
}

// ===== ADMISSOES PREVISTAS / CONTRATACOES (DP) =====
async function telaAdmissoesPrevistas() {
  renderApp('<div class="card"><p>Carregando...</p></div>');
  const res = await api('listarAdmissoesPrevistas', { cpf: USUARIO.cpf, senha: USUARIO.senha, unidadeFiltro: UNIDADE_SELECIONADA });
  const registros = (res.sucesso ? res.registros : []) || [];
  const opsU = (USUARIO.unidades||[UNIDADE_SELECIONADA||'']).map(u => '<option value="'+esc(u)+'" '+(u===UNIDADE_SELECIONADA?'selected':'')+'>'+esc(u)+'</option>').join('');
  renderApp('<div class="card"><h2>Admissoes Previstas</h2>'
    + '<form class="formulario" onsubmit="return salvarAdmissaoPrevistaForm(event)">'
    + '<div class="grid-form">'
    + '<div class="campo"><label>Candidato</label><input type="text" id="apCandidato" required/></div>'
    + '<div class="campo"><label>Vaga/Cargo</label><input type="text" id="apVaga" required/></div>'
    + '<div class="campo"><label>Unidade (casa)</label><select id="apUnidade">'+opsU+'</select></div>'
    + '<div class="campo"><label>Setor</label><input type="text" id="apSetor"/></div>'
    + '<div class="campo"><label>Data prevista de admissao</label><input type="date" id="apData" required/></div>'
    + '</div><button type="submit" class="btn btn-destaque">Registrar admissao prevista</button></form></div>'
    + '<div class="card" style="margin-top:16px;"><h3>Admissoes registradas</h3>'
    + (registros.length
      ? '<table class="tabela"><thead><tr><th>Candidato</th><th>Vaga</th><th>Unidade</th><th>Setor</th><th>Prevista</th><th>Status</th><th>Acao</th></tr></thead><tbody>'
        + registros.map(r => '<tr><td>'+esc(r.candidato)+'</td><td>'+esc(r.vaga)+'</td><td>'+esc(r.unidade)+'</td><td>'+esc(r.setor)+'</td><td>'+esc(r.dataPrevistaAdmissao)+'</td><td>'+esc(r.status)+'</td><td>'
          + (r.status === 'PREVISTA' ? '<button type="button" class="btn" onclick="confirmarContratacao(\''+r.id+'\')">Confirmar contratacao</button> <button type="button" class="btn" onclick="cancelarAdmissao(\''+r.id+'\')">Cancelar</button>' : '')
          + '</td></tr>').join('')
        + '</tbody></table>'
      : '<p>Nenhuma admissao prevista registrada.</p>')
    + '</div></div>');
}
function converterDataIsoParaBr(valorIso) { // 'yyyy-MM-dd' -> 'dd/MM/yyyy'
  const p = String(valorIso||'').split('-'); return p.length === 3 ? (p[2]+'/'+p[1]+'/'+p[0]) : '';
}
async function salvarAdmissaoPrevistaForm(e) {
  e.preventDefault();
  const dados = { cpf: USUARIO.cpf, senha: USUARIO.senha,
    candidato: document.getElementById('apCandidato').value,
    vaga: document.getElementById('apVaga').value,
    unidade: document.getElementById('apUnidade').value,
    setor: document.getElementById('apSetor').value,
    dataPrevistaAdmissao: converterDataIsoParaBr(document.getElementById('apData').value)
  };
  const res = await api('salvarAdmissaoPrevista', dados);
  if (res.sucesso) { alert('Admissao prevista registrada!'); navegarPara('admissoesPrevistas'); }
  else alert(res.erro || 'Erro');
  return false;
}
async function confirmarContratacao(id) {
  const res = await api('atualizarAdmissaoPrevista', { cpf: USUARIO.cpf, senha: USUARIO.senha, id, status: 'CONTRATADO' });
  if (res.sucesso) navegarPara('admissoesPrevistas'); else alert(res.erro || 'Erro');
}
async function cancelarAdmissao(id) {
  const res = await api('atualizarAdmissaoPrevista', { cpf: USUARIO.cpf, senha: USUARIO.senha, id, status: 'CANCELADA' });
  if (res.sucesso) navegarPara('admissoesPrevistas'); else alert(res.erro || 'Erro');
}

// ===== INIT =====
(function init() { if (!USUARIO) telaLogin(); })();
