/**
 * This module exposes database-related utils.
 *
 * @author Norbert
 */

// Standard Library
const {existsSync} = require('fs');
const {join, resolve} = require('path');

// Project
const {createLogger} = require('../../lib');

/**
 * Logger for the database. Logs all queries.
 *
 * @type {winston.Logger}
 */
// const log = createLogger({label: 'DATABASE', lvl: process.env.LOGGING_DB});
const log = createLogger({label: 'DATABASE', lvl: process.env.LOGGING_DB || 'warn'});

if (process.env.NODE_ENV !== 'development') {
  log.error(`database not configured for ${process.env.NODE_ENV}, see ${resolve( join(__dirname, __filename))}`);
  process.exit(1);
}

// 3rd Party
const Sequelize = require('sequelize');

const {STRING, TEXT, INTEGER, TINYINT, BOOLEAN, REAL} = Sequelize;

const sequelize = new Sequelize({

  operatorsAliases: false,
  dialect: 'sqlite',
  storage: process.env.DB_PATH,

  // Specify options, which are used when sequelize.define is called.
  //
  // The following example:
  //
  //   define: { timestamps: false }
  //
  // is basically the same as:
  //
  //   sequelize.define(name, attributes, { timestamps: false })
  //
  // so defining the timestamps for each model will be not necessary
  define: {
    // use camelcase for automatically added attributes
    underscored: false,
    // By default, sequelize will automatically transform all passed model names (first parameter of define) into plural
    freezeTableName: true,
    // add updatedAt, createdAt
    timestamps: true,
  },

  logging: eval(`log.${process.env.LOGGING_DB}`),

  // similar for sync: you can define this to always force sync for models
  sync: {
    force: process.env.DB_SYNC === '1' || false,
  },

  // pool configuration used to pool database connections
  pool: {
    max: 5,
    idle: 30000,
    acquire: 60000,
  },
});

const User = sequelize.define('User', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: [/.+@.+/],
        mgs: 'not a valid email',
      },
    },
  },
  password: {
    type: STRING,
    validate: {
      is: {
        args: [/.{2,}/],
        msg: 'password is too short',
      },
    },
    allowNull: false,
  },
  firstName: {
    type: STRING,
    validate: {
      is: {
        args: [/.+/],
        msg: 'first name is too short',
      },
    },
  },
  lastName: {
    type: STRING,
    validate: {
      is: {
        args: [/.+/],
        msg: 'last name is too short',
      },
    },
  },
  isAdmin: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  info: TEXT,
});

const Session = sequelize.define('Session', {
  token: {
    allowNull: false,
    primaryKey: true,
    type: STRING,
    validate: {
      is: {
        args: [/.{6}/],
        mgs: 'access token not long enough',
      },
    },
  },
  email: {
    type: STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'email'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
});

const Module = sequelize.define('Module', {
  name: {
    type: STRING,
    allowNull: false,
    primaryKey: true
  },
  topic: STRING,
  author: {
    type: STRING,
    references: {
      model: User,
      key: 'email'
    },
    onUpdate: 'CASCADE',
  },
  summary: TEXT,
});

const Lesson = sequelize.define('Lesson', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  module: {
    type: STRING,
    references: {
      model: Module,
      key: 'name'
    },
    onUpdate: 'CASCADE',
    allowNull: false,
  },
  summary: TEXT,
  content: TEXT,
});

const [minRating, maxRating] = [0, 5];
const badRatingMsg = `rating must be between ${minRating} and ${maxRating}`;
const Rating = sequelize.define('Rating', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  rater: {
    type: STRING,
    references: {
      model: User,
      key: 'email'
    },
    onUpdate: 'CASCADE',
  },
  module: {
    type: STRING,
    references: {
      model: Module,
      key: 'name'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
  comment: TEXT,
  stars: {
    type: TINYINT,
    validate: {
      min: {
        args: [minRating],
        msg: badRatingMsg,
      },
      max: {
        args: [maxRating],
        msg: badRatingMsg,
      },
    },
    allowNull: false,
  },
});

const Enrollment = sequelize.define('Enrollment', {
  module: {
    type: STRING,
    references: {
      model: Module,
      key: 'name'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  student: {
    type: STRING,
    references: {
      model: User,
      key: 'email'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
});

const Question = sequelize.define('Question', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  module: {
    type: STRING,
    references: {
      model: Module,
      key: 'name'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  correctAnswer: {
    type: TEXT,
    allowNull: false,
  },
});

// Sync all models that aren't already in the database
// NOTE this seems to delete * from all tables!
// ONLY RUN ONCE AT THE BEGINNING
if (process.env.DB_SYNC === '1' || (process.env.DB_PATH !== undefined && !existsSync(process.env.DB_PATH))) {
  log.warn(`syncing database to ${process.env.DB_PATH}`);
  sequelize.sync().then(() => {
    if (process.env.NODE_ENV !== 'production') {
      // write info about mock data to a separate file
      const log = createLogger({label: 'MOCKS', logFileName: 'mocks'});
      const faker = require('faker');
      const {sha256} = require('../lib');
      const email = faker.internet.email();
      const password = faker.internet.password();
      const module = faker.random.words(2);
      User.create({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        info: faker.random.words(10),
        email,
        password: sha256(password),
      }).then(() => Module.create({
        name: module,
        topic: faker.random.word(),
        author: email,
        summary: faker.random.words(20),
      })).then(
        () => Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9].map(_ => Rating.create({
            rater: email,
            module,
            comment: faker.random.words(6),
            stars: faker.random.number(5),
          }),
        )))
        .then(
          () => Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9].map(_ => Lesson.create({
            module,
            summary: faker.random.words(10),
            content: faker.random.words(500),
          }))))
        .then(() => User.findAll()).then(users => {
        for (const u of users) {
          u.dataValues.password = password;
          log.info(`User ${u.dataValues.email} ${u.dataValues.password}`);
        }
      }).then(() => Module.findAll()).then((modules) => {
        for (const m of modules) {
          log.info(`Module ${m.dataValues.name} by ${m.dataValues.author}`);
        }
      });
    }
  });
}

module.exports = {
  Enrollment,
  Lesson,
  Module,
  Question,
  Rating,
  sequelize,
  Session,
  Sequelize,
  User,
};
