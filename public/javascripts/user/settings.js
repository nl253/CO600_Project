document.getElementById('user-btn-modify-details').onclick = async (event) => {
  try {
    event.preventDefault();
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
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (detailsChangeResp.status >= 400) {
      const err = await detailsChangeResp.json();
      const msg = err.msg || err.message || err.toString();
      console.error(msg);
      return alert(msg);
    }
    const json = await detailsChangeResp.json();
    const elOldPass = document.getElementById('user-password-old');
    const elEmail = document.getElementById('user-input-email');
    if (elEmail.value === '' || elEmail.value.indexOf('@') <= 0 ||
      elEmail.value.length <= 4) {
      return alert('bad email format, cannot change password');
    }
    const elNewPass = document.getElementById('user-password-new');
    const elNewPass2 = document.getElementById('user-password-new-2');
    // if all password fields empty
    if ([elOldPass, elNewPass, elNewPass2].reduce(
      (prev, cur) => cur.value === '' && prev, true)) {
      return alert(`successfully modified ${changedAttrs.join(', ')}`);
    }
    changedAttrs.push('password');
    // if any passwords are empty
    if ([elOldPass, elNewPass, elNewPass2].reduce(
      (prev, cur) => prev || cur.value === '', false)) {
      return alert('empty password');
    }
    if (elNewPass.value !== elNewPass2.value) {
      return alert('new passwords don\'t match');
    }
    if (elNewPass.value === elOldPass.value) {
      return alert('old and new password are exactly the same');
    }
    const passChangeResp = await fetch('/api/user/password', Object.assign({
        method: 'POST',
        withCredentials: true,
        cache: 'no-cache',
        body: JSON.stringify(details),
        redirect: 'follow',
        mode: 'cors',
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
      return alert(msg);
    } else {
      alert(`successfully modified ${changedAttrs.join(', ')}`);
    }
  } catch (e) {
    const msg = e.msg || e.message || e.toString();
    console.error(msg);
    return alert(msg);
  }
};

