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
