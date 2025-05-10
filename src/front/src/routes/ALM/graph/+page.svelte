<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let autonomyData = [];
	let isLoading = true;
	let error = null;

	// Obtener datos de la API
	async function fetchData() {
		try {
			const response = await fetch('/api/v1/autonomy-dependence-applications?limit=100');
			if (!response.ok) {
				throw new Error(`Error al cargar datos: ${response.status}`);
			}
			const data = await response.json();
			autonomyData = data;
			isLoading = false;
		} catch (err) {
			console.error('Error al cargar datos:', err);
			error = err.message;
			isLoading = false;
		}
	}

	// Procesar datos para Highcharts
	function processDataForTable() {
		// Agrupar datos por lugar
		const placeGroups = {};

		autonomyData.forEach((item) => {
			if (!placeGroups[item.place]) {
				placeGroups[item.place] = [];
			}
			placeGroups[item.place].push(item);
		});

		// Ordenar cada grupo por año
		Object.keys(placeGroups).forEach((place) => {
			placeGroups[place].sort((a, b) => a.year - b.year);
		});

		return placeGroups;
	}

	// Filtrar para mostrar solo los datos de los últimos 2 años
	function getLastTwoYearsData(data) {
		if (!data || data.length === 0) return [];

		// Ordenar por año
		const sortedData = [...data].sort((a, b) => a.year - b.year);

		// Identificar los dos últimos años únicos
		const years = [...new Set(sortedData.map((item) => item.year))].sort((a, b) => a - b);

		// Protección adicional si no hay suficientes años
		if (years.length === 0) return [];
		if (years.length === 1) {
			// Si solo hay un año, duplicamos el punto para tener al menos dos puntos
			const yearData = sortedData.filter((item) => item.year === years[0]);
			return [...yearData, ...yearData];
		}

		const lastTwoYears = years.slice(-2); // Obtener los dos últimos años

		// Asegurarse de que hay datos para los dos años
		return lastTwoYears.map((year) => {
			const yearData = sortedData.find((item) => item.year === year);
			return (
				yearData || {
					year: year,
					population: 0,
					dependent_population: 0,
					request: 0
				}
			);
		});
	}

	// Inicializar Highcharts
	function initHighcharts() {
		if (!browser || !window.Highcharts) return;

		const Highcharts = window.Highcharts;

		// Crear constructor para sparklines con configuración más simple
		Highcharts.SparkLine = function (a, b, c) {
			const hasRenderToArg = typeof a === 'string' || a.nodeName;
			let options = arguments[hasRenderToArg ? 1 : 0];

			// Opciones por defecto más simples
			const defaultOptions = {
				chart: {
					renderTo: (options.chart && options.chart.renderTo) || (hasRenderToArg && a),
					backgroundColor: null,
					borderWidth: 0,
					type: 'bar',
					height: 30,
					width: 120
				},
				title: { text: '' },
				credits: { enabled: false },
				xAxis: {
					visible: false
				},
				yAxis: {
					visible: false
				},
				legend: { enabled: false },
				tooltip: { enabled: true },
				plotOptions: {
					series: {
						animation: false
					}
				}
			};

			options = Highcharts.merge(defaultOptions, options);

			return hasRenderToArg
				? new Highcharts.Chart(a, options, c)
				: new Highcharts.Chart(options, b);
		};

		// Y reemplazar también la forma en que se generan los sparklines
		function createSparklines() {
			if (!browser || !window.Highcharts) return;

			// Eliminar los sparklines existentes para evitar duplicación
			document.querySelectorAll('.sparkline-chart').forEach((el) => {
				try {
					if (el.chart) el.chart.destroy();
				} catch (e) {
					console.error('Error al limpiar gráficos:', e);
				}
			});

			// Crear contenedores para los sparklines
			document.querySelectorAll('td[data-sparkline]').forEach((td, index) => {
				// Crear un contenedor para el gráfico
				const chartContainer = document.createElement('div');
				chartContainer.className = 'sparkline-chart';
				chartContainer.id = `sparkline-${index}`;
				chartContainer.style.width = '100%';
				chartContainer.style.height = '30px';

				// Limpiar el contenido previo del td
				td.innerHTML = '';
				td.appendChild(chartContainer);
			});

			// Esperar a que el DOM se actualice
			setTimeout(() => {
				// Crear los gráficos sparkline
				document.querySelectorAll('.sparkline-chart').forEach((container, index) => {
					try {
						const td = container.parentElement;
						const stringdata = td.getAttribute('data-sparkline');

						if (!stringdata) return;

						const data = stringdata.split(', ').map(Number);
						if (data.length < 2) {
							// Si solo hay un dato, duplicarlo para mostrar al menos una línea
							data.push(data[0] || 0);
						}

						const titleText = td.parentElement.querySelector('th').innerText;

						// Obtener el lugar (comunidad autónoma) de esta fila
						const place = titleText;

						// Obtener los datos de los últimos dos años para este lugar
						const placeData = processDataForTable()[place] || [];
						const lastTwoYearsForPlace = getLastTwoYearsData(placeData);
						const yearsData = lastTwoYearsForPlace.map((d) => d.year);

						window.Highcharts.chart(container.id, {
							chart: {
								type: 'bar',
								height: 30,
								backgroundColor: null,
								margin: [2, 0, 2, 0]
							},
							title: { text: '' },
							credits: { enabled: false },
							xAxis: { visible: false },
							yAxis: { visible: false },
							legend: { enabled: false },
							tooltip: {
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
								borderWidth: 1,
								borderRadius: 5,
								shadow: true,
								padding: 10,
								style: {
									fontSize: '12px',
									width: 'auto',
									whiteSpace: 'nowrap'
								},
								useHTML: true,
								formatter: function () {
									const index = this.point.x;
									const year = yearsData[index];
									return (
										'<div style="min-width: 100px;">' +
										'Año ' +
										year +
										': <b>' +
										this.y.toLocaleString('es-ES') +
										'</b>' +
										'</div>'
									);
								}
							},
							plotOptions: {
								series: {
									animation: false,
									lineWidth: 2,
									marker: {
										enabled: false,
										radius: 1,
										states: {
											hover: {
												enabled: true,
												radius: 3
											}
										}
									},
									states: {
										hover: {
											lineWidth: 2
										}
									}
								}
							},
							series: [
								{
									data: data
								}
							]
						});
					} catch (e) {
						console.error('Error creando sparkline:', e);
					}
				});
			}, 100);
		}

		// Ejecutar la creación de sparklines cuando el DOM esté listo
		createSparklines();
	}

	// Cargar Highcharts desde CDN
	function loadHighcharts() {
		if (!browser) return;

		return new Promise((resolve, reject) => {
			if (window.Highcharts) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://code.highcharts.com/highcharts.js';
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	onMount(async () => {
		try {
			await fetchData();
			await loadHighcharts();

			// Dar tiempo para que el DOM se actualice después de cargar los datos
			setTimeout(() => {
				if (browser && window.Highcharts) {
					initHighcharts();
				}
			}, 300);
		} catch (err) {
			console.error('Error en la inicialización:', err);
			error = 'Error al inicializar la aplicación';
		}
	});
</script>

<svelte:head>
	<title>Sparkline de Aplicaciones de Dependencia por Comunidades</title>
</svelte:head>

<main class="container">
	<!-- Botón para ir al cartograma -->
	<div style="text-align: right; margin-bottom: 20px;">
		<a href="/ALM/cartogram" class="go-cartogram-btn">Ver Cartograma del último año</a>
	</div>
	<h1>Sparkline de Aplicaciones de Dependencia por Comunidades Autónomas</h1>
	<h2>Evolución de los 2 últimos años</h2>

	{#if isLoading}
		<p>Cargando datos...</p>
	{:else if error}
		<p class="error">Error: {error}</p>
	{:else}
		<div class="table-responsive">
			<table class="sparkline-table">
				<thead>
					<tr>
						<th>Comunidad Autónoma</th>
						<th>Población Total</th>
						<th>Evolución Población</th>
						<th>Población Dependiente</th>
						<th>Evolución Dependientes</th>
						<th>Solicitudes</th>
						<th>Evolución Solicitudes</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(processDataForTable()) as [place, data]}
						{@const lastTwoYearsData = getLastTwoYearsData(data)}
						<tr>
							<th>{place}</th>
							<td>{data[data.length - 1]?.population.toLocaleString('es-ES')}</td>
							<td data-sparkline={lastTwoYearsData.map((d) => d.population).join(', ')}></td>
							<td>{data[data.length - 1]?.dependent_population.toLocaleString('es-ES')}</td>
							<td data-sparkline={lastTwoYearsData.map((d) => d.dependent_population).join(', ')}
							></td>
							<td>{data[data.length - 1]?.request.toLocaleString('es-ES')}</td>
							<td data-sparkline={lastTwoYearsData.map((d) => d.request).join(', ')}></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div id="result"></div>
	{/if}
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: Arial, sans-serif;
	}

	h1 {
		color: #333;
		text-align: center;
		margin-bottom: 10px;
	}

	h2 {
		color: #666;
		text-align: center;
		margin-bottom: 30px;
		font-size: 1.2rem;
		font-weight: normal;
	}

	.table-responsive {
		overflow-x: auto;
	}

	.sparkline-table {
		width: 100%;
		border-collapse: collapse;
		margin: 20px 0;
		font-size: 14px;
	}

	.sparkline-table th,
	.sparkline-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	.sparkline-table th {
		background-color: #f2f2f2;
		font-weight: bold;
	}

	.sparkline-table tr:hover {
		background-color: #f5f5f5;
	}

	.error {
		color: red;
		font-weight: bold;
	}

	#result {
		text-align: center;
		margin-top: 20px;
		font-style: italic;
	}

	.go-cartogram-btn {
		display: inline-block;
		padding: 10px 20px;
		background-color: #1976d2;
		color: #fff;
		border-radius: 5px;
		text-decoration: none;
		font-weight: bold;
		transition: background 0.2s;
	}
	.go-cartogram-btn:hover {
		background-color: #125ea2;
	}
</style>
