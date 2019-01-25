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

/**
 * Sets the value of a cookie.
 *
 * @param {!String} name
 * @param {{path: String, sameSite: 'Strict' | 'Lax', expires: Date}} opts
 * @param {!String} value
 */
function setCookie(name, value, opts = {}) {
  const options = Object.assign({
    path: '/',
    httpOnly: false,
    sameSite: 'Strict',
    // expires: new Date(Date.now() + process.env.SESSION_TIME),
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
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'Enrollment'} model
 * @param {!Object} query
 * @param {?Boolean} force
 * @return {Promise<!Array<{id: !Number, createdAt: !Date, updatedAt: !Date}>>}
 */
async function get(model, query = {}, force = true, doSave = false) {
  async function tryFetch(doSaveFetch = doSave) {
    try {
      console.debug(`using AJAX for ${model} with ${Object.keys(query).join(', ')}`);
      const response = await fetch(`/api/${model.toLowerCase()}/search?${Object.entries(query)
        .map(pair => pair.join('='))
        .join('&')}`, {
        headers: {Accept: 'application/json'},
        credentials: 'include',
        redirect: 'follow',
        cache: 'no-cache',
      });
      const json = await response.json();
      if (doSaveFetch) {
        sessionStorage.setItem(`${location.pathname}/${model.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`, JSON.stringify(json.result));
      }
      return json.result;
    } catch (e) {
      const msg = e.msg || e.message || e.toString();
      console.error(msg);
      return alert(msg);
    }
  }

  function tryCache() {
    const memory = sessionStorage.getItem(
      `${location.pathname}/${model.toLowerCase()}s?${Object.entries(query)
        .map(pair => pair.join('='))
        .join('&')}`);
    if (!memory) return false;
    console.debug(
      `using cache for ${model} with ${Object.keys(query).join(', ')}`);
    return JSON.parse(memory);
  }

  return (force && await tryFetch()) || tryCache() || await tryFetch();
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
    const response = await fetch(`/api/${model.toLowerCase()}/create`, {
      method: 'post',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    });
    const json = await response.json();
    return json.result;
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
 * @param {?String} contentType
 * @return {Promise<Response>} promise of updated object
 */
async function update(model, id, postData, contentType = 'application/json') {
  const headers = {
    Accept: [
      'application/json',
      'text/html',
      'application/xhtml+xml',
      'text/plain',
      '*'].join(', '),
  };
  if (contentType) headers['Content-Type'] = contentType;
  try {
    const response = await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'post',
      headers,
      credentials: 'include',
      redirect: 'follow',
      body: postData,
      cache: 'no-cache',
    });
    const json = await response.json();
    return response.status >= 400 ? Promise.reject(json.msg) : json.msg;
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
    const response = await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'delete',
      headers: {Accept: 'application/json'},
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    const json = await response.json();
    return json.msg;
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
