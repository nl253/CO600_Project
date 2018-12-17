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
    httpOnly: false,
    sameSite: 'Strict',
    // expires: new Date(Date.now() + HOUR * 2),
  }, opts);
  document.cookie = [
    [name, value].map(encodeURIComponent),
    // ['Expires', options.expires.toGMTString()],
    ['Path', options.path],
    ['SameSite', options.sameSite]
  ].map((pair) => pair.join('=')).join('; ');
}

/**
 * Query the database for objects.
 *
 * @param {Object} query
 * @return {Promise<Array<Object>>}
 */
async function get(name, query = {}, force = false) {
  function tryCache() {
    const memory = sessionStorage.getItem(`${location.pathname}${name.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`);
    if (!memory) return false;
    console.debug(`using cache for ${name} with ${Object.keys(query).join(', ')}`);
    return JSON.parse(memory)
  }
  async function tryFetch() {
    try {
      console.debug(`using AJAX for ${name} with ${Object.keys(query).join(', ')}`);
      const results = await fetch(`/api/${name.toLowerCase()}/search?${Object.entries(query)
        .map(pair => pair.join('='))
        .join('&')}`, {
        headers: {Accept: 'application/json'},
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        cache: 'no-cache',
      }).then(res => res.json()).then(json => json.result);
      sessionStorage.setItem(`${location.pathname}${name.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`, JSON.stringify(results));
      return results;
    } catch (e) {
      const msg = e.msg || e.message || e.toString();
      console.error(msg);
      return alert(msg);
    }
  }
  return (force && await tryFetch()) || tryCache() || await tryFetch();
}


/**
 * Create a new object in the database.
 *
 * @param {String} name e.g. User, Lesson, Module
 * @param {*} postData
 * @return {Promise} promise of created object
 */
async function create(name, postData = '') {
  try {
    return await fetch(`/api/${name.toLowerCase()}/create`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    }).then(res => res.json()).then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Upadate an object in the database.
 *
 * @param {String} model e.g. User, Lesson, Module
 * @param {*} postData
 * @return {Promise} promise of updated object
 */
async function update(model, id, postData, contentType = 'application/json') {
  try {
    return await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'post',
      headers: contentType ? {Accept: 'application/json', 'Content-Type': contentType} : {'Accept': 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    }).then(res => res.json()).then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Destroy an object from the database.
 *
 * @param {String} name e.g. User, Module, Lesson
 * @param {Number} id
 * @return {Promise<*>}
 */
async function destroy(name, id) {
  try {
    const response = await fetch(`/api/${name.toLowerCase()}/${id}`, {
      method: 'delete',
      headers: {Accept: 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    return await response.json().then(json => json.result);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}
