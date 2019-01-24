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
      ${module.name ? module.name : ''}
      </h2>
      <h3 class="subtitle" style="margin: 25px 0 0 0;">
      ${module.topic ?
        module.topic :
        ''}
      </h3>
      <section class="content" style="margin-top: 20px;">
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
        <h3 class="subtitle" style="margin-bottom: 10px;">Summary</h3>
        <div id="module-edit-summary"
                  style="min-width: 100%; min-height: 90px; word-wrap: break-word;">${module.summary ?
      module.summary :
      ''}</div>
      </section>
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
 */
async function showLessEditPane(lesson) {

  const cfg = {
    redirect: 'follow',
    cache: 'no-cache',
    credentials: 'include',
  };
  const lessonRes = await fetch(`/api/lesson/search?id=${lesson.id}`,cfg);
  const json = await lessonRes.json();

  document.getElementById('module-edit-pane').innerHTML = json.result[0].content;
}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function showQuestEditPane(question) {
  document.getElementById('module-edit-pane').innerHTML = `
    <h2 class="title is-3" style="margin-bottom: 30px;">${question.name ? question.name : ''}</h2>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-1" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">
        ${question.badAnswer1 ? question.badAnswer1 : ''}
      </a>
    </div>

    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-2" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">
        ${question.badAnswer2 ? question.badAnswer2 : ''}
      </a>
    </div>
    
    <div class="field is-horizontal">
      <a id="module-edit-question-bad-answer-3" class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">
        ${question.badAnswer3 ? question.badAnswer3 : ''}
      </a>
    </div>
    <br>

    <button type="submit" onclick="alert('not implemented yet')"  class="button is-success is-block" style="margin: 7px auto;">
      <i class="fas fa-check" style="position: relative; top: 4px;"></i>
      <span>Check</span>
    </button>
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
      credentials: 'include',
    };
    const studentId = JSON.parse(sessionStorage.getItem("loggedIn")).id;
    const enrollmentRes = await fetch(`/api/enrollment/search?studentId=${studentId}`,cfg);
    if (enrollmentRes.status >= 400){
      const errMsg = "Could not load modules";
      console.error(errMsg);
      return alert(errMsg);
    }
    const enrollments = (await enrollmentRes.json()).result;
    for (const e of enrollments) {
      const m = (await (await fetch(`/api/module/search?id=${e.moduleId}`)).json()).result[0];
      appendModule(m);
    }
  } catch(e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg)
  }
})();
