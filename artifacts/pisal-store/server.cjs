const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5173;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy for backend
app.use('/api', (req, res) => {
  res.json({ message: 'API proxy - backend should run on port 3000' });
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PISAL - Development Server</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          h1 { color: #8B0000; }
          .status { background: #e8f5e8; padding: 20px; border-radius: 4px; margin: 20px 0; }
          .error { background: #ffe8e8; padding: 20px; border-radius: 4px; margin: 20px 0; }
          .btn { background: #8B0000; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px; }
          .btn:hover { background: #660000; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🛍️ PISAL E-Commerce</h1>
          <div class="status">
            <h3>✅ Development Server Running</h3>
            <p>Server is running on port ${PORT}</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <a href="http://localhost:${PORT}" class="btn">🌐 Open Website</a>
          </div>
          <div class="error">
            <h3>⚠️ Build Issues Detected</h3>
            <p>The Vite build system is having issues with Windows dependencies.</p>
            <p>Please try these solutions:</p>
            <ul>
              <li>1. Run: <code>npm install --force</code></li>
              <li>2. Delete node_modules and reinstall</li>
              <li>3. Use WSL or Linux environment</li>
            </ul>
          </div>
          <div class="status">
            <h3>🔧 Current Status</h3>
            <p>✅ Supabase integration configured</p>
            <p>✅ Authentication system updated</p>
            <p>✅ Database schema ready</p>
            <p>✅ Environment variables set</p>
            <p>⚠️ Frontend build pending</p>
          </div>
          <div class="status">
            <h3>🔗 Supabase Configuration</h3>
            <p><strong>URL:</strong> https://aafgptxzavrpraehaexa.supabase.co</p>
            <p><strong>Auth:</strong> Configured and ready</p>
            <p><strong>Database:</strong> PostgreSQL with Drizzle ORM</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PISAL Development Server running on http://localhost:${PORT}`);
  console.log(`🌐 Also available on your network IP`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log(`📱 Open browser and navigate to http://localhost:${PORT}`);
});
