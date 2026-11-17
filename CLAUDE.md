# InternTrack

Трекер заявок на стажировки с AI-анализом вакансий.
Стек: React + TypeScript + Vite, Tailwind, Supabase, Netlify Functions.

## Как со мной работать

- Отвечай по-русски. Код, названия и коммиты — на английском.
- Я пока не знаю React, поэтому код пишешь ты, а я разбираюсь, как он устроен.
- После каждой заметной части объясняй простыми словами, что сделано и как это
  работает. Держи docs/how-it-works.md в актуальном состоянии.
- Мини-тесты не нужны.
- Каждую новую библиотеку называй и объясняй, зачем она нужна.
- Никогда не записывай ключи и пароли в код, только в .env.

## Команды

- npm run dev — запуск локально
- npm run test — тесты
- npm run build — сборка
- npm run lint — проверка кода (oxlint)
- netlify dev — приложение вместе с функцией /api/ai (нужен netlify-cli)
- PGHOST=localhost PGUSER=postgres supabase/tests/run.sh — проверка RLS

## Этапы

Коммит после каждого рабочего шага, сообщение описывает этап.

- [x] 0. Подготовка: Vite + React + TypeScript, Tailwind, Vitest, конфиг Netlify
- [x] 1. Вход и база: таблицы и Row Level Security в Supabase, вход, демо-режим
- [x] 2. Заявки: форма, редактирование, удаление
- [x] 3. Канбан: колонки по статусам, перетаскивание (dnd-kit)
- [x] 4. Карточка и дедлайны: боковая панель с вкладками, история, подсветка дедлайнов
- [x] 5. AI: серверная функция Netlify, анализ вакансии, черновик cover letter
- [x] 6. Статистика: счётчики, доля ответов, диаграммы этапов и отказов
- [x] 7. Полировка: мобильная вёрстка, PWA, тёмная тема, пустые состояния, тесты, README

Дальше по плану: напоминания на email, несколько версий CV, экспорт в календарь,
вопросы к интервью, расширение браузера.

## Устройство кода

Подробно — в docs/how-it-works.md. Коротко:

- src/lib — чистая логика без React (даты, дедлайны, статусы, статистика), с тестами.
- src/data — интерфейс Repository и две реализации: Supabase и демо (localStorage).
  Новое действие с данными добавляется в обе.
- src/state/TrackerProvider.tsx — все данные пользователя и действия с ними.
- server/ai — логика функции /api/ai; netlify/functions/ai.ts только собирает её.
  Ключ ANTHROPIC_API_KEY живёт только на сервере.
- Изменения схемы базы — новым файлом в supabase/migrations, плюс проверка в
  supabase/tests/10_rls_checks.sql для каждой новой таблицы.

## Данные (Supabase)

- profiles: id, full_name, created_at
- applications: id, user_id, company, role, job_url, location, status, deadline,
  applied_at, job_description, notes, created_at, updated_at
- application_events: id, application_id, type, happened_at, note
- cv_versions: id, user_id, title, content, is_default
- ai_results: id, application_id, kind, content (jsonb), cv_title, created_at

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
