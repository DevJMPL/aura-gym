import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
const icon = join(__dirname, '../../resources/logo.ico')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Aura — Gym Management',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Pipe renderer console to terminal for debugging
  mainWindow.webContents.on('console-message', (_event, _level, message, _line, _sourceId) => {
    console.log(`[Renderer] ${message}`)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.aura.gym')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.on('ping', () => console.log('pong'))

  // PDF Export handler
  ipcMain.handle(
    'print-to-pdf',
    async (_, { html, filename }: { html: string; filename: string }) => {
      try {
        const pdfWindow = new BrowserWindow({
          width: 1200,
          height: 900,
          show: false,
          webPreferences: { javascript: true },
        })

        await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

        const pdfData = await pdfWindow.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        })

        pdfWindow.close()

        const { filePath, canceled } = await dialog.showSaveDialog({
          title: 'Guardar reporte PDF',
          defaultPath: `${filename}.pdf`,
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })

        if (canceled || !filePath) return { success: false, error: 'Cancelado' }

        await writeFile(filePath, pdfData)
        return { success: true }
      } catch (err) {
        console.error('[PDF Export]', err)
        return { success: false, error: String(err) }
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
