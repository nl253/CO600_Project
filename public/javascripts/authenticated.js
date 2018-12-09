document.getElementById('navbar-auth-btn-log-out').onclick = async (event) => {
  event.preventDefault();
  try {
    const response = await fetch('/api/user/logout', {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (response.status >= 400) throw new (await response.json());
    sessionStorage.clear();
    location.href = '/';
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
};


if (location.pathname.match(/\/user\/\d+\/edit.*$/)) {
  document.getElementById('navbar-auth-btn-user-settings').onclick = event => {
    event.preventDefault();
    return toggleTabPersonalDetails();
  };
  document.getElementById('navbar-auth-btn-user-created-modules').onclick =
    event => {
      event.preventDefault();
      return toggleTabCreatedModules();
    };
  document.getElementById('navbar-auth-btn-user-enrollments').onclick =
    event => {
      event.preventDefault();
      return toggleTabEnrollments();
    };
}

document.getElementById('layout-btn-create-module').onclick = async function(event) {
  event.preventDefault();
  try {
    const response = await fetch('/api/module/create', {
      redirect: 'follow',
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (response.status >= 400) throw (await response.json());
    const moduleId = (await response.json()).result;
    location.href = `/module/${moduleId}/edit`;
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
};

