(function() {
  const searchBtn = document.getElementById('user-search-btn');
  if (!searchBtn) return;

  const cfg = {redirect: 'follow'};


  /**
   * @param {String} email
   * @returns {Promise<String|Array<{id: !Number}>>}
   */
  async function getFromEmail(email) {
    const res = await fetch(`/api/user/search?email=${email}`, cfg);
    return res.status >= 400
      ? Promise.reject(await res.json().then(err => err.msg))
      : await res.json().then(json => json.result);
  }

  /**
   * @param {String} lastName
   * @returns {Promise<String|Array<{id: !Number}>>}
   */
  async function getFromLastName(lastName) {
    const res = await fetch(`/api/user/search?lastName=${lastName}`, cfg);
    return res.status >= 400
      ? Promise.reject(await res.json().then(err => err.msg))
      : await res.json().then(json => json.result);
  }

  searchBtn.onclick = async (event) => {
    document.getElementById('user-search-results').innerHTML = '';
    // don't send the HTML form
    event.preventDefault();
    const query = document.getElementById('user-search-bar').value;
    try {
      const users = new Set();
      for (const u of await getFromEmail(query)) {
        users.add(u);
      }
      for (const u of await getFromLastName(query)) {
        users.add(u);
      }
      for (const u of users) {
        document.getElementById('user-search-results').innerHTML +=
          `<div class="box" onclick="location.path = "/user/${u.id}">
              <div class="media-content">
                <div class="content">
                  <p class="is-size-6">
                    ${u.firstName && u.lastName ?
            `<strong>${u.firstName} ${u.lastName}</strong><br><br>` :
            ''}
                    ${u.info ? `<span>${u.info}</span><br><br>` : ''}
                    <a href="/user/${u.id}"><strong>${u.email}</strong></a>
                    <br>
                  </p>
                </div>
              </div>
            </div>`;
      }
    } catch (e) {
      console.error(e);
      alert(e);
    }
  };
})();
