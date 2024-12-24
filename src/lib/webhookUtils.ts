import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

export function verifyWooCommerceWebhook(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
