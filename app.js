/* Полісся-Продукт — логіка сайту (без залежностей).
   Зберігання редагованих даних: localStorage. */

'use strict';

const KEYS = {
  promos: 'polissya.promos.v5',
  news: 'polissya.news.v1',
  jobs: 'polissya.jobs.v1',
  zones: 'polissya.pizzerias.v2',
  pizzas: 'polissya.pizzas.v1',
  session: 'polissya.admin.session'
};

const TYPE_BY_ID = TYPES.reduce((a, t) => (a[t.id] = t, a), {});

/* ---------- utils ---------- */
const $ = sel => document.querySelector(sel);
const esc = v => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const T = v => String(v || '').trim();

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function readFile(file) {
  return new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res('');
    fr.readAsDataURL(file);
  });
}
const pagesWord = n => n === 1 ? 'сторінка' : (n < 5 ? 'сторінки' : 'сторінок');
const telHref = phone => 'tel:+38' + String(phone || '').replace(/\D/g, '');

/* ---------- state ---------- */
const state = {
  page: 'home',
  items: load(KEYS.promos, DEFAULT_ITEMS),
  news: load(KEYS.news, DEFAULT_NEWS),
  jobs: load(KEYS.jobs, DEFAULT_JOBS),
  zones: load(KEYS.zones, DEFAULT_PIZZERIAS),
  pizzas: load(KEYS.pizzas, DEFAULT_PIZZAS),
  sel: null,
  pageIdx: 0,
  tab: 'active',
  type: 'all',
  storeQ: '',
  activeStore: null,
  unlocked: false,
  pinOpen: false,
  pinError: false,
  taps: 0,
  adminTab: 'promos',
  form: null,      // { kind, id }  kind: promo|news|job|zone|pizza
  draft: {}
};

/* Вхід не зберігається: після перезавантаження сторінки потрібен код знову,
   щоб покупець ніколи не бачив кнопки «Адмінка». */
try { sessionStorage.removeItem(KEYS.session); } catch (e) {}

function go(page) {
  state.page = page;
  state.form = null;
  render();
  window.scrollTo(0, 0);
}

/* ---------- shared partials ---------- */
function promoCard(it) {
  const pages = it.pages || [];
  const type = TYPE_BY_ID[it.type] || TYPES[0];
  const cover = it.cover || pages[0];
  const count = pages.length;
  const badge = it.status === 'active' ? type.short : 'АРХІВ';
  const badgeBg = it.status === 'active' ? type.bg : '#7a6a62';
  return `
    <button class="promo" type="button" data-open="${it.id}">
      <span class="promo__media">
        ${cover ? `<img src="${esc(cover)}" alt="${esc(it.title)}">`
                : `<span class="promo__ph">фото листівки</span>`}
        <span class="promo__badge" style="background:${esc(badgeBg)}">${esc(badge)}</span>
      </span>
      <span class="promo__body">
        <span class="promo__title">${esc(it.title)}</span>
        <span class="promo__period">${esc(it.period)}</span>
        <span class="promo__foot">
          <span>${esc(type.label)} · ${count ? count + ' ' + pagesWord(count) : 'фото ще не додані'}</span>
          <b>Дивитись →</b>
        </span>
      </span>
    </button>`;
}

function newsCard(n) {
  return `
    <article class="news">
      <div class="news__media">${n.photo ? `<img src="${esc(n.photo)}" alt="${esc(n.title)}">` : ''}</div>
      <div class="news__body">
        <div class="news__date">${esc(n.date)}</div>
        <h3 class="news__title">${esc(n.title)}</h3>
        <p class="news__text">${esc(n.text)}</p>
      </div>
    </article>`;
}

/* ---------- pages ---------- */
function pageHome() {
  const featured = state.items.filter(i => i.status === 'active').slice(0, 4);
  return `
  <main>
    <section class="wrap section section--first">
      <div class="hero">
        <div>
          <div class="pill"><i></i>Нові акційні ціни щотижня</div>
          <h1>Магазин, що завжди<br>поруч з вами</h1>
          <p class="hero__lead">Найбільша регіональна мережа продуктових магазинів Житомирщини. Оптова та роздрібна торгівля продуктами харчування й напоями з 2002 року.</p>
          <div class="btn-row">
            <button class="btn btn--primary" data-nav="aktsii" type="button">Дивитись акції тижня</button>
            <button class="btn btn--ghost" data-nav="stores" type="button">Знайти магазин</button>
          </div>
          <div class="stats">
            <div><b>81</b><span>магазин у регіоні</span></div>
            <div><b>80 тис.</b><span>покупців щодня</span></div>
            <div><b>24 роки</b><span>на ринку</span></div>
          </div>
        </div>
        <div class="hero__media">
          <div class="frame frame--hero"><img src="${esc(PHOTOS.hero)}" alt="Покупці у магазині Полісся-Продукт" loading="eager"></div>
          <div class="hero__badge">
            <i>%</i>
            <div><b>Акції у додатку</b><span>Кешбек і персональні ціни</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="wrap section">
      <div class="section-head">
        <div>
          <div class="eyebrow">Акційні каталоги</div>
          <h2>Листівки, що діють зараз</h2>
        </div>
        <button class="btn btn--ghost btn--sm" data-nav="aktsii" type="button">Усі акції →</button>
      </div>
      <div class="grid grid--promos">${featured.map(promoCard).join('')}</div>
    </section>

    <section class="wrap section">
      <div class="grid grid--auto">
        <div class="card"><div class="card__num">01</div><div class="card__title">Завжди поруч</div><p class="card__text">81 магазин у Житомирі та районах області — не потрібно їхати за покупками далеко.</p></div>
        <div class="card"><div class="card__num">02</div><div class="card__title">Акційні ціни щодня</div><p class="card__text">Понад 300 позицій за зниженою ціною у кожному каталозі, який оновлюється двічі на місяць.</p></div>
        <div class="card"><div class="card__num">03</div><div class="card__title">Свіжість під контролем</div><p class="card__text">Власна логістика й щоденні поставки: молочне, хліб та овочі — прямо з регіону.</p></div>
        <div class="card"><div class="card__num">04</div><div class="card__title">Надійний партнер</div><p class="card__text">Оптова торгівля та розгалужена система дистрибуції для бізнесу по всій області.</p></div>
      </div>
    </section>

    <section class="wrap section">
      <div class="panel-dark panel-dark--split">
        <div>
          <div class="eyebrow">Про компанію</div>
          <h2 style="font-size:clamp(24px,4.6vw,34px);line-height:1.12;margin-bottom:20px">ТОВ ТК «Полісся-Продукт»</h2>
          <p style="margin-bottom:16px;text-wrap:pretty">Компанія, що за роки свого існування підтвердила репутацію надійного партнера. Підприємство піклується про наявність товару на полицях магазинів усієї області та має розгалужену систему оптової й роздрібної торгівлі.</p>
          <p style="text-wrap:pretty">Сьогодні «Полісся-Продукт» — це найбільша регіональна мережа магазинів, що знаходяться завжди поруч. Мережа активно зростає, створюючи нові робочі місця та даючи змогу все ширшій аудиторії купувати товар за акційними цінами щодня.</p>
        </div>
        <div class="metrics">
          <div class="metric"><b>2002</b><span>рік заснування</span></div>
          <div class="metric"><b>81</b><span>магазин мережі</span></div>
          <div class="metric"><b>80 000</b><span>покупців щодня</span></div>
          <div class="metric"><b>1 400+</b><span>працівників</span></div>
        </div>
      </div>
    </section>

    <section class="wrap section" id="dodatok">
      <div class="panel-light">
        <div>
          <div class="eyebrow">Мобільний додаток</div>
          <h2 style="font-size:clamp(24px,4.4vw,32px);line-height:1.14;margin-bottom:18px">Картка, акції та кешбек — у телефоні</h2>
          <p style="font-size:16px;line-height:1.65;color:var(--muted);margin-bottom:28px;max-width:460px">Каталог акцій, персональні ціни, електронна картка лояльності та історія покупок. Завантажуйте безкоштовно.</p>
          <div class="btn-row">
            <a class="btn btn--primary" href="${esc(CONTACTS.playStore)}">Google Play</a>
            <a class="btn btn--dark" href="${esc(CONTACTS.appStore)}">App Store</a>
          </div>
        </div>
        <div class="phone-frame"><img src="${esc(PHOTOS.appPhone)}" alt="Додаток Полісся-Продукт"></div>
      </div>
    </section>

    ${state.news.length ? `
    <section class="wrap section">
      <div class="section-head">
        <div>
          <div class="eyebrow">Новини мережі</div>
          <h2>Що нового у «Поліссі»</h2>
        </div>
      </div>
      <div class="grid grid--cards">${state.news.map(newsCard).join('')}</div>
    </section>` : ''}
  </main>`;
}

function pageAktsii() {
  const list = state.items.filter(it =>
    (state.tab === 'active' ? it.status === 'active' : it.status !== 'active') &&
    (state.type === 'all' || it.type === state.type));
  const activeCount = state.items.filter(i => i.status === 'active').length;
  const heroCover = (state.items.find(i => i.status === 'active') || {}).cover || '';
  const chips = [{ id: 'all', label: 'Усі види' }].concat(TYPES);

  return `
  <main class="wrap section--page">
    <div class="panel-dark panel-dark--split" style="margin-bottom:36px">
      <div>
        <div class="badge-hot">КАТАЛОГ ДІЄ ДО 31.08</div>
        <h1 style="font-size:clamp(27px,5.6vw,40px);line-height:1.08;margin-bottom:14px">Акції серпня</h1>
        <p style="max-width:440px">${activeCount} активні каталоги. Гортайте сторінки листівки просто на сайті — без завантаження PDF.</p>
      </div>
      <div class="hero-cover">
        ${heroCover ? `<img src="${esc(heroCover)}" alt="Каталог акцій">`
                    : `<span>обкладинка<br>каталогу-листівки</span>`}
      </div>
    </div>

    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${state.tab === 'active'}" data-tab="active" type="button">Актуальні</button>
      <button role="tab" aria-selected="${state.tab === 'archive'}" data-tab="archive" type="button">Архів</button>
    </div>

    <div class="filters">
      ${chips.map(c => `<button class="chip" aria-pressed="${state.type === c.id}" data-type="${esc(c.id)}" type="button">${esc(c.label)}</button>`).join('')}
    </div>

    <div class="grid grid--promos" style="padding-bottom:8px">${list.map(promoCard).join('')}</div>
    ${list.length ? '' : `<div style="text-align:center;padding:64px 0;color:var(--muted-2);font-size:15px">Тут поки немає каталогів.</div>`}
  </main>`;
}

function pageSingle() {
  const cur = state.items.find(i => i.id === state.sel) || state.items[0];
  if (!cur) return `<main class="wrap section--page"><p>Каталог не знайдено.</p></main>`;
  const type = TYPE_BY_ID[cur.type] || TYPES[0];
  const pages = (cur.pages && cur.pages.length) ? cur.pages : (cur.cover ? [cur.cover] : []);
  const idx = Math.min(state.pageIdx, Math.max(0, pages.length - 1));
  const many = pages.length > 1;
  const badge = cur.status === 'active' ? type.short : 'АРХІВ';
  const badgeBg = cur.status === 'active' ? type.bg : '#7a6a62';

  return `
  <main class="wrap" style="padding-top:clamp(18px,4vw,32px)">
    <button class="link-back" data-nav="aktsii" type="button">← Усі акції</button>
    <div class="single-head">
      <div>
        <span class="type-badge" style="background:${esc(badgeBg)}">${esc(badge)}</span>
        <h1>${esc(cur.title)}</h1>
        <div class="meta">${esc(type.label)} · ${esc(cur.period)} · ${pages.length ? pages.length + ' ' + pagesWord(pages.length) : 'фото ще не додані'}</div>
      </div>
      <div class="btn-row btn-row--tight">
        <button class="btn btn--primary btn--sm" data-nav="stores" type="button">Найближчий магазин</button>
        <button class="btn btn--ghost btn--sm" data-nav="aktsii" type="button">Інші каталоги</button>
      </div>
    </div>

    <div class="viewer">
      <div class="viewer__stage">
        ${pages.length
          ? `<img src="${esc(pages[idx])}" alt="Сторінка ${idx + 1}">`
          : `<div class="viewer__ph">сторінки листівки<br>завантажуються в адмін-панелі</div>`}
        ${many ? `
          <button class="viewer__nav viewer__nav--prev" data-step="-1" type="button" aria-label="Попередня сторінка">‹</button>
          <button class="viewer__nav viewer__nav--next" data-step="1" type="button" aria-label="Наступна сторінка">›</button>
          <div class="viewer__count">${idx + 1} / ${pages.length}</div>` : ''}
      </div>
      ${many ? `
      <div class="thumbs">
        ${pages.map((src, i) => `
          <button class="thumb" aria-current="${i === idx}" data-page="${i}" type="button">
            <img src="${esc(src)}" alt="">
          </button>`).join('')}
      </div>` : ''}
    </div>
    <p class="note">${esc(type.note)} Ціни діють у всіх магазинах мережі за наявності товару, кількість обмежена.</p>
  </main>`;
}

function pageStores() {
  const q = state.storeQ.trim().toLowerCase();
  const list = STORES.filter(s => !q ||
    s.city.toLowerCase().includes(q) || s.addr.toLowerCase().includes(q));
  return `
  <main class="wrap section--page">
    <div style="margin-bottom:28px">
      <div class="eyebrow">Контакти</div>
      <h1 style="font-size:clamp(27px,5.4vw,40px);margin-bottom:12px">Магазини мережі</h1>
      <p style="font-size:16px;color:var(--muted);max-width:600px">Знайдіть найближчий магазин: введіть місто або вулицю, або клікніть позначку на карті.</p>
    </div>
    <div class="stores">
      <div class="stores__list">
        <div class="field"><input id="storeQ" value="${esc(state.storeQ)}" placeholder="Місто або вулиця…" aria-label="Пошук магазину"></div>
        <div class="stores__scroll">
          ${list.map(s => `
            <button class="store" type="button" data-store="${esc(s.id)}" aria-current="${state.activeStore === s.id}">
              <b>${esc(s.city)}</b><span>${esc(s.addr)}</span><em>Щодня ${esc(s.hours)}</em>
            </button>`).join('')}
        </div>
        ${list.length ? '' : `<div style="padding:24px 8px;color:var(--muted-2);font-size:14px;text-align:center">Нічого не знайдено</div>`}
      </div>
      <div class="map" id="mapSlot"></div>
    </div>
    <div class="grid grid--cards" style="margin-top:28px">
      <div class="card contact"><b>Гаряча лінія</b><a href="${esc(CONTACTS.hotlineTel)}">${esc(CONTACTS.hotline)}</a><span>Безкоштовно з усіх номерів України</span></div>
      <div class="card contact"><b>Відділ закупок</b><a href="${esc(CONTACTS.purchasesTel)}">${esc(CONTACTS.purchases)}</a><span>Пропозиції постачальників</span></div>
      <div class="card contact"><b>Пошта</b><a class="email" href="mailto:${esc(CONTACTS.email)}">${esc(CONTACTS.email)}</a><span>Відповідаємо протягом дня</span></div>
    </div>
  </main>`;
}

function pageVacancies() {
  return `
  <main class="wrap section--page">
    <div class="grid grid--split" style="margin-bottom:44px">
      <div>
        <div class="eyebrow">Кар'єра</div>
        <h1 style="font-size:clamp(28px,5.6vw,42px);line-height:1.06;margin-bottom:16px">Робота поруч з домом</h1>
        <p style="font-size:16.5px;line-height:1.65;color:var(--muted);margin-bottom:24px;max-width:520px">Мережа активно зростає й створює нові робочі місця по всій Житомирщині. Запрошуємо у свою команду — навчаємо на місці, графік узгоджуємо.</p>
        <div class="btn-row">
          <a class="btn btn--primary btn--sm" href="${esc(CONTACTS.hr1Tel)}">${esc(CONTACTS.hr1)}</a>
          <a class="btn btn--ghost btn--sm" href="${esc(CONTACTS.hr2Tel)}">${esc(CONTACTS.hr2)}</a>
        </div>
      </div>
      <div class="poster"><img src="${esc(PHOTOS.vacancyPoster)}" alt="Оголошення про вакансії Полісся-Продукт"></div>
    </div>

    <section style="margin-bottom:44px">
      <div class="eyebrow">Відкриті позиції</div>
      <h2 style="margin-bottom:24px;font-size:clamp(24px,4.6vw,34px)">Кого шукаємо зараз</h2>
      <div class="stack">
        ${state.jobs.map(j => `
          <div class="job">
            <div>
              <div class="job__title">${esc(j.title)}</div>
              <div class="job__terms">${esc(j.terms)}</div>
            </div>
            <div>
              <div class="job__label">Місто</div>
              <div class="job__city">${esc(j.city)}</div>
            </div>
            <a class="job__call" href="${esc(CONTACTS.hr1Tel)}">
              <small>Зателефонувати</small><b>${esc(CONTACTS.hr1)}</b>
            </a>
          </div>`).join('')}
      </div>
      ${state.jobs.length ? '' : `<div class="empty">Наразі відкритих позицій немає. Зателефонуйте — можливо, вакансія з’явиться найближчим часом.</div>`}
    </section>

    <div class="grid grid--promos">
      <div class="card" style="border-radius:18px">
        <div class="eyebrow" style="color:var(--brand);letter-spacing:.1em;margin-bottom:12px">01</div>
        <div class="card__title" style="margin-bottom:6px">Знайдіть свою позицію</div>
        <p class="card__text" style="font-size:14.5px">Перелік відкритих вакансій — у списку вище. Оновлюється щомісяця.</p>
      </div>
      <div class="card" style="border-radius:18px">
        <div class="eyebrow" style="color:var(--brand);letter-spacing:.1em;margin-bottom:12px">02</div>
        <div class="card__title" style="margin-bottom:6px">Зателефонуйте або напишіть</div>
        <p class="card__text" style="font-size:14.5px">Відділ кадрів: <a href="${esc(CONTACTS.hr1Tel)}">${esc(CONTACTS.hr1)}</a>, <a href="${esc(CONTACTS.hr2Tel)}">${esc(CONTACTS.hr2)}</a>.</p>
      </div>
      <div class="card" style="border-radius:18px">
        <div class="eyebrow" style="color:var(--brand);letter-spacing:.1em;margin-bottom:12px">03</div>
        <div class="card__title" style="margin-bottom:6px">Або завітайте в магазин</div>
        <p class="card__text" style="font-size:14.5px">Залиште резюме адміністратору найближчого магазину мережі.</p>
      </div>
    </div>
  </main>`;
}

function pagePizza() {
  return `
  <main class="wrap section--page">
    <div class="panel-dark panel-dark--split" style="border-radius:28px;margin-bottom:40px">
      <div>
        <div class="eyebrow" style="color:#c0aa9d">Піцерія «Полісся»</div>
        <h1 style="font-size:clamp(28px,5.6vw,42px);line-height:1.06;margin-bottom:16px">Піца на тісті власного замісу</h1>
        <p style="max-width:480px;margin-bottom:28px">Замовляйте у найближчій піцерії мережі — у кожної свій номер телефону.</p>
        <a class="btn btn--primary" href="#pizzerias">Номери піцерій ↓</a>
      </div>
      <div class="frame" style="aspect-ratio:1/1;border-radius:20px;border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.05)">
        <img src="${esc(PHOTOS.pizzaHero)}" alt="Піца Полісся">
      </div>
    </div>

    <section id="pizzerias" style="margin-bottom:40px">
      <div class="section-head" style="margin-bottom:20px">
        <div>
          <div class="eyebrow">Замовлення</div>
          <h2 style="font-size:clamp(24px,4.6vw,30px)">Телефон вашої піцерії</h2>
        </div>
        <span style="font-size:14px;color:var(--muted-2);max-width:340px">Кожен магазин приймає замовлення на свій номер — так швидше.</span>
      </div>
      ${state.zones.length
        ? `<div class="grid grid--zones">
            ${state.zones.map(z => `
              <div class="zone">
                <b>${esc(z.city)}</b><span>${esc(z.addr)}</span>
                <a href="${esc(telHref(z.phone))}">${esc(z.phone)}</a>
              </div>`).join('')}
           </div>`
        : `<div class="leaflet"><img src="${esc(PHOTOS.pizzaPhones)}" alt="Телефони піцерій Полісся"></div>`}
    </section>

    <section style="margin-bottom:40px">
      <div class="section-head" style="margin-bottom:20px">
        <div>
          <div class="eyebrow">Меню</div>
          <h2 style="font-size:clamp(24px,4.6vw,30px)">Наші піци</h2>
        </div>
      </div>
      ${state.pizzas.length
        ? `<div class="grid grid--menu">
            ${state.pizzas.map(p => `
              <div class="pizza">
                <div class="pizza__media">${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}">` : ''}</div>
                <div class="pizza__body">
                  <div class="pizza__head">
                    <div class="pizza__name">${esc(p.name)}</div>
                    <span class="pizza__price">${esc(p.price || 'ціна в піцерії')}</span>
                  </div>
                  <p class="pizza__desc">${esc(p.desc)}</p>
                  <div class="pizza__size">${esc(p.size)}</div>
                </div>
              </div>`).join('')}
           </div>`
        : `<div class="empty">Меню оновлюється. Актуальні позиції та ціни уточнюйте за телефоном піцерії — номери вище.</div>`}
    </section>

    <div class="grid grid--promos">
      <div class="card"><div class="card__title" style="margin-bottom:6px">Тісто власного замісу</div><p class="card__text" style="font-size:14.5px">Готуємо на місці, у магазинах мережі.</p></div>
      <div class="card"><div class="card__title" style="margin-bottom:6px">Замовлення по телефону</div><p class="card__text" style="font-size:14.5px">Номер своєї піцерії шукайте у списку вище.</p></div>
      <div class="card"><div class="card__title" style="margin-bottom:6px">Акційні ціни</div><p class="card__text" style="font-size:14.5px">Актуальні пропозиції дивіться в <button class="link-inline" data-nav="aktsii" type="button" style="background:none;border:0;padding:0;color:var(--brand);font:inherit;cursor:pointer">каталозі акцій</button> та в додатку.</p></div>
    </div>
  </main>`;
}

function pageApp() {
  const facts = [
    ['Нарахування', 'Стандартний кешбек — 1% від суми покупки. Бонуси заокруглюються до повних чисел і нараховуються впродовж кількох секунд.'],
    ['Списання', 'Можна частково розраховуватись бонусами, різницю доплачуєте коштами. При розрахунку бонусами кешбек не нараховується.'],
    ['Штрих-код на касі', 'Щоб відкрити штрих-код, натисніть центральну кнопку на нижній панелі додатка. Для сканування потрібен інтернет.'],
    ['Запрошуйте друзів', 'Меню «Інше» → «Запросіть друга»: поділіться реферальним кодом. 200 бонусів — після першої покупки друга з додатком.'],
    ['Пластикова картка', 'Усі накопичені бали переходять у додаток автоматично. Без додатка картка працює до кінця поточного року — достатньо назвати цифри зі штрих-коду.'],
    ['Ще питання?', 'У додатку є розділ «Часті питання» із повною інформацією про програму лояльності.']
  ];
  return `
  <main class="wrap section--page">
    <div class="grid grid--split">
      <div>
        <div class="eyebrow">Додаток</div>
        <h1 style="font-size:clamp(28px,5.8vw,44px);line-height:1.05;margin-bottom:18px">Уся мережа —<br>в одному додатку</h1>
        <p style="font-size:17px;line-height:1.65;color:var(--muted);margin-bottom:32px;max-width:500px">Програма лояльності «Полісся-Продукт» — без пластикової картки. Накопичуйте та витрачайте бонуси, отримуйте кешбек і дізнавайтесь першими про акційні пропозиції.</p>
        <div class="steps">
          <div class="step"><i>1</i><div><b>200 балів за реєстрацію</b><span>Нараховуємо автоматично одразу після реєстрації в додатку.</span></div></div>
          <div class="step"><i>2</i><div><b>Кешбек 1% від покупки</b><span>1 бонус = 1 копійка. За покупку на 100 грн — 1 бонус.</span></div></div>
          <div class="step"><i>3</i><div><b>Акції «Купуй з додатком»</b><span>Окремі знижки лише для користувачів додатка та участь у розіграшах.</span></div></div>
        </div>
        <div class="btn-row" style="margin-bottom:16px">
          <a class="btn btn--primary" href="${esc(CONTACTS.playStore)}">Google Play</a>
          <a class="btn btn--dark" href="${esc(CONTACTS.appStore)}">App Store</a>
        </div>
        <a href="${esc(CONTACTS.loyaltyRules)}" style="font-size:14.5px;font-weight:600">Офіційні правила програми лояльності →</a>
      </div>
      <div class="shots">
        <div class="shot"><img src="${esc(PHOTOS.appShot1)}" alt="Екран додатка"></div>
        <div class="shot shot--offset"><img src="${esc(PHOTOS.appShot2)}" alt="Бонуси в додатку"></div>
      </div>
    </div>

    <section class="section">
      <div class="eyebrow">Як це працює</div>
      <h2 style="margin-bottom:26px;font-size:clamp(24px,4.6vw,34px)">Бонуси та кешбек</h2>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));align-items:stretch">
        ${facts.map(([t, d]) => `<div class="card"><div class="card__title" style="margin-bottom:8px">${esc(t)}</div><p class="card__text" style="font-size:14.5px;line-height:1.65">${esc(d)}</p></div>`).join('')}
      </div>
      <p class="fine">* Кешбек нараховується на всі категорії товарів, окрім тютюну.</p>
    </section>
  </main>`;
}

/* ---------- admin ---------- */
const ADMIN_TABS = [
  { id: 'promos', label: 'Акції',    heading: 'Керування акціями' },
  { id: 'news',   label: 'Новини',   heading: 'Керування новинами' },
  { id: 'jobs',   label: 'Вакансії', heading: 'Керування вакансіями' },
  { id: 'pizza',  label: 'Піца',     heading: 'Керування піцерією' }
];

function formIs(kind) { return state.form && state.form.kind === kind; }
function formTitleWord() { return state.form && state.form.id ? 'Редагувати' : 'Додати'; }

function promoForm() {
  const d = state.draft;
  const pages = d.pages || [];
  return `
  <div class="form-card">
    <div class="form-card__title">${state.form.id ? 'Редагувати каталог' : 'Новий каталог акцій'}</div>
    <div class="fields">
      <label class="field">Назва каталогу
        <input data-draft="title" value="${esc(d.title)}" placeholder="напр. Акції 16–31 серпня">
      </label>
      <label class="field">Період дії
        <input data-draft="period" value="${esc(d.period)}" placeholder="16.08 – 31.08.2026">
      </label>
      <label class="field">Вид акції
        <select data-draft="type">
          ${TYPES.map(t => `<option value="${esc(t.id)}" ${d.type === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field">Статус
        <select data-draft="status">
          <option value="active" ${d.status === 'active' ? 'selected' : ''}>Показувати на сайті</option>
          <option value="archive" ${d.status !== 'active' ? 'selected' : ''}>В архіві</option>
        </select>
      </label>
    </div>
    <div class="fields">
      <div class="drop">
        <div class="drop__thumb">${d.cover ? `<img src="${esc(d.cover)}" alt="">` : ''}</div>
        <label class="field" style="flex:1">Обкладинка (1 фото)
          <input type="file" accept="image/*" data-file="cover">
          <span class="hint">Формат 4:3, горизонтально. Рекомендовано <b>1600×1200 px</b> (мін. 800×600). JPG або PNG до 2 МБ.</span>
        </label>
      </div>
      <label class="field drop drop--col">Сторінки листівки (можна кілька фото)
        <input type="file" accept="image/*" multiple data-file="pages">
        <span class="hint">Скани листівки як є — обрізка не потрібна. Рекомендовано ширину <b>1600–1900 px</b> (як на сайті: 1875×1250). Порядок = порядок вибору файлів.</span>
        <span class="hint">${pages.length ? 'Завантажено фото: ' + pages.length : 'Фото сторінок ще не вибрані'}</span>
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary btn--sm" data-save="promo" type="button">Зберегти</button>
      <button class="btn btn--ghost btn--sm" data-cancel="1" type="button">Скасувати</button>
      <span class="hint">${state.form.id ? 'Зміни застосуються одразу на сайті' : 'Каталог з’явиться першим у списку'}</span>
    </div>
  </div>`;
}

function newsForm() {
  const d = state.draft;
  return `
  <div class="form-card">
    <div class="form-card__title">${state.form.id ? 'Редагувати новину' : 'Нова новина'}</div>
    <div class="fields">
      <label class="field">Заголовок
        <input data-draft="title" value="${esc(d.title)}" placeholder="напр. Новий магазин у Звягелі">
      </label>
      <label class="field">Дата
        <input data-draft="date" value="${esc(d.date)}" placeholder="12 серпня 2026">
      </label>
    </div>
    <label class="field" style="margin-bottom:16px">Короткий текст
      <textarea data-draft="text" rows="3" placeholder="Два-три рядки про подію.">${esc(d.text)}</textarea>
    </label>
    <div class="drop" style="max-width:440px;margin-bottom:22px">
      <div class="drop__thumb drop__thumb--wide">${d.photo ? `<img src="${esc(d.photo)}" alt="">` : ''}</div>
      <label class="field" style="flex:1">Фото новини
        <input type="file" accept="image/*" data-file="photo">
        <span class="hint">Формат 16:10, горизонтально. Рекомендовано <b>1600×1000 px</b> (мін. 800×500). Обрізається по центру — головне тримайте в середині кадру.</span>
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary btn--sm" data-save="news" type="button">Зберегти</button>
      <button class="btn btn--ghost btn--sm" data-cancel="1" type="button">Скасувати</button>
    </div>
  </div>`;
}

function jobForm() {
  const d = state.draft;
  return `
  <div class="form-card">
    <div class="form-card__title">${formTitleWord()} вакансію</div>
    <div class="fields">
      <label class="field">Посада
        <input data-draft="title" value="${esc(d.title)}" placeholder="напр. Продавець-консультант">
      </label>
      <label class="field">Умови
        <input data-draft="terms" value="${esc(d.terms)}" placeholder="Повна зайнятість · графік 4/2">
      </label>
      <label class="field">Місто
        <input data-draft="city" value="${esc(d.city)}" placeholder="Житомир">
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary btn--sm" data-save="job" type="button">Зберегти</button>
      <button class="btn btn--ghost btn--sm" data-cancel="1" type="button">Скасувати</button>
    </div>
  </div>`;
}

function zoneForm() {
  const d = state.draft;
  return `
  <div class="form-card">
    <div class="form-card__title">${formTitleWord()} піцерію</div>
    <div class="fields">
      <label class="field">Місто
        <input data-draft="city" value="${esc(d.city)}" placeholder="Житомир">
      </label>
      <label class="field">Адреса
        <input data-draft="addr" value="${esc(d.addr)}" placeholder="вул. Київська, 77">
      </label>
      <label class="field">Телефон
        <input data-draft="phone" value="${esc(d.phone)}" placeholder="(097) 486-43-99">
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary btn--sm" data-save="zone" type="button">Зберегти</button>
      <button class="btn btn--ghost btn--sm" data-cancel="1" type="button">Скасувати</button>
    </div>
  </div>`;
}

function pizzaForm() {
  const d = state.draft;
  return `
  <div class="form-card">
    <div class="form-card__title">${formTitleWord()} позицію меню</div>
    <div class="fields">
      <label class="field">Назва
        <input data-draft="name" value="${esc(d.name)}" placeholder="Пепероні">
      </label>
      <label class="field">Розмір
        <input data-draft="size" value="${esc(d.size)}" placeholder="30 см">
      </label>
      <label class="field">Ціна
        <input data-draft="price" value="${esc(d.price)}" placeholder="219 ₴">
      </label>
    </div>
    <label class="field" style="margin-bottom:16px">Склад
      <textarea data-draft="desc" rows="2" placeholder="Салямі пепероні, моцарела, томатний соус, орегано.">${esc(d.desc)}</textarea>
    </label>
    <div class="drop" style="max-width:440px;margin-bottom:22px">
      <div class="drop__thumb drop__thumb--wide">${d.photo ? `<img src="${esc(d.photo)}" alt="">` : ''}</div>
      <label class="field" style="flex:1">Фото піци
        <input type="file" accept="image/*" data-file="photo">
        <span class="hint">Формат 4:3, горизонтально. Рекомендовано <b>1200×900 px</b> (мін. 600×450). Піца по центру кадру.</span>
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary btn--sm" data-save="pizza" type="button">Зберегти</button>
      <button class="btn btn--ghost btn--sm" data-cancel="1" type="button">Скасувати</button>
    </div>
  </div>`;
}

function rowActions(kind, id) {
  return `<div class="table__actions">
    <button class="btn btn--xs btn--chip" data-edit="${kind}:${id}" type="button">Змінити</button>
    <button class="btn btn--xs btn--danger" data-remove="${kind}:${id}" type="button">Видалити</button>
  </div>`;
}

function pageAdmin() {
  const tab = ADMIN_TABS.find(t => t.id === state.adminTab) || ADMIN_TABS[0];
  let addButtons = '';
  if (tab.id === 'promos') addButtons = `
    <button class="btn btn--ghost btn--sm" data-nav="aktsii" type="button">Переглянути каталог</button>
    <button class="btn btn--primary btn--sm" data-new="promo" type="button">+ Новий каталог</button>`;
  if (tab.id === 'news') addButtons = `<button class="btn btn--primary btn--sm" data-new="news" type="button">+ Нова новина</button>`;
  if (tab.id === 'jobs') addButtons = `<button class="btn btn--primary btn--sm" data-new="job" type="button">+ Нова вакансія</button>`;
  if (tab.id === 'pizza') addButtons = `
    <button class="btn btn--ghost btn--sm" data-new="zone" type="button">+ Піцерія</button>
    <button class="btn btn--primary btn--sm" data-new="pizza" type="button">+ Позиція меню</button>`;

  let body = '';

  if (tab.id === 'promos') {
    body = `
      ${formIs('promo') ? promoForm() : ''}
      <div class="table cols-promos">
        <div class="table__row table__row--head"><div>Фото</div><div>Каталог</div><div>Період</div><div>Сторінок</div><div>Статус</div><div></div></div>
        ${state.items.map(it => {
          const type = TYPE_BY_ID[it.type] || TYPES[0];
          const cover = it.cover || (it.pages || [])[0];
          const live = it.status === 'active';
          return `<div class="table__row">
            <div class="table__thumb">${cover ? `<img src="${esc(cover)}" alt="">` : ''}</div>
            <div style="font-weight:600">${esc(it.title)}<div class="table__sub">${esc(type.label)}</div></div>
            <div style="color:var(--muted)">${esc(it.period)}</div>
            <div style="color:var(--muted)">${(it.pages || []).length}</div>
            <div><span class="status ${live ? 'status--live' : 'status--archive'}">${live ? 'На сайті' : 'Архів'}</span></div>
            ${rowActions('promo', it.id)}
          </div>`;
        }).join('')}
        <div class="table__foot">Усього каталогів: ${state.items.length} · фото зберігаються у браузері цього комп'ютера</div>
      </div>`;
  }

  if (tab.id === 'news') {
    body = `
      ${formIs('news') ? newsForm() : ''}
      <div class="table cols-news">
        <div class="table__row table__row--head"><div>Фото</div><div>Новина</div><div>Дата</div><div></div></div>
        ${state.news.map(n => `<div class="table__row">
          <div class="table__thumb table__thumb--wide">${n.photo ? `<img src="${esc(n.photo)}" alt="">` : ''}</div>
          <div style="font-weight:600">${esc(n.title)}<div class="table__sub">${esc(n.text)}</div></div>
          <div style="color:var(--muted)">${esc(n.date)}</div>
          ${rowActions('news', n.id)}
        </div>`).join('')}
        <div class="table__foot">Усього новин: ${state.news.length} · показуються на головній у блоці «Що нового у Поліссі»</div>
      </div>`;
  }

  if (tab.id === 'jobs') {
    body = `
      ${formIs('job') ? jobForm() : ''}
      <div class="table cols-jobs">
        <div class="table__row table__row--head"><div>Посада</div><div>Умови</div><div>Місто</div><div></div></div>
        ${state.jobs.map(j => `<div class="table__row">
          <div style="font-weight:600">${esc(j.title)}</div>
          <div style="color:var(--muted)">${esc(j.terms)}</div>
          <div style="color:var(--muted)">${esc(j.city)}</div>
          ${rowActions('job', j.id)}
        </div>`).join('')}
        <div class="table__foot">Відкритих позицій: ${state.jobs.length} · показуються на сторінці «Вакансії»</div>
      </div>`;
  }

  if (tab.id === 'pizza') {
    body = `
      ${formIs('zone') ? zoneForm() : ''}
      ${formIs('pizza') ? pizzaForm() : ''}
      <div class="table cols-zones">
        <div class="table__row table__row--head"><div>Місто</div><div>Адреса</div><div>Телефон</div><div></div></div>
        ${state.zones.map(z => `<div class="table__row">
          <div style="font-weight:600">${esc(z.city)}</div>
          <div style="color:var(--muted)">${esc(z.addr)}</div>
          <div class="strong-brand">${esc(z.phone)}</div>
          ${rowActions('zone', z.id)}
        </div>`).join('')}
        <div class="table__foot">Піцерій у списку: ${state.zones.length}${state.zones.length ? '' : ' · поки список порожній, на сторінці показується листівка з номерами з сайту'}</div>
      </div>
      <div class="table cols-menu">
        <div class="table__row table__row--head"><div>Фото</div><div>Позиція</div><div>Розмір</div><div>Ціна</div><div></div></div>
        ${state.pizzas.map(p => `<div class="table__row">
          <div class="table__thumb table__thumb--wide">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ''}</div>
          <div style="font-weight:600">${esc(p.name)}<div class="table__sub">${esc(p.desc)}</div></div>
          <div style="color:var(--muted)">${esc(p.size)}</div>
          <div class="strong-brand">${esc(p.price || '—')}</div>
          ${rowActions('pizza', p.id)}
        </div>`).join('')}
        <div class="table__foot">Позицій у меню: ${state.pizzas.length}${state.pizzas.length ? '' : ' · поки меню порожнє, на сторінці стоїть підказка телефонувати в піцерію'}</div>
      </div>`;
  }

  return `
  <main class="wrap section--page">
    <div class="admin-head">
      <div>
        <div class="eyebrow">Адмін-панель</div>
        <h1>${esc(tab.heading)}</h1>
      </div>
      <div class="btn-row btn-row--tight">
        <button class="btn btn--ghost btn--sm" id="lockAdmin" type="button">Вийти</button>
        ${addButtons}
      </div>
    </div>
    <div class="tabs" style="margin-bottom:24px" role="tablist">
      ${ADMIN_TABS.map(t => `<button role="tab" aria-selected="${t.id === tab.id}" data-admintab="${t.id}" type="button">${esc(t.label)}</button>`).join('')}
    </div>
    ${body}
  </main>`;
}

/* ---------- pin modal ---------- */
function pinModal() {
  if (!state.pinOpen) return '';
  return `
  <div class="modal">
    <div class="modal__box">
      <h2>Вхід для персоналу</h2>
      <p>Керування сайтом доступне лише працівникам мережі. Введіть службовий код.</p>
      <input id="pinInput" type="password" placeholder="Код доступу" autocomplete="off">
      ${state.pinError ? `<div class="modal__err">Невірний код. Спробуйте ще раз.</div>` : ''}
      <div class="modal__actions">
        <button class="btn btn--primary" id="pinSubmit" type="button">Увійти</button>
        <button class="btn btn--ghost" id="pinCancel" type="button">Скасувати</button>
      </div>
    </div>
  </div>`;
}

/* ---------- persistent map iframe ----------
   Карта живе поза render(): вузол створюється один раз і переноситься
   в новий контейнер, щоб map.html не перезавантажувався. */
let mapFrame = null;
let mapReady = false;
let pendingFocus = null;

function mountMap() {
  const slot = document.getElementById('mapSlot');
  if (!slot) return;
  if (!mapFrame) {
    mapFrame = document.createElement('iframe');
    mapFrame.id = 'storeMap';
    mapFrame.title = 'Карта магазинів';
    mapFrame.addEventListener('load', () => {
      mapReady = true;
      if (pendingFocus) { focusStore(pendingFocus); pendingFocus = null; }
    });
    mapFrame.src = 'map.html';
  }
  if (mapFrame.parentNode !== slot) slot.replaceChildren(mapFrame);
}

function focusStore(id) {
  if (!mapFrame || !mapReady) { pendingFocus = id; return; }
  try { mapFrame.contentWindow.postMessage({ type: 'focus-store', id }, '*'); } catch (e) {}
}

/* ---------- render ---------- */
const PAGES = {
  home: pageHome, aktsii: pageAktsii, single: pageSingle, stores: pageStores,
  vacancies: pageVacancies, pizza: pagePizza, app: pageApp, admin: pageAdmin
};

function render() {
  if (state.page === 'admin' && !state.unlocked) state.page = 'home';
  const fn = PAGES[state.page] || pageHome;
  $('#view').innerHTML = fn();
  $('#modalRoot').innerHTML = pinModal();
  $('#adminLink').hidden = !state.unlocked;
  document.querySelectorAll('#nav .nav__btn').forEach(b => {
    const on = b.dataset.nav === state.page ||
      (state.page === 'single' && b.dataset.nav === 'aktsii');
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const pin = $('#pinInput');
  if (pin) pin.focus();
  if (state.page === 'stores') mountMap();
}

/* ---------- CRUD ---------- */
const BLANK = {
  promo: { title: '', period: '', type: 'app', status: 'active', cover: '', pages: [] },
  news:  { date: '', title: '', text: '', photo: '' },
  job:   { title: '', terms: '', city: '' },
  zone:  { city: '', addr: '', phone: '' },
  pizza: { name: '', desc: '', size: '30 см', price: '', photo: '' }
};
const LISTS = {
  promo: { key: KEYS.promos, prop: 'items' },
  news:  { key: KEYS.news,   prop: 'news' },
  job:   { key: KEYS.jobs,   prop: 'jobs' },
  zone:  { key: KEYS.zones,  prop: 'zones' },
  pizza: { key: KEYS.pizzas, prop: 'pizzas' }
};

function build(kind, d, id) {
  if (kind === 'promo') return T(d.title) ? {
    id, title: T(d.title), period: T(d.period) || '—',
    type: d.type || 'app', status: d.status || 'active',
    cover: d.cover || '', pages: d.pages || []
  } : null;
  if (kind === 'news') return T(d.title) ? {
    id, date: T(d.date) || '—', title: T(d.title), text: T(d.text), photo: d.photo || ''
  } : null;
  if (kind === 'job') return T(d.title) ? {
    id, title: T(d.title), terms: T(d.terms) || 'Повна зайнятість', city: T(d.city) || 'Житомир'
  } : null;
  if (kind === 'zone') return T(d.phone) ? {
    id, city: T(d.city) || 'Житомир', addr: T(d.addr), phone: T(d.phone)
  } : null;
  if (kind === 'pizza') return T(d.name) ? {
    id, name: T(d.name), desc: T(d.desc), size: T(d.size) || '30 см',
    price: T(d.price), photo: d.photo || ''
  } : null;
  return null;
}

function openForm(kind, id) {
  const cfg = LISTS[kind];
  const rec = id ? state[cfg.prop].find(x => String(x.id) === String(id)) : null;
  state.form = { kind, id: rec ? rec.id : null };
  state.draft = Object.assign({}, BLANK[kind], rec || {});
  render();
  window.scrollTo(0, 0);
}

function saveForm(kind) {
  const cfg = LISTS[kind];
  const id = state.form && state.form.id ? state.form.id : Date.now();
  const rec = build(kind, state.draft, id);
  if (!rec) return;
  const list = state.form && state.form.id
    ? state[cfg.prop].map(x => (String(x.id) === String(rec.id) ? rec : x))
    : (kind === 'promo' || kind === 'news' ? [rec].concat(state[cfg.prop]) : state[cfg.prop].concat([rec]));
  state[cfg.prop] = list;
  save(cfg.key, list);
  state.form = null;
  render();
}

function removeRec(kind, id) {
  const cfg = LISTS[kind];
  const list = state[cfg.prop].filter(x => String(x.id) !== String(id));
  state[cfg.prop] = list;
  save(cfg.key, list);
  state.form = null;
  render();
}

/* ---------- admin access ---------- */
function unlock(code) {
  if (T(code) !== ADMIN_PIN) { state.pinError = true; render(); return; }
  state.unlocked = true;
  state.pinOpen = false;
  state.pinError = false;
  state.taps = 0;
  go('admin');
}

function lock() {
  state.unlocked = false;
  try { sessionStorage.removeItem(KEYS.session); } catch (e) {}
  go('home');
}

/* ---------- events ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-nav],[data-open],[data-tab],[data-type],[data-step],[data-page],[data-store],[data-admintab],[data-new],[data-edit],[data-remove],[data-save],[data-cancel],#lockAdmin,#pinSubmit,#pinCancel,#secretTap');
  if (!t) return;

  if (t.dataset.nav) { go(t.dataset.nav); return; }

  if (t.dataset.open) {
    state.sel = state.items.find(i => String(i.id) === t.dataset.open)?.id ?? null;
    state.pageIdx = 0;
    go('single');
    return;
  }
  if (t.dataset.tab) { state.tab = t.dataset.tab; render(); return; }
  if (t.dataset.type) { state.type = t.dataset.type; render(); return; }
  if (t.dataset.step) {
    const cur = state.items.find(i => i.id === state.sel) || state.items[0];
    const pages = (cur.pages && cur.pages.length) ? cur.pages : (cur.cover ? [cur.cover] : []);
    if (pages.length) {
      const n = pages.length;
      state.pageIdx = (state.pageIdx + Number(t.dataset.step) + n) % n;
      render();
    }
    return;
  }
  if (t.dataset.page) { state.pageIdx = Number(t.dataset.page); render(); return; }
  if (t.dataset.store) {
    state.activeStore = t.dataset.store;
    render();
    focusStore(t.dataset.store);
    return;
  }
  if (t.dataset.admintab) { state.adminTab = t.dataset.admintab; state.form = null; render(); return; }
  if (t.dataset.new) { openForm(t.dataset.new, null); return; }
  if (t.dataset.edit) { const [k, id] = t.dataset.edit.split(':'); openForm(k, id); return; }
  if (t.dataset.remove) { const [k, id] = t.dataset.remove.split(':'); removeRec(k, id); return; }
  if (t.dataset.save) { saveForm(t.dataset.save); return; }
  if (t.dataset.cancel) { state.form = null; render(); return; }
  if (t.id === 'lockAdmin') { lock(); return; }
  if (t.id === 'pinSubmit') { unlock($('#pinInput').value); return; }
  if (t.id === 'pinCancel') { state.pinOpen = false; state.pinError = false; state.taps = 0; render(); return; }
  if (t.id === 'secretTap') {
    if (state.unlocked) { go('admin'); return; }
    state.taps += 1;
    if (state.taps >= 5) { state.taps = 0; state.pinOpen = true; state.pinError = false; render(); }
    return;
  }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'storeQ') { state.storeQ = el.value; renderKeepFocus('#storeQ'); return; }
  if (el.dataset && el.dataset.draft) { state.draft[el.dataset.draft] = el.value; }
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.file) return;
  const files = el.files;
  if (!files || !files.length) return;
  if (el.dataset.file === 'pages') {
    state.draft.pages = await Promise.all(Array.from(files).map(readFile));
  } else {
    state.draft[el.dataset.file] = await readFile(files[0]);
  }
  render();
});

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    if (state.unlocked) go('admin');
    else { state.pinOpen = true; state.pinError = false; render(); }
    return;
  }
  if (e.key === 'Enter' && e.target.id === 'pinInput') unlock(e.target.value);
  if (state.page === 'single' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const cur = state.items.find(i => i.id === state.sel) || state.items[0];
    const pages = (cur.pages && cur.pages.length) ? cur.pages : (cur.cover ? [cur.cover] : []);
    if (pages.length > 1) {
      const n = pages.length;
      state.pageIdx = (state.pageIdx + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      render();
    }
  }
});

function renderKeepFocus(sel) {
  const el = document.querySelector(sel);
  const pos = el ? el.selectionStart : null;
  render();
  const next = document.querySelector(sel);
  if (next) {
    next.focus();
    if (pos != null) try { next.setSelectionRange(pos, pos); } catch (e) {}
  }
}

window.addEventListener('message', e => {
  const d = e.data;
  if (d && d.type === 'store-click' && d.id) {
    state.activeStore = d.id;
    if (state.page === 'stores') render();
  }
});

render();
