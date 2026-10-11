export type WebhookProvider = 'Stripe' | 'GitHub' | 'Clerk' | 'Shopify' | 'Custom';

export async function buildWebhookHeaders(provider: WebhookProvider, event: string, body: string, secret: string,
  timestamp = Math.floor(Date.now() / 1000), deliveryId = crypto.randomUUID(), cryptoApi: Crypto = crypto): Promise<Record<string, string>> {
  if (!secret.trim()) throw new Error('Enter the signing secret configured on your webhook handler.');
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(secret);
  if (provider === 'Clerk') {
    try {
      if (!secret.startsWith('whsec_')) throw new Error();
      keyBytes = Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0));
      if (!keyBytes.length) throw new Error();
    } catch { throw new Error('Clerk requires a valid base64 whsec_ signing secret.'); }
  }
  const message = provider === 'Stripe' ? `${timestamp}.${body}` : provider === 'Clerk' ? `${deliveryId}.${timestamp}.${body}` : body;
  const key = await cryptoApi.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await cryptoApi.subtle.sign('HMAC', key, encoder.encode(message)));
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  const base64 = btoa(String.fromCharCode(...bytes));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'Stripe') headers['Stripe-Signature'] = `t=${timestamp},v1=${hex}`;
  else if (provider === 'GitHub') Object.assign(headers, { 'X-GitHub-Event': event.split('.')[0], 'X-GitHub-Delivery': deliveryId, 'X-Hub-Signature-256': `sha256=${hex}` });
  else if (provider === 'Clerk') Object.assign(headers, { 'svix-id': deliveryId, 'svix-timestamp': String(timestamp), 'svix-signature': `v1,${base64}` });
  else if (provider === 'Shopify') Object.assign(headers, { 'X-Shopify-Topic': event, 'X-Shopify-Webhook-Id': deliveryId, 'X-Shopify-Hmac-Sha256': base64 });
  else headers['X-Webhook-Signature'] = `sha256=${hex}`;
  return headers;
}
