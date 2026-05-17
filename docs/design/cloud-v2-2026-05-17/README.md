# Design v2 — Claude Cloud Output (2026-05-17)

## Содержание

- `EstateOS Landing.html` — полноценный designed landing (1270 строк, 50 inline SVG)
- `estateos.css` — design tokens + components (1982 строки)
- `uploads/BRIEF.md` — оригинальный handoff brief (для контекста)
- `preview/` — рендеры landing на desktop+mobile

## Что внутри HTML (полезные ассеты для извлечения)

| ID | Что | Куда переиспользовать |
|---|---|---|
| `#logo-mark` | Wave-bars в rounded square, terracotta gradient | → `apps/web/public/logo.svg` (standalone) |
| `#orb-base` + `#orb-shine` + `#orb-bottom` + `#orb-haze` | Hero radial orb (4 gradients) | → hero illustration |
| Header pill nav | Sticky pill с brand-CTA | → `Header` component |
| Floating chat cards | «Запись агента 04:12» etc. | → hero animation |
| Feature cards | 3 cards с micro-mockups | → marketing landing |
| Admin/narrator mockup | Sidebar + audio player + transcript + горячие сделки | → reference для редизайна `/admin/narrator/[id]` |
| Analytics mockup | KPI tiles + trend chart + Топ агентов table | → reference для редизайна `/admin/analytics` |

## Что отсутствует (нужно догенерить)

- `favicon.ico` — extract `#logo-mark` SVG → ImageMagick → 16/32/48 multi-size
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — same source
- `og-image.png` 1200×630 — композиция: logo + slogan + orb
- `logo.svg` standalone (сейчас только inline в HTML)

## Канон палитры (Cloud соблюл)

- `#FAF8F5` cream bg
- `#C4836A` terracotta accent
- `#9A6048`, `#7E4A2E` deeper browns
- DM Sans
- SVG-only icons, no emoji

## Слоганы из landing (для OG-image)

- «Операционная система для агентств недвижимости» (main hero)
- «AI-операционная система · агентства недвижимости» (chip)
- «Голос продолжает играть когда вы выходите из спальни» (section header)
- «Контроль агентства в одном экране» (section header)
- «Три ритуала, на которых держится агентство» (section header)
