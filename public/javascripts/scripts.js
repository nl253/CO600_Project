(() => {
  /** Strip email suffix. I.e. all after the '@' at symbol. */
  const emailRegex = /([A-Za-z0-9.]+)@([A-Za-z0-9.]+)/;
  for (const greeting of document.getElementsByClassName('greeting-email')) {
    const match = emailRegex.exec(greeting.innerText);
    if (match !== null) {
      greeting.innerText = greeting.innerText.replace(match[0],
        ' ' + match[1] + ' ');
    }
  }
})();
