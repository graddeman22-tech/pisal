const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  
  // Serve the luxury website
  if (url === '/' || url === '/pisal-luxury.html') {
    const filePath = path.join(__dirname, 'pisal-luxury.html');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PISAL - File Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            h1 { color: #8B0000; }
          </style>
        </head>
        <body>
          <h1>PISAL Luxury Website</h1>
          <p>File not found. Please check if pisal-luxury.html exists.</p>
        </body>
        </html>
      `);
    }
  } else {
    // Redirect to main page
    res.writeHead(302, { 'Location': '/pisal-luxury.html' });
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🛍️  PISAL Luxury E-Commerce Website');
  console.log('============================================');
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}/pisal-luxury.html`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('============================================');
  console.log('🎨 Features: Luxury Design, OTP Login, Cart, Wishlist');
  console.log('📱 Responsive: Mobile + Desktop Ready');
  console.log('🔧 Contact: 8869915907, 6391077161, support@pisal.com');
  console.log('============================================');
  console.log('📱 Open browser and navigate to the URL above');
  console.log('============================================');
  console.log('');
});
