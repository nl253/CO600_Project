if (!sessionStorage.getItem('loggedIn') || document.cookie.indexOf('token') < 0) {
  logOut().then(ok => {
    location.pathname = '/';
  }).catch(err => {
    console.error(err);
    location.pathname = '/';
  });
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
async function showMod(module, topics = TOPICS) {
  try {
    document.getElementById('module-edit-pane').innerHTML = `
      <h2 class="title">
        ${module.name ? module.name : ''}
      </h2>
      <h3 class="subtitle" style="margin: 10px 0 0 0;">
        ${module.topic ? module.topic : ''} 
      </h3>
      <section class="content" style="margin-top: 20px;">
        <strong>Author</strong>   
        <a href="/user/${module.authorId}">
          ${await get('User', {id: module.authorId}).then(us => us[0].email)}
        </a>
        <br>
        <strong>Rating</strong> 
        <span id="module-edit-rating">${
          await get('Rating', {moduleId: module.id})
            .then(rs => rs.map(r => r.stars))
            .then(rs => {
              const n = rs.length;
              return n > 0 ? rs.reduce((l, r) => l + r) / n : 0;
            })}/5
        </span>
      </section>
      <section class="is-medium" style="margin-bottom: 30px;">
        <h3 class="subtitle" style="margin-bottom: 10px;">Summary</h3>
        <div id="module-edit-summary"
                  style="min-width: 100%; min-height: 90px; word-wrap: break-word;">
          ${module.summary ? module.summary : ''}
        </div>
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
async function showLess(lesson) {
  const cfg = {
    redirect: 'follow',
    cache: 'no-cache',
    credentials: 'include',
  };
  const lessonRes = await fetch(`/api/lesson/search?id=${lesson.id}`,cfg);
  const json = await lessonRes.json();
  document.getElementById('module-edit-pane').innerHTML = `<h2 class="title" style="margin-bottom: 10px;">${lesson.name ? lesson.name : 'Lesson'}</h2>`;
  document.getElementById('module-edit-pane').innerHTML += json.result[0].content;
}

/**
 * Selects answer to quiz question.
 */
function selAns(e) {
  const ans = document.querySelector("#module-edit-pane .field [onclick][class*='is-warning']");
  if (ans) {
    ans.classList.remove('is-warning');
    ans.classList.add('is-light');
  }
  e.target.classList.remove('is-light');
  e.target.classList.add('is-warning');
}

/**
 * Checks answer to quiz question.
 */
function checkAns() {
  const ans = document.querySelector("#module-edit-pane .field [onclick][class*='is-warning']");
  if (!ans) return;
  ans.classList.remove('is-warning');
  if (ans.getAttribute('data-is-correct')) {
    ans.classList.add('is-success');
  } else {
    ans.classList.add('is-danger');
    const correctEl = document.querySelector("#module-edit-pane .field [onclick][data-is-correct]");
    correctEl.classList.add('is-success');
    correctEl.classList.remove('is-light');
  }
  for (const btn of document.querySelectorAll(
    "#module-edit-pane .field [onclick]")) {
    btn.setAttribute('disabled', 'true');
    btn.onclick = undefined;
  }
  document.querySelector(".button[onclick*='checkAns']").remove();
}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
async function showQuest(question) {

  function makeAns(ans = '', isCorrect = false) {
    const el = document.createElement('div');
    el.classList.add('field');
    el.classList.add('is-horizontal');
    el.innerHTML = `
      <a onclick="selAns(event)" ${isCorrect ? 'data-is-correct="true"' : ''} class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">
        ${ans ? ans : ''}
      </a>
    `;
    // el.firstChild.addEventListener('click', e => selAns(e));
    return el;
  }

  const answers = shuffle([
    makeAns(question.correctAnswer, true),
    makeAns(question.badAnswer1),
    makeAns(question.badAnswer2),
    makeAns(question.badAnswer3),
  ]);


  document.getElementById('module-edit-pane').innerHTML = `
    <h2 class="title is-3" style="margin-bottom: 30px;">
      ${question.name ? question.name : 'unnamed #' + question.id}
    </h2>`;

  for (const a of answers) {
   document.getElementById('module-edit-pane').appendChild(a);
  }

  document.getElementById('module-edit-pane').innerHTML += `
    <button type="submit" onclick="checkAns()"  class="button is-success is-block" style="margin: 7px auto;">
      <i class="fas fa-check" style="position: relative; top: 4px;"></i>
      <span>Check</span>
    </button>`;
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
      for (const l of ls.sort((l1, l2) => {
        if (l1.name && !l2.name) return 1;
        else if (!l1.name && l2.name) return -1;
        else if (!l1.name && !l2.name) return 0;
        else return l1.name.localeCompare(l2.name);
      })) appendLess(l);
    });
    get('Question', {moduleId: id}).then(qs => {
      for (const q of qs.sort((q1, q2) => {
        if (q1.name && !q2.name) return 1;
        else if (!q1.name && q2.name) return -1;
        else if (!q1.name && !q2.name) return 0;
        else return q1.name.localeCompare(q2.name);
      })) appendQuest(q);
    });
  }
  return showMod(await get('Module', {id}).then(ms => ms[0]));
}

/**
 * Toggle module. Run when a module is pressed. Shows the module-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleLess(id) {
  const focusedLessId = getSelId('Lesson');
  if (id === focusedLessId) return;
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  const lesson = (await get('Lesson', {id, moduleId: getSelId('Module')}))[0];
  return await showLess(lesson, await get('File', {lessonId: lesson.id}));
}

/**
 * Toggle question. Run when a question is pressed. Shows the question-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleQuest(id) {
  if (id === getSelId('Question')) return;
  unSelect('Question');
  unSelect('Lesson');
  select('Question', id);
  return await showQuest((await get('Question', {id, moduleId: getSelId('Module')}))[0]);
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{id: !Number, authorId: !Number, name: ?String}} module
 */
function appendMod(module = {id: null , name: null}) {
  const li = document.createElement('li');
  li.setAttribute('data-id', module.id);
  li.innerHTML =` 
    <a onclick="toggleMod(${module.id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${module.name ? module.name : 'unnamed #' + module.id.toString()}</span>
    </a>`;
  document.getElementById('module-edit-list-module').appendChild(li);
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String}} lesson
 */
function appendLess(lesson) {
  const li = document.createElement('li');
  li.setAttribute('data-id', lesson.id);
  li.innerHTML =` 
    <a onclick="toggleLess(${lesson.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${lesson.name ? lesson.name : 'unnamed #' + lesson.id}</span>
    </a>`;
  document.getElementById('module-edit-list-lesson').appendChild(li);
}

/**
 * Appends a question to the quiz for the selected module.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuest(question) {
  const li = document.createElement('li');
  li.setAttribute('data-id', question.id);
  li.innerHTML =`
    <a class="has-text-dark" onclick="toggleQuest(${question.id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${question.name ? question.name : 'unnamed #' + question.id}</span>
    </a>`;
  document.getElementById('module-edit-list-question').appendChild(li);
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
    const modules = [];
    for (const e of enrollments) {
      modules.push((await (await fetch(`/api/module/search?id=${e.moduleId}`)).json()).result[0]);
    }
    for (const m of modules.sort((m1, m2) => {
      if (m1.name && !m2.name) return 1;
      else if (!m1.name && m2.name) return -1;
      else if (!m1.name && !m2.name) return 0;
      return m1.name.localeCompare(m2.name);
    })) appendMod(m);
  } catch(e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg)
  }
})();
