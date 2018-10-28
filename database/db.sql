-- Dialect: SQLite3

-- NOTE this *should* be runnable in Postgres but hasn't been tested as of 27/10/19

-- A user is anyone in the system that can log in 
-- (Administrator, and a regular user i.e. Student, Independent Learner and Content Creator)
CREATE TABLE IF NOT EXISTS User (
  email      VARCHAR(255) PRIMARY KEY NOT NULL CHECK (length(email) > 3 AND email LIKE "%_@_%._%"),
  -- other --
  first_name VARCHAR(255) CHECK (length(first_name) > 1),
  last_name  VARCHAR(255) CHECK (length(last_name) > 1),
  password   VARCHAR(255) CHECK (length(password) > 2),
  info       TEXT,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Abstract representation of anything that has a creator & can be reported.
CREATE TABLE IF NOT EXISTS Content (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  creator    REFERENCES User (email) ON UPDATE CASCADE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE
);

-- A test may be taken at the end of the module.
CREATE TABLE IF NOT EXISTS Test (
  id INTEGER   NOT NULL PRIMARY KEY AUTOINCREMENT,
  -- FK --
  content_id   NOT NULL REFERENCES Content (id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  duration_min SMALLINT CHECK (duration_min > 0 AND duration_min < 999),
  time_started DATETIME
);

-- A question is associated with a test.
-- It may be either "closed" or "open".
CREATE TABLE IF NOT EXISTS Question (
  id             INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  test_id        NOT NULL REFERENCES Test (id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  question       TEXT NOT NULL,
  -- other --
  correct_answer TEXT DEFAULT NULL
);

-- A student may rate a lesson (and give a rating in [0, 5]).
-- The average of the ratings of all lessons is the rating of the module.
CREATE TABLE IF NOT EXISTS Rating (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  rater      REFERENCES User (email) ON UPDATE CASCADE,
  content_id NOT NULL REFERENCES Content (id) ON UPDATE CASCADE,
  -- other --
  stars INTEGER NOT NULL CHECK (stars >= 0 AND stars <= 5)
);

-- Comments can be submitted to give feedback about content.
-- Because comments themselves are a type of content, this allows for commenting on comments, modules and lessons.
CREATE TABLE IF NOT EXISTS Comment (
  id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  about_item_id NOT NULL REFERENCES Content (id) ON UPDATE CASCADE ON DELETE CASCADE,
  content_id    UNIQUE NOT NULL REFERENCES Content (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- A content creator may invite a student to take part in their module.
CREATE TABLE IF NOT EXISTS Invitation (
  id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  module_id NOT NULL REFERENCES Module (id) ON UPDATE CASCADE ON DELETE CASCADE,
  student   NOT NULL REFERENCES User (email) ON UPDATE CASCADE ON DELETE CASCADE,
  creator   REFERENCES User (email) ON UPDATE CASCADE
);

-- Feedback may be given to a student on their answer to an open question.
CREATE TABLE IF NOT EXISTS Feedback (
  id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  answer_id NOT NULL REFERENCES Answer (id) ON UPDATE CASCADE,
  mark      REAL CHECK (mark >= 0.0 AND mark <= 100.0),
  comment   TEXT
);

CREATE TABLE IF NOT EXISTS Enrollment (
  id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  module_id     NOT NULL REFERENCES Module (id) ON DELETE CASCADE ON UPDATE CASCADE,
  student_email NOT NULL REFERENCES User (email) ON UPDATE CASCADE ON DELETE CASCADE
);

-- A module is like a container (i.e. folder / directory) for lessons.
CREATE TABLE IF NOT EXISTS Module (
  id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  content_id UNIQUE NOT NULL REFERENCES Content (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- A lesson MUST BE associated with a module.
-- A lesson MUST have a content (stored as an HTML string).
-- A lesson may be marked as having a quiz made from definitions (automatically generated from the definitions).
CREATE TABLE IF NOT EXISTS Lesson (
  id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  module_id REFERENCES Module (id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  make_quiz BOOLEAN NOT NULL DEFAULT FALSE,
  content   TEXT NOT NULL
);

-- An answer to an open question may BE given by a student enrolled in a module.
CREATE TABLE IF NOT EXISTS Answer (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  student_email NOT NULL REFERENCES User (email) ON DELETE CASCADE ON UPDATE CASCADE,
  question_id NOT NULL REFERENCES Question (id) ON UPDATE CASCADE ON DELETE CASCADE,
  -- other --
  answer TEXT NOT NULL
);

-- The content creator may define terms in a lesson they created.
CREATE TABLE IF NOT EXISTS Definition (
  id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  -- FK --
  lesson_id NOT NULL REFERENCES Lesson (id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- other --
  term      VARCHAR(255) NOT NULL,
  meaning   TEXT NOT NULL
);

-- A user may report a piece of content (e.g. lesson, module, content) for breaking terms and conditions.
CREATE TABLE IF NOT EXISTS Report (
  id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,

  -- FK --
  content_id NOT NULL REFERENCES Content (id) ON DELETE CASCADE ON UPDATE CASCADE,
  author     REFERENCES User (email) ON UPDATE CASCADE,
  -- other --
  issue      VARCHAR(255) NOT NULL CHECK (issue IN ("out of date", "inappropriate content", "inaccurate inforamtion", "contains mistakes"))
);
