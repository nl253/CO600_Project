if (location.pathname.includes('/user/register')) {
  const btn = document.getElementById('layout-btn-register-redirect');
  if (btn) btn.remove();
}


(function() {
  let btn = document.getElementById('layout-btn-log-in');
  if (!btn) return;
  btn.onclick = async (event) => {

    // don't send the HTML form
    event.preventDefault();

    const email = document.getElementById('layout-input-email').value;
    const password = document.getElementById('layout-input-password').value;
    const logInRes = await fetch('/api/user/login', {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({email, password}),
    });

    if (logInRes.status >= 400) {
      try {
        const err = await logInRes.json();
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        return alert(msg);
      } catch (e) {
        console.error(e);
        return alert(e);
      }
    }

    let json;

    try {
      json = await logInRes.json();
    } catch (e) {
      console.error(e);
      sessionStorage.clear();
      return document.getElementById('layout-btn-log-in').dispatchEvent(new Event('click'));
    }

    sessionStorage.setItem('loggedIn', JSON.stringify(json.result));
    setCookie('token', json.result.token);
    location.href = location.pathname.includes('/register')
      ? '/user/home'
      : location.href;
  };
})();

(function() {
  let burger = document.querySelector(".navbar-burger.burger");
  if (!burger) return;
  burger.onclick = () => {
    const menu = document.querySelector('.navbar-menu');

    return menu.classList.contains('is-active')
      ? menu.classList.remove( 'is-active')
      : menu.classList.add('is-active');
  };
})();

