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
      
      <div id="module-edit-name" 
           contenteditable="true" 
           style="border-radius: 18px; border: none; padding-top: 5px; padding-bottom: 5px; padding-left: 10px; font-size: 1.2rem;" class="has-background-light">
        ${module.name ? module.name : ''}
      </div>
      <h3 class="subtitle" style="margin: 25px 0 0 0;">
        Topic
      </h3>
      <div class="dropdown" 
           onmouseover="this.classList.add('is-active')"
           onmouseout="this.classList.remove('is-active')">
        <div class="dropdown-trigger">
          <button class="button has-background-light" aria-haspopup="true" aria-controls="dropdown-menu" style="border: none;">
            <span id="module-edit-topic" style="min-width: 150px;">${module.topic ?
      module.topic :
      ''}</span>
            <span class="icon is-small">
              <i class="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu" style="margin-bottom: 30px;">
          <div class="dropdown-content">
            ${topics.map(
      t => "<a class='dropdown-item' onclick='document.getElementById(\"module-edit-topic\").innerText = this.innerText.trim()'>" +
        t + "</a>")}
            <hr class="dropdown-divider">
            <span class="dropdown-item" style="font-weight: bold;">
              Other
            </span>
            <a class="dropdown-item" 
               onmouseout="document.getElementById('module-edit-topic').innerText = this.innerText.trim()" 
               id="module-edit-topic-other" 
               contenteditable="true"
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
                  style="word-wrap: break-word;">${module.summary ? module.summary : ''}</textarea>
      </section>
      <div class="columns is-center is-multiline is-narrow" style="max-width: 400px; margin-left: auto; margin-right: auto;">
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button type="reset" onclick="alert('Not Implemented Yet.')" class="button is-warning is-block" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-undo" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Reset</span>
          </button>
        </div>
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button type="submit" onclick="updateMod()" class="button is-success is-block" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Save</span>
          </button>
        </div>
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button onclick="if (confirm('Delete module?')) destroyMod(${module.id})" class="button is-danger is-block" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Delete</span>
          </button>
        </div>
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
async function showLessEditPane(lesson, attachments = []) {
  document.getElementById('module-edit-pane').innerHTML = `
    <form enctype="multipart/form-data"
          id="module-edit-form-lesson"
          disabled="true"
          class="lesson-edit-form column is-10-desktop is-full-tablet is-full-mobile"
          style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: -15px;">
      <h2 class="title is-3">Name</h2>
      <input name="name" value="${lesson.name ? lesson.name : ''}" 
             class="has-background-light"
             autocomplete="on" placeholder="e.g. Introduction to AI"
             style="padding: 5px 10px; border: none; border-radius: 18px; font-size: 1.2rem;">
      <h2 class="title is-3" style="margin-top: 20px;">Summary</h2>
      <textarea name="summary" autocomplete="on"
                class="has-background-light"
                style="padding: 5px; min-height: 50px; max-height: 400px; border: none; border-radius: 18px;">${lesson.summary ? lesson.summary : ''}</textarea>
      <h2 class="title is-3" style="margin-top: 20px;">Content</h2>
      <p style="margin-bottom: 10px;">Upload HTML file with the lesson content</p>
      <div id="module-edit-lesson-content"></div>
      <input type="file" name="lesson" class="is-paddingless" style="margin-top: 20px;">
      <h2 class="title is-3" style="margin-top: 20px;">Attachments (optional)</h2>
      <p><strong>Select a file:</strong></p>
      <br>
      <ul style="list-style-type: disc; display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-left: 19px;">
        <li>Image (.jpg, .jpeg, .png, .gif)</li>
        <li>Audio (.mp3)</li>
        <li>Video (.mp4, .mpg)</li>
      </ul>
      <br>
      <input type="file" name="attachments" class="is-paddingless" multiple style="display: block">
      <div style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: 20px; width: 100%;">
        <h3 id="lesson-edit-h-uploaded-files title is-5" style="margin-bottom: 8px;">
          Uploaded Files
        </h3>
        <ul id="module-edit-list-attachments" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; width: 100%;"></ul>
      </div>
      <div class="columns is-center is-multiline is-narrow" style="max-width: 400px; margin-left: auto; margin-right: auto;">
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button onclick="alert('Not Implemented Yet.')" type="reset" class="button is-block is-warning" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-undo" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Reset</span>
          </button>
        </div>
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button onclick="event.preventDefault(); updateLess()" class="button is-block is-success" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Save</span>
          </button>
        </div>
        <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
          <button onclick="event.preventDefault(); if (confirm('Delete lesson?')) destroyLess(${lesson.id})" class="button is-block is-danger" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </form>
    `;

  // document.querySelector("form[enctype='multipart/form-data']").onsubmit = function(e) {
  //   return e.preventDefault();
  // };

  if (lesson.content) setLessContent();
  else unsetLessContent();

  return await Promise.all(attachments.map(f => appendAttachment({id: f.id, lessonId: lesson.id, name: f.name})));
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
    <a id="module-edit-question-name" class="button is-light has-background-light is-block has-text-left" contenteditable="true" style="padding: 3px 15px">
      ${question.name ? question.name : ''}
    </a>
    <br>

    <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
    <a id="module-edit-question-answer" class="button is-light is-block has-text-left" contenteditable="true" style="padding: 3px 15px;">
      ${question.correctAnswer ? question.correctAnswer : ''}
    </a>
    
    <h3 class="title is-3" style="margin: 30px 0 10px 0;">Other Answers</h3>

    <p><strong>Note:</strong> Include other answers which are wrong</p>

    <br>

    <a id="module-edit-question-bad-answer-1" class="button is-light has-text-left" contenteditable="true" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;">
      ${question.badAnswer1 ? question.badAnswer1 : ''}
    </a>

    <a id="module-edit-question-bad-answer-2" class="button is-light has-text-left" contenteditable="true" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;">
      ${question.badAnswer2 ? question.badAnswer2 : ''}
    </a>
    
    <a id="module-edit-question-bad-answer-3" class="button is-light has-text-left" contenteditable="true" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;">
      ${question.badAnswer3 ? question.badAnswer3 : ''}
    </a>
    
    <div class="columns is-center is-multiline is-narrow" style="max-width: 400px; margin-left: auto; margin-right: auto;">
      <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
        <button type="reset" onclick="alert('Not Implemented Yet.')" class="button is-block is-warning" style="margin: 7px auto; width: 100%;">
          <i class="fas fa-undo" style="position: relative; top: 4px; left: 2px;"></i>
          <span>Reset</span>
        </button>
      </div>
      <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
        <button type="submit" onclick="updateQuest()" class="button is-block is-success" style="margin: 7px auto; width: 100%;">
          <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
          <span>Save</span>
        </button>
      </div>
      <div class="is-block column is-4-fullhd is-4-desktop is-4-tablet is-12-mobile">
        <button onclick="if (confirm('Delete question?')) destroyQuest(${question.id})" class="button is-block is-danger" style="margin: 7px auto; width: 100%;">
          <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
          <span>Delete</span>
        </button>
      </div>
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
async function toggleModule(id) {
  saveClick('Module', id);
  saveProgress();
  const focusedMod = getSelId('Module');

  if (focusedMod === id && !getSelId('Lesson') && !getSelId('Question')) {
    // re-select *the same* module - do nothing
    return;
  } // else

  document.querySelectorAll(`#module-edit-list-module > li[data-id]`).forEach(li => li.setAttribute('disabled', 'true'));

  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 20px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  unSelect('Lesson');
  unSelect('Question');


  if (focusedMod !== id) {
    // selected *different* module
    unSelect('Module');
    select('Module', id);
    clearList('Lesson');
    clearList('Question');
    document.getElementById('module-edit-spinner-list-lesson').classList.remove('is-hidden');
    document.getElementById('module-edit-spinner-list-question').classList.remove('is-hidden');
    const lessP = get('Lesson', {moduleId: id})
      .then(ls => Promise.all(ls.map(l => appendLesson(l))));
    const QuestP = get('Question', {moduleId: id})
      .then(qs => Promise.all(qs.map(q => appendQuestion(q))));
    await lessP;
    await QuestP;
    document.getElementById('module-edit-spinner-list-lesson').classList.add('is-hidden');
    document.getElementById('module-edit-spinner-list-question').classList.add('is-hidden');
  }

  document.querySelectorAll(`#module-edit-list-module > li`).forEach(li => li.removeAttribute('disabled'));
  return showModEditPane(await get('Module', {id}).then(ms => ms[0]));
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
  document.querySelectorAll('#module-edit-list-lesson > li[data-id]').forEach(li => li.setAttribute('disabled', 'true'));
  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 20px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  saveClick('Lesson', id);
  saveProgress();
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  const lesson = (await get('Lesson', {id, moduleId: getSelId('Module')}))[0];
  document.querySelectorAll('#module-edit-list-lesson > li[data-id]').forEach(li => li.removeAttribute('disabled'));
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
  document.querySelectorAll('#module-edit-list-question > li[data-id]').forEach(li => li.setAttribute('disabled', 'true'));
  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 20px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  saveClick('Question', id);
  saveProgress();
  unSelect('Question');
  unSelect('Lesson');
  select('Question', id);
  document.querySelectorAll('#module-edit-list-question > li[data-id]').forEach(li => li.removeAttribute('disabled'));
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
function appendLesson(lesson) {
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
 * @param {{id: !Number, moduleId: !Number, name: ?String, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuestion(question) {
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
    <li class="has-text-black has-background-light"
        data-name="${file.name}"
        data-id="${file.id}"
        style="padding: 10px; margin-bottom: 10px; width: 100%;">
      <p style="margin-bottom: auto; margin-top: auto; float: left; position: relative; top: 4px;">${file.name}</p>
      <div style="margin-bottom: auto; margin-top: auto; float: right;">
        <a href="/file/${file.id}" class="button is-link is-small has-text-white" download="${file.name}" style="">
          Download
          <!--<i class="fas fa-download is-block"></i>-->
        </a>
        <a onclick="destroyAttach(${file.id}, ${file.lessonId})" class="button is-small is-danger" style="">
          Delete
          <!--<i class="fas fa-times is-block"></i>-->
        </a>
      </div>
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
       class="button is-link is-small has-text-centered has-text-white"
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

/**
 * Modifies a module and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateMod() {
  const pane = document.getElementById('module-edit-pane');
  const maybeName = pane.querySelector('#module-edit-name').innerText;
  const maybeTopic = pane.querySelector('#module-edit-topic').innerText;
  const maybeSummary = pane.querySelector('#module-edit-summary').value;
  const moduleId = getSelId('Module');
  try {
    await update('Module', moduleId, JSON.stringify({
      summary: maybeSummary ? maybeSummary : null,
      name: maybeName ? maybeName : null,
      topic: maybeTopic ? maybeTopic : null,
    }));
    sessionStorage.removeItem(`${location.pathname}/modules?authorId=${JSON.parse(sessionStorage.getItem('loggedIn')).id}`);
    sessionStorage.removeItem(`${location.pathname}/modules?id=${moduleId}`);
    // await toggleModule(getSelId('Module'));
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
  document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a > span`).innerText = maybeName ? maybeName : `unnamed ${moduleId}`;
  return alert('Updated module.');
}

/**
 * Modifies a lesson and updates UI.
 *
 * TODO ensure file names are unique.
 *
 * @return {Promise<void>}
 */
async function updateLess() {
  try {
    const form = document.querySelector('#module-edit-pane form');
    const id = getSelId('Lesson');
    const formData = new FormData();
    const lessonInput  = form.querySelector('input[type=file]:not([multiple])');
    const hasLessCont = lessonInput.files.length > 0;
    if (hasLessCont)  {
      if (!lessonInput.files[0].name.match(/\.x?html?$/i)) {
        return alert('Lesson must be an HTML file.');
      } else formData.append('lesson', lessonInput.files[0], 'lesson.html');
    }
    const attachments = form.querySelector('input[type=file][multiple]').files;
    for (const f of attachments) {
      if (!f.name.match(/\.((pn|jp)g|gif|mp[34g])$/i)) {
        return alert(`Invalid attachment file type ${f.name}.`);
      } else formData.append(f.name, f);
    }
    let maybeName = form.querySelector('input[name=name]').value.trim();
    formData.append('name', maybeName);
    formData.append('summary', form.querySelector('textarea[name=summary]')
      .value
      .trim());
    // DO NOT SET CONTENT-TYPE
    console.debug([...formData.entries()]);
    await update('Lesson', id, formData, null);
    if (hasLessCont) setLessContent(id);
    await Promise.all(Array.from(attachments).map(f => appendAttachment({id: f.id, name: f.name, lessonId: id})));
    const moduleId = getSelId('Module');
    sessionStorage.removeItem(`${location.pathname}/lessons?id=${id}&moduleId=${moduleId}`);
    sessionStorage.removeItem(`${location.pathname}/lessons?id=${id}`);
    sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${moduleId}`);
    sessionStorage.removeItem(`${location.pathname}/files?lessonId=${id}`);
    maybeName = form.querySelector('input[name=name]').value.trim();
    // a way to clear files
    form.querySelector('input[type=file][multiple]').outerHTML = `
      <input type="file" name="attachments" class="is-paddingless" multiple style="display: block">
    `;
    document.querySelector(`#module-edit-list-lesson li[data-id='${id}'] > a > span`).innerText = maybeName ? maybeName : `unnamed ${id}`;
    return alert('Updated lesson.');
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
}

/**
 * TODO Modifies a question and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateQuest() {
  const id = getSelId('Question');
  const moduleId = getSelId('Module');
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${moduleId}`);
  sessionStorage.removeItem(`${location.pathname}/questions?id=${id}&moduleId=${moduleId}`);
  const pane = document.getElementById('module-edit-pane');
  const maybeName = pane.querySelector('#module-edit-question-name').innerText;
  const maybeA = pane.querySelector('#module-edit-question-answer').innerText;
  const maybeBadA1 = pane.querySelector('#module-edit-question-bad-answer-1').innerText;
  const maybeBadA2 = pane.querySelector('#module-edit-question-bad-answer-2').innerText;
  const maybeBadA3 = pane.querySelector('#module-edit-question-bad-answer-3').innerText;
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
  return alert('Updated question.');
}

/**
 * Destroys a module.
 *
 * @param {!Number} id
 * @return {void}
 */
function destroyMod(id) {
  destroy('Module', id);
  sessionStorage.removeItem(`${location.pathname}/modules?authorId=${JSON.parse(sessionStorage.getItem('loggedIn')).id}`);
  if (getSelId('Module') === id) {
    clearPane();
    clearList('Lesson');
    clearList('Question');
  }
  return document.querySelector(`#module-edit-list-module li[data-id='${id}']`).remove();
}

/**
 * Destroys a lesson.
 *
 * @param {!Number} id
 * @return {void}
 */
function destroyLess(id) {
  destroy('Lesson', id);
  sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${getSelId('Module')}`);
  if (getSelId('Lesson') === id) clearPane();
  return document.querySelector(`#module-edit-list-lesson li[data-id='${id}']`).remove();
}

/**
 * Destroys a question.
 *
 * @param {!Number} id
 * @return {void}
 */
function destroyQuest(id) {
  destroy('Question', id);
  sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${getSelId('Module')}`);
  if (getSelId('Question') === id) clearPane();
  return document.querySelector(`#module-edit-list-question li[data-id='${id}']`).remove();
}

/**
 * Destroys an attachment (file).
 *
 * @param {{id: !Number, lessonId: !Number}} file
 * @return {Promise<void|!String>}
 */
function destroyAttach(id, lessonId) {
  sessionStorage.removeItem(`${location.pathname}/files?lessonId=${lessonId}`);
  document.querySelector(`#module-edit-list-attachments li[data-id='${id}']`).remove();
  // clear cache
  return destroy('File', id);
}

/**
 * Creates a module.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-module-create').onclick = async function createMod(e) {
  e.preventDefault();
  const authorId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  try {
    const module = create('Module', JSON.stringify({authorId} ));
    sessionStorage.removeItem(`${location.pathname}/modules?authorId=${authorId}`);
    return appendModule(await module);
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  }
};

/**
 * Creates a lesson.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-lesson-create').onclick = async function createLess(e) {
  e.preventDefault();
  const moduleId = getSelId('Module');
  if (!moduleId) return alert('Module must be selected.');
  try {
    const lesson = create('Lesson', JSON.stringify({moduleId} ));
    sessionStorage.removeItem(`${location.pathname}/lessons?moduleId=${moduleId}`);
    return appendLesson(await lesson);
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  }
};

/**
 * Creates a question.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-question-create').onclick = async function createQuest(e) {
  e.preventDefault();
  const moduleId = getSelId('Module');
  if (!moduleId) return alert('Module must be selected.');
  try {
    const question = create('Question', JSON.stringify({moduleId} ));
    sessionStorage.removeItem(`${location.pathname}/questions?moduleId=${moduleId}`);
    return appendQuestion(await question);
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  }
};

/**
 * Populate the page using AJAX.
 *
 * Try to recall last click.
 */
(async function() {
  try {

    document.getElementById('module-edit-spinner-list-module').classList.remove('is-hidden');

    const loggedIn = sessionStorage.getItem('loggedIn');

    if (!loggedIn) return logOut();

    await get('Module', {authorId: JSON.parse(loggedIn).id}).then(ms => Promise.all(ms.map(m => appendModule(m))));
    document.getElementById('module-edit-spinner-list-module').classList.add('is-hidden');

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
  // document.querySelectorAll("li[data-id]:not([class*='has-background-light'])").forEach(el => {
  //   el.onmouseover = () => el.classList.add('has-background-light');
  //   el.onmouseout = () => el.classList.remove('has-background-light');
  // });
})();
