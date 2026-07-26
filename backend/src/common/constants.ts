import { join } from 'path';

export const BACKEND_DIR = join(process.cwd());
export const LOGS_DIR = join(BACKEND_DIR, 'backups', 'logs');
