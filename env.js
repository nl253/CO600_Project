const {join, resolve} = require('path');
const {existsSync, mkdirSync} = require('fs');
const createLogger = require('./lib').createLogger;
const log = createLogger({label: 'ENV', lvl: 'warn'});

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const BYTE = 1;
const KILOBYTE = BYTE * 1024;
const MEGABYTE = KILOBYTE * 1024;

const APP_ENV = {
  NODE_ENV: 'development',
  DB_SYNC: '0',
  MAX_RESULTS: '100',
  PORT: '3000',
  ENCRYPTION_ALGORITHM: 'aes192',
  LOGGING_APP: 'info',
  LOGGING_API: 'info',
  LOGGING_ROUTING: 'info',
  LOGGING_MOCKS: 'warn',
  LOG_TO_FILE: '0',
  MAX_FILE_SIZE: (MEGABYTE * 50).toString(),
  LOGGING_DB: 'warn',
  NO_MOCKS: '20',
  TOKEN_LEN: '18',
  SECRET: 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07',
  SESSION_TIME: (20 * MINUTE).toString(),
  ROOT: resolve(__dirname),
  DB_PATH: join(__dirname, 'database', 'db'),
  LOG_PATH: join(__dirname, 'logs'),
  PUBLIC_PATH: join(__dirname, 'public'),
  VIEW_PATH: join(__dirname, 'views'),
  PARTIALS_PATH: join(__dirname, 'views', 'partials'),
};

function setEnv(env = APP_ENV) {
  for (const pair of Object.entries(env)) {
    const [k, v] = pair;
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function printEnv(env = process.env) {
  const padStartLen = Object.keys(env)
      .reduce((prev, curr) => curr.length >= prev ? curr.length : prev, 0);
  const padEndLen = Object.values(env)
      .reduce((prev, curr) => curr.length >= prev ? curr.length : prev, 0);
  log.info(`APPLICATION ENVIRONMENT\n${'-'.repeat(Math.min(80, padStartLen + padEndLen + 3))}`);
  for (const pair of Object.entries(env).filter((pair) => pair[0].match(/^[-_A-Z0-9]+$/))) {
    const [k, v] = pair;
    log.info(`${k.padEnd(padStartLen)} ${v.length > 60 ? `${v.slice(0, 60) } ...` : v}`);
  }
}

function initEnv() {
  if (!existsSync(process.env.LOG_PATH)) mkdirSync(process.env.LOG_PATH);
}

module.exports = () => {
  setEnv();
  initEnv();
  printEnv();
  return APP_ENV;
};
