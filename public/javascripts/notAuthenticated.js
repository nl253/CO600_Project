if (location.pathname.includes('/user/register')) {
  const btn = document.getElementById('layout-btn-register-redirect');
  if (btn) btn.remove();
}

document.getElementById('layout-btn-log-in').onclick = async (event) => {

  // don't send the HTML form
  event.preventDefault();

  const email = document.getElementById('layout-input-email').value;
  const password = document.getElementById('layout-input-password').value;
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

  const json = await logInRes.json();
  sessionStorage.setItem('loggedIn', JSON.stringify(json.result));
  setCookie('token', json.result.token);
  location.href = location.pathname.includes('/register')
    ? '/user/home'
    : location.href;
};
