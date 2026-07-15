// EvolPeople - Service Worker (sem cache: sempre mostra a versao nova)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));

/* =====================================================================
 * CORREÇÃO #2 — Push no celular (metade do CLIENTE)
 * =====================================================================
 * Isto só entra em ação DEPOIS que:
 *   1) app.js chamou subscribePush() e o navegador criou uma inscrição
 *      (PushSubscription) usando CONFIG.VAPID_PUBLIC_KEY;
 *   2) essa inscrição foi salva no backend (Code.gs -> Push_Subscriptions);
 *   3) um servidor EXTERNO (fora do Apps Script) leu essa inscrição e
 *      enviou um push de verdade, assinado com a chave PRIVADA VAPID,
 *      usando por exemplo a biblioteca "web-push" do Node.js.
 *
 * O Google Apps Script não consegue fazer o passo 3 sozinho (não tem uma
 * lib de Web Push / assinatura VAPID nativa) — por isso esse envio precisa
 * ser feito por fora. Ver CHANGELOG_correcoes.md, item #2, para o que
 * falta montar (chaves VAPID + pequeno serviço Node/Cloud Function).
 *
 * O código abaixo cobre a parte que O NAVEGADOR faz: receber o push que
 * chegou e mostrar a notificação do sistema, mesmo com o app fechado.
 */
self.addEventListener("push", (event) => {
  let dados = {};
  try { dados = event.data ? event.data.json() : {}; } catch (e) {
    dados = { title: "EvolPeople", body: event.data ? event.data.text() : "" };
  }
  const titulo = dados.title || dados.titulo || "EvolPeople";
  const opcoes = {
    body: dados.body || dados.texto || "",
    icon: dados.icon || "icon-192.png",
    badge: dados.badge || "icon-192.png",
    tag: dados.tag || "evolpeople",
    data: { url: dados.url || dados.tela || "/" }
  };
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const alvo = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ("focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(alvo);
    })
  );
});
