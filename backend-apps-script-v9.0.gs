// ===== EVOL PEOPLE — Backend v8.1 (Google Apps Script) =====
// MUDANCAS v8.1 (em relacao ao v8):
// 1. buscarSalarioCargoFn: busca o salario na tabela da UNIDADE primeiro;
//    se o cargo nao existir la, cai automaticamente para a tabela PADRAO.
// 2. dashboardSocioFn: a Projecao de Orcamento agora usa o salario da
//    unidade de CADA vaga (antes usava sempre PADRAO) e respeita o
//    filtro de unidade selecionado na tela.
// Todo o restante esta identico ao v8.

const ABA_COLABORADORES = "Colaboradores";
const ABA_USUARIOS = "Usuarios";
const ABA_VAGAS_CONTEM = "Controle de Vagas";
const LINHA_CABECALHO_VAGAS = 2;
const ABA_TESTES = "TestesPraticos";
const ABA_AVALIACOES = "Avaliacoes";
const ABA_FEEDBACKS = "Feedbacks";
const ABA_OCORRENCIAS = "Ocorrencias";
const ABA_TREINAMENTOS = "Treinamentos";
const ABA_CARGOS = "Cargos";
const ABA_ESTOQUE = "Estoque";
const ABA_PROCESSO = "ProcessoSeletivo";
const ABA_LIDERANCA = "Lideranca";
const ABA_DP = "DP_Admissoes";
const ID_PLANILHA_DP_EXTERNA = "";
const ABA_TRILHAS = "Trilhas";
const ABA_PROGRESSO = "ProgressoTrilhas";
const ABA_ACESSOS = "AcessosTrilhas";
// ===== v9.0: novas abas =====
const ABA_TURNOVER = "Turnover";
const ABA_ABSENTEISMO = "Absenteismo";
const ABA_SLA = "SLA_Mensal";
const ABA_PDI = "PDI";
const MESES_SLA = ["JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];

function doGet() {
  return ContentService
    .createTextOutput("API EVOL PEOPLE ONLINE")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const usuario = autenticar(planilha, dados.cpf, dados.senha);
    if (!usuario) return responder({ sucesso: false, erro: "LOGIN_INVALIDO" });
    if (dados.acao === "login") {
      return responder({ sucesso: true, nome: usuario.nome, perfil: usuario.perfil, unidade: usuario.unidade, unidades: unidadesDoUsuario(usuario) });
    }
    if (dados.acao === "listarVagas") {
      if (!["RH", "SOCIO", "DIRETORIA"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const vagas = lerVagas(planilha, usuario);
      if (dados.unidadeFiltro && usuario.perfil === "SOCIO") {
        const u = unidadesDoUsuario(usuario);
        if (u.some(x => unidadeCorresponde(x, dados.unidadeFiltro))) return responder({ sucesso: true, vagas: vagas.filter(v => unidadeCorresponde(v.unidade, dados.unidadeFiltro)) });
      }
      return responder({ sucesso: true, vagas: vagas });
    }
    if (dados.acao === "listarEquipe") {
      if (!["RH", "LIDER", "SOCIO", "DIRETORIA", "DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const equipe = lerEquipe(planilha, usuario);
      if (dados.unidadeFiltro && usuario.perfil === "SOCIO") {
        const u = unidadesDoUsuario(usuario);
        if (u.some(x => unidadeCorresponde(x, dados.unidadeFiltro))) return responder({ sucesso: true, equipe: equipe.filter(e => unidadeCorresponde(e.unidade, dados.unidadeFiltro)) });
      }
      return responder({ sucesso: true, equipe: equipe });
    }
    if (dados.acao === "buscarSalarioCargo") {
      if (!["RH","LIDER","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, salario: buscarSalarioCargoFn(planilha, dados.cargo, dados.tabela) });
    }
    if (dados.acao === "cadastrarSalarioCargo") {
      if (!["RH","SOCIO","LIDER"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(cadastrarSalarioCargoFn(planilha, dados.cargo, dados.tabela, dados.fixo, dados.compl));
    }
    if (dados.acao === "salvarEscala") {
      if (!["RH","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      if (usuario.perfil === "LIDER" && dados.colaborador) {
        const ld = lerLiderados(planilha, usuario.nome);
        if (!ld || !ehLiderado(dados.colaborador, ld)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      }
      return responder(salvarEscalaFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarEscalas") {
      if (!["RH","LIDER","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, escalas: listarEscalasFn(planilha, usuario, dados.unidadeFiltro) });
    }
    if (dados.acao === "dashboardSocio") {
      if (!["RH","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, dashboard: dashboardSocioFn(planilha, usuario, dados.unidadeFiltro) });
    }
    if (dados.acao === "salvarTeste") {
      if (!["RH","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_TESTES);
      if (!aba) return responder({ sucesso: false, erro: "Aba TestesPraticos nao encontrada" });
      aba.appendRow([hoje(), dados.dataTeste||"", dados.unidade||"", dados.candidato||"", dados.vaga||"", dados.setor||"", dados.etapa||"", dados.escala||"", dados.folga||"", dados.criterios||"", dados.nota||"", dados.notaMinima||"", dados.satisfacao||"", dados.pontosFortes||"", dados.pontosAtencao||"", dados.recomendacao||"", dados.avaliador||"", usuario.nome]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "salvarAvaliacao") {
      if (!["RH","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      if (usuario.perfil === "LIDER" && dados.colaborador) {
        const ld = lerLiderados(planilha, usuario.nome);
        if (!ld || !ehLiderado(dados.colaborador, ld)) return responder({ sucesso: false, erro: "Voce so pode avaliar seus liderados diretos" });
      }
      const aba = obterAba(planilha, ABA_AVALIACOES);
      if (!aba) return responder({ sucesso: false, erro: "Aba Avaliacoes nao encontrada" });
      aba.appendRow([hoje(), dados.colaboradorId||"", dados.colaborador||"", dados.unidade||"", dados.gestor||"", dados.dataAdmissao||"", dados.dataAvaliacao||"", dados.etapa||"", dados.produtividade||"", dados.trabalhoEquipe||"", dados.sensoDono||"", dados.inovacao||"", dados.fazerDiferenca||"", dados.pontualidade||"", dados.uniforme||"", dados.comportamento||"", dados.pontosFortes||"", dados.pontosAtencao||"", dados.planoAcao||"", dados.resultado||"", usuario.nome]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "salvarFeedback") {
      if (!["RH","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      if (usuario.perfil === "LIDER" && dados.colaborador) {
        const ld = lerLiderados(planilha, usuario.nome);
        if (!ld || !ehLiderado(dados.colaborador, ld)) return responder({ sucesso: false, erro: "Voce so pode dar feedback aos seus liderados diretos" });
      }
      const aba = obterAba(planilha, ABA_FEEDBACKS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Feedbacks nao encontrada" });
      aba.appendRow([hoje(), dados.colaboradorId||"", dados.colaborador||"", dados.unidade||"", dados.tipo||"", dados.dataFeedback||"", dados.pontosFortes||"", dados.pontosMelhoria||"", dados.acordos||"", usuario.nome]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "listarCargos") {
      if (!["RH","LIDER","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, cargos: lerCargos(planilha) });
    }
    if (dados.acao === "salvarVaga") {
      if (usuario.perfil !== "RH" && usuario.perfil !== "SOCIO") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      if (usuario.perfil === "SOCIO" && !unidadeCorresponde(dados.unidade, usuario.unidade)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(abrirVaga(planilha, dados, usuario));
    }
    if (dados.acao === "listarEstoque") {
      if (!["RH","SOCIO","DIRETORIA"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, itens: lerEstoque(planilha, usuario) });
    }
    if (dados.acao === "listarTrilha") {
      const perm = permissaoTrilha(planilha, usuario, dados.academia);
      if (!perm.ok) return responder({ sucesso: false, erro: perm.erro });
      return responder({ sucesso: true, modulos: lerModulos(planilha, dados.academia), progresso: lerProgresso(planilha, usuario.cpf, dados.academia) });
    }
    if (dados.acao === "registrarProgresso") {
      const perm = permissaoTrilha(planilha, usuario, dados.academia);
      if (!perm.ok) return responder({ sucesso: false, erro: perm.erro });
      const aba = obterAba(planilha, ABA_PROGRESSO);
      if (!aba) return responder({ sucesso: false, erro: "Aba ProgressoTrilhas nao encontrada" });
      aba.appendRow([Utilities.formatDate(new Date(),"America/Fortaleza","dd/MM/yyyy"), usuario.cpf, usuario.nome, dados.academia||"", dados.moduloId||"", dados.modulo||"", dados.evento||"", dados.horas||""]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "dossie") {
      if (["RH","DP","DIRETORIA"].includes(usuario.perfil)) return responder(montarDossie(planilha, dados.id));
      if (usuario.perfil === "SOCIO") {
        const d = montarDossie(planilha, dados.id);
        if (d.sucesso && !unidadeCorresponde(d.colaborador.unidade, usuario.unidade)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
        return responder(d);
      }
      return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
    }
    if (dados.acao === "listarColaboradores") {
      if (!["RH","DP","DIRETORIA"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const abaC = planilha.getSheetByName(ABA_COLABORADORES);
      if (!abaC) return responder({ sucesso: false, erro: "Aba Colaboradores nao encontrada" });
      return responder({ sucesso: true, dados: abaC.getDataRange().getDisplayValues() });
    }
    if (dados.acao === "listarProcessos") {
      if (!["RH","SOCIO","DIRETORIA"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, processos: lerProcessos(planilha, usuario) });
    }
    if (dados.acao === "salvarTreinamento") {
      if (!["RH","DP","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_TREINAMENTOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Treinamentos nao encontrada" });
      aba.appendRow([hoje(), dados.dataTreinamento||"", dados.colaboradorId||"", dados.colaborador||"", dados.treinamento||"", dados.cargaHoraria||"", dados.presenca||"", usuario.nome]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "salvarOcorrencia") {
      if (!["RH","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_OCORRENCIAS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Ocorrencias nao encontrada" });
      aba.appendRow([hoje(), dados.dataOcorrencia||"", dados.colaboradorId||"", dados.colaborador||"", dados.tipo||"", dados.descricao||"", usuario.nome]);
      return responder({ sucesso: true });
    }
    // ===== v9.0: Turnover =====
    if (dados.acao === "salvarTurnover") {
      if (!["RH","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(salvarTurnoverFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarTurnover") {
      if (!["RH","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, registros: listarTurnoverFn(planilha, usuario, dados.unidadeFiltro) });
    }
    // ===== v9.0: Absenteismo =====
    if (dados.acao === "salvarAbsenteismo") {
      if (!["RH","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(salvarAbsenteismoFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarAbsenteismo") {
      if (!["RH","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, registros: listarAbsenteismoFn(planilha, usuario, dados.unidadeFiltro) });
    }
    // ===== v9.0: SLA mensal por casa (Junho a Dezembro) =====
    if (dados.acao === "salvarSla") {
      if (!["RH","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(salvarSlaFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarSla") {
      if (!["RH","SOCIO","DIRETORIA","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, registros: listarSlaFn(planilha, usuario, dados.unidadeFiltro) });
    }
    // ===== v9.0: PDI (Plano de Desenvolvimento Individual) =====
    if (dados.acao === "salvarPdi") {
      if (!["RH","LIDER","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      if (usuario.perfil === "LIDER" && dados.colaborador) {
        const ld = lerLiderados(planilha, usuario.nome);
        if (!ld || !ehLiderado(dados.colaborador, ld)) return responder({ sucesso: false, erro: "Voce so pode criar PDI para seus liderados diretos" });
      }
      return responder(salvarPdiFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarPdi") {
      return responder({ sucesso: true, registros: listarPdiFn(planilha, usuario, dados.unidadeFiltro) });
    }
    // ===== v9.0: Admissoes previstas / contratacoes (DP_Admissoes) =====
    if (dados.acao === "salvarAdmissaoPrevista") {
      if (!["RH","DP","SOCIO"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(salvarAdmissaoPrevistaFn(planilha, dados, usuario));
    }
    if (dados.acao === "listarAdmissoesPrevistas") {
      if (!["RH","DP","SOCIO","DIRETORIA"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder({ sucesso: true, registros: listarAdmissoesPrevistasFn(planilha, usuario, dados.unidadeFiltro) });
    }
    if (dados.acao === "atualizarAdmissaoPrevista") {
      if (!["RH","DP"].includes(usuario.perfil)) return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      return responder(atualizarAdmissaoPrevistaFn(planilha, dados));
    }
    if (usuario.perfil !== "RH" && usuario.perfil !== "DP") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
    if (dados.acao === "salvarProcesso" || dados.acao === "atualizarProcesso") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_PROCESSO);
      if (!aba) return responder({ sucesso: false, erro: "Aba ProcessoSeletivo nao encontrada" });
      const vl = [hoje(), dados.unidade||"", dados.candidato||"", dados.vaga||"", dados.localTeste||"", dados.diasTeste||"", dados.responsavel||"", dados.entrevista||"", dados.checagem||"", dados.alinhadoSocio||"", dados.valorPassagem||"", dados.passagem||"", dados.fardamento||"", dados.valorSeparado||"", dados.dataTeste||"", dados.compareceu||"", dados.resultadoTeste||"", dados.statusProcesso||"EM PROCESSO", dados.observacoes||"", usuario.nome];
      if (dados.acao === "salvarProcesso") { aba.appendRow([proximoIdAba(aba)].concat(vl)); }
      else { const ln = encontrarLinhaPorId(aba, dados.id); if (ln === -1) return responder({ sucesso: false, erro: "Registro nao encontrado" }); aba.getRange(ln, 2, 1, vl.length).setValues([vl]); }
      let infoVaga = { encerrada: false, dias: "" };
      if (String(dados.resultadoTeste).toUpperCase() === "APROVADO") { try { infoVaga = encerrarVagaPorAprovacao(planilha, dados, usuario); } catch (e) {} }
      try { notificarProcesso(planilha, dados, infoVaga); } catch (e) {}
      return responder({ sucesso: true, vagaEncerrada: infoVaga.encerrada, diasAberto: infoVaga.dias });
    }
    if (dados.acao === "salvarModulo") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_TRILHAS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Trilhas nao encontrada" });
      aba.appendRow([proximoIdAba(aba), String(dados.academia||"").toUpperCase(), Number(dados.ordem)||1, dados.nome||"", dados.descricao||"", dados.ferramentas||"", dados.tipo||"", dados.link||"", Number(dados.carga)||0]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "atualizarModulo") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_TRILHAS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Trilhas nao encontrada" });
      const ln = encontrarLinhaPorId(aba, dados.id);
      if (ln === -1) return responder({ sucesso: false, erro: "Modulo nao encontrado" });
      aba.getRange(ln, 3, 1, 7).setValues([[Number(dados.ordem)||1, dados.nome||"", dados.descricao||"", dados.ferramentas||"", dados.tipo||"", dados.link||"", Number(dados.carga)||0]]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "listarColabUsuarios") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const abaU = planilha.getSheetByName(ABA_USUARIOS);
      if (!abaU) return responder({ sucesso: false, erro: "Aba Usuarios nao encontrada" });
      const usuarios = abaU.getDataRange().getDisplayValues().slice(1).filter(l => String(l[3]||"").toUpperCase().trim() === "COLABORADOR" && l[0]).map(l => ({ cpf: String(l[0]).replace(/\D/g,""), nome: l[1]||"" }));
      return responder({ sucesso: true, usuarios });
    }
    if (dados.acao === "listarAcessos") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_ACESSOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba AcessosTrilhas nao encontrada" });
      const acessos = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]).map(l => ({ cpf: String(l[0]).replace(/\D/g,""), nome: l[1]||"" }));
      return responder({ sucesso: true, acessos });
    }
    if (dados.acao === "concederAcesso") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_ACESSOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba AcessosTrilhas nao encontrada" });
      const cpfNovo = String(dados.cpfColab||"").replace(/\D/g,"");
      const existentes = aba.getDataRange().getDisplayValues().slice(1).map(l => String(l[0]).replace(/\D/g,""));
      if (existentes.indexOf(cpfNovo) === -1) aba.appendRow([cpfNovo, dados.nomeColab||"", "NOVOS TALENTOS", Utilities.formatDate(new Date(),"America/Fortaleza","dd/MM/yyyy")]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "revogarAcesso") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_ACESSOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba AcessosTrilhas nao encontrada" });
      const cpfAlvo = String(dados.cpfColab||"").replace(/\D/g,"");
      const valores = aba.getDataRange().getDisplayValues();
      for (let i = valores.length - 1; i >= 1; i--) { if (String(valores[i][0]).replace(/\D/g,"") === cpfAlvo) aba.deleteRow(i + 1); }
      return responder({ sucesso: true });
    }
    if (dados.acao === "salvarCargo") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_CARGOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Cargos nao encontrada" });
      aba.appendRow([proximoIdAba(aba), String(dados.tabela||"PADRAO").toUpperCase(), String(dados.nome||"").toUpperCase(), Number(dados.fixo)||0, Number(dados.compl)||0]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "atualizarCargo") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_CARGOS);
      if (!aba) return responder({ sucesso: false, erro: "Aba Cargos nao encontrada" });
      const ln = encontrarLinhaPorId(aba, dados.id);
      if (ln === -1) return responder({ sucesso: false, erro: "Cargo nao encontrado" });
      aba.getRange(ln, 4).setValue(Number(dados.fixo)||0);
      aba.getRange(ln, 5).setValue(Number(dados.compl)||0);
      return responder({ sucesso: true });
    }
    if (dados.acao === "salvarItemEstoque") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_ESTOQUE);
      if (!aba) return responder({ sucesso: false, erro: "Aba Estoque nao encontrada" });
      aba.appendRow([proximoIdAba(aba), String(dados.tipo||"").toUpperCase(), dados.item||"", dados.tamanho||"", dados.unidade||"", Math.max(0,Number(dados.quantidade)||0)]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "ajustarEstoque") {
      if (usuario.perfil !== "RH") return responder({ sucesso: false, erro: "SEM_PERMISSAO" });
      const aba = obterAba(planilha, ABA_ESTOQUE);
      if (!aba) return responder({ sucesso: false, erro: "Aba Estoque nao encontrada" });
      const ln = encontrarLinhaPorId(aba, dados.id);
      if (ln === -1) return responder({ sucesso: false, erro: "Item nao encontrado" });
      const nova = Math.max(0, (Number(aba.getRange(ln, 6).getValue())||0) + (Number(dados.delta)||0));
      aba.getRange(ln, 6).setValue(nova);
      return responder({ sucesso: true, quantidade: nova });
    }
    const aba = planilha.getSheetByName(ABA_COLABORADORES);
    if (!aba) return responder({ sucesso: false, erro: "Aba Colaboradores nao encontrada" });
    if (dados.acao === "salvarColaborador") {
      const trava = LockService.getScriptLock();
      trava.waitLock(10000);
      try { const ult = aba.getLastRow(); let prox = 1; if (ult > 1) { const nums = aba.getRange(2,1,ult-1,1).getValues().flat().filter(n => typeof n === "number"); if (nums.length > 0) prox = Math.max(...nums) + 1; } aba.appendRow(montarLinha(prox, dados)); } finally { trava.releaseLock(); }
      return responder({ sucesso: true });
    }
    if (dados.acao === "atualizarColaborador") {
      const ln = encontrarLinhaPorId(aba, dados.id);
      if (ln === -1) return responder({ sucesso: false, erro: "Colaborador nao encontrado" });
      aba.getRange(ln, 1, 1, 20).setValues([montarLinha(Number(dados.id), dados)]);
      return responder({ sucesso: true });
    }
    if (dados.acao === "excluirColaborador") {
      const ln = encontrarLinhaPorId(aba, dados.id);
      if (ln === -1) return responder({ sucesso: false, erro: "Colaborador nao encontrado" });
      aba.deleteRow(ln);
      return responder({ sucesso: true });
    }
    return responder({ sucesso: false, erro: "Acao desconhecida" });
  } catch (erro) {
    return responder({ sucesso: false, erro: String(erro) });
  }
}

function autenticar(planilha, cpf, senha) {
  const aba = planilha.getSheetByName(ABA_USUARIOS);
  if (!aba) return null;
  const cpfLimpo = String(cpf).replace(/\D/g, "");
  const linhas = aba.getDataRange().getDisplayValues().slice(1);
  for (const l of linhas) {
    if (String(l[0]).replace(/\D/g,"") === cpfLimpo && String(l[2]) === String(senha)) {
      return { cpf: cpfLimpo, nome: l[1]||"", perfil: String(l[3]||"").toUpperCase().trim(), unidade: l[4]||"" };
    }
  }
  return null;
}
function unidadesDoUsuario(u) { return (u.unidade||"").split(",").map(s => s.trim()).filter(Boolean); }
function unidadeCorresponde(a, b) { const ua = String(a||"").toUpperCase().trim(), ub = String(b||"").toUpperCase().trim(); return !!(ua && ub) && (ua === ub || ua.indexOf(ub) !== -1 || ub.indexOf(ua) !== -1); }
function lerEquipe(planilha, usuario) {
  const aba = planilha.getSheetByName(ABA_COLABORADORES); if (!aba) return [];
  const valores = aba.getDataRange().getDisplayValues().slice(1);
  const equipe = [];
  const liderados = usuario.perfil === "LIDER" ? lerLiderados(planilha, usuario.nome) : null;
  const uPerm = usuario.perfil === "SOCIO" ? unidadesDoUsuario(usuario) : [];
  for (const l of valores) {
    if (!l[1]) continue;
    const colab = { id: l[0], nome: l[1], funcao: l[2], unidade: l[6], horario: String(l[14]||""), folga: String(l[15]||""), statusAdmissao: String(l[16]||""), dataAdmissao: l[18]||"" };
    if (usuario.perfil === "LIDER") {
      if (liderados === null) { if (unidadeCorresponde(colab.unidade, usuario.unidade)) equipe.push(colab); }
      else if (ehLiderado(colab.nome, liderados)) equipe.push(colab);
    } else if (usuario.perfil === "SOCIO") { if (uPerm.some(u => unidadeCorresponde(colab.unidade, u))) equipe.push(colab); }
    else equipe.push(colab);
  }
  return equipe;
}
function montarDossie(planilha, id) {
  const aba = planilha.getSheetByName(ABA_COLABORADORES); if (!aba) return { sucesso: false, erro: "Aba nao encontrada" };
  const ln = encontrarLinhaPorId(aba, id); if (ln === -1) return { sucesso: false, erro: "Nao encontrado" };
  const l = aba.getRange(ln, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  return { sucesso: true, colaborador: { id: l[0], nome: l[1], funcao: l[2], unidade: l[6], dataAdmissao: l[18] } };
}
function lerVagas(planilha, usuario) {
  const abaVagas = planilha.getSheets().find(s => s.getName().indexOf(ABA_VAGAS_CONTEM) !== -1);
  if (!abaVagas) return [];
  const valores = abaVagas.getDataRange().getDisplayValues();
  if (valores.length <= LINHA_CABECALHO_VAGAS) return [];
  const cab = valores[LINHA_CABECALHO_VAGAS-1].map(c => String(c).toUpperCase().trim());
  const idx = n => cab.findIndex(c => c.indexOf(n) !== -1);
  const cId = idx("ID"), cVaga = idx("VAGA"), cUni = idx("UNIDADE"), cSetor = idx("SETOR"), cGestor = idx("GESTOR"), cAbert = idx("DATA ABERTURA"), cDias = idx("DIAS EM ABERTO"), cCand = idx("CANDIDATO"), cStatus = cab.findIndex(c => c === "STATUS"), cSla = idx("SLA STATUS");
  const vagas = [];
  for (let i = LINHA_CABECALHO_VAGAS; i < valores.length; i++) {
    const l = valores[i], nv = cVaga !== -1 ? l[cVaga] : ""; if (!nv) continue;
    vagas.push({ id: cId !== -1 ? l[cId] : "", vaga: nv, unidade: cUni !== -1 ? l[cUni] : "", setor: cSetor !== -1 ? l[cSetor] : "", gestor: cGestor !== -1 ? l[cGestor] : "", dataAbertura: cAbert !== -1 ? l[cAbert] : "", diasAberto: cDias !== -1 ? l[cDias] : "", candidato: cCand !== -1 ? (l[cCand] === "nan" ? "" : l[cCand]) : "", status: cStatus !== -1 ? l[cStatus] : "", slaStatus: cSla !== -1 ? l[cSla] : "" });
  }
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); return vagas.filter(v => u.some(un => unidadeCorresponde(v.unidade, un))); }
  return vagas;
}
function lerProcessos(planilha, usuario) {
  const aba = obterAba(planilha, ABA_PROCESSO); if (!aba) return [];
  const valores = aba.getDataRange().getDisplayValues().slice(1);
  const procs = valores.filter(l => l[0]).map(l => ({ id: l[0], unidade: l[2], candidato: l[3], vaga: l[4], statusProcesso: l[19] }));
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); return procs.filter(p => u.some(un => unidadeCorresponde(p.unidade, un))); }
  return procs;
}
function normalizarNome(n) { return String(n||"").toUpperCase().trim(); }
function lerLiderados(planilha, nomeLider) {
  const aba = obterAba(planilha, ABA_LIDERANCA); if (!aba) return null;
  const lider = normalizarNome(nomeLider);
  const ld = aba.getDataRange().getDisplayValues().slice(1).filter(l => { const nl = normalizarNome(l[0]); return nl && (nl === lider || nl.indexOf(lider) !== -1 || lider.indexOf(nl) !== -1); }).map(l => normalizarNome(l[1])).filter(Boolean);
  return ld.length > 0 ? ld : null;
}
function ehLiderado(nomeColab, liderados) { const n = normalizarNome(nomeColab); return liderados.some(ld => n === ld || n.indexOf(ld) !== -1 || ld.indexOf(n) !== -1); }
function encerrarVagaPorAprovacao(planilha, dados, usuario) {
  const abaVagas = planilha.getSheets().find(s => s.getName().indexOf(ABA_VAGAS_CONTEM) !== -1);
  if (!abaVagas) return { encerrada: false, dias: "" };
  const valores = abaVagas.getDataRange().getDisplayValues();
  const cab = valores[LINHA_CABECALHO_VAGAS-1].map(c => String(c).toUpperCase().trim());
  const idx = n => cab.findIndex(c => c.indexOf(n) !== -1);
  const cVaga = idx("VAGA"), cUni = idx("UNIDADE"), cStatus = cab.findIndex(c => c === "STATUS"), cCand = idx("CANDIDATO"), cEnc = idx("DATA ENCERRAMENTO"), cDias = idx("DIAS EM ABERTO");
  for (let i = LINHA_CABECALHO_VAGAS; i < valores.length; i++) {
    const l = valores[i];
    if (String(l[cVaga]) === String(dados.vaga) && unidadeCorresponde(l[cUni], dados.unidade) && String(l[cStatus]).toUpperCase() !== "ENCERRADA") {
      abaVagas.getRange(i+1, cStatus+1).setValue("ENCERRADA");
      abaVagas.getRange(i+1, cCand+1).setValue(dados.candidato||"");
      abaVagas.getRange(i+1, cEnc+1).setValue(hoje());
      return { encerrada: true, dias: l[cDias]||"" };
    }
  }
  return { encerrada: false, dias: "" };
}
function obterDestinatarios(planilha, unidade) { return []; }
function enviarNotificacoes(destinatarios, assunto, texto) {}
function icone(v) { return ""; }
function notificarProcesso(planilha, d, infoVaga) {}
function aniversariantesDiario() {
  const p = SpreadsheetApp.getActiveSpreadsheet();
  const aba = p.getSheetByName(ABA_COLABORADORES); if (!aba) return;
  p.getDataRange().getDisplayValues().slice(1).forEach(l => {});
}
function permissaoTrilha(planilha, usuario, academia) { return { ok: true }; }
function lerModulos(planilha, academia) {
  const aba = obterAba(planilha, ABA_TRILHAS); if (!aba) return [];
  return aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0] && String(l[1]).toUpperCase() === String(academia).toUpperCase());
}
function lerProgresso(planilha, cpf, academia) {
  const aba = obterAba(planilha, ABA_PROGRESSO); if (!aba) return [];
  return aba.getDataRange().getDisplayValues().slice(1).filter(l => l[1] === cpf && l[3] === academia);
}
function lerCargos(planilha) {
  const aba = obterAba(planilha, ABA_CARGOS); if (!aba) return [];
  return aba.getDataRange().getValues().slice(1).filter(l => l[2]).map(l => ({ id: l[0], tabela: String(l[1]||"PADRAO").toUpperCase(), nome: String(l[2]), fixo: Number(l[3])||0, compl: Number(l[4])||0 }));
}
function lerEstoque(planilha, usuario) {
  const aba = obterAba(planilha, ABA_ESTOQUE); if (!aba) return [];
  const itens = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); return itens.filter(l => u.some(un => unidadeCorresponde(l[4], un))); }
  return itens;
}
function abrirVaga(planilha, dados, usuario) {
  const abaVagas = planilha.getSheets().find(s => s.getName().indexOf(ABA_VAGAS_CONTEM) !== -1);
  if (!abaVagas) return { sucesso: false, erro: "Aba de vagas nao encontrada" };
  abaVagas.appendRow([proximoIdAba(abaVagas), dados.vaga||"", dados.unidade||"", dados.setor||"", dados.gestor||usuario.nome, dados.motivo||"", hoje(), "","","","","","SELECAO", usuario.nome, "",""]);
  return { sucesso: true };
}
function proximoIdAba(aba) { const ult = aba.getLastRow(); if (ult <= 1) return 1; const nums = aba.getRange(2,1,ult-1,1).getValues().flat().filter(n => typeof n === "number"); return nums.length > 0 ? Math.max(...nums) + 1 : 1; }
function obterAba(planilha, nome) { return planilha.getSheetByName(nome); }
function hoje() { return Utilities.formatDate(new Date(), "America/Fortaleza", "dd/MM/yyyy HH:mm"); }
function montarLinha(id, d) { return [id, d.nome||"", d.funcao||"", d.salario||"", "", d.totalSalario||"", d.unidade||"", "", d.horario||"", d.folga||"", d.statusAdmissao||"", "", d.admissao||"", "","","", d.nome||"", d.funcao||"", d.unidade||"", d.dataNascimento||""]; }
function encontrarLinhaPorId(aba, id) { const ult = aba.getLastRow(); if (ult <= 1) return -1; const idx = aba.getRange(2,1,ult-1,1).getValues().flat().findIndex(v => String(v) === String(id)); return idx === -1 ? -1 : idx + 2; }
function responder(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// ===== v8.1: salario automatico por unidade, com fallback para PADRAO =====
function buscarSalarioCargoFn(planilha, cargo, tabela) {
  const cargos = lerCargos(planilha);
  const cNorm = normalizarNome(cargo), tNorm = normalizarNome(tabela||"PADRAO");
  // 1) tenta a tabela da unidade informada
  for (const c of cargos) {
    if (normalizarNome(c.nome) === cNorm && c.tabela === tNorm) {
      return { fixo: c.fixo, compl: c.compl, total: c.fixo + c.compl, tabela: c.tabela };
    }
  }
  // 2) se a unidade nao tem esse cargo, cai para a tabela PADRAO
  if (tNorm !== "PADRAO") {
    for (const c of cargos) {
      if (normalizarNome(c.nome) === cNorm && c.tabela === "PADRAO") {
        return { fixo: c.fixo, compl: c.compl, total: c.fixo + c.compl, tabela: "PADRAO" };
      }
    }
  }
  return null;
}
function cadastrarSalarioCargoFn(planilha, cargo, tabela, fixo, compl) {
  const aba = obterAba(planilha, ABA_CARGOS); if (!aba) return { sucesso: false, erro: "Aba Cargos nao encontrada" };
  const valores = aba.getDataRange().getValues();
  const cNorm = normalizarNome(cargo), tNorm = normalizarNome(tabela||"PADRAO");
  for (let i = 1; i < valores.length; i++) {
    if (normalizarNome(String(valores[i][2]||"")) === cNorm && normalizarNome(String(valores[i][1]||"PADRAO")) === tNorm) {
      aba.getRange(i+1, 4).setValue(Number(fixo)||0); aba.getRange(i+1, 5).setValue(Number(compl)||0); return { sucesso: true, criado: false };
    }
  }
  aba.appendRow([proximoIdAba(aba), tNorm, String(cargo).toUpperCase(), Number(fixo)||0, Number(compl)||0]);
  return { sucesso: true, criado: true };
}
function salvarEscalaFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, "Escalas", ["ID","Colaborador","Lider","Unidade","Tipo","Data","Status"]);
  const dias = dados.dias || [];
  for (const dia of dias) aba.appendRow([proximoIdAba(aba), dados.colaborador||"", dados.lider||usuario.nome, dados.unidade||"", dados.tipo||"", dia.data||"", dia.status||""]);
  return { sucesso: true, inseridos: dias.length };
}
function listarEscalasFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, "Escalas"); if (!aba) return [];
  const valores = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  const uPerm = usuario.perfil === "SOCIO" ? unidadesDoUsuario(usuario) : [];
  return valores.filter(l => {
    const el = String(l[2]||""), eu = String(l[3]||"");
    if (["RH","DP","DIRETORIA"].includes(usuario.perfil)) { if (unidadeFiltro) return unidadeCorresponde(eu, unidadeFiltro); return true; }
    if (usuario.perfil === "SOCIO") { const ok = uPerm.some(u => unidadeCorresponde(eu, u)); if (unidadeFiltro) return ok && unidadeCorresponde(eu, unidadeFiltro); return ok; }
    if (usuario.perfil === "LIDER") return normalizarNome(el) === normalizarNome(usuario.nome);
    return false;
  }).map(l => ({ id: l[0], colaborador: l[1], lider: l[2], unidade: l[3], tipo: l[4], data: l[5], status: l[6] }));
}
// ===== v8.1: dashboard com orcamento pela tabela da unidade de cada vaga =====
function dashboardSocioFn(planilha, usuario, unidadeFiltro) {
  const aba = planilha.getSheetByName(ABA_COLABORADORES);
  const hojeData = new Date(), mesAtual = hojeData.getMonth() + 1, hojeMs = hojeData.getTime(), limite15 = hojeMs + 15*24*60*60*1000;
  let headcount = {}, aniversariantes = [], periodosExp = [];
  if (aba) {
    const valores = aba.getDataRange().getDisplayValues().slice(1);
    for (const l of valores) {
      if (!l[1]) continue;
      const unid = String(l[6]||"").trim();
      if (unidadeFiltro && !unidadeCorresponde(unid, unidadeFiltro)) continue;
      if (String(l[16]||"").toUpperCase().trim() === "ADMITIDO") headcount[unid] = (headcount[unid]||0) + 1;
      const dn = String(l[19]||""), partes = dn.split("/");
      if (partes.length === 3 && Number(partes[1]) === mesAtual) aniversariantes.push({ nome: l[1], unidade: unid, dataNascimento: dn });
      const adm = String(l[18]||""), admP = adm.split("/");
      if (admP.length === 3) {
        const dAdm = new Date(Number(admP[2]), Number(admP[1])-1, Number(admP[0]));
        [45,90].forEach(dias => {
          const dp = new Date(dAdm.getTime() + dias*24*60*60*1000), ms = dp.getTime();
          if (ms >= hojeMs && ms <= limite15) periodosExp.push({ nome: l[1], unidade: unid, admissao: adm, periodo: dias+" dias", dataVencimento: Utilities.formatDate(dp,"America/Fortaleza","dd/MM/yyyy") });
        });
      }
    }
  }
  const vagas = lerVagas(planilha, usuario);
  let vagasPorCargo = {}, orcPorCargo = {}, projOrc = 0;
  for (const v of vagas) {
    const s = String(v.status||"").toUpperCase().trim();
    if (s === "ENCERRADA" || s === "CANCELADA" || s === "") continue;
    // v8.1: respeita o filtro de unidade do dashboard tambem nas vagas
    if (unidadeFiltro && !unidadeCorresponde(v.unidade, unidadeFiltro)) continue;
    vagasPorCargo[v.vaga] = (vagasPorCargo[v.vaga]||0) + 1;
    // v8.1: salario pela tabela da unidade da vaga (com fallback PADRAO)
    const sal = buscarSalarioCargoFn(planilha, v.vaga, v.unidade);
    const tc = sal ? sal.total : 0;
    projOrc += tc;
    if (!orcPorCargo[v.vaga]) orcPorCargo[v.vaga] = { cargo: v.vaga, quantidade: 0, subtotal: 0 };
    orcPorCargo[v.vaga].quantidade += 1;
    orcPorCargo[v.vaga].subtotal += tc;
  }
  const detalheOrc = Object.keys(orcPorCargo).map(k => {
    const o = orcPorCargo[k];
    return { cargo: o.cargo, quantidade: o.quantidade, salarioTotal: o.quantidade ? o.subtotal / o.quantidade : 0, subtotal: o.subtotal };
  });
  // ===== v9.0: EPIs/Fardamento por casa =====
  const estoquePorUnidade = estoquePorUnidadeFn(planilha, usuario, unidadeFiltro);
  // ===== v9.0: Turnover e Absenteismo (mes vigente + grupo) =====
  const turnoverResumo = resumoTurnoverAbsenteismoFn(planilha, usuario, unidadeFiltro, ABA_TURNOVER, "turnoverPercentual");
  const absenteismoResumo = resumoTurnoverAbsenteismoFn(planilha, usuario, unidadeFiltro, ABA_ABSENTEISMO, "absenteismoPercentual");
  // ===== v9.0: SLA por casa, Junho a Dezembro =====
  const slaPorCasa = slaPorCasaFn(planilha, usuario, unidadeFiltro);
  // ===== v9.0: testes, admissoes previstas por semana, contratacoes =====
  const testesResumo = resumoTestesFn(planilha, usuario, unidadeFiltro);
  const admissoesPrevistasPorSemana = admissoesPrevistasPorSemanaFn(planilha, usuario, unidadeFiltro);
  const contratacoesResumo = resumoContratacoesFn(planilha, usuario, unidadeFiltro);
  return { headcountPorUnidade: headcount, aniversariantesDoMes: aniversariantes, vagasAbertasPorCargo: vagasPorCargo, projecaoOrcamento: projOrc, detalheOrcamento: detalheOrc, periodosExperienciaVencendo: periodosExp,
    estoquePorUnidade: estoquePorUnidade, turnover: turnoverResumo, absenteismo: absenteismoResumo, slaPorCasa: slaPorCasa,
    testes: testesResumo, admissoesPrevistasPorSemana: admissoesPrevistasPorSemana, contratacoes: contratacoesResumo };
}

// ===== v9.0: EPIs & Fardamento por casa (resumo p/ dashboard) =====
function estoquePorUnidadeFn(planilha, usuario, unidadeFiltro) {
  const itens = lerEstoque(planilha, usuario); // ja aplica filtro de unidades do SOCIO
  const porUnidade = {};
  itens.forEach(l => {
    const tipo = String(l[1]||"OUTRO").toUpperCase().trim();
    const unid = String(l[4]||"SEM UNIDADE").trim();
    if (unidadeFiltro && !unidadeCorresponde(unid, unidadeFiltro)) return;
    const qtd = Number(l[5])||0;
    if (!porUnidade[unid]) porUnidade[unid] = { EPI: 0, FARDAMENTO: 0, OUTRO: 0, total: 0 };
    if (porUnidade[unid][tipo] === undefined) porUnidade[unid][tipo] = 0;
    porUnidade[unid][tipo] += qtd;
    porUnidade[unid].total += qtd;
  });
  return porUnidade;
}

// ===== v9.0: Turnover =====
function calcularCompetenciaAtual() { return Utilities.formatDate(new Date(), "America/Fortaleza", "MM/yyyy"); }
function salvarTurnoverFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, ABA_TURNOVER, ["ID","DataRegistro","Mes","Unidade","Setor","Admissoes","Demissoes","HeadcountMedio","TurnoverPercentual","RegistradoPor"]);
  const admissoes = Number(dados.admissoes)||0, demissoes = Number(dados.demissoes)||0, hcMedio = Number(dados.headcountMedio)||0;
  const pct = hcMedio > 0 ? ((admissoes + demissoes) / 2 / hcMedio) * 100 : 0;
  aba.appendRow([proximoIdAba(aba), hoje(), dados.mes || calcularCompetenciaAtual(), dados.unidade||"", dados.setor||"", admissoes, demissoes, hcMedio, Number(pct.toFixed(2)), usuario.nome]);
  return { sucesso: true, turnoverPercentual: Number(pct.toFixed(2)) };
}
function listarTurnoverFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_TURNOVER); if (!aba) return [];
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[3], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[3], unidadeFiltro));
  return linhas.map(l => ({ id: l[0], dataRegistro: l[1], mes: l[2], unidade: l[3], setor: l[4], admissoes: Number(l[5])||0, demissoes: Number(l[6])||0, headcountMedio: Number(l[7])||0, turnoverPercentual: Number(l[8])||0, registradoPor: l[9] }));
}

// ===== v9.0: Absenteismo =====
function salvarAbsenteismoFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, ABA_ABSENTEISMO, ["ID","DataRegistro","Mes","Unidade","Setor","HorasPrevistas","HorasFalta","AbsenteismoPercentual","RegistradoPor"]);
  const horasPrev = Number(dados.horasPrevistas)||0, horasFalta = Number(dados.horasFalta)||0;
  const pct = horasPrev > 0 ? (horasFalta / horasPrev) * 100 : 0;
  aba.appendRow([proximoIdAba(aba), hoje(), dados.mes || calcularCompetenciaAtual(), dados.unidade||"", dados.setor||"", horasPrev, horasFalta, Number(pct.toFixed(2)), usuario.nome]);
  return { sucesso: true, absenteismoPercentual: Number(pct.toFixed(2)) };
}
function listarAbsenteismoFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_ABSENTEISMO); if (!aba) return [];
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[3], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[3], unidadeFiltro));
  return linhas.map(l => ({ id: l[0], dataRegistro: l[1], mes: l[2], unidade: l[3], setor: l[4], horasPrevistas: Number(l[5])||0, horasFalta: Number(l[6])||0, absenteismoPercentual: Number(l[7])||0, registradoPor: l[8] }));
}

// ===== v9.0: resumo generico turnover/absenteismo p/ dashboard (grupo + por casa + por casa/setor) =====
function resumoTurnoverAbsenteismoFn(planilha, usuario, unidadeFiltro, nomeAba, chavePct) {
  const aba = obterAba(planilha, nomeAba);
  const vazio = { mesReferencia: "", grupo: 0, porUnidade: {}, porUnidadeSetor: {} };
  if (!aba) return vazio;
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[3], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[3], unidadeFiltro));
  if (!linhas.length) return vazio;
  // considera o mes mais recente registrado (competencia MM/yyyy)
  const meses = Array.from(new Set(linhas.map(l => l[2]))).sort((a,b) => {
    const [ma,ya]=String(a).split("/").map(Number), [mb,yb]=String(b).split("/").map(Number);
    return (ya*12+ma) - (yb*12+mb);
  });
  const mesRef = meses[meses.length-1];
  const doMes = linhas.filter(l => l[2] === mesRef);
  let somaPct = 0, porUnidade = {}, porUnidadeSetor = {};
  doMes.forEach(l => {
    const unid = l[3]||"", setor = l[4]||"", pct = Number(l[8])||0;
    somaPct += pct;
    if (!porUnidade[unid]) porUnidade[unid] = [];
    porUnidade[unid].push(pct);
    if (!porUnidadeSetor[unid]) porUnidadeSetor[unid] = {};
    porUnidadeSetor[unid][setor] = pct;
  });
  const mediaUnid = {};
  Object.keys(porUnidade).forEach(u => { const arr = porUnidade[u]; mediaUnid[u] = Number((arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2)); });
  return { mesReferencia: mesRef, grupo: Number((somaPct/doMes.length).toFixed(2)), porUnidade: mediaUnid, porUnidadeSetor: porUnidadeSetor };
}

// ===== v9.0: SLA mensal por casa, Junho a Dezembro =====
function salvarSlaFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, ABA_SLA, ["ID","Mes","Unidade","SlaPercentual","VagasDentroPrazo","VagasTotal","RegistradoPor","DataRegistro"]);
  const mes = String(dados.mes||"").toUpperCase().trim();
  let pct = Number(dados.slaPercentual)||0;
  const dentro = Number(dados.vagasDentroPrazo)||0, total = Number(dados.vagasTotal)||0;
  if (!dados.slaPercentual && total > 0) pct = (dentro/total)*100;
  // evita duplicar: se ja existir registro do mesmo mes/unidade, atualiza
  const valores = aba.getDataRange().getDisplayValues();
  for (let i = 1; i < valores.length; i++) {
    if (String(valores[i][1]).toUpperCase() === mes && unidadeCorresponde(valores[i][2], dados.unidade)) {
      aba.getRange(i+1, 4, 1, 5).setValues([[Number(pct.toFixed(2)), dentro, total, usuario.nome, hoje()]]);
      return { sucesso: true, slaPercentual: Number(pct.toFixed(2)), atualizado: true };
    }
  }
  aba.appendRow([proximoIdAba(aba), mes, dados.unidade||"", Number(pct.toFixed(2)), dentro, total, usuario.nome, hoje()]);
  return { sucesso: true, slaPercentual: Number(pct.toFixed(2)), atualizado: false };
}
function listarSlaFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_SLA); if (!aba) return [];
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[2], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[2], unidadeFiltro));
  return linhas.map(l => ({ id: l[0], mes: l[1], unidade: l[2], slaPercentual: Number(l[3])||0, vagasDentroPrazo: Number(l[4])||0, vagasTotal: Number(l[5])||0 }));
}
function slaPorCasaFn(planilha, usuario, unidadeFiltro) {
  const registros = listarSlaFn(planilha, usuario, unidadeFiltro);
  const porCasa = {};
  registros.forEach(r => {
    if (MESES_SLA.indexOf(String(r.mes).toUpperCase()) === -1) return;
    if (!porCasa[r.unidade]) porCasa[r.unidade] = {};
    porCasa[r.unidade][r.mes] = r.slaPercentual;
  });
  return { meses: MESES_SLA, porCasa: porCasa };
}

// ===== v9.0: PDI (Plano de Desenvolvimento Individual) =====
function salvarPdiFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, ABA_PDI, ["ID","DataCriacao","ColaboradorId","Colaborador","Unidade","Lider","Objetivo","Acoes","Prazo","Status","AtualizadoEm"]);
  if (dados.id) {
    const ln = encontrarLinhaPorId(aba, dados.id);
    if (ln === -1) return { sucesso: false, erro: "PDI nao encontrado" };
    aba.getRange(ln, 7, 1, 4).setValues([[dados.objetivo||"", dados.acoes||"", dados.prazo||"", dados.status||"EM ANDAMENTO"]]);
    aba.getRange(ln, 11).setValue(hoje());
    return { sucesso: true, atualizado: true };
  }
  aba.appendRow([proximoIdAba(aba), hoje(), dados.colaboradorId||"", dados.colaborador||"", dados.unidade||"", dados.lider||usuario.nome, dados.objetivo||"", dados.acoes||"", dados.prazo||"", dados.status||"EM ANDAMENTO", hoje()]);
  return { sucesso: true, atualizado: false };
}
function listarPdiFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_PDI); if (!aba) return [];
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "COLABORADOR") {
    const nomeU = normalizarNome(usuario.nome);
    linhas = linhas.filter(l => normalizarNome(l[3]) === nomeU);
  } else if (usuario.perfil === "LIDER") {
    const ld = lerLiderados(planilha, usuario.nome) || [];
    linhas = linhas.filter(l => ehLiderado(l[3], ld) || normalizarNome(l[5]) === normalizarNome(usuario.nome));
  } else if (usuario.perfil === "SOCIO") {
    const u = unidadesDoUsuario(usuario);
    linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[4], x)));
  }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[4], unidadeFiltro));
  return linhas.map(l => ({ id: l[0], dataCriacao: l[1], colaboradorId: l[2], colaborador: l[3], unidade: l[4], lider: l[5], objetivo: l[6], acoes: l[7], prazo: l[8], status: l[9], atualizadoEm: l[10] }));
}

// ===== v9.0: Testes praticos (resumo p/ dashboard) =====
function resumoTestesFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_TESTES);
  if (!aba) return { totalMes: 0, totalGeral: 0 };
  const mesAtual = calcularCompetenciaAtual();
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[3]); // coluna candidato preenchida
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[2], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[2], unidadeFiltro));
  const doMes = linhas.filter(l => {
    const dt = String(l[1]||"").split("/"); // dataTeste dd/mm/yyyy
    return dt.length === 3 && (dt[1]+"/"+dt[2]) === mesAtual;
  });
  return { totalMes: doMes.length, totalGeral: linhas.length };
}

// ===== v9.0: DP_Admissoes — admissoes previstas por semana + contratacoes =====
function salvarAdmissaoPrevistaFn(planilha, dados, usuario) {
  const aba = getOrCreateSheet(planilha, ABA_DP, ["ID","DataRegistro","Candidato","Vaga","Unidade","Setor","DataPrevistaAdmissao","DataAdmissaoReal","Status","RegistradoPor"]);
  aba.appendRow([proximoIdAba(aba), hoje(), dados.candidato||"", dados.vaga||"", dados.unidade||"", dados.setor||"", dados.dataPrevistaAdmissao||"", "", "PREVISTA", usuario.nome]);
  return { sucesso: true };
}
function listarAdmissoesPrevistasFn(planilha, usuario, unidadeFiltro) {
  const aba = obterAba(planilha, ABA_DP); if (!aba) return [];
  let linhas = aba.getDataRange().getDisplayValues().slice(1).filter(l => l[0]);
  if (usuario.perfil === "SOCIO") { const u = unidadesDoUsuario(usuario); linhas = linhas.filter(l => u.some(x => unidadeCorresponde(l[4], x))); }
  if (unidadeFiltro) linhas = linhas.filter(l => unidadeCorresponde(l[4], unidadeFiltro));
  return linhas.map(l => ({ id: l[0], candidato: l[2], vaga: l[3], unidade: l[4], setor: l[5], dataPrevistaAdmissao: l[6], dataAdmissaoReal: l[7], status: l[8] }));
}
function atualizarAdmissaoPrevistaFn(planilha, dados) {
  const aba = obterAba(planilha, ABA_DP); if (!aba) return { sucesso: false, erro: "Aba DP_Admissoes nao encontrada" };
  const ln = encontrarLinhaPorId(aba, dados.id); if (ln === -1) return { sucesso: false, erro: "Registro nao encontrado" };
  aba.getRange(ln, 8).setValue(dados.dataAdmissaoReal || (dados.status === "CONTRATADO" ? hoje() : ""));
  aba.getRange(ln, 9).setValue(dados.status||"PREVISTA");
  return { sucesso: true };
}
// agrupa por semana (segunda a domingo) as admissoes com Status = PREVISTA, das proximas 6 semanas
function admissoesPrevistasPorSemanaFn(planilha, usuario, unidadeFiltro) {
  const registros = listarAdmissoesPrevistasFn(planilha, usuario, unidadeFiltro).filter(r => String(r.status).toUpperCase() === "PREVISTA" && r.dataPrevistaAdmissao);
  const hojeD = new Date(); hojeD.setHours(0,0,0,0);
  const diaSemana = (hojeD.getDay()+6)%7; // 0=segunda
  const inicioSemana0 = new Date(hojeD.getTime() - diaSemana*24*60*60*1000);
  const semanas = [];
  for (let i = 0; i < 6; i++) {
    const ini = new Date(inicioSemana0.getTime() + i*7*24*60*60*1000);
    const fim = new Date(ini.getTime() + 6*24*60*60*1000);
    semanas.push({ inicio: ini, fim: fim, label: Utilities.formatDate(ini,"America/Fortaleza","dd/MM") + " a " + Utilities.formatDate(fim,"America/Fortaleza","dd/MM"), quantidade: 0 });
  }
  registros.forEach(r => {
    const p = String(r.dataPrevistaAdmissao).split("/");
    if (p.length !== 3) return;
    const d = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
    for (const s of semanas) { if (d >= s.inicio && d <= s.fim) { s.quantidade++; break; } }
  });
  return semanas.map(s => ({ semana: s.label, quantidade: s.quantidade }));
}
function resumoContratacoesFn(planilha, usuario, unidadeFiltro) {
  const registros = listarAdmissoesPrevistasFn(planilha, usuario, unidadeFiltro).filter(r => String(r.status).toUpperCase() === "CONTRATADO");
  const mesAtual = calcularCompetenciaAtual();
  const doMes = registros.filter(r => {
    const p = String(r.dataAdmissaoReal||"").split("/");
    return p.length === 3 && (p[1]+"/"+p[2]) === mesAtual;
  });
  return { totalMes: doMes.length, totalGeral: registros.length };
}

function getOrCreateSheet(planilha, nomeAba, cabecalhos) {
  let aba = planilha.getSheetByName(nomeAba);
  if (!aba) { aba = planilha.insertSheet(nomeAba); if (cabecalhos && cabecalhos.length) { aba.getRange(1,1,1,cabecalhos.length).setValues([cabecalhos]); aba.getRange(1,1,1,cabecalhos.length).setFontWeight("bold"); } }
  return aba;
}
function inicializarNovasAbas() {
  const p = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(p, "Escalas", ["ID","Colaborador","Lider","Unidade","Tipo","Data","Status"]);
  // v9.0
  getOrCreateSheet(p, ABA_TURNOVER, ["ID","DataRegistro","Mes","Unidade","Setor","Admissoes","Demissoes","HeadcountMedio","TurnoverPercentual","RegistradoPor"]);
  getOrCreateSheet(p, ABA_ABSENTEISMO, ["ID","DataRegistro","Mes","Unidade","Setor","HorasPrevistas","HorasFalta","AbsenteismoPercentual","RegistradoPor"]);
  getOrCreateSheet(p, ABA_SLA, ["ID","Mes","Unidade","SlaPercentual","VagasDentroPrazo","VagasTotal","RegistradoPor","DataRegistro"]);
  getOrCreateSheet(p, ABA_PDI, ["ID","DataCriacao","ColaboradorId","Colaborador","Unidade","Lider","Objetivo","Acoes","Prazo","Status","AtualizadoEm"]);
  getOrCreateSheet(p, ABA_DP, ["ID","DataRegistro","Candidato","Vaga","Unidade","Setor","DataPrevistaAdmissao","DataAdmissaoReal","Status","RegistradoPor"]);
}
