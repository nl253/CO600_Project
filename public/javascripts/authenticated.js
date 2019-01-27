if (sessionStorage.getItem('loggedIn') === undefined || document.cookie.indexOf('token') < 0) {
  logOut().then(ok => {
    location.pathname = '/';
  }).catch(err => {
    console.error(err);
    location.pathname = '/';
  });
}

document.getElementById('navbar-auth-btn-log-out').onclick = async function initLogOutBtn(event){
  event.preventDefault();
  try {
    logOut();
  } catch (e) {
    console.error(e);
  }
  location.pathname = '/';
};
