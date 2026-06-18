const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  onProgress: (callback) => ipcRenderer.on('splash-progress', callback),
})
