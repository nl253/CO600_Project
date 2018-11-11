// Standard Library
const {resolve, join, dirname} = require('path');
const {mkdirSync, existsSync} = require('fs');

// 3rd Party
const winston = require('winston');

/**
 * Pretty print data.
 *
 * @param {*} [data]
 * @return {string}
 */
function pprint(data) {
  if (data === undefined) {
    return 'undefined';
  }

  if (data === null) {
    return 'null';
  }
  if (Array.isArray(data)) {
    return `[${data.map(pprint).join(', ')}]`;
  }

  if (data === true) {
    return 'true';
  }

  if (data === false) {
    return 'false';
  }

  if ((data instanceof Date) || (data instanceof RegExp)) {
    return data.toString();
  }

  if (data instanceof Map) {
    return `Map {${Array.from(data.entries())
      .map((pair) => `${pair[0]}: ${pprint(pair[1])}`)
      .join(', ')}}`;
  }

  if (data instanceof Set) {
    return `Set {${Array.from(data.values()).map(pprint).join(', ')}}`;
  }

  if (data instanceof Buffer) {
    return `Buffer <${data.join(' ')}>`;
  }

  if (data instanceof Object) {
    return `{${Array.from(Object.entries(data))
      .map((pair) => `${pair[0]}: ${pprint(pair[1])}`)
      .join(', ')}}`;
  }

  if (data.constructor !== undefined) {
    if (data.constructor.name === 'String') {
      return data.length >= 30 ? `"${data.slice(0, 30)} ... "` : `"${data}"`;
    } else if (data.constructor.name === 'Number') {
      return 'Number';
    } else if (data.constructor.name !== undefined) {
      return data.constructor.name;
    }
  }

  /** @namespace data.__proto__.constructor */
  if (data.__proto__ !== undefined && data.__proto__.constructor !==
    undefined && data.__proto__.constructor.name !== undefined) {
    return data.__proto__.constructor.name;
  }

  if (data.toString !== undefined) {
    return data.toString();
  }

  return '<unknown>';
}


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
    logFileName: 'general.log',
    lvl: 'warn',
    fileLvl: 'info',
  }, cfg);
  let logFilePath = resolve(join(__dirname, 'logs', config.logFileName));
  let logFileDir = dirname(logFilePath);
  if (!existsSync(logFileDir)) {
    mkdirSync(logFileDir);
  }
  return winston.createLogger({
    level: config.lvl,
    format: winston.format.combine(
      winston.format.label({label: config.label}),
      winston.format.prettyPrint(),
      winston.format.printf(
        info => `${info.level && info.level.trim() !== '' ?
          ('[' + info.level.toUpperCase() + ']').padEnd(10) :
          ''}${info.label ?
          (info.label + ' ::').padEnd(12) :
          ''}${info.message}`),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        level: config.fileLvl,
        filename: logFilePath,
      }),
    ],
  });
}

/**
 * @param {String} s
 * @param {Number} len
 * @return {string}
 */
function truncate(s, len = process.stdout.columns - 5) {
  return s !== null && s !== undefined ?
    s.length >= len ? `${s.slice(0, len - 3)} ...` : s :
    s;
}


module.exports = {createLogger, pprint, truncate};
