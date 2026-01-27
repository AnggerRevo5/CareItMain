const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { extname } = require('path');

// Get API URL from config file or environment variable
let API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  try {
    const config = require('../electron.config.js');
    API_URL = config.apiUrl;
  } catch (e) {
    // Fallback to default - menggunakan IP server yang sudah di-deploy
    API_URL = 'http://31.97.109.192:8081';
    console.warn('⚠️ Failed to load electron.config.js, using default API URL:', API_URL);
  }
}

console.log('🔧 Electron API URL configured:', API_URL);

// Local HTTP server untuk serve static files
let localServer = null;
const PORT = 3001;

function startLocalServer(outPath) {
  if (localServer) {
    return `http://localhost:${PORT}`;
  }

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'application/font-woff',
    '.woff2': 'font/woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.ico': 'image/x-icon',
  };

  localServer = createServer((req, res) => {
    let filePath = path.join(outPath, req.url === '/' ? 'index.html' : req.url);
    
    // Remove query strings
    filePath = filePath.split('?')[0];
    
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });

  localServer.listen(PORT, () => {
    console.log(`Local server started on http://localhost:${PORT}`);
  });

  return `http://localhost:${PORT}`;
}

function stopLocalServer() {
  if (localServer) {
    localServer.close();
    localServer = null;
    console.log('Local server stopped');
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Security: set ke false
      contextIsolation: true, // Security: set ke true
      webSecurity: false, // Disable untuk allow local file access (Next.js static export)
      allowRunningInsecureContent: true, // Allow insecure content for local files
    },
    icon: path.join(__dirname, '..', 'public', 'LOGO_CAREIT.svg'), // Optional: set icon
  });

  // Inject API URL and Electron flag to window after page loads
  win.webContents.on('did-finish-load', () => {
    console.log('Page loaded, injecting Electron environment...');
    win.webContents.executeJavaScript(`
      window.__ELECTRON__ = true;
      window.__API_URL__ = '${API_URL}';
      console.log('Electron environment initialized. API URL:', '${API_URL}');
    `).catch(err => {
      console.error('Error injecting Electron environment:', err);
    });
  });
  
  // Log console messages from renderer
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  if (process.env.NODE_ENV === 'development') {
    // Development: jalankan Next.js dev server
    win.loadURL('http://localhost:3000');
    
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    // Production: load static files dari folder out via local HTTP server
    const fs = require('fs');
    let outPath;
    
    // Try multiple possible paths untuk folder out
    const possibleOutPaths = [
      path.join(__dirname, '..', 'out'),                                    // Development
      path.join(process.resourcesPath, 'out'),                        // Packaged (extraResource)
      path.join(process.resourcesPath, 'app.asar.unpacked', 'out'),  // Packaged (unpacked from asar)
      path.join(process.resourcesPath, 'app', 'out'),                 // Packaged (alternative)
      path.join(__dirname, '..', '..', 'out'),                              // Alternative path
    ];
    
    // Find the first existing out directory
    outPath = possibleOutPaths.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));
    
    if (!outPath) {
      // Log all attempted paths for debugging
      console.error('ERROR: out directory not found. Attempted paths:');
      possibleOutPaths.forEach(p => {
        const indexPath = path.join(p, 'index.html');
        console.error('  -', p, fs.existsSync(p) && fs.existsSync(indexPath) ? 'EXISTS' : 'NOT FOUND');
      });
      console.error('__dirname:', __dirname);
      console.error('process.resourcesPath:', process.resourcesPath);
      
      win.loadURL('data:text/html,<h1>Error: out directory not found</h1><p>Checked paths:<br>' + 
        possibleOutPaths.map(p => p + '<br>').join('') + '</p>');
      return;
    }
    
    console.log('Found out directory at:', outPath);
    
    // Start local HTTP server dan load via HTTP
    const serverUrl = startLocalServer(outPath);
    win.loadURL(serverUrl);
    console.log('Loading from local server:', serverUrl);
    
    // Open DevTools untuk debugging (hapus di production jika tidak diperlukan)
    win.webContents.openDevTools();
    
    // Log errors
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', validatedURL);
      console.error('Error code:', errorCode);
      console.error('Error description:', errorDescription);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Quit app (kecuali di macOS)
  if (process.platform !== 'darwin') {
    stopLocalServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopLocalServer();
});

