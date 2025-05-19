# tg-bot-stats

[![npm version](https://img.shields.io/npm/v/tg-bot-stats.svg)](https://www.npmjs.com/package/tg-bot-stats)
[![Лицензия: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**English version**: [README in English](README.md)

Лёгкий Node.js пакет для сбора и визуализации статистики взаимодействий с ботом, использующий SQLite для хранения данных и Chart.js для визуализации.

## Возможности

- 📊 Сбор статистики нажатий кнопок и команд бота
- 💾 Хранение данных в SQLite базе
- 📈 Визуализация статистики с интерактивными графиками
- 🕒 Отслеживание нажатий по времени (часы, дни, месяцы)
- 🔍 Просмотр детальной информации о нажатиях
- 🛠️ Настраиваемая схема данных

## Установка

```bash
npm install tg-bot-stats
```

## Быстрый старт

```javascript
import TgBotStats from 'tg-bot-stats';

// Инициализация с кастомной схемой
const statsBot = new TgBotStats({
    dbPath: "./src/databases/bot_stats.db",
    defaultSchema: {
        eventId: "TEXT",
        userId: "TEXT",
        username: "TEXT",
        timestamp: "DATETIME",
        additionalData: "TEXT",
    },
});

// Запись нажатия кнопки
await statsBot.recordClick({
  eventId: 'start_button',
  userId: 'user123',
  additionalData: { platform: 'telegram' }
});

// Запуск дашборда
statsBot.startDashboard({
    port: 8888,
});
```

## Документация API

### `new TgBotStats(options)`

Создаёт новый экземпляр сборщика статистики.

**Параметры:**
- `dbPath` (String): Путь к файлу SQLite (по умолчанию: './bot-stats.db')
- `defaultSchema` (Object): Схема базы данных (по умолчанию: базовая схема для кнопок)

### Методы

#### `recordClick(data)`
Записывает факт нажатия кнопки.

**Параметры:**
- `data` (Object): Объект с данными о нажатии (минимум `eventId`)

**Возвращает:** Promise, который выполняется после сохранения записи

#### `getEventStats(eventId)`
Получает все записи о нажатиях конкретного события.

**Параметры:**
- `eventId` (String): Идентификатор кнопки

**Возвращает:** Promise с массивом записей о нажатиях

#### `getAllStats()`
Получает агрегированную статистику по всем кнопкам.

**Возвращает:** Promise с объектом сводной статистики

#### `getTimeSeriesStats(period)`
Получает статистику по времени.

**Параметры:**
- `period` (String): 'hour', 'day', 'month' или 'year' (по умолчанию: 'day')

**Возвращает:** Promise с данными временных рядов

#### `startDashboard(options)`
Запускает веб-сервер с дашбордом статистики.

**Параметры:**
- `port` (Number): Порт для сервера (по умолчанию: 3000)

## Возможности дашборда

1. **Интерактивные графики**:
   - Линейный график нажатий по времени
   - Столбчатая диаграмма общего количества нажатий

2. **Выбор периода**:
   - Просмотр данных по часам, дням, месяцам или годам

3. **Детальный просмотр**:
   - Клик по кнопке в диаграмме показывает детальную информацию

## Настройка

### Кастомная схема данных

Расширьте стандартную схему для хранения дополнительной информации:

```javascript
const statsBot = new TgBotStats({
  defaultSchema: {
    eventId: 'TEXT',
    userId: 'TEXT',
    timestamp: 'DATETIME',
    additionalData: 'TEXT',
    // Ваши кастомные поля:
    chatType: 'TEXT',
    messageLength: 'INTEGER'
  }
});
```

## Примеры

### Пример для Telegram бота

```javascript
import TgBotStats from 'tg-bot-stats';
import TelegramBot from 'node-telegram-bot-api';

const statsBot = new TgBotStats();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  await statsBot.recordClick({
    eventId: 'start_command',
    userId: msg.from.id.toString(),
    additionalData: {
      username: msg.from.username,
      language: msg.from.language_code
    }
  });
  
  await bot.sendMessage(msg.chat.id, 'Добро пожаловать!');
});

// Запуск дашборда
statsBot.startDashboard({ port: 9999 });
```

## Лицензия

MIT © Osipov Sergey