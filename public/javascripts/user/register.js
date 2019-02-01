document.getElementById('reg-password-2').oninput = function(e) {
  const COLOR_OK ='green !important';
  const COLOR_BAD = 'red !important';
  console.log(`before color: ${e.target.style.backgroundColor}`);
  const elPassword = document.getElementById('reg-password');
  e.target.style.setProperty('backgroundColor', elPassword.value.trim() === e.target.value.trim() ? COLOR_OK : COLOR_BAD, 'important');
  elPassword.style.setProperty( 'backgroundColor', e.target.style.backgroundColor, 'important');
  console.log(`after color: ${e.target.style.backgroundColor}`);
};

document.getElementById('reg-btn').onclick = async e => {
  e.preventDefault();

  // Ask to set cookie
  const modal = document.getElementById('register-cookieModal');
  const html = document.querySelector('html');
  modal.classList.add('is-active');
  html.classList.add('is-clipped');

  modal.querySelector('.modal-background').onclick = e => {
    e.preventDefault();
    modal.classList.remove('is-active');
    html.classList.remove('is-clipped');
  };

  document.getElementById('register-noCookies-btn').onclick = e => {
    e.preventDefault();
    modal.classList.remove('is-active');
    html.classList.remove('is-clipped');
  };

  document.getElementById('register-allowCookies-btn').onclick = async (e) => {
    e.preventDefault();
    showModal('Processing');
    const vars = {
      email: document.getElementById('reg-email').value.trim(),
      password: document.getElementById('reg-password').value,
    };

    if (document.getElementById('reg-password-2').value !== vars.password) {
      hideModal();
      return alert('passwords don\'t match');
    }

    let maybeFirstName = document.getElementById('reg-first-name').value.trim();
    if (maybeFirstName !== '') vars.firstName = maybeFirstName;

    let maybeLastName = document.getElementById('reg-last-name').value.trim();
    if (maybeLastName !== '') vars.lastName = maybeLastName;

    try {
      const regRes = await fetch(`/api/user/register`, {
        method: 'post',
        redirect: 'follow',
        cache: 'no-cache',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(vars),
      });

      if (regRes.status >= 400) {
        hideModal();
        console.error(regRes);
        const err = await regRes.json();
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        document.querySelector('.modal.is-active').classList.add('is-clipped');
        document.querySelector('.modal.is-active').classList.remove('is-active');
        return alert(msg);
      }

      // error codes 400..499 and 500..599 are client and server errors
      const logInRes = await fetch('/api/user/login', {
        method: 'post',
        redirect: 'follow',
        cache: 'no-cache',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({email: vars.email, password: vars.password}),
      });

      if (logInRes.status >= 400) {
        hideModal();
        const err = await logInRes.json();
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        alert(msg);
        modal.classList.remove('is-active');
        html.classList.remove('is-clipped');
        return;
      }

      // result should store the token if things go well
      sessionStorage.setItem('loggedIn', JSON.stringify((await logInRes.json()).result));

      hideModal();
      // redirect
      return location.pathname = location.pathname.endsWith('/register')
        ? '/user/home'
        : location.pathname;
    } catch (err) {
      const msg = err.msg || err.message || err.toString();
      console.error(err);
      alert(msg);
      modal.classList.remove('is-active');
      html.classList.remove('is-clipped');
      return hideModal();
    }
  };
};
