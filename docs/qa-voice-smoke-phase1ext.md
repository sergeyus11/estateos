# QA Smoke — EstateOS Voice-Native (Phase 1 Extended)

Последнее обновление: 2026-05-18
Исполнитель: QA-team / DevLead

## Окружение
- URL: https://estateos.ru (production)
- Тест-аккаунт агента: demo-agent@estateos.ru
- Тест-аккаунт администратора: demo-admin@estateos.ru

## Чек-лист

- [ ] Login as demo-agent → попадает на /agent (не /admin)
- [ ] TodayHome видит agenda (cancelled events скрыты)
- [ ] FAB → say «поставь показ Петровым завтра в 15 на Чкалова 22» → preview с именем клиента → Confirm → видим в agenda
- [ ] Click event → /agent/event/[id] → mic → say «понравилось бюджет 14 готовы к авансу» → ReportCard 5 полей → save → status=done
- [ ] /agent/clients → ClientCard → AI-summary не stub (через 5 мин после save)
- [ ] /agent/objects → create object с фото 5MB → carousel
- [ ] FAB → «покажи клиентов до 15М» → search results
- [ ] /agent/settings → toggle «выходной» работает, brief_at picker сохраняется
- [ ] Sign out → login admin → /admin/team-today видит активность агентов
- [ ] Morning brief 08:30 МСК → push notification → tap → /agent?brief=<id> banner с audio player

## iOS Safari специфика
- [ ] MicRecorder корректно стартует на iOS 16+ Safari (audio/mp4 fallback)
- [ ] Запись менее 30 сек не триггерит Deepgram timeout
- [ ] При плохой сети Deepgram retry (1 раз) восстанавливает транскрипт

## Примечания
- Deepgram timeout 35s, 1 retry встроен в `packages/ai/src/deepgram.ts`
- Микрофон-иконка на кнопке остановки — inline SVG (не emoji)
- /admin/team показывает только агентов (role='agent'), не admins
