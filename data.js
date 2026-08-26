/* Полісся-Продукт — стартові дані сайту.
   Усе, що редагується в адмін-панелі, зберігається в localStorage
   і має пріоритет над цими значеннями. */

const SITE_IMG = 'https://polissya-product.ua/images/';

const TYPES = [
  { id: 'app',   label: 'Знижка з додатком',      short: 'З ДОДАТКОМ', bg: '#2b1f1a',
    note: 'Ціна діє при скануванні картки у мобільному додатку «Полісся-Продукт».' },
  { id: 'multi', label: 'Від двох одиниць',       short: 'ВІД 2 ШТ',   bg: '#8c3313',
    note: 'Акційна ціна діє при купівлі двох і більше одиниць товару.' },
  { id: 'daily', label: 'Акційна ціна щодня',     short: 'ЦІНА ЩОДНЯ', bg: '#c04a20',
    note: 'Знижена ціна діє щодня протягом усього періоду каталогу.' },
  { id: 'draw',  label: 'Розіграші та подарунки', short: 'РОЗІГРАШ',   bg: '#7a4a1f',
    note: 'Умови участі, перелік призів і дату визначення переможців дивіться на фото акції.' }
];

const seq = (dir, n, ext) =>
  Array.from({ length: n }, (_, i) => SITE_IMG + dir + (i + 1) + (ext || '.png'));

const APP_PAGES = seq('2026/07/mobil_dodatok/', 18);
const MULTI_PAGES = seq('2026/07/08/', 31);

const DEFAULT_ITEMS = [
  { id: 1, title: 'Знижки з мобільним застосунком', period: 'діє по 31.08.2026', type: 'app', status: 'active',
    cover: APP_PAGES[0], pages: APP_PAGES },
  { id: 2, title: 'Від двох одиниць дешевше', period: 'діє по 31.08.2026', type: 'multi', status: 'active',
    cover: MULTI_PAGES[0], pages: MULTI_PAGES },
  { id: 3, title: 'Розіграш iPhone 17 Pro від Battery', period: 'діє по 31.08.2026', type: 'draw', status: 'active',
    cover: 'assets/promo/draw-battery.jpg', pages: ['assets/promo/draw-battery.jpg'] },
  { id: 4, title: 'Акційна ціна щодня', period: 'серпень 2026', type: 'daily', status: 'active',
    cover: SITE_IMG + 'aa62dea1-73b8-4d2d-8c3e-2512f4b09c5e.png',
    pages: [SITE_IMG + 'aa62dea1-73b8-4d2d-8c3e-2512f4b09c5e.png'] }
];

const DEFAULT_NEWS = [
  { id: 1, date: '12 серпня 2026', title: 'Новий магазин у Звягелі: 82-й у мережі',
    text: 'Відкриття на вул. Соборності — свіжа пекарня, кулінарія та відділ готової їжі.',
    photo: SITE_IMG + '2026/07/16/dodatok1.jpg' },
  { id: 2, date: '4 серпня 2026', title: 'Місцеві виробники на полицях: 40% асортименту',
    text: 'Молочне, м\'ясне та овочі від господарств Житомирщини — коротший шлях до полиці.',
    photo: SITE_IMG + 'DODATOK/polis.png' },
  { id: 3, date: '28 липня 2026', title: 'Піцерія «Полісся»: доставка у Житомирі',
    text: 'Тісто власного замісу, 12 позицій у меню та безкоштовна доставка від 300 грн.',
    photo: SITE_IMG + 'PICA/pica.jpg' }
];

const DEFAULT_JOBS = [
  { id: 1, title: 'Керуючий магазином',     terms: 'Повна зайнятість · навчання на місці', city: 'Житомир' },
  { id: 2, title: 'Продавець-консультант',  terms: 'Повна або часткова зайнятість',        city: 'Житомир' },
  { id: 3, title: 'Касир',                  terms: 'Змінний графік',                       city: 'Бердичів' },
  { id: 4, title: 'Вантажник',              terms: 'Повна зайнятість',                     city: 'Коростень' }
];

/* Номери піцерій із офіційної листівки. Замовлення забирається
   в тому ж магазині, де його зробили. Решту адрес додайте в адмінці. */
const DEFAULT_PIZZERIAS = [
  { id: 1, city: 'Житомир', addr: 'вул. Героїв Пожежних, 125А', phone: '(067) 488-82-35' },
  { id: 2, city: 'Житомир', addr: 'пров. Крилова, 14',          phone: '(067) 488-83-17' }
];

/* Приклади позицій меню. Ціни орієнтовні — уточніть і виправте в адмінці:
   на офіційному сайті вони є лише на фото-листівці. */
const U = id => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=1200&h=900&q=80';

const DEFAULT_PIZZAS = [
  { id: 1, name: 'Маргарита', size: '30 см', price: '179 ₴', photo: U('1513104890138-7c749659a591'),
    desc: 'Томатний соус, моцарела, свіжий базилік, оливкова олія.' },
  { id: 2, name: 'Пепероні', size: '30 см', price: '209 ₴', photo: U('1628840042765-356cda07504e'),
    desc: 'Салямі пепероні, моцарела, томатний соус, орегано.' },
  { id: 3, name: 'Чотири сири', size: '30 см', price: '229 ₴', photo: U('1574071318508-1cdbab80d002'),
    desc: 'Моцарела, дорблю, пармезан, сулугуні, вершковий соус.' },
  { id: 4, name: 'Гавайська', size: '30 см', price: '199 ₴', photo: U('1565299624946-b28f40a0ae38'),
    desc: 'Куряче філе, ананас, моцарела, томатний соус.' },
  { id: 5, name: 'М’ясна', size: '30 см', price: '239 ₴', photo: U('1571407970349-bc81e7e96d47'),
    desc: 'Шинка, охотничі ковбаски, бекон, моцарела, томатний соус.' },
  { id: 6, name: 'Овочева', size: '30 см', price: '189 ₴', photo: U('1594007654729-407eedc4be65'),
    desc: 'Печериці, солодкий перець, томати, маслини, моцарела.' }
];

const STORES = [
  { id: 'zt-1', city: 'Житомир',     addr: 'вул. Київська, 77',          hours: '08:00 – 22:00' },
  { id: 'zt-2', city: 'Житомир',     addr: 'вул. В. Бердичівська, 40',   hours: '07:30 – 23:00' },
  { id: 'zt-3', city: 'Житомир',     addr: 'вул. Хлібна, 14',            hours: '08:00 – 21:00' },
  { id: 'bd-1', city: 'Бердичів',    addr: 'вул. Європейська, 25',       hours: '08:00 – 22:00' },
  { id: 'bd-2', city: 'Бердичів',    addr: 'вул. Житомирська, 8',        hours: '08:00 – 21:00' },
  { id: 'ko-1', city: 'Коростень',   addr: 'вул. Грушевського, 51',      hours: '08:00 – 22:00' },
  { id: 'zv-1', city: 'Звягель',     addr: 'вул. Соборності, 12',        hours: '08:00 – 22:00' },
  { id: 'ml-1', city: 'Малин',       addr: 'вул. Приходька, 3',          hours: '08:00 – 21:00' },
  { id: 'ov-1', city: 'Овруч',       addr: 'вул. Т. Шевченка, 22',       hours: '08:00 – 21:00' },
  { id: 'rd-1', city: 'Радомишль',   addr: 'вул. Житомирська, 9',        hours: '08:00 – 21:00' },
  { id: 'ba-1', city: 'Баранівка',   addr: 'вул. Соборна, 41',           hours: '08:00 – 20:00' },
  { id: 'ol-1', city: 'Олевськ',     addr: 'вул. Володимирська, 6',      hours: '08:00 – 20:00' },
  { id: 'an-1', city: 'Андрушівка',  addr: 'вул. Тітова, 17',            hours: '08:00 – 20:00' },
  { id: 'ch-1', city: 'Чуднів',      addr: 'вул. Героїв Майдану, 2',     hours: '08:00 – 20:00' },
  { id: 'pp-1', city: 'Попільня',    addr: 'вул. Центральна, 30',        hours: '08:00 – 20:00' }
];

const PHOTOS = {
  hero: 'assets/home-together.png',
  vacancyPoster: 'assets/vacancy-poster.jpg',
  appPhone: SITE_IMG + 'DODATOK/dodatok1.jpg',
  appShot1: SITE_IMG + 'DODATOK/dodatok1.jpg',
  appShot2: SITE_IMG + 'DODATOK/dodatok3.jpg',
  pizzaHero: SITE_IMG + 'PICA/pica.jpg',
  pizzaPhones: SITE_IMG + 'PICA/pica2.png'
};

const CONTACTS = {
  hotline: '0-800-50-50-84',
  hotlineTel: 'tel:0800505084',
  purchases: '(098) 562-81-84',
  purchasesTel: 'tel:0985628184',
  hr1: '(097) 486-43-99',
  hr1Tel: 'tel:+380974864399',
  hr2: '(098) 219-33-46',
  hr2Tel: 'tel:+380982193346',
  email: 'polissia-product.ua@ukr.net',
  playStore: 'https://play.google.com/store/apps/details?id=io.uployal.polissyaproduct&hl=uk',
  appStore: 'https://apps.apple.com/us/app/%D0%BF%D0%BE%D0%BB%D1%96%D1%81%D1%81%D1%8F-%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82/id1624658585',
  loyaltyRules: 'https://drive.google.com/file/d/1uuLja1frLzYLtsluoGVVyFJst4lPEyLh/view?usp=share_link'
};

/* Код входу в адмін-панель. Змініть перед публікацією.
   Вхід: Ctrl+Shift+A або 5 кліків по рядку копірайту у футері. */
const ADMIN_PIN = '2002';
