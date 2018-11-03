-- vim:sw=2:ts=4:expandtab:nu:

CREATE TEMP TABLE IF NOT EXISTS User (
  email     VARCHAR(255) NOT NULL PRIMARY KEY CHECK(email LIKE "%__@__%.__%"),
  -- other --
  firstName VARCHAR(255) NOT NULL CHECK(length(firstName) > 1),
  lastName  VARCHAR(255) NOT NULL CHECK(length(lastName) > 1),
  password  VARCHAR(255) NOT NULL CHECK(length(password) > 2),
  info      TEXT,
  isAdmin   BOOL NOT NULL DEFAULT FALSE
);

CREATE TEMP TABLE IF NOT EXISTS Module (
  name      VARCHAR(255) NOT NULL PRIMARY KEY,
  -- FK --
  author  REFERENCES User(email) ON UPDATE CASCADE,
  -- other --
  tested  BOOL NOT NULL DEFAULT FALSE,
  summary TEXT
);

CREATE TEMP TABLE IF NOT EXISTS Lesson (
  id      INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  -- FK --
  module  NOT NULL REFERENCES Module(name) ON UPDATE CASCADE,
  -- other --
  quized  BOOL NOT NULL DEFAULT FALSE,
  content TEXT NOT NULL
);

CREATE TEMP TABLE IF NOT EXISTS Rating (
  -- FK --
  rater  NOT NULL REFERENCES User(email) ON UPDATE CASCADE,
  lesson NOT NULL REFERENCES Lesson(id) ON UPDATE CASCADE ON DELETE CASCADE,
  -- other --
  stars  INT NOT NULL CHECK(stars >= 0 AND stars <= 5),
  PRIMARY KEY (lesson, rater)
);

CREATE TEMP TABLE IF NOT EXISTS Invitation (
  -- FK --
  module  NOT NULL REFERENCES Module(name) ON DELETE CASCADE ON UPDATE CASCADE,
  student NOT NULL REFERENCES User(email) ON DELETE CASCADE ON UPDATE CASCADE,
  creator NOT NULL REFERENCES User(email) ON UPDATE CASCADE,
  PRIMARY KEY (module, student, creator)
);

CREATE TEMP TABLE IF NOT EXISTS Enrollment (
  -- FK --
  module  NOT NULL REFERENCES Module(name) ON UPDATE CASCADE ON DELETE CASCADE,
  student NOT NULL REFERENCES User(email) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (module, student)
);

CREATE TEMP TABLE IF NOT EXISTS Comment (
  id        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  -- FK --
  module NOT NULL REFERENCES Module(name) ON UPDATE CASCADE ON DELETE CASCADE,
  lesson REFERENCES Lesson(id) ON DELETE CASCADE ON UPDATE CASCADE,
  author REFERENCES User(email) ON UPDATE CASCADE,
  parent REFERENCES Comment(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TEMP TABLE IF NOT EXISTS OpenQuestion (
  id       INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  -- FK --
  module   NOT NULL REFERENCES Module(name) ON UPDATE CASCADE ON DELETE CASCADE,
  -- other --
  question TEXT NOT NULL
);

CREATE TEMP TABLE IF NOT EXISTS Answer (
  -- FK --
  student    NOT NULL REFERENCES User(email) ON DELETE CASCADE ON UPDATE CASCADE,
  questionId NOT NULL REFERENCES OpenQuestion(id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  answer     TEXT NOT NULL,
  comment    TEXT,
  mark       REAL CHECK(mark >= 0.0 AND mark <= 100.0),
  PRIMARY KEY (student, questionId)
);

CREATE TEMP TABLE IF NOT EXISTS Report (
  id     INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  -- FK --
  lesson NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE ON UPDATE CASCADE,
  module NOT NULL REFERENCES Module(name) ON DELETE CASCADE ON UPDATE CASCADE,
  author REFERENCES User(email) ON UPDATE CASCADE,
  -- other --
  issue  VARCHAR(255)
);

CREATE TEMP TABLE IF NOT EXISTS Definition (
  -- FK --
  lessonId NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  term     VARCHAR(255) NOT NULL,
  meaning  TEXT NOT NULL,
  PRIMARY KEY (lessonId, term)
);

CREATE TEMP TABLE IF NOT EXISTS QuizQuestion (
  -- FK --
  lessonId      NOT NULL REFERENCES Lesson(id) ON UPDATE CASCADE ON DELETE CASCADE,
  -- other --
  question      TEXT NOT NULL,
  correctAnswer TEXT NOT NULL,
  PRIMARY KEY (lessonId, question)
);
