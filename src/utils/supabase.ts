import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI';

// API URL for proxy server (веб-сервис)
const API_URL = 'https://service-production-f0b1.up.railway.app/api';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

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

// Get or create user (uses proxy API to bypass Telegram cache)
export async function getOrCreateUser() {
  const telegramId = getTelegramUserId();
  if (!telegramId) {
    console.error('❌ No Telegram user ID');
    return null;
  }

  console.log('🔵 getOrCreateUser called for Telegram ID:', telegramId);

  try {
    // Use proxy API instead of direct Supabase call
    const response = await fetch(
      `${API_URL}/user?telegram_id=${telegramId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('❌ Error fetching user:', response.status, response.statusText);
      return null;
    }

    const user = await response.json();
    
    if (user) {
      console.log('✅ User found:', user.id, 'Balance:', user.metacoins_balance, 'Sub:', user.subscription_type);
      return user;
    }

    console.log('🔵 Creating new user...');

    // Create new user via proxy API
    const telegram = typeof window !== 'undefined' ? (window as any).Telegram : null;
    const telegramUser = telegram?.WebApp?.initDataUnsafe?.user;
    
    const createResponse = await fetch(`${API_URL}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        username: telegramUser?.username || null,
        first_name: telegramUser?.first_name || null,
        last_name: telegramUser?.last_name || null,
      }),
    });

    if (!createResponse.ok) {
      console.error('❌ Error creating user:', createResponse.status);
      return null;
    }

    const newUser = await createResponse.json();
    console.log('✅ New user created:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('❌ Critical error in getOrCreateUser:', error);
    return null;
  }
}

// Track metacoins purchase (uses proxy API)
export async function trackMetacoinsPurchase(amount: number) {
  console.log('🔵 trackMetacoinsPurchase called with amount:', amount);
  
  const user = await getOrCreateUser();
  if (!user) {
    console.error('❌ trackMetacoinsPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  try {
    const response = await fetch(`${API_URL}/metacoins/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        amount,
      }),
    });

    if (!response.ok) {
      console.error('❌ Error purchasing metacoins:', response.status);
      return false;
    }

    const result = await response.json();
    console.log('✅ Purchase successful. New balance:', result.newBalance);
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance: result.newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackMetacoinsPurchase:', error);
    return false;
  }
}

// Track metacoins spend (uses proxy API)
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

  // Check balance locally first
  if (user.metacoins_balance < cost) {
    console.error('❌ Insufficient balance. Required:', cost, 'Available:', user.metacoins_balance);
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/metacoins/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        cost,
        action_type: actionType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error spending metacoins:', error);
      return false;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Spend failed:', result.error);
      return false;
    }

    console.log('✅ Spend successful. New balance:', result.newBalance);
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance: result.newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackMetacoinsSpend:', error);
    return false;
  }
}

// Track subscription purchase (uses proxy API)
export async function trackSubscriptionPurchase(subscriptionType: 'premium', months: number) {
  console.log('🔵 trackSubscriptionPurchase called:', subscriptionType, 'months:', months);
  
  const user = await getOrCreateUser();
  if (!user) {
    console.error('❌ trackSubscriptionPurchase: No user found');
    return false;
  }

  console.log('✅ User found:', user.id, 'Current balance:', user.metacoins_balance);

  try {
    const response = await fetch(`${API_URL}/subscription/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        subscription_type: subscriptionType,
        months,
      }),
    });

    if (!response.ok) {
      console.error('❌ Error purchasing subscription:', response.status);
      return false;
    }

    const result = await response.json();
    console.log('✅ Subscription purchase successful. New balance:', result.newBalance);
    console.log('💰 Bonus metacoins:', result.bonusMetacoins);
    
    // Trigger balance refresh event
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance: result.newBalance } 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in trackSubscriptionPurchase:', error);
    return false;
  }
}

// Get fresh user balance (for UI updates)
export async function getUserBalance(): Promise<number> {
  const user = await getOrCreateUser();
  return user?.metacoins_balance || 0;
}
