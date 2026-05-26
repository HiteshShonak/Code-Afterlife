const PREFIX = '[CODE-AFTERLIFE]';

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, data?: unknown): void {
    console.log(`${PREFIX} ${timestamp()} INFO: ${message}`, data !== undefined ? data : '');
  },

  warn(message: string, data?: unknown): void {
    console.warn(`${PREFIX} ${timestamp()} WARN: ${message}`, data !== undefined ? data : '');
  },

  error(message: string, data?: unknown): void {
    console.error(`${PREFIX} ${timestamp()} ERROR: ${message}`, data !== undefined ? data : '');
  },
};
