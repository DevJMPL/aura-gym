// ============================================================
// PDF Export Service
// Uses Electron IPC to trigger printToPDF via main process
// ============================================================

export const pdfService = {
  /**
   * Sends an HTML string to the Electron main process for PDF generation.
   * The main process opens a hidden BrowserWindow, loads the HTML, calls
   * printToPDF(), and shows a save dialog.
   *
   * @param htmlContent  Full HTML document string (from buildPdfHtml())
   * @param filename     Suggested filename without extension
   */
  async exportToPdf(htmlContent: string, filename: string): Promise<void> {
    // Access the Electron API exposed via preload
    const api = (window as Window & { api?: { printToPdf?: (html: string, filename: string) => Promise<{ success: boolean; error?: string }> } }).api

    if (!api?.printToPdf) {
      // Fallback: open print dialog using window.print() on a new window
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(htmlContent)
        win.document.close()
        win.print()
      }
      return
    }

    const result = await api.printToPdf(htmlContent, filename)
    if (!result.success && result.error) {
      throw new Error(result.error)
    }
  },
}
