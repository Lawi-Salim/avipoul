import api from './api';

export interface AppNotification {
  id: string;
  type: 'phase_bloquee' | 'age' | 'todo' | 'alerte';
  niveau: 'info' | 'warning' | 'critical';
  message: string;
  path: string;
}

export const notificationsService = {
  getAll: () =>
    api.get<AppNotification[]>('/notifications').then((r) => r.data),
};
