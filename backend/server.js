const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const net = require('net');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Load Supabase config (env vars take precedence over config file)
let supabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}
const SUPABASE_CONFIG_PATH = path.join(__dirname, 'supabase-config.json')
try {
  if (fs.existsSync(SUPABASE_CONFIG_PATH)) {
    const fileConfig = JSON.parse(fs.readFileSync(SUPABASE_CONFIG_PATH, 'utf-8'))
    supabaseConfig.supabaseUrl = supabaseConfig.supabaseUrl || fileConfig.supabaseUrl || ''
    supabaseConfig.serviceRoleKey = supabaseConfig.serviceRoleKey || fileConfig.serviceRoleKey || ''
  }
} catch {}

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PAYMENTS_PATH = path.join(__dirname, 'data', 'payments.json');

// Load PayMongo config from file or env var
let paymongoConfig = { secretKey: '', webhookSecret: '' }
const CONFIG_PATH = path.join(__dirname, 'paymongo-config.json')
try {
  if (fs.existsSync(CONFIG_PATH)) {
    paymongoConfig = { ...paymongoConfig, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) }
  }
} catch {}
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || paymongoConfig.secretKey || '';
const PAYMONGO_API = 'https://api.paymongo.com/v1';

function getPaymongoAuth() {
  return Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');
}

function isPaymongoConfigured() {
  return PAYMONGO_SECRET_KEY.length > 0;
}

function readPayments() {
  try { return JSON.parse(fs.readFileSync(PAYMENTS_PATH, 'utf-8')) }
  catch { return [] }
}

function writePayments(data) {
  fs.writeFileSync(PAYMENTS_PATH, JSON.stringify(data, null, 2))
}

app.use(cors());
app.use(express.json());

// --- JWT Verification ---
const jwks = jwksClient({ jwksUri: 'https://pusdssjwtjdkcdgslopc.supabase.co/auth/v1/.well-known/jwks.json' });

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.publicKey);
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['ES256'] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// Middleware: reject if not authenticated
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = await verifyToken(auth.slice(7));
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware: verify user is admin/super admin in Supabase
async function requireAdmin(req, res, next) {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' });
  }
  try {
    const response = await axios.get(
      supabaseConfig.supabaseUrl + '/rest/v1/profiles?id=eq.' + req.user.sub + '&select=role,is_super_admin',
      { headers: { Authorization: 'Bearer ' + supabaseConfig.serviceRoleKey, apikey: supabaseConfig.serviceRoleKey } }
    );
    const profile = response.data?.[0];
    if (!profile || (profile.role !== 'admin' && !profile.is_super_admin)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.profile = profile;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
}

// Apply both middlewares to all /api/admin/, /api/auth/ routes
app.use('/api/admin', requireAuth, requireAdmin);

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Check current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(
      `${supabaseConfig.supabaseUrl}/rest/v1/profiles?id=eq.${req.user.sub}`,
      { headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey } }
    );
    const profile = response.data?.[0];
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ id: req.user.sub, email: req.user.email, ...profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Auth endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token: `token-${user.id}-${Date.now()}` });
});

// Menu endpoints
app.get('/api/menu', (req, res) => {
  const db = readDB();
  res.json(db.menu.filter(m => m.available));
});

app.get('/api/menu/all', (req, res) => {
  const db = readDB();
  res.json(db.menu);
});

app.put('/api/menu/:id', (req, res) => {
  const db = readDB();
  const idx = db.menu.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  db.menu[idx] = { ...db.menu[idx], ...req.body };
  writeDB(db);
  res.json(db.menu[idx]);
});

app.post('/api/menu', (req, res) => {
  const db = readDB();
  const item = { id: Date.now(), ...req.body, available: true };
  db.menu.push(item);
  writeDB(db);
  res.status(201).json(item);
});

app.delete('/api/menu/:id', (req, res) => {
  const db = readDB();
  db.menu = db.menu.filter(m => m.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

// Order endpoints
app.get('/api/orders', (req, res) => {
  const db = readDB();
  const { role, userId, status } = req.query;
  let orders = [...db.orders];
  if (userId) orders = orders.filter(o => o.userId === parseInt(userId));
  if (status) orders = orders.filter(o => o.status === status);
  if (role === 'cook') orders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const { userId, customerName, tableNumber, type, items } = req.body;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: `ORD-${String(db.orders.length + 1).padStart(3, '0')}`,
    userId, customerName, tableNumber, type,
    status: 'pending',
    items, total,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.orders.push(order);
  writeDB(db);
  res.status(201).json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.get('/api/menu/available', (req, res) => {
  const db = readDB();
  res.json(db.menu.filter(m => m.available));
});

app.put('/api/orders/:id', (req, res) => {
  const db = readDB();
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  db.orders[idx] = { ...db.orders[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.orders[idx]);
});

// Cook: mark order item as done
app.put('/api/orders/:id/items/:itemId/done', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const item = order.items.find(i => i.menuItemId === parseInt(req.params.itemId));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.done = true;
  const allDone = order.items.every(i => i.done);
  if (allDone) order.status = 'ready';
  order.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(order);
});

// Admin: Sales report
app.get('/api/admin/sales', (req, res) => {
  const db = readDB();
  const { period } = req.query;
  const orders = db.orders.filter(o => o.status === 'ready' || o.status === 'delivered');
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const categorySales = {};
  db.menu.forEach(m => {
    categorySales[m.category] = 0;
  });
  orders.forEach(o => {
    o.items.forEach(item => {
      const menuItem = db.menu.find(m => m.id === item.menuItemId);
      if (menuItem) {
        categorySales[menuItem.category] = (categorySales[menuItem.category] || 0) + item.price * item.quantity;
      }
    });
  });
  res.json({ totalSales, totalOrders, categorySales, orders });
});

app.get('/api/admin/summary', (req, res) => {
  const db = readDB();
  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter(o => o.status === 'pending').length;
  const preparingOrders = db.orders.filter(o => o.status === 'preparing').length;
  const readyOrders = db.orders.filter(o => o.status === 'ready').length;
  const totalRevenue = db.orders.reduce((sum, o) => sum + o.total, 0);
  const menuItems = db.menu.length;
  res.json({ totalOrders, pendingOrders, preparingOrders, readyOrders, totalRevenue, menuItems });
});

// ===== PayMongo Payment Integration =====

// PayMongo-supported payment method types
const PAYMONGO_METHODS = {
  gcash: { label: 'GCash', icon: '📱' },
  maya: { label: 'Maya', icon: '📱' },
  grab_pay: { label: 'GrabPay', icon: '📱' },
  card: { label: 'Credit/Debit Card', icon: '💳' },
}

// GET /api/payments/config - return PayMongo availability and supported methods
app.get('/api/payments/config', (req, res) => {
  res.json({
    configured: isPaymongoConfigured(),
    methods: isPaymongoConfigured() ? Object.entries(PAYMONGO_METHODS).map(([key, val]) => ({
      type: key,
      ...val,
    })) : [],
  })
})

// POST /api/payments/create-source - create PayMongo source for payment
app.post('/api/payments/create-source', async (req, res) => {
  if (!isPaymongoConfigured()) {
    return res.status(400).json({ error: 'PayMongo is not configured' })
  }

  try {
    const { type, amount, successUrl, failedUrl } = req.body

    if (!PAYMONGO_METHODS[type]) {
      return res.status(400).json({ error: `Unsupported payment type: ${type}` })
    }

    const response = await axios.post(`${PAYMONGO_API}/sources`, {
      data: {
        attributes: {
          type,
          amount: Math.round(amount),
          currency: 'PHP',
          redirect: {
            success: successUrl,
            failed: failedUrl,
          },
        },
      },
    }, {
      headers: {
        'Authorization': `Basic ${getPaymongoAuth()}`,
        'Content-Type': 'application/json',
      },
    })

    const source = response.data.data
    const attrs = source.attributes

    // Track in local payments file
    const payments = readPayments()
    payments.push({
      sourceId: source.id,
      orderRef: req.body.orderRef || '',
      amount: Math.round(amount),
      type,
      status: attrs.status,
      createdAt: new Date().toISOString(),
    })
    writePayments(payments)

    res.json({
      sourceId: source.id,
      checkoutUrl: attrs.redirect.checkout_url,
      status: attrs.status,
    })
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('PayMongo create-source error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to create payment source', detail })
  }
})

// POST /api/payments/webhook - receive PayMongo webhooks
app.post('/api/payments/webhook', async (req, res) => {
  const event = req.body.data
  if (!event) return res.status(400).json({ error: 'Invalid webhook payload' })

  const attrs = event.attributes
  const eventType = attrs?.type

  if (eventType === 'source.chargeable') {
    const sourceData = attrs?.data
    const sourceId = sourceData?.id
    const sourceAttrs = sourceData?.attributes
    const amount = sourceAttrs?.amount

    if (sourceId && amount) {
      try {
        const response = await axios.post(`${PAYMONGO_API}/payments`, {
          data: {
            attributes: {
              amount,
              currency: 'PHP',
              source: { id: sourceId },
            },
          },
        }, {
          headers: {
            'Authorization': `Basic ${getPaymongoAuth()}`,
            'Content-Type': 'application/json',
          },
        })

        const paymentId = response.data.data.id

        // Update payments tracking
        const payments = readPayments()
        const pidx = payments.findIndex(p => p.sourceId === sourceId)
        if (pidx !== -1) {
          payments[pidx].status = 'charged'
          payments[pidx].paymentId = paymentId
          writePayments(payments)
        }

        // Update order in db if linked
        const db = readDB()
        const orderIdx = db.orders.findIndex(o => o.paymongoSourceId === sourceId)
        if (orderIdx !== -1) {
          db.orders[orderIdx].paymentStatus = 'paid'
          db.orders[orderIdx].paymongoPaymentId = paymentId
          writeDB(db)
        }
      } catch (err) {
        console.error('PayMongo charge error:', err.response?.data || err.message)
      }
    }
  } else if (eventType === 'payment.paid') {
    const paymentData = attrs?.data
    const sourceId = paymentData?.attributes?.source?.id
    const paymentId = paymentData?.id

    if (sourceId) {
      const db = readDB()
      const orderIdx = db.orders.findIndex(o => o.paymongoSourceId === sourceId)
      if (orderIdx !== -1) {
        db.orders[orderIdx].paymentStatus = 'paid'
        db.orders[orderIdx].paymongoPaymentId = paymentId
        writeDB(db)
      }

      const payments = readPayments()
      const pidx = payments.findIndex(p => p.sourceId === sourceId)
      if (pidx !== -1) {
        payments[pidx].status = 'paid'
        payments[pidx].paymentId = paymentId
        writePayments(payments)
      }
    }
  } else if (eventType === 'payment.failed') {
    const sourceId = attrs?.data?.attributes?.source?.id
    if (sourceId) {
      const db = readDB()
      const orderIdx = db.orders.findIndex(o => o.paymongoSourceId === sourceId)
      if (orderIdx !== -1) {
        db.orders[orderIdx].paymentStatus = 'failed'
        writeDB(db)
      }

      const payments = readPayments()
      const pidx = payments.findIndex(p => p.sourceId === sourceId)
      if (pidx !== -1) {
        payments[pidx].status = 'failed'
        writePayments(payments)
      }
    }
  }

  res.json({ received: true })
})

// GET /api/payments/:sourceId/status - poll payment status
app.get('/api/payments/:sourceId/status', (req, res) => {
  const { sourceId } = req.params

  // Check local db first
  const db = readDB()
  const order = db.orders.find(o => o.paymongoSourceId === sourceId)
  if (order) {
    return res.json({
      paymentStatus: order.paymentStatus || 'pending',
      paymongoPaymentId: order.paymongoPaymentId || null,
    })
  }

  // Check payments tracking
  const payments = readPayments()
  const payment = payments.find(p => p.sourceId === sourceId)
  if (payment) {
    return res.json({
      paymentStatus: payment.status === 'paid' || payment.status === 'charged' ? 'paid' : payment.status,
      paymongoPaymentId: payment.paymentId || null,
    })
  }

  res.json({ paymentStatus: 'unknown' })
})

// Admin: List all auth users (for orphan cleanup)
app.get('/api/admin/auth-users', async (req, res) => {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }

  try {
    const response = await axios.get(
      `${supabaseConfig.supabaseUrl}/auth/v1/admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'apikey': supabaseConfig.serviceRoleKey,
        },
      }
    )
    const users = response.data?.users || []
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
    })))
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('List auth users error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to list auth users', detail })
  }
})

// Admin: List orphan auth users (users without profiles, bypasses RLS)
app.get('/api/admin/orphan-users', async (req, res) => {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  try {
    const [authRes, profileRes] = await Promise.all([
      axios.get(`${supabaseConfig.supabaseUrl}/auth/v1/admin/users`, {
        headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey },
      }),
      axios.get(`${supabaseConfig.supabaseUrl}/rest/v1/profiles?select=id`, {
        headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey },
      }),
    ])
    const authUsers = authRes.data?.users || []
    const profileIds = new Set((profileRes.data || []).map(p => p.id))
    const orphans = authUsers
      .filter(u => !profileIds.has(u.id))
      .map(u => ({ id: u.id, email: u.email, createdAt: u.created_at, lastSignIn: u.last_sign_in_at }))
    res.json(orphans)
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('List orphan users error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to list orphan users', detail })
  }
})

// Admin: Add a new admin user (creates auth + profile)
app.post('/api/admin/add-admin', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name required' })
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  try {
    const authRes = await axios.post(
      `${supabaseConfig.supabaseUrl}/auth/v1/admin/users`,
      { email, password, email_confirm: true, user_metadata: { name } },
      { headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey, 'Content-Type': 'application/json' } }
    )
    const userId = authRes.data?.user?.id || authRes.data?.id
    if (!userId) return res.status(500).json({ error: 'Failed to create auth user' })
    await axios.post(
      `${supabaseConfig.supabaseUrl}/rest/v1/profiles`,
      { id: userId, name, role: 'admin', is_active: true },
      { headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' } }
    )
    res.json({ id: userId, email, name, role: 'admin', isActive: true })
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Add admin error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to add admin', detail })
  }
})

// Admin: Update user email via Supabase Admin API
app.post('/api/admin/update-email', async (req, res) => {
  const { userId, email } = req.body
  if (!userId || !email) return res.status(400).json({ error: 'userId and email required' })
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  try {
    const response = await axios.put(
      `${supabaseConfig.supabaseUrl}/auth/v1/admin/users/${userId}`,
      { email },
      { headers: { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey, 'Content-Type': 'application/json' } }
    )
    res.json({ success: true, user: response.data })
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Update email error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to update email', detail })
  }
})

// Admin: Delete Supabase auth user
app.post('/api/admin/delete-user', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }

  try {
    const response = await axios.delete(
      `${supabaseConfig.supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'apikey': supabaseConfig.serviceRoleKey,
        },
      }
    )
    res.json({ success: true, deleted: response.data })
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Delete auth user error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to delete auth user', detail })
  }
})

// ===== Saved Sales Reports =====

function getPeriodRange(periodType, periodDate) {
  const d = periodDate ? new Date(periodDate) : new Date()
  let start, end, label
  const pad = n => String(n).padStart(2, '0')
  switch (periodType) {
    case 'daily':
      start = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      end = start
      label = start
      break
    case 'weekly': {
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const mon = new Date(d)
      mon.setDate(diff)
      start = `${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`
      const sun = new Date(mon)
      sun.setDate(sun.getDate() + 6)
      end = `${sun.getFullYear()}-${pad(sun.getMonth()+1)}-${pad(sun.getDate())}`
      label = `Week of ${start}`
      break
    }
    case 'monthly':
      start = `${d.getFullYear()}-${pad(d.getMonth()+1)}-01`
      end = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()}`
      label = `${d.getFullYear()}-${pad(d.getMonth()+1)}`
      break
    case 'quarterly': {
      const q = Math.floor(d.getMonth() / 3) * 3 + 1
      start = `${d.getFullYear()}-${pad(q)}-01`
      end = `${d.getFullYear()}-${pad(q+2)}-${new Date(d.getFullYear(), q+2, 0).getDate()}`
      label = `Q${Math.ceil((d.getMonth()+1)/3)} ${d.getFullYear()}`
      break
    }
    case 'yearly':
      start = `${d.getFullYear()}-01-01`
      end = `${d.getFullYear()}-12-31`
      label = `${d.getFullYear()}`
      break
  }
  return { start, end, label }
}

// Save a report snapshot
app.post('/api/admin/save-report', async (req, res) => {
  const { periodType, periodDate } = req.body
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  if (!periodType) return res.status(400).json({ error: 'periodType required (daily/monthly/quarterly/yearly)' })

  try {
    const headers = { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey }
    const saved = await computeAndSaveReport(periodType, periodDate, headers)
    res.json(saved)
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Save report error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to save report', detail })
  }
})

// Auto-compute & save report for a given period (used internally and as endpoint)
async function computeAndSaveReport(periodType, periodDate, headers) {
  const { start, end, label } = getPeriodRange(periodType, periodDate)
  const ordersRes = await axios.get(
    `${supabaseConfig.supabaseUrl}/rest/v1/orders?created_at=gte.${start}&created_at=lte.${end}T23:59:59&order=created_at.desc`,
    { headers }
  )
  const orders = ordersRes.data || []
  const completed = orders.filter(o => o.status !== 'cancelled')

  const totalRevenue = completed.reduce((s, o) => s + parseFloat(o.total || 0), 0)
  const totalOrders = completed.length
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const dineIn = completed.filter(o => o.order_type === 'dine-in').length
  const takeout = completed.filter(o => o.order_type === 'takeout' || !o.order_type).length
  const guestOrders = completed.filter(o => !o.user_id).length

  const itemCounts = {}
  completed.forEach(o => (o.items || []).forEach(i => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + (i.quantity || 0)
  }))
  const popularItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, qty]) => ({ name, qty }))

  const catRevenue = {}
  completed.forEach(o => (o.items || []).forEach(i => {
    const cat = i.category || 'Other'
    catRevenue[cat] = (catRevenue[cat] || 0) + parseFloat(i.price || 0) * (i.quantity || 0)
  }))
  const revenueByCategory = Object.entries(catRevenue).map(([cat, rev]) => ({ category: cat, revenue: rev }))

  const paymentMethods = {}
  completed.forEach(o => {
    const method = o.payment?.method || 'Cash on Delivery'
    if (!paymentMethods[method]) paymentMethods[method] = { count: 0, revenue: 0 }
    paymentMethods[method].count++
    paymentMethods[method].revenue += parseFloat(o.total || 0)
  })
  const paymentMethodsArr = Object.entries(paymentMethods).map(([method, data]) => ({ method, ...data }))

  const dayTotals = {}
  completed.forEach(o => {
    const d = new Date(o.created_at).toLocaleDateString()
    dayTotals[d] = (dayTotals[d] || 0) + 1
  })
  const dailyBreakdown = Object.entries(dayTotals).map(([day, count]) => ({ day, count }))

  // Check existing
  const existingRes = await axios.get(
    `${supabaseConfig.supabaseUrl}/rest/v1/sales_reports?period_date=eq.${start}&period_type=eq.${periodType}&select=id`,
    { headers }
  )
  const existing = existingRes.data?.[0]

  const reportData = {
    period_date: start, period_type: periodType, label,
    total_revenue: totalRevenue, total_orders: totalOrders, avg_order_value: avgOrder,
    dine_in_count: dineIn, takeout_count: takeout, guest_orders: guestOrders,
    popular_items: popularItems,
    revenue_by_category: revenueByCategory,
    payment_methods: paymentMethodsArr,
    daily_breakdown: dailyBreakdown,
    order_details: completed.map(o => ({
      id: o.display_id || o.id, total: parseFloat(o.total || 0),
      items: (o.items || []).map(i => `${i.name} x${i.quantity}`),
      orderType: o.order_type, payment: o.payment?.method || 'Cash',
      guestName: o.guest_name || null, createdAt: o.created_at,
    })),
  }

  if (existing) {
    await axios.patch(
      `${supabaseConfig.supabaseUrl}/rest/v1/sales_reports?id=eq.${existing.id}`,
      reportData,
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
    return { ...reportData, id: existing.id }
  } else {
    const saveRes = await axios.post(
      `${supabaseConfig.supabaseUrl}/rest/v1/sales_reports`,
      reportData,
      { headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' } }
    )
    return saveRes.data?.[0] || reportData
  }
}

// Auto-save today's report + last 7 days (called when admin visits dashboard)
app.post('/api/admin/auto-save-reports', async (req, res) => {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  const headers = { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey }
  const results = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    try {
      await computeAndSaveReport('daily', dateStr, headers)
      results.push({ date: dateStr, saved: true })
    } catch (err) {
      results.push({ date: dateStr, error: err.message })
    }
  }
  res.json({ saved: results.length, results })
})

// List saved reports
app.get('/api/admin/saved-reports', async (req, res) => {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  try {
    const headers = { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey }
    const r = await axios.get(
      `${supabaseConfig.supabaseUrl}/rest/v1/sales_reports?order=created_at.desc`,
      { headers }
    )
    res.json(r.data || [])
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('List saved reports error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to list saved reports', detail })
  }
})

// Delete a saved report
app.delete('/api/admin/saved-reports/:id', async (req, res) => {
  if (!supabaseConfig.supabaseUrl || !supabaseConfig.serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase admin not configured' })
  }
  try {
    const headers = { Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`, apikey: supabaseConfig.serviceRoleKey }
    await axios.delete(
      `${supabaseConfig.supabaseUrl}/rest/v1/sales_reports?id=eq.${req.params.id}`,
      { headers }
    )
    res.json({ success: true })
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Delete saved report error:', JSON.stringify(detail))
    res.status(500).json({ error: 'Failed to delete saved report', detail })
  }
})

// ===== Network Printing (ESC/POS via TCP) =====

function sendESCPOS(ip, port, text) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    const timeout = 10000
    client.setTimeout(timeout)

    client.connect(port, ip, () => {
      client.write(text, 'ascii', (err) => {
        if (err) { client.destroy(); return reject(new Error('Write failed: ' + err.message)) }
        client.destroy()
        resolve()
      })
    })

    client.on('error', (err) => {
      client.destroy()
      reject(new Error('Connection failed: ' + err.message))
    })

    client.on('timeout', () => {
      client.destroy()
      reject(new Error('Connection timed out after ' + timeout + 'ms'))
    })
  })
}

app.post('/api/print/network', async (req, res) => {
  const { ip, port, data } = req.body
  if (!ip || !data) return res.status(400).json({ error: 'Printer IP and data are required' })
  try {
    await sendESCPOS(ip, port || 9100, data)
    res.json({ success: true })
  } catch (err) {
    console.error('Network print error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Restaurant API running on http://0.0.0.0:${PORT}`);
});
