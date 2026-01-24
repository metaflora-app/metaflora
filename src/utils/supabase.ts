import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get Telegram user ID
export function getTelegramUserId(): number | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  }
  return null;
}

// Get or create user
export async function getOrCreateUser() {
  const telegramId = getTelegramUserId();
  if (!telegramId) {
    console.error('No Telegram user ID');
    return null;
  }

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user with initial 150 metacoins
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      username: telegramUser?.username || null,
      first_name: telegramUser?.first_name || null,
      last_name: telegramUser?.last_name || null,
      subscription_type: 'free',
      metacoins_balance: 150,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating user:', createError);
    return null;
  }

  // Create initial metacoins transaction
  await supabase.from('metacoins_transactions').insert({
    user_id: newUser.id,
    amount: 150,
    balance_before: 0,
    balance_after: 150,
    transaction_type: 'initial',
    description: 'Начальное начисление метакоинов при регистрации',
  });

  return newUser;
}

// Track metacoins purchase
export async function trackMetacoinsPurchase(amount: number) {
  const user = await getOrCreateUser();
  if (!user) return false;

  const newBalance = user.metacoins_balance + amount;

  // Update user balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ metacoins_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating balance:', updateError);
    return false;
  }

  // Create transaction
  await supabase.from('metacoins_transactions').insert({
    user_id: user.id,
    amount,
    balance_before: user.metacoins_balance,
    balance_after: newBalance,
    transaction_type: 'purchase',
    description: `Покупка ${amount} метакоинов`,
  });

  return true;
}

// Track metacoins spend
export async function trackMetacoinsSpend(
  actionType: 'analysis' | 'search' | 'scenario' | 'tracking',
  cost: number
) {
  const user = await getOrCreateUser();
  if (!user) return false;

  if (user.metacoins_balance < cost) {
    console.error('Insufficient balance');
    return false;
  }

  const newBalance = user.metacoins_balance - cost;

  // Update user balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ metacoins_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating balance:', updateError);
    return false;
  }

  // Create transaction
  const actionNames = {
    analysis: 'Анализ контента',
    search: 'Поиск аккаунта',
    scenario: 'Создание сценария',
    tracking: 'Отслеживание аккаунта',
  };

  await supabase.from('metacoins_transactions').insert({
    user_id: user.id,
    amount: -cost,
    balance_before: user.metacoins_balance,
    balance_after: newBalance,
    transaction_type: `spend_${actionType}`,
    description: actionNames[actionType],
  });

  return true;
}

// Track subscription purchase
export async function trackSubscriptionPurchase(subscriptionType: 'premium', months: number) {
  const user = await getOrCreateUser();
  if (!user) return false;

  const bonusMetacoins = months === 1 ? 150 : months === 3 ? 500 : 0;
  const newBalance = user.metacoins_balance + bonusMetacoins;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  // Update user subscription
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_type: subscriptionType,
      metacoins_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
    return false;
  }

  // Create bonus transaction
  if (bonusMetacoins > 0) {
    await supabase.from('metacoins_transactions').insert({
      user_id: user.id,
      amount: bonusMetacoins,
      balance_before: user.metacoins_balance,
      balance_after: newBalance,
      transaction_type: 'subscription_bonus',
      description: `Бонус ${bonusMetacoins} метакоинов при покупке подписки на ${months} мес.`,
    });
  }

  return true;
}
