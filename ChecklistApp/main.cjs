const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we are in development mode
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 800, // Changed from 400
    height: 700, // Changed from 600
    resizable: true, // Ensure the window is resizable
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  // Load from Vite dev server in development, or from the built file in production
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // Optional: Open DevTools automatically in development
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
