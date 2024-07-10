const isDebug = process.env.REACT_APP_DEBUG === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDebug) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDebug) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDebug) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDebug) {
      console.info(...args);
    }
  },
};