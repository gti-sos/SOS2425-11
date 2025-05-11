<script>
	import { onMount, tick } from 'svelte';

	let chartContainerId = 'polar-chart-container-g18'; // ID único para el contenedor
	let chartData = {
		sectors: [],
		suspendedWorkers: []
	};
	let isLoading = true;
	let error = null;
	let chartInstance = null;

	// Función para cargar scripts de Highcharts secuencialmente
	async function loadHighchartsScripts() {
		return new Promise((resolve, reject) => {
			const loadScript = (id, src) => {
				return new Promise((scriptResolve, scriptReject) => {
					// Si el script ya está en el DOM y marcado como cargado, resolver inmediatamente
					const existingScript = document.getElementById(id);
					if (existingScript && existingScript.dataset.loaded === 'true') {
						scriptResolve();
						return;
					}

					// Si el script tag existe pero no está marcado como cargado (ej. añadido por otro componente pero aún no listo)
					// se añade un listener. Si no existe, se crea.
					let script = existingScript;
					if (!script) {
						script = document.createElement('script');
						script.id = id;
						script.src = src;
						script.async = true; // Cargar asíncronamente
						document.head.appendChild(script);
					}

					script.dataset.loaded = 'false'; // Asegurar que está marcado como no cargado hasta que onload se dispare

					const onScriptLoad = () => {
						script.dataset.loaded = 'true';
						script.removeEventListener('load', onScriptLoad);
						script.removeEventListener('error', onScriptError);
						scriptResolve();
					};
					const onScriptError = () => {
						script.removeEventListener('load', onScriptLoad);
						script.removeEventListener('error', onScriptError);
						scriptReject(`No se pudo cargar la librería ${src}.`);
					};

					script.addEventListener('load', onScriptLoad);
					script.addEventListener('error', onScriptError);
				});
			};

			// Cargar highcharts.js y luego highcharts-more.js
			loadScript('highcharts-core-script', 'https://code.highcharts.com/highcharts.js')
				.then(() =>
					loadScript('highcharts-more-script', 'https://code.highcharts.com/highcharts-more.js')
				)
				.then(resolve) // Resuelve la promesa principal cuando ambos scripts están cargados
				.catch(reject); // Rechaza si alguno falla
		});
	}

	async function fetchDataAndPrepareChart() {
		isLoading = true;
		error = null;
		try {
			await loadHighchartsScripts(); // Esperar a que los scripts de Highcharts se carguen

			const response = await fetch('https://sos2425-18.onrender.com/api/v2/dana-erte-stats');
			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
			}
			const stats = await response.json();

			if (!Array.isArray(stats)) {
				console.error('La respuesta de la API no es un array:', stats);
				throw new Error('Formato de datos inesperado de la API.');
			}

			if (stats.length === 0) {
				console.warn('La API no devolvió datos de ERTE.');
				// No es un error, pero no habrá nada que graficar.
			}

			// Agregar total_work_sus por sector
			const aggregatedData = stats.reduce((acc, current) => {
				const sector = current.sector || 'Desconocido'; // Manejar sector indefinido
				const workers = Number(current.total_work_sus) || 0; // Asegurar que es un número
				if (!acc[sector]) {
					acc[sector] = 0;
				}
				acc[sector] += workers;
				return acc;
			}, {});

			const sectors = Object.keys(aggregatedData);
			const suspendedWorkers = sectors.map((s) => aggregatedData[s]);

			chartData = { sectors, suspendedWorkers };

			await tick(); // Esperar a que Svelte actualice el DOM si es necesario
			renderChart();
		} catch (e) {
			error = e.message;
			console.error('Error al obtener datos, cargar scripts o procesar:', e);
		} finally {
			isLoading = false;
		}
	}

	function renderChart() {
		const chartContainer = document.getElementById(chartContainerId);

		// Verificar que Highcharts y el módulo 'more' (para polar) estén cargados
		if (
			typeof Highcharts === 'undefined' ||
			typeof Highcharts.chart === 'undefined' ||
			!Highcharts.seriesTypes.column ||
			!chartContainer
		) {
			if (isLoading) {
				setTimeout(renderChart, 150); // Reintentar si todavía está cargando datos/scripts
			} else if (!error && chartData.sectors.length === 0) {
				console.log('No hay datos para renderizar el gráfico polar o el contenedor no está listo.');
			} else if (error) {
				console.log('Error presente, no se renderizará el gráfico polar.');
			}
			return;
		}

		if (chartInstance) {
			chartInstance.destroy();
		}

		chartInstance = Highcharts.chart(chartContainerId, {
			chart: {
				type: 'column',
				polar: true
			},
			title: {
				text: 'Trabajadores con Contrato Suspendido por Sector (ERTE-DANA)'
			},
			subtitle: {
				text: 'Fuente: <a href="https://sos2425-18.onrender.com/api/v2/dana-erte-stats" target="_blank">API SOS2425-18</a>'
			},
			pane: {
				size: '85%'
			},
			xAxis: {
				categories: chartData.sectors,
				tickmarkPlacement: 'on',
				lineWidth: 0,
				labels: {
					style: {
						fontSize: '10px'
					}
				}
			},
			yAxis: {
				min: 0,
				gridLineInterpolation: 'polygon',
				lineWidth: 0,
				labels: {
					formatter: function () {
						return this.value;
					}
				}
			},
			tooltip: {
				headerFormat: '<span style="font-size:11px">{point.key}</span><br>',
				pointFormat:
					'<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
				shared: true,
				useHTML: true
			},
			plotOptions: {
				column: {
					minPointLength: 3,
					pointPadding: 0,
					groupPadding: 0,
					borderWidth: 0.5,
					borderColor: 'gray',
					dataLabels: {
						enabled: true,
						format: '{point.y}',
						allowOverlap: true,
						style: {
							fontSize: '9px',
							fontWeight: 'normal',
							textOutline: '1px contrast'
						}
					}
				}
			},
			series: [
				{
					name: 'Trabajadores Suspendidos',
					data: chartData.suspendedWorkers,
					pointPlacement: 'between'
				}
			],
			credits: {
				enabled: false
			},
			responsive: {
				rules: [
					{
						condition: {
							maxWidth: 600
						},
						chartOptions: {
							xAxis: {
								labels: {
									style: {
										fontSize: '8px'
									}
								}
							},
							plotOptions: {
								column: {
									dataLabels: {
										style: {
											fontSize: '8px'
										}
									}
								}
							},
							pane: {
								size: '75%'
							}
						}
					}
				]
			}
		});
	}

	onMount(() => {
		fetchDataAndPrepareChart();

		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
			// Los scripts de Highcharts no se eliminan del head para evitar recargas innecesarias
			// si se navega de vuelta a esta página o si otros componentes los usan.
		};
	});
</script>

<svelte:head>
	<title>ERTE por Sector (Gráfico Polar)</title>
</svelte:head>

{#if isLoading}
	<p>Cargando datos y gráfico polar...</p>
{:else if error}
	<p class="error-message">Error: {error}</p>
	<p>
		Asegúrate de que la API
		<a
			href="https://sos2425-18.onrender.com/api/v2/dana-erte-stats"
			target="_blank"
			rel="noopener noreferrer"
		>
			https://sos2425-18.onrender.com/api/v2/dana-erte-stats
		</a>
		está accesible y devuelve un array de datos JSON. Verifica también tu conexión a internet y que las
		librerías Highcharts (core y more) se hayan cargado correctamente. Revisa la consola del navegador
		para más detalles si el problema persiste.
	</p>
{:else if chartData.sectors.length === 0}
	<p>
		No se encontraron datos de ERTE para mostrar en el gráfico. La API puede no haber devuelto
		registros o los registros existentes no tienen datos de trabajadores suspendidos por sector.
	</p>
{:else}
	<div
		id={chartContainerId}
		style="width:100%; min-height:450px; height:auto; max-height: 70vh; margin-top: 20px;"
	></div>
{/if}

<style>
	p {
		font-family: 'Arial', sans-serif;
		text-align: center;
		margin: 20px 10px; /* Añadido margen horizontal */
		line-height: 1.5; /* Mejorar legibilidad */
	}
	.error-message {
		/* Estilo específico para el párrafo del mensaje de error */
		color: #c0392b; /* Un rojo más oscuro */
		background-color: #fdedec;
		border: 1px solid #e74c3c;
		padding: 15px;
		border-radius: 5px;
		font-weight: bold;
	}
	/* Estilo para el contenedor del gráfico, usando el ID dinámico */
	:global(div[id^='polar-chart-container-g18']) {
		border: 1px solid #ddd;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
		background-color: #fdfdfd; /* Un fondo muy ligero para el gráfico */
	}
	a {
		color: #3498db;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
</style>
