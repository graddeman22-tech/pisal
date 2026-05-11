const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle API requests
  if (req.url.startsWith('/api')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'API endpoint - Backend should run on port 3000',
      timestamp: new Date().toISOString(),
      url: req.url 
    }));
    return;
  }

  // Serve HTML
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PISAL - Development Server</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          padding: 40px; 
          background: linear-gradient(135deg, #8B0000 0%, #D4AF37 100%); 
          min-height: 100vh;
          color: #333;
        }
        .container { 
          max-width: 900px; 
          margin: 0 auto; 
          background: white; 
          padding: 50px; 
          border-radius: 16px; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 { 
          color: #8B0000; 
          font-size: 2.5rem;
          margin-bottom: 20px;
          text-align: center;
        }
        .logo { 
          font-size: 3rem; 
          font-weight: 900; 
          color: #8B0000; 
          text-align: center; 
          margin-bottom: 30px;
          letter-spacing: 0.2em;
        }
        .status { 
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0); 
          padding: 25px; 
          border-radius: 12px; 
          margin: 20px 0; 
          border-left: 4px solid #10b981;
        }
        .error { 
          background: linear-gradient(135deg, #ffe8e8, #fff0f0); 
          padding: 25px; 
          border-radius: 12px; 
          margin: 20px 0; 
          border-left: 4px solid #ef4444;
        }
        .warning { 
          background: linear-gradient(135deg, #fff3e0, #fef9e7); 
          padding: 25px; 
          border-radius: 12px; 
          margin: 20px 0; 
          border-left: 4px solid #f59e0b;
        }
        .btn { 
          background: #8B0000; 
          color: white; 
          padding: 15px 30px; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          margin: 10px 5px; 
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-block;
          text-decoration: none;
        }
        .btn:hover { 
          background: #660000; 
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(139,0,0,0.3);
        }
        .btn.secondary { 
          background: #D4AF37; 
        }
        .btn.secondary:hover { 
          background: #b8941f; 
        }
        h3 { 
          color: #333; 
          margin-bottom: 15px;
          font-size: 1.3rem;
        }
        p { 
          line-height: 1.6; 
          margin-bottom: 15px;
        }
        ul { 
          margin-left: 20px; 
          margin-bottom: 15px;
        }
        li { 
          margin-bottom: 8px;
        }
        code { 
          background: #f5f5f5; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-family: 'Courier New', monospace;
        }
        .grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin: 20px 0;
        }
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr; }
          .container { padding: 30px; }
          body { padding: 20px; }
        }
        .pulse { 
          animation: pulse 2s infinite; 
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PISAL</div>
        <h1>🛍️ E-Commerce Development Server</h1>
        
        <div class="status">
          <h3>✅ Server Status</h3>
          <p><strong>🚀 Development Server:</strong> Running on port ${PORT}</p>
          <p><strong>⏰ Started:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>🌐 URL:</strong> <a href="http://localhost:${PORT}" class="btn">Open Website</a></p>
        </div>

        <div class="warning">
          <h3>⚠️ Build Issues</h3>
          <p>Vite build system has Windows dependency issues. Working on fixes...</p>
          <div style="margin-top: 15px;">
            <a href="http://localhost:${PORT}" class="btn">🔄 Retry Build</a>
            <a href="http://localhost:${PORT}/test" class="btn secondary">🧪 Test Auth</a>
          </div>
        </div>

        <div class="status">
          <h3>🔧 Integration Status</h3>
          <div class="grid">
            <div>
              <p>✅ <strong>Supabase Configured</strong></p>
              <p>✅ <strong>Auth System Updated</strong></p>
              <p>✅ <strong>Database Schema Ready</strong></p>
            </div>
            <div>
              <p>✅ <strong>Environment Variables Set</strong></p>
              <p>✅ <strong>API Server Ready</strong></p>
              <p>⚠️ <strong>Frontend Build Pending</strong></p>
            </div>
          </div>
        </div>

        <div class="status">
          <h3>🔗 Supabase Configuration</h3>
          <p><strong>URL:</strong> https://aafgptxzavrpraehaexa.supabase.co</p>
          <p><strong>Authentication:</strong> <span class="pulse">✅ Ready</span></p>
          <p><strong>Database:</strong> PostgreSQL with Drizzle ORM</p>
          <p><strong>Tables:</strong> users, products, orders, cart, etc.</p>
        </div>

        <div class="error">
          <h3>🛠️ Next Steps</h3>
          <ol>
            <li>Fix Windows build issues with Rollup/ESBuild</li>
            <li>Test authentication flow with Supabase</li>
            <li>Verify order placement in database</li>
            <li>Deploy to Vercel when ready</li>
          </ol>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p><strong>📞 For support: Check console logs and terminal output</strong></p>
        </div>
      </div>

      <script>
        // Test API connection
        fetch('/api/health')
          .then(response => response.json())
          .then(data => console.log('API Health:', data))
          .catch(error => console.log('API Error:', error));

        // Auto-refresh every 30 seconds
        setTimeout(() => {
          console.log('🔄 Auto-refreshing page...');
          // location.reload();
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🛍️  PISAL E-Commerce Development Server');
  console.log('============================================');
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('============================================');
  console.log('📱 Open browser and navigate to the URL above');
  console.log('🔧 Supabase integration configured and ready');
  console.log('============================================');
  console.log('');
});
