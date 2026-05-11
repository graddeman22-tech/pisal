const http = require('http');
const url = require('url');

const PORT = 3000;

// Mock database for testing
let users = [];
let orders = [];
let products = [
  { id: 1, name: 'Test Product 1', price: 100, inStock: true },
  { id: 2, name: 'Test Product 2', price: 200, inStock: true },
  { id: 3, name: 'Test Product 3', price: 300, inStock: true }
];

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  try {
    // Health check
    if (path === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'PISAL API Server',
        environment: 'development'
      }));
      return;
    }

    // Products endpoint
    if (path === '/api/products' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(products));
      return;
    }

    // Orders endpoints
    if (path.startsWith('/api/orders')) {
      if (method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
      }
      
      if (method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const orderData = JSON.parse(body);
            const newOrder = {
              id: orders.length + 1,
              ...orderData,
              status: 'confirmed',
              createdAt: new Date().toISOString(),
              paymentStatus: 'pending'
            };
            orders.push(newOrder);
            
            console.log('📦 New Order:', newOrder);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newOrder));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid order data' }));
          }
        });
        return;
      }
    }

    // Auth endpoints (mock)
    if (path.startsWith('/api/auth')) {
      if (path === '/api/auth/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const loginData = JSON.parse(body);
            const user = {
              id: 1,
              email: loginData.email || 'test@example.com',
              name: 'Test User',
              token: 'mock-jwt-token-' + Date.now()
            };
            
            console.log('🔐 User Login:', user);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid login data' }));
          }
        });
        return;
      }
    }

    // Users endpoint
    if (path === '/api/users/me' && method === 'GET') {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        loyaltyPoints: 100
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
      return;
    }

    // Cart endpoint
    if (path === '/api/cart' && method === 'GET') {
      const cart = [
        { id: 1, productId: 1, quantity: 2, price: 100 },
        { id: 2, productId: 2, quantity: 1, price: 200 }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cart));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Not Found',
      message: `Route ${method} ${path} not found`,
      availableRoutes: [
        'GET /api/health',
        'GET /api/products',
        'GET /api/orders',
        'POST /api/orders',
        'POST /api/auth/login',
        'GET /api/users/me',
        'GET /api/cart'
      ]
    }));

  } catch (error) {
    console.error('Server Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🔧 PISAL API Development Server');
  console.log('============================================');
  console.log(`🌐 API Server: http://localhost:${PORT}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('============================================');
  console.log('📊 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/products');
  console.log('   GET  /api/orders');
  console.log('   POST /api/orders');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/users/me');
  console.log('   GET  /api/cart');
  console.log('============================================');
  console.log('🔗 Frontend should be on http://localhost:5173');
  console.log('============================================');
  console.log('');
});
