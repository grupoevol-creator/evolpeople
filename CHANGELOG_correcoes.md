# CHANGELOG de correções — EvolPeople

Reconstrução + correção dos 6 arquivos do sistema (Code.gs, app.js, style.css, index.html, sw.js, manifest.json), a partir do texto colado em chat. Nenhuma correção abaixo foi testada ao vivo (não há acesso a uma planilha Google real, ao runtime do Apps Script, nem a um navegador) — todas as mudanças vieram de leitura estática cuidadosa do código. Antes de publicar, **teste em uma cópia da planilha**, veja o Log de Execução do Apps Script e confira o console do navegador.

---

## CORREÇÕES DA 5ª RODADA (Rio Mar, Detalhe das vagas, CPF/ressalvas)

### 26. Rio Mar "continuava fixo" mesmo depois de 2 correções — causa era CACHE, não cálculo
Fui atrás de novo, item por item (12 lugares diferentes que mexem com salário do Rio Mar), e as duas correções anteriores estavam corretas e continuavam funcionando — o cálculo já vinha certo do banco. O problema real: o Dashboard guarda o resultado em cache por 3 minutos (`CacheService`) pra não recalcular toda hora, e esse cache não tinha sido invalidado quando as correções anteriores foram publicadas — então quem testasse via o Dashboard normal (sem clicar em "Atualizar") podia continuar vendo o valor antigo por até 3 minutos, parecendo que a correção "não pegou". Corrigido: troquei a chave do cache para uma nova versão, então QUALQUER cache antigo (de antes desta correção) fica automaticamente inválido e o próximo carregamento do Dashboard já recalcula do zero, na hora.
**Se depois de publicar isso você ainda ver salário fixo no Rio Mar**, os dois próximos passos são: (1) confirmar que você publicou uma NOVA versão de implantação no Apps Script (só salvar o Code.gs não atualiza a URL do app publicado); (2) checar se o campo Salário/Complementar daquele colaborador específico está mesmo preenchido na planilha de Colaboradores — se estiver vazio lá, nenhuma correção de código inventa um valor.

### 27. Detalhe das vagas: Cargo, Salário e Urgência sempre vazios/zerados
Achei a causa: o código procurava uma coluna chamada "CARGO" na aba Controle de Vagas, mas essa aba não tem essa coluna — o cargo da vaga fica na coluna "VAGA". Por isso o cargo nunca era encontrado, e sem cargo o salário também nunca batia (ficava R$0,00 sempre). A Urgência só aparecia numa vaga porque só ela tinha sido criada pelo próprio sistema (que já preenche "Normal" automaticamente); vagas antigas/importadas direto na planilha não tinham esse campo preenchido. Corrigido: agora, para cada vaga, o cargo é puxado com prioridade (1) do colaborador real que está sendo substituído (se houver um nome em "Substituindo", busca o cargo e o salário reais dessa pessoa), (2) senão, do texto da própria coluna "VAGA". A Urgência agora é calculada automaticamente (Normal / Alta / Crítica) comparando dias em aberto com o prazo de SLA, exatamente como o SLA automático já faz.

### 28. CPF de quem está testando não aparecia + "aprovado com ressalvas" não existia
Duas coisas distintas: (1) a tela "Quem está testando" nunca tinha sido programada pra mostrar o resultado do CPF — não era um bug de permissão, o campo simplesmente não estava naquela tabela. Corrigido: agora aparece "CPF: nada consta", "CPF: consta — [o que consta]" ou "CPF: ainda não verificado" (só pra sócio, como já era a regra). (2) A opção "Aprovado com ressalvas" nunca tinha sido criada — não existia nenhum status além de "Em teste" fixo. Adicionei um campo de Status pro RH escolher (Em teste / Aprovado / Aprovado com ressalvas / Reprovado), com botão pra atualizar depois de já ter agendado, e esse status (incluindo "com ressalvas") agora aparece pro líder quando ele escolhe o candidato na tela de Teste Prático.

---

## CORREÇÕES DA 4ª RODADA (achado real: por que Indicadores Mensais "não salvava")

Você mandou print mostrando: preencheu Ativos, Admissões, Desligamentos, Absenteísmo, Turnover e Faturamento, mas no final só Absenteísmo e Faturamento apareceram na tabela de Registros — o resto ficou em branco.

### 23. Causa raiz encontrada: editar um registro existente perdia campos "novos"
Salvar um registro NOVO (`salvarIndicador_`) sempre funcionou certo — conferi campo por campo contra o cabeçalho da planilha, bate 100%. O problema é ao EDITAR um registro já existente (botão ✏️ "Editar" → "Atualizar registro"): essa ação usa uma função genérica (`atualizarRegistroGenerico_`) que só escreve em colunas que JÁ EXISTEM na planilha — ela nunca criava a coluna Ativos/Admissões/Desligamentos se ainda não existisse, então o valor digitado era descartado silenciosamente, sem erro nenhum aparecer. Absenteísmo e Faturamento são colunas mais antigas que já existiam desde o início, por isso sempre funcionaram. Corrigido: agora a edição também garante a criação de qualquer coluna que faltar antes de gravar (mesmo comportamento do "salvar novo").
**Se você já tem registros de meses anteriores com esses campos vazios por causa desse bug, vai ser preciso reabrir e salvar de novo esses registros específicos depois de publicar esta correção** — a correção impede o bug de se repetir, mas não recupera dados que já foram perdidos.

### 24. Turnover nunca aparecia na tabela (mesmo quando salvava certo)
A lista de colunas exibidas na tabela de Registros de Indicadores Mensais estava fixa no código e nunca incluía "TurnoverPercentual" — mesmo quando o valor salvava certinho no fundo, não tinha como aparecer na tela. Corrigido: Turnover agora está na lista de colunas exibidas.

### 25. Novo: Faturamento por Colaborador — automático
Adicionei o cálculo automático de Faturamento ÷ Ativos (headcount) por unidade/mês, direto dos dados que você já preenche em Indicadores Mensais — sem precisar digitar nada a mais. Aparece como coluna extra (somente leitura) na tabela de Registros dessa tela. Se Ativos = 0, mostra 0 em vez de dar erro de divisão.

---

## CORREÇÕES DA 3ª RODADA (a partir de testes reais feitos por você na cópia de teste)

Estas foram encontradas depois que você já tinha publicado a 1ª rodada de correções e testou de verdade — por isso são mais precisas (bugs reais, não hipóteses de leitura de código).

### 16. Vagas "sem cargo" ainda entravam com R$312 de custo
O aviso "21 vaga(s) com cargo SEM SALÁRIO cadastrado" dizia "entram com custo ZERO", mas o código ainda somava R$312 (refeição estimada) mesmo para vagas sem cargo/salário resolvido. Corrigido em `dashboardCalcular_` (Code.gs): agora, se não há salário resolvido para a vaga, o custo dela é mesmo zero. **Isso não substitui a necessidade de preencher o Cargo dessas 21 vagas na planilha** — só corrige a conta ficar consistente com o aviso.

### 17. Rio Mar "continuava fixo" — achado um SEGUNDO lugar com tabela hardcoded
Na rodada anterior, corrigi `salariosPorUnidade_` para o Rio Mar ser dinâmico. Mas existe um card SEPARADO no dashboard ("Parrileiro Rio Mar — Salário + Gratificação") com sua PRÓPRIA lógica: quando havia uma regra na tabela `RioMar_Gratificacao` para o cargo, o salário-base exibido vinha dessa tabela fixa, não do colaborador real. Corrigido em `dashboardCalcular_`: o salário-base agora SEMPRE vem do colaborador real; a tabela de gratificação só fornece o teto do bônus (isso é regra de negócio válida, mantida).

### 18. Dossiê "puxava líder errado"
Causa: um mapa antigo (`LIDERES_DIRETOS`, já existia no sistema original) tentava adivinhar o líder casando só o PRIMEIRO NOME da pessoa (ex.: "Alan", "Saulo"), sem exigir nome completo nem verificar a unidade. Em qualquer base com duas pessoas de primeiro nome igual, isso aponta o líder errado. Removi essa camada de adivinhação (a menos arriscada, `LIDERES_DIRETOS_UNI`, que também checa a unidade, foi mantida). Agora, quando não há líder no cadastro do colaborador, na aba Liderança, nem uma correção exata por nome completo, o sistema mostra o líder PADRÃO da unidade em vez de arriscar um nome errado. **Ainda pode aparecer "líder padrão" em vez do líder de fato para quem não tem o campo Líder preenchido** — o único jeito de resolver 100% é preencher o campo Líder na planilha de Colaboradores ou cadastrar na aba Liderança.

### 19. SLA de Vagas — agora é automático (pedido novo)
Antes era um lançamento manual (mês/ano/unidade/dias/vagas fechadas). Agora `slaAutomatico_()` (Code.gs) calcula sozinho, direto da aba "Controle de Vagas": pega toda vaga com Status = ENCERRADA, usa "Dias em Aberto" (ou calcula pela Data Abertura/Data Encerramento) e tira a média por Unidade + mês/ano de fechamento. O lançamento manual continua existindo só como ajuste pontual opcional. **Depende de "Controle de Vagas" ter as colunas Status, Data Abertura, Data Encerramento (ou Dias em Aberto) preenchidas** — sem isso o cálculo fica vazio.

### 20. Teste Prático (líder): faltava a checagem de CPF
Na 1ª rodada o campo de CPF ("consta algo ou não", só para sócios) só tinha sido colocado em "Agendar Teste (RH)". A tela "Teste Prático" (onde o líder registra o resultado) não tinha esse campo — corrigi a listagem (`listarTestes`) para redigir o CPF de não-sócios também aqui, igual já era feito em Testes_RH. **Ainda não adicionei o campo de INPUT do CPF no formulário de "Teste Prático"** (só a proteção de leitura no backend) — se você quiser que o líder também possa preencher esse campo nessa tela (e não só o RH), me avise que eu completo.

### 21. Agendar Teste (RH): não tinha horário início/fim nem múltiplos dias
Só existiam em "Teste Prático" (tela do líder). Mas quem agenda é o RH — então agora `Testes_RH` também tem HoraInicio/HoraFim/DiasTeste, o formulário de "Agendar Teste (RH)" tem os mesmos campos de dias extensíveis e horário que já existiam do lado do líder, e a tela do líder (`preencherDoTesteRH`) agora PUXA automaticamente o horário e os dias marcados pelo RH ao escolher o candidato.

### 22. Refeição — confirmado que já está correto
Você reforçou que refeição deve ser o valor CHEIO do mês por casa (ex.: R$14 mil), não por pessoa — conferi de novo o código (`refeicaoDoMes_`) e essa é exatamente a lógica já implementada na 1ª rodada: soma os lançamentos tipo "Refeição" em Custos Mensais por unidade/mês, sem multiplicar por headcount, sem contar em duplicidade em "outros custos". Nenhuma mudança necessária aqui — só confirmando.

---

## 1. Indicadores mensais não gravam / não aparecem no dashboard

**Causa raiz:** `salvarIndicador_` (Code.gs) recebia `Ativos`, `Admissoes` e `Desligamentos` do formulário, mas nunca gravava esses três campos na planilha — só persistia `Faturamento`/`FaturamentoProjetado`/`AbsenteismoPercentual`. Como o dashboard e o cálculo de turnover automático dependem desses três campos, tudo que dependia deles ficava zerado. Havia também risco de duplicar linhas do mesmo período para o Rio Mar, porque a `Unidade` não era canonicalizada antes de comparar a chave de upsert (ver item 5).

**O que mudou:** `salvarIndicador_` foi reescrito para gravar todos os campos do formulário (`Ativos`, `Admissoes`, `Desligamentos`, `Faturamento`, `FaturamentoProjetado`, `AbsenteismoPercentual`, `Observacoes`) e a `Unidade` agora passa por `canonUnidade_()` antes do upsert.

**Arquivo/função:** `Code.gs` → `salvarIndicador_`. Nenhuma mudança necessária em `app.js` (o formulário de "Indicadores Mensais" já enviava os campos certos; o bug era 100% no backend).

**Limitação residual:** não testado contra a planilha real — confira se os cabeçalhos da aba "Indicadores" batem exatamente com `SHEETS.indicadores.headers`.

---

## 2. Push do celular não funciona

**Causa raiz:** o app só usava a API `Notification` local (`new Notification(...)`), que só dispara enquanto a aba está aberta — não é push de verdade em segundo plano. Não havia inscrição de push, nem armazenamento de inscrições no backend, nem handler de `push` no service worker.

**O que foi implementado (metade do CLIENTE + armazenamento no servidor):**
- `app.js`: `subscribePush()` — pede permissão, registra o `sw.js`, cria a inscrição via `PushManager.subscribe()` usando `CONFIG.VAPID_PUBLIC_KEY`, e envia a inscrição para o backend via `salvarPushSubscription`.
- `Code.gs`: nova aba `Push_Subscriptions` (chave `pushSubscriptions` em `SHEETS`), com `salvarPushSubscription_`/`listarPushSubscriptions_` e as ações registradas no `roteador_`.
- `sw.js`: handlers `push` (mostra a notificação do sistema mesmo com o app fechado) e `notificationclick` (foca ou abre a aba ao clicar).

**O que NÃO dá para fazer só com Apps Script — infraestrutura externa necessária:**
Google Apps Script **não tem** biblioteca de Web Push / assinatura VAPID. Ele consegue **guardar** as inscrições (o que foi feito), mas **não consegue enviar** o push assinado com a chave privada. Para o push funcionar de ponta a ponta falta, fora deste projeto:
1. Gerar um par de chaves VAPID (ex.: `npx web-push generate-vapid-keys`).
2. Colar a chave **pública** em `CONFIG.VAPID_PUBLIC_KEY` (topo do `app.js` — hoje está com o placeholder `"COLE_AQUI_A_CHAVE_PUBLICA_VAPID"`).
3. Guardar a chave **privada** em um servidor separado (ex.: uma Cloud Function ou um pequeno serviço Node.js) que:
   - leia as inscrições em `Push_Subscriptions` (via uma chamada ao `doGet`/`doPost` do Apps Script, ou exportando a aba),
   - use a lib `web-push` do Node para assinar e enviar a notificação para cada inscrição.
4. Esse serviço externo precisa ser chamado (ex.: por um gatilho de tempo, ou disparado pelo próprio Code.gs via `UrlFetchApp.fetch()` para um webhook) sempre que algo relevante acontecer (aniversário, teste agendado, etc.).

**Honestamente:** sem os passos 1–4 acima, o botão "Ativar no celular" continua funcionando como notificação **local** (só com o app aberto). O código novo deixa tudo pronto do lado do cliente e do armazenamento, mas o "motor de disparo" fica de fora do Apps Script por limitação de plataforma.

---

## 3. Turnover não grava nos indicadores mensais

Mesma causa raiz do item 1 — resolvido pela mesma correção em `salvarIndicador_`. O turnover do dashboard é calculado automaticamente em cima de `Ativos`/`Admissoes`/`Desligamentos`, então, uma vez que esses campos passaram a ser gravados, o cálculo passa a ter dado para trabalhar.

---

## 4. Salários zerados no dashboard

**Causa raiz:** o código de leitura de salário procurava primeiro por colunas com nome `Salario_Fixo`/`Salario_Compl` (aliases de uma possível importação legada) e só depois tentava `SalarioBase`/`Complementar`, que são os cabeçalhos reais usados pelo cadastro de colaboradores do sistema. Como as colunas reais nunca tinham esses nomes de alias, o salário sempre resolvia para 0 quando a planilha só tinha as colunas "de verdade".

**O que mudou:** a ordem de prioridade foi invertida — `SalarioBase`/`Complementar` (nomes reais) são tentados primeiro, com os aliases como fallback (mantendo compatibilidade se algum dia existir uma planilha importada com os nomes antigos).

**Arquivo/função:** `Code.gs` (função que resolve salário do colaborador) + `COLAB_MAP` em `app.js` (mesma prioridade, para exibição nas telas de módulo).

---

## 5. Rio Mar hardcoded em vez de dinâmico (JUDGMENT CALL — leia com atenção)

**Causa raiz:** `salariosPorUnidade_` excluía explicitamente o Rio Mar do cálculo automático (que deriva salário por cargo/unidade de tudo o que está cadastrado) e, em vez disso, mesclava uma tabela de salários **fixa e hardcoded** só para essa unidade.

**O que mudou:** o Rio Mar passou a entrar no mesmo caminho dinâmico das outras casas — `canonUnidade_()` já normaliza variações de grafia ("Rio Mar" / "RioMar" / "PARRILEIRO RIOMAR") para uma única chave canônica, então o cálculo por cargo/unidade passa a incluir o Rio Mar como qualquer outra unidade.

**Decisão que EU tomei (e que você deve validar com o time):** a aba `SalariosRioMar` / a lógica de **Gratificação Rio Mar** (bônus proporcional ao atingimento de faturamento, exibido no card "Parrileiro Rio Mar" do dashboard) foi **mantida como uma camada ADICIONAL** por cima do salário-base dinâmico — ou seja, a pessoa no Rio Mar agora tem: salário calculado dinamicamente (como as outras casas) **+** a gratificação variável específica daquela unidade (que é um plus de negócio real, não um bug). Se a intenção original era que o Rio Mar tivesse APENAS a tabela fixa antiga (sem entrar no cálculo dinâmico), essa é uma mudança de comportamento que precisa ser confirmada com quem definiu a regra de negócio.

**Arquivo/função:** `Code.gs` → `salariosPorUnidade_`, `canonUnidade_`, cálculo de `dash.riomar` no `dashboardCalcular_`.

---

## 6. Rescisão — três correções em um item

### 6a) Campo ValorRescisao
Adicionada a coluna `ValorRescisao` na aba `Entrevistas_Desligamento` (`SHEETS.desligamentos.headers`) e o campo correspondente no formulário de "Entrevista de Desligamento" (`MODULES.desligamentos` em `app.js`), tipo `moneyBR`. Antes só existia a **provisão estimada** do CMO (`rescisaoProv`), sem lugar para lançar o valor **realmente pago**.

### 6b) Rollup no dashboard (mensal + acumulado)
O dashboard agora mostra, na aba "Análises" → card "Entrevistas de Desligamento": **Rescisão paga (mês)** e **Rescisão paga (acumulado)**, lado a lado com a **Provisão de rescisão** (estimativa do CMO) — deixando claro que são dois números diferentes (um é o que a empresa reservou/estima gastar por mês, o outro é o que de fato saiu do caixa).

### 6c) Processos Trabalhistas — módulo novo do zero
Não existia NENHUM controle de processos trabalhistas — apenas um valor solto lançado em "Custos do Mês". Foi criado:
- Nova aba `Processos_Trabalhistas` (`SHEETS.processosTrabalhistas`) com Colaborador, CPF, Unidade, DataAbertura, Motivo, Status, ValorPedido, ValorProvisionado, ValorPago, Advogado, Observações.
- Ações `listarProcessosTrabalhistas`, `salvarProcessoTrabalhista`, `atualizarProcessoTrabalhista` registradas no `roteador_` do `Code.gs`.
- Novo módulo `processosTrabalhistas` em `app.js` (`MODULES`), com item de navegação em **Indicadores → Processos Trabalhistas**.
- Resumo no dashboard (aba "Análises"): processos abertos, valor provisionado, pago no mês e pago acumulado. O detalhe processo a processo fica na tela dedicada.

**Limitação:** os valores de "provisionado"/"pago" no card do dashboard vêm de um resumo agregado calculado no backend (`processosTrabalhistasResumo`) — não há, por ora, uma tabela linha-a-linha dentro do próprio dashboard (ela existe na tela dedicada).

---

## 7. Refeição — de custo por pessoa para total mensal por unidade

**Causa raiz:** o custo de refeição no CMO era `REFEICAO_MES` (valor fixo por colaborador) × headcount — não permitia lançar o valor real gasto por casa, que pode variar bastante (cardápio, número de refeições servidas, etc.).

**O que mudou:** "Refeição" agora é uma opção de `Tipo` em **Custos do Mês** (`MODULES.custosMensais`), lançada como um total mensal por UNIDADE — igual a Endomarketing, Dobras, etc. O parâmetro antigo `REFEICAO_MES` foi mantido no `Parâmetros do CMO` como **fallback legado**: só é usado se não houver nenhum lançamento de "Refeição" em Custos do Mês para aquele mês/unidade.

**Arquivo/função:** `Code.gs` → `refeicaoDoMes_` (nova função) chamada dentro do cálculo do CMO; `app.js` → `MODULES.custosMensais.fields` (Tipo agora inclui "Refeição").

---

## 8. Admissão: ASO + CPF em vez de valor único de R$120

**Causa raiz:** o custo de admissão era um único parâmetro `ADMISSAO_CUSTO` (R$120 fixo), sem decompor o que de fato compõe esse custo.

**O que mudou:** o parâmetro foi dividido em dois — `ADMISSAO_CUSTO_ASO` (R$12) e `ADMISSAO_CUSTO_CPF` (R$10) — somados no cálculo do CMO. Isso deixa explícito de onde vem o número e permite ajustar cada parte separadamente (ex.: se o valor da consulta de CPF mudar, não precisa mexer no custo do ASO).

**Arquivo/função:** `Code.gs` → parâmetros `CMO_PADRAO`/cálculo de admissões no CMO; `app.js` → `MODULES.parametrosCMO.fields` (as duas opções substituem a antiga combinada).

---

## 9. Teste prático — CPF "consta algo" restrito a sócios

**Causa raiz:** o app usava `perfilAdmin_` (checagem ampla, que inclui líderes e gestores) em vários pontos sensíveis. Para o campo de verificação de CPF, isso significava que qualquer líder/gestor poderia ver e editar uma informação que deveria ser restrita à sociedade/diretoria.

**O que mudou:**
- Novo `perfilSocio_` no `Code.gs` — mais restrito, só aceita `SOCIO`, `SOCIO OPERADOR`, `DIRETOR`, `DIRETORIA` (NÃO inclui líderes/gestores).
- `redigirCPFTestesRH_` — ao listar testes do RH, redige (remove) os campos `CPFVerificado`/`CPFConsta` da resposta se quem está pedindo não for sócio.
- `salvarTesteRH_`/`atualizarTesteRH_` bloqueiam a gravação desses dois campos se quem está enviando não for sócio.
- No front (`app.js`), os campos só são renderizados no formulário e na tabela de "Agendar Teste (RH)" quando `ehSocioClient()` retorna verdadeiro (mesma lista de perfis do `perfilSocio_`).

**Limitação:** a checagem client-side é só uma conveniência de UX (esconder o campo) — a segurança de verdade está no backend (redação + bloqueio de escrita), que é o que importa de fato.

---

## 10. Headcount — série histórica mensal

**Causa raiz:** "Headcount" só mostrava a fotografia atual (quem está ativo agora), sem histórico.

**O que mudou:** `listarHeadcount_` agora também devolve `headcountMensal` — uma série mês a mês (do mês da admissão mais antiga até o mês atual) com o total de ativos naquele mês, calculada a partir das datas de admissão/desligamento de cada colaborador. A tela de Headcount (`app.js`) ganhou um card "Série Histórica de Headcount" com a evolução mês a mês e a variação entre um mês e o seguinte.

**Limitação sincera:** essa série é do **grupo inteiro**, não quebrada por unidade (o campo que o backend devolve é `{Periodo, Mes, Ano, Headcount}`, sem `Unidade`). Para ver o headcount de uma casa específica, use o filtro de Unidade na lista de colaboradores da mesma tela — o histórico ali é geral.

---

## 11. Liderança ausente no Dossiê + Modalidade de Contratação

**Causa raiz (liderança):** a função que resolve o líder de um colaborador dava prioridade a um mapa **hardcoded parcial** (`mapaLideranca_`/lista fixa) em vez de usar primeiro o organograma real vindo da aba "Liderança" — então, para a maioria das pessoas que não estavam no mapa hardcoded, o líder aparecia vazio mesmo quando a informação existia na planilha.

**O que mudou:** `liderDe_` foi reordenada para tentar primeiro o líder direto (organograma real da aba Liderança) e só cair no mapa hardcoded como fallback final. O `app.js` já tinha a mesma prioridade correta no `liderDe()` do cliente (organograma → aba lideranca), então não precisou de mudança lá.

**Modalidade de Contratação:** nova função `modalidadeContratacaoDe_` (deriva de colunas legadas `Tipo_Contrato`/`TipoContrato`/`Contrato`, ou do heurístico `ehPJ_` quando nenhuma existir) — exibida agora no **Headcount** (coluna + detalhe da pessoa) e no **Dossiê** (linha "Modalidade de contratação"). É um campo **somente leitura** nessas telas — não foi adicionado como campo editável no cadastro de Colaboradores porque o backend não tem uma coluna própria para gravá-la (evitei criar um campo de formulário que pareceria salvar algo e na prática seria ignorado).

---

## 12. Filtro de Setor/Unidade no Dossiê não filtrava

**Causa raiz DE VERDADE (mais sutil do que parecia):** investigando a fundo, `dsFiltrar()` no `app.js` **já filtrava corretamente** a lista de colaboradores clicáveis por unidade/setor/busca. O problema real era que o `<select>` "Filtrar por Setor" ficava **sempre vazio** (só com a opção "Todos os setores"), porque `STATE.init.setores` nunca era preenchido em `carregarInit()` — só `unidades`, `cargos`, `colaboradores`, `salarios` e `lideranca` eram carregados. Ou seja: não era o filtro que "não funcionava", era que não havia setor nenhum para escolher.

**O que mudou:**
- `Code.gs` → `getInit_` passou a devolver `setores` (lista de setores distintos).
- `app.js` → `carregarInit()` agora preenche `STATE.init.setores` com o que vier do backend, e, como reforço extra, deriva a mesma lista a partir dos próprios colaboradores caso o backend não mande nada (dupla proteção).
- Além disso, o backend `dossie_` (Code.gs) foi endurecido para de fato **aplicar** filtro por setor/unidade quando informado (antes o parâmetro existia mas não era usado na busca do colaborador) — isso é uma correção defensiva adicional, caso no futuro o front passe a enviar esses filtros também na chamada da ação `dossie`.

**Limitação honesta:** não consegui testar ao vivo se o `<select>` de Setor realmente aparece populado — depende de `getInit_` estar publicado e de existir算 pelo menos um colaborador com `Setor` preenchido na planilha.

---

## 13. Teste Prático — hora início/fim e mais de 3 dias de teste

**Causa raiz:** só existia `HoraTeste` (um único horário) e 3 colunas fixas de data (`DataTeste`, `DataTeste2`, `DataTeste3`) — impossível registrar um teste com mais de 3 dias ou marcar hora de início e fim.

**O que mudou:**
- `Code.gs` → aba `Testes` ganhou `HoraInicio`, `HoraFim` e `DiasTeste` (lista de dias separada por vírgula, sem limite), mantendo `DataTeste`/`DataTeste2`/`DataTeste3`/`HoraTeste` por compatibilidade com dados já lançados.
- `app.js` → tela "Teste Prático" trocou o campo único de data por uma lista dinâmica de dias (`+ Adicionar dia de teste` / remover dia), e adicionou "Hora de início" e "Hora de fim". Ao salvar, os 3 primeiros dias ainda populam `DataTeste`/`DataTeste2`/`DataTeste3` (compatibilidade), e a lista completa vai em `DiasTeste`.

---

## 14. Semáforo do Dossiê (vermelho/laranja/amarelo/verde)

**Causa raiz:** só existia o badge genérico "situação" (ATENÇÃO CRÍTICA / REQUER ATENÇÃO / normal), sem uma classificação visual de 4 níveis nem critério documentado.

**O que mudou:** `Code.gs` ganhou `classificarSemaforo_` (retorna uma cor: `vermelho`/`laranja`/`amarelo`/`verde`) e `LEGENDA_SEMAFORO` (texto explicando cada cor), ambos devolvidos pelo `dossie_`. O `app.js` renderiza esse semáforo no topo do dossiê, com a legenda das 4 cores vinda do próprio backend (evitando duplicar o critério em dois lugares).

**Critério usado (decisão registrada para você validar):**
- 🔴 **Vermelho** — teve suspensão OU qualquer advertência OU qualquer falta injustificada.
- 🟠 **Laranja** — não é vermelho, mas teve alguma ocorrência leve (ex.: atraso registrado como Ocorrência).
- 🟡 **Amarelo** — não é vermelho/laranja, mas teve 3+ faltas (justificadas ou não) OU algum atestado no período.
- 🟢 **Verde** — nenhuma ocorrência negativa relevante.

Esse critério é um **julgamento razoável, não uma regra que veio de vocês** — os limiares (3+ faltas, "qualquer" advertência etc.) podem precisar de ajuste fino depois de rodar com dados reais.

---

## 15. Sweep geral de bugs

Correções pontuais feitas durante a reconstrução, além dos 14 itens numerados:
- Ordem de leitura de salário (ver item 4) refletida também no `COLAB_MAP` do front.
- `canonUnidade_` aplicada de forma consistente nos pontos de gravação (indicadores) e leitura (salários, Rio Mar) para evitar duplicidade por grafias diferentes da mesma unidade.
- Verificação de duplicidade de funções em `Code.gs` e `app.js` (nenhuma encontrada) e checagem de sintaxe de `app.js` com `node --check` (sem erros).
- Conferência cruzada de nomes de campo entre `Code.gs` (o que o backend realmente devolve) e `app.js` (o que a tela espera) nos pontos tocados pelas correções acima — alguns nomes foram ajustados no front para bater exatamente com o que o backend manda (ex.: `dash.processosTrabalhistas.{abertos,provisionado,pagoMes,pagoAcumulado}`, `headcountMensal.{Periodo,Headcount}`, `semaforo` como string simples + `legendaSemaforo` como mapa).

**Não foi uma reescrita geral** — o objetivo foi resolver os 15 pontos relatados sem tocar em telas/fluxos que não foram mencionados como quebrados.

---

## Itens que precisam de validação humana antes de ir para produção

1. **Push (#2):** só funciona de ponta a ponta depois de gerar chaves VAPID e montar o serviço externo de envio.
2. **Rio Mar (#5):** confirmar com o time se a gratificação deve mesmo ser uma camada ADICIONAL ao salário dinâmico, ou se deveria substituir o cálculo dinâmico.
3. **Semáforo (#14):** validar os limiares (3+ faltas, etc.) com quem define a política disciplinar.
4. **Setor no Dossiê (#12):** confirmar que a planilha realmente tem a coluna "Setor" preenchida para a maioria dos colaboradores — senão o filtro continuará com poucas opções (não por bug, mas por falta de dado).
5. Todas as correções foram verificadas por leitura estática e checagem cruzada de nomes de campo entre os dois arquivos — **não houve execução real** contra uma planilha Google ou um navegador. Recomendo fortemente testar cada item nesta lista numa cópia de teste antes de publicar em produção.
