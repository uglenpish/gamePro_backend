# 06. Database

Документ описывает проектную структуру PostgreSQL для «Осколков Реальности» и Narrative Engine.

Версия документа: `0.1.0`
Статус: черновой стандарт

## 1. Назначение документа

База данных должна хранить:

- импортированный игровой контент;
- версии контента;
- пользователей;
- сохранения игроков;
- текущее игровое состояние;
- прогресс квестов;
- инвентарь;
- отношения с NPC;
- технические данные импорта.

Этот документ связывает [05_JSON_Specification.md](05_JSON_Specification.md) с будущей Prisma-схемой.

## 2. Что уже есть в backend

На текущий момент в `backend/prisma/schema.prisma` есть только базовая пользовательская часть:

- `User`;
- `Role`;
- `UserStatus`.

Игровые таблицы ещё не созданы. Этот документ описывает целевую структуру, которую можно будет постепенно переносить в Prisma migration.

## 3. Главный принцип

PostgreSQL хранит данные.

Движок выполняет логику.

База данных не должна содержать игровую логику, сценарные правила или код обработчиков. Условия и эффекты хранятся как данные, а выполняются в NestJS.

## 4. Разделение данных

Все данные делятся на три группы.

| Группа | Назначение | Примеры |
| --- | --- | --- |
| Identity | Пользователи и доступ | `User`, `Role`, `UserStatus` |
| Content | Импортированный игровой контент | `Game`, `ContentVersion`, `Scene`, `Item`, `Quest` |
| Runtime | Состояние конкретного прохождения | `SaveSlot`, `PlayerState`, `InventoryEntry`, `QuestProgress` |

Контент и runtime нельзя смешивать.

Пример: `Quest` описывает квест как шаблон. `QuestProgress` хранит состояние этого квеста у конкретного игрока.

## 5. Общие правила моделирования

Рекомендуемые правила для Prisma/PostgreSQL:

- внутренний первичный ключ: `id UUID`;
- внешний ID из JSON: `externalId`;
- связи между таблицами: через внутренний `id`;
- ссылки из JSON при импорте резолвятся по `externalId`;
- гибкие поля условий, эффектов и контента хранятся в `JSONB`;
- часто используемые поля выносятся в отдельные колонки;
- все таблицы имеют `createdAt` и `updatedAt`, если это не чистая join-таблица;
- опубликованные версии контента нельзя изменять напрямую.

## 6. Именование

В Prisma можно использовать `camelCase` для полей и `PascalCase` для моделей.

В PostgreSQL рекомендуется маппить имена в `snake_case` через `@@map` и `@map`.

Пример:

```prisma
model ContentVersion {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  @@map("content_versions")
}
```

## 7. Почему нужен JSONB

Не все данные стоит нормализовать.

`JSONB` подходит для:

- текстовых блоков сцены;
- условий;
- эффектов;
- type-specific `data`;
- metadata;
- боевых наград;
- стоимости способностей;
- стартового состояния.

Обычные колонки нужны для:

- `id`;
- `externalId`;
- `type`;
- `subtype`;
- `layer`;
- `title`;
- связей между сущностями;
- полей, по которым часто выполняются фильтры и индексы.

Такой подход позволяет добавлять новые типы условий и эффектов без миграции БД.

## 8. Content Tables

Content Tables хранят импортированный игровой контент.

Контент привязан к версии. Это позволяет иметь несколько версий одной игры и не ломать старые сохранения.

### Game

Игра или проект на Narrative Engine.

```text
Game
id
externalId
title
description
defaultLocale
createdAt
updatedAt
```

Рекомендуемые ограничения:

- `externalId` уникален;
- `defaultLocale` обязателен.

### ContentVersion

Версия импортированного контента.

```text
ContentVersion
id
gameId
schemaVersion
contentVersion
locale
status
startSceneId
initialState
metadata
createdAt
publishedAt
```

`initialState` и `metadata` хранятся как `JSONB`.

Рекомендуемые значения `status`:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Рекомендуемые ограничения:

- одна версия принадлежит одной игре;
- `startSceneId` должен ссылаться на `Scene.id`;
- опубликованную версию нельзя менять без создания новой версии.

### ContentImport

Техническая таблица импорта.

```text
ContentImport
id
contentVersionId
sourceType
sourceFileName
sourceHash
status
errors
warnings
createdAt
finishedAt
```

`errors` и `warnings` хранятся как `JSONB`.

Рекомендуемые значения `sourceType`:

```text
JSON
TWINE
MANUAL
```

## 9. Scene Tables

### Scene

Основная таблица сцен.

```text
Scene
id
contentVersionId
externalId
type
subtype
title
layer
tags
content
assets
conditions
enterEffects
exitEffects
data
createdAt
updatedAt
```

Рекомендуемые типы:

- `tags`: `TEXT[]`;
- `content`: `JSONB`;
- `assets`: `JSONB`;
- `conditions`: `JSONB`;
- `enterEffects`: `JSONB`;
- `exitEffects`: `JSONB`;
- `data`: `JSONB`.

Рекомендуемые ограничения:

- уникальность пары `contentVersionId + externalId`;
- `type` должен входить в разрешённый `SceneType`;
- `layer` находится в диапазоне `1..9`, если указан.

Рекомендуемые индексы:

- `(contentVersionId, externalId)`;
- `(contentVersionId, type)`;
- `(contentVersionId, layer)`;
- GIN-индекс по `tags`.

### SceneChoice

Выборы лучше хранить отдельно от `Scene`, чтобы движок мог быстро строить граф переходов.

```text
SceneChoice
id
sceneId
externalId
text
sortOrder
conditions
effects
targetType
targetSceneId
targetEndingId
isCritical
createdAt
updatedAt
```

`conditions` и `effects` хранятся как `JSONB`.

Рекомендуемые значения `targetType`:

```text
SCENE
RETURN
ENDING
```

Рекомендуемые ограничения:

- `externalId` уникален внутри одной сцены;
- если `targetType = SCENE`, должен быть заполнен `targetSceneId`;
- если `targetType = ENDING`, должен быть заполнен `targetEndingId`;
- `sortOrder` задаёт порядок отображения вариантов.

## 10. Character Table

### Character

```text
Character
id
contentVersionId
externalId
name
role
factionId
description
portraitAssetId
tags
initialRelation
metadata
createdAt
updatedAt
```

`metadata` хранится как `JSONB`.

Рекомендуемые ограничения:

- уникальность пары `contentVersionId + externalId`;
- `portraitAssetId` ссылается на `Asset.id`, если указан.

## 11. Item Table

### Item

```text
Item
id
contentVersionId
externalId
name
type
description
stackable
maxStack
tags
effects
metadata
createdAt
updatedAt
```

`effects` и `metadata` хранятся как `JSONB`.

Рекомендуемые значения `type`:

```text
QUEST
CONSUMABLE
EQUIPMENT
KEY
LORE
RESOURCE
```

Рекомендуемые ограничения:

- уникальность пары `contentVersionId + externalId`;
- если `stackable = false`, `maxStack` должен быть `1` или `NULL`;
- если `stackable = true`, `maxStack` должен быть больше `1`.

## 12. Quest Tables

### Quest

```text
Quest
id
contentVersionId
externalId
title
description
tags
metadata
createdAt
updatedAt
```

### QuestStage

```text
QuestStage
id
questId
externalId
title
description
sortOrder
objectives
onStartEffects
onCompleteEffects
createdAt
updatedAt
```

`objectives`, `onStartEffects` и `onCompleteEffects` хранятся как `JSONB`.

Рекомендуемые ограничения:

- `Quest.externalId` уникален внутри версии контента;
- `QuestStage.externalId` уникален внутри одного квеста;
- `sortOrder` задаёт порядок стадий.

На первой версии не обязательно выносить `QuestObjective` в отдельную таблицу. Его можно хранить в `QuestStage.objectives`.

## 13. Combat Tables

### Enemy

```text
Enemy
id
contentVersionId
externalId
name
factionId
description
tags
stats
abilityIds
rewards
metadata
createdAt
updatedAt
```

`stats`, `abilityIds`, `rewards` и `metadata` хранятся как `JSONB`.

### Ability

```text
Ability
id
contentVersionId
externalId
name
type
target
cost
effects
tags
metadata
createdAt
updatedAt
```

`cost`, `effects` и `metadata` хранятся как `JSONB`.

Для первой версии этого достаточно. Если бой станет сложнее, можно добавить отдельные таблицы для эффектов, статусов и формул.

## 14. Asset Table

### Asset

```text
Asset
id
contentVersionId
externalId
type
src
alt
tags
metadata
createdAt
updatedAt
```

Рекомендуемые значения `type`:

```text
IMAGE
AUDIO
VIDEO
ANIMATION
PORTRAIT
BACKGROUND
```

Рекомендуемые ограничения:

- уникальность пары `contentVersionId + externalId`;
- `src` обязателен;
- `src` не должен быть абсолютным путём к локальной машине разработчика.

## 15. Runtime Tables

Runtime Tables хранят состояние конкретного прохождения.

Они не должны менять импортированный контент.

### SaveSlot

Слот сохранения игрока.

```text
SaveSlot
id
userId
gameId
contentVersionId
name
status
currentSceneId
playTimeSeconds
createdAt
updatedAt
lastPlayedAt
```

Рекомендуемые значения `status`:

```text
ACTIVE
COMPLETED
DELETED
```

`contentVersionId` фиксирует версию контента, на которой создано сохранение.

### PlayerState

Общее состояние игрока в конкретном сохранении.

```text
PlayerState
id
saveSlotId
health
sanity
stats
flags
visitedSceneIds
returnStack
createdAt
updatedAt
```

`stats`, `flags`, `visitedSceneIds` и `returnStack` хранятся как `JSONB`.

`returnStack` нужен для механики `RETURN`.

### InventoryEntry

Предмет в инвентаре.

```text
InventoryEntry
id
saveSlotId
itemId
quantity
metadata
createdAt
updatedAt
```

Рекомендуемые ограничения:

- уникальность пары `saveSlotId + itemId`;
- `quantity` больше `0`;
- `itemId` ссылается на `Item.id` из той же версии контента.

### QuestProgress

Состояние квеста в конкретном сохранении.

```text
QuestProgress
id
saveSlotId
questId
state
currentStageId
completedObjectiveIds
failedObjectiveIds
metadata
createdAt
updatedAt
```

Рекомендуемые значения `state`:

```text
INACTIVE
ACTIVE
COMPLETED
FAILED
```

`completedObjectiveIds`, `failedObjectiveIds` и `metadata` хранятся как `JSONB`.

### RelationState

Отношения игрока с персонажем.

```text
RelationState
id
saveSlotId
characterId
value
metadata
createdAt
updatedAt
```

Рекомендуемые ограничения:

- уникальность пары `saveSlotId + characterId`;
- `value` хранится числом.

## 16. Почему не хранить всё в одном JSON

Можно было бы хранить весь контент и всё сохранение в одной большой JSONB-колонке, но это быстро создаст проблемы:

- сложно проверять ссылки между сценами;
- сложно строить граф переходов;
- сложно искать сцены по типу, слою или тегам;
- сложно мигрировать старые сохранения;
- сложно отлаживать состояние игрока;
- сложно делать админ-панель и редактор.

Поэтому используется гибридный подход:

- сущности и связи хранятся в таблицах;
- вариативные правила хранятся в `JSONB`.

## 17. Связи между таблицами

Ключевые связи:

```text
Game 1 -> N ContentVersion
ContentVersion 1 -> N Scene
ContentVersion 1 -> N Character
ContentVersion 1 -> N Item
ContentVersion 1 -> N Quest
ContentVersion 1 -> N Enemy
ContentVersion 1 -> N Ability
ContentVersion 1 -> N Asset

Scene 1 -> N SceneChoice
Quest 1 -> N QuestStage

User 1 -> N SaveSlot
Game 1 -> N SaveSlot
ContentVersion 1 -> N SaveSlot
SaveSlot 1 -> 1 PlayerState
SaveSlot 1 -> N InventoryEntry
SaveSlot 1 -> N QuestProgress
SaveSlot 1 -> N RelationState
```

## 18. Импорт JSON в БД

Рекомендуемый процесс импорта:

1. Прочитать Content Bundle.
2. Проверить `schemaVersion`.
3. Проверить валидность JSON.
4. Создать `ContentImport` со статусом `PENDING`.
5. Создать или найти `Game`.
6. Создать `ContentVersion` в статусе `DRAFT`.
7. Импортировать `Asset`, `Character`, `Item`, `Quest`, `Enemy`, `Ability`.
8. Импортировать `Scene`.
9. Импортировать `SceneChoice` и зарезолвить переходы.
10. Проверить все ссылки.
11. Проверить `startSceneId`.
12. Если ошибок нет, перевести `ContentVersion` в `PUBLISHED`.
13. Записать результат импорта в `ContentImport`.

Если импорт завершился ошибкой, версия контента должна остаться `DRAFT` или быть удалена отдельной безопасной командой.

## 19. Версионирование контента

Сохранение должно ссылаться на конкретный `ContentVersion`.

Это защищает игрока от ситуации, когда сцена или предмет изменились после начала прохождения.

Правила:

- новая публикация контента создаёт новую `ContentVersion`;
- старые сохранения продолжают ссылаться на старую версию;
- миграция сохранений между версиями должна быть отдельной процедурой;
- `externalId` не должен переиспользоваться для другой сущности.

## 20. Индексы

Минимальный набор индексов:

```text
Game.externalId
ContentVersion.gameId
ContentVersion.status
Scene.contentVersionId + Scene.externalId
Scene.contentVersionId + Scene.type
Scene.contentVersionId + Scene.layer
Scene.tags
SceneChoice.sceneId
SceneChoice.targetSceneId
Character.contentVersionId + Character.externalId
Item.contentVersionId + Item.externalId
Quest.contentVersionId + Quest.externalId
Enemy.contentVersionId + Enemy.externalId
Ability.contentVersionId + Ability.externalId
Asset.contentVersionId + Asset.externalId
SaveSlot.userId
SaveSlot.currentSceneId
InventoryEntry.saveSlotId + InventoryEntry.itemId
QuestProgress.saveSlotId + QuestProgress.questId
RelationState.saveSlotId + RelationState.characterId
```

Для `tags` в PostgreSQL можно использовать GIN-индекс.

## 21. Что должно проверяться на уровне БД

База данных должна проверять:

- обязательные поля;
- уникальность внешних ID внутри версии контента;
- внешние ключи;
- базовые enum-значения;
- положительные количества предметов;
- диапазон `layer` от `1` до `9`;
- уникальность runtime-записей вроде `InventoryEntry` и `RelationState`.

## 22. Что должно проверяться в приложении

NestJS должен проверять:

- корректность условий;
- корректность эффектов;
- соответствие подтипа типу сцены;
- совместимость `targetType` и `target`;
- ссылки внутри JSONB-полей;
- правила обратной совместимости;
- возможность миграции сохранений.

Некоторые проверки неудобно или опасно переносить в SQL, потому что они зависят от правил движка.

## 23. Черновой порядок внедрения

Рекомендуемый порядок миграций:

1. `Game`, `ContentVersion`, `ContentImport`.
2. `Asset`, `Character`, `Item`.
3. `Quest`, `QuestStage`.
4. `Enemy`, `Ability`.
5. `Scene`, `SceneChoice`.
6. `SaveSlot`, `PlayerState`.
7. `InventoryEntry`, `QuestProgress`, `RelationState`.
8. Индексы и дополнительные ограничения.
9. Import Service.
10. Runtime Engine Services.

## 24. Минимальная первая версия БД

Если нужно быстро запустить вертикальный срез, достаточно:

- `Game`;
- `ContentVersion`;
- `Scene`;
- `SceneChoice`;
- `Asset`;
- `SaveSlot`;
- `PlayerState`.

Остальные таблицы можно добавить после того, как появится первый импорт сцен и переходов.

## 25. Открытые вопросы

Нужно уточнить:

- будет ли несколько игр в одной установке движка;
- нужны ли локализации на уровне отдельных строк;
- хранить ли `QuestObjective` отдельной таблицей;
- нужна ли отдельная таблица `Faction`;
- нужна ли отдельная таблица `Location`;
- как мигрировать сохранения между версиями контента;
- как хранить пользовательские моды и сторонние пакеты контента.

## Следующий документ

`07_Backend_Architecture.md`

