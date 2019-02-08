const LIST_MODS = document.getElementById('module-search-results');
const BTN_CREATED = document.getElementById('module-search-btn-date-created');
const BTN_UPDATED = document.getElementById('module-search-btn-date-updated');
const TOPIC_DROPDOWN = document.querySelector('select');
const SEARCH_BAR = document.querySelector('input[type=search]');
const BTN_DATE_OLDER = document.getElementById('module-search-btn-date-older');
const FIRST_STAR = document.querySelector(
  '.button.is-small.is-block.is-light:first-of-type');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
const NO_STARS = 5;

BTN_CREATED.onclick = function activateDateCreated() {
  BTN_UPDATED.classList.remove('is-active');
  BTN_CREATED.classList.add('is-active');
};

BTN_UPDATED.onclick = function activateDateUpdated() {
  BTN_UPDATED.classList.add('is-active');
  BTN_CREATED.classList.remove('is-active');
};

for (const btn of document.querySelectorAll(
  '.panel .panel-block[id^=\'module-search-btn-date\']')) {
  btn.onclick = function setDate() {
    for (const otherBtn of document.querySelectorAll(
      '.panel .panel-block[id^=\'module-search-btn-date\'].is-active')) {
      otherBtn.classList.remove('is-active');
    }
    btn.classList.add('is-active');
  };
}

for (let i = 1; i <= NO_STARS; i++) {
  const starBtn = document.querySelector(`.panel .button.is-small.is-block:nth-of-type(${i})`);
  starBtn.onclick = function toggleStar() {
    for (let j = i + 1; j <= NO_STARS; j++) {
      const otherStarBtn = document.querySelector(`.panel .button.is-small.is-block:nth-of-type(${j})`);
      otherStarBtn.classList.remove('is-warning');
    }
    starBtn.classList.add('is-warning');
    for (let j = i - 1; j >= 1; j--) {
      const otherStarBtn = document.querySelector(`.panel .button.is-small.is-block:nth-of-type(${j})`);
      otherStarBtn.classList.add('is-warning');
    }
  };
}

document.querySelector(
  '.button.is-warning[type=reset]').onclick = function resetFilters() {
  for (const otherStar of document.querySelectorAll(
    '.panel .button.is-small.is-block.is-warning')) {
    otherStar.classList.remove('is-warning');
  }
  for (const otherBtn of document.querySelectorAll(
    '.panel .panel-block[id^=\'module-search-btn-date\'].is-active')) {
    otherBtn.classList.remove('is-active');
  }
  BTN_UPDATED.dispatchEvent(new MouseEvent('click'));
  TOPIC_DROPDOWN.value = '';
  BTN_DATE_OLDER.dispatchEvent(new MouseEvent('click'));
  FIRST_STAR.dispatchEvent(new MouseEvent('click'));
};

function appendMod({id, name, topic, summary, avg}) {
  const newEl = document.createElement('div');
  newEl.classList.add('box');
  newEl.onclick = () => location.href = `/module/${id}`;
  let str = `<div class="media-content"> 
               <div class="content">
                 <p class="is-size-6">
                   <a href="/module/${id}"><strong>${name ? name : 'Unnamed #' + id.toString()}</strong></a>`;
  if (topic) str += `<br><strong class="h6">${topic}</strong><br>`;
  if (avg) str += `<br> ${Array(Math.round(avg)).fill(0).map(_ => `<i class="fas fa-star"></i>`).join(' ')}<br>`;
  if (summary) str += `
                   <br>${summary}`;
  str += `       </p>
               </div>
             </div>`;
  newEl.innerHTML = str;
  LIST_MODS.appendChild(newEl);
}

async function getRating(moduleId) {
  const ratings = await get('Rating', {moduleId});
  if (ratings.length === 0) return null;
  let n = 0;
  let total = 0;
  for (const r of ratings) {
    n++;
    total += r.stars;
  }
  return Math.round(total / n);
}

/**
 * @returns {!Number} stars
 */
function getLitStars() {
  for (let i = 5; i >= 1; i--) {
    const starBtn = document.querySelector( `.panel .button.is-small.is-block.is-light:nth-of-type(${i})`);
    if (starBtn.classList.contains('is-warning')) {
      return i;
    }
  }
  return 1;
}

document.querySelector(
  '.button.is-link[type=submit]').onclick = async function runSearch() {
  showModal('Searching For Modules');
  LIST_MODS.innerHTML = '';
  try {
    const query = SEARCH_BAR.value.trim();
    const topic = TOPIC_DROPDOWN.value;
    const dateScheme = BTN_CREATED.classList.contains('is-active')
      ? 'createdAt'
      : 'updatedAt';
    let stars = getLitStars();
    let date = new Date(0);

    const dateBtnSel = document.querySelector(
      '[id^=\'module-search-btn-date\'].is-active');

    if (dateBtnSel) {
      const dateStr = dateBtnSel.innerText.trim().toLocaleLowerCase();
      const dateRegex = /(\d+)\s*([a-z]+)/i;
      const match = dateRegex.exec(dateStr);
      if (match) {
        const amount = parseInt(match[1]);
        const period = match[2].toLocaleLowerCase();
        if (period === 'week') {
          date = new Date(Date.now() - (WEEK * amount));
        } else if (period === 'month') {
          date = new Date(Date.now() - (MONTH * amount));
        } else if (period === 'year') {
          date = new Date(Date.now() - (YEAR * amount));
        }
      }
    }

    await get('Module', {
      name: query,
      topic,
      [dateScheme]: date.toISOString(),
    }).then(modules => Promise.all(
      modules.map(m => getRating(m.id).then(avg => {
        if (avg >= stars || (stars === 1 && avg === null)) {
          m.avg = avg;
          appendMod(m);
        }
      }))));
  } catch (e) {
    console.error(e);
  }
  return hideModal();
};
