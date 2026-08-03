const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

export async function downloadFile(data: Blob, fileName: string): Promise<void> {
  if (isTauri) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const ext = extensionOf(fileName);
      const path = await save({
        defaultPath: fileName,
        filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : undefined,
      });
      if (!path) return;
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const bytes = new Uint8Array(await data.arrayBuffer());
      await writeFile(path, bytes);
      return;
    } catch {
      // repli : téléchargement navigateur
    }
  }

  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
