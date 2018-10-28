/**
 * This module exposes a connection the database.
 *
 * @author Norbert
 */
const join = require('path').join;
const Sequelize = require('sequelize');

/**
 * Get connection to the database.
 *
 * If you do not provide a URI, the development (sqlite) database will be used.
 *
 * @param {string} [uri]
 * @return {Sequelize}
 */
module.exports = (uri) => {
  const URI = uri || `sqlite://${join(__dirname, 'db')}`;
  console.info(`connected to ${URI}`);
  return new Sequelize(URI);
};
