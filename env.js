const {join, resolve} = require('path');
const {existsSync, mkdirSync} = require('fs');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const APP_ENV = {
  NODE_ENV: 'development',
  DB_SYNC: 'false',
  MAX_RESULTS: '100',
  PORT: '3000',
  ENCRYPTION_ALGORITHM: 'aes192',
  TEST_RUNS: '20',
  LOGGING_ROUTING: 'debug',
  LOGGING_DB: 'warn',
  NO_MOCKS: 10,
  LOGGING_TESTS: 'info',
  SECRET: 'U\x0bQ*kf\x1bb$Z\x13\x03\x15w\'- f\x0fn1\x0f\\\x106V\'M~\x07',
  SESSION_TIME: 20 * MINUTE,
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
  console.info(
      `APPLICATION ENVIRONMENT\n${'-'.repeat(Math.min(80, padStartLen + padEndLen + 3))}`);
  for (const pair of Object.entries(env).filter((pair) => pair[0].match(/^[-_A-Z0-9]+$/))) {
    const [k, v] = pair;
    console.info(`${k.padEnd(padStartLen)} ${v.length > 60 ? `${v.slice(0, 60) } ...` : v}`);
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
