if (sessionStorage.getItem('loggedIn') === undefined) {
 logOut();
}

const PANE = document.getElementById('module-edit-pane');
const USER_ID = JSON.parse(sessionStorage.getItem('loggedIn')).id;
const LIST_MOD = document.getElementById('module-edit-list-module');
const LIST_LESS = document.getElementById('module-edit-list-lesson');
const LIST_QUEST = document.getElementById('module-edit-list-question');

/**
 * Shows a spinner for specified section.
 *
 * @param {'Module'|'Lesson'|'Question'|'Pane'} what
 */
function showSpinner(what) {
  const section = what.toLowerCase();
  if (section === 'pane') {
    PANE.innerHTML = `
      <p class="has-text-centered" style="margin: 10px auto;">
        <span style="margin-bottom: 15px;">Loading</span>
        <br>
        <i class="fas fa-spinner spinner"></i>
      </p>`;
  } else document.getElementById(`module-edit-spinner-list-${section}`).classList.remove('is-invisible');
}

/**
 * Hides a spinner for specified section.
 *
 * @param {'Module'|'Lesson'|'Question'} what
 */
function hideSpinner(what) {
  document.getElementById(`module-edit-spinner-list-${what.toLowerCase()}`).classList.add('is-invisible');
}

/**
 * Disables all buttons while a fetch response is awaited.
 */
function lockBtns() {
  for (const btn of document.querySelectorAll(['[onclick^=destroy]:not([disabled])', '[onclick^=update]:not([disabled])', '[onclick^=toggle]:not([disabled])'].join(', '))) {
    btn.setAttribute('disabled', 'true');
    btn.style.pointerEvents = 'none';
  }
}

/**
 * Enables all buttons after a fetch response is awaited.
 */
function unlockBtns() {
  for (const btn of document.querySelectorAll(['[onclick^=destroy][disabled]', '[onclick^=update][disabled]', '[onclick^=toggle][disabled]'].join(', '))) {
    btn.removeAttribute('disabled');
    btn.style.pointerEvents = 'initial';
  }
}

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
  return PANE.innerHTML = '';
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
async function showMod({id, name, topic, authorId, summary}, topics = [ 'AI', 'Anthropology', 'Archeology', 'Architecture', 'Arts', 'Biology', 'Chemistry', 'Computer Science', 'Design', 'Drama', 'Economics', 'Engineering', 'Geography', 'History', 'Humanities', 'Languages', 'Law', 'Linguistics', 'Literature', 'Mathematics', 'Medicine', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sciences', 'Social Sciences', 'Sociology', 'Theology']) {
  try {
    return PANE.innerHTML = `
      <form onsubmit="e.preventDefault();" disabled="true">
          
        <h2 class="title" style="margin-bottom: 10px;">
          Name
        </h2>
        <input id="module-edit-name" class="has-background-light"
               value="${name ? name : ''}"
               autocapitalize="words"
               autocomplete="on"
               spellcheck="true"
               style="border-radius: 18px; border: none; padding-top: 5px; padding-bottom: 5px; padding-left: 10px; font-size: 1.2rem; min-height: 30px;">
        <h3 class="subtitle" style="margin: 25px 0 0 0;">
          Topic
        </h3>
        <input type="search" value="${topic ? topic : ''}" placeholder="e.g. Biology" id="module-edit-topic" style="min-width: 150px; padding-top: 10px; padding-bottom: 10px;" oninput="document.getElementById('dropdown-menu').querySelectorAll('li').forEach(el => el.style.display = el.querySelector('a').innerText.trim().toLowerCase().indexOf(this.value.trim().toLowerCase()) >= 0 ? 'block' : 'none'); document.getElementById('dropdown-menu').classList.remove('is-hidden');" autocomplete="off" autocapitalize="words" spellcheck="true">
        <ol id="dropdown-menu" role="menu" onmouseleave="this.classList.add('is-hidden')" class="list has-background-white is-hidden" style="margin-bottom: 30px; margin-top: 15px; list-style-type: none; position: absolute; box-shadow: 0 2px 3px rgba(10,10,10,0.1), 0 0 0 1px rgba(10,10,10,0.1);">
          ${topics.map(t => "<li class='list-item' style='margin-bottom: 5px; margin-top: 5px; vertical-align: center;'><a style='width: 100%; margin-top: auto; margin-bottom: auto;' class='is-block' onclick='document.getElementById(\"module-edit-topic\").value = this.innerText.trim(); this.parentElement.parentElement.classList.add(\"is-hidden\")'>" + t + "</a></li>").join('\n')}
        </ol>
        <section class="content" style="margin-top: 40px;">
          <strong>Author</strong>   
          <a href="/user/${authorId}">
            ${await get('User', {id: authorId}).then(us => us[0].email)}
          </a>
          <br>
          <strong>Rating</strong> 
          <span id="module-edit-rating">${await get('Rating', {moduleId: id}).then(rs => rs.map(r => r.stars)).then(rs => { 
            const n = rs.length;
            return n > 0 ? rs.reduce((l, r) => l + r) / n : 0;
            })}/5
          </span>
        </section>
        <section class="is-medium" style="margin-bottom: 30px;">
          <h2 class="title is-medium" style="margin-bottom: 10px;">Summary</h2>
          <textarea id="module-edit-summary" autocomplete="on" spellcheck="true" autocapitalize="sentences" placeholder="The lesson covers ..."
                    style="word-wrap: break-word;">${summary ? summary : ''}</textarea>
        </section>
        <div class="columns is-center is-multiline is-narrow" 
             style="max-width: 400px; margin-left: auto; margin-right: auto;">
          <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
            <button type="submit" onsubmit="e.preventDefault()" onclick="event.preventDefault(); updateMod()" 
                    class="button is-success is-block" 
                    style="margin: 7px auto; max-width: 120px;">
              <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
              <span>Save</span>
            </button>
          </div>
          <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
            <button type="button" onsubmit="e.preventDefault()" onclick="if (confirm('Delete module?')) destroyMod(${id})" 
                    class="button is-danger is-block" style="margin: 7px auto; max-width: 120px;">
              <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </form>`;
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
async function showLess({id, name, summary, content}, attachments = []) {
  PANE.innerHTML = `
    <form enctype="multipart/form-data"
          onsubmit="e.preventDefault()"
          id="module-edit-form-lesson"
          disabled="true"
          class="lesson-edit-form column is-10-desktop is-full-tablet is-full-mobile"
          style="display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start; margin-top: -15px;">
      <h2 class="title is-3">Name</h2>
      <input name="name" value="${name ? name : ''}" 
             class="has-background-light"
             spellcheck="true"
             autocomplete="on" placeholder="e.g. Introduction to AI"
             style="padding: 5px 10px; border: none; border-radius: 18px; font-size: 1.2rem;">
      <h2 class="title is-3" style="margin-top: 20px;">Summary</h2>
      <textarea name="summary" autocomplete="on" spellcheck="true" autocapitalize="sentences" placeholder="The lessons covers ..." 
                class="has-background-light"
                style="padding: 5px; min-height: 50px; max-height: 400px; border: none; border-radius: 18px;">${summary ? summary : ''}</textarea>
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
      <div class="columns is-center is-multiline is-narrow" 
           style="max-width: 400px; margin-left: auto; margin-right: auto;">
        <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
          <button type="submit" onclick="event.preventDefault(); updateLess()"  onsubmit="e.preventDefault()"
                  class="button is-block is-success" 
                  style="margin: 7px auto; max-width: 120px;">
            <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Save</span>
          </button>
        </div>
        <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
          <button onsubmit="e.preventDefault()" onclick="event.preventDefault(); if (confirm('Delete lesson?')) destroyLess(${id})" 
                  class="button is-block is-danger" style="margin: 7px auto; max-width: 120px;">
            <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </form>
    `;

  if (content) setLessContent();
  else unsetLessContent();

  return await Promise.all(attachments.sort((a1, a2) => {
    if (!a1.name && a2.name) return -1;
    else if (a1.name && !a2.name) return 1;
    else if (!a1.name && !a2.name) return 0;
    else return a1.name.localeCompare(a2.name);
  }).map(f => appendAttachment({id: f.id, lessonId: id, name: f.name})));
}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function showQuest({id, name, correctAnswer, badAnswer1, badAnswer2, badAnswer3, badAnswer4, badAnswer5}) {
  return PANE.innerHTML = `
    <form onsubmit="e.preventDefault()" disabled="true">
      <h1 class="title is-3" style="margin-bottom: 10px;">Question</h1>
      
      <p><strong>Note:</strong> Save the current question before editing another one</p>
      <br>
      <input id="module-edit-question-name" class="button is-light has-background-light is-block has-text-left" style="padding: 3px 15px" value="${name ? name : ''}" autocomplete="true" required spellcheck="true">
      <br>

      <h2 class="title is-3" style="margin-bottom: 10px;">Correct Answer</h2>
      
      <input id="module-edit-question-answer" class="button is-light is-block has-text-left" style="padding: 3px 15px;" value="${correctAnswer ? correctAnswer : ''}" spellcheck="true" autocomplete="true" required>
      
      <h3 class="title is-3" style="margin: 30px 0 10px 0;">Other Answers</h3>

      <p><strong>Note:</strong> Include other answers which are wrong</p>
      <br>

      <input id="module-edit-question-bad-answer-1" class="button is-light has-text-left" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;" value="${badAnswer1 ? badAnswer1 : ''}" required spellcheck="true" autocomplete="true">
      <input id="module-edit-question-bad-answer-2" class="button is-light has-text-left" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;" value="${badAnswer2 ? badAnswer2 : ''}" spellcheck="true" autocomplete="true">
      <input id="module-edit-question-bad-answer-3" class="button is-light has-text-left" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;" value="${badAnswer3 ? badAnswer3 : ''}" spellcheck="true" autocomplete="true">
      <input id="module-edit-question-bad-answer-4" class="button is-light has-text-left" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;" value="${badAnswer4 ? badAnswer4 : ''}" spellcheck="true" autocomplete="true">
      <input id="module-edit-question-bad-answer-5" class="button is-light has-text-left" style="width: 100%; padding: 3px 15px; margin-bottom: 20px;" value="${badAnswer5 ? badAnswer5 : ''}" spellcheck="true" autocomplete="true">
      
      <div class="columns is-center is-multiline is-narrow" style="max-width: 400px; margin-left: auto; margin-right: auto;">
        <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
          <button type="submit" onsubmit="e.preventDefault()" onclick="event.preventDefault(); updateQuest()" class="button is-block is-success" 
                  style="margin: 7px auto; max-width: 120px;">
            <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Save</span>
          </button>
        </div>
        <div class="is-block column is-6-fullhd is-6-desktop is-6-tablet is-12-mobile">
          <button onsubmit="e.preventDefault()" onclick="event.preventDefault(); if (confirm('Delete question?')) destroyQuest(${id})" 
                  class="button is-block is-danger" style="margin: 7px auto; max-width: 120px;">
            <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </form>`;
}

/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleMod(id) {
  const focusedMod = getSelId('Module');

  if (focusedMod === id && !getSelId('Lesson') && !getSelId('Question')) {
    // module not selected
    // or
    // re-select *the same* module - do nothing
    return;
  }

  lockBtns();

  showSpinner('Pane');
  unSelect('Lesson');
  unSelect('Question');

  if (focusedMod !== id) {
    clearPane();
    // selected *different* module
    clearList('Lesson');
    clearList('Question');
    showSpinner('Lesson');
    showSpinner('Question');
    unSelect('Module');
    select('Module', id);
    try {
      const lessP = get('Lesson', {moduleId: id})
        .then(ls => Promise.all(ls.sort((l1, l2) => {
          if (!l1.name && l2.name) return -1;
          else if (l1.name && !l2.name) return 1;
          else if (!l1.name && !l2.name) return 0;
          else return l1.name.localeCompare(l2.name);
        }).map(l => appendLess(l))));
      const QuestP = get('Question', {moduleId: id})
        .then(qs => Promise.all(qs.sort((q1, q2) => {
          if (!q1.name && q2.name) return -1;
          else if (q1.name && !q2.name) return 1;
          else if (!q1.name && !q2.name) return 0;
          else return q1.name.localeCompare(q2.name);
        }).map(q => appendQuest(q))));
      await lessP;
      await QuestP;
      hideSpinner('Lesson');
      hideSpinner('Question');
    } catch (e) {
      alert(e.message);
      console.error(e);
    }
  }
  try {
    await showMod(await get('Module', {id}).then(ms => ms[0]));
  } catch (e) {
    alert(e.message);
    console.error(e);
  }
  return unlockBtns();
}

/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleLess(id) {
  if (!document.querySelector(`#module-edit-list-lesson > li[data-id='${id}']`)) return;
  const focusedLessId = getSelId('Lesson');
  if (id === focusedLessId) return;
  lockBtns();
  clearPane();
  showSpinner('Pane');
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  const files = await get('File', {lessonId: id});
  const lesson = (await get('Lesson', {id, moduleId: getSelId('Module')}))[0];
  await showLess(lesson, files);
  return unlockBtns();
}

/**
 * Toggle question. Run when a question is pressed. Shows the question-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleQuest(id) {
  if (!document.querySelector(`#module-edit-list-question > li[data-id='${id}']`)) return;
  if (id === getSelId('Question')) return;
  lockBtns();
  clearPane();
  showSpinner('Pane');
  unSelect('Question');
  unSelect('Lesson');
  select('Question', id);
  await showQuest((await get('Question', {id, moduleId: getSelId('Module')}))[0]);
  return unlockBtns();
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{id: !Number, authorId: !Number, name: ?String}} module
 */
function appendMod({id, name}) {
  const modEl = document.createElement('li');
  modEl.setAttribute('data-id', id);
  modEl.innerHTML = `
    <a onclick="toggleMod(${id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : 'unnamed #' + id.toString()}</span>
    </a>`;
  return LIST_MOD.appendChild(modEl);
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String}} lesson
 */
function appendLess({id, moduleId, name}) {
  // append to the second (lesson) menu
  const lessonEl = document.createElement('li');
  lessonEl.setAttribute('data-module-id', moduleId);
  lessonEl.setAttribute('data-id', id);
  lessonEl.innerHTML = `
    <a onclick="toggleLess(${id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : 'unnamed #' + id}</span>
    </a>`;
  return LIST_LESS.appendChild(lessonEl);
}

/**
 * Appends a question to the quiz for the selected module.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuest({id, name, moduleId}) {
  const questEl = document.createElement('li');
  questEl.setAttribute('data-id', id);
  questEl.setAttribute('data-module-id', moduleId);
  questEl.innerHTML = `
    <a class="has-text-dark" onclick="toggleQuest(${id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : 'unnamed #' + id}</span>
    </a>
  `;
  return document.querySelector(`#module-edit-list-question`).appendChild(questEl);
}

/**
 * Adds attachment to a list of attachments in a lesson.
 *
 * @param {!{id: ?Number, lessonId: !Number, name: !String}} file
 * @return {void}
 */
async function appendAttachment({id, name, lessonId}) {
  // after sending you don't have the ids (assigned by the DBMS)
  if (id === undefined) {
    id = await get('File', {lessonId,  name}).then(fs => fs[0].id);
  }
  return document.getElementById('module-edit-list-attachments').innerHTML += `
    <li class="has-text-black has-background-light"
        data-name="${name}"
        data-id="${id}"
        style="padding: 10px; margin-bottom: 10px; width: 100%;">
      <p style="margin-bottom: auto; margin-top: auto; float: left; position: relative; top: 4px;">${name}</p>
      <div style="margin-bottom: auto; margin-top: auto; float: right;">
        <a href="/file/${id}" class="button is-link is-small has-text-white" download="${name}" style="">
          Download
        </a>
        <a onclick="destroyAttach(${id}, ${lessonId})" class="button is-small is-danger" style="">
          Delete
        </a>
      </div>
    </li>`;
}

function setLessContent() {
  document.querySelector(`form #module-edit-lesson-content`).innerHTML = `
    <p class="lesson-edit-msg-has-lesson">
      <br>
      <strong>NOTE</strong>
      <br>
      You have already uploaded lesson content!
      <br>
      Feel free to <strong>replace</strong> it by re-uploading another file.
    </p>
    <br>
    <a href="/api/lesson/${getSelId('Lesson')}/download"
       class="button is-link is-small has-text-centered has-text-white"
       download="lesson.html">
      <i class="fas fa-download icon"></i>
      <span>Download</span>
    </a>`;
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
  showModal('Updating module');
  lockBtns();
  const maybeName = PANE.querySelector('#module-edit-name').value;
  const maybeTopic = PANE.querySelector('#module-edit-topic').value;
  const maybeSummary = PANE.querySelector('#module-edit-summary').value;
  const moduleId = getSelId('Module');
  try {
    await update('Module', moduleId, JSON.stringify({
      name: maybeName ? maybeName : null,
      summary: maybeSummary ? maybeSummary : null,
      topic: maybeTopic ? maybeTopic : null,
    }));
    unSelect('Module');
    clearList('Lesson');
    clearList('Question');
    await toggleMod(moduleId);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  } finally {
    hideModal();
  }
  document.querySelector(`#module-edit-list-module li[data-id='${moduleId}'] > a > span`).innerText = maybeName ? maybeName : `unnamed ${moduleId}`;
  return unlockBtns();
}

/**
 * Modifies a lesson and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateLess() {
  lockBtns();
  showModal('Updating lesson');
  const id = getSelId('Lesson');
  try {
    const form = PANE.querySelector('form');
    const formData = new FormData();
    const lessonInput  = form.querySelector('input[type=file]:not([multiple])');
    const hasLessCont = lessonInput.files.length > 0;
    if (hasLessCont)  {
      if (!lessonInput.files[0].name.match(/\.x?html?$/i)) {
        hideModal();
        return alert('Lesson must be an HTML file.');
      } else formData.append('lesson', lessonInput.files[0], 'lesson.html');
    }
    const attachments = form.querySelector('input[type=file][multiple]').files;
    for (const f of attachments) {
      if (!f.name.match(/\.((pn|jp)g|gif|mp[34g])$/i)) {
        hideModal();
        return alert(`Invalid attachment file type ${f.name}.`);
      }
      formData.append(f.name, f);
    }
    const maybeName = form.querySelector('input[name=name]').value.trim();
    formData.append('name', maybeName);
    formData.append('summary', form.querySelector('textarea[name=summary]').value.trim());
    // DO NOT SET CONTENT-TYPE
    await update('Lesson', id, formData, null);
    // if (hasLessCont) setLessContent(id);
    // await Promise.all(Array
    //   .from(attachments)
    //   .sort((a1, a2) => {
    //     if (!a1.name && a2.name) return -1;
    //     else if (a1.name && !a2.name) return 1;
    //     else if (!a1.name && !a2.name) return 0;
    //     else return a1.name.localeCompare(a2.name);
    //   }).map(f => appendAttachment({id: f.id, name: f.name, lessonId: id})));
    // a way to clear files
    // form.querySelector('input[type=file][multiple]').outerHTML = `
    //   <input type="file" name="attachments" class="is-paddingless" multiple style="display: block">`;
    document.querySelector(`#module-edit-list-lesson li[data-id='${id}'] > a > span`).innerText = maybeName ? maybeName : `unnamed #${id}`;
  } catch (e) {
    alert(e.msg || e.message || e.toString());
  } finally {
    // clearPane();
    unSelect('Lesson');
    await toggleLess(id);
    unlockBtns();
    return hideModal();
  }
}

/**
 * Modifies a question and updates UI.
 *
 * @return {Promise<void>}
 */
async function updateQuest() {
  showModal('Updating question');
  const id = getSelId('Question');
  const moduleId = getSelId('Module');
  const maybeName = PANE.querySelector('#module-edit-question-name').value;
  const maybeA = PANE.querySelector('#module-edit-question-answer').value;
  const maybeBadA1 = PANE.querySelector('#module-edit-question-bad-answer-1').value;
  const maybeBadA2 = PANE.querySelector('#module-edit-question-bad-answer-2').value;
  const maybeBadA3 = PANE.querySelector('#module-edit-question-bad-answer-3').value;
  const maybeBadA4 = PANE.querySelector('#module-edit-question-bad-answer-4').value;
  const maybeBadA5 = PANE.querySelector('#module-edit-question-bad-answer-5').value;
  await update('Question', id, JSON.stringify({
    id,
    moduleId,
    name: maybeName ? maybeName : null,
    badAnswer1: maybeBadA1 ? maybeBadA1 : null,
    badAnswer2: maybeBadA2 ? maybeBadA2 : null,
    badAnswer3: maybeBadA3 ? maybeBadA3 : null,
    badAnswer4: maybeBadA4 ? maybeBadA4 : null,
    badAnswer5: maybeBadA5 ? maybeBadA5 : null,
    correctAnswer: maybeA ? maybeA : null,
  }));
  document.querySelector(`#module-edit-list-question li[data-id='${id}'] > a > span`).innerText = maybeName ? maybeName : `unnamed #${id}`;
  // unSelect('Question');
  // clearPane();
  // await toggleQuest(id);
  return hideModal();
}

/**
 * Destroys a module.
 *
 * @param {!Number} id
 */
function destroyMod(id) {
  destroy('Module', id);
  if (getSelId('Module') === id) {
    clearPane();
    clearList('Lesson');
    clearList('Question');
  }
  document.querySelector(`#module-edit-list-module li[data-id='${id}']`).remove();
}

/**
 * Destroys a lesson.
 *
 * @param {!Number} id
 */
function destroyLess(id) {
  destroy('Lesson', id);
  if (getSelId('Lesson') === id) clearPane();
  document.querySelector(`#module-edit-list-lesson li[data-id='${id}']`).remove();
  if (LIST_MOD.querySelectorAll('li[data-id]').length === 1 && LIST_LESS.querySelectorAll('li[data-id]').length === 0 && LIST_QUEST.querySelectorAll('li[data-id]').length === 0) {
    unSelect("Module");
  }
}

/**
 * Destroys a question.
 *
 * @param {!Number} id
 */
function destroyQuest(id) {
  destroy('Question', id);
  if (getSelId('Question') === id) clearPane();
  document.querySelector(`#module-edit-list-question li[data-id='${id}']`).remove();
  if (LIST_MOD.querySelectorAll('li[data-id]').length === 1 && LIST_LESS.querySelectorAll('li[data-id]').length === 0 && LIST_QUEST.querySelectorAll('li[data-id]').length === 0) {
    unSelect("Module");
  }
}

/**
 * Destroys an attachment (file).
 *
 * @param {!Number} id
 * @param {!Number} lessonId
 * @return {Promise<void|!String>}
 */
function destroyAttach(id, lessonId) {
  document.querySelector(`#module-edit-list-attachments li[data-id='${id}']`).remove();
  return destroy('File', id);
}

/**
 * Creates a module.
 *
 * @return {Promise<void>}
 */
document.getElementById('module-edit-btn-module-create').onclick = async function createMod(e) {
  e.preventDefault();
  lockBtns();
  showSpinner('Module');
  try {
    appendMod(await create('Module'));
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  } finally {
    unlockBtns();
    return hideSpinner('Module');
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
  showSpinner('Lesson');
  lockBtns();
  try {
    await appendLess(await create('Lesson', JSON.stringify({moduleId} )));
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  } finally {
    unlockBtns();
    return hideSpinner('Lesson');
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
  showSpinner('Question');
  lockBtns();
  try {
    await appendQuest(await create('Question', JSON.stringify({moduleId})));
  } catch (e) {
    console.error(e);
    alert('Your session expired.');
    location.pathname = '/';
  } finally {
    unlockBtns();
    return hideSpinner('Question');
  }
};

/**
 * Populate the page using AJAX.
 *
 * Try to recall last click.
 */
(async function initModEditPage() {
  try {
    showSpinner('Module');
    showModal('Loading');
    await get('Module', {authorId: USER_ID}).then(ms => Promise.all(ms.sort((m1, m2) => {
      if (!m1.name && m2.name) return -1;
      else if (m1.name && !m2.name) return 1;
      else if (!m1.name && !m2.name) return 0;
      else return m1.name.localeCompare(m2.name);
    }).map(m => appendMod(m))));
    hideSpinner('Module');
  } catch(e) {
    console.error(e);
    alert(e);
    location.pathname = '/user/home';
  } finally {
    return hideModal();
  }
})();
