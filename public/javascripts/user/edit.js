// NOTE this is a workaround because Handlebars doesn't allow to reference
// user inside the "each" clause
(() => {
  for (const module of ([
    ...document.querySelectorAll(
        '#user-created-modules li a, #user-enrollments li a')]).filter(
      (el) => el.innerText.trim() === '')) {
    module.innerText = `unnamed #${module.parentElement.getAttribute(
        'data-id')}`;
  }

  document.querySelector(
      '#user-created-modules > .button:last-of-type').onclick = (e) => {
    e.preventDefault();
    return document.getElementById('layout-btn-create-module')
        .dispatchEvent(new Event('click'));
  };

  for (const enrollment of document.querySelectorAll('#user-enrollments > ul > li[data-id]')) {
    const moduleId = enrollment.getAttribute('data-module-id');
    enrollment.querySelector('.button.is-danger').onclick = async function(e) {
      e.preventDefault();
      if (!confirm('Unenroll from module?')) return;
      try {
        const response = await fetch(`/api/module/${moduleId}/unenroll`, {
          redirect: 'follow',
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });
        if (response.status >= 400) throw (await response.json());
        enrollment.remove();
        const list = enrollment.parentElement;
        if (list.querySelectorAll('li[data-id]').length === 0) {
          list.outerHTML = `
            <br>
            <p class="has-text-centered">You haven't enrolled in any modules.</p>`;
        }
      } catch (err) {
        const msg = json.msg || json.message || json.toString();
        console.error(msg);
        return alert(msg);
      }
    };
  }

  for (const module of document.querySelectorAll(
      '#user-created-modules li[data-id]')) {
    module.querySelector('.button.is-danger').onclick = async function(e) {
      e.preventDefault();
      if (!confirm('Delete module?')) return;
      const moduleId = module.getAttribute('data-id');
      try {
        const response = await fetch(`/api/module/${moduleId}/delete`, {
          redirect: 'follow',
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include',
          headers: {Accept: 'application/json'},
        });
        if (response.status >= 400) throw (await response.json());
        const list = module.parentElement;
        module.remove();
        if (list.querySelectorAll('li[data-id]').length === 0) {
          list.outerHTML = `
          <br>
          <p class="has-text-centered">You haven't created any modules.</p>`;
        }
      } catch (err) {
        const msg = err.msg || err.message || err.toString();
        console.error(msg);
        return alert(msg);
      }
    };
  }

  document.getElementById('user-input-email').oninput = function() {
    this.style.background = this.value.match(/.{2,}@.{2,}\.(.{2,})/)
      ? '#e7fdd1'
      : '#ffbaba';
  };
  document.getElementById('user-password-new').oninput = function() {
    this.style.background = this.value.match(/.{6,}/) ? '#e7fdd1' : '#ffbaba';
  };
  document.getElementById('user-password-new-2').oninput = function() {
    const elPassword = document.getElementById('user-password-new');
    this.style.background = elPassword.value !== this.value
      ? '#ffbaba'
      : '#e7fdd1';
    elPassword.style.background = elPassword.value !== this.value
      ? '#ffbaba'
      : '#e7fdd1';
  };
  let tab;
  const query = location.search
      .slice(1)
      .split('&')
      .map((s) => s.split('=')).find((q) => q[0] === 'tab');
  tab = query ? query[1] : sessionStorage.getItem('homeTab');
  switch (tab) {
    case 'created-modules':
      return toggleTabCreatedModules();
    case 'enrollments':
      return toggleTabEnrollments();
    case 'personal-details':
      return toggleTabPersonalDetails();
    default:
      return toggleTabEnrollments();
  }
})();
