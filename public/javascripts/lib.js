const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

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
 * Query the database for objects.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating'} model
 * @param {!Object} query
 * @param {?Boolean} force
 * @return {Promise<!Array<{id: !Number, createdAt: !Date, updatedAt: !Date}>>}
 */
async function get(model, query = {}, force = false, doSave = true) {
  async function tryFetch(doSaveFetch = doSave) {
    try {
      console.debug(`using AJAX for ${model} with ${Object.keys(query).join(', ')}`);
      const results = await fetch(`/api/${model.toLowerCase()}/search?${Object.entries(query)
        .map(pair => pair.join('='))
        .join('&')}`, {
        headers: {Accept: 'application/json'},
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        cache: 'no-cache',
      }).then(res => res.json()).then(json => json.result);
      if (doSaveFetch) {
        sessionStorage.setItem(`${location.pathname}/${model.toLowerCase()}s?${Object.entries(query).map(pair => pair.join('=')).join('&')}`, JSON.stringify(results));
      }
      return results;
    } catch (e) {
      const msg = e.msg || e.message || e.toString();
      console.error(msg);
      return alert(msg);
    }
  }

  if (model.toLowerCase() === 'file') {
    return tryFetch(false);
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
 * @param {!FormData|!String} postData
 * @return {Promise<void|{id: !Number, createdAt: !Date, updatedAt: !Date}>} created object
 */
async function create(model, postData = '') {
  try {
    return await fetch(`/api/${model.toLowerCase()}/create`, {
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
 * Update an object in the database.
 *
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating'} model
 * @param {!Number} id
 * @param {!String|!FormData} postData
 * @param {?String} contentType
 * @return {Promise<void|{id: !Number createdAt: !Date, updatedAt: !Date}>} promise of updated object
 */
async function update(model, id, postData, contentType = 'application/json') {
  try {
    return await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'post',
      headers: contentType ? {Accept: 'application/json', 'Content-Type': contentType} : {Accept: 'application/json'},
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
 * @param {'User', 'Module', 'Lesson', 'Question', 'Rating', 'File'} model
 * @param {!Number} id
 * @return {Promise<void|!String>}
 */
async function destroy(model, id) {
  try {
    const response = await fetch(`/api/${model.toLowerCase()}/${id}`, {
      method: 'delete',
      headers: {Accept: 'application/json'},
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-cache',
    });
    return await response.json().then(json => json.msg);
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
}
