# Field Survey
## Приложение для полевого обследования объектов электроснабжения
Разработано студентами НГТУ в рамках учебной проектно-технологической практики для компании АО "РиМ".

### Возможности
- Создание проектов обследования;
- Загрузка схем объектов;
- Создание пометок/замечаний на схемах;
- Геотеггирование.

### Стек
- FastAPI + mongoDB + Uvicorn - backend;
- React + Vite + Dexie - frontend;
- PWA-приложение;
- Offline-first архитектура (загрузка в удалённую БД при подключении к сети);

### Planned
- [ ] Авторизация;
- [ ] Выгрузка геотегов с фото

## Запуск
*Backend:*
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

*Frontend:*
```bash
npm install
npm run dev
```
