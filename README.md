# Servidor de Push do EvolPeople — Guia de Publicação

Este é o único pedaço da funcionalidade de notificação push que precisa ser
feito **fora** do Google Apps Script e do PWA (o resto — `sw.js`, `app.js`,
`Code.gs` — já está pronto e esperando por este serviço).

Sem publicar isto e colar os 2 valores no final deste guia, as notificações
push **não chegam** em lugar nenhum: o "encanamento" já existe, mas falta a
"bomba d'água" (este serviço).

Você vai precisar de:
- Uma conta Google com o [Google Cloud](https://console.cloud.google.com/) ativado (pode usar o mesmo projeto/planilha do EvolPeople ou um novo).
- O [Node.js](https://nodejs.org/) instalado no seu computador (para rodar o passo 1).
- O [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) instalado (para o passo 3).

Siga os passos NA ORDEM.

## Passo 1 — Gerar as chaves VAPID

As chaves VAPID são como uma "assinatura digital" que prova para os
navegadores (Chrome, Firefox etc.) que é o EvolPeople quem está mandando a
notificação, e não alguém se passando por ele.

1. Abra um terminal nesta pasta (`push-server/`).
2. Rode:
   ```
   npx web-push generate-vapid-keys
   ```
3. Isso vai imprimir duas chaves, algo assim:
   ```
   Public Key:
   BEl62iUYgUiv...(uma linha bem longa)

   Private Key:
   VCfF9Ea9Y8_x...(outra linha)
   ```
4. **Copie e guarde as duas** em um lugar seguro (ex.: um bloco de notas
   temporário). Você vai usá-las nos Passos 3 e 4. A chave PRIVADA nunca deve
   ser colada em nenhum arquivo do app.js/frontend — só a pública.

## Passo 2 — Instalar as dependências (opcional, o deploy já faz isso sozinho)

Se quiser testar localmente antes de publicar, rode dentro de `push-server/`:
```
npm install
```
Isso baixa a biblioteca `web-push` (a única dependência deste projeto).

## Passo 3 — Publicar o serviço no Google Cloud (deploy)

1. Ainda no terminal, dentro da pasta `push-server/`, faça login no Google
   Cloud (se ainda não fez):
   ```
   gcloud auth login
   ```
2. Escolha/confirme o projeto do Google Cloud que vai ser usado:
   ```
   gcloud config set project SEU_PROJETO_AQUI
   ```
   (o nome do projeto aparece no [Console do Google Cloud](https://console.cloud.google.com/))
3. Rode o comando de deploy abaixo, **substituindo**:
   - `SUA_CHAVE_PUBLICA_DO_PASSO_1` pela "Public Key" que você copiou.
   - `SUA_CHAVE_PRIVADA_DO_PASSO_1` pela "Private Key" que você copiou.
   - Se quiser, troque o e-mail depois de `mailto:` por outro e-mail de
     contato do responsável técnico (não precisa ser o mesmo).

   ```
   gcloud functions deploy enviarPush \
     --runtime nodejs20 \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars VAPID_PUBLIC_KEY=SUA_CHAVE_PUBLICA_DO_PASSO_1,VAPID_PRIVATE_KEY=SUA_CHAVE_PRIVADA_DO_PASSO_1,VAPID_SUBJECT=mailto:jeffanymorais@gmail.com
   ```
4. O deploy demora alguns minutos. No final, o terminal mostra um bloco com
   `httpsTrigger:` e, logo abaixo, uma linha `url:` — é uma URL parecida com:
   ```
   https://us-central1-SEU_PROJETO.cloudfunctions.net/enviarPush
   ```
5. **Copie essa URL inteira.** É ela que vai para o Passo 4.

   Se preferir ver a URL de novo depois, sem reimplantar:
   ```
   gcloud functions describe enviarPush --format="value(httpsTrigger.url)"
   ```

## Passo 4 — Colar os 2 valores nos arquivos do EvolPeople

Agora é só colar 2 informações em 2 lugares:

1. **A URL do Passo 3** vai no arquivo `Code.gs`, na variável:
   ```
   var PUSH_SERVER_URL = "COLE_AQUI_A_URL_DO_CLOUD_FUNCTION_APOS_DEPLOY";
   ```
   Troque o texto `"COLE_AQUI_A_URL_DO_CLOUD_FUNCTION_APOS_DEPLOY"` pela URL
   copiada (mantendo as aspas). Depois, no editor do Apps Script, publique uma
   nova versão do deploy do EvolPeople (Implantar > Gerenciar implantações >
   lápis > Nova versão > Implantar) — senão a URL antiga continua no ar.

2. **A chave PÚBLICA do Passo 1** vai no arquivo `app.js`, na constante:
   ```
   CONFIG.VAPID_PUBLIC_KEY: "COLE_AQUI_A_CHAVE_PUBLICA_VAPID"
   ```
   Troque `"COLE_AQUI_A_CHAVE_PUBLICA_VAPID"` pela "Public Key" do Passo 1
   (mantendo as aspas). **Nunca** coloque a chave PRIVADA aqui — só a pública.

Depois de colar os 2 valores e publicar a nova versão do Apps Script, peça
para um usuário reabrir o EvolPeople no celular/navegador e permitir
notificações quando for perguntado — a partir daí os eventos que já disparam
e-mail (aviso diário, aniversariantes etc.) também vão mandar push.

## Como saber se funcionou

- Peça para alguém logar no EvolPeople, aceitar a permissão de notificação, e
  então rode manualmente no Apps Script a função `testarAlertaDiario` (ou
  espere o gatilho das 7h).
- Se não chegar nada, veja os logs em `Ver > Registros de execução` no editor
  do Apps Script (procure por linhas "Falha ao enviar push para...") e os
  logs da própria função no Google Cloud Console (Cloud Functions >
  enviarPush > Registros).
