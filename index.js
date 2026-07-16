/*************************************************************
 * EVOLPEOPLE - Servidor de Push (Web Push / VAPID)
 *
 * Este é o pedaço "de fora" do Apps Script que faltava: o Google Apps Script
 * NÃO sabe falar o protocolo Web Push nem assinar mensagens com VAPID, então
 * este pequeno serviço HTTP (feito para rodar como Google Cloud Function)
 * recebe um pedido do Code.gs (função enviarPushNotificacao_) e efetivamente
 * entrega a notificação no navegador/celular do usuário, usando a biblioteca
 * `web-push`.
 *
 * Requisição esperada (POST, JSON):
 *   {
 *     "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
 *     "title": "Título curto",
 *     "body": "Corpo curto da notificação",
 *     "url": "https://.../alguma-tela" (opcional)
 *   }
 *
 * Variáveis de ambiente necessárias (ver README.md para como gerá-las e
 * configurá-las no deploy):
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT   (ex.: "mailto:jeffanymorais@gmail.com")
 *************************************************************/

const webpush = require('web-push');

exports.enviarPush = (req, res) => {
  // Libera CORS básico (o Apps Script chama via UrlFetchApp, então CORS não é
  // estritamente necessário para esse caminho, mas não custa deixar aberto
  // caso algo chame direto do navegador no futuro).
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, erro: 'Use POST.' });
    return;
  }

  const body = req.body || {};
  const subscription = body.subscription;
  const title = body.title || 'EvolPeople';
  const notifBody = body.body || '';
  const url = body.url || '';

  if (!subscription || !subscription.endpoint || !subscription.keys ||
      !subscription.keys.p256dh || !subscription.keys.auth) {
    res.status(400).json({ ok: false, erro: 'Campo "subscription" ausente ou incompleto (esperado endpoint + keys.p256dh + keys.auth).' });
    return;
  }

  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    res.status(500).json({
      ok: false,
      erro: 'Variáveis de ambiente VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT não configuradas neste deploy. Veja README.md.'
    });
    return;
  }

  const payload = JSON.stringify({ title: title, body: notifBody, url: url });

  webpush.sendNotification(subscription, payload, {
    vapidDetails: {
      subject: VAPID_SUBJECT,
      publicKey: VAPID_PUBLIC_KEY,
      privateKey: VAPID_PRIVATE_KEY
    }
  })
    .then(() => {
      res.status(200).json({ ok: true, msg: 'Push enviado.' });
    })
    .catch((err) => {
      // Erros comuns aqui: inscrição expirada/revogada (410 Gone / 404), que
      // são normais com o tempo (usuário desinstalou o PWA, trocou de
      // navegador etc.) — não é motivo de alarme.
      res.status(200).json({
        ok: false,
        erro: 'Falha ao enviar push: ' + (err && err.message ? err.message : String(err)),
        statusCode: (err && err.statusCode) || null
      });
    });
};
