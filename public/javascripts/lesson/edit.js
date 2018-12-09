document.getElementById('lesson-edit-btn-more').onclick = function(event) {
  event.preventDefault();
  const number = eval(
    /(\d+)$/.exec(document.querySelector(
      '#lesson-edit-attachments input[type=file]:last-of-type').name)[1]);
  const newEl = document.createElement('input');
  newEl.type = 'file';
  newEl.name = `attachment-${number + 1}`;
  newEl.style.margin = '30px 0 0';
  const list = document.getElementById('lesson-edit-attachments');
  list.appendChild(newEl);
  if ([...list.querySelectorAll('input[name^=attachment]')].length >= 10) {
    this.remove();
    const msg = document.createElement('p');
    msg.style.display = 'block';
    msg.innerHTML = '<br><strong>Max attachments reached.</strong>';
    list.appendChild(msg)
  }
};

for (const lesson of document.querySelectorAll('nav.panel a.panel-block[data-id]')) {
  if (lesson.innerText.trim() === '') {
    lesson.innerHTML = `<i class="fas fa-book" aria-hidden="true" style="margin-right: 7px;"></i>
                        unnamed #${lesson.getAttribute('data-id')}`;
  }
  const lessonId = /(\d+)(\/edit)?\/?$/.exec(location.pathname)[1];
  if (lessonId === lesson.getAttribute('data-id')) {
    lesson.classList.add('is-active');
  }
}

const delLessContent = document.getElementById('lesson-edit-btn-delete-content');
if (delLessContent) {
  delLessContent.onclick = async function(event) {
    event.preventDefault();
    const lessonId = /(\d+)(\/edit)?$/.exec(location.pathname)[1];
    const moduleId = /(\d+)\/\d+(\/edit)?$/.exec(location.pathname)[1];
    const response = await fetch(`/api/module/${moduleId}/${lessonId}`, {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({content: null}),
    });
    if (response.status >= 400) {
      const json = await response.json();
      const msg = json.msg || json.message || json.toString();
      console.error(msg);
      return alert(msg);
    } else {
      document.getElementById('lesson-edit-btn-download').remove();
      document.getElementById('lesson-edit-msg-has-lesson').remove();
      return this.remove();
    }
  };
}

for (const uploadedFile of document.querySelectorAll('#lesson-edit-uploaded-files li')) {
  uploadedFile.querySelector('.button.is-danger').onclick = async function(event) {
    event.preventDefault();
    if (!confirm('Delete file?')) return;
    const lessonId = /(\d+)(\/edit)?$/.exec(location.pathname)[1];
    const moduleId = /(\d+)\/\d+(\/edit)?$/.exec(location.pathname)[1];
    const fileName = uploadedFile.querySelector('.module-file-name').innerText.trim();
    const response = await fetch(
      `/api/module/${moduleId}/${lessonId}/${fileName}/delete`, {
        redirect: 'follow',
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'include',
      });
    if (response.status >= 400) {
      const json = await response.json();
      const msg = json.msg || json.message || json.toString();
      console.error(msg);
      return alert(msg);
    }
    uploadedFile.remove();
    if ([...document.querySelectorAll('#lesson-edit-uploaded-files li')].length ===
      0) {
      document.getElementById('lesson-edit-uploaded-files').remove();
      document.getElementById('lesson-edit-h-uploaded-files').remove();
    }
  };
}
