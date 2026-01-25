import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

// In-memory cache - long TTL to survive navigation
let userCache: any = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Get Telegram user ID
export function getTelegramUserId(): number | null {
  if (typeof window !== 'undefined') {
    const telegram = (window as any).Telegram;
    if (telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return telegram.WebApp.initDataUnsafe.user.id;
    }
    
    // Fallback for testing in browser (not through Telegram)
    const testIdKey = 'test_telegram_id';
    let testId = localStorage.getItem(testIdKey);
    if (!testId) {
      testId = String(Math.floor(Math.random() * 900000000) + 100000000);
      localStorage.setItem(testIdKey, testId);
      console.warn('⚠️ Using test Telegram ID for browser testing:', testId);
    }
    return parseInt(testId, 10);
  }
  return null;
}

// Get or create user with in-memory caching
export async function getOrCreateUser(forceRefresh = false) {
  const telegramId = getTelegramUserId();
  if (!telegramId) {
    console.error('❌ No Telegram user ID');
    return null;
  }

  // Return cached user if available and fresh
  const now = Date.now();
  if (!forceRefresh && userCache && userCache.telegram_id === telegramId && (now - cacheTime) < CACHE_DURATION) {
    console.log('✅ Using cached user:', userCache.id, 'Balance:', userCache.metacoins_balance, 'Sub:', userCache.subscription_type);
    return userCache;
  }

  console.log('🔵 Fetching user from Supabase for Telegram ID:', telegramId);

  try {
    // Direct Supabase query with no-cache headers
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase error:', error);
      return userCache; // Return cached user on error
    }

    if (data) {
      console.log('✅ User found:', data.id, 'Balance:', data.metacoins_balance, 'Sub:', data.subscription_type);
      userCache = data;
      cacheTime = now;
      return data;
    }

    console.log('🔵 Creating new user...');

    // Create new user
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
    userCache = newUser;
    cacheTime = now;
    return newUser;
  } catch (error) {
    console.error('❌ Critical error in getOrCreateUser:', error);
    return userCache; // Return cached user on error
  }
}

// Track metacoins purchase
export async function trackMetacoinsPurchase(amount: number) {
  console.log('🔵 trackMetacoinsPurchase called with amount:', amount);
  
  const user = await getOrCreateUser(false); // Use cache
  if (!user) {
    console.error('❌ trackMetacoinsPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  const newBalance = user.metacoins_balance + amount;

  try {
    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ metacoins_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating balance:', updateError);
      return false;
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('metacoins_transactions')
      .insert({
        user_id: user.id,
        amount,
        balance_before: user.metacoins_balance,
        balance_after: newBalance,
        transaction_type: 'purchase',
        description: `Покупка ${amount} метакоинов`,
      });

    if (txError) {
      console.error('❌ Error creating transaction:', txError);
    }

    console.log('✅ Purchase successful. New balance:', newBalance);
    
    // Update cache
    userCache = { ...user, metacoins_balance: newBalance };
    cacheTime = Date.now();
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackMetacoinsPurchase:', error);
    return false;
  }
}

// Track metacoins spend
export async function trackMetacoinsSpend(
  actionType: 'analysis' | 'search' | 'scenario' | 'tracking',
  cost: number
) {
  console.log('🔵 trackMetacoinsSpend START:', actionType, 'cost:', cost);
  
  try {
    console.log('🔵 Current cache state:', { 
      hasCachedUser: !!userCache, 
      cacheAge: userCache ? Date.now() - cacheTime : 'N/A',
      cachedBalance: userCache?.metacoins_balance 
    });
    
    // Use cached user first
    const user = await getOrCreateUser(false);
    if (!user) {
      console.error('❌ trackMetacoinsSpend: No user found');
      alert('DEBUG: No user found');
      return false;
    }

    console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance, 'Subscription:', user.subscription_type);

    // Check balance from cache
    if (user.metacoins_balance < cost) {
      console.error('❌ Insufficient balance. Required:', cost, 'Available:', user.metacoins_balance);
      alert(`DEBUG: Insufficient balance. Required: ${cost}, Available: ${user.metacoins_balance}`);
      return false;
    }

    const newBalance = user.metacoins_balance - cost;
    console.log('🔵 Will update balance from', user.metacoins_balance, 'to', newBalance);

    console.log('🔵 Step 1: Updating balance in Supabase via direct fetch...');
    console.log('🔵 Fetch URL:', `${supabaseUrl}/rest/v1/users?id=eq.${user.id}`);
    console.log('🔵 Fetch body:', JSON.stringify({ metacoins_balance: newBalance }));
    
    // Use direct fetch instead of Supabase JS client (Telegram WebApp issue)
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ metacoins_balance: newBalance }),
      }
    );

    console.log('🔵 Update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Error updating balance:', updateResponse.status, errorText);
      alert(`DEBUG UPDATE ERROR: ${updateResponse.status} - ${errorText.substring(0, 100)}`);
      return false;
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ Balance updated successfully in Supabase:', updateData);
    alert(`DEBUG: Balance updated! Old: ${user.metacoins_balance}, New: ${newBalance}`);

    console.log('🔵 Step 2: Creating transaction record via direct fetch...');
    // Create transaction record using direct fetch
    const txResponse = await fetch(
      `${supabaseUrl}/rest/v1/metacoins_transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: -cost,
          balance_before: user.metacoins_balance,
          balance_after: newBalance,
          transaction_type: 'spend',
          description: `Использование: ${actionType}`,
        }),
      }
    );

    if (!txResponse.ok) {
      const errorText = await txResponse.text();
      console.error('❌ Error creating transaction:', txResponse.status, errorText);
      // Don't fail the whole operation if transaction logging fails
    } else {
      const txData = await txResponse.json();
      console.log('✅ Transaction created:', txData);
    }

    console.log('✅ Spend successful. New balance:', newBalance);
    
    // Update cache
    userCache = { ...user, metacoins_balance: newBalance };
    cacheTime = Date.now();
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackMetacoinsSpend:', error);
    alert(`DEBUG CATCH ERROR: ${error}`);
    return false;
  }
}

// Track subscription purchase
export async function trackSubscriptionPurchase(subscriptionType: 'premium', months: number) {
  console.log('🔵 trackSubscriptionPurchase called:', subscriptionType, 'months:', months);
  
  const user = await getOrCreateUser(false); // Use cache
  if (!user) {
    console.error('❌ trackSubscriptionPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  // Calculate bonus metacoins
  const bonusMetacoins = months * 1000;
  const newBalance = user.metacoins_balance + bonusMetacoins;

  try {
    // Update subscription and balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        subscription_type: subscriptionType,
        metacoins_balance: newBalance,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
      return false;
    }

    // Create transaction record for bonus
    const { error: txError } = await supabase
      .from('metacoins_transactions')
      .insert({
        user_id: user.id,
        amount: bonusMetacoins,
        balance_before: user.metacoins_balance,
        balance_after: newBalance,
        transaction_type: 'subscription_bonus',
        description: `Бонус за подписку: ${months} мес.`,
      });

    if (txError) {
      console.error('❌ Error creating transaction:', txError);
    }

    console.log('✅ Subscription purchase successful. New balance:', newBalance);
    console.log('💰 Bonus metacoins:', bonusMetacoins);
    
    // Update cache
    userCache = { ...user, subscription_type: subscriptionType, metacoins_balance: newBalance };
    cacheTime = Date.now();
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackSubscriptionPurchase:', error);
    return false;
  }
}

// Get fresh user balance (for UI updates)
export async function getUserBalance(): Promise<number> {
  const user = await getOrCreateUser(false); // Use cache
  return user?.metacoins_balance || 0;
}
