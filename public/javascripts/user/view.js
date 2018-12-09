(() => {
  const sinceDate = document.getElementById('member-since-date');
  if (sinceDate.innerText.trim()) {
    const regex = /(.*\s+GMT\+\d).*/;
    const match = regex.exec(sinceDate.innerText);
    if (match) sinceDate.innerText = match[1];
  }
  const editBtn = document.getElementById('user-personal-details-btn-modify');
  if (editBtn) {
    editBtn.onclick = function(event) {
      event.preventDefault();
      const userId = /\/user\/([^\/]+)$/.exec(location.pathname)[1];
      location.href = `/user/${userId}/edit?tab=personal-details`;
    };
  }
  let tab;
  let query = location.search
    .slice(1)
    .split('&')
    .map(s => s.split('=')).find(q => q[0] === 'tab');
  tab = query ? query[1] : sessionStorage.getItem('homeTab');
  switch (tab) {
    case 'created-modules':
      return toggleTabCreatedModules();
    case 'enrollments':
      return toggleTabEnrollments();
    case 'personal-details':
      return toggleTabPersonalDetails();
    default:
      return toggleTabPersonalDetails();
  }
})();

for (const el of ([
  ...document.querySelectorAll(
    '#user-enrollments li a, #user-created-modules li a')]).filter(
  el => el.innerText.trim() === '')) {
  el.innerText = `unnamed #${el.parentElement.getAttribute('data-id')}`;
}

for (const btn of document.querySelectorAll(
  '#user-created-modules li .button.is-warning')) {
  btn.onclick = event => {
    event.preventDefault();
    const moduleId = btn.parentElement.parentElement.getAttribute('data-id');
    location.pathname = `/module/${moduleId}/edit`;
  };
}

for (const btn of document.querySelectorAll(
  '#user-created-modules li .button.is-link')) {
  btn.onclick = event => {
    event.preventDefault();
    const moduleId = btn.parentElement.parentElement.getAttribute('data-id');
    location.pathname = `/module/${moduleId}`;
  };
}


