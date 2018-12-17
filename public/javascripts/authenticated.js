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

(function() {
  for (const btn of document.querySelectorAll('nav:first-of-type a.button[href]')) {
    if (location.pathname === btn.getAttribute('href')) {
      btn.classList.add('has-background-grey-dark');
      btn.classList.add('has-text-white');
      break;
    }
  }
})();

