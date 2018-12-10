(function() {
  const summary = document.getElementById('module-edit-summary');
  summary.rows = Math.floor(Math.min(20, Math.max(summary.value.split('\n').length / 2, 4)));
})();

/**
 * Lessons
 */

for (const lesson of document.querySelectorAll('#module-edit-lessons li')) {
  const modNameLink = lesson.querySelector('a:first-of-type');
  if (modNameLink.innerText.trim() === '') {
    modNameLink.innerText = `unnamed #${lesson.getAttribute('data-id')}`;
  }
  lesson.querySelector('.button.is-danger').onclick = async function(event) {
    event.preventDefault();
    if (!confirm('Delete lesson?')) return;
    const moduleId = /(\d+)(\/edit)?\/?$/.exec(location.pathname)[1];
    const lessonId = lesson.getAttribute('data-id');
    try {
      const response = await fetch(`/api/module/${moduleId}/${lessonId}/delete`, {
        redirect: 'follow',
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'include',
        headers: {Accept: 'application/json'},
      });
      if (response.status >= 400) throw (await response.json());
    } catch(err) {
      const msg = err.msg || err.message || err.toString();
      console.error(msg);
      return alert(msg);
    }
    const isLast = (lesson.parentElement.querySelectorAll('li').length - 1) === 0;
    if (isLast) {
      lesson.parentElement.outerHTML = `<br><p class="has-text-centered">No Lessons.</p><br>`;
    } else return lesson.remove();
  };
}

document.getElementById('module-edit-btn-lesson-create').onclick = async function() {
  try {
    const moduleId = /(\d+)(\/edit)?\/?$/.exec(location.pathname)[1];
    const result = await fetch(`/api/module/${moduleId}/lesson/create`, {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {'Accept': 'application/json'},
    });
    if (result.status >= 400) throw new (await result.json());
    const json = await result.json();
    location.pathname = location.pathname.replace(/(\/edit)?\/?$/,
      '/' + json.result.toString() + '/edit');
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
};

/**
 * Module
 */

// Delete
document.getElementById('module-edit-btn-delete').onclick = async () => {
  if (!confirm('Delete module?')) return;
  const match = /(\d+)(\/edit)?\/?$/.exec(location.pathname);
  const id = match[1];
  try {
    const response = await fetch(`/api/module/${id}/delete`);
    if (response.status >= 400) {
      const err = await response.json();
      const msg = err.msg || err.message || err.toString();
      console.error(msg);
      return alert(msg);
    }
    return window.location.pathname = '..';
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
};

// Save
document.getElementById('module-edit-btn-save').onclick = async function(event) {
  event.preventDefault();
  const match = /(\d+)(\/edit)?\/?$/.exec(window.location.pathname);
  if (match !== null) {
    const id = match[1];
    const postBody = {};
    let summary = document.getElementById('module-edit-summary');
    let topic = document.getElementById('module-edit-topic');
    let name = document.getElementById('module-edit-name');
    postBody.name = name.innerText !== '' ? name.innerText : null;
    postBody.topic = topic.innerText !== '' ? topic.innerText : null;
    postBody.summary = summary.value !== '' ? summary.value : null;
    try {
      const response = await fetch(`/api/module/${id}`, {
        method: 'post',
        redirect: 'follow',
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(postBody),
      });
      if (response.status >= 400) {
        const err = await response.json();
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        return alert(msg);
      }
      return alert((await response.json()).msg);
    } catch (e) {
      const msg = e.msg || e.message || e.toString();
      console.error(msg);
      return alert(msg);
    }
  }
};

/**
 * Module topic drop-down.
 */

document.querySelector('#module-edit-topic-other').onblur = function() {
  if (this.innerText.trim() !== '') {
    document.querySelector('#module-edit-topic').innerText = this.innerText.trim();
  }
};

// remove topics that are empty strings or just whitespaces
for (const topic of [...document.querySelectorAll('.dropdown-menu .dropdown-content a.dropdown-item')].filter(
  el => el.innerText.trim() === '')) {
  topic.remove();
}
