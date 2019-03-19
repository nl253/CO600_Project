(function initUserSearchPage() {
  const searchBtn = document.getElementById('user-search-btn');
  if (!searchBtn) return;

  searchBtn.onclick = async function(e) {
    showModal('Searching');
    e.target.setAttribute('disabled', 'true');
    e.target.style.pointerEvents = 'none';
    document.getElementById('user-search-results').innerHTML = '';
    // don't send the HTML form
    e.preventDefault();
    const query = document.getElementById('user-search-bar').value;
    try {
      const users = {};
      const fromEmail = get('User', {email: query});
      const fromLastName = get('User', {lastName: query});
      for (const u of await fromEmail) users[u.id] = u;
      for (const u of await fromLastName) users[u.id] = u;
      history.pushState(
        null, 'FreeLearn - User Query', `/user/search?q=${query}`);
      for (const u of Object.values(users)) {
        document.getElementById('user-search-results').innerHTML +=
          `<div class="box" onclick="location.pathname = '/user/${u.id}'">
              <div class="media-content">
                <div class="content">
                  <p class="is-size-6">
                    ${u.firstName && u.lastName 
                      ? `<a href="/user/${u.id}"><strong>${u.firstName} ${u.lastName}</strong></a><br><br>`
                      : ''
                     }
                    ${u.info ? `<span>${u.info}</span><br><br>` : ''}
                    <a href="/user/${u.id}"><strong>${u.email}</strong></a>
                    <br>
                  </p>
                </div>
              </div>
            </div>`;
      }
      e.target.removeAttribute('disabled');
      e.target.style.pointerEvents = 'initial';
    } catch (e) {
      console.error(e);
      alert(e);
    } finally {
      hideModal();
    }
  };

  if (location.search) {
    const query = location.search.slice(1).trimLeft();
    const dict = query.split('&').map(pair => pair.split('='));
    for (const pair of dict) {
      const [k, v] = pair;
      if (k === 'name' || k === 'email' || k === 'lastName' || k === 'q') {
        document.getElementById('user-search-results').innerHTML = '';
        const searchBar = document.getElementById('user-search-bar');
        searchBar.value = decodeURIComponent(v);
        searchBtn.dispatchEvent(new MouseEvent('click'));
        break;
      }
    }
  }
})();

