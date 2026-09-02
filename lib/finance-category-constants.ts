export const CATEGORY_COLORS = [
  { value: "red", bg: "bg-red-500", label: "Красный" },
  { value: "blue", bg: "bg-blue-500", label: "Синий" },
  { value: "green", bg: "bg-green-500", label: "Зелёный" },
  { value: "yellow", bg: "bg-yellow-500", label: "Жёлтый" },
  { value: "purple", bg: "bg-purple-500", label: "Фиолетовый" },
  { value: "pink", bg: "bg-pink-500", label: "Розовый" },
  { value: "orange", bg: "bg-orange-500", label: "Оранжевый" },
  { value: "teal", bg: "bg-teal-500", label: "Бирюзовый" },
  { value: "indigo", bg: "bg-indigo-500", label: "Индиго" },
  { value: "cyan", bg: "bg-cyan-500", label: "Голубой" },
  { value: "lime", bg: "bg-lime-500", label: "Лаймовый" },
  { value: "amber", bg: "bg-amber-500", label: "Янтарный" },
  { value: "violet", bg: "bg-violet-500", label: "Сиреневый" },
  { value: "rose", bg: "bg-rose-500", label: "Розовый" },
  { value: "slate", bg: "bg-slate-500", label: "Серый" },
];

export type IconGroupType = "expense" | "income" | "both";

export interface IconGroupItem {
  value: string;
  label: string;
}

export interface IconGroup {
  name: string;
  color: string;
  type: IconGroupType;
  items: IconGroupItem[];
}

export const CATEGORY_ICON_GROUPS: IconGroup[] = [
  {
    name: "Продукты",
    color: "bg-emerald-500",
    type: "expense",
    items: [
      { value: "ShoppingCart", label: "Магазин" },
      { value: "Utensils", label: "Ресторан" },
      { value: "Coffee", label: "Кофе" },
      { value: "Soup", label: "Столовая" },
      { value: "Sandwich", label: "Фастфуд" },
      { value: "Cake", label: "Кондитерская" },
    ],
  },
  {
    name: "Дом",
    color: "bg-blue-500",
    type: "expense",
    items: [
      { value: "Home", label: "Дом" },
      { value: "Zap", label: "Электричество" },
      { value: "Wrench", label: "Ремонт" },
      { value: "ScrollText", label: "Коммуналка" },
      { value: "Droplets", label: "Вода" },
      { value: "Flame", label: "Отопление/Газ" },
      { value: "Trash2", label: "Мусор" },
      { value: "Sofa", label: "Мебель" },
      { value: "Flower2", label: "Растение" },
      { value: "Hammer", label: "Стройматериалы" },
      { value: "Paintbrush", label: "Декор" },
    ],
  },
  {
    name: "Транспорт",
    color: "bg-orange-500",
    type: "expense",
    items: [
      { value: "Car", label: "Авто" },
      { value: "Fuel", label: "Топливо" },
      { value: "Train", label: "Поезд" },
      { value: "Bus", label: "Автобус" },
      { value: "Plane", label: "Самолёт" },
      { value: "Ship", label: "Корабль" },
      { value: "Bike", label: "Велосипед" },
      { value: "Scooter", label: "Самокат" },
      { value: "Shield", label: "Мотоцикл" },
      { value: "ParkingCircle", label: "Парковка" },
      { value: "Gavel", label: "Штрафы" },
    ],
  },
  {
    name: "Здоровье",
    color: "bg-pink-500",
    type: "expense",
    items: [
      { value: "Heart", label: "Здоровье" },
      { value: "Stethoscope", label: "Врач" },
      { value: "Pill", label: "Таблетки" },
      { value: "Dumbbell", label: "Спортзал" },
      { value: "Pill", label: "Анализы" },
      { value: "Syringe", label: "Вакцинация" },
      { value: "Droplets", label: "Бассейн" },
    ],
  },
  {
    name: "Одежда",
    color: "bg-violet-500",
    type: "expense",
    items: [
      { value: "Shirt", label: "Одежда" },
      { value: "Gem", label: "Украшения" },
      { value: "Sparkles", label: "Косметика" },
      { value: "Footprints", label: "Обувь" },
      { value: "Backpack", label: "Рюкзак" },
      { value: "Luggage", label: "Чемодан" },
      { value: "Glasses", label: "Очки" },
      { value: "Umbrella", label: "Зонт" },
    ],
  },
  {
    name: "Образование",
    color: "bg-indigo-500",
    type: "expense",
    items: [
      { value: "GraduationCap", label: "Обучение" },
      { value: "BookOpen", label: "Книги" },
      { value: "School", label: "Школа/Вуз" },
      { value: "Pen", label: "Канцелярия" },
    ],
  },
  {
    name: "Развлечения",
    color: "bg-amber-500",
    type: "expense",
    items: [
      { value: "Film", label: "Кино" },
      { value: "Music", label: "Музыка" },
      { value: "Gamepad2", label: "Игры" },
      { value: "Ticket", label: "Билеты" },
      { value: "Drama", label: "Театр" },
      { value: "Dices", label: "Настольные игры" },
      { value: "Puzzle", label: "Пазлы" },
      { value: "Camera", label: "Фото" },
      { value: "PartyPopper", label: "Праздники" },
    ],
  },
  {
    name: "Связь",
    color: "bg-cyan-500",
    type: "expense",
    items: [
      { value: "Smartphone", label: "Телефон" },
      { value: "Radio", label: "Подписки" },
      { value: "Tv", label: "ТВ" },
      { value: "Wifi", label: "Интернет" },
      { value: "Monitor", label: "Серверы" },
      { value: "Cloud", label: "Облака" },
      { value: "Lock", label: "Сигнализация" },
    ],
  },
  {
    name: "Кредиты",
    color: "bg-rose-500",
    type: "expense",
    items: [
      { value: "Landmark", label: "Кредит" },
      { value: "CreditCard", label: "Карта" },
      { value: "Percent", label: "Проценты" },
      { value: "Banknote", label: "Займ" },
      { value: "Car", label: "Автокредит" },
      { value: "Home", label: "Ипотека" },
    ],
  },
  {
    name: "Социальное",
    color: "bg-teal-500",
    type: "expense",
    items: [
      { value: "Gift", label: "Подарки" },
      { value: "Baby", label: "Дети" },
      { value: "ToyBrick", label: "Игрушки" },
      { value: "Cat", label: "Животные" },
    ],
  },
  {
    name: "Финансы",
    color: "bg-emerald-500",
    type: "income",
    items: [
      { value: "DollarSign", label: "Доход" },
      { value: "PiggyBank", label: "Копилка" },
      { value: "Wallet", label: "Кошелёк" },
      { value: "Landmark", label: "Банк" },
      { value: "Banknote", label: "Наличные" },
    ],
  },
  {
    name: "Зарплата",
    color: "bg-emerald-500",
    type: "income",
    items: [
      { value: "DollarSign", label: "Зарплата" },
      { value: "DollarSign", label: "Оклад" },
      { value: "Wallet", label: "Аванс" },
      { value: "Award", label: "Премия" },
      { value: "Briefcase", label: "Подработка" },
      { value: "Percent", label: "Проценты" },
    ],
  },
  {
    name: "Инвестиции",
    color: "bg-emerald-500",
    type: "income",
    items: [
      { value: "TrendingUp", label: "Доход" },
      { value: "PiggyBank", label: "Вклады" },
      { value: "Crown", label: "Роялти/Гонорар" },
      { value: "RefreshCw", label: "Кэшбэк" },
    ],
  },
  {
    name: "Выплаты",
    color: "bg-teal-500",
    type: "income",
    items: [
      { value: "GraduationCap", label: "Стипендия" },
      { value: "Baby", label: "Пособия" },
      { value: "Shield", label: "Страховка" },
      { value: "Heart", label: "Соцподдержка" },
      { value: "ScrollText", label: "Налоговое" },
    ],
  },
  {
    name: "Недвижимость",
    color: "bg-blue-500",
    type: "income",
    items: [
      { value: "Key", label: "Аренда" },
      { value: "Building2", label: "Продажа" },
      { value: "Package", label: "Товары" },
    ],
  },
  {
    name: "Прочие доходы",
    color: "bg-amber-500",
    type: "income",
    items: [
      { value: "Gift", label: "Подарки" },
      { value: "Gem", label: "Выигрыши" },
      { value: "Search", label: "Находка" },
      { value: "Landmark", label: "Кредит/Займ" },
      { value: "Hand", label: "Компенсация" },
      { value: "Receipt", label: "Налоговый вычет" },
    ],
  },
  {
    name: "Госуслуги",
    color: "bg-red-500",
    type: "expense",
    items: [
      { value: "Building2", label: "Госуслуги" },
      { value: "ScrollText", label: "Документы" },
      { value: "AlertTriangle", label: "Штрафы" },
      { value: "Landmark", label: "Регистрация" },
      { value: "Globe", label: "Виза/Паспорт" },
    ],
  },
  {
    name: "Покупки",
    color: "bg-slate-500",
    type: "expense",
    items: [
      { value: "ShoppingCart", label: "Покупки" },
      { value: "Hand", label: "Услуги" },
      { value: "Package", label: "Товары" },
    ],
  },
  {
    name: "Прочее",
    color: "bg-slate-500",
    type: "both",
    items: [
      { value: "MoreHorizontal", label: "Другое" },
      { value: "Award", label: "Достижения" },
      { value: "Target", label: "Цель" },
      { value: "Shield", label: "Страховка" },
      { value: "Crown", label: "Премиум" },
      { value: "CreditCard", label: "Кредитка" },
    ],
  },
];
