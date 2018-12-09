document.getElementById('reg-password-2').oninput = function() {
  const elPassword = document.getElementById('reg-password');
  this.style.background = elPassword.value !== this.value ?
    '#ffbaba' :
    '#e7fdd1';
  elPassword.style.background = elPassword.value !== this.value ?
    '#ffbaba' :
    '#e7fdd1';
};

document.getElementById('register-btn').onclick = async (event) => {

  event.preventDefault();

  let [firstName, lastName] = [null, null];

  let maybeFirstName = document.getElementById('first-name').value;
  if (maybeFirstName !== '') firstName = maybeFirstName;

  let maybeLastName = document.getElementById('last-name').value;
  if (maybeLastName !== '') lastName = maybeLastName;

  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  if (document.getElementById('reg-password-2').value !== password) {
    return alert('passwords don\'t match');
  }

  const regRes = await fetch(`/api/user/register`, {
    method: 'POST',
    redirect: 'follow',
    cache: 'no-cache',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({firstName, lastName, email, password}),
  });

  if (regRes.status >= 400) {
    const err = await regRes.json();
    const msg = err.msg || err.message || err.toString();
    console.error(msg);
    return alert(msg);
  }

  // error codes 400..499 and 500..599 are client and server errors
  const logInRes = await fetch(`/api/user/login`, {
    method: 'POST',
    redirect: 'follow',
    cache: 'no-cache',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({email, password}),
  });

  if (logInRes.status >= 400) {
    const err = await logInRes.json();
    const msg = err.msg || err.message || err.toString();
    console.error(msg);
    return alert(msg);
  }

  // result should store the token if things go well
  const json = await logInRes.json();
  const token = json.result;

  setCookie('token', token);
  // redirect
  if (location.pathname.match(/register\/?$/) || location.pathname === '/') {
    location.href = '/user/edit';
  }
};
