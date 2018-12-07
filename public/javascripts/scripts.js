document.addEventListener('DOMContentLoaded', () => {
  /** Strip email suffix. I.e. all after the '@' at symbol. */
  const regex = /([A-Za-z0-9.]+)@([A-Za-z0-9.]+)/;
  for (const el of document.getElementsByClassName('greeting-email')) {
    const match = regex.exec(el.innerText);
    if (match !== null) {
      el.innerText = el.innerText.replace(match[0], ' ' + match[1] + ' ');
    }
  }
}, {once: true});
