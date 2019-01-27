for (const lesson of document.querySelectorAll(
  'nav.panel a.panel-block[data-id]')) {
  if (lesson.innerText.trim() === '') {
    lesson.innerHTML = `
      <i class="fas fa-book" aria-hidden="true" style="margin-right: 7px;"></i>
      unnamed #${lesson.getAttribute('data-id')}`;
  }
  const lessonId = /(\d+)(\/edit)?\/?$/.exec(location.pathname)[1];
  if (lessonId === lesson.getAttribute('data-id')) {
    lesson.classList.add('is-active');
  }
  lesson.onclick = (event) => {
    event.preventDefault();
    const id = lesson.getAttribute('data-id');
    return location.pathname = location.pathname.replace(/\d+\/?$/, id);
  };
}
