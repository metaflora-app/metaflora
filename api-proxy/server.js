import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = 'https://lwjsbflvsmscfrdkejia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3anNiZmx2c21zY2ZyZGtlamlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgzMjEsImV4cCI6MjA4NDYwNDMyMX0.sf_9yMijf066geuGGjv0ylxRxKueaaC2J9u5z6Xa6sI';

// Enable CORS for all origins (Telegram WebApp)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Get user by telegram_id
app.get('/api/user', async (req, res) => {
  try {
    const { telegram_id } = req.query;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegram_id}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    const data = await response.json();
    res.json(data[0] || null);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user balance
app.patch('/api/user/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ metacoins_balance: balance }),
      }
    );
    
    const data = await response.json();
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post('/api/transaction', async (req, res) => {
  try {
    const transaction = req.body;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/metacoins_transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(transaction),
      }
    );
    
    const data = await response.json();
    res.json(data[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Proxy running on port ${PORT}`);
});
