function unselectMod() {
  const maybeMod = document.querySelector(`#module-edit-list-module li[class*=has-background-light]`);
  if (maybeMod) maybeMod.classList.remove('has-background-light');
}
function unselectLess() {
  const maybeLess = document.querySelector(`#module-edit-list-lesson li[class*=has-background-light]`);
  if (maybeLess) maybeLess.classList.remove('has-background-light');
}
function unselectQuest() {
  const maybeQuest = document.querySelector(`#module-edit-list-question li[class*=has-background-light]`);
  if (maybeQuest) maybeQuest.classList.remove('has-background-light');
}

function selectMod(moduleId) {
  return document.querySelector(`#module-edit-list-module li[data-id='${moduleId}']`).classList.add('has-background-light');
}
function selectLess(lessonId) {
  return document.querySelector(`#module-edit-list-lesson li[data-id='${lessonId}']`).classList.add('has-background-light');
}
function selectQuest(questionId) {
  return document.querySelector(`#module-edit-list-question li[data-id='${questionId}']`).classList.add('has-background-light');
}

function destroySelMod() {
  return destroy('Module', getSelModId());
}
function destroySelLess() {
  return destroy('Lesson', getSelLessId());
}
function destroySelQuest() {
  return destroy('Question', getSelQuestId());
}

function getSelModId() {
  const maybeMod = document.querySelector(`#module-edit-list-module li[class*=has-background-light]`);
  return maybeMod ? eval(maybeMod.getAttribute('data-id')) : null;
}
function getSelLessId() {
  const maybeLess = document.querySelector(`#module-edit-list-lesson li[class*=has-background-light]`);
  return maybeLess ? eval(maybeLess.getAttribute('data-id')) : null;
}
function getSelQuestId() {
  const maybeQuest = document.querySelector(`#module-edit-list-question li[class*=has-background-light]`);
  return maybeQuest ?  eval(maybeQuest.getAttribute('data-id')) : null;
}

/**
 * @param {{name: String, authorId: Number, topic: String, summary: String}} module
 * @param {Array<String>} topics
 * @return {Promise<void>}
 */
async function showModEditPane(module = {name: null, authorId: null, topic: null, summary: null}, topics = ['AI', 'Biology', 'Chemistry', 'Physics', 'Sociology', 'Social Sciences', 'Computer Science', 'Mathematics', 'Psychology', 'Architercture', 'Engineering']) {
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
            <span id="module-edit-topic" style="min-width: 150px;">${module.topic ? module.topic : ''}</span>
            <span class="icon is-small">
              <i class="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
          <div class="dropdown-content">
            ${topics.map(t => "<a class='dropdown-item' onclick='document.getElementById(\"module-edit-topic\").innerText = this.innerText.trim()'>" + t + "</a>")}
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
        <strong>Rating</strong> <span id="module-edit-rating">${await get('Rating', {moduleId: module.id}).then(rs => rs.map(r => r.stars)).then(rs => {
      const n = rs.length;
      return n > 0 ? rs.reduce((l, r) => l + r)  / n : 0;
    })}/5</span>
      </section>
      <section class="is-medium" style="margin-bottom: 30px;">
        <h2 class="title is-medium" style="margin-bottom: 10px;">Summary</h2>
        <textarea id="module-edit-summary"
                  style="min-width: 100%; min-height: 90px; word-wrap: break-word; padding: 10px; border: 1px #c9c3c3 dashed;">${module.summary ? module.summary : ''}</textarea>
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
        <button onclick="if (confirm('Delete module?')) destroySelMod()" class="button is-danger" style="margin: 7px">
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
 * Populate the right pane with lesson editing view.
 *
 * @param {Object} lesson
 */
function showLessEditPane(lesson = {id: null, moduleId: null, name: null}) {
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
                style="padding: 5px; min-width: 650px; min-height: 50px; max-height: 800px; border: 1px #c9c3c3 dashed;">${lesson.summary ? lesson.summary : ''}</textarea>
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
        <button onclick="if (confirm('Delete lesson?')) destroySelLess()" class="button is-danger" style="min-width: 100px;">
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
function showQuestEditPane(question = {id: null, moduleId: null, correctAnswer: null, badAnswer1: null, badAnswer2: null, badAnswer3: null}) {
  document.getElementById('module-edit-pane').innerHTML = `
    <h1 class="title is-3" style="margin-bottom: 10px;">Question</h1>
    <p><strong>Note:</strong> Save the current question before editing another one</p>
    <br>
    <div class="field">
      <a id="module-edit-question-name" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.name ? question.name : ''}</a>
    </div>
    <br>

    <div class="field">
      <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
      <a id="module-edit-question-answer" class="button is-medium is-light" contenteditable="true" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.correctAnswer ? question.correctAnswer : ''}</a>
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
      <a onclick="if (confirm('Delete question?')) destroySelQuest()" class="button is-danger" style="margin: 7px">
        <i class="fas fa-check"></i>
        <span>Delete</span>
      </a>
    </div>
  `;
}

function saveProgress() {
  const pane = document.getElementById('module-edit-pane');
  const moduleId = getSelModId();
  const lessonId = getSelLessId();
  const questionId = getSelQuestId();
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


async function toggleModule(id) {
  sessionStorage.setItem(`${location.pathname}?click`, JSON.stringify({page: 'module', id}));
  saveProgress();
  unselectLess();
  unselectQuest();
  if (getSelModId() !== id) {
    unselectMod();
    selectMod(id);
    document.getElementById('module-edit-list-lesson').innerHTML = '';
    document.getElementById('module-edit-list-question').innerHTML = '';
    get('Lesson', {moduleId: id}).then(ls => {
      for (const l of ls) appendLesson(l);
    });
    get('Question', {moduleId: id}).then(qs => {
      for (const q of qs) appendQuestion(q);
    });
  }
  document.getElementById('module-edit-pane').innerHTML = '';
  return await showModEditPane((await get('Module', {id}))[0]);
}
async function toggleLesson(id) {
  if (id === getSelLessId()) return;
  sessionStorage.setItem(`${location.pathname}?click`, JSON.stringify({page: 'lesson', id}));
  saveProgress();
  unselectLess();
  unselectQuest();
  selectLess(id);
  document.getElementById('module-edit-pane').innerHTML = '';
  return await showLessEditPane((await get('Lesson', {id, moduleId: getSelModId()}))[0]);
}
async function toggleQuestion(id) {
  if (id === getSelQuestId()) return;
  sessionStorage.setItem(`${location.pathname}?click`, JSON.stringify({page: 'question', id}));
  saveProgress();
  unselectQuest();
  unselectLess();
  selectQuest(id);
  document.getElementById('module-edit-pane').innerHTML = '';
  return await showQuestEditPane((await get('Question', {id, moduleId: getSelModId()}))[0]);
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{name: String, id: Number, authorId: Number}} m
 */
function appendModule(m = {id: null , authorId: null, name: null}) {
  document.getElementById('module-edit-list-module').innerHTML += `
    <li data-id="${m.id}">
      <a onclick="toggleModule(${m.id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${m.name ? m.name : 'unnamed #' + m.id.toString()}</span>
        <button class="button is-danger is-small" style="width: 20px; height: 23px;" onclick="if (confirm('Delete module?')) destroyMod(${m.id});">
          <i class="fas fa-times fa-xs" style="margin: initial;"></i>
        </button>
      </a>
    </li>
    `;
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 */
function appendLesson(lesson = {id: null, name: null, moduleId: null}) {
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
 */
function appendQuestion(question = {moduleId: null, correctAnswer: null, badAnswer1: null, badAnswer2: null, badAnswer3: null}) {
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
function appendAttachment(
  moduleId, lessonId, id, name = 'attachment') {
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
 * @return {Promise<*>}
 */
async function updateMod() {
  const moduleId = getSelModId();
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
    sessionStorage.removeItem(`${location.pathname}/modules?id=${getSelModId()}`);
    await toggleModule(getSelModId());
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
  document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a > span`).innerText = maybeName ? maybeName : `unnamed ${moduleId}`;
}

async function updateLess() {}

async function updateQuest() {
  const pane = document.getElementById('module-edit-pane');
  const maybeBadA1 = pane.querySelector('#module-edit-question-bad-answer-1').innerText;
  const maybeBadA2 = pane.querySelector('#module-edit-question-bad-answer-2').innerText;
  const maybeBadA3 = pane.querySelector('#module-edit-question-bad-answer-3').innerText;
  const maybeA = pane.querySelector('#module-edit-question-answer').innerText;
  const questionId = getSelQuestId();
  const moduleId = getSelModId();
  let maybeName = pane.querySelector('#module-edit-question-name').innerText;
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${moduleId}`);
  sessionStorage.removeItem(`${location.pathname}/questions?id=${questionId}&moduleId=${moduleId}`);
  const newQ = await update('Question', questionId, JSON.stringify({
    id: questionId,
    moduleId: moduleId,
    name: maybeName ? maybeName : null,
    badAnswer1: maybeBadA1 ? maybeBadA1 : null,
    badAnswer2: maybeBadA2 ? maybeBadA2 : null,
    badAnswer3: maybeBadA3 ? maybeBadA3 : null,
    correctAnswer: maybeA ? maybeA : null,
  }));
  document.querySelector(`#module-edit-list-question li[data-id='${questionId}'] > a > span`).innerText = maybeName ? maybeName : `unnamed #${questionId}`;
}

async function destroyMod(id) {
  destroy('Module', id);
  let authorId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  sessionStorage.removeItem(`${location.pathname}/modules?authorId=${authorId}`);
  if (getSelModId() === id) {
    document.getElementById('module-edit-pane').innerText = '';
    document.getElementById('module-edit-list-question').innerText = '';
    document.getElementById('module-edit-list-lesson').innerText = '';
  }
  document.querySelector(`#module-edit-list-module li[data-id='${id}']`).remove();
}

async function destroyLess(id) {
  destroy('Lesson', id);
  sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${getSelModId()}`);
  if (getSelLessId() === id) document.getElementById('module-edit-pane').innerText = '';
  document.querySelector(`#module-edit-list-lesson li[data-id='${id}']`).remove();
}

async function destroyQuest(id) {
  destroy('Question', id);
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${getSelModId()}`);
  if (getSelQuestId() === id) document.getElementById('module-edit-pane').innerText = '';
  document.querySelector(`#module-edit-list-question li[data-id='${id}']`).remove();
}

async function createMod() {
  const authorId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  const module = create('Module', JSON.stringify({authorId} ));
  sessionStorage.removeItem(`${location.pathname}/modules?authorId=${authorId}`);
  return appendModule(await module);
}

document.getElementById('module-edit-btn-lesson-create').onclick = async function createLess() {
  const lesson = create('Lesson', JSON.stringify({moduleId: getSelModId()} ));
  sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${getSelModId()}`);
  return appendLesson(await lesson);
};

document.getElementById('module-edit-btn-question-create').onclick = async function createQuest() {
  const question = create('Question', JSON.stringify({moduleId: getSelModId()} ));
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${getSelModId()}`);
  return appendQuestion(await question);
};

<!--Populate the page using AJAX-->
(async function() {
  try {
    for (const m of await get('Module',
      {authorId: JSON.parse(sessionStorage.getItem('loggedIn')).id})) {
      appendModule(m);
    }
  } catch (e) {
    const msg = e.msg || e.message || e.toLocaleString();
    console.error(e);
    alert(msg);
  }
})().then(() => (async function() {
  async function tryRecallMod() {
    const memory = sessionStorage.getItem(`${location.pathname}?click`);
    if (!memory) return false;
    const parsed = JSON.parse(memory);
    if (parsed.page !== 'module') {
      return false;
    }
    if (!document.querySelector(
      `#module-edit-list-module li[data-id='${parsed.id}'] > a`)) {
      return false;
    }
    await toggleModule(eval(parsed.id));
    return true;
  }

  async function tryRecallLess() {
    const memory = sessionStorage.getItem(`${location.pathname}?click`);
    if (!memory) return false;
    const parsed = JSON.parse(memory);
    if (parsed.page !== 'lesson') return false;
    const {id} = parsed;
    const ls = await get('Lesson', {id});
    if (ls.length === 0) return false;
    const moduleId = ls[0].moduleId;
    if (!document.querySelector(
      `#module-edit-list-module li[data-id='${moduleId}'] > a`)) {
      return false;
    }
    await toggleModule(moduleId);
    if (!document.querySelector(
      `#module-edit-list-lesson li[data-id='${id}'] > a`)) {
      return false;
    }
    await toggleLesson(id);
    return true;
  }

  async function tryRecallQuest() {
    /** Try to recall last expanded module */
    const memory = sessionStorage.getItem(`${location.pathname}?click`);
    if (!memory) return false;
    const parsed = JSON.parse(memory);
    if (parsed.page !== 'question') return false;
    const {id} = parsed;
    const qs = await get('Question', {id});
    if (qs.length === 0) return false;
    const moduleId = qs[0].moduleId;
    if (!document.querySelector(
      `#module-edit-list-module li[data-id='${moduleId}'] > a`)) {
      return false;
    }
    await toggleModule(moduleId);
    if (!document.querySelector(
      `#module-edit-list-question li[data-id='${id}'] > a`)) {
      return false;
    }
    await toggleQuestion(id);
    return true;
  }

  return tryRecallMod()
    .then(async ok => ok ||
      await tryRecallLess().then(async ok2 => ok2 || await tryRecallQuest()));
})());
