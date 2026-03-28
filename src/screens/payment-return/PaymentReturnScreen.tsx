import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { Header, ThreeBg } from '../../components/ScreenLayout';
import {
  clearPendingPayment,
  getCheckoutPaymentStatus,
  readPendingPayment,
} from '../../utils/payments';
import { getOrCreateUser } from '../../utils/supabase';

function getFailureRoute(productId: string | undefined): string {
  if (productId?.startsWith('subscription_')) {
    return '/pricing';
  }

  if (productId?.startsWith('metacoins_')) {
    return '/metacoins';
  }

  return '/main-dashboard-premium';
}

export const PaymentReturnScreen: React.FC = () => {
  const navigate = useNavigate();
  const [statusText, setStatusText] = React.useState('проверяем оплату...');
  const [detailsText, setDetailsText] = React.useState('пожалуйста, подождите несколько секунд');

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const pendingPayment = readPendingPayment();

      if (!pendingPayment?.paymentId) {
        navigate('/main-dashboard-premium', { replace: true });
        return;
      }

      const finishSuccess = async (firstPurchase?: boolean) => {
        const freshUser = await getOrCreateUser(true);
        if (freshUser && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balanceUpdated', {
            detail: { newBalance: freshUser.metacoins_balance },
          }));
        }

        if (cancelled) return;

        if (pendingPayment.kind === 'subscription') {
          const planLabel = pendingPayment.months === 3 ? '3 месяца' : '1 месяц';
          showPopupMessage(
            firstPurchase
              ? `подписка на ${planLabel} успешно оплачена. загляните в бота — приготовили подарки`
              : `подписка на ${planLabel} успешно оплачена`
          );
        } else {
          showPopupMessage(`успешно куплено ${pendingPayment.metacoinsAmount} метакоинов`);
        }

        clearPendingPayment();
        navigate('/main-dashboard-premium', { replace: true });
      };

      const finishFailure = (message: string) => {
        if (cancelled) return;
        clearPendingPayment();
        showPopupMessage(message);
        navigate(getFailureRoute(pendingPayment.productId), { replace: true });
      };

      for (let attempt = 0; attempt < 15; attempt += 1) {
        if (cancelled) return;

        const status = await getCheckoutPaymentStatus(pendingPayment.paymentId);

        if (status.state === 'succeeded' && status.success) {
          await finishSuccess(status.firstPurchase);
          return;
        }

        if (status.state === 'succeeded' && !status.success) {
          finishFailure('оплата не прошла. Пожалуйста, попробуйте еще раз, либо свяжитесь с поддержкой metaflora_support');
          return;
        }

        if (status.state === 'canceled') {
          finishFailure('оплата не прошла. Пожалуйста, попробуйте еще раз, либо свяжитесь с поддержкой metaflora_support');
          return;
        }

        setStatusText('ожидаем подтверждение оплаты...');
        setDetailsText('после подтверждения вы автоматически вернетесь в приложение');
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      finishFailure('оплата не прошла. Пожалуйста, попробуйте еще раз, либо свяжитесь с поддержкой metaflora_support');
    };

    void run().catch((error) => {
      console.error('Payment return failed:', error);
      clearPendingPayment();
      showPopupMessage('оплата не прошла. Пожалуйста, попробуйте еще раз, либо свяжитесь с поддержкой metaflora_support');
      navigate('/main-dashboard-premium', { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '94px', top: '560px', width: '992px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '72px', lineHeight: '1', color: '#fff' }}>
            {statusText}
          </p>
        </div>

        <div style={{ position: 'absolute', left: '140px', top: '680px', width: '900px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '38px', lineHeight: '1', color: 'rgba(255,255,255,0.8)' }}>
            {detailsText}
          </p>
        </div>
      </div>
    </div>
  );
};
