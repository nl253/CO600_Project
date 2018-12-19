/**
 * Select (highlight) a list item.
 *
 * @param {'Module'|'Lesson'|'Question'} what
 * @param {!Number} id
 */
function select(what, id) {
  return document.querySelector(`#module-edit-list-${what.toLowerCase()} li[data-id='${id}']`).classList.add('has-background-light');
}

/**
 * Un-Select (un-highlights) a list item.
 *
 * @param {'Module'|'Lesson'|'Question'} what
 */
function unSelect(what) {
  const maybe = document.querySelector(`#module-edit-list-${what.toLowerCase()} li[class*=has-background-light]`);
  if (maybe) maybe.classList.remove('has-background-light');
}


/**
 * Saves the last click. (this is recalled later)
 *
 * @param {'Module'|'Lesson'|'Question'} what
 * @param {!Number} id
 */
function saveClick(what, id) {
  return sessionStorage.setItem(`${location.pathname}?click`, JSON.stringify({page: what.toLowerCase(), id}));
}

/**
 * Clears a list.
 *
 * @param {'Module'|'Lesson'|'Question'} what
 */
function clearList(what) {
  return document.getElementById(`module-edit-list-${what.toLowerCase()}`).innerHTML = '';
}

/**
 * Clears the edit pane.
 */
function clearPane() {
  return document.getElementById('module-edit-pane').innerHTML = '';
}

/**
 * Gets the id of selected.
 *
 * @param {'Module'|'Lesson'|'Question'} what
 * @return {?Number}
 */
function getSelId(what) {
  const maybe = document.querySelector(`#module-edit-list-${what.toLowerCase()} li[class*=has-background-light]`);
  return maybe ? eval(maybe.getAttribute('data-id')) : null;
}

/**
 * Shows the lesson edit pane.
 *
 * @param {{id: !Number, name: ?String, authorId: !Number, topic: ?String, summary: ?String}} module
 * @param {Array<!String>} topics
 * @return {Promise<void>}
 */
async function showModEditPane(module = {id: null, name: null, authorId: null, topic: null, summary: null}, topics = [ 'AI', 'Anthropology', 'Archeology', 'Architecture', 'Arts', 'Biology', 'Chemistry', 'Computer Science', 'Design', 'Drama', 'Economics', 'Engineering', 'Geography', 'History', 'Humanities', 'Languages', 'Law', 'Linguistics', 'Literature', 'Mathematics', 'Medicine', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sciences', 'Social Sciences', 'Sociology', 'Theology']) {
  try {
    document.getElementById('module-edit-pane').innerHTML = `
      <h2 class="title" style="margin-bottom: 10px;">
        Name
      </h2>
      
      <div id="module-edit-name" contenteditable="true" style="max-width: 300px;">
        ${module.name ? module.name : ''}
      </div>
      <h3 class="subtitle" style="margin: 25px 0 0 0;">
        Topic
      </h3>
      <div class="dropdown" 
           onmouseover="this.classList.add('is-active')"
           onmouseout="this.classList.remove('is-active')"
           style="border: 1px #bdbdbd dashed;">
        <div class="dropdown-trigger">
          <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" style="background: #d3d3d329;">
            <span id="module-edit-topic" style="min-width: 150px;">${module.topic ?
      module.topic :
      ''}</span>
            <span class="icon is-small">
              <i class="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
          <div class="dropdown-content">
            ${topics.map(
      t => "<a class='dropdown-item' onclick='document.getElementById(\"module-edit-topic\").innerText = this.innerText.trim()'>" +
        t + "</a>")}
            <hr class="dropdown-divider">
            <span class="dropdown-item" style="font-weight: bold;">
              Other
            </span>
            <a class="dropdown-item" onmouseout="document.getElementById('module-edit-topic').innerText = this.innerText.trim()" id="module-edit-topic-other" contenteditable="true"
               style="margin: 5px 10px; max-width: 90%;">
              ${module.topic ? module.topic : ''}
            </a>
          </div>
        </div>
      </div>
      <section class="content" style="margin-top: 40px;">
        <strong>Author</strong>   
        <a href="/user/${module.authorId}">
          ${await get('User', {id: module.authorId}).then(us => us[0].email)}
        </a>
        <br>
        <strong>Rating</strong> <span id="module-edit-rating">${await get(
      'Rating', {moduleId: module.id})
      .then(rs => rs.map(r => r.stars))
      .then(rs => {
        const n = rs.length;
        return n > 0 ? rs.reduce((l, r) => l + r) / n : 0;
      })}/5</span>
      </section>
      <section class="is-medium" style="margin-bottom: 30px;">
        <h2 class="title is-medium" style="margin-bottom: 10px;">Summary</h2>
        <textarea id="module-edit-summary"
                  style="min-width: 100%; min-height: 90px; word-wrap: break-word; padding: 10px; border: 1px #c9c3c3 dashed;">${module.summary ?
      module.summary :
      ''}</textarea>
      </section>
      <div class="field is-grouped">
        <button class="button is-warning" style="margin: 7px">
          <i class="fas fa-undo"></i>
          <span>Reset</span>
        </button>
        <button onclick="updateMod().then(() => alert('Updated module.'))" class="button is-success" style="margin: 7px">
          <i class="fas fa-check"></i>
          <span>Save</span>
        </button>
        <button onclick="if (confirm('Delete module?')) destroyMod(${module.id})" class="button is-danger" style="margin: 7px">
          <i class="fas fa-times"></i>
          <span>Delete</span>
        </button>
      </div>
    `;
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
}

/**
 * Shows the lesson edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, summary: ?String}} question
 */
function showLessEditPane(lesson = {id: null, moduleId: null, name: null, summary: null}) {
  document.getElementById('module-edit-pane').innerHTML = `
    <form method="post" action="/module/${lesson.moduleId}/${lesson.id}"
          data-id="${lesson.id}"
          enctype="multipart/form-data"
          class="lesson-edit-form column is-10-desktop is-full-tablet is-full-mobile"
          style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: -15px;">
      <h2 class="title is-3">Name</h2>
      <input name="name" value="${lesson.name ? lesson.name : ''}" autocomplete="on"
             style="background: #d3d3d329; padding: 5px; border: 1px #c9c3c3 dashed;"
             placeholder="e.g. Introduction to AI">
      <h2 class="title is-3" style="margin-top: 20px;">Summary</h2>
      <textarea class="lesson-edit-summary" name="summary" autocomplete="on"
                style="padding: 5px; min-width: 650px; min-height: 50px; max-height: 800px; border: 1px #c9c3c3 dashed;">${lesson.summary ?
    lesson.summary :
    ''}</textarea>
      <h2 class="title is-3" style="margin-top: 20px;">Content</h2>
      <p style="margin-bottom: 10px;">Upload HTML file with the lesson content</p>
      <div class="module-edit-lesson-content"></div>
      <input type="file" name="lesson" style="display: block; max-width: 200px; margin-top: 20px;">
      <h2 class="title is-3" style="margin-top: 20px;">Attachments (optional)</h2>
      <p><strong>Select a file:</strong></p>
      <br>
      <ul style="list-style-type: disc; display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start;">
        <li>Image (.jpg, .jpeg, .png, .gif)</li>
        <li>Audio (.mp3)</li>
        <li>Video (.mp4, .mpg)</li>
      </ul>
      <br>
      <input type="file" multiple style="display: block">
      <div style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: 20px;">
        <h3 class="lesson-edit-h-uploaded-files title is-5">
          Uploaded Files
        </h3>
        <ul class="lesson-edit-uploaded-files"
            style="display: flex; flex-direction: column; justify-content: space-around; align-items: center;"></ul>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 20px; min-width: 380px; max-width: 500px;">
        <button class="button is-warning" style="min-width: 100px;">
          <i class="fas fa-undo"></i>
          <span>Reset</span>
        </button>
        <button type="submit" class="button is-success" form="lesson-edit-form" style="min-width: 100px;">
          <i class="fas fa-check"></i>
          <span>Save</span>
        </button>
        <button onclick="if (confirm('Delete lesson?')) destroyLess(${lesson.id}) " class="button is-danger" style="min-width: 100px;">
          <i class="fas fa-times"></i>
          <span>Delete</span>
        </button>
      </div>
    </form>
    `;

  // if (content) {
  //   setLessContent(id);
  // } else {
  //   unsetLessContent(id);
  // }

  // for (const f of attachments) {
  //   appendAttachment(moduleId, id, f.name);
  // }

}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function showQuestEditPane(question = {id: null, moduleId: null, correctAnswer: null, badAnswer1: null, badAnswer2: null, badAnswer3: null}) {
  document.getElementById('module-edit-pane').innerHTML = `
    <h1 class="title is-3" style="margin-bottom: 10px;">Question</h1>
    <p><strong>Note:</strong> Save the current question before editing another one</p>
    <br>
    <div class="field">
      <a id="module-edit-question-name" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.name ?
    question.name :
    ''}</a>
    </div>
    <br>

    <div class="field">
      <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
      <a id="module-edit-question-answer" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.correctAnswer ?
    question.correctAnswer :
    ''}</a>
    </div>
    <br>
    
    <h3 class="title is-3" style="margin-bottom: 10px;">Other Answers</h3>

    <p><strong>Note:</strong> Include other answers which are wrong</p>

    <br>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-1" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer1 ?
    question.badAnswer1 :
    ''}</a>
    </div>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-2" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer2 ?
    question.badAnswer2 :
    ''}</a>
    </div>
    
    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-3" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer3 ?
    question.badAnswer3 :
    ''}</a>
    </div>
    <br>

    <div class="field is-grouped">
      <a onclick="updateQuest().then(() => alert('Updated question.'))" class="button is-success" style="margin: 7px">
        <i class="fas fa-check"></i>
        <span>Save</span>
      </a>
      <a class="button is-warning" style="margin: 7px">
        <i class="fas fa-undo"></i>
        <span>Reset</span>
      </a>
      <a onclick="if (confirm('Delete question?')) destroyQuest(${question.id}) " class="button is-danger" style="margin: 7px">
        <i class="fas fa-check"></i>
        <span>Delete</span>
      </a>
    </div>
  `;
}

/**
 * Memorize the changes made to the input (or contenteditable) fields.
 */
function saveProgress() {
  const pane = document.getElementById('module-edit-pane');
  const moduleId = getSelId('Module');
  const lessonId = getSelId('Lesson');
  const questionId = getSelId('Question');
  if (moduleId && lessonId && !questionId) {
  } else if (moduleId && !lessonId && questionId) {
    if (!pane.querySelector('#module-edit-question-answer')) return;
    const vars = JSON.stringify([{
      authorId: JSON.parse(sessionStorage.getItem('loggedIn')).id,
      badAnswer1 : pane.querySelector('#module-edit-question-bad-answer-1').innerText.trim(),
      badAnswer2 : pane.querySelector('#module-edit-question-bad-answer-2').innerText.trim(),
      badAnswer3 : pane.querySelector('#module-edit-question-bad-answer-3').innerText.trim(),
      correctAnswer : pane.querySelector('#module-edit-question-answer').innerText.trim(),
      name : pane.querySelector('#module-edit-question-name').innerText.trim(),
    }]);
    sessionStorage.setItem(`${location.pathname}/questions?id=${questionId}`, vars);
    return sessionStorage.setItem(`${location.pathname}/questions?id=${questionId}&moduleId=${moduleId}`, vars);
  } else if (moduleId && !lessonId && !questionId) {
    if (!pane.querySelector('#module-edit-name')) return;
    return sessionStorage.setItem(`${location.pathname}/modules?id=${moduleId}`,
      JSON.stringify([{
        name: pane.querySelector('#module-edit-name').innerText.trim(),
        topic: pane.querySelector('#module-edit-topic').innerText.trim(),
        authorId: JSON.parse(sessionStorage.getItem('loggedIn')).id,
        summary: pane.querySelector('#module-edit-summary').value.trim(),
      }]));
  }
}


/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleModule(id) {
  saveClick('Module', id);
  saveProgress();
  unSelect('Lesson');
  unSelect('Question');
  const focusedMod = getSelId('Module');
  if (focusedMod === id && !getSelId('Lesson') && !getSelId('Question')) {
    return;
  } else if (focusedMod !== id) {
    unSelect('Module');
    select('Module', id);
    clearList('Lesson');
    clearList('Question');
    get('Lesson', {moduleId: id}).then(ls => {
      for (const l of ls) appendLesson(l);
    });
    get('Question', {moduleId: id}).then(qs => {
      for (const q of qs) appendQuestion(q);
    });
  }
  return await showModEditPane((await get('Module', {id}))[0]);
}


/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleLesson(id) {
  const focusedLessId = getSelId('Lesson');
  if (id === focusedLessId) return;
  saveClick('Lesson', id);
  saveProgress();
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  return await showLessEditPane((await get('Lesson', {id, moduleId: getSelId('Module')}))[0]);
}

/**
 * Toggle question. Run when a question is pressed. Shows the question-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleQuestion(id) {
  if (id === getSelId('Question')) return;
  saveClick('Question', id);
  saveProgress();
  unSelect('Question');
  unSelect('Lesson');
  select('Question', id);
  return await showQuestEditPane((await get('Question', {id, moduleId: getSelId('Module')}))[0]);
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{id: !Number, authorId: !Number, name: ?String}} module
 */
function appendModule(module = {id: null , name: null}) {
  document.getElementById('module-edit-list-module').innerHTML += `
    <li data-id="${module.id}">
      <a onclick="toggleModule(${module.id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${module.name ? module.name : 'unnamed #' + module.id.toString()}</span>
        <button class="button is-danger is-small" style="width: 20px; height: 23px;" onclick="if (confirm('Delete module?')) destroyMod(${module.id});">
          <i class="fas fa-times fa-xs" style="margin: initial;"></i>
        </button>
      </a>
    </li>
    `;
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String}} lesson
 */
function appendLesson(lesson = {id: null, moduleId: null, name: null}) {
  // append to the second (lesson) menu
  document.getElementById('module-edit-list-lesson').innerHTML += `
    <li data-id="${lesson.id}"
        data-module-id="${lesson.moduleId}">
      <a onclick="toggleLesson(${lesson.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${lesson.name ? lesson.name : 'unnamed #' + lesson.id}</span>
        <div style="display: flex; flex-direction: row; justify-content: space-between;">
          <button class="button is-small is-danger" onclick="if (confirm('Delete lesson?')) destroyLess(${lesson.id});" style="width: 20px; height: 23px;">
            <i class="fas fa-times fa-xs" style="margin: initial;"></i>
          </button>
        </div>
      </a>
    </li>
    `;
}

/**
 * Appends a question to the quiz for the selected module.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuestion(question = {id: null, moduleId: null, correctAnswer: null, badAnswer1: null, badAnswer2: null, badAnswer3: null}) {
  document.querySelector(`#module-edit-list-question`).innerHTML += `
    <li data-id="${question.id}"
        data-module-id="${question.moduleId}">
      <a class="has-text-dark" onclick="toggleQuestion(${question.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${question.name ? question.name : 'unnamed #' + question.id}</span>
        <div style="display: flex; flex-direction: row; justify-content: space-between;">
          <button class="button is-small is-danger" onclick="if (confirm('Delete question?')) destroyQuest(${question.id});" style="width: 20px; height: 23px;">
            <i class="fas fa-times fa-xs" style="margin: initial;"></i>
          </button>
        </div>
      </a>
    </li>
  `;
}


/**
 * Adds attachment to a list of attachments in a lesson.
 *
 * @param {!Number} moduleId
 * @param {!Number} lessonId
 * @param {!Number} id
 * @param {?String} name
 */
function appendAttachment(moduleId, lessonId, id, name = 'attachment') {
  document.querySelector(
    `form[data-id='${lessonId}'] ul.lesson-edit-uploaded-files`).innerHTML += `
    <li class="has-text-black"
        data-id="${id}"
        data-name="${name}"
        style="background: #e5e5e5d4; padding: 8px 12px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 300px; max-width: 500px; margin-bottom: 10px;">
      <div class="module-file-name">${name}</div>
      <div style="width: 75px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <a href="/file/${id}" class="button is-link is-small" data-name="${name}" data-id="${id}" download><i class="fas fa-download"></i></a>
        <button class="button is-small is-danger"><i class="fas fa-times"></i></button>
      </div>
    </li>
      `;
}

function setLessContent(lessonId) {
  document.querySelector(
    `form[data-id='${lessonId}'] .module-edit-lesson-content`).innerHTML = `
    <p class="lesson-edit-msg-has-lesson">
      <br>
      <strong>NOTE</strong>
      <br>
      You have already uploaded lesson content!
      <br>
      Feel free to <strong>replace</strong> it by re-uploading another file.
    </p>
    <br>
    <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; min-width: 200px;">
      <a href="/api/lesson/${lessonId}/download"
         class="lesson-edit-btn-download has-text-centered button is-link is-small"
         download="lesson.html">
        <i class="fas fa-download"></i>
        Download
      </a>
      <button class=" lesson-edit-btn-delete-content button is-danger is-small"
              style="margin-top: 10px; margin-bottom: 10px;">
        <i class="fas fa-times"></i>
        Delete
      </button>
    </div>
  `;
}

/**
 * Remove the HTML content file from a lesson.
 *
 * @param {!Number} lessonId
 */
function unsetLessContent(lessonId) {
  document.querySelector(`form[data-id='${lessonId}'] .module-edit-lesson-content`).innerHTML = `
    <ul style="display: flex; flex-direction: column; justify-content: space-around;">
      <li>
        <p><em>Only</em> include the <em>content</em> of the <code>&lt;body&gt;</code> tag</p>
      </li>
      <li>
        <p>We will only accept <strong>HTML</strong> files</p>
      </li>
    </ul>
  `;
}

/**
 * Modifies a module and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateMod() {
  const moduleId = getSelId('Module');
  const pane = document.getElementById('module-edit-pane');
  const maybeName = pane.querySelector('#module-edit-name').innerText;
  const maybeTopic = pane.querySelector('#module-edit-topic').innerText;
  const maybeSummary = pane.querySelector('#module-edit-summary').value;
  try {
    await update('Module', moduleId, JSON.stringify({
      summary: maybeSummary ? maybeSummary : null,
      name: maybeName ? maybeName : null,
      topic: maybeTopic ? maybeTopic : null,
    }));
    sessionStorage.removeItem(`${location.pathname}/modules?authorId=${JSON.parse(sessionStorage.getItem('loggedIn')).id}`);
    sessionStorage.removeItem(`${location.pathname}/modules?id=${getSelId('Module')}`);
    await toggleModule(getSelId('Module'));
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
  document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a > span`).innerText = maybeName ? maybeName : `unnamed ${moduleId}`;
}

/**
 * TODO Modifies a lesson and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateLess() {}

/**
 * TODO Modifies a question and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateQuest() {
  const pane = document.getElementById('module-edit-pane');
  const maybeBadA1 = pane.querySelector('#module-edit-question-bad-answer-1').innerText;
  const maybeBadA2 = pane.querySelector('#module-edit-question-bad-answer-2').innerText;
  const maybeBadA3 = pane.querySelector('#module-edit-question-bad-answer-3').innerText;
  const maybeA = pane.querySelector('#module-edit-question-answer').innerText;
  const id = getSelId('Question');
  const moduleId = getSelId('Module');
  let maybeName = pane.querySelector('#module-edit-question-name').innerText;
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${moduleId}`);
  sessionStorage.removeItem(`${location.pathname}/questions?id=${id}&moduleId=${moduleId}`);
  await update('Question', id, JSON.stringify({
    id,
    moduleId,
    name: maybeName ? maybeName : null,
    badAnswer1: maybeBadA1 ? maybeBadA1 : null,
    badAnswer2: maybeBadA2 ? maybeBadA2 : null,
    badAnswer3: maybeBadA3 ? maybeBadA3 : null,
    correctAnswer: maybeA ? maybeA : null,
  }));
  document.querySelector(`#module-edit-list-question li[data-id='${id}'] > a > span`).innerText = maybeName ? maybeName : `unnamed #${id}`;
}

/**
 * Destroys a module.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function destroyMod(id) {
  destroy('Module', id);
  let authorId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  sessionStorage.removeItem(`${location.pathname}/modules?authorId=${authorId}`);
  if (getSelId('Module') === id) {
    document.getElementById('module-edit-pane').innerText = '';
    document.getElementById('module-edit-list-question').innerText = '';
    document.getElementById('module-edit-list-lesson').innerText = '';
  }
  document.querySelector(`#module-edit-list-module li[data-id='${id}']`).remove();
}

/**
 * Destroys a lesson.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function destroyLess(id) {
  destroy('Lesson', id);
  sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${getSelId('Module')}`);
  if (getSelId('Lesson') === id) clearPane();
  document.querySelector(`#module-edit-list-lesson li[data-id='${id}']`).remove();
}

/**
 * Destroys a question.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function destroyQuest(id) {
  destroy('Question', id);
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${getSelId('Module')}`);
  if (getSelId('Question') === id) clearPane();
  document.querySelector(`#module-edit-list-question li[data-id='${id}']`).remove();
}

/**
 * Creates a module.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-module-create').onclick = async function createMod(e) {
  e.preventDefault();
  const authorId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  const module = create('Module', JSON.stringify({authorId} ));
  sessionStorage.removeItem(`${location.pathname}/modules?authorId=${authorId}`);
  return appendModule(await module);
};

/**
 * Creates a lesson.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-lesson-create').onclick = async function createLess(e) {
  e.preventDefault();
  const moduleId = getSelId('Module');
  const lesson = create('Lesson', JSON.stringify({moduleId} ));
  sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${moduleId}`);
  return appendLesson(await lesson);
};

/**
 * Creates a question.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-question-create').onclick = async function createQuest(e) {
  e.preventDefault();
  const moduleId = getSelId('Module');
  const question = create('Question', JSON.stringify({moduleId} ));
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${moduleId}`);
  return appendQuestion(await question);
};

<!--Populate the page using AJAX-->
(async function() {
  try {

    for (const m of await get('Module', {authorId: JSON.parse(sessionStorage.getItem('loggedIn')).id})) {
      appendModule(m);
    }

    const memory = sessionStorage.getItem(`${location.pathname}?click`);
    if (!memory) return false;
    const {page, id} = JSON.parse(memory);

    async function tryRecallMod() {
      if (page !== 'module') {
        return false;
      } else if (!document.querySelector(`#module-edit-list-module li[data-id='${JSON.parse(memory).id}'] > a`)) {
        return false;
      }
      await toggleModule(JSON.parse(memory).id);
      return true;
    }

    async function tryRecallLess() {
      if (page !== 'lesson') return false;
      const ls = await get('Lesson', {id});
      if (ls.length === 0) return false;
      const moduleId = ls[0].moduleId;
      if (!document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a`)) {
        return false;
      }
      await toggleModule(moduleId);
      if (!document.querySelector(`#module-edit-list-lesson li[data-id='${id}'] > a`)) {
        return false;
      }
      await toggleLesson(id);
      return true;
    }

    async function tryRecallQuest() {
      if (page !== 'question') return false;
      const qs = await get('Question', {id});
      if (qs.length === 0) return false;
      const moduleId = qs[0].moduleId;
      if (!document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a`)) {
        return false;
      }
      await toggleModule(moduleId);
      if (!document.querySelector(`#module-edit-list-question li[data-id='${id}'] > a`)) {
        return false;
      }
      await toggleQuestion(id);
      return true;
    }

    return await tryRecallMod() || await tryRecallLess() || await tryRecallQuest();

  } catch(e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg)
  }
})();
