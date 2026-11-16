# InternTrack

Трекер заявок на стажировки с AI-анализом вакансий.
Стек: React + TypeScript + Vite, Tailwind, Supabase, Netlify Functions.

## Как со мной работать

- Отвечай по-русски. Код, названия и коммиты — на английском.
- Я учусь на этом проекте. Не пиши всё за меня: иди маленькими шагами.
- Перед каждым шагом объясни, что мы делаем и почему именно так.
- Простой код предлагай написать мне, потом делай ревью.
- После каждого этапа дай мини-тест из 3–5 вопросов и разбери мои ответы.
- Не добавляй библиотеки без обсуждения.
- Никогда не записывай ключи и пароли в код, только в .env.

## Команды

- npm run dev — запуск локально
- npm run test — тесты
- npm run build — сборка
- npm run lint — проверка кода (oxlint)

## Этапы

Один этап — одна ветка, коммит после каждого рабочего шага.

- [x] 0. Подготовка: Vite + React + TypeScript, Tailwind, Vitest, конфиг Netlify
- [ ] 1. Вход и база: таблицы и Row Level Security в Supabase, экраны входа и регистрации
- [ ] 2. Заявки списком: форма, список, редактирование, удаление
- [ ] 3. Канбан: колонки по статусам, перетаскивание (dnd-kit)
- [ ] 4. Карточка и дедлайны: боковая панель с вкладками, история, подсветка дедлайнов
- [ ] 5. AI: серверная функция Netlify, анализ вакансии, черновик cover letter
- [ ] 6. Статистика: счётчики по статусам и простая диаграмма
- [ ] 7. Полировка: мобильная вёрстка, PWA, тёмная тема, пустые состояния, тесты, README

## Данные (Supabase)

- profiles: id, full_name, created_at
- applications: id, user_id, company, role, job_url, location, status, deadline,
  applied_at, job_description, notes, created_at, updated_at
- application_events: id, application_id, type, happened_at, note
- cv_versions: id, user_id, title, content, is_default
- ai_results: id, application_id, kind, content, created_at

status: wishlist, applied, test, interview, offer, rejected.
kind: analysis, cover_letter.
На каждой таблице Row Level Security: пользователь видит только свои строки.

## Дизайн

- Язык интерфейса — русский. Шрифт Inter, текст 14–16 px.
- Светло-серый фон (gray-100), белые карточки, рамки gray-200.
- Токены цветов заданы в src/index.css: accent (индиго #4F46E5) и status-*
  (wishlist серый, applied синий, test фиолетовый, interview жёлтый,
  offer зелёный, rejected красный).
- Скругление 8–12 px, кнопки и поля высотой 44 px. Тень только у карточки,
  которую перетаскивают.
- Дедлайн: красный бейдж за 3 дня, жёлтый за неделю.
- Телефон: колонки становятся вкладками, карточка заявки на весь экран,
  внизу навигация Доска / Статистика / CV / Профиль.
