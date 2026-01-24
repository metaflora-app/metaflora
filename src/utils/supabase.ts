import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get Telegram user ID
export function getTelegramUserId(): number | null {
  if (typeof window !== 'undefined') {
    const telegram = (window as any).Telegram;
    if (telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return telegram.WebApp.initDataUnsafe.user.id;
    }
    
    // Fallback for testing in browser (not through Telegram)
    // Generate a test ID based on localStorage or create a new one
    const testIdKey = 'test_telegram_id';
    let testId = localStorage.getItem(testIdKey);
    if (!testId) {
      // Generate random test ID between 100000000 and 999999999
      testId = String(Math.floor(Math.random() * 900000000) + 100000000);
      localStorage.setItem(testIdKey, testId);
      console.warn('⚠️ Using test Telegram ID for browser testing:', testId);
    }
    return parseInt(testId, 10);
  }
  return null;
}

// Get or create user
export async function getOrCreateUser() {
  const telegramId = getTelegramUserId();
  if (!telegramId) {
    console.error('❌ No Telegram user ID');
    return null;
  }

  console.log('🔵 getOrCreateUser called for Telegram ID:', telegramId);

  // Check if user exists
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('❌ Error fetching user:', selectError);
    return null;
  }

  if (existingUser) {
    console.log('✅ Existing user found:', existingUser.id);
    return existingUser;
  }

  console.log('🔵 Creating new user...');

  // Create new user WITHOUT initial metacoins (only on subscription purchase)
  const telegram = typeof window !== 'undefined' ? (window as any).Telegram : null;
  const telegramUser = telegram?.WebApp?.initDataUnsafe?.user;
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      username: telegramUser?.username || null,
      first_name: telegramUser?.first_name || null,
      last_name: telegramUser?.last_name || null,
      subscription_type: 'free',
      metacoins_balance: 0,
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating user:', createError);
    return null;
  }

  console.log('✅ New user created:', newUser.id);
  return newUser;
}

// Track metacoins purchase
export async function trackMetacoinsPurchase(amount: number) {
  console.log('🔵 trackMetacoinsPurchase called with amount:', amount);
  
  const user = await getOrCreateUser();
  if (!user) {
    console.error('❌ trackMetacoinsPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  const newBalance = user.metacoins_balance + amount;

  // Update user balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ metacoins_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating balance:', updateError);
    return false;
  }

  console.log('✅ Balance updated successfully. New balance:', newBalance);

  // Create transaction
  const { error: transactionError } = await supabase.from('metacoins_transactions').insert({
    user_id: user.id,
    amount,
    balance_before: user.metacoins_balance,
    balance_after: newBalance,
    transaction_type: 'purchase',
    description: `Покупка ${amount} метакоинов`,
  });

  if (transactionError) {
    console.error('❌ Error creating transaction:', transactionError);
    return false;
  }

  console.log('✅ Transaction created successfully');
  return true;
}

// Track metacoins spend
export async function trackMetacoinsSpend(
  actionType: 'analysis' | 'search' | 'scenario' | 'tracking',
  cost: number
) {
  console.log('🔵 trackMetacoinsSpend called:', actionType, 'cost:', cost);
  
  const user = await getOrCreateUser();
  if (!user) {
    console.error('❌ trackMetacoinsSpend: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  if (user.metacoins_balance < cost) {
    console.error('❌ Insufficient balance. Required:', cost, 'Available:', user.metacoins_balance);
    return false;
  }

  const newBalance = user.metacoins_balance - cost;

  // Update user balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ metacoins_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating balance:', updateError);
    return false;
  }

  console.log('✅ Balance updated successfully. New balance:', newBalance);

  // Create transaction
  const actionNames = {
    analysis: 'Анализ контента',
    search: 'Поиск аккаунта',
    scenario: 'Создание сценария',
    tracking: 'Отслеживание аккаунта',
  };

  const { error: transactionError } = await supabase.from('metacoins_transactions').insert({
    user_id: user.id,
    amount: -cost,
    balance_before: user.metacoins_balance,
    balance_after: newBalance,
    transaction_type: `spend_${actionType}`,
    description: actionNames[actionType],
  });

  if (transactionError) {
    console.error('❌ Error creating transaction:', transactionError);
    return false;
  }

  console.log('✅ Transaction created successfully');
  return true;
}

// Track subscription purchase
export async function trackSubscriptionPurchase(subscriptionType: 'premium', months: number) {
  console.log('🔵 trackSubscriptionPurchase called:', subscriptionType, 'months:', months);
  
  const user = await getOrCreateUser();
  if (!user) {
    console.error('❌ trackSubscriptionPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  const bonusMetacoins = months === 1 ? 150 : months === 3 ? 500 : 0;
  const newBalance = user.metacoins_balance + bonusMetacoins;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  console.log('💰 Bonus metacoins:', bonusMetacoins, 'New balance:', newBalance);

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
    console.error('❌ Error updating subscription:', updateError);
    return false;
  }

  console.log('✅ Subscription updated successfully');

  // Create bonus transaction
  if (bonusMetacoins > 0) {
    const { error: transactionError } = await supabase.from('metacoins_transactions').insert({
      user_id: user.id,
      amount: bonusMetacoins,
      balance_before: user.metacoins_balance,
      balance_after: newBalance,
      transaction_type: 'subscription_bonus',
      description: `Бонус ${bonusMetacoins} метакоинов при покупке подписки на ${months} мес.`,
    });

    if (transactionError) {
      console.error('❌ Error creating bonus transaction:', transactionError);
      return false;
    }

    console.log('✅ Bonus transaction created successfully');
  }

  return true;
}
