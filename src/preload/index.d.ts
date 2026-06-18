import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      printToPdf: (html: string, filename: string) => Promise<{ success: boolean; error?: string }>
      appVersion?: string
    }
  }
}
