import { createServer } from 'node:http';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { verifyReferralOfferTrackingToken } from './referral-offer-tracking.js';

const MAX_WEBHOOK_BYTES = 64 * 1024;

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(body);
}

function sendHtml(response, status, body) {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  });
  response.end(body);
}

function sendText(response, status, body) {
  response.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(body);
}

function sendRedirect(response, location) {
  response.writeHead(302, {
    location,
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff'
  });
  response.end();
}

function sendPayoutHtml(response, status, body) {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; script-src https://yookassa.ru 'unsafe-inline'; connect-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  });
  response.end(body);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function payoutSetupToken(value) {
  const token = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{16,128}$/u.test(token)) return null;
  return token;
}

function browserJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function payoutSetupPage(setup, { payoutAgentId, token }) {
  const amount = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(setup.amountKopecks) / 100);
  const expiresAt = escapeHtml(new Date(setup.expiresAt).toLocaleString('ru-RU'));
  if (setup.method === 'bank_card') {
    return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>реквизиты для выплаты</title><style>body{font:16px system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 20px;color:#17231a}main{padding:24px;border-radius:20px;background:#f2f8ef}button{border:0;border-radius:12px;padding:13px 18px;background:#367d48;color:#fff;font-size:16px}p{line-height:1.5}.muted{color:#637064}</style><main><h1>указать карту</h1><p>сумма к выводу: <strong>${escapeHtml(amount)} ₽</strong></p><p class="muted">карта передаётся напрямую в защищённый виджет YooKassa. бот не получает номер карты.</p><div id="payout-data"></div><p class="muted">ссылка действует до ${expiresAt}.</p></main><script src="https://yookassa.ru/payouts-data/3.1.0/widget.js"></script><script>
const token=${browserJson(token)}; const root=document.getElementById('payout-data');
function finish(data){fetch('/payout/setup/'+token+'/complete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).then((r)=>r.json()).then((body)=>{root.textContent=body.ok?'готово: заявка отправлена в обработку.':'не получилось сохранить реквизиты.'}).catch(()=>{root.textContent='не получилось сохранить реквизиты.'});}
if(window.PayoutsData){new PayoutsData({type:'payout',account_id:${browserJson(payoutAgentId)},success_callback:finish,error_callback:()=>{root.textContent='виджет не принял данные карты. попробуй ещё раз.'}}).render('payout-data');}else{root.textContent='виджет YooKassa пока недоступен.';}
</script></html>`;
  }
  return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>реквизиты для выплаты</title><style>body{font:16px system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 20px;color:#17231a}main{padding:24px;border-radius:20px;background:#f2f8ef}input,select,button{box-sizing:border-box;width:100%;border:1px solid #b5c9b6;border-radius:12px;padding:13px;margin:7px 0;font:inherit}button{border:0;background:#367d48;color:#fff}.muted{color:#637064}#message{min-height:24px}</style><main><h1>указать СБП</h1><p>сумма к выводу: <strong>${escapeHtml(amount)} ₽</strong></p><label>телефон<input id="phone" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00"></label><label>банк<select id="bank"><option>загружаем банки…</option></select></label><button id="submit" type="button">отправить реквизиты</button><p id="message" class="muted">ссылка действует до ${expiresAt}.</p></main><script>
const token=${browserJson(token)}; const bank=document.getElementById('bank'); const message=document.getElementById('message');
fetch('/payout/setup/'+token+'/banks').then((r)=>r.json()).then((body)=>{bank.replaceChildren(...(body.banks||[]).map((item)=>{const option=document.createElement('option');option.value=item.bankId;option.textContent=item.name;return option;}));}).catch(()=>{bank.innerHTML='<option>банки временно недоступны</option>';});
document.getElementById('submit').onclick=()=>{fetch('/payout/setup/'+token+'/complete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone:document.getElementById('phone').value,bankId:bank.value,bankName:bank.selectedOptions[0]?.textContent||''})}).then((r)=>r.json()).then((body)=>{message.textContent=body.ok?'готово: заявка отправлена в обработку.':'не получилось сохранить реквизиты.'}).catch(()=>{message.textContent='не получилось сохранить реквизиты.'});};
</script></html>`;
}

function sendMedia(response, media) {
  const fileName = String(media.fileName ?? 'result.bin')
    .replace(/["\\\u0000-\u001f\u007f]/gu, '_')
    .slice(0, 255) || 'result.bin';
  response.writeHead(200, {
    'content-type': media.contentType,
    'content-length': String(media.size),
    'cache-control': 'public, max-age=31536000, immutable',
    'content-disposition': `inline; filename="${fileName}"`,
    'x-content-type-options': 'nosniff'
  });
  response.end(media.data);
}

async function rawBody(request) {
  const contentType = String(request.headers['content-type'] ?? '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    const error = new Error('Unsupported content type.');
    error.statusCode = 415;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_WEBHOOK_BYTES) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Invalid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

async function jsonBody(request) {
  return parseJson(await rawBody(request));
}

function singleHeader(request, name) {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : String(value ?? '');
}

function verifySignedCallback(raw, request, secret, now) {
  const timestamp = singleHeader(request, 'x-metaflora-timestamp');
  const signature = singleHeader(request, 'x-metaflora-signature');
  if (!/^\d{10}$/u.test(timestamp) || !/^sha256=[a-f0-9]{64}$/u.test(signature)) return false;
  const nowSeconds = Math.floor(now().valueOf() / 1000);
  if (!Number.isSafeInteger(nowSeconds) || Math.abs(nowSeconds - Number(timestamp)) > 300) return false;
  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${raw}`)
    .digest('hex')}`;
  const actualBuffer = Buffer.from(signature, 'ascii');
  const expectedBuffer = Buffer.from(expected, 'ascii');
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

function safeWebhookPath(value) {
  const path = String(value ?? '');
  if (!/^\/webhooks\/yookassa\/[A-Za-z0-9_-]{20,128}$/u.test(path)) {
    throw new TypeError('A secure YooKassa webhook path is required.');
  }
  return path;
}

function safeTbankPayoutWebhookPath(value) {
  const path = String(value ?? '');
  if (!path) return '';
  if (!/^\/webhooks\/tbank\/payouts\/[A-Za-z0-9_-]{20,128}$/u.test(path)) {
    throw new TypeError('A secure T-Business payout webhook path is required.');
  }
  return path;
}

export function createHttpHandler({
  paymentService,
  tbankPaymentService = null,
  tbankCallbackSecret = '',
  cryptoUsdcPaymentService = null,
  cryptoUsdcSharedSecret = '',
  agentPetService,
  mediaStorage,
  webhookPath,
  referralService,
  referralOfferTrackingSecret = '',
  referralOfferUrl = '',
  referralOfferDocumentSha256 = '',
  payoutService,
  tbankPayoutAuthorityEnabled = false,
  tbankPayoutNotificationService = null,
  tbankPayoutWebhookPath = '',
  payoutAgentId = '',
  onPayoutSetupCompleted = async () => {},
  now = () => new Date(),
  onError = () => {}
} = {}) {
  if (!paymentService?.processWebhook) throw new TypeError('Payment service is required.');
  if (tbankPaymentService && Buffer.byteLength(String(tbankCallbackSecret), 'utf8') < 32) {
    throw new TypeError('A strong T-Bank callback secret is required.');
  }
  if (cryptoUsdcPaymentService && Buffer.byteLength(String(cryptoUsdcSharedSecret), 'utf8') < 32) {
    throw new TypeError('A strong Crypto USDC callback secret is required.');
  }
  const securedWebhookPath = safeWebhookPath(webhookPath);
  const securedTbankPayoutWebhookPath = safeTbankPayoutWebhookPath(tbankPayoutWebhookPath);
  return async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(response, 200, { ok: true });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/payments/return') {
        sendHtml(response, 200, '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>оплата принята</title><body><main><h1>оплата обрабатывается</h1><p>можно вернуться в Telegram. бот сообщит, когда YooKassa подтвердит платёж.</p></main></body></html>');
        return;
      }
      const offerOpenMatch = request.method === 'GET'
        ? url.pathname.match(/^\/referral\/offer\/open\/([A-Za-z0-9._-]{40,1024})$/u)
        : null;
      if (offerOpenMatch) {
        if (
          Buffer.byteLength(String(referralOfferTrackingSecret), 'utf8') < 32
          || !/^https:\/\//u.test(String(referralOfferUrl))
          || !/^[a-f0-9]{64}$/u.test(String(referralOfferDocumentSha256))
          || typeof referralService?.recordPartnerOfferOpen !== 'function'
        ) {
          sendJson(response, 503, { ok: false });
          return;
        }
        const opened = verifyReferralOfferTrackingToken({
          token: offerOpenMatch[1],
          secret: referralOfferTrackingSecret,
          now: now()
        });
        await referralService.recordPartnerOfferOpen({
          telegramId: opened.telegramId,
          offerVersion: opened.offerVersion,
          documentSha256: referralOfferDocumentSha256,
          openedAt: now(),
          sourceEventId: createHash('sha256').update(offerOpenMatch[1]).digest('hex'),
          metadata: { source: 'offer_tracking_redirect' }
        });
        sendRedirect(response, referralOfferUrl);
        return;
      }
      if (request.method === 'POST' && securedTbankPayoutWebhookPath && url.pathname === securedTbankPayoutWebhookPath) {
        const notificationService = tbankPayoutAuthorityEnabled
          ? tbankPayoutNotificationService
          : payoutService;
        if (!notificationService?.processNotification) {
          sendJson(response, tbankPayoutAuthorityEnabled ? 503 : 404, { ok: false });
          return;
        }
        const payload = await jsonBody(request);
        await notificationService.processNotification(payload);
        sendText(response, 200, 'OK');
        return;
      }
      const payoutPageMatch = request.method === 'GET'
        ? url.pathname.match(/^\/payout\/setup\/([A-Za-z0-9_-]{16,128})$/u)
        : null;
      const payoutBanksMatch = request.method === 'GET'
        ? url.pathname.match(/^\/payout\/setup\/([A-Za-z0-9_-]{16,128})\/banks$/u)
        : null;
      const payoutCompleteMatch = request.method === 'POST'
        ? url.pathname.match(/^\/payout\/setup\/([A-Za-z0-9_-]{16,128})\/complete$/u)
        : null;
      if (payoutPageMatch || payoutBanksMatch || payoutCompleteMatch) {
        const token = payoutSetupToken((payoutPageMatch || payoutBanksMatch || payoutCompleteMatch)[1]);
        const setup = await referralService?.getPayoutSetup?.(token);
        if (!setup || setup.status !== 'pending' || new Date(setup.expiresAt).valueOf() <= Date.now()) {
          sendJson(response, 404, { ok: false, error: 'payout_setup_not_found' });
          return;
        }
        if (payoutBanksMatch) {
          if (setup.method !== 'sbp' || !payoutService?.listSbpBanks) {
            sendJson(response, 404, { ok: false });
            return;
          }
          const banks = await payoutService.listSbpBanks();
          sendJson(response, 200, {
            ok: true,
            banks: banks
              .filter((bank) => bank && /^[A-Za-z0-9_-]{6,64}$/u.test(String(bank.bankId ?? bank.bank_id ?? '')))
              .slice(0, 500)
              .map((bank) => ({
                bankId: String(bank.bankId ?? bank.bank_id),
                name: String(bank.name ?? bank.bankName ?? '').replace(/[\u0000-\u001f\u007f]/gu, '').slice(0, 120)
              }))
          });
          return;
        }
        if (payoutCompleteMatch) {
          const payload = await jsonBody(request);
          const destinationData = payload && typeof payload === 'object' && !Array.isArray(payload)
            ? {
              payoutToken: typeof payload.payout_token === 'string' ? payload.payout_token : undefined,
              first6: typeof payload.first6 === 'string' ? payload.first6 : undefined,
              last4: typeof payload.last4 === 'string' ? payload.last4 : undefined,
              issuerName: typeof payload.issuer_name === 'string' ? payload.issuer_name : undefined,
              phone: typeof payload.phone === 'string' ? payload.phone : undefined,
              bankId: typeof payload.bankId === 'string' ? payload.bankId : undefined,
              bankName: typeof payload.bankName === 'string' ? payload.bankName : undefined
            }
            : {};
          const withdrawal = await referralService.completePayoutSetup({ setupToken: token, destinationData });
          await onPayoutSetupCompleted(withdrawal);
          sendJson(response, 200, { ok: true, withdrawalId: String(withdrawal.withdrawalId) });
          return;
        }
        if (setup.method === 'bank_card' && !String(payoutAgentId)) {
          sendJson(response, 503, { ok: false, error: 'payout_card_widget_not_configured' });
          return;
        }
        sendPayoutHtml(response, 200, payoutSetupPage(setup, { payoutAgentId, token }));
        return;
      }
      const mediaMatch = request.method === 'GET'
        ? url.pathname.match(/^\/media\/([A-Za-z0-9_-]{32})$/u)
        : null;
      const shortMediaMatch = request.method === 'GET'
        ? url.pathname.match(/^\/f\/([A-Za-z0-9_-]{8})$/u)
        : null;
      if (mediaMatch || shortMediaMatch) {
        const media = mediaMatch
          ? await mediaStorage?.read?.(mediaMatch[1])
          : await mediaStorage?.readShort?.(shortMediaMatch[1]);
        if (!media) {
          sendJson(response, 404, { ok: false });
          return;
        }
        sendMedia(response, media);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/agentpet/analyze') {
        if (!agentPetService?.analyze) {
          sendJson(response, 503, { ok: false });
          return;
        }
        const event = await jsonBody(request);
        const forwarded = String(request.headers['x-forwarded-for'] ?? '').split(',', 1)[0].trim();
        const clientKey = forwarded || request.socket?.remoteAddress || 'unknown';
        const analysis = await agentPetService.analyze(event, { clientKey });
        sendJson(response, 200, analysis);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/internal/tbank/confirmed') {
        if (!tbankPaymentService?.processCallback) {
          sendJson(response, 404, { ok: false });
          return;
        }
        const raw = await rawBody(request);
        if (!verifySignedCallback(raw, request, tbankCallbackSecret, now)) {
          sendJson(response, 403, { ok: false });
          return;
        }
        await tbankPaymentService.processCallback(parseJson(raw));
        sendText(response, 200, 'OK');
        return;
      }
      if (request.method === 'POST' && url.pathname === '/internal/crypto-usdc/confirmed') {
        if (!cryptoUsdcPaymentService?.processCallback) {
          sendJson(response, 404, { ok: false });
          return;
        }
        const raw = await rawBody(request);
        if (!verifySignedCallback(raw, request, cryptoUsdcSharedSecret, now)) {
          sendJson(response, 403, { ok: false });
          return;
        }
        await cryptoUsdcPaymentService.processCallback(parseJson(raw));
        sendText(response, 200, 'OK');
        return;
      }
      if (request.method === 'POST' && url.pathname === securedWebhookPath) {
        const event = await jsonBody(request);
        await paymentService.processWebhook(event);
        sendJson(response, 200, { ok: true });
        return;
      }
      sendJson(response, 404, { ok: false });
    } catch (error) {
      onError(error, { action: 'http_request', method: request.method, path: request.url });
      sendJson(response, error.statusCode ?? 500, { ok: false });
    }
  };
}

export function startHttpServer({
  port,
  paymentService,
  tbankPaymentService,
  tbankCallbackSecret,
  cryptoUsdcPaymentService,
  cryptoUsdcSharedSecret,
  agentPetService,
  mediaStorage,
  webhookPath,
  referralService,
  referralOfferTrackingSecret,
  referralOfferUrl,
  referralOfferDocumentSha256,
  payoutService,
  tbankPayoutAuthorityEnabled,
  tbankPayoutNotificationService,
  tbankPayoutWebhookPath,
  payoutAgentId,
  onPayoutSetupCompleted,
  now,
  onError = () => {}
} = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65_535) throw new TypeError('Invalid HTTP port.');
  const server = createServer(createHttpHandler({
    paymentService,
    tbankPaymentService,
    tbankCallbackSecret,
    cryptoUsdcPaymentService,
    cryptoUsdcSharedSecret,
    agentPetService,
    mediaStorage,
    webhookPath,
    referralService,
    referralOfferTrackingSecret,
    referralOfferUrl,
    referralOfferDocumentSha256,
    payoutService,
    tbankPayoutAuthorityEnabled,
    tbankPayoutNotificationService,
    tbankPayoutWebhookPath,
    payoutAgentId,
    onPayoutSetupCompleted,
    now,
    onError
  }));
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}
