import type { AxiosProgressEvent } from 'axios';

export function downloadProgress(onProgress?: (percent: number) => void) {
  return (event: AxiosProgressEvent) => {
    if (onProgress && event.total) {
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    }
  };
}
