if (location.pathname.includes('/user/register')) {
  const btn = document.getElementById('layout-btn-register-redirect');
  if (btn) btn.remove();
}

(function initLogInBtn() {
  let btn = document.getElementById('layout-btn-log-in');
  if (!btn) return;
  btn.onclick = async function logIn(event) {
    showModal('Logging in');

    // don't send the HTML form
    event.preventDefault();

    const email = document.getElementById('layout-input-email').value;
    const password = document.getElementById('layout-input-password').value;
    const logInRes = await fetch('/api/user/login', {
      method: 'POST',
      cache: 'no-cache',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password}),
    });

    if (logInRes.status >= 400) {
      hideModal();
      try {
        const err = await logInRes.json();
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        alert(msg);
      } catch (e) {
        const msg = 'could not log in';
        console.error(msg);
        console.error(e);
        alert(msg);
      }
      return;
    }

    try {
      sessionStorage.setItem('loggedIn', JSON.stringify((await logInRes.json()).result));
      return setTimeout(() => location.pathname = location.pathname, 200);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };
})();
