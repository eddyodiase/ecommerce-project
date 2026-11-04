import crypto from 'crypto';

export const PAYMENT_METHODS = ['paystack', 'bank_transfer', 'pay_on_delivery'];

const readEnv = (key) => String(process.env[key] || '').trim();

// Read lazily so tests and `.env` changes are picked up without code changes.
export const paymentConfig = () => ({
  paystackSecretKey: readEnv('PAYSTACK_SECRET_KEY'),
  paystackBaseUrl: readEnv('PAYSTACK_BASE_URL') || 'https://api.paystack.co',
  frontendUrl: (readEnv('FRONTEND_URL') || 'http://localhost:5173').replace(/\/+$/, ''),
  adminApiKey: readEnv('ADMIN_API_KEY'),
  bank: {
    bankName: readEnv('BANK_NAME'),
    accountNumber: readEnv('BANK_ACCOUNT_NUMBER'),
    accountName: readEnv('BANK_ACCOUNT_NAME')
  },
  payOnDeliveryEnabled: readEnv('PAY_ON_DELIVERY_ENABLED') !== 'false',
  paymentWindowMs: (Number(readEnv('ORDER_PAYMENT_TTL_HOURS')) || 24) * 60 * 60 * 1000
});

// Which methods the checkout may offer, plus the public bank details for transfers.
export const availableMethods = () => {
  const config = paymentConfig();
  const bankReady = Boolean(config.bank.bankName && config.bank.accountNumber && config.bank.accountName);
  return {
    paystack: { enabled: Boolean(config.paystackSecretKey) },
    bank_transfer: { enabled: bankReady, account: bankReady ? config.bank : null },
    pay_on_delivery: { enabled: config.payOnDeliveryEnabled }
  };
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

// Admin-only actions (confirming transfers, refunds, cancelling) require the shared ADMIN_API_KEY.
export const requireAdmin = (req, res, next) => {
  const { adminApiKey } = paymentConfig();
  if (!adminApiKey) {
    return res.status(503).json({ error: 'Admin actions are disabled until ADMIN_API_KEY is configured on the server' });
  }
  if (!safeEqual(req.get('x-admin-key') || '', adminApiKey)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  next();
};

// References look like NP.<orderId>.<timestamp>, so a webhook can find its order directly.
export const buildReference = (orderId) => `NP.${orderId}.${Date.now()}`;
export const orderIdFromReference = (reference) => {
  const parts = String(reference || '').split('.');
  return parts.length === 3 && parts[0] === 'NP' ? parts[1] : '';
};

export const isValidPaystackSignature = (rawBody, signature) => {
  const { paystackSecretKey } = paymentConfig();
  if (!paystackSecretKey || !rawBody || !signature) {
    return false;
  }
  const expected = crypto.createHmac('sha512', paystackSecretKey).update(rawBody).digest('hex');
  return safeEqual(String(signature).toLowerCase(), expected);
};

const paystackRequest = async (method, path, body) => {
  const { paystackSecretKey, paystackBaseUrl } = paymentConfig();
  if (!paystackSecretKey) {
    throw new Error('Paystack is not configured');
  }

  const response = await fetch(`${paystackBaseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${paystackSecretKey}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === false) {
    throw new Error(payload.message || `Paystack request failed (${response.status})`);
  }
  return payload.data;
};

// Amounts are kobo, which is what priceCents already is.
export const initializePaystack = ({ email, amountKobo, reference, orderId }) => paystackRequest('POST', '/transaction/initialize', {
  email,
  amount: amountKobo,
  currency: 'NGN',
  reference,
  callback_url: `${paymentConfig().frontendUrl}/payment/callback`,
  metadata: { orderId }
});

export const verifyPaystack = (reference) => paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);

export const refundPaystack = ({ reference, amountKobo, note }) => paystackRequest('POST', '/refund', {
  transaction: reference,
  amount: amountKobo,
  currency: 'NGN',
  merchant_note: note
});
