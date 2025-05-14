document.addEventListener("DOMContentLoaded", async function () {
	const periodSelect = document.getElementById("periodSelect");
	let clicksChart, eventsChart;

	async function loadData() {
		const period = periodSelect.value;

		try {
			const summaryResponse = await fetch("/api/stats");
			const summaryData = await summaryResponse.json();

			renderEventsChart(summaryData);

			const timeSeriesResponse = await fetch(`/api/timeseries?period=${period}`);
			const timeSeriesData = await timeSeriesResponse.json();

			renderClicksChart(timeSeriesData , period);
		} catch (error) {
			console.error("Ошибка загрузки данных:", error);
		}
	}

	function renderClicksChart(data, period) {
		const ctx = document.getElementById("clicksChart").getContext("2d");
		const groupedData = {};
		const textPeriods = {
			hour: "по часам",
			day: "по дням",
			month: "по месяцам",
			year: "по годам",
		};

		data.forEach((item) => {
			if (!groupedData[item.period]) {
				groupedData[item.period] = {};
			}
            console.log(item, 'item')
			groupedData[item.period][item.eventId] = item.count;
		});

		const eventIds = [...new Set(data.map((item) => item.eventId))];

		const datasets = eventIds.map((eventId) => {
			return {
				label: eventId,
				data: Object.keys(groupedData).map((period) => groupedData[period][eventId] || 0),
				backgroundColor: getRandomColor(),
				borderColor: getRandomColor(),
				borderWidth: 1,
			};
		});

		if (clicksChart) {
			clicksChart.destroy();
		}

		clicksChart = new Chart(ctx, {
			type: "line",
			data: {
				labels: Object.keys(groupedData),
				datasets: datasets,
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "Число нажатий",
						},
					},
					x: {
						title: {
							display: true,
							text: `Время (по ${textPeriods[period]})`,
						},
					},
				},
				plugins: {
					title: {
						display: true,
						text: `Клики по кнопкам с течением времени (сгруппировано ${textPeriods[period]})`,
					},
					tooltip: {
						mode: "index",
						intersect: false,
					},
				},
			},
		});
	}
	function renderEventsChart(data) {
		const ctx = document.getElementById("eventsChart").getContext("2d");

		const labels = data.map((item) => item.eventId);
		const counts = data.map((item) => item.count);
		const backgroundColors = labels.map(() => getRandomColor());

		if (eventsChart) {
			eventsChart.destroy();
		}

		eventsChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels: labels,
				datasets: [
					{
						label: "Всего нажатий",
						data: counts,
						backgroundColor: backgroundColors,
						borderColor: backgroundColors.map(() => getRandomColor()),
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: "Всего нажатий",
						},
					},
					x: {
						title: {
							display: true,
							text: "ID события",
						},
					},
				},
				plugins: {
					title: {
						display: true,
						text: "Общее количество кликов на событие",
					},
					tooltip: {
						callbacks: {
							afterBody: function (context) {
								const index = context[0].dataIndex;
								const firstClick = new Date(data[index].firstClick).toLocaleString();
								const lastClick = new Date(data[index].lastClick).toLocaleString();
								return [`Первое нажатие: ${firstClick}`, `Последнее нажатие: ${lastClick}`];
							},
						},
					},
				},
				onClick: (e, elements) => {
					if (elements.length > 0) {
						const eventId = data[elements[0].index].eventId;
						showEventDetails(eventId);
					}
				},
			},
		});
	}

	async function showEventDetails(eventId) {
		try {
			const response = await fetch(`/api/event/${encodeURIComponent(eventId)}`);
			const data = await response.json();

			const detailsDiv = document.getElementById("eventDetails");
			detailsDiv.innerHTML = `
          <h2>Детали по событию: ${eventId}</h2>
          <p>Всего нажатий: ${data.length}</p>
          <table>
            <thead>
              <tr>
                <th>ID пользователя</th>
                <th>Время</th>
                <th>Доп.данные</th>
              </tr>
            </thead>
            <tbody>
              ${data
					.slice(0, 50)
					.map(
						(item) => `
                <tr>
                  <td>${item.userId || "-"}</td>
                  <td>${new Date(item.timestamp).toLocaleString()}</td>
                  <td>${item.additionalData ? JSON.stringify(JSON.parse(item.additionalData), null, 2) : "-"}</td>
                </tr>
              `,
					)
					.join("")}
            </tbody>
          </table>
          ${data.length > 1 ? `<p>Отображется 50 из ${data.length} записей</p>` : ""}
        `;
		} catch (error) {
			console.error("Ошибка при загрузке информации о событии:", error);
		}
	}

	function getRandomColor() {
		const letters = "0123456789ABCDEF";
		let color = "#";
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	periodSelect.addEventListener("change", loadData);

	loadData();
});
