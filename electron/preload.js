const { contextBridge, ipcRenderer } = require('electron')

// Guvenli API'leri renderer process'e expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform bilgisi
  platform: process.platform,
  
  // Pencere kontrolleri
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Bildirimler
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body })
  },
  
  // Dosya islemleri
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', { data, filename }),
  
  // Olay dinleyicileri
  onPlayPause: (callback) => {
    ipcRenderer.on('play-pause', callback)
  },
  onNextTrack: (callback) => {
    ipcRenderer.on('next-track', callback)
  },
  onPreviousTrack: (callback) => {
    ipcRenderer.on('previous-track', callback)
  }
})
