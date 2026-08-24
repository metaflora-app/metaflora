CREATE OR REPLACE FUNCTION neuro.list_referral_people_v2(p_telegram_id bigint,p_limit integer DEFAULT 20)
RETURNS TABLE(telegram_id bigint,username text,first_name text,created_at timestamptz,first_payment_at timestamptz,turnover_kopecks bigint)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id)
SELECT referred.telegram_user_id,referred.username,referred.first_name,relation.referred_at,
  min(payment.paid_at),COALESCE(sum(payment.gross_amount_kopecks) FILTER(WHERE payment.status='confirmed'),0)::bigint
FROM neuro.referral_relations relation
JOIN neuro.users referred ON referred.id=relation.referred_user_id
LEFT JOIN neuro.referral_qualifying_payments payment ON payment.referred_user_id=relation.referred_user_id
  AND payment.referrer_user_id=relation.referrer_user_id
WHERE relation.referrer_user_id=(SELECT id FROM target)
GROUP BY referred.telegram_user_id,referred.username,referred.first_name,relation.referred_at
ORDER BY relation.referred_at DESC LIMIT LEAST(GREATEST(p_limit,1),100)
$$;

CREATE OR REPLACE FUNCTION neuro.list_referral_earnings_v2(p_telegram_id bigint,p_limit integer DEFAULT 20)
RETURNS TABLE(amount_kopecks bigint,percent integer,status text,created_at timestamptz,username text,first_name text,payment_amount_kopecks bigint,invitee_bonus_metacoins integer)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id)
SELECT earning.amount_kopecks,earning.percent,earning.status,earning.created_at,referred.username,referred.first_name,
  payment.gross_amount_kopecks,COALESCE(bonus.amount_metacoins,0)
FROM neuro.referral_cash_earnings earning
JOIN neuro.users referred ON referred.id=earning.referred_user_id
JOIN neuro.referral_qualifying_payments payment ON payment.id=earning.payment_id
LEFT JOIN neuro.referral_metacoin_bonuses bonus ON bonus.payment_id=payment.id AND bonus.beneficiary_role='invitee'
WHERE earning.referrer_user_id=(SELECT id FROM target)
ORDER BY earning.created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100)
$$;

REVOKE ALL ON FUNCTION neuro.list_referral_people_v2(bigint,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.list_referral_earnings_v2(bigint,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION neuro.list_referral_people_v2(bigint,integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.list_referral_earnings_v2(bigint,integer) TO service_role;
