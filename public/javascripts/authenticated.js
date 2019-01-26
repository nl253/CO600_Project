if (sessionStorage.getItem('loggedIn') === undefined || document.cookie.indexOf('token') < 0) {
  logOut().then(ok => {
    location.pathname = '/';
  }).catch(err => {
    console.error(err);
    location.pathname = '/';
  });
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
    logOut();
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

