const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * Returns the value of a cookie.
 *
 * @param {String} name
 * @return {String} cookie value
 */
function getCookie(name) {
  const pairs = document.cookie
      .split(';')
      .map((s) => s.trim())
      .map((s) => s.split('='))
      .map((pair) => pair.map(decodeURIComponent));
  const dictionary = {};
  for (const pair of pairs) {
    dictionary[pair[0]] = pair[1];
  }
  return dictionary[name];
}

/**
 * Sets the value of a cookie.
 *
 * @param {String} name
 * @param {{path: String, sameSite: 'Strict' | 'Lax', expires: Date}} opts
 * @param {String} value
 */
function setCookie(name, value, opts = {}) {
  const options = Object.assign({
    path: '/',
    sameSite: 'Strict',
    expires: new Date(Date.now() + HOUR * 2),
  }, opts);
  const cookieStr = [
    [name, value].map(encodeURIComponent), 
    ['Expires', options.expires.toGMTString()],
    ['Path', options.path],
    ['SameSite', options.sameSite]
  ].map((pair) => pair.join('=')).join('; ');
  console.log(cookieStr);
  document.cookie = cookieStr;
}

function toggleTabEnrollments(event) {
  document.getElementById('user-created-modules').classList.add('is-hidden');
  document.getElementById('user-enrollments').classList.remove('is-hidden');
  document.getElementById('user-personal-details').classList.add('is-hidden');
  document.getElementById('user-btn-personal-details').parentElement.classList.remove('is-active');
  document.getElementById('user-btn-created-modules-tab').parentElement.classList.remove('is-active');
  document.getElementById('user-btn-enrollments-tab').parentElement.classList.add('is-active');
  sessionStorage.setItem('homeTab', 'enrollments');
}

/**
 * @param event
 */
function toggleTabCreatedModules(event) {
  document.getElementById('user-personal-details').classList.add('is-hidden');
  document.getElementById('user-enrollments').classList.add('is-hidden');
  document.getElementById('user-created-modules').classList.remove('is-hidden');
  document.getElementById('user-btn-created-modules-tab').parentElement.classList.add('is-active');
  document.getElementById('user-btn-enrollments-tab').parentElement.classList.remove('is-active');
  document.getElementById('user-btn-personal-details').parentElement.classList.remove('is-active');
  sessionStorage.setItem('homeTab', 'created-modules');
}

/**
 * @param event
 */
function toggleTabPersonalDetails(event) {
  document.getElementById('user-personal-details').classList.remove('is-hidden');
  document.getElementById('user-enrollments').classList.add('is-hidden');
  document.getElementById('user-created-modules').classList.add('is-hidden');
  document.getElementById('user-btn-personal-details').parentElement.classList.add('is-active');
  document.getElementById('user-btn-created-modules-tab').parentElement.classList.remove('is-active');
  document.getElementById('user-btn-enrollments-tab').parentElement.classList.remove('is-active');
  sessionStorage.setItem('homeTab', 'personal-details');
}
