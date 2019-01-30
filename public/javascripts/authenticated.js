if (sessionStorage.getItem('loggedIn') === undefined) {
  logOut().then(ok => {
    location.pathname = '/user/register';
  }).catch(err => {
    console.error(err);
    location.pathname = '/user/register';
  });
}

document.getElementById('navbar-auth-btn-log-out').onclick = async function initLogOutBtn(event) {
  event.preventDefault();
  try {
    await logOut();
  } catch (e) {
    console.error(e);
  } finally {
    return location.pathname = '/user/register';
  }
};
