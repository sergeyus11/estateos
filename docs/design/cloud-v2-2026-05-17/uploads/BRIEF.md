# EstateOS — Design 2 (Brand Identity) Handoff для Claude Cloud

**Дата:** 2026-05-17
**От:** Claude Code (sergeyus11/estateos maintainer)
**Куда:** Claude Cloud (chat-сессия CEO)
**Скоуп:** brand identity — лого, hero illustration, OG-image, favicon, PWA icons, бренд-buyer

---

## Контекст

**EstateOS** — операционная AI-платформа для агентств недвижимости. Standalone-продукт, отделившийся от Voxium 16.05.2026. Прод: <https://estateos.ru>.

**Design partner:** Сусанна, владелица агентства недвижимости (АН Сусанны). Она же первый пользователь admin-роли.

**Что уже работает:**
- Голосовой отчёт агента после показа квартиры (Deepgram → kimi-k2 → 5 структурированных полей + AI follow-up)
- Утренний голосовой разбор для Сусанны в 09:30 МСК (mp3 на iPhone)
- SPIN-тренажёр продаж с 8 типажами клиентов
- Дашборд + аналитика 30 дней с trend-графиками

**Текущий стэк визуально:** Next.js 15 + Tailwind v4 + DM Sans + warm palette из suom.voxium.ru:
- Background: `#FAF8F5` (cream)
- Accent: `#C4836A` (terracotta)
- Text: `#2C2520` (deep brown), `#7A6E63` (warm gray)

---

## Что нужно (deliverables)

### 1. Логотип EstateOS

**Атрибуты:**
- Тёплый, спокойный, AI-trust
- Не агрессивный, не корпоративный
- Угадывается тема недвижимости БЕЗ клише (никаких домиков-крыш-ключей в качестве main)
- Работает в круге (favicon/PWA icon, 1024×1024) и в строке (header, ~32px height)
- 1 цвет (использует терракоту `#C4836A`) + чёрно-белая версия

**Форматы:**
- `logo.svg` — вектор, single-path или small-group, viewBox 100×100
- `logo-text.svg` — лого + текст «EstateOS» в DM Sans
- `logo-mark-only.svg` — только марка без текста

### 2. Favicon + PWA icons

- `favicon.ico` (16, 32, 48 multi-size)
- `icon-192.png` (192×192, PWA)
- `icon-512.png` (512×512, PWA, maskable safe-zone)
- `apple-touch-icon.png` (180×180)

Сейчас placeholders 1×1 — нужно реальное.

### 3. Hero illustration (landing `/`)

Лендинг сейчас минималистичный: title «EstateOS» + 2 строки описания + кнопка «Войти». Добавить:
- SVG-иллюстрация справа от текста (desktop) / под текстом (mobile)
- Стиль: line-art, тонкие линии, та же tertiary палитра, никаких эмодзи
- Сюжет: голос/звук как метафора (волна, диктофон, разговор), либо архитектурный профиль города в одну линию
- Не больше 300 LOC SVG

### 4. OG-image (social sharing)

`og-image.png` 1200×630, для Telegram/VK/WhatsApp previews.
- Лого + слоган
- Слоган-кандидаты: «Голос вашего агентства», «Операционная для агентов», «AI-разбор каждое утро»
- Можешь предложить лучший

### 5. Component polish (optional, если есть бюджет в чате)

- Loading skeleton для карточек
- Empty state иллюстрации (для «пока пусто» в analytics / narrator list)
- Focus rings (брендированный outline `#C4836A` со светлым halo)

---

## Технические ограничения

1. **Только SVG для иконок** (project rule, no emoji в UI). Lucide/Feather-style line-icons.
2. **Tailwind v4** — в проекте `@theme` блок c CSS vars. Лого должно работать с `currentColor` если возможно, чтобы adapt'илось через `text-brand-500`.
3. **PWA**: 192px иконка должна быть видна на белом и тёмном фоне (proper contrast).
4. **DM Sans** уже подключён — не предлагать другой шрифт без причины.
5. **Файлы кладёшь в** `apps/web/public/` (проект Next.js):
   ```
   apps/web/public/
     ├── logo.svg
     ├── logo-text.svg
     ├── favicon.ico
     ├── icon-192.png
     ├── icon-512.png
     ├── apple-touch-icon.png
     └── og-image.png
   ```

---

## Канон палитры (бери оттуда)

```css
/* Light (default) */
--color-bg:         #FAF8F5;  /* cream page bg */
--color-bg-soft:    #F2EDE8;  /* secondary surface */
--color-surface:    #FFFFFF;  /* cards */
--color-ink:        #2C2520;  /* primary text */
--color-ink-2:      #7A6E63;  /* secondary text */
--color-ink-3:      #A89E94;  /* tertiary */
--color-line:       #E8E0D8;  /* borders */
--color-brand-500:  #C4836A;  /* terracotta — primary accent */
--color-brand-700:  #9A6048;  /* darker accent for hover */
--color-brand-900:  #7A4A2E;  /* deepest brown */
--color-success:    #7A9E6B;
--color-warning:    #D4A84C;
--color-error:      #C07A7A;
--color-info:       #6B8EC4;
```

Inspiration source — посмотри на <https://suom.voxium.ru> (partner portal с тем же визуальным языком).

---

## Скриншоты текущего состояния

Все 13 скринов лежат в `/mnt/apps/hq/.estateos-screenshots/` (отдам отдельно):

**Desktop:**
- `desktop-00-landing.png` — лендинг (заглушка, ждёт hero illustration)
- `desktop-01-login.png` — magic-link login
- `desktop-02-admin-home.png` — admin dashboard с 5 нав-кнопками
- `desktop-06-admin-narrator.png` — список утренних разборов
- `desktop-09-admin-narrator-detail.png` — детальная страница с audio player + stats
- `desktop-07-admin-analytics.png` — analytics с sparkline графиками
- `desktop-08-agent-home.png` — agent home (MicRecorder + ReportCard)

**Mobile (iPhone 14 Pro 393×852):**
- `mobile-00-landing.png` ... `mobile-08-agent-training.png`

---

## Как доставить результат

**Вариант 1 (рекомендую):** Claude Cloud сразу пишет SVG-файлы как артефакты, я (Claude Code) их забираю и кладу в `apps/web/public/`, делаю PR.

**Вариант 2:** Сохранить в Google Drive / прислать архивом, я заберу и закоммичу.

**Вариант 3:** Claude Cloud делает свой fork и PR — тогда нужен доступ к `sergeyus11/estateos` (CEO admin, может выдать).

CEO решит на месте.

---

## Что НЕ нужно делать (anti-scope)

- ❌ Перерисовывать существующие страницы (только assets)
- ❌ Менять палитру (уже утверждена через suom.voxium.ru)
- ❌ Менять шрифт (DM Sans final)
- ❌ Добавлять emoji
- ❌ Иллюстрации со штампами «AI» / «brain» / «robot»
- ❌ Stock-photo style (избегать «корпоративных людей в офисе»)

---

## Связанные документы

- Roadmap meta: <https://github.com/sergeyus11/estateos/issues/5>
- Repo: <https://github.com/sergeyus11/estateos>
- Live: <https://estateos.ru>
- Inspiration: <https://suom.voxium.ru>
- Spec (полный roadmap): `hq/docs/superpowers/specs/2026-05-16-estateos-product-roadmap-design.md`

---

**Финальный ask Claude Cloud:**
> Прочитай этот бриф + скрины. Предложи 2-3 концепции лого, и после моего выбора — отдай все 4 пункта deliverables (лого + favicon-pack + hero + og-image). DM Sans, terracotta `#C4836A`, без emoji. Файлы — SVG где можно, PNG для favicon/og.
