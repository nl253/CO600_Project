/**
 * TODO what if you have 0 modules?
 *      * quiz edit btn
 *      * lessons list
 */

/**
 * Create a new object in the database.
 *
 * @param {String} name e.g. User, Lesson, Module
 * @param {*} postData
 * @return {Promise} promise of created object
 */
async function create(name, postData = '') {
  try {
    return await fetch(`/api/${name.toLowerCase()}/create`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    }).then(res => res.json()).then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Upadate an object in the database.
 *
 * @param {String} name e.g. User, Lesson, Module
 * @param {*} postData
 * @return {Promise} promise of updated object
 */
async function update(name, postData) {
  try {
    return await fetch(`/api/${name.toLowerCase()}`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    }).then(res => res.json()).then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Destroy an object from the database.
 *
 * @param {String} name e.g. User, Module, Lesson
 * @param {Number} id
 * @return {Promise<*>}
 */
async function destroy(name, id) {
  try {
    const response = await fetch(`/api/${name.toLowerCase()}/${id}`, {
      method: 'delete',
      headers: {Accept: 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    return await response.json().then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Query the database for objects.
 *
 * @param {Object} query
 * @return {Promise<Array<Object>>}
 */
async function get(name, query = {}) {
  try {
    return await fetch(`/api/${name.toLowerCase()}/search?${Object.entries(query)
      .map(pair => pair.join('='))
      .join('&')}`, {
      headers: {Accept: 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    }).then(res => res.json()).then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

function clearPane() {
  document.getElementById('module-edit-pane').innerHTML = '';
}

function unselectMod() {
  const maybeMod = document.querySelector(`#module-edit-module-list li[class*=has-background-light]`);
  if (maybeMod) maybeMod.classList.remove('has-background-light');
}
function unselectLess() {
  const maybeLess = document.querySelector(`#module-edit-lesson-list li[class*=has-background-light]`);
  if (maybeLess) maybeLess.classList.remove('has-background-light');
}
function unselectQuest() {
  const maybeQuest = document.querySelector(`#module-edit-question-list li[class*=has-background-light]`);
  if (maybeQuest) maybeQuest.classList.remove('has-background-light');
}

function selectMod(moduleId) {
  return document.querySelector(`#module-edit-module-list li[data-id='${moduleId}']`).classList.add('has-background-light');
}
function selectLess(lessonId) {
  return document.querySelector(`#module-edit-lesson-list li[data-id='${lessonId}']`).classList.add('has-background-light');
}
function selectQuest(questionId) {
  return document.querySelector(`#module-edit-question-list li[data-id='${questionId}']`).classList.add('has-background-light');
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
  const maybeMod = document.querySelector(`#module-edit-module-list li[class*=has-background-light]`);
  return maybeMod ? eval(maybeMod.getAttribute('data-id')) : null;
}
function getSelLessId() {
  const maybeLess = document.querySelector(`#module-edit-lesson-list li[class*=has-background-light]`);
  return maybeLess ? eval(maybeLess.getAttribute('data-id')) : null;
}
function getSelQuestId() {
  const maybeQuest = document.querySelector(`#module-edit-question-list li[class*=has-background-light]`);
  return maybeQuest ?  eval(maybeQuest.getAttribute('data-id')) : null;
}

/**
 * Populate the right pane with lesson editing view.
 *
 * @param {Object} lesson
 */
function showLessEditPane(lesson = {id: null, moduleId: null, name: null, createdAt: Date.now(), updatedAt: Date.now()}) {
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
        <a class="button is-warning" style="min-width: 100px;"
           onclick="if (confirm('Lose all changes?')) location.href = location.href">
          <i class="fas fa-undo"></i>
          Cancel
        </a>
        <input class="button is-success" form="lesson-edit-form" style="min-width: 100px;" type="submit" value="Save">
        <a class="button is-danger" style="min-width: 100px;">
          <i class="fas fa-times" style="margin-right: 7px;"></i>
          Delete
        </a>
      </div>
    </form>
    `;

  // if (content) {
  //   setLessContent(id);
  // } else {
  //   unsetLessContent(id);
  // }

  // for (const f of attachments) {
  //   appendAttachment(moduleId, id, f.name, f.createdAt, f.updatedAt);
  // }

}
async function showModEditPane(module, topics = []) {
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
            ${topics.map(t => `<a class="dropdown-item" onclick="document.getElementById('module-edit-topic').innerText = this.innerText.trim()">${t}</a>`)}
            <hr class="dropdown-divider">
            <span class="dropdown-item" style="font-weight: bold;">
              Other
            </span>
            <a class="dropdown-item" id="module-edit-topic-other" contenteditable="true"
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
    `;
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
}
function showQuestEditPane() {
  document.getElementById('module-edit-pane').innerHTML = `
    <h1 class="title is-3"style="margin-bottom: 10px;">Question</h1>
    <p><strong>Note:</strong> Save the current question before creating a new one</p>
    <br>
    <div class="field">
      <a class="button is-medium is-light" contenteditable="true" style="width: 50%; padding: 5px; border: 1px; margin: auto;"></a>
    </div>
    <br>

    <div class="field">
      <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
      <p><strong>Note:</strong> Only include one correct answer for the quiz</p>
      <br>
      <a class="button is-medium is-light" contenteditable="true" style="width: 50%; padding: 5px; border: 1px; margin: auto;"></a>
    </div>
    <br>
    
    <h3 class="title is-3" style="margin-bottom: 10px;">Other Answers</h3>

    <p><strong>Note:</strong> Include other answers, which are wrong (at least two or at most five)</p>

    <br>

    <div class="field is-horizontal">
      <a class="button is-medium is-light" contenteditable="true" style="width: 50%; padding: 5px; border: 1px; margin-right: 10px;"></a>
      <a class="button is-danger is-small" style="position: relative; top: 10px;">
        <span class="icon" style="margin-right: 7px;">
          <i class="fas fa-times"></i>
        </span>
        Delete
      </a>
    </div>

    <div class="field is-horizontal">
      <a class="button is-medium is-light" contenteditable="true" style="width: 50%; padding: 5px; border: 1px; margin-right: 10px;"></a>
      <a class="button is-danger is-small" style="position: relative; top: 10px;">
        <span class="icon" style="margin-right: 7px;">
          <i class="fas fa-times"></i>
        </span>
        Delete
      </a>  
    </div>
    <br>
    
    <div class="field is-horizontal">
      <a class="button is-medium is-light" contenteditable="true" style="width: 50%; padding: 5px; border: 1px; margin-right: 10px;"></a>
      <a class="button is-danger is-small" style="position: relative; top: 10px;">
        <span class="icon" style="margin-right: 7px;">
          <i class="fas fa-times"></i>
        </span>
        Delete
      </a>  
    </div>
    <br>

    <div class="field is-grouped">
      <a class="button is-success" style="margin: 7px">
        <i class="fas fa-check" style="margin-right: 7px;"></i>
        Save
      </a>
      <a class="button is-warning" style="margin: 7px">
        <i class="fas fa-undo" style="margin-right: 7px;"></i>
          Reset
      </a>
    </div>
  `;
}

async function toggleModule(id) {
  sessionStorage.setItem('/module/edit?moduleId', id);
  unselectLess();
  unselectQuest();
  unselectMod();
  clearPane();
  selectMod(id);
  document.getElementById('module-edit-lesson-list').innerHTML = '';
  document.getElementById('module-edit-question-list').innerHTML = '';
  for (const l of await get('Lesson', {moduleId: id})) appendLesson(l);
  for (const q of await get('Question', {moduleId: id})) appendQuestion(q);
  return await showModEditPane((await get('Module', {id}))[0]);
}
async function toggleLesson(id) {
  if (id === getSelLessId()) return;
  sessionStorage.setItem('/module/edit?lessonId', id.toString());
  unselectLess();
  unselectQuest();
  clearPane();
  selectLess(id);
  return showLessEditPane((await get('Lesson', {id}))[0]);
}
async function toggleQuestion(id) {
  if (id === getSelQuestId()) return;
  sessionStorage.setItem(`/module/edit?questionId`, id);
  unselectQuest();
  unselectLess();
  selectQuest(id);
  clearPane();
  return showQuestEditPane(await get('Question', {id})[0]);
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{id: String, name: String, updatedAt: Date, createdAt: Date, authorId: Number}} m
 */
function appendModule(m = {id: null , name: null, createdAt: Date.now(), updatedAt: Date.now()}) {
  document.getElementById('module-edit-module-list').innerHTML += `
    <li data-id="${m.id}"
        data-updated-at="${m.updatedAt}"
        data-created-at="${m.createdAt}">
      <a onclick="toggleModule(${m.id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${m.name ? m.name : 'unnamed #' + m.id.toString()}</span>
        <button class="button is-danger is-small" style="width: 20px; height: 23px;" onclick="if (confirm('Delete module?')) destroy('Module', ${m.id}).then(() => this.parentElement.parentElement.remove());">
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
function appendLesson(lesson = {id: null, name: null, moduleId: null, createdAt: Date.now(), updatedAt: Date.now()}) {
  // append to the second (lesson) menu
  document.getElementById('module-edit-lesson-list').innerHTML += `
    <li data-id="${lesson.id}"
        data-created-on="${lesson.createdAt}"
        data-updated-at="${lesson.updatedAt}"
        data-module-id="${lesson.moduleId}">
      <a onclick="toggleLesson(${lesson.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${lesson.name ? lesson.name : 'unnamed #' + lesson.id}</span>
        <div style="display: flex; flex-direction: row; justify-content: space-between;">
          <button class="button is-small is-danger" onclick="if (confirm('Delete lesson?')) destroy('Lesson', ${lesson.id}).then(() => this.parentElement.parentElement.parentElement.remove());" style="width: 20px; height: 23px;">
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
function appendQuestion(question = {moduleId: null, correctAnswer: null, badAnswer1: null, badAnswer2: null, badAnswer3: null, badAnswer4: null, createdAt: Date.now(), updatedAt: Date.now()}) {
  document.querySelector(`#module-edit-question-list`).innerHTML += `
    <li data-id="${question.id}"
        data-created-on="${question.createdAt}"
        data-updated-at="${question.updatedAt}"
        data-module-id="${question.moduleId}">
      <a class="has-text-dark" onclick="toggleQuestion(${question.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${question.name ? question.name : 'unnamed #' + question.id}</span>
        <div style="display: flex; flex-direction: row; justify-content: space-between;">
          <button class="button is-small is-danger" onclick="if (confirm('Delete question?')) destroy('Question', ${question.id}).then(() => this.parentElement.parentElement.parentElement.remove());" style="width: 20px; height: 23px;">
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
 * @param {?Date} createdAt
 * @param {?Date} updatedAt
 */
function appendAttachment(
  moduleId, lessonId, id, name = 'attachment', createdAt = null,
  updatedAt = null) {
  document.querySelector(
    `form[data-id='${lessonId}'] ul.lesson-edit-uploaded-files`).innerHTML += `
    <li class="has-text-black"
        data-id="${id}"
        data-name="${name}"
        data-updated-at="${updatedAt}"
        data-created-on="${createdAt}"
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
 * @param {Number} moduleId
 * @return {Promise<*>}
 */
async function saveModule(moduleId) {
  try {
    const response = await fetch(`/api/module/${moduleId}`, {
      method: 'post',
      headers: {Accept: 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
      body: JSON.stringify(modObj),
    });
    return await response.json().then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Uploads the lesson content HTML file AND lesson attachments AND sets lesson: name, summary.
 *
 * @param {Number} lessonId
 * @return {Promise<*>}
 */
async function saveLesson(lessonId) {
  const vars = {};
  const form = document.querySelector(`form[data-id=${lessonId}]`);
  const lessNameEl = form.querySelector('input[name=name]');
  const lessSummaryEl = form.querySelector('textarea[name=summary]');
  if (lessNameEl.value.trim() !== '') vars.name = lessNameEl.value.trim();
  if (lessSummaryEl.value.trim() !== '') vars.summary = lessSummaryEl.value.trim();
  try {
    // save name and summary
    await fetch(`/api/lesson/${lessonId}`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
      body: JSON.stringify(vars),
    });
    // save attachments
    const attachementFormData = new FormData();
    const attachments = form.querySelector('input[type=file][multiple]').files;
    for (let i = 0; i < attachments.length; i++) {
      attachementFormData.append(`attachment-${i + 1}`, attachments[i]);
    }
    const newFile = create('file', attachementFormData);
    const contentFormData = new FormData();
    contentFormData.append('lesson', form.querySelector('input[type=file]:not([multiple])').files[0]);
    await fetch('/api/lesson', {
      method: 'post',
      body: contentFormData,
      credentials: 'include',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
    });
    return alert('lesson updated');
    // save content
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

function saveQuest() {}
