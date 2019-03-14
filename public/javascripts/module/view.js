/**
 * @param {!Number} moduleId
 * @returns {Promise<*>}
 */
async function unEnroll(moduleId) {
  try {
    const enrollments = get('Enrollment', {
      moduleId, 
      studentId: JSON.parse(sessionStorage.getItem('loggedIn')).id,
    });
    const enrollBtn = document.getElementById('module-btn-enroll');
    enrollBtn.classList.remove('is-danger');
    enrollBtn.classList.add('is-light');
    enrollBtn.setAttribute('disabled', 'true');
    enrollBtn.innerHTML = `<i class="fas fa-hourglass-half" style="margin-right: 7px;"></i> Wait`;
    enrollBtn.onclick = undefined;
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k !== 'loggedIn') sessionStorage.removeItem(k);
    }
    await destroy('Enrollment', (await enrollments)[0].id);
    return setTimeout(() => {
      enrollBtn.classList.remove('is-light');
      enrollBtn.classList.add('is-primary');
      enrollBtn.removeAttribute('disabled');
      enrollBtn.innerHTML = `<i class="fas fa-check" style="margin-right: 7px;"></i> Enroll`;
      enrollBtn.onclick = () => enroll(moduleId);
    }, 300);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * @param {!Number} moduleId
 * @returns {Promise<void>}
 */
async function enroll(moduleId) {
  try {
    const createP = create('Enrollment', JSON.stringify({
      moduleId,
      studentId: JSON.parse(sessionStorage.getItem('loggedIn')).id,
    }));
    const enrollBtn = document.getElementById('module-btn-enroll');
    enrollBtn.classList.remove('is-primary');
    enrollBtn.classList.add('is-light');
    enrollBtn.innerHTML = `<i class="fas fa-hourglass-half" style="margin-right: 7px;"></i> Wait`;
    enrollBtn.setAttribute('disabled', 'true');
    enrollBtn.onclick = undefined;
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k !== 'loggedIn') sessionStorage.removeItem(k);
    }
    await createP;
    return setTimeout(() => {
      enrollBtn.classList.remove('is-light');
      enrollBtn.classList.add('is-danger');
      enrollBtn.removeAttribute('disabled');
      enrollBtn.innerHTML = `<i class="fas fa-times" style="margin-right: 7px;"></i> Unenroll`;
      enrollBtn.onclick = () => unEnroll(moduleId);
    }, 300);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

(() => {
  const nameEl = document.getElementById('module-h-name');
  if (nameEl.innerText.trim() === '') nameEl.innerText = 'Unnamed';
  const topicEl = document.getElementById('module-h-topic');
  if (topicEl.innerText.trim() === '') topicEl.innerText = 'No Topic';
})();

for (const lesson of document.querySelectorAll('#module-lessons li a')) {
  if (lesson.innerText.trim() === '') {
    lesson.innerText = `unnamed #${lesson.getAttribute('data-id')}`;
  }
}

document.querySelector('pre').innerHTML = document.querySelector('pre').innerHTML.trim();
