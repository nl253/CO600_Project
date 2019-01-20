/**
 * Logs the user out by sending a logout request.
 *
 * @returns {Promise<void>}
 */
async function logOut() {
    try {
      const response = await fetch('/api/user/logout', {
        redirect: 'follow',
        cache: 'no-cache',
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
}

if (sessionStorage.getItem('loggedIn') === null) {
  logOut().then(ok => location.pathname = '/').catch(err => alert(err));
}

document.querySelector(".navbar-burger.burger").onclick = () => {
  const menu = document.querySelector('.navbar-menu');

  return menu.classList.contains('is-active')
    ? menu.classList.remove( 'is-active')
    : menu.classList.add('is-active');
};

document.getElementById('navbar-auth-btn-log-out').onclick = async (event) => {
  event.preventDefault();
  try {
    await logOut()
  } catch (e) {
    console.error(e);
  }
  location.pathname = '/';
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

