import api from './api';
import { downloadProgress } from './downloadProgress';

export const exportService = {
  exportCycles: (period?: number, onProgress?: (percent: number) => void) => {
    const params: Record<string, string> = {};
    if (period && period > 0) params.period = String(period);
    return api.get('/export/cycles', {
      params,
      responseType: 'blob',
      onDownloadProgress: downloadProgress(onProgress),
    });
  },

  exportClients: (onProgress?: (percent: number) => void) =>
    api.get('/export/clients', {
      responseType: 'blob',
      onDownloadProgress: downloadProgress(onProgress),
    }),

  exportVentes: (cycleId?: string, statut?: string, onProgress?: (percent: number) => void) => {
    const params: Record<string, string> = {};
    if (cycleId) params.cycleId = cycleId;
    if (statut) params.statut = statut;
    return api.get('/export/ventes', {
      params,
      responseType: 'blob',
      onDownloadProgress: downloadProgress(onProgress),
    });
  },

  exportDonneesBrutes: (onProgress?: (percent: number) => void) =>
    api.get('/export/donnees-brutes', {
      responseType: 'blob',
      onDownloadProgress: downloadProgress(onProgress),
    }),
};
