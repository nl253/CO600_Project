/**
 * Logs the user out by sending a logout request.
 */
async function logOut() {
  try {
    const res = await fetch('/api/user/logout', {
      redirect: 'follow',
      cache: 'no-cache',
      credentials: 'include',
    });
    // sessionStorage.clear();
    if (res.status >= 400) {
      throw new Error('logging out failed');
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Sets the value of a cookie.
 *
 * @param {!String} name
 * @param {!String} value
 * @param {{path: !String, sameSite: 'Strict' | 'Lax', httpOnly: ?Boolean, signed: ?Boolean}} [opts]
 */
function setCookie(name, value, opts = {}) {
  console.warn(`setting cookie ${name} to ${value}`);
  const options = Object.assign({
    httpOnly: false,
    path: '/',
    sameSite: 'Strict',
    signed: true,
  }, opts);
  let cookieStr = [
    [name, encodeURIComponent(value)],
    ['Path', options.path],
  ].map((pair) => pair.join('=')).join('; ');
  if (options.httpOnly) cookieStr += '; HttpOnly';
  if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
  if (options.signed) cookieStr += '; Signed';
  console.warn(cookieStr);
  document.cookie = cookieStr;
}

/**
 * @private
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'Enrollment'} model
 * @param {Object} [query]
 * @returns {false, Array<{id: !Number, createdAt: !Date, updatedAt: !Date}>}
 */
function _tryCache(model, query = {}) {
  if (document.cache === undefined) document.cache = {};
  const hit = document.cache[`${model.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`];
  if (hit === undefined) return false;
  console.debug(`CACHE HIT for ${model} with ${Object.keys(query).join(', ')}`);
  return hit;
}

/**
 * @private
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'Enrollment'} model
 * @param {Object} [query]
 * @param {?Boolean} [doSave]
 * @returns {false|Array<{id: !Number, createdAt: !Date, updatedAt: !Date}>}
 */
async function _tryFetch(model, query = {}, doSave = false) {
  try {
    console.debug(`AJAX for ${model} with { ${Object.keys(query).join(', ')} }`);
    const response = await fetch(`/api/${model.toLowerCase()}/search?${Object.entries(query)
      .map(pair => pair.join('='))
      .join('&')}`, {
      headers: {Accept: 'application/json'},
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    const data = (await response.json()).result;
    if (doSave) {
      if (document.cache === undefined) document.cache = {};
      document.cache[`${model.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`] = data;
    }
    return data;
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}

/**
 * Query the database for objects.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'Enrollment'} model
 * @param {!Object} [query]
 * @param {?Boolean} [force]
 * @param {?Boolean} [doSave]
 * @return {Promise<!Array<{id: !Number, createdAt: !Date, updatedAt: !Date}>>}
 */
async function get(model, query = {}, force = true, doSave = false) {
  return (force && await _tryFetch(model, query, doSave)) || _tryCache(model, query) || await _tryFetch(model, query, doSave);
}

/**
 * Create a new object in the database.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'Enrollment'} model
 * @param {!Blob|!BufferSource|!FormData|!URLSearchParams|!ReadableStream|!String} [postData]
 * @return {Promise<void|{id: !Number, createdAt: !Date, updatedAt: !Date}>} created object
 */
async function create(model, postData = '') {
  try {
    const res = await fetch(`/api/${model.toLowerCase()}/create`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    });
    return (await res.json()).result;
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
}

/**
 * Update an object in the database.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating'} model
 * @param {!Number} id
 * @param {!Blob|!BufferSource|!FormData|!URLSearchParams|!ReadableStream|!String} postData
 * @param {?String} [contentType]
 * @return {Promise<Response>} promise of updated object
 */
async function update(model, id, postData, contentType = 'application/json') {
  const headers = {Accept: 'application/json'};
  if (contentType) headers['Content-Type'] = contentType;
  try {
    const res = await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'post',
      headers,
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    });
    if (res.status >= 400) {
      return Promise.reject((await res.json()).msg);
    } else return (await res.json()).msg;
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
}

/**
 * Destroy an object from the database.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'File', 'Enrollment'} model
 * @param {!Number} id
 * @return {Promise<void|!String>}
 */
async function destroy(model, id) {
  try {
    const res = await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'delete',
      headers: {Accept: 'application/json'},
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    return (await res.json()).msg;
  } catch (e) {
    console.error(e);
    return alert(e.msg || e.message || e.toString());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  /** Strip email suffix. I.e. all after the '@' at symbol. */
  const emailRegex = /([A-Za-z0-9.]+)@([A-Za-z0-9.]+)/;
  for (const greeting of document.getElementsByClassName('greeting-email')) {
    const match = emailRegex.exec(greeting.innerText);
    if (match !== null) {
      greeting.innerText = greeting.innerText.replace(match[0], ` ${match[1]} `);
    }
  }
});
