import sqlite3 from "sqlite3";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import express from "express";

class TelegramBotStats {
	constructor(options = {}) {
		this.dbPath = options.dbPath || "./bot-stats.db";
		this.schema = options.defaultSchema || {
			eventId: "TEXT",
			userId: "TEXT",
			timestamp: "DATETIME",
			additionalData: "TEXT",
		};

		this.db = null;
		this.initializeDatabase();
	}

	initializeDatabase() {
		const dbExists = existsSync(this.dbPath);

		this.db = new sqlite3.Database(this.dbPath, (err) => {
			if (err) {
				console.error("Ошибка подключения к базе данных:", err);
				return;
			}

			if (!dbExists) {
				this.createTables();
			}
		});
	}

	createTables() {
		const columns = Object.entries(this.schema)
			.map(([name, type]) => `${name} ${type}`)
			.join(", ");

		const createTableSQL = `CREATE TABLE IF NOT EXISTS bot_stats (${columns})`;

		this.db.run(createTableSQL, (err) => {
			if (err) {
				console.error("Ошибка при создании таблицы:", err);
			} else {
				console.log("Таблица создана успешно");
			}
		});
	}

	async recordClick(data) {
		const timestamp = new Date().toISOString();
		const completeData = { timestamp, ...data };

		if (completeData.additionalData && typeof completeData.additionalData !== "string") {
			completeData.additionalData = JSON.stringify(completeData.additionalData);
		}

		const columns = Object.keys(completeData).join(", ");
		const placeholders = Object.keys(completeData)
			.map(() => "?")
			.join(", ");
		const values = Object.values(completeData);

		return new Promise((resolve, reject) => {
			this.db.run(`INSERT INTO bot_stats (${columns}) VALUES (${placeholders})`, values, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	async getEventStats(eventId) {
		return new Promise((resolve, reject) => {
			this.db.all(`SELECT * FROM bot_stats WHERE eventId = ? ORDER BY timestamp DESC`, [eventId], (err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	async getAllStats() {
		return new Promise((resolve, reject) => {
			this.db.all(
				`SELECT eventId, COUNT(*) as count, 
         MIN(timestamp) as firstClick, 
         MAX(timestamp) as lastClick 
         FROM bot_stats GROUP BY eventId`,
				(err, rows) => {
					if (err) {
						reject(err);
					} else {
						resolve(rows);
					}
				},
			);
		});
	}

	async getTimeSeriesStats(period = "day") {
		let format;
		switch (period) {
			case "hour":
				format = "%Y-%m-%d %H:00:00";
				break;
			case "month":
				format = "%Y-%m-01";
				break;
			case "year":
				format = "%Y-01-01";
				break;
			default: // day
				format = "%Y-%m-%d";
		}

		return new Promise((resolve, reject) => {
			this.db.all(
				`SELECT 
                strftime('${format}', 
                datetime(timestamp, 'localtime')
            ) as period, 
            eventId, 
            COUNT(*) as count 
            FROM bot_stats 
            GROUP BY period, eventId 
            ORDER BY period ASC`,
				(err, rows) => {
					if (err) {
						reject(err);
					} else {
						resolve(rows);
					}
				},
			);
		});
	}

	startDashboard(options = {}) {
		const app = express();
		const port = options.port || 3000;

		app.use(express.static(path.join(__dirname, "public")));

		app.get("/api/stats", async (req, res) => {
			try {
				const stats = await this.getAllStats();
				res.json(stats);
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		});

		app.get("/api/timeseries", async (req, res) => {
			try {
				const period = req.query.period || "day";
				const stats = await this.getTimeSeriesStats(period);
				res.json(stats);
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		});

		app.get("/api/event/:id", async (req, res) => {
			try {
				const stats = await this.getEventStats(req.params.id);
				res.json(stats);
			} catch (err) {
				res.status(500).json({ error: err.message });
			}
		});

		app.listen(port, () => {
			console.log(`Статистика доступна по адресу: http://localhost:${port}`);
		});
	}
}

export default TelegramBotStats;
