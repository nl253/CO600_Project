async function unEnroll(moduleId) {
  try {
    const response = await fetch(`/api/module/${moduleId}/unenroll`, {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (response.status >= 400) {
      const json = await response.json();
      const msg = json.msg || json.message || json.toString();
      console.error(msg);
      return alert(msg);
    }
    const enrollBtn = document.getElementById('module-btn-enroll');
    enrollBtn.classList.remove('is-danger');
    enrollBtn.classList.add('is-light');
    enrollBtn.innerHTML = `
    <i class="fas fa-hourglass-half" style="margin-right: 7px;"></i>
    Wait `;
    enrollBtn.onclick = undefined;
    return setTimeout(() => {
      enrollBtn.classList.remove('is-light');
      enrollBtn.classList.add('is-primary');
      enrollBtn.innerHTML = `
            <i class="fas fa-check" style="margin-right: 7px;"></i>
            Enroll
        `;
      enrollBtn.onclick = () => enroll(moduleId);
    }, 1000);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

async function enroll(moduleId) {
  try {
    const response = await fetch(`/api/module/${moduleId}/enroll`, {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (response.status >= 400) {
      const json = await response.json();
      const msg = json.msg || json.message || json.toString();
      console.error(msg);
      return alert(msg);
    }
    const enrollBtn = document.getElementById('module-btn-enroll');
    enrollBtn.classList.remove('is-primary');
    enrollBtn.classList.add('is-light');
    enrollBtn.innerHTML = `
      <i class="fas fa-hourglass-half" style="margin-right: 7px;"></i>
      wait `;
    enrollBtn.onclick = undefined;
    return setTimeout(() => {
      enrollBtn.classList.remove('is-light');
      enrollBtn.classList.add('is-danger');
      enrollBtn.innerHTML = `
          <i class="fas fa-times" style="margin-right: 7px;"></i>
          Unenroll
        `;
      enrollBtn.onclick = () => unEnroll(moduleId);
    }, 1000);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

(() => {
  const nameEl = document.getElementById('module-h-name');
  if (nameEl.innerText.trim() === '') {
    nameEl.innerText = 'Unnamed';
  }
  const topicEl = document.getElementById('module-h-topic');
  if (topicEl.innerText.trim() === '') {
    topicEl.innerText = 'No Topic';
  }
})();


for (const lesson of document.querySelectorAll('#module-lessons li a')) {
  if (lesson.innerText.trim() === '') {
    lesson.innerText = `unnamed #${lesson.getAttribute('data-id')}`;
  }
  lesson.onclick = async function(event) {
    event.preventDefault();
    const response = await fetch(
      location.pathname + `/${lesson.getAttribute('data-id')}`, {
        redirect: 'follow',
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    return response.status >= 400
      ? alert('you need to enroll')
      : (location.pathname += `/${lesson.getAttribute('data-id')}`);
  };
}

