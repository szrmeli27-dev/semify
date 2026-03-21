const { app, BrowserWindow, Menu, Tray, nativeImage, shell } = require('electron')
const path = require('path')
const { exec } = require('child_process')

let mainWindow
let tray = null
let isQuitting = false

// Gelistirme modunda mi calistigimizi kontrol et
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0a',
    show: false,
  })

  // Yuklendikten sonra pencereyi goster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // URL'yi yukle
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    // Gelistirme modunda DevTools'u ac
    // mainWindow.webContents.openDevTools()
  } else {
    // Uretim modunda statik export kullan
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }

  // Dis baglantilari varsayilan tarayicida ac
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Pencere kapatildiginda
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  // Tray ikonu olustur
  const iconPath = path.join(__dirname, '../public/icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Semify Ac',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        }
      }
    },
    {
      label: 'Oynat/Duraklat',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.executeJavaScript(`
            const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
            document.dispatchEvent(event);
          `)
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Cikis',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Semify')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    }
  })
}

// Uygulama menusu
function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        { role: 'quit', label: 'Cikis' }
      ]
    },
    {
      label: 'Duzenle',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapistir' },
        { role: 'selectAll', label: 'Tumunu Sec' }
      ]
    },
    {
      label: 'Gorunum',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'forceReload', label: 'Zorla Yenile' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Gercek Boyut' },
        { role: 'zoomIn', label: 'Yakınlastir' },
        { role: 'zoomOut', label: 'Uzaklastir' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' }
      ]
    },
    {
      label: 'Pencere',
      submenu: [
        { role: 'minimize', label: 'Simge Durumuna Kucult' },
        { role: 'close', label: 'Kapat' }
      ]
    },
    {
      label: 'Yardim',
      submenu: [
        {
          label: 'Hakkinda',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Semify Hakkinda',
              message: 'Semify',
              detail: 'Surum: 1.0.0\n\nSoundCloud entegrasyonlu muzik dinleme uygulamasi.\nBagimsiz sanatcilarin muziklerini kesfet.\n\n2024 Semify'
            })
          }
        }
      ]
    }
  ]

  // macOS icin ozel menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about', label: 'Hakkinda' },
        { type: 'separator' },
        { role: 'services', label: 'Servisler' },
        { type: 'separator' },
        { role: 'hide', label: 'Gizle' },
        { role: 'hideOthers', label: 'Digerlerni Gizle' },
        { role: 'unhide', label: 'Hepsini Goster' },
        { type: 'separator' },
        { role: 'quit', label: 'Cikis' }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Uygulama hazir oldugunda
app.whenReady().then(() => {
  createWindow()
  createTray()
  createMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

// Tum pencereler kapatildiginda (macOS haric)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Uygulama kapatilmadan once
app.on('before-quit', () => {
  isQuitting = true
})

// Ikinci instance'i engelle
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
