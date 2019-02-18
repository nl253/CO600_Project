/**
 * This module exposes database-related utils.
 *
 * @author Norbert
 */

// Standard Library
const {existsSync} = require('fs');

// Project
const {createLogger} = require('../lib');

/**
 * Logger for the database. Logs all queries.
 *
 * @type {winston.Logger}
 */
// const log = createLogger({label: 'DATABASE', lvl: process.env.js.LOGGING_DB});
const log = createLogger({label: 'DATABASE', lvl: process.env.LOGGING_DB});

// 3rd Party
const Sequelize = require('sequelize');

const {STRING, TEXT, INTEGER, TINYINT, BOOLEAN, BLOB} = Sequelize;

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
    // add updatedAt, createdOn
    timestamps: true,
  },

  logging: log.info,

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
        args: [/\S{4,}/],
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
      key: 'email',
    },
  },
});

const Module = sequelize.define('Module', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  authorId: {
    allowNull: false,
    type: INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
  },
  name: STRING,
  topic: STRING,
  summary: TEXT,
});

const Lesson = sequelize.define('Lesson', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  moduleId: {
    type: INTEGER,
    references: {
      model: Module,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
  order: {
    allowNull: false,
    type: INTEGER,
  },
  name: STRING,
  summary: TEXT,
  content: BLOB,
});

const File = sequelize.define('File', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  lessonId: {
    type: INTEGER,
    references: {
      model: Lesson,
      key: 'id',
    },
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  name: {
    type: STRING,
    allowNull: false,
    validate: {
      is: {
        args: [/\.((pn|jp)g|gif|mp[34g])$/i],
        mgs: 'not a valid file name',
      },
    },
  },
  data: {
    allowNull: false,
    type: BLOB,
  },
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
  raterId: {
    allowNull: false,
    type: INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
  },
  moduleId: {
    type: INTEGER,
    references: {
      model: Module,
      key: 'id',
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
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  moduleId: {
    type: INTEGER,
    references: {
      model: Module,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
  studentId: {
    type: INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
});

const Question = sequelize.define('Question', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: STRING,
  order: {
    allowNull: false,
    type: INTEGER,
  },
  moduleId: {
    type: INTEGER,
    references: {
      model: Module,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
  correctAnswer: STRING,
  badAnswer1: STRING,
  badAnswer2: STRING,
  badAnswer3: STRING,
  badAnswer4: STRING,
  badAnswer5: STRING,
});

// Sync all models that aren't already in the database
// NOTE this seems to delete * from all tables!
// ONLY RUN ONCE AT THE BEGINNING
if (process.env.DB_SYNC === '1' ||
  (process.env.DB_PATH !== undefined && !existsSync(process.env.DB_PATH))) {
  log.warn(`syncing database to ${process.env.DB_PATH}`);
  sequelize.sync().then(async () => {
    const log = createLogger(
      {label: 'MOCKS', logFileName: 'mocks', lvl: process.env.LOGGING_MOCKS});
    if (process.env.NODE_ENV !== 'development') {
      return log.error(
        `NODE_ENV not in development so DB_SYNC (mock data generation) failed`);
    } else {
      log.warn(`generating mock data ...`);
    }
    // write info about mock data to a separate file
    const faker = require('faker');
    const {sha256} = require('../routes/lib');
    const topics = [
      'AI',
      'Anthropology',
      'Archeology',
      'Architecture',
      'Arts',
      'Biology',
      'Chemistry',
      'Computer Science',
      'Design',
      'Drama',
      'Economics',
      'Engineering',
      'Geography',
      'History',
      'Humanities',
      'Languages',
      'Law',
      'Linguistics',
      'Literature',
      'Mathematics',
      'Medicine',
      'Philosophy',
      'Physics',
      'Political Science',
      'Psychology',
      'Sciences',
      'Social Sciences',
      'Sociology',
      'Theology'];

    /**
     * @param {sequelize.Model} obj
     * @returns {Logger}
     */
    function logCreated(obj) {
      log.info(
        `${obj._modelOptions.name.singular} { ${Object
          .entries(obj.dataValues)
          .filter(pair => pair[1])
          .map(pair => pair[0] + ' = ' + pair[1].toString().slice(0, 30))
          .join(', ')} }`);
    }

    /**
     * @param {!Number} min
     * @param {!Number} max
     * @returns {!Number}
     */
    function randNum(min = 0, max) {
      if (!max) {
        min = 0;
        max = min;
      }
      return min + faker.random.number(max - min - 1);
    }

    // generate users
    await Promise.all([...Array(parseInt(process.env.NO_MOCKS)).keys()]
      .map(async () => {
        const password = faker.internet.password();
        const u = await User.create({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          info: faker.random.words(randNum(10, 100)),
          email: faker.internet.email(),
          password: sha256(password),
        });
        delete u.dataValues.password;
        u.dataValues.password = password;
        logCreated(u);

        // generate modules
        await Promise.all([...Array(randNum(1, 5)).keys()]
          .map(async () => {
            const m = await Module.create({
              name: faker.random.words(3),
              topic: topics[randNum(0, topics.length)],
              authorId: 1 + randNum(0, u.id),
              summary: faker.random.words(randNum(20, 100)),
            });
            logCreated(m);
            // generate ratings
            if (faker.random.boolean()) {
              logCreated(
                await Rating.create({
                  raterId: 1 + randNum(0, u.id),
                  moduleId: 1 + randNum(0, m.id),
                  comment: faker.random.words(faker.random.words(5, 20)),
                  stars: randNum(1, 6),
                }));
            }
            await Promise.all(
              [...Array(randNum(3, 15)).keys()].map(async ord => {
                logCreated(await Lesson.create({
                  moduleId: 1 + randNum(0, m.id),
                  summary: faker.random.words(randNum(10, 100)),
                  order: ord,
                  name: faker.random.words(randNum(2, 6)),
                  content: Buffer.from(
                    faker.random.words(randNum(500, 5000))),
                }));
                await Promise.all([...Array(randNum(5, 12)).keys()]
                  .map(async ord => logCreated(await Question.create({
                    correctAnswer: faker.random.words(randNum(1, 6)),
                    name: faker.random.words(randNum(5, 15)) + '?',
                    badAnswer1: faker.random.words(randNum(1, 6)),
                    badAnswer2: faker.random.words(randNum(1, 6)),
                    badAnswer3: faker.random.words(randNum(1, 6)),
                    badAnswer4: faker.random.words(randNum(1, 6)),
                    badAnswer5: faker.random.words(randNum(1, 6)),
                    moduleId: 1 + randNum(0, m.id),
                    order: ord,
                  }))));
              }));
          }));
      }));
    log.warn('finished generating mock data');
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
  File,
  User,
};
