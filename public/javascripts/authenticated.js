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
    sessionStorage.clear();
    if (response.status >= 400) throw new (await response.json());
  } catch (e) {
    console.error(e);
  }
  location.href = '/';
};

(function() {
  for (const btn of document.querySelectorAll('nav:first-of-type a[href]')) {
    if (location.pathname === btn.getAttribute('href')) {
      btn.classList.add('has-background-grey-dark');
      btn.classList.add('has-text-white');
      break;
    }
  }
  if (location.pathname.match('/search')) {
    const el = document.querySelector("nav:first-of-type .navbar-item.has-dropdown.is-hoverable").querySelector('.navbar-link');
    el.classList.add('has-background-grey-dark');
    el.classList.add('has-text-white');
  }
})();

