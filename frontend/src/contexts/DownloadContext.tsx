import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import DownloadProgressModal from '../components/DownloadProgressModal';
import { downloadFile } from '../utils/downloadFile';

interface StartDownloadOptions {
  fileName: string;
  fetch: (onProgress: (percent: number) => void) => Promise<Blob>;
}

interface DownloadContextValue {
  startDownload: (options: StartDownloadOptions) => Promise<void>;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<'generation' | 'telechargement'>('generation');
  const [percent, setPercent] = useState(0);
  const [fileName, setFileName] = useState('');
  const busyRef = useRef(false);

  const startDownload = useCallback(async (options: StartDownloadOptions) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setFileName(options.fileName);
    setPhase('generation');
    setPercent(0);
    setIsOpen(true);
    try {
      const blob = await options.fetch((p) => {
        setPercent(p);
        setPhase('telechargement');
      });
      setIsOpen(false);
      await downloadFile(blob, options.fileName);
    } catch (error) {
      setIsOpen(false);
      throw error;
    } finally {
      busyRef.current = false;
    }
  }, []);

  return (
    <DownloadContext.Provider value={{ startDownload }}>
      {children}
      <DownloadProgressModal isOpen={isOpen} phase={phase} percent={percent} fileName={fileName} />
    </DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownload doit être utilisé dans DownloadProvider');
  return ctx;
}
