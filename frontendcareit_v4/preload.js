const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    isElectron: true,
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
});
