/**
 * This module exposes database-related utils.
 *
 * @author Norbert
 */

const {join, resolve} = require('path');

const Sequelize = require('sequelize');
const winston = require('winston');

/**
 * This is a logger for the database that logs all queries.
 *
 * @type {winston.Logger}
 */
const log = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.label({label: 'DATABASE'}),
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
      level: 'warn',
      filename: resolve(join(__dirname, '..', 'logs', 'db.log')),
    }),
  ],
});

const {STRING, TEXT, INTEGER, TINYINT, BOOLEAN, REAL} = Sequelize;

let datbasePath = resolve(join(__dirname, 'db'));

const sequelize = new Sequelize({

  dialect: 'sqlite',

  storage: datbasePath,

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

  logging: log.debug,

  // similar for sync: you can define this to always force sync for models
  sync: {force: true},

  // pool configuration used to pool database connections
  pool: {
    max: 5,
    idle: 30000,
    acquire: 60000,
  },
});

const User = sequelize.define('User', {
  email: {
    type: STRING,
    allowNull: false,
    primaryKey: true,
    validate: {is: {args: /.+@.+/, mgs: 'not a valid email'}},
  },
  password: {
    type: STRING,
    validate: {is: {args: /.{2,}/, msg: 'password is too short'}},
    allowNull: false,
  },
  firstName: {
    type: STRING,
    validate: {is: {args: /.+/, msg: 'first name is too short'}},
  },
  lastName: {
    type: STRING,
    validate: {is: {args: /.+/, msg: 'last name is too short'}},
  },
  isAdmin: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  info: TEXT,
});

const Module = sequelize.define('Module', {
  name: {type: STRING, allowNull: false, primaryKey: true},
  topic: STRING,
  author: {
    type: STRING,
    references: {model: User, key: 'email'},
    onUpdate: 'CASCADE',
  },
  isTested: {
    type: BOOLEAN,
    defaultValue: false,
    allowNull: false,
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
    references: {model: Module, key: 'name'},
    onUpdate: 'CASCADE',
    allowNull: false,
  },
  isQuized: {
    type: BOOLEAN,
    defaultValue: false,
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
    references: {model: User, key: 'email'},
    onUpdate: 'CASCADE',
  },
  lessonId: {
    type: INTEGER,
    references: {model: Lesson, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
  },
  stars: {
    type: TINYINT,
    validate: {
      min: {args: minRating, msg: badRatingMsg},
      max: {args: maxRating, msg: badRatingMsg},
    },
    allowNull: false,
  },
});

const Invitation = sequelize.define('Invitation', {
  module: {
    type: STRING,
    references: {model: Module, key: 'name'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  student: {
    type: STRING,
    references: {model: User, key: 'email'},
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    unique: 'compositeIndex',
  },
  creator: {
    type: STRING,
    references: {model: User, key: 'email'},
    allowNull: false,
    onUpdate: 'CASCADE',
    unique: 'compositeIndex',
  },
});

const Enrollment = sequelize.define('Enrollment', {
  module: {
    type: STRING,
    references: {model: Module, key: 'name'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  student: {
    type: STRING,
    references: {model: User, key: 'email'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
});

const Comment = sequelize.define('Comment', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  module: {
    type: STRING,
    references: {model: Module, key: 'name'},
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  lessonId: {
    type: INTEGER,
    references: {model: Lesson, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  author: {
    type: STRING, references: {model: User, key: 'email'},
    onUpdate: 'CASCADE',
  },
  parent: {
    type: INTEGER,
    references: {model: 'Comment', key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
});

const OpenQuestion = sequelize.define('OpenQuestion', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  module: {
    type: STRING,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    references: {model: Module, key: 'name'},
  },
  question: {
    type: TEXT,
    allowNull: false,
  },
});

const [minMark, maxMark] = [0.0, 100.0];
const badMarkMsg = `the mark must be between ${minMark} and ${maxMark}`;
const Answer = sequelize.define('Answer', {
  student: {
    type: STRING,
    references: {model: User, key: 'email'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  questionId: {
    type: INTEGER,
    references: {model: OpenQuestion, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  answer: {
    type: TEXT,
    allowNull: false,
  },
  comment: TEXT,
  mark: {
    type: REAL,
    validate: {
      min: {args: minMark, msg: badMarkMsg},
      max: {args: maxMark, msg: badMarkMsg},
    },
  },
});

const Report = sequelize.define('Report', {
  id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  lessonId: {
    type: INTEGER,
    allowNull: false,
    references: {model: Lesson, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  module: {
    type: STRING,
    allowNull: false,
    references: {model: Module, key: 'name'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  author: {type: STRING, references: {model: User, key: 'email'}},
  issue: {type: TEXT, allowNull: false},
});

const Definition = sequelize.define('Definition', {
  lessonId: {
    type: INTEGER,
    references: {model: Lesson, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  term: {
    type: STRING,
    allowNull: false,
    unique: 'compositeIndex',
  },
  meaning: {
    type: TEXT,
    allowNull: false,
  },
});

const QuizQuestion = sequelize.define('QuizQuestion', {
  lessonId: {
    type: INTEGER,
    references: {model: Lesson, key: 'id'},
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    allowNull: false,
    unique: 'compositeIndex',
  },
  question: {
    type: TEXT,
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
// sequelize.sync();

module.exports = {
  Answer,
  Comment,
  Definition,
  Enrollment,
  Invitation,
  Lesson,
  Module,
  OpenQuestion,
  QuizQuestion,
  Rating,
  Report,
  User,
};

