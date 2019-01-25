/**
 * Disables all buttons while a fetch response is awaited.
 */
function lockBtns() {
  for (const btn of document.querySelectorAll('#module-edit-list-module li[data-id] > [onclick]:not([disabled]), #module-edit-list-lesson li[data-id] > [onclick]:not([disabled]), #module-edit-list-question li[data-id] > [onclick]:not([disabled])')) {
    btn.setAttribute('disabled', 'true');
    btn.style.pointerEvents = 'none';
  }
}

/**
 * Enables all buttons after a fetch response is awaited.
 */
function unlockBtns() {
  for (const btn of document.querySelectorAll('#module-edit-list-module li[data-id] > [onclick][disabled], #module-edit-list-lesson li[data-id] > [onclick][disabled], #module-edit-list-question li[data-id] > [onclick][disabled]')) {
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
 * Updates the rating for the selected module.
 */
async function updateRating() {
  const raterId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  const moduleId = getSelId('Module');
  const comment = document.getElementById('module-learn-comment').value.trim();
  let stars = 0;
  for (let i = 5; i > 0; i--) {
    const starEl = document.getElementById(`module-learn-star-${i}`);
    if (starEl.classList.contains('is-warning')) {
      stars = i;
      break;
    }
  }
  stars = stars ? stars : null;
  lockBtns();
  const myRatings = await get('Rating', {moduleId, raterId});
  if (myRatings.length > 0) {
    await update('Rating', myRatings[0].id, JSON.stringify({comment, stars}));
  } else await create('Rating', JSON.stringify({raterId, moduleId, comment, stars}));
  unSelect('Module');
  document.getElementById('module-edit-pane').innerHTML = '';
  await toggleMod(moduleId);
  unlockBtns();
}

/**
 * Destroys a rating.
 *
 * @return {Promise<void>}
 */
async function destroyRating() {
  const raterId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
  const moduleId = getSelId('Module');
  lockBtns();
  const myRatings = await get(
    'Rating',
    {moduleId, raterId},
    false,
    true,
  );
  if (myRatings.length > 0) {
    await destroy('Rating', myRatings[0].id);
    unSelect('Module');
    document.getElementById('module-edit-pane').innerHTML = '';
    await toggleMod(moduleId);
  }
  unlockBtns();
}

/**
 * Lights stars from given fromNo to 1 (goes down e.g. 4 .. 3 .. 2 .. 1).
 *
 * @param {!Number} fromNo
 */
function lightStars(fromNo = 5) {
  for (const el of document.querySelectorAll('[id^=\'module-learn-star\']')) {
    el.classList.remove('is-warning');
  }
  for (let i = fromNo; i > 0; i--) {
    const starEl = document.getElementById(`module-learn-star-${i}`);
    starEl.classList.add('is-warning');
  }
}

/**
 * Shows the lesson edit pane.
 *
 * @param {!{id: !Number, name: ?String, authorId: !Number, topic: ?String, summary: ?String}} module
 * @param {!Array<!String>} topics
 * @return {Promise<void>}
 */
async function showMod({id, name, topic, authorId, summary}, topics = TOPICS) {
  try {
    lockBtns();
    const myRatings = await get('Rating', {
      raterId: JSON.parse(sessionStorage.getItem('loggedIn')).id,
      moduleId: id,
    });
    const myRating = myRatings.length > 0 ? myRatings[0] : null;
    const avgRating = await get('Rating', {moduleId: id})
      .then((rs) => rs.map(({stars}) => stars))
      .then((rs) => {
        const n = rs.length;
        return n > 0 ? rs.reduce((l, r) => l + r) / n : 0;
    });
    document.getElementById('module-edit-pane').innerHTML = `
      <h2 class="title">
        <a href="/module/${id}">${name ? name : 'Module'}</a>
      </h2>
      <h3 class="subtitle" style="margin: 10px 0 0 0;">
        ${topic ? topic : ''} 
      </h3>
      <section class="content" style="margin-top: 20px;">
        <strong>Author</strong>   
        <a href="/user/${authorId}">
          ${await get( 'User', {id: authorId}, false, true ).then((us) => us[0].email)}
        </a>
        <br>
        <strong>Rating</strong> 
        <span id="module-edit-rating">${avgRating}/5
        </span>
      </section>
      <section class="is-medium" style="margin-bottom: 20px;">
        <h3 class="subtitle">Summary</h3>
        <div id="module-edit-summary"
                  style="min-width: 100%; word-wrap: break-word;">
          ${summary ? summary : ''}
        </div>
      </section>
      
      <div class="field">
        <h3 class="subtitle" style="margin-bottom: 10px;">Rating</h3>
        <div class="control">
          ${Array(5).fill(0).map((_, idx) => `
            <button onclick="lightStars(${idx + 1})" id="module-learn-star-${idx + 1}" class="button" style="min-width: 0;">
              <span class="icon is-large">
                <i class="fas fa-star"></i>
              </span>
            </button>`).join('\n')}
        </div>
      </div> 

      <h4 class="subtitle" style="margin-bottom: 10px; margin-top: 20px;">Comment (optional)</h2>
      
      <textarea id="module-learn-comment">
        ${myRating && myRating.comment ? myRating.comment.trim() : ''}
      </textarea>

      <div class="field is-grouped" style="margin-top: 20px;">
        <p class="control">
          <button type="submit" onclick="updateRating()" class="button is-success is-block" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-check" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Save</span>
          </button>
        </p>
        <p class="control">
          <button onclick="destroyRating()" class="button is-danger is-block" style="margin: 7px auto; width: 100%;">
            <i class="fas fa-times" style="position: relative; top: 4px; left: 2px;"></i>
            <span>Delete</span>
          </button>
        </p>
      </div>
    `;
    if (myRating) lightStars(myRating.stars);
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
  unlockBtns();
}

/**
 * Shows the lesson edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, content: ?Boolean, summary: ?String}} lesson
 */
async function showLess({name, content}) {
  document.getElementById('module-edit-pane').innerHTML = `<h2 class="title" style="margin-bottom: 10px;">${name ? name : 'Lesson'}</h2>`;
  document.getElementById('module-edit-pane').innerHTML += content;
}

/**
 * Selects answer to quiz question.
 *
 * @param {Event} event
 */
function selAns({target}) {
  const ans = document.querySelector('#module-edit-pane .field [onclick][class*=\'is-warning\']');
  if (ans) {
    ans.classList.remove('is-warning');
    ans.classList.add('is-light');
  }
  target.classList.remove('is-light');
  target.classList.add('is-warning');
}

/**
 * Checks answer to quiz question.
 */
function checkAns() {
  const ans = document.querySelector('#module-edit-pane .field [onclick][class*=\'is-warning\']');
  if (!ans) return;
  ans.classList.remove('is-warning');
  if (ans.getAttribute('data-is-correct')) {
    ans.classList.add('is-success');
  } else {
    ans.classList.add('is-danger');
    const correctEl = document.querySelector('#module-edit-pane .field [onclick][data-is-correct]');
    correctEl.classList.add('is-success');
    correctEl.classList.remove('is-light');
  }
  for (const btn of document.querySelectorAll(
    '#module-edit-pane .field [onclick]')) {
    btn.setAttribute('disabled', 'true');
    btn.onclick = undefined;
  }
  document.querySelector('.button[onclick*=\'checkAns\']').remove();
}

/**
 * Shows the question edit pane.
 *
 * @param {{id: !Number, moduleId: !Number, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
async function showQuest({id, name, moduleId, correctAnswer, badAnswer1, badAnswer2, badAnswer3}) {
  function makeAns(ans = '', isCorrect = false) {
    const el = document.createElement('div');
    el.classList.add('field');
    el.classList.add('is-horizontal');
    el.innerHTML = `
      <a onclick="selAns(event)" ${isCorrect ? 'data-is-correct="true"' : ''} class="button is-medium is-light" style="width: 100%; padding: 5px; border: 1px; margin-right: 10px;">
        ${ans ? ans : ''}
      </a>
    `;
    return el;
  }

  const answers = shuffle([
    makeAns(correctAnswer, true),
    makeAns(badAnswer1),
    makeAns(badAnswer2),
    makeAns(badAnswer3),
  ]);


  document.getElementById('module-edit-pane').innerHTML = `
    <h2 class="title is-3" style="margin-bottom: 30px;">
      ${name ? name : `unnamed #${id}`}
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

  lockBtns();
  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 10px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  document.getElementById('module-edit-spinner-list-lesson').classList.remove('is-invisible');
  document.getElementById('module-edit-spinner-list-question').classList.remove('is-invisible');
  unSelect('Lesson');
  unSelect('Question');

  if (focusedMod !== id) {
    // selected *different* module
    unSelect('Module');
    select('Module', id);
    clearList('Lesson');
    clearList('Question');
    const p1 = get('Lesson', {moduleId: id}, false, true).then((ls) => {
      for (const l of ls.sort((l1, l2) => {
        if (l1.name && !l2.name) return 1;
        else if (!l1.name && l2.name) return -1;
        else if (!l1.name && !l2.name) return 0;
        else return l1.name.localeCompare(l2.name);
      })) appendLess(l);
    });
    const p2 = get('Question', {moduleId: id}, false, true).then((qs) => {
      for (const q of qs.sort((q1, q2) => {
        if (q1.name && !q2.name) return 1;
        else if (!q1.name && q2.name) return -1;
        else if (!q1.name && !q2.name) return 0;
        else return q1.name.localeCompare(q2.name);
      })) appendQuest(q);
    });
    await p1;
    await p2;
  }
  await showMod(await get('Module', {id}, false, true).then((ms) => ms[0]));
  document.getElementById('module-edit-spinner-list-lesson').classList.add('is-invisible');
  document.getElementById('module-edit-spinner-list-question').classList.add('is-invisible');
  unlockBtns();
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
  lockBtns();
  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 10px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  unSelect(focusedLessId === null ? 'Question' : 'Lesson');
  select('Lesson', id);
  await showLess((await get('Lesson', {id, moduleId: getSelId('Module')}, false, true))[0]);
  unlockBtns();
}

/**
 * Toggle question. Run when a question is pressed. Shows the question-edit pane.
 *
 * @param {!Number} id
 * @return {Promise<void>}
 */
async function toggleQuest(id) {
  if (id === getSelId('Question')) return;
  lockBtns();
  document.getElementById('module-edit-pane').innerHTML = `
    <p class="has-text-centered" style="margin: 10px auto;">
      <span style="margin-bottom: 15px;">Loading</span>
      <br>
      <i class="fas fa-spinner spinner"></i>
    </p>`;
  unSelect('Question');
  unSelect('Lesson');
  select('Question', id);
  await showQuest((await get('Question', {id, moduleId: getSelId('Module')}))[0]);
  unlockBtns();
}

/**
 * Appends a new module to module list (left-most list).
 *
 * @param {{id: !Number, authorId: !Number, name: ?String}} module
 */
function appendMod({id, name}) {
  const li = document.createElement('li');
  li.setAttribute('data-id', id);
  li.innerHTML =` 
    <a onclick="toggleMod(${id})" style="min-width: 100px; padding: 10px; margin-right: 5px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : `unnamed #${id.toString()}`}</span>
    </a>`;
  document.getElementById('module-edit-list-module').appendChild(li);
}

/**
 * Appends a lesson to the list of lessons AND created a form for editing it.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String}} lesson
 */
function appendLess({id, name}) {
  const li = document.createElement('li');
  li.setAttribute('data-id', id);
  li.innerHTML =` 
    <a onclick="toggleLess(${id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : `unnamed #${id}`}</span>
    </a>`;
  document.getElementById('module-edit-list-lesson').appendChild(li);
}

/**
 * Appends a question to the quiz for the selected module.
 *
 * @param {{id: !Number, moduleId: !Number, name: ?String, correctAnswer: ?String, badAnswer1: ?String, badAnswer2: ?String, badAnswer3: ?String}} question
 */
function appendQuest({id, name}) {
  const li = document.createElement('li');
  li.setAttribute('data-id', id);
  li.innerHTML =`
    <a class="has-text-dark" onclick="toggleQuest(${id})" style="padding: 5px 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
      <span>${name ? name : `unnamed #${id}`}</span>
    </a>`;
  document.getElementById('module-edit-list-question').appendChild(li);
}

// Populate the page using AJAX
/**
 * Try to recall last click.
 */
(async function() {
  try {
    document.getElementById('module-edit-spinner-list-module').classList.remove('is-invisible');
    const studentId = JSON.parse(sessionStorage.getItem('loggedIn')).id;
    const enrollments = await get('Enrollment', {studentId}, false, true);
    let modules = (await Promise.all(enrollments.map(({moduleId}) => get('Module', {id: moduleId}, false, true)))).map(xs => xs[0]);
    console.log(enrollments);
    console.log(modules);
    modules = modules.sort((m1, m2) => {
      if (m1.name && !m2.name) return 1;
      else if (!m1.name && m2.name) return -1;
      else if (!m1.name && !m2.name) return 0;
      return m1.name.localeCompare(m2.name);
    });
    if (modules.length > 0) modules.forEach(appendMod) ;
    else document.getElementById('module-edit-list-module').innerHTML = `
        <li>
          <p class="has-text-centered">no enrollments</p>
          <br>
          <p class="has-text-centered"><strong>Hint</strong> search for modules to enroll (see navbar)</p>
        </li>
    `;
    document.getElementById('module-edit-spinner-list-module').classList.add('is-invisible');
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(e);
    return alert(msg);
  }
})();
