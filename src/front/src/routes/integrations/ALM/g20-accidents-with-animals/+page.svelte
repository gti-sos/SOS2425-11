<script>
	import { onMount } from 'svelte';
	import { tick } from 'svelte';

	let chartData = {
		provinces: [],
		totalAccidents: []
	};
	let isLoading = true;
	let error = null;
	let chartInstance = null;

	async function fetchDataAndPrepareChart() {
		try {
			const response = await fetch(
				'https://sos2425-20.onrender.com/api/v1/accidents-with-animals/'
			);
			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
			}
			const accidents = await response.json();

			if (!Array.isArray(accidents)) {
				console.error('La respuesta de la API no es un array:', accidents);
				throw new Error('Formato de datos inesperado de la API.');
			}

			if (accidents.length === 0) {
				console.warn('La API no devolvió datos de accidentes.');
				// No es un error, pero no habrá nada que graficar.
				// Se puede manejar mostrando un mensaje específico en la UI.
			}

			const aggregatedData = accidents.reduce((acc, current) => {
				const province = current.province || 'Desconocida'; // Manejar provincia indefinida
				if (!acc[province]) {
					acc[province] = 0;
				}
				acc[province]++; // Incrementar el contador para la provincia
				return acc;
			}, {});

			const provinces = Object.keys(aggregatedData);
			const totalAccidents = provinces.map((p) => aggregatedData[p]);

			chartData = { provinces, totalAccidents };
			isLoading = false;

			// Asegurarse de que el DOM está actualizado antes de renderizar
			await tick();
			renderChart();
		} catch (e) {
			error = e.message;
			isLoading = false;
			console.error('Error al obtener o procesar los datos:', e);
		}
	}

	function renderChart() {
		const chartContainer = document.getElementById('container');
		if (typeof Highcharts === 'undefined' || !chartContainer) {
			// Highcharts o el contenedor aún no están listos, reintentar si es necesario
			// o si isLoading es false y no hay error, podría ser que no haya datos.
			if (isLoading) {
				setTimeout(renderChart, 100); // Reintentar si aún está cargando
			}
			return;
		}

		if (chartInstance) {
			chartInstance.destroy(); // Destruir instancia previa si existe
		}

		chartInstance = Highcharts.chart('container', {
			chart: {
				type: 'area'
			},
			title: {
				text: 'Total de Accidentes con Animales por Provincia'
			},
			subtitle: {
				text: 'Fuente: <a href="https://sos2425-20.onrender.com/api/v1/accidents-with-animals/" target="_blank">API SOS2425-20</a>'
			},
			xAxis: {
				categories: chartData.provinces,
				title: {
					text: 'Provincia'
				}
			},
			yAxis: {
				min: 0, // Asegurar que el eje Y comience en 0
				title: {
					text: 'Número de Accidentes'
				}
			},
			tooltip: {
				pointFormat: '{series.name} en {point.category}: <b>{point.y}</b>'
			},
			plotOptions: {
				area: {
					marker: {
						enabled: false,
						symbol: 'circle',
						radius: 2,
						states: {
							hover: {
								enabled: true
							}
						}
					}
				}
			},
			series: [
				{
					name: 'Total de Accidentes',
					data: chartData.totalAccidents,
					color: Highcharts.getOptions().colors[0]
				}
			]
		});
	}

	onMount(() => {
		let script = document.getElementById('highcharts-script');
		if (!script) {
			script = document.createElement('script');
			script.id = 'highcharts-script';
			script.src = 'https://code.highcharts.com/highcharts.js';
			script.async = true;
			script.onload = () => {
				fetchDataAndPrepareChart();
			};
			script.onerror = () => {
				error = 'No se pudo cargar la librería Highcharts.';
				isLoading = false;
				console.error('Error cargando Highcharts.');
			};
			document.head.appendChild(script);
		} else {
			// Si el script ya existe (ej. por HMR o navegación SPA),
			// verificar si Highcharts está cargado.
			if (typeof Highcharts !== 'undefined') {
				fetchDataAndPrepareChart();
			} else {
				// Si el script existe pero Highcharts no está listo, esperar a su onload
				// Esto es un poco más complejo de manejar si el script.onload ya se disparó.
				// Por simplicidad, asumimos que si el script está, o carga o ya cargó.
				// Una solución más robusta podría involucrar promesas o reintentos.
				script.onload = () => {
					// Re-asignar onload en caso de que se haya perdido
					fetchDataAndPrepareChart();
				};
			}
		}

		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
			// No removemos el script de Highcharts para que no se recargue innecesariamente
			// en navegaciones dentro de la SPA si otros componentes lo usan.
			// Si es específico de esta página y se quiere limpiar estrictamente:
			// if (script && script.parentNode) {
			//   script.parentNode.removeChild(script);
			// }
		};
	});
</script>

<svelte:head>
	<title>Gráfico de Accidentes con Animales</title>
</svelte:head>

{#if isLoading}
	<p>Cargando datos y gráfico...</p>
{:else if error}
	<p style="color: red;">Error: {error}</p>
	<p>
		Asegúrate de que la API
		<a href="https://sos2425-20.onrender.com/api/v1/accidents-with-animals/" target="_blank">
			https://sos2425-20.onrender.com/api/v1/accidents-with-animals/
		</a>
		está accesible y devuelve un array de datos JSON. También verifica tu conexión a internet y que la
		librería Highcharts se haya cargado correctamente.
	</p>
{:else if chartData.provinces.length === 0 && chartData.totalAccidents.length === 0}
	<p>No se encontraron datos de accidentes para mostrar en el gráfico.</p>
	<p>La API no devolvió ningún registro o los registros no contenían información de provincias.</p>
{:else}
	<div id="container" style="width:100%; height:450px; margin-top: 20px;"></div>
{/if}

<style>
	p {
		font-family: 'Arial', sans-serif;
		text-align: center;
		margin-top: 20px;
	}
	[style*='color: red'] {
		/* Estilo para el mensaje de error */
		background-color: #ffebee;
		border: 1px solid #e57373;
		padding: 10px;
		border-radius: 4px;
	}
	#container {
		border: 1px solid #eee;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
