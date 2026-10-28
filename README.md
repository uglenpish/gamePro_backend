# GamesPro Backend

Backend проекта **"Осколки Реальности"**.

Сейчас backend отвечает за базовую серверную часть проекта: NestJS API, PostgreSQL, Prisma и модуль авторизации. По мере развития проекта сюда будет переноситься ядро Narrative Engine: сцены, состояние игры, условия, эффекты, сохранения, квесты, инвентарь и боевая система.

## Стек

- Node.js 22+
- NestJS 11
- TypeScript
- PostgreSQL 16
- Prisma 7
- Docker Compose
- Jest

## Требования

Перед запуском должны быть установлены:

- Node.js `22.0.0` или новее
- npm
- Docker
- Docker Compose

Проверка:

```bash
node -v
npm -v
docker --version
docker compose version
```

Если используется `nvm`, рекомендуется использовать актуальную установленную версию Node 22 или новее:

```bash
nvm use 22
nvm alias default 22
node -v
```

Если VS Code продолжает видеть старую версию Node, перезапусти терминал VS Code или выполни `Developer: Reload Window`.

## Быстрый старт

Все команды ниже выполняются из папки `backend`.

```bash
cd backend
```

### 1. Установить зависимости

```bash
npm install
```

### 2. Подготовить `.env`

В корне папки `backend` должен быть файл `.env`.

Минимальный пример для локального запуска с текущим `docker-compose.yml`:

```env
NODE_ENV=development

DATABASE_URL="postgresql://quest_dsterlin:quest_games_dev@localhost:5434/quest_games?schema=public"

PORT=3000

JWT_ACCESS_SECRET="replace_with_local_access_secret"
JWT_REFRESH_SECRET="replace_with_local_refresh_secret"

JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

FRONTEND_URL="http://localhost:5173"

REDIS_HOST="localhost"
REDIS_PORT=6379
```

Важно:

- `DATABASE_URL` используется Prisma и `PrismaService`.
- `JWT_ACCESS_SECRET` нужен для генерации access token.
- `FRONTEND_URL` понадобится для настройки CORS.
- Redis пока указан на будущее и сейчас не обязателен для запуска текущего backend.

### 3. Запустить PostgreSQL

```bash
docker compose up -d
```

Проверить контейнер:

```bash
docker compose ps
```

Остановить базу:

```bash
docker compose down
```

Остановить базу и удалить локальные данные:

```bash
docker compose down -v
```

Команда с `-v` удаляет Docker volume `gamespro_postgres_data`. Используй её только если локальные данные больше не нужны.

### 4. Проверить Prisma-схему

```bash
npx prisma validate
```

Ожидаемый результат:

```text
The schema at prisma/schema.prisma is valid
```

### 5. Сгенерировать Prisma Client

```bash
npx prisma generate
```

Prisma Client нужен приложению для работы с базой данных.

### 6. Применить миграции

Для локальной разработки:

```bash
npx prisma migrate dev
```

Эта команда:

- читает `prisma/schema.prisma`;
- применяет миграции из `prisma/migrations`;
- обновляет локальную базу данных;
- при необходимости регенерирует Prisma Client.

Проверить состояние миграций:

```bash
npx prisma migrate status
```

Если локальная база сломана или миграции разъехались, и данные не нужны:

```bash
npx prisma migrate reset
```

`migrate reset` полностью очищает локальную базу и применяет миграции заново.

### 7. Запустить backend

Режим разработки с hot reload:

```bash
npm run start:dev
```

Обычный запуск:

```bash
npm run start
```

После запуска API доступно по адресу:

```text
http://localhost:3000
```

Если в `.env` указан другой `PORT`, используй его.

## Полная последовательность запуска с нуля

```bash
cd backend
nvm use 22
npm install
docker compose up -d
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

## Проверка API

Сейчас доступны базовые auth endpoints.

### Регистрация

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "name": "Player",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Логин

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "password123"
  }'
```

## Prisma

Основные файлы:

- `prisma/schema.prisma` - Prisma-схема.
- `prisma/migrations/` - SQL-миграции.
- `prisma.config.ts` - конфигурация Prisma CLI.
- `src/infrastructure/prisma/prisma.service.ts` - подключение Prisma к NestJS.

Полезные команды:

```bash
# Проверить схему
npx prisma validate

# Сгенерировать Prisma Client
npx prisma generate

# Создать и применить новую миграцию после изменения schema.prisma
npx prisma migrate dev --name migration_name

# Проверить состояние миграций
npx prisma migrate status

# Открыть Prisma Studio
npx prisma studio
```

Принцип работы:

1. Меняем `prisma/schema.prisma`.
2. Создаём миграцию через `npx prisma migrate dev --name ...`.
3. Проверяем SQL в `prisma/migrations`.
4. Запускаем приложение.

Не рекомендуется менять структуру базы вручную в PostgreSQL, если это изменение должно попасть в проект. Такие изменения нужно оформлять через Prisma migrations.

## Скрипты npm

```bash
# Сборка проекта
npm run build

# Запуск в development-режиме
npm run start:dev

# Запуск собранного приложения
npm run start:prod

# Линтинг
npm run lint

# Unit-тесты
npm run test

# E2E-тесты
npm run test:e2e

# Coverage
npm run test:cov
```

Перед `npm run start:prod` нужно собрать проект:

```bash
npm run build
npm run start:prod
```

## Тесты

Unit-тесты:

```bash
npm run test
```

E2E-тесты:

```bash
npm run test:e2e
```

Сейчас тестовая инфраструктура требует донастройки под абсолютные импорты вида `src/...`. Если Jest падает с ошибкой `Cannot find module 'src/...'`, нужно добавить mapping для `src/*` в Jest-конфигурацию.

## Типовые проблемы

### Prisma падает с `ERR_REQUIRE_ESM`

Проверь версию Node:

```bash
node -v
```

Для этого проекта требуется Node `22.0.0` или новее. Если используется `nvm`, переключись на установленную версию Node 22+.

### Приложение падает с `DATABASE_URL is not defined`

Проверь, что:

- файл `.env` находится в папке `backend`;
- в `.env` есть `DATABASE_URL`;
- приложение запускается из папки `backend`.

### Backend не может подключиться к PostgreSQL

Проверь контейнер:

```bash
docker compose ps
```

Проверь, что порт в `DATABASE_URL` совпадает с `docker-compose.yml`.

В текущем docker-compose PostgreSQL доступен на локальном порту `5434`.

### Миграция не применяется на непустую базу

Если миграция добавляет обязательное поле без default-значения, PostgreSQL может отказать в применении на таблицу с данными.

Для локальной разработки, если данные не важны:

```bash
npx prisma migrate reset
```

Для важной базы нужно писать безопасную миграцию вручную: добавить nullable-поле, заполнить значения, затем сделать поле обязательным.

## Рекомендуемый порядок ежедневной работы

```bash
cd backend
nvm use 22
docker compose up -d
npx prisma migrate status
npm run start:dev
```

Если менялась Prisma-схема:

```bash
npx prisma validate
npx prisma migrate dev --name migration_name
npm run start:dev
```

Если менялись зависимости:

```bash
npm install
npm run build
```

## Роль backend в проекте

Backend должен постепенно стать ядром Narrative Engine.

Планируемые зоны ответственности:

- импорт контента из JSON;
- хранение сцен и игрового мира;
- обработка условий;
- применение эффектов;
- хранение состояния игрока;
- сохранения;
- квесты;
- инвентарь;
- отношения с NPC;
- боевая система;
- API для Vue-клиента.

Twine используется только как редактор сюжета. Игровая логика должна находиться в backend.
