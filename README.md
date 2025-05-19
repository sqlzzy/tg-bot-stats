# tg-bot-stats

[![npm version](https://img.shields.io/npm/v/tg-bot-stats.svg)](https://www.npmjs.com/package/tg-bot-stats)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Russian version**: [README in Russian](README_RU.md)

A lightweight Node.js package for collecting and visualizing bot interaction statistics using SQLite for storage and Chart.js for visualization.

## Features

- 📊 Collect button click statistics from your bot
- 💾 Store data in SQLite database
- 📈 Visualize statistics with interactive charts
- 🕒 Track clicks over time (hourly, daily, monthly)
- 🔍 View detailed click information
- 🛠️ Customizable data schema

## Installation

```bash
npm install tg-bot-stats
```

## Quick Start

```javascript
import TgBotStats from 'tg-bot-stats';

// Initialize with custom schema
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

// Record a button click
await statsBot.recordClick({
  eventId: 'start_button',
  userId: 'user123',
  additionalData: { platform: 'telegram' }
});

// Launch dashboard
statsBot.startDashboard({
    port: 8888,
});
```

## API Documentation

### `new TgBotStats(options)`

Creates a new statistics collector instance.

**Options:**
- `dbPath` (String): Path to SQLite database file (default: './bot-stats.db')
- `defaultSchema` (Object): Database schema definition (default: basic button click schema)

### Methods

#### `recordClick(data)`
Records a button click event.

**Parameters:**
- `data` (Object): Click data object containing at least `eventId`

**Returns:** Promise that resolves when record is saved

#### `getEventStats(eventId)`
Gets all recorded clicks for a specific button.

**Parameters:**
- `eventId` (String): Button identifier

**Returns:** Promise that resolves with array of click records

#### `getAllStats()`
Gets aggregated statistics for all buttons.

**Returns:** Promise that resolves with summary statistics object

#### `getTimeSeriesStats(period)`
Gets time-based statistics.

**Parameters:**
- `period` (String): 'hour', 'day', 'month', or 'year' (default: 'day')

**Returns:** Promise that resolves with time series data

#### `startDashboard(options)`
Starts the statistics dashboard web server.

**Options:**
- `port` (Number): Port to listen on (default: 3000)

## Dashboard Features

1. **Interactive Charts**:
   - Line chart showing clicks over time
   - Bar chart showing total clicks per button

2. **Time Period Selection**:
   - View data grouped by hour, day, month, or year

3. **Detailed View**:
   - Click on any button in the bar chart to see detailed click records

## Customization

### Custom Data Schema

Extend the default schema to store additional information:

```javascript
const statsBot = new TgBotStats({
  defaultSchema: {
    eventId: 'TEXT',
    userId: 'TEXT',
    timestamp: 'DATETIME',
    additionalData: 'TEXT',
    // Your custom fields:
    chatType: 'TEXT',
    messageLength: 'INTEGER'
  }
});
```

## Examples

### Telegram Bot Example

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
  
  await bot.sendMessage(msg.chat.id, 'Welcome!');
});

// Start dashboard
statsBot.startDashboard({ port: 9999 });
```

## License

MIT © Osipov Sergey