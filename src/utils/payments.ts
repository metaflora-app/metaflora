import { openLink } from '../app/telegram/telegramHelpers';
import { getOrCreateUser } from './supabase';

const API_BASE_URL = 'https://metaflora-service.ru';
const PENDING_PAYMENT_KEY = 'metaflora_pending_yookassa_payment';

export type CheckoutProductId =
  | 'subscription_1month'
  | 'subscription_3months'
  | 'metacoins_30000'
  | 'metacoins_150000';

interface CreatePaymentResponse {
  success: boolean;
  paymentId: string;
  checkoutUrl: string;
  productId: CheckoutProductId;
  kind: 'subscription' | 'metacoins';
  amountRub: number;
  months: number | null;
  metacoinsAmount: number | null;
}

export interface PendingPayment {
  paymentId: string;
  checkoutUrl: string;
  productId: CheckoutProductId;
  kind: 'subscription' | 'metacoins';
  amountRub: number;
  months: number | null;
  metacoinsAmount: number | null;
  createdAt: number;
}

export interface PaymentStatusResponse {
  success: boolean;
  state: string;
  productId?: CheckoutProductId;
  kind?: 'subscription' | 'metacoins';
  applied?: boolean;
  alreadyApplied?: boolean;
  months?: number | null;
  metacoinsAmount?: number | null;
  newBalance?: number;
  firstPurchase?: boolean;
  subscriptionEndDate?: string;
  error?: string;
}

export interface PaymentCancelResponse {
  success: boolean;
  state: string;
  paymentId: string;
  cancellationReason?: string | null;
  error?: string;
}

export async function createCheckoutPayment(productId: CheckoutProductId): Promise<PendingPayment> {
  const user = await getOrCreateUser(false);
  if (!user?.id) {
    throw new Error('не удалось получить пользователя');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      product_id: productId,
    }),
  });

  const payload = await response.json() as CreatePaymentResponse & { error?: string };
  if (!response.ok || !payload.success || !payload.checkoutUrl || !payload.paymentId) {
    throw new Error(payload.error || 'не удалось создать оплату');
  }

  const pendingPayment: PendingPayment = {
    paymentId: payload.paymentId,
    checkoutUrl: payload.checkoutUrl,
    productId: payload.productId,
    kind: payload.kind,
    amountRub: payload.amountRub,
    months: payload.months,
    metacoinsAmount: payload.metacoinsAmount,
    createdAt: Date.now(),
  };

  writePendingPayment(pendingPayment);
  return pendingPayment;
}

export function redirectToCheckout(checkoutUrl: string): void {
  if (typeof window !== 'undefined') {
    window.location.assign(checkoutUrl);
    return;
  }

  openLink(checkoutUrl);
}

export function writePendingPayment(payment: PendingPayment): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

export function readPendingPayment(): PendingPayment | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPayment;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_PAYMENT_KEY);
}

export async function getCheckoutPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payments/status/${paymentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = await response.json() as PaymentStatusResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'не удалось проверить статус оплаты');
  }

  return payload;
}

export async function cancelCheckoutPayment(paymentId: string): Promise<PaymentCancelResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payments/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });

  const payload = await response.json() as PaymentCancelResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'не удалось отменить оплату');
  }

  return payload;
}
