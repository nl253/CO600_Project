const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const TOPICS = [ 'AI', 'Anthropology', 'Archeology', 'Architecture', 'Arts', 'Biology', 'Chemistry', 'Computer Science', 'Design', 'Drama', 'Economics', 'Engineering', 'Geography', 'History', 'Humanities', 'Languages', 'Law', 'Linguistics', 'Literature', 'Mathematics', 'Medicine', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sciences', 'Social Sciences', 'Sociology', 'Theology'];

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
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array = []) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

/**
 * Returns the value of a cookie.
 *
 * @param {!String} name
 * @return {?String} cookie value
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
 * @param {!String} name
 * @param {{path: String, sameSite: 'Strict' | 'Lax', expires: Date}} opts
 * @param {!String} value
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
 * Clears a cookie.
 *
 * @param {!String} name
 */
function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
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
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating'} model
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
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'File'} model
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
