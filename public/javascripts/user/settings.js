document.getElementById('user-btn-modify-details').onclick = async (event) => {
  showModal('Saving');
  const resetBtn = document.getElementById('settings-btn-reset');
  try {
    event.preventDefault();
    event.target.setAttribute('disabled', 'true');
    event.target.style.pointerEvents = 'none';
    resetBtn.setAttribute('disabled', 'true');
    resetBtn.style.pointerEvents = 'none';
    const details = {};
    const changedAttrs = [];
    const emailEl = document.getElementById('user-input-email');
    details.email = emailEl.value;
    const infoEl = document.getElementById('user-info');
    details.info = infoEl.value === '' ? null : infoEl.value;
    const firstNameEl = document.getElementById('user-first-name');
    details.firstName = firstNameEl.value === '' ? null : firstNameEl.value;
    const lastNameEl = document.getElementById('user-last-name');
    details.lastName = lastNameEl.value === '' ? null : lastNameEl.value;
    for (const k of Object.keys(details)) changedAttrs.push(k);
    const detailsChangeResp = await fetch('/api/user', {
      method: 'POST',
      withCredentials: true,
      cache: 'no-cache',
      body: JSON.stringify(details),
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (detailsChangeResp.status >= 400) {
      const err = await detailsChangeResp.json();
      const msg = err.msg || err.message || err.toString();
      console.error(msg);
      hideModal();
      return alert(msg);
    }
    const elOldPass = document.getElementById('user-password-old');
    const elEmail = document.getElementById('user-input-email');
    if (elEmail.value === '' || elEmail.value.indexOf('@') <= 0 || elEmail.value.length <= 4) {
      hideModal();
      return alert('bad email format, cannot change password');
    }
    const elNewPass = document.getElementById('user-password-new');
    const elNewPass2 = document.getElementById('user-password-new-2');
    // if all password fields empty
    if ([elOldPass, elNewPass, elNewPass2].reduce((prev, cur) => cur.value === '' && prev, true)) {
      return hideModal();
    }
    changedAttrs.push('password');
    // if any passwords are empty
    if ([elOldPass, elNewPass, elNewPass2].reduce((prev, cur) => prev || cur.value === '', false)) {
      hideModal();
      return alert('empty password');
    }
    if (elNewPass.value !== elNewPass2.value) {
      hideModal();
      return alert('new passwords don\'t match');
    }
    if (elNewPass.value === elOldPass.value) {
      hideModal();
      return alert('old and new password are exactly the same');
    }
    const passChangeResp = await fetch('/api/user/password', Object.assign({
        method: 'POST',
        withCredentials: true,
        cache: 'no-cache',
        body: JSON.stringify(details),
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }, {
        body: JSON.stringify({
          value: elNewPass.value,
          password: elOldPass.value,
          email: elEmail.value,
        }),
      }),
    );
    if (passChangeResp.status >= 400) {
      const err = await passChangeResp.json();
      const msg = err.msg || err.message || err.toString();
      console.error(msg);
      hideModal();
      return alert(msg);
    }
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    hideModal();
    return alert(msg);
  } finally {
    event.target.removeAttribute('disabled');
    event.target.style.pointerEvents = 'initial';
    resetBtn.removeAttribute('disabled');
    resetBtn.style.pointerEvents = 'initial';
    return hideModal();
  }
};

