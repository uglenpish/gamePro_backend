# 05. JSON Specification

Документ описывает базовый JSON-формат игрового контента для «Осколков Реальности» и Narrative Engine.

Версия спецификации: `0.1.0`
Статус: черновой стандарт

## 1. Назначение документа

JSON является единственным форматом обмена между редактором контента, импортёром и движком.

Эта спецификация описывает:

- структуру пакета игрового контента;
- формат сцен;
- формат выборов;
- формат условий;
- формат эффектов;
- базовые сущности игры;
- правила ссылок между объектами;
- минимальные правила валидации.

## 2. Что входит в спецификацию

Спецификация описывает контент, который импортируется в движок:

- сцены;
- персонажи;
- предметы;
- квесты;
- враги;
- способности;
- ассеты;
- стартовые настройки игрового состояния.

## 3. Что не входит в спецификацию

Этот документ не описывает:

- физическую структуру таблиц PostgreSQL;
- формат сохранений игрока;
- API-ответы NestJS;
- внутренние frontend-компоненты Vue;
- синтаксис Twine DSL.

Эти темы должны быть оформлены отдельными документами.

## 4. Главный принцип

JSON описывает, что должно произойти.

Движок решает, как это выполнить.

Контент не должен содержать программный код, вызовы backend-сервисов или привязку к конкретной реализации.

Плохо:

```json
{
  "onClick": "InventoryService.addItem(playerId, 'item_seal_fragment')"
}
```

Хорошо:

```json
{
  "type": "add_item",
  "itemId": "item_seal_fragment",
  "quantity": 1
}
```

## 5. Общие правила

Все JSON-файлы должны соблюдать правила:

- кодировка: UTF-8;
- формат: валидный JSON без комментариев;
- идентификаторы стабильны и не меняются после публикации;
- ссылки между объектами выполняются по `id`;
- массивы не должны содержать дубликаты;
- неизвестные поля запрещены, кроме полей с префиксом `x_`;
- порядок объектов в массивах не должен влиять на логику игры;
- вся игровая логика описывается через условия и эффекты.

Поля с префиксом `x_` считаются экспериментальными. Движок может игнорировать их без ошибки.

## 6. Идентификаторы

Идентификатор должен быть строкой в `snake_case`.

Разрешены:

- латинские буквы в нижнем регистре;
- цифры;
- символ `_`.

Примеры:

```text
l1_001_apartment_wakeup
char_voron
item_seal_fragment
quest_broken_seal
enemy_cultist_knife
ability_seal_strike
asset_apartment_night_bg
```

Рекомендуемые префиксы:

| Сущность | Префикс | Пример |
| --- | --- | --- |
| Scene | `l{layer}_` | `l1_001_apartment_wakeup` |
| Character | `char_` | `char_monk` |
| Item | `item_` | `item_seal_fragment` |
| Quest | `quest_` | `quest_broken_seal` |
| Enemy | `enemy_` | `enemy_cultist_knife` |
| Ability | `ability_` | `ability_seal_strike` |
| Asset | `asset_` | `asset_apartment_night_bg` |

## 7. Пакет контента

Корневой объект называется Content Bundle.

Минимальная структура:

```json
{
  "schemaVersion": "0.1.0",
  "gameId": "shards_of_reality",
  "locale": "ru",
  "metadata": {
    "title": "Осколки Реальности",
    "description": "Сюжетная RPG о Хранителях Печатей.",
    "contentVersion": "0.1.0"
  },
  "startSceneId": "l1_001_apartment_wakeup",
  "initialState": {},
  "scenes": [],
  "characters": [],
  "items": [],
  "quests": [],
  "enemies": [],
  "abilities": [],
  "assets": []
}
```

### Поля Content Bundle

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `schemaVersion` | string | да | Версия JSON-спецификации. |
| `gameId` | string | да | Идентификатор игры. |
| `locale` | string | да | Основной язык контента. |
| `metadata` | object | да | Метаданные пакета. |
| `startSceneId` | string | да | ID первой сцены. |
| `initialState` | object | да | Начальное состояние игрока. |
| `scenes` | Scene[] | да | Сцены. |
| `characters` | Character[] | да | Персонажи. |
| `items` | Item[] | да | Предметы. |
| `quests` | Quest[] | да | Квесты. |
| `enemies` | Enemy[] | да | Враги. |
| `abilities` | Ability[] | да | Способности. |
| `assets` | Asset[] | да | Изображения, музыка, портреты и другие ресурсы. |

## 8. Metadata

```json
{
  "title": "Осколки Реальности",
  "description": "Сюжетная RPG с расследованиями и путешествиями между слоями реальности.",
  "contentVersion": "0.1.0",
  "authors": ["gamesPro"],
  "createdAt": "2026-07-08T00:00:00.000Z",
  "updatedAt": "2026-07-08T00:00:00.000Z"
}
```

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `title` | string | да | Название игры или пакета. |
| `description` | string | нет | Краткое описание. |
| `contentVersion` | string | да | Версия игрового контента. |
| `authors` | string[] | нет | Авторы. |
| `createdAt` | string | нет | Дата создания в ISO 8601. |
| `updatedAt` | string | нет | Дата обновления в ISO 8601. |

## 9. Scene

Scene - минимальная единица повествования.

Сцена должна иметь одну смысловую цель: разговор, исследование, бой, путешествие, выбор, катсцену или финал.

### Структура Scene

```json
{
  "id": "l1_001_apartment_wakeup",
  "type": "story",
  "subtype": "intro",
  "title": "Пробуждение в квартире",
  "layer": 1,
  "tags": ["layer1", "night", "story_critical"],
  "content": [
    {
      "type": "paragraph",
      "text": "Ворон открывает глаза в тёмной комнате."
    }
  ],
  "assets": {
    "backgroundId": "asset_apartment_night_bg",
    "musicId": "asset_low_drone_theme"
  },
  "conditions": [],
  "enterEffects": [
    {
      "type": "set_flag",
      "flag": "intro_started",
      "value": true
    }
  ],
  "choices": [
    {
      "id": "choice_explore_room",
      "text": "Осмотреть комнату",
      "target": {
        "type": "scene",
        "sceneId": "l1_002_apartment_explore"
      }
    }
  ]
}
```

### Поля Scene

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | Стабильный ID сцены. |
| `type` | SceneType | да | Тип сцены. |
| `subtype` | string | нет | Подтип сцены. |
| `title` | string | нет | Человекочитаемое название для редактора. |
| `layer` | number | нет | Слой реальности от `1` до `9`. |
| `tags` | string[] | да | Теги сцены. |
| `content` | ContentBlock[] | да | Текстовое содержимое сцены. |
| `assets` | SceneAssets | нет | Ассеты, используемые сценой. |
| `conditions` | Condition[] | нет | Условия доступности сцены. |
| `enterEffects` | Effect[] | нет | Эффекты при входе в сцену. |
| `exitEffects` | Effect[] | нет | Эффекты при выходе из сцены. |
| `choices` | Choice[] | нет | Варианты выбора игрока. |
| `defaultTarget` | Target | нет | Автоматический переход, если выбора нет. |
| `data` | object | нет | Данные, специфичные для типа сцены. |

## 10. SceneType

Разрешённые типы сцен:

```json
[
  "story",
  "dialogue",
  "exploration",
  "travel",
  "combat",
  "cutscene",
  "choice",
  "ending"
]
```

Тип выбирается по игровой функции, а не по настроению или сюжетному названию.

## 11. ContentBlock

`content` хранит текст сцены в виде массива блоков.

Это позволяет смешивать описание, реплики, внутренние мысли и системные сообщения без привязки к UI.

### paragraph

```json
{
  "type": "paragraph",
  "text": "Комната пахла дождём, пеплом и старой проводкой."
}
```

### dialogue_line

```json
{
  "type": "dialogue_line",
  "speakerId": "char_monk",
  "text": "Ты опять слышал Печать?"
}
```

### thought

```json
{
  "type": "thought",
  "text": "Это был не сон. Слишком ровный след, слишком холодный воздух."
}
```

### system

```json
{
  "type": "system",
  "text": "Получен новый фрагмент воспоминания."
}
```

Разрешённые типы блоков:

```json
[
  "paragraph",
  "dialogue_line",
  "thought",
  "system"
]
```

## 12. Choice

Choice описывает действие игрока и переход к следующему состоянию повествования.

```json
{
  "id": "choice_take_fragment",
  "text": "Поднять осколок",
  "conditions": [
    {
      "type": "not",
      "condition": {
        "type": "has_item",
        "itemId": "item_seal_fragment"
      }
    }
  ],
  "effects": [
    {
      "type": "add_item",
      "itemId": "item_seal_fragment",
      "quantity": 1
    }
  ],
  "target": {
    "type": "scene",
    "sceneId": "l1_003_phone_call"
  }
}
```

### Поля Choice

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | ID выбора внутри сцены. |
| `text` | string | да | Текст выбора. |
| `conditions` | Condition[] | нет | Условия показа или доступности. |
| `effects` | Effect[] | нет | Эффекты перед переходом. |
| `target` | Target | да | Куда ведёт выбор. |
| `isCritical` | boolean | нет | Пометка важного решения. |

## 13. Target

Target описывает результат перехода.

### Переход к сцене

```json
{
  "type": "scene",
  "sceneId": "l1_002_apartment_explore"
}
```

### Возврат в предыдущую сцену

```json
{
  "type": "return"
}
```

### Завершение игры или ветки

```json
{
  "type": "ending",
  "endingId": "ending_seal_saved"
}
```

Разрешённые типы:

```json
[
  "scene",
  "return",
  "ending"
]
```

## 14. Condition

Condition описывает условие, которое проверяет движок.

Условия не должны содержать программный код.

### all

Все вложенные условия должны быть истинны.

```json
{
  "type": "all",
  "conditions": [
    {
      "type": "flag_equals",
      "flag": "intro_started",
      "value": true
    },
    {
      "type": "has_item",
      "itemId": "item_seal_fragment"
    }
  ]
}
```

### any

Хотя бы одно вложенное условие должно быть истинно.

```json
{
  "type": "any",
  "conditions": [
    {
      "type": "quest_state",
      "questId": "quest_broken_seal",
      "state": "active"
    },
    {
      "type": "relation_compare",
      "characterId": "char_monk",
      "operator": ">=",
      "value": 5
    }
  ]
}
```

### not

Инвертирует вложенное условие.

```json
{
  "type": "not",
  "condition": {
    "type": "flag_exists",
    "flag": "monk_dead"
  }
}
```

### flag_exists

```json
{
  "type": "flag_exists",
  "flag": "seal_seen"
}
```

### flag_equals

```json
{
  "type": "flag_equals",
  "flag": "intro_started",
  "value": true
}
```

### stat_compare

```json
{
  "type": "stat_compare",
  "stat": "sanity",
  "operator": ">=",
  "value": 40
}
```

### has_item

```json
{
  "type": "has_item",
  "itemId": "item_seal_fragment",
  "quantity": 1
}
```

### quest_state

```json
{
  "type": "quest_state",
  "questId": "quest_broken_seal",
  "state": "active"
}
```

### relation_compare

```json
{
  "type": "relation_compare",
  "characterId": "char_monk",
  "operator": ">=",
  "value": 5
}
```

### Операторы сравнения

```json
[
  "==",
  "!=",
  ">",
  ">=",
  "<",
  "<="
]
```

## 15. Effect

Effect описывает изменение игрового состояния.

Эффекты выполняются движком, а не сценой.

### set_flag

```json
{
  "type": "set_flag",
  "flag": "intro_started",
  "value": true
}
```

### unset_flag

```json
{
  "type": "unset_flag",
  "flag": "temporary_vision_active"
}
```

### change_stat

```json
{
  "type": "change_stat",
  "stat": "sanity",
  "delta": -5
}
```

### set_stat

```json
{
  "type": "set_stat",
  "stat": "awareness",
  "value": 10
}
```

### add_item

```json
{
  "type": "add_item",
  "itemId": "item_seal_fragment",
  "quantity": 1
}
```

### remove_item

```json
{
  "type": "remove_item",
  "itemId": "item_old_key",
  "quantity": 1
}
```

### start_quest

```json
{
  "type": "start_quest",
  "questId": "quest_broken_seal"
}
```

### set_quest_stage

```json
{
  "type": "set_quest_stage",
  "questId": "quest_broken_seal",
  "stageId": "inspect_apartment"
}
```

### complete_quest

```json
{
  "type": "complete_quest",
  "questId": "quest_broken_seal"
}
```

### fail_quest

```json
{
  "type": "fail_quest",
  "questId": "quest_broken_seal"
}
```

### change_relation

```json
{
  "type": "change_relation",
  "characterId": "char_monk",
  "delta": 3
}
```

## 16. InitialState

`initialState` задаёт начальное состояние игрока.

Это не формат сохранения. Это только стартовые значения для новой игры.

```json
{
  "player": {
    "health": 100,
    "sanity": 80,
    "stats": {
      "awareness": 0,
      "seal_mastery": 5,
      "combat": 7
    }
  },
  "flags": {},
  "inventory": [],
  "quests": {},
  "relations": {
    "char_monk": 0
  }
}
```

### Рекомендуемые разделы InitialState

| Поле | Тип | Описание |
| --- | --- | --- |
| `player` | object | Базовое состояние героя. |
| `flags` | object | Булевы или простые сюжетные флаги. |
| `inventory` | InventoryEntry[] | Предметы на старте. |
| `quests` | object | Начальные состояния квестов. |
| `relations` | object | Отношения с персонажами. |

## 17. Character

Character описывает NPC или важного персонажа.

```json
{
  "id": "char_monk",
  "name": "Монах",
  "role": "keeper",
  "factionId": "keepers",
  "description": "Один из Хранителей, знающий старые ритуалы.",
  "portraitAssetId": "asset_portrait_monk",
  "tags": ["keeper", "ally", "story_critical"],
  "initialRelation": 0
}
```

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | ID персонажа. |
| `name` | string | да | Имя для отображения. |
| `role` | string | нет | Роль в истории или мире. |
| `factionId` | string | нет | Фракция. |
| `description` | string | нет | Описание. |
| `portraitAssetId` | string | нет | Портрет. |
| `tags` | string[] | да | Теги. |
| `initialRelation` | number | нет | Начальное отношение к игроку. |

## 18. Item

Item описывает предмет.

```json
{
  "id": "item_seal_fragment",
  "name": "Осколок Печати",
  "type": "quest",
  "description": "Холодный фрагмент древней конструкции, удерживающей границы реальности.",
  "stackable": false,
  "maxStack": 1,
  "tags": ["seal", "story_critical", "layer1"]
}
```

### ItemType

```json
[
  "quest",
  "consumable",
  "equipment",
  "key",
  "lore",
  "resource"
]
```

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | ID предмета. |
| `name` | string | да | Название. |
| `type` | ItemType | да | Тип предмета. |
| `description` | string | нет | Описание. |
| `stackable` | boolean | да | Можно ли складывать. |
| `maxStack` | number | нет | Максимальное количество в стопке. |
| `tags` | string[] | да | Теги. |
| `effects` | Effect[] | нет | Эффекты при использовании предмета. |

## 19. Quest

Quest описывает квест как контент. Текущее состояние квеста хранится в Game State, а не внутри Quest.

```json
{
  "id": "quest_broken_seal",
  "title": "Сломанная Печать",
  "description": "Ворон должен найти источник Разлома в своей квартире.",
  "tags": ["main", "layer1", "seal"],
  "stages": [
    {
      "id": "inspect_apartment",
      "title": "Осмотреть квартиру",
      "description": "Найти следы нарушения реальности.",
      "objectives": [
        {
          "id": "find_fragment",
          "type": "collect_item",
          "itemId": "item_seal_fragment",
          "quantity": 1
        }
      ]
    }
  ]
}
```

### QuestStage

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | ID стадии внутри квеста. |
| `title` | string | да | Название стадии. |
| `description` | string | нет | Описание. |
| `objectives` | QuestObjective[] | да | Цели стадии. |
| `onStartEffects` | Effect[] | нет | Эффекты при старте стадии. |
| `onCompleteEffects` | Effect[] | нет | Эффекты при завершении стадии. |

### QuestObjectiveType

```json
[
  "reach_scene",
  "collect_item",
  "talk_to_character",
  "defeat_enemy",
  "set_flag"
]
```

## 20. Enemy

Enemy описывает шаблон противника.

```json
{
  "id": "enemy_cultist_knife",
  "name": "Культист с ножом",
  "factionId": "cultists",
  "description": "Одержимый человек, действующий как посредник демонического влияния.",
  "tags": ["cultist", "human", "layer1"],
  "stats": {
    "health": 35,
    "attack": 8,
    "defense": 3,
    "speed": 5
  },
  "abilities": ["ability_knife_attack"],
  "rewards": [
    {
      "type": "change_stat",
      "stat": "awareness",
      "delta": 1
    }
  ]
}
```

## 21. Ability

Ability описывает способность персонажа, врага или предмета.

```json
{
  "id": "ability_seal_strike",
  "name": "Удар Печатью",
  "type": "attack",
  "target": "enemy",
  "cost": {
    "sanity": 3
  },
  "effects": [
    {
      "type": "change_stat",
      "stat": "enemy_health",
      "delta": -12
    }
  ],
  "tags": ["seal", "combat"]
}
```

### AbilityType

```json
[
  "attack",
  "defense",
  "support",
  "ritual",
  "passive"
]
```

### AbilityTarget

```json
[
  "self",
  "ally",
  "enemy",
  "all_enemies",
  "scene"
]
```

## 22. Asset

Asset описывает ресурс, который может использовать frontend.

```json
{
  "id": "asset_apartment_night_bg",
  "type": "image",
  "src": "assets/images/apartment_night.webp",
  "alt": "Тёмная квартира Ворона ночью",
  "tags": ["background", "layer1", "night"]
}
```

### AssetType

```json
[
  "image",
  "audio",
  "video",
  "animation",
  "portrait",
  "background"
]
```

| Поле | Тип | Обязательное | Описание |
| --- | --- | --- | --- |
| `id` | string | да | ID ассета. |
| `type` | AssetType | да | Тип ресурса. |
| `src` | string | да | Путь к файлу. |
| `alt` | string | нет | Описание для изображения. |
| `tags` | string[] | да | Теги. |

## 23. SceneAssets

SceneAssets связывает сцену с ресурсами отображения.

```json
{
  "backgroundId": "asset_apartment_night_bg",
  "musicId": "asset_low_drone_theme",
  "ambientId": "asset_rain_window_loop",
  "portraitIds": ["asset_portrait_voron", "asset_portrait_monk"]
}
```

| Поле | Тип | Описание |
| --- | --- | --- |
| `backgroundId` | string | Фоновое изображение. |
| `musicId` | string | Музыкальная тема. |
| `ambientId` | string | Фоновый звук. |
| `portraitIds` | string[] | Портреты персонажей. |

## 24. Type-specific Scene data

Поле `data` используется для данных, которые нужны конкретному типу сцены.

### dialogue

```json
{
  "data": {
    "participants": ["char_voron", "char_monk"],
    "defaultSpeakerId": "char_monk"
  }
}
```

### exploration

```json
{
  "data": {
    "locationId": "location_voron_apartment",
    "pointsOfInterest": [
      {
        "id": "desk",
        "label": "Стол",
        "target": {
          "type": "scene",
          "sceneId": "l1_002_apartment_desk"
        }
      }
    ]
  }
}
```

### travel

```json
{
  "data": {
    "from": "location_voron_apartment",
    "to": "location_keeper_base",
    "travelMode": "car"
  }
}
```

### combat

```json
{
  "data": {
    "enemyIds": ["enemy_cultist_knife"],
    "onVictory": {
      "type": "scene",
      "sceneId": "l1_021_after_ambush"
    },
    "onDefeat": {
      "type": "ending",
      "endingId": "ending_voron_falls"
    }
  }
}
```

## 25. Полный пример сцены

```json
{
  "id": "l1_002_apartment_explore",
  "type": "exploration",
  "subtype": "room",
  "title": "Осмотр квартиры",
  "layer": 1,
  "tags": ["layer1", "night", "investigation"],
  "content": [
    {
      "type": "paragraph",
      "text": "Квартира кажется прежней, но Ворон видит то, что не должен видеть обычный человек."
    },
    {
      "type": "thought",
      "text": "След Разлома слишком свежий."
    }
  ],
  "assets": {
    "backgroundId": "asset_apartment_night_bg",
    "ambientId": "asset_rain_window_loop"
  },
  "choices": [
    {
      "id": "choice_check_table",
      "text": "Осмотреть стол",
      "target": {
        "type": "scene",
        "sceneId": "l1_003_apartment_table"
      }
    },
    {
      "id": "choice_answer_phone",
      "text": "Ответить на звонок",
      "conditions": [
        {
          "type": "flag_equals",
          "flag": "phone_ringing",
          "value": true
        }
      ],
      "target": {
        "type": "scene",
        "sceneId": "l1_004_phone_call"
      }
    }
  ]
}
```

## 26. Правила валидации

Импортёр должен проверять:

1. `schemaVersion` поддерживается движком.
2. `gameId` заполнен.
3. `startSceneId` указывает на существующую сцену.
4. Все `id` уникальны внутри своего типа сущности.
5. Все ссылки на сцены, персонажей, предметы, квесты, врагов, способности и ассеты существуют.
6. Все сцены имеют `id`, `type`, `tags` и `content`.
7. Все типы сцен входят в список разрешённых SceneType.
8. Подтипы соответствуют типу сцены, если подтип указан.
9. `layer` находится в диапазоне от `1` до `9`, если поле указано.
10. `choice` всегда имеет `id`, `text` и `target`.
11. `ending`-сцена не обязана иметь `choices` или `defaultTarget`.
12. `combat`-сцена должна иметь список врагов или отдельное правило старта боя в `data`.
13. Условия и эффекты используют только известные типы.
14. Контент не содержит программного кода.
15. JSON не содержит неизвестных полей, кроме `x_`-полей.

## 27. Совместимость версий

Версия `0.1.0` считается первой черновой версией.

После утверждения спецификации нужно соблюдать обратную совместимость:

- новые поля должны быть опциональными;
- старые поля нельзя удалять без миграции;
- изменение смысла существующего поля запрещено;
- импортёр должен явно сообщать, какую версию схемы он поддерживает.

## 28. Рекомендации для AI-агентов

AI при генерации JSON обязан:

- проверять сцены по World Bible;
- использовать только утверждённые SceneType;
- сохранять стабильные ID;
- объединять ветки, если они ведут к одному событию;
- не создавать сцены-дубликаты ради мелких отличий;
- описывать последствия через Effect;
- описывать доступность через Condition;
- не добавлять код, названия backend-сервисов или frontend-компонентов внутрь JSON.

## 29. Открытые вопросы

Нужно уточнить в следующих документах:

- точный формат Twine DSL;
- финальную JSON Schema для автоматической валидации;
- структуру PostgreSQL после импорта;
- формат API-ответов backend;
- формат сохранений игрока;
- детальную систему боя;
- детальную систему квестов;
- локализацию и поддержку нескольких языков.

## Следующий документ

[06_Database.md](06_Database.md)
