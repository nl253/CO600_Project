/**
 * File description.
 *
 * @copyright 2018
 * @author nl253
 * @see {@link  details and explanation}
 * @requires
 */

const path = require('path');
const Sequelize = require('sequelize');

// Or you can simply use a connection uri
module.exports = function(URI) {
  if (!URI) {
    URI = `sqlite://${path.join(__dirname, 'db')}`;
  }
  console.log(URI);
  return new Sequelize(URI);
};
