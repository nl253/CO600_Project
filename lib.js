// Standard Library
const {resolve, join, dirname} = require('path');
const {mkdirSync, existsSync} = require('fs');

// 3rd Party
const winston = require('winston');

/**
 * Creates logger.
 *
 * @param cfg.label [String]
 * @param cfg.logFileName [String]
 * @param cfg.lvl [String]
 * @param cfg.fileLvl [String]
 * @return {winston.Logger}
 */
function createLogger(cfg = {}) {
  const config = Object.assign({
    label: 'GENERAL',
    lvl: 'warn',
    fileLvl: 'info',
  }, cfg);
  let logFilePath = resolve(join(__dirname, 'logs', config.logFileName || config.label.toLowerCase().replace(/\s+/, '_')));
  let logFileDir = dirname(logFilePath);
  if (!existsSync(logFileDir)) mkdirSync(logFileDir);
  let transports = [new winston.transports.Console({level: config.lvl})];
  if (process.env.LOG_TO_FILE && parseInt(process.env.LOG_TO_FILE) === 1) {
    transports.push(new winston.transports.File({
      level: config.fileLvl,
      filename: logFilePath,
    }));
  }
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.label({label: config.label}),
      winston.format.prettyPrint(),
      winston.format.printf(info =>
        `${info.level && info.level.trim() !== ''
          ? ('[' + info.level.toUpperCase() + '] ')
          : ''}${info.label
          ? (info.label + ' :: ')
          : ''}${info.message}`),
    ),
    transports,
  });
}

module.exports = {createLogger};
