if (!sessionStorage.getItem('loggedIn') || document.cookie.indexOf('token') < 0) {
  logOut().then(ok => {
    location.pathname = '/user/register';
  }).catch(err => {
    console.error(err);
    location.pathname = '/user/register';
  });
}

document.getElementById('navbar-auth-btn-log-out').onclick = async function initLogOutBtn(event){
  event.preventDefault();
  try {
    logOut();
  } catch (e) {
    console.error(e);
  } finally {
    location.pathname = '/';
  }
};
