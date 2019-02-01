(function() {
  const searchBtn = document.getElementById('user-search-btn');
  if (!searchBtn) return;

  searchBtn.onclick = async (e) => {
    showModal('Searching');
    e.target.setAttribute('disabled', 'true');
    e.target.style.pointerEvents = 'none';
    document.getElementById('user-search-results').innerHTML = '';
    // don't send the HTML form
    e.preventDefault();
    const query = document.getElementById('user-search-bar').value;
    try {
      const users = new Set();
      for (const u of await get('User', {email: query}, false, true)) {
        users.add(u);
      }
      for (const u of await get('User', {lastName: query}, false, true)) {
        users.add(u);
      }
      for (const u of users) {
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
})();
