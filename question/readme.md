# Oskolki Reality Narrative Format

## Twine Narrative DSL Specification

Версия: 0.1

---

# Идея системы

Twine используется как:

* визуальный редактор сюжета
* граф ветвлений
* редактор сцен
* narrative scripting system

Twine НЕ является финальным движком.

Игровая логика, UI, инвентарь, бой и анимации будут реализованы в:

* Nest.js
* Vue 3
* PostgreSQL

Twine содержит:

* сюжет
* сцены
* переходы
* narrative state
* триггеры
* метаданные

---

# Общий формат сцены

Пример:

```twine
:: l1_apartment_intro

[TYPE: story]
[LOCATION: apartment]
[LAYER: 1]

[BG: apartment_night]
[MUSIC: rain_loop]

Вы просыпаетесь от телефонного звонка.

[[Ответить->layer1_phone_call]]
```

---

# Синтаксис

## Метаданные

Формат:

```text
[KEY: value]
```

---

# БАЗОВЫЕ КЛЮЧИ

---

# TYPE

Тип сцены.

```text
[TYPE: story]
```

## Возможные значения

| Значение    | Описание      |
| ----------- | ------------- |
| story       | обычная сцена |
| dialogue    | диалог        |
| combat      | бой           |
| exploration | исследование  |
| cutscene    | катсцена      |
| menu        | меню          |
| dream       | сон           |
| ending      | концовка      |

---

# LOCATION

Локация сцены.

```text
[LOCATION: apartment]
```

Примеры:

```text
[LOCATION: city]
[LOCATION: layer5_ruins]
[LOCATION: underground_temple]
```

---

# LAYER

Слой реальности.

```text
[LAYER: 1]
```

Используется для:

* атмосферы
* UI
* эффектов
* музыки
* логики мира

---

# BG

Фоновое изображение сцены.

```text
[BG: apartment_night]
```

Vue-клиент должен загрузить:

```text
assets/backgrounds/apartment_night.jpg
```

---

# MUSIC

Фоновая музыка.

```text
[MUSIC: rain_loop]
```

---

# SFX

Звуковой эффект.

```text
[SFX: phone_ring]
```

---

# NPC

Главный NPC сцены.

```text
[NPC: keeper_maria]
```

---

# CUTSCENE

Запуск катсцены.

```text
[CUTSCENE: awakening]
```

---

# LAYER_SHIFT

Переход между слоями реальности.

```text
[LAYER_SHIFT: 2]
```

---

# ENDING

Тип концовки.

```text
[ENDING: true_guardian]
```

---

# INVENTORY SYSTEM

---

# ADD_ITEM

Добавить предмет.

```text
[ADD_ITEM: guardian_amulet]
```

---

# REMOVE_ITEM

Удалить предмет.

```text
[REMOVE_ITEM: old_key]
```

---

# REQUIRES

Требование предмета или способности.

```text
[REQUIRES: seal_fire]
```

---

# CHARACTER STATE

---

# SET

Изменение boolean/state значения.

```text
[SET: phoneAnswered=true]
```

Примеры:

```text
[SET: mirrorSeen=true]
[SET: firstSealBroken=false]
```

---

# ADD

Изменение числового параметра.

```text
[ADD: sanity -10]
```

Примеры:

```text
[ADD: corruption 5]
[ADD: exp 100]
[ADD: reputation_keepers 2]
```

---

# IF

Условие отображения текста.

```text
[IF: sanity < 50]

Стены начинают двигаться.

[/IF]
```

---

# QUEST SYSTEM

---

# QUEST_START

Начало квеста.

```text
[QUEST_START: broken_first_seal]
```

---

# QUEST_COMPLETE

Завершение квеста.

```text
[QUEST_COMPLETE: broken_first_seal]
```

---

# COMBAT SYSTEM

---

# ENEMY

Враг сцены.

```text
[ENEMY: possessed_human_01]
```

---

# BOSS

Босс сцены.

```text
[BOSS: layer5_guardian]
```

---

# COMBAT TYPE

```text
[TYPE: combat]
```

Движок должен автоматически открыть combat UI.

---

# RELATIONSHIP SYSTEM

---

# RELATION

Изменение отношений с NPC.

```text
[RELATION: maria +2]
```

---

# CHOICE SYSTEM

---

# Обычный выбор

```twine
[[Ответить->phone_call]]
```

---

# CHOICE_REQUIRES

Требование для выбора.

```text
[CHOICE_REQUIRES: seal_fire]
```

---

# TAGS

Twine tags рекомендуется использовать для:

* фильтрации
* поиска
* редактора
* генерации контента

Примеры:

```text
combat
dream
boss
layer2
safezone
cultists
```

---

# NAMING CONVENTIONS

Рекомендуемый формат названий passages:

```text
layer1_apartment_intro
layer1_phone_call
layer2_first_gate
combat_servant_01
ending_true_guardian
```

НЕ рекомендуется:

```text
Дом
Сцена1
Телефон
```

---

# ПРИМЕР ПОЛНОЙ СЦЕНЫ

```twine
:: layer1_phone_call

[TYPE: story]
[LOCATION: apartment]
[LAYER: 1]

[BG: apartment_phone_light]
[MUSIC: dark_ambient]
[SFX: phone_static]

[SET: phoneAnswered=true]

Вы поднимаете трубку.

Несколько секунд слышны только помехи.

Потом голос произносит:

— Ворон… печать треснула.

[QUEST_START: broken_first_seal]

[[Осмотреть квартиру->layer1_apartment_look]]
```

---

# ПРИМЕР БОЯ

```twine
:: combat_first_servant

[TYPE: combat]

[LOCATION: ruined_corridor]
[LAYER: 2]

[BG: ruined_corridor]
[MUSIC: combat_layer2]

[ENEMY: servant_01]

Из темноты выходит человек с искажённым лицом.

[[Начать бой->battle_start]]
```

---

# ПРИМЕР ИНВЕНТАРЯ

```twine
:: layer1_take_amulet

[TYPE: item]

[ADD_ITEM: guardian_amulet]

Вы берёте амулет хранителя.

[[Назад->layer1_apartment]]
```

---

# РЕКОМЕНДАЦИИ

Twine используется только для:

* narrative
* branching
* story flow
* quest flow

НЕ рекомендуется реализовывать в Twine:

* полноценный бой
* UI
* анимации
* inventory rendering
* save system
* RPG calculations

Это должен делать движок.

---

# ЦЕЛЕВАЯ АРХИТЕКТУРА

Twine
↓
Parser
↓
JSON
↓
Nest.js Engine
↓
Vue 3 Client
↓
PostgreSQL
