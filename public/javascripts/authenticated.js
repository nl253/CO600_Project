if (!sessionStorage.getItem('loggedIn')) {
  logOut()
    .then(ok => showModal('Your session expired'))
    .catch(err => console.error(err))
    .finally(() => setTimeout(() => {
      hideModal();
      location.pathname = '/user/register';
    }, 1200));
}

document.getElementById('navbar-auth-btn-log-out').onclick = async function initLogOutBtn(event) {
  event.preventDefault();
  try {
    await logOut();
  } catch (e) {
    console.error(e);
  } finally {
    showModal('Logging Out');
    return setTimeout(() => {
      hideModal();
      return location.pathname = '/user/register';
    }, 1200);
  }
};
