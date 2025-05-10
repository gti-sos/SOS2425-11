<script>
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';

	let isLoading = true;
	let error = null;
	let highchartsLoaded = false;
	let chartContainer; // Referencia al div contenedor del gráfico
	let populationDataMap = {}; // Para acceder a la población en el tooltip

	// Mapeo de nombres de CCAA (API Externa -> API Interna)
	const communityMapping = {
		Madrid: 'Madrid, Comunidad de',
		'Castilla La Mancha': 'Castilla - La Mancha',
		Navarra: 'Navarra, Comunidad Foral de',
		'Comunidad Valenciana': 'Comunitat Valenciana',
		Baleares: 'Balears, Illes',
		'La Rioja': 'Rioja, La',
		Asturias: 'Asturias, Principado de',
		Murcia: 'Murcia, Región de',
		// Nombres que coinciden (no necesitan mapeo estricto pero pueden incluirse por claridad)
		Andalucía: 'Andalucía',
		Aragón: 'Aragón',
		Cataluña: 'Cataluña',
		Galicia: 'Galicia',
		'Castilla y León': 'Castilla y León',
		'País Vasco': 'País Vasco',
		Canarias: 'Canarias',
		Extremadura: 'Extremadura',
		Cantabria: 'Cantabria'
	};

	function getNormalizedCommunityName(externalName) {
		return communityMapping[externalName] || externalName;
	}

	async function fetchExternalApiData() {
		try {
			const response = await fetch(
				'https://sos2425-12.onrender.com/api/v1/annual-evolutions?year=2024'
			);
			if (!response.ok) {
				throw new Error(`Error fetching external data (annual-evolutions): ${response.status}`);
			}
			const data = await response.json();
			console.log('External API data (annual-evolutions) fetched:', data.length);
			return data;
		} catch (err) {
			console.error('Error fetching external API data:', err);
			error = err.message; // Establecer el error global para mostrarlo
			return [];
		}
	}

	async function fetchInternalApiData() {
		try {
			// Pedimos un límite alto para asegurar que obtenemos todas las CCAA para 2024
			const response = await fetch('/api/v1/autonomy-dependence-applications?year=2024&limit=50');
			if (!response.ok) {
				throw new Error(`Error fetching internal data (autonomy-dependence): ${response.status}`);
			}
			const data = await response.json();
			console.log('Internal API data (autonomy-dependence) fetched:', data.length);
			return data;
		} catch (err) {
			console.error('Error fetching internal API data:', err);
			error = err.message; // Establecer el error global
			return [];
		}
	}

	function processDataForChart(annualEvolutions, autonomyData) {
		const processed = {};
		populationDataMap = {}; // Reiniciar para cada procesamiento

		// 1. Procesar datos de población de la API interna
		autonomyData.forEach((item) => {
			if (item.year === 2024) {
				const communityName = item.place; // Usamos el nombre de la API interna como canónico
				if (!processed[communityName]) {
					processed[communityName] = {
						name: communityName,
						population: item.population,
						technologies: {},
						totalEnergySold: 0
					};
				} else {
					processed[communityName].population = item.population;
				}
				populationDataMap[communityName] = item.population;
			}
		});

		// 2. Procesar datos de energía de la API externa
		annualEvolutions.forEach((item) => {
			if (item.year === 2024) {
				const normalizedName = getNormalizedCommunityName(item.aacc);
				if (processed[normalizedName]) {
					const tech = item.technology;
					const energy = parseFloat(item.energy_sold) || 0;

					processed[normalizedName].technologies[tech] =
						(processed[normalizedName].technologies[tech] || 0) + energy;
					processed[normalizedName].totalEnergySold += energy;
				} else {
					console.warn(
						`Community ${item.aacc} (normalized: ${normalizedName}) from external API not found or not initialized from internal API. Skipping energy data for it.`
					);
				}
			}
		});

		const communities = Object.values(processed)
			.filter((c) => c.population && c.totalEnergySold > 0)
			.sort((a, b) => a.name.localeCompare(b.name));

		const categories = communities.map((c) => c.name);
		const allTechnologies = [
			...new Set(communities.flatMap((c) => Object.keys(c.technologies)))
		].sort();

		const series = [];

		allTechnologies.forEach((tech) => {
			series.push({
				type: 'column',
				name: tech,
				data: communities.map((c) => parseFloat((c.technologies[tech] || 0).toFixed(2))),
				unit: 'GWh'
			});
		});

		series.push({
			type: 'spline',
			name: 'Total Energy Sold',
			data: communities.map((c) => parseFloat(c.totalEnergySold.toFixed(2))),
			color: 'orange',
			zIndex: 1,
			marker: {
				lineWidth: 2,
				lineColor: Highcharts.getOptions().colors[3], // Color del borde del marcador
				fillColor: 'white'
			},
			unit: 'GWh'
		});

		console.log('Processed data for chart:', { categories, series, populationDataMap });
		// DEBUG: Log final map and categories
		console.log(
			'Final populationDataMap before chart:',
			JSON.parse(JSON.stringify(populationDataMap))
		);
		console.log('Final categories for chart:', categories);
		return { categories, series };
	}

	async function loadHighcharts() {
		if (window.Highcharts) {
			console.log('Highcharts core ya está cargado.');
			return window.Highcharts;
		}
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://code.highcharts.com/highcharts.js';
			script.async = true;
			script.onload = () => {
				console.log('Highcharts core cargado.');
				resolve(window.Highcharts);
			};
			script.onerror = (err) => {
				console.error('Error al cargar Highcharts core:', err);
				reject(new Error('Error al cargar Highcharts core'));
			};
			document.head.appendChild(script);
		});
	}

	async function createCombinedChart(categories, seriesData) {
		if (!highchartsLoaded || !chartContainer) {
			const msg = 'Highcharts no está cargado o el contenedor del gráfico no está listo.';
			error = msg;
			console.error(msg);
			return;
		}
		try {
			const Highcharts = window.Highcharts;
			Highcharts.chart(chartContainer, {
				chart: {
					zoomType: 'xy'
				},
				title: {
					text: 'Energía Vendida por Tecnología y Población por CA (2024)',
					align: 'left'
				},
				subtitle: {
					text: 'Fuente: SOS2425-12 (Energía) y API Propia (Población)',
					align: 'left'
				},
				xAxis: [
					{
						categories: categories,
						crosshair: true
					}
				],
				yAxis: [
					{
						labels: {
							format: '{value} GWh',
							style: {
								color: Highcharts.getOptions().colors[1]
							}
						},
						title: {
							text: 'Energía Vendida',
							style: {
								color: Highcharts.getOptions().colors[1]
							}
						}
					}
				],
				tooltip: {
					shared: true,
					useHTML: true,
					formatter: function () {
						const communityName = this.key;
						// DEBUG: Log tooltip access
						console.log(
							'Tooltip - Community Key:',
							communityName,
							'| Value from populationDataMap:',
							populationDataMap[communityName]
						);

						// Accedemos a populationDataMap que está en el scope del script
						const population = populationDataMap[communityName];
						const formattedPopulation =
							population !== undefined ? Highcharts.numberFormat(population, 0, ',', '.') : 'N/A';

						let header = `<b>${communityName}</b><br/>`;
						header += `Población: ${formattedPopulation}<br/><hr style="margin: 5px 0;"/>`;

						let pointsInfo = this.points
							.map((point) => {
								return `${point.series.name}: <b>${Highcharts.numberFormat(point.y, 2, ',', '.')}</b> ${point.series.userOptions.unit || ''}`;
							})
							.join('<br/>');

						return header + pointsInfo;
					}
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'middle',
					backgroundColor:
						Highcharts.defaultOptions.legend.backgroundColor || 'rgba(255,255,255,0.25)'
				},
				series: seriesData,
				responsive: {
					rules: [
						{
							condition: {
								maxWidth: 600 // Ajustado para mejor visualización en móviles
							},
							chartOptions: {
								legend: {
									layout: 'horizontal',
									align: 'center',
									verticalAlign: 'bottom'
								}
							}
						}
					]
				}
			});
			console.log('Gráfico combinado creado.');
		} catch (err) {
			console.error('Error al crear el gráfico combinado:', err);
			error = 'Error al renderizar el gráfico: ' + err.message;
		}
	}

	onMount(async () => {
		isLoading = true;
		error = null;
		try {
			if (browser) {
				const Highcharts = await loadHighcharts();
				if (Highcharts) {
					highchartsLoaded = true;
					window.Highcharts = Highcharts;
				} else {
					throw new Error('No se pudo cargar la biblioteca Highcharts.');
				}

				const [externalData, internalData] = await Promise.all([
					fetchExternalApiData(),
					fetchInternalApiData()
				]);

				// Si alguna función fetch ya estableció un error global, detenemos.
				if (error) {
					isLoading = false;
					await tick();
					return;
				}

				if (!externalData.length && !internalData.length) {
					throw new Error('No se pudieron cargar datos de ninguna de las fuentes.');
				}
				// Advertencias si alguna fuente falla pero la otra no
				if (!externalData.length) console.warn('No se cargaron datos de la API externa (energía).');
				if (!internalData.length)
					console.warn('No se cargaron datos de la API interna (población).');

				const { categories, series } = processDataForChart(externalData, internalData);

				if (!categories || categories.length === 0) {
					throw new Error(
						'No hay suficientes datos combinados para mostrar el gráfico. Verifica las fuentes y el mapeo de comunidades.'
					);
				}

				isLoading = false;
				await tick();

				if (chartContainer) {
					await createCombinedChart(categories, series);
				} else {
					throw new Error('El contenedor del gráfico no se encontró en el DOM.');
				}
			}
		} catch (errCatch) {
			console.error('Error en onMount (EnergyPopulationIntegration):', errCatch);
			error = errCatch.message; // Mostrar el error
			isLoading = false;
		}
	});
</script>

<div class="integration-container-alm">
	{#if isLoading}
		<div class="loading-alm">
			<p>Cargando datos para la integración de energía y población...</p>
			<div class="spinner-alm"></div>
		</div>
	{:else if error}
		<div class="error-alm">
			<p>Error en la integración de energía y población: {error}</p>
			<button
				on:click={() => {
					isLoading = true;
					error = null;
					onMount();
				}}>Reintentar</button
			>
		</div>
	{:else}
		<div
			bind:this={chartContainer}
			class="chart-placeholder-alm"
			id="chart-energy-population-alm"
		></div>
		{#if !chartContainer && !error && !isLoading}
			<p>El contenedor del gráfico no está disponible. Esto no debería ocurrir.</p>
		{/if}
	{/if}
</div>

<style>
	.integration-container-alm {
		width: 100%;
		margin-top: 2rem;
		margin-bottom: 2rem;
		background-color: #f0f0f0; /* Fondo ligeramente diferente para la sección */
		padding: 1.5rem;
		border-radius: 8px;
		box-sizing: border-box;
	}
	.chart-placeholder-alm {
		width: 100%;
		height: 550px; /* Altura ajustada */
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background-color: #fff;
	}
	.loading-alm,
	.error-alm {
		/* Estilos específicos para evitar conflictos */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 1rem;
		text-align: center;
		font-family: Arial, sans-serif;
	}
	.spinner-alm {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #007bff; /* Color de spinner diferente */
		animation: spin-alm 1s linear infinite;
	}
	@keyframes spin-alm {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	.error-alm {
		color: #dc3545; /* Color de error diferente */
		border: 1px solid #dc3545;
		border-radius: 4px;
		background-color: #f8d7da;
		padding: 1rem;
	}
	.error-alm button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 4px;
		margin-top: 1rem;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.error-alm button:hover {
		background-color: #0056b3;
	}
</style>
