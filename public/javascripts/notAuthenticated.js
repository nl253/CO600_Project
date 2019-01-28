if (location.pathname.includes('/user/register')) {
  const btn = document.getElementById('layout-btn-register-redirect');
  if (btn) btn.remove();
}

(function initLogInBtn() {
  let btn = document.getElementById('layout-btn-log-in');
  if (!btn) return;
  btn.onclick = async (event) => {

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
        return;
      } catch (e) {
        const msg = 'could not log in';
        console.error(msg);
        console.error(e);
        alert(msg);
        sessionStorage.clear();
        return;
      }
    }

    try {
      const user = (await logInRes.json()).result;
      sessionStorage.setItem('loggedIn', JSON.stringify(user));
      setCookie('token', user.token);
      location.pathname = location.pathname.includes('/register')
        ? '/user/home'
        : location.pathname;
    } catch (e) {
      console.error(e);
      alert(e.message);
      sessionStorage.clear();
      hideModal();
    }
  };
})();
