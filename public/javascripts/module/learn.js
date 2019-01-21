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
 * @param {!{id: !Number, name: ?String, authorId: !Number, topic: ?String, summary: ?String}} module
 * @param {!Array<!String>} topics
 * @return {Promise<void>}
 */
async function showModEditPane(module, topics = [ 'AI', 'Anthropology', 'Archeology', 'Architecture', 'Arts', 'Biology', 'Chemistry', 'Computer Science', 'Design', 'Drama', 'Economics', 'Engineering', 'Geography', 'History', 'Humanities', 'Languages', 'Law', 'Linguistics', 'Literature', 'Mathematics', 'Medicine', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sciences', 'Social Sciences', 'Sociology', 'Theology']) {
  try {
    document.getElementById('module-edit-pane').innerHTML = `
      <h2 class="title" style="margin-bottom: 10px;">
        Name
      </h2>
      
      <div id="module-edit-name" style="max-width: 300px;">
        ${module.name ? module.name : ''}
      </div>
      <h3 class="subtitle" style="margin: 25px 0 0 0;">
        Topic
      </h3>
      <span id="module-edit-topic" style="min-width: 150px;">${module.topic ?
        module.topic :
        ''}</span>
      
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
        <div id="module-edit-summary"
                  style="min-width: 100%; min-height: 90px; word-wrap: break-word; padding: 10px; border: 1px #c9c3c3 dashed;">${module.summary ?
      module.summary :
      ''}</div>
      </section>
      <div class="field is-grouped">
        <button type="reset" onclick="alert('Implement eroll to module')" class="button is-info" style="margin: 7px">
          <i class="fas fa-user-plus"></i>
          <span>Enrol</span>
        </button>
      </div>
    `;
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
}

/**
 * Shows the lesson edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, content: ?Boolean, summary: ?String}} lesson
 * @param {Array<{id: ?Number, name: !String}>} attachments
 */
function showLessEditPane(lesson, attachments = []) {
  document.getElementById('module-edit-pane').innerHTML = `
    <form enctype="multipart/form-data"
          id="module-edit-form-lesson"
          disabled="true"
          class="lesson-edit-form column is-10-desktop is-full-tablet is-full-mobile"
          style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: -15px;">
      <h2 class="title is-3">Name</h2>
      <input name="name" value="${lesson.name ? lesson.name : ''}" 
             autocomplete="on" placeholder="e.g. Introduction to AI"
             style="background: #d3d3d329; padding: 5px; border: 1px #c9c3c3 dashed; min-width: 60%;">
      <h2 class="title is-3" style="margin-top: 20px;">Summary</h2>
      <textarea name="summary" autocomplete="on"
                style="padding: 5px; min-width: 650px; min-height: 50px; max-height: 400px; border: 1px #c9c3c3 dashed;">${lesson.summary ? lesson.summary : ''}</textarea>
      <h2 class="title is-3" style="margin-top: 20px;">Content</h2>
      <p style="margin-bottom: 10px;">Upload HTML file with the lesson content</p>
      <div id="module-edit-lesson-content"></div>
      <input type="file" name="lesson" style="display: block; max-width: 200px; margin-top: 20px;">
      <h2 class="title is-3" style="margin-top: 20px;">Attachments (optional)</h2>
      <p><strong>Select a file:</strong></p>
      <br>
      <ul style="list-style-type: disc; display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-left: 19px;">
        <li>Image (.jpg, .jpeg, .png, .gif)</li>
        <li>Audio (.mp3)</li>
        <li>Video (.mp4, .mpg)</li>
      </ul>
      <br>
      <input type="file" name="attachments" multiple style="display: block">
      <div style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: 20px;">
        <h3 id="lesson-edit-h-uploaded-files title is-5" style="margin-bottom: 8px;">
          Uploaded Files
        </h3>
        <ul id="module-edit-list-attachments" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; min-width: 300px;"></ul>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 20px; min-width: 380px; max-width: 500px;">
        <button onclick="alert('Not Implemented Yet.')" type="reset" class="button is-warning" style="min-width: 100px;">
          <i class="fas fa-undo"></i>
          <span>Reset</span>
        </button>
        <button onclick="event.preventDefault(); updateLess()" class="button is-success" style="min-width: 100px;">
          <i class="fas fa-check"></i>
          <span>Save</span>
        </button>
        <button onclick="event.preventDefault(); if (confirm('Delete lesson?')) destroyLess(${lesson.id})" class="button is-danger" style="min-width: 100px;">
          <i class="fas fa-times"></i>
          <span>Delete</span>
        </button>
      </div>
    </form>
    `;

  // document.querySelector("form[enctype='multipart/form-data']").onsubmit = function(e) {
  //   return e.preventDefault();
  // };

  if (lesson.content) setLessContent();
  else unsetLessContent();

  for (const f of attachments) {
    appendAttachment({id: f.id, lessonId: lesson.id, name: f.name});
  }
}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function showQuestEditPane(question) {
  document.getElementById('module-edit-pane').innerHTML = `
    <h1 class="title is-3" style="margin-bottom: 10px;">Question</h1>
    <p><strong>Note:</strong> Save the current question before editing another one</p>
    <br>
    <div class="field">
      <a id="module-edit-question-name" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.name ?
    question.name :
    ''}</a>
    </div>
    <br>

    <div class="field">
      <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
      <a id="module-edit-question-answer" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin: auto;">${question.correctAnswer ?
    question.correctAnswer :
    ''}</a>
    </div>
    <br>
    
    <h3 class="title is-3" style="margin-bottom: 10px;">Other Answers</h3>

    <p><strong>Note:</strong> Include other answers which are wrong</p>

    <br>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-1" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer1 ?
    question.badAnswer1 :
    ''}</a>
    </div>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-2" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer2 ?
    question.badAnswer2 :
    ''}</a>
    </div>
    
    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-3" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">${question.badAnswer3 ?
    question.badAnswer3 :
    ''}</a>
    </div>
    <br>

    <div class="field is-grouped">
      <button type="submit" onclick="updateQuest()" class="button is-success" style="margin: 7px">
        <i class="fas fa-check"></i>
        <span>Save</span>
      </button>
      <button type="reset" onclick="alert('Not Implemented Yet.')" class="button is-warning" style="margin: 7px">
        <i class="fas fa-undo"></i>
        <span>Reset</span>
      </button>
      <button onclick="if (confirm('Delete question?')) destroyQuest(${question.id}) " class="button is-danger" style="margin: 7px">
        <i class="fas fa-check"></i>
        <span>Delete</span>
      </button>
    </div>
  `;
}

/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleModule(id) {
  saveClick('Module', id);
  const focusedMod = getSelId('Module');

  if (focusedMod === id && !getSelId('Lesson') && !getSelId('Question')) {
    // re-select *the same* module - do nothing
    return;
  } // else
  unSelect('Lesson');
  unSelect('Question');


  if (focusedMod !== id) {
    // selected *different* module
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
  return showModEditPane(await get('Module', {id}).then(ms => ms[0]));
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
    // TODO saveProgress for lesson
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
async function toggleLesson(id) {
  const focusedLessId = getSelId('Lesson');
  if (id === focusedLessId) return;
  saveClick('Lesson', id);
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  const lesson = (await get('Lesson', {id, moduleId: getSelId('Module')}))[0];
  return await showLessEditPane(lesson, await get('File', {lessonId: lesson.id}));
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
      </a>
    </li>
    `;
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String}} lesson
 */
function appendLesson(lesson) {
  // append to the second (lesson) menu
  document.getElementById('module-edit-list-lesson').innerHTML += `
    <li data-id="${lesson.id}"
        data-module-id="${lesson.moduleId}">
      <a onclick="toggleLesson(${lesson.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${lesson.name ? lesson.name : 'unnamed #' + lesson.id}</span>
      </a>
    </li>
    `;
}

/**
 * Appends a question to the quiz for the selected module.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuestion(question) {
  document.querySelector(`#module-edit-list-question`).innerHTML += `
    <li data-id="${question.id}"
        data-module-id="${question.moduleId}">
      <a class="has-text-dark" onclick="toggleQuestion(${question.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <span>${question.name ? question.name : 'unnamed #' + question.id}</span>
      </a>
    </li>
  `;
}

/**
 * Adds attachment to a list of attachments in a lesson.
 *
 * @param {!{id: ?Number, lessonId: !Number, name: !String}} file
 * @return {void}
 */
async function appendAttachment(file) {
  try {
    // after sending you don't have the ids (assigned by the DBMS)
    if (file.id === undefined) {
      file.id = await get('File', {lessonId: file.lessonId,  name: file.name}).then(fs => fs[0].id);
    }
    const list = document.getElementById('module-edit-list-attachments');
    list.innerHTML += `
    <li class="has-text-black"
        data-name="${file.name}"
        data-id="${file.id}"
        style="background: #e5e5e5d4; padding: 8px 12px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="margin-right: 10px;">${file.name}</div>
      <a href="/file/${file.id}" class="button is-link is-small" download="${file.name}" style="margin-right: 10px; float: left;"><i class="fas fa-download" style="margin-left: 10px;"></i></a>
      <a onclick="destroyAttach(${file.id}, ${file.lessonId})" class="button is-small is-danger"><i class="fas fa-times" style="margin: 0; float: left;"></i></a>
    </li>
      `;
  } catch (e) {
    console.error(e);
    return alert(e.message || e.toString());
  }
}

function setLessContent() {
  const lessonId = getSelId('Lesson');
  document.querySelector(
    `form #module-edit-lesson-content`).innerHTML = `
    <p class="lesson-edit-msg-has-lesson">
      <br>
      <strong>NOTE</strong>
      <br>
      You have already uploaded lesson content!
      <br>
      Feel free to <strong>replace</strong> it by re-uploading another file.
    </p>
    <br>
    <a href="/api/lesson/${lessonId}/download"
       class="button is-link is-small has-text-centered"
       download="lesson.html">
      <i class="fas fa-download icon"></i>
      <span>Download</span>
    </a>
    <!--<button class="button is-danger is-small" onclick="destroyLess(${lessonId}).then(() => unsetLessContent())">
      <i class="fas fa-times icon"></i>
      <span>Delete</span>
    </button>
    -->
  `;
}

/**
 * Remove the HTML content file from a lesson.
 */
function unsetLessContent() {
  document.querySelector(`form #module-edit-lesson-content`).innerHTML = `
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

//Populate the page using AJAX
/**
 * Try to recall last click.
 */
(async function() {
  try {

    const cfg = {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {Accept: 'application/json'},
    };
    const userId = JSON.parse(sessionStorage.getItem("loggedIn")).id;
    fetch(`/api/enrollment/search?userId=${userId}`,cfg)
      .then(response => response.status >= 400
        // if it goes wrong force it to jump to reject
        ? response.json().then(errMsg => Promise.reject(errMsg))
        // the JSON object is guaranteed to have a "msg" property
        : response.json())
    .then(json => {
      for (const m of json) {
        appendModule(m);
      }
    });

    const memory = sessionStorage.getItem(`${location.pathname}?click`);
    if (!memory) return false;
    const {page, id} = JSON.parse(memory);

    /**
     * @return {Promise<Boolean>}
     */
    async function tryRecallMod() {
      if (page !== 'module') {
        return false;
      } else if (!document.querySelector(`#module-edit-list-module li[data-id='${JSON.parse(memory).id}'] > a`)) {
        return false;
      }
      await toggleModule(JSON.parse(memory).id);
      return true;
    }

    /**
     * @return {Promise<Boolean>}
     */
    async function tryRecallLess() {
      if (page !== 'lesson') return false;
      const ls = await get('Lesson', {id});
      if (ls.length === 0) return false;
      const {moduleId} = ls[0];
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

    /**
     * @return {Promise<Boolean>}
     */
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

    return (await tryRecallMod()) || ((await tryRecallLess()) || await tryRecallQuest());

  } catch(e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg)
  }
})();
