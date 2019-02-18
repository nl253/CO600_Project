const BTN_SEARCH = document.querySelector('.button.is-link[type=submit]');
const LIST_MODS = document.getElementById('module-search-results');
const BTN_CREATED = document.getElementById('module-search-btn-date-created');
const BTN_UPDATED = document.getElementById('module-search-btn-date-updated');
const DROPDOWN_TOPICS = document.querySelector('select');
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
  ".panel .panel-block[id^='module-search-btn-date']")) {
  btn.onclick = function setDate() {
    for (const otherBtn of document.querySelectorAll(
      ".panel .panel-block[id^='module-search-btn-date'].is-active")) {
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
    ".panel .panel-block[id^='module-search-btn-date'].is-active")) {
    otherBtn.classList.remove('is-active');
  }
  BTN_UPDATED.dispatchEvent(new MouseEvent('click'));
  DROPDOWN_TOPICS.value = '';
  BTN_DATE_OLDER.dispatchEvent(new MouseEvent('click'));
  FIRST_STAR.dispatchEvent(new MouseEvent('click'));
};

/**
 * @param name
 * @param topic
 * @param summary
 * @param avg
 */
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

/**
 * @param {!Number} moduleId
 * @returns {Promise<?Number>}
 */
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

BTN_SEARCH.onclick = async function runSearch(e) {
  e ? e.preventDefault() : null;
  showModal('Searching For Modules');
  LIST_MODS.innerHTML = '';
  const searchParams = {};
    searchParams.q = SEARCH_BAR.value.trim();
    searchParams.topic = DROPDOWN_TOPICS.value;
    const dateScheme = BTN_CREATED.classList.contains('is-active')
      ? 'createdAt'
      : 'updatedAt';
    searchParams.stars = getLitStars();
    let date = new Date(0);

    const dateBtnSel = document.querySelector(".panel-block[id^='module-search-btn-date'].is-active");

    if (dateBtnSel) {
      const dateStr = dateBtnSel.innerText.trim().toLocaleLowerCase();
      const dateRegex = /(\d+)\s*([a-z]+)/i;
      const match = dateRegex.exec(dateStr);
      if (match) {
        const amount = parseInt(match[1]);
        const period = match[2].toLocaleLowerCase();
        if (period.indexOf('w') >= 0) {
          date = new Date(Date.now() - (WEEK * amount));
        } else if (period.indexOf('m') >= 0) {
          date = new Date(Date.now() - (MONTH * amount));
        } else if (period.indexOf('y') >= 0) {
          date = new Date(Date.now() - (YEAR * amount));
        }
        searchParams[dateScheme] = amount.toString() + period;
      }
    }

  try {
    await get('Module', {
      name: searchParams.q,
      topic: searchParams.topic,
      [dateScheme]: date.toISOString(),
    }).then(modules => Promise.all(
      modules.map(m => getRating(m.id).then(avg => {
        if (avg >= searchParams.stars || (searchParams.stars === 1 && avg === null)) {
          m.avg = avg;
          appendMod(m);
        }
      }))));
  } catch (e) {
    console.error(e);
  }

  history.pushState(null, 'FreeLearn - Module Query', `/module/search?${Object.entries(searchParams).map(pair => pair.join('=')).join('&')}`);
  return hideModal();
};

(function initModSearchPage() {
  if (!location.search || location.search.trim() === '?') return;
  for (const pair of location.search.slice(1).trimLeft().split('&').map(pair => pair.split('='))) {
    const [k, v] = pair;
    if (k === 'name' || k === 'q') SEARCH_BAR.value = v;
    else if (k === 'topic') DROPDOWN_TOPICS.value = v;
    else if (k === 'stars') {
      document.querySelector( `.panel .button.is-small.is-block.is-light:nth-of-type(${v})`).dispatchEvent(new MouseEvent('click'));
    } else if (k.indexOf('updated') >= 0 || k.indexOf('createdAt') >= 0) {
      const amount = /(\d+)/.exec(v)[1];
      (k === 'updatedAt'? BTN_UPDATED : BTN_CREATED).dispatchEvent(new MouseEvent('click'));
      let period;
      if (v.indexOf('w') >= 0) period = 'week';
      else if (v.indexOf('y') >= 0) period = 'year';
      else if (v.indexOf('m') >= 0) period = 'month';
      else continue;
      document.getElementById(`module-search-btn-date-${period}-${amount}`).dispatchEvent(new MouseEvent('click'));
    }
  }
  return BTN_SEARCH.dispatchEvent(new MouseEvent('click'));
})();

