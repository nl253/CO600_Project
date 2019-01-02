document.getElementById('reg-password-2').oninput = function() {
  const elPassword = document.getElementById('reg-password');
  this.style.background = elPassword.value !== this.value ?
    '#ffbaba' :
    '#e7fdd1';
  elPassword.style.background = elPassword.value !== this.value ?
    '#ffbaba' :
    '#e7fdd1';
};

document.getElementById('reg-btn').onclick = async (event) => {

  event.preventDefault();

  

    // Ask to set cookie

    
    var modal = document.querySelector('.modal');
    var html = document.querySelector('html');
    modal.classList.add('is-active');
    html.classList.add('is-clipped');
  
    modal.querySelector('.modal-background').addEventListener('click', function(e) {
      e.preventDefault();
      modal.classList.remove('is-active');
      html.classList.remove('is-clipped');
    });

    document.getElementById('register-allowCookies-btn').onclick = async (event) => {
      const vars = {
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value.trim(),
      };
    
      if (document.getElementById('reg-password-2').value !== vars.password) {
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
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(vars),
        });
    
        if (regRes.status >= 400) {
          console.error(regRes);
          const err = await regRes.json();
          const msg = err.msg || err.message || err.toString();
          console.error(msg);
          return alert(msg);
        }
    
        // error codes 400..499 and 500..599 are client and server errors
        const logInRes = await fetch(`/api/user/login`, {
          method: 'post',
          redirect: 'follow',
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({email: vars.email, password: vars.password}),
        });
    
        if (logInRes.status >= 400) {
          const err = await logInRes.json();
          const msg = err.msg || err.message || err.toString();
          console.error(msg);
          return alert(msg);
        }

        // result should store the token if things go well
        const json = await logInRes.json();
        sessionStorage.setItem('loggedIn', JSON.stringify(json.result));
        setCookie('token', json.result.token);
        // redirect
        location.pathname = location.pathname.endsWith('/register')
        ? '/'
        : location.pathname;
      } catch (err) {
        const msg = err.msg || err.message || err.toString();
        console.error(err);
        return alert(msg);
      }
    }
};
