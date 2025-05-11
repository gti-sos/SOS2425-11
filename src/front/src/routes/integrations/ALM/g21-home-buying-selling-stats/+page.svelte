<script>
	import { onMount, tick } from 'svelte';

	let chartContainerId = 'treemap-chart-container-g21';
	let chartData = []; // ÚNICA DECLARACIÓN GLOBAL DE chartData
	let isLoading = true;
	let error = null;
	let chartInstance = null;

	// Mapeo de provincias a comunidades autónomas (simplificado, puedes expandirlo)
	const provinceToCommunityMap = {
		alicante: 'Comunidad Valenciana',
		madrid: 'Comunidad de Madrid',
		pontevedra: 'Galicia',
		malaga: 'Andalucía',
		'las palmas': 'Canarias',
		badajoz: 'Extremadura',
		barcelona: 'Cataluña',
		zaragoza: 'Aragón'
		// Añade más provincias y sus comunidades aquí
	};

	async function loadHighchartsScripts() {
		console.log('[HS Load] Iniciando carga de scripts de Highcharts...');
		return new Promise((resolve, reject) => {
			const loadScript = (id, src, checker) => {
				return new Promise((scriptResolve, scriptReject) => {
					console.log(`[HS Load] Intentando cargar ${src} (ID: ${id})`);
					const existingScript = document.getElementById(id);
					if (
						existingScript &&
						existingScript.dataset.loaded === 'true' &&
						(typeof checker === 'function' ? checker() : true)
					) {
						console.log(`[HS Load] ${src} (ID: ${id}) ya estaba cargado y verificado.`);
						scriptResolve();
						return;
					}
					let script = existingScript || document.createElement('script');
					if (!existingScript) {
						script.id = id;
						script.src = src;
						script.async = true;
						document.head.appendChild(script);
						console.log(`[HS Load] Script ${src} (ID: ${id}) añadido al DOM.`);
					}
					script.dataset.loaded = 'false';
					const onScriptLoad = () => {
						script.dataset.loaded = 'true';
						console.log(`[HS Load] ${src} (ID: ${id}) CARGADO correctamente.`);
						script.removeEventListener('load', onScriptLoad);
						script.removeEventListener('error', onScriptError);
						scriptResolve();
					};
					const onScriptError = (e) => {
						console.error(`[HS Load] ERROR al cargar ${src} (ID: ${id}):`, e);
						script.removeEventListener('load', onScriptLoad);
						script.removeEventListener('error', onScriptError);
						scriptReject(`No se pudo cargar la librería ${src}.`);
					};
					script.addEventListener('load', onScriptLoad);
					script.addEventListener('error', onScriptError);
				});
			};

			loadScript(
				'highcharts-core-script',
				'https://code.highcharts.com/highcharts.js',
				() => typeof window.Highcharts !== 'undefined'
			)
				.then(() => {
					console.log('[HS Load] Highcharts Core OK. Cargando Treemap module...');
					return loadScript(
						'highcharts-treemap-module',
						'https://code.highcharts.com/modules/treemap.js',
						() =>
							typeof window.Highcharts !== 'undefined' &&
							typeof window.Highcharts.seriesTypes.treemap !== 'undefined'
					);
				})
				.then(() => {
					console.log('[HS Load] Treemap module OK. Todos los scripts de Highcharts listos.');
					resolve();
				})
				.catch(reject);
		});
	}

	async function fetchDataAndPrepareChart() {
		console.log('[Data] Iniciando fetchDataAndPrepareChart...');
		isLoading = true;
		error = null;
		chartData = []; // Resetear chartData al inicio de una nueva carga
		await tick(); // Permitir que se muestre el estado de carga

		try {
			await loadHighchartsScripts();
			console.log('[Data] Scripts de Highcharts cargados, procediendo a fetch API.');

			const response = await fetch(
				'https://sos2425-21.onrender.com/api/v1/home-buying-selling-stats'
			);
			console.log('[Data] Respuesta de API recibida, status:', response.status);
			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
			}
			const stats = await response.json();
			console.log('[Data] Datos crudos de API (stats):', JSON.parse(JSON.stringify(stats)));
			// Log del primer elemento para inspección más fácil de campos
			if (stats && stats.length > 0) {
				console.log(
					'[Data] Primer registro de la API (stats[0]):',
					JSON.parse(JSON.stringify(stats[0]))
				);
			}

			if (!Array.isArray(stats) || stats.length === 0) {
				console.warn('[Data] La API no devolvió datos o está vacía.');
				// chartData ya está como [], isLoading se pondrá false en finally
				// renderChart se llamará en finally y debería manejar el array vacío
			} else {
				const communityData = {};
				const communityColors = [
					'#FFA07A',
					'#20B2AA',
					'#778899',
					'#9370DB',
					'#3CB371',
					'#FFD700',
					'#FF69B4',
					'#87CEFA'
				];
				let colorIndex = 0;
				let uniqueYears = [...new Set(stats.map((item) => item.year))];
				console.log('[Data] Años únicos encontrados en los datos:', uniqueYears);
				// Podrías añadir un selector de año aquí si quieres filtrar por año, por ahora usaremos todos los datos.

				stats.forEach((stat) => {
					const provinceNameLower = (stat.province || 'Desconocida').toLowerCase();
					const communityName = provinceToCommunityMap[provinceNameLower] || 'Otras Comunidades'; // Usar mapeo
					const value = Number(stat.transaction_total || 0); // Usar transaction_total
					const year = stat.year; // Para potencialmente agrupar por año dentro de la provincia

					const communityId = communityName
						.toLowerCase()
						.replace(/\s+/g, '_')
						.replace(/[^a-z0-9_]/g, '');

					if (!communityData[communityId]) {
						communityData[communityId] = {
							name: communityName,
							id: communityId,
							color: communityColors[colorIndex % communityColors.length],
							provinces: {}
						};
						colorIndex++;
					}
					// Sumar el valor para la provincia (esto acumulará si hay varios años por provincia)
					// Si quieres ver años separados, la estructura de datos necesitaría otro nivel o filtrar por año antes.
					communityData[communityId].provinces[provinceNameLower] =
						(communityData[communityId].provinces[provinceNameLower] || 0) + value;
				});
				console.log(
					'[Data] Datos agrupados por comunidad (communityData):',
					JSON.parse(JSON.stringify(communityData))
				);

				const treemapSeriesData = [];
				Object.values(communityData).forEach((community) => {
					treemapSeriesData.push({
						id: community.id,
						name: community.name,
						color: community.color
					});
					Object.entries(community.provinces).forEach(([provinceName, totalValue]) => {
						if (totalValue > 0) {
							treemapSeriesData.push({
								// El nombre de la provincia ya está en minúsculas, capitalizar para mostrar
								name: provinceName.charAt(0).toUpperCase() + provinceName.slice(1),
								parent: community.id,
								value: totalValue
							});
						}
					});
				});
				console.log(
					'[Data] Datos procesados para Treemap (treemapSeriesData):',
					JSON.parse(JSON.stringify(treemapSeriesData))
				);

				// Verificar si hay nodos hijos válidos (provincias con valor)
				const hasChildNodes = treemapSeriesData.some((d) => d.parent && d.value > 0);
				if (!hasChildNodes) {
					console.warn(
						'[Data] treemapSeriesData no contiene nodos hijos válidos (provincias con valor). Se tratará como "no hay datos" para el gráfico.'
					);
					chartData = []; // Forzar a que chartData.length sea 0 para el mensaje en el template
				} else {
					chartData = treemapSeriesData;
				}
				console.log('[Data] chartData global actualizado:', JSON.parse(JSON.stringify(chartData)));
			}
		} catch (e) {
			console.error('[DataFetchError] Error en fetchDataAndPrepareChart:', e);
			error = e.message;
		} finally {
			isLoading = false;
			console.log(
				`[Data] Finalizando fetchDataAndPrepareChart. isLoading: ${isLoading}, error: ${error}, chartData.length: ${chartData.length}`
			);
			await tick();
			renderChart();
		}
	}

	function renderChart() {
		console.log(
			`[Render] Iniciando renderChart. isLoading: ${isLoading}, error: ${error}, chartData.length: ${chartData.length}`
		);
		const chartContainer = document.getElementById(chartContainerId);

		if (isLoading) {
			console.log('[Render] Todavía cargando (isLoading es true), no se renderiza.');
			return;
		}

		if (error) {
			console.log(
				'[Render] Hay un error, no se renderiza el gráfico. Mensaje de error se mostrará.'
			);
			// El template se encargará de mostrar el error
			return;
		}

		if (!chartContainer) {
			console.error(
				'[Render] Contenedor del gráfico (#' + chartContainerId + ') NO ENCONTRADO en el DOM.'
			);
			// Esto podría ser un problema de timing o si el ID es incorrecto.
			// Considerar un reintento o un error más visible si esto pasa consistentemente.
			return;
		}

		console.log('[Render] Verificando Highcharts y módulo treemap...');
		if (
			typeof Highcharts === 'undefined' ||
			!Highcharts.seriesTypes ||
			!Highcharts.seriesTypes.treemap
		) {
			console.error('[Render] Highcharts o el módulo Treemap NO están listos/disponibles.');
			// Actualizar el estado de error podría ser una opción aquí para informar al usuario
			// error = 'No se pudo cargar la librería de gráficos (Treemap).';
			// await tick(); // si se actualiza el error
			return;
		}
		console.log('[Render] Highcharts y Treemap listos.');

		if (chartInstance) {
			console.log('[Render] Destruyendo instancia de gráfico anterior.');
			chartInstance.destroy();
			chartInstance = null;
		}

		if (chartData.length === 0) {
			console.log(
				'[Render] chartData está vacío (posiblemente por falta de nodos hijos válidos o error previo). No se creará el gráfico. El template mostrará el mensaje apropiado.'
			);
			// Asegurarse de que el contenedor del gráfico esté vacío si previamente tuvo uno
			chartContainer.innerHTML = ''; // Limpiar por si acaso
			return;
		}

		console.log(
			'[Render] Procediendo a crear el gráfico Treemap con chartData:',
			JSON.parse(JSON.stringify(chartData))
		);
		try {
			chartInstance = Highcharts.chart(chartContainerId, {
				chart: {
					type: 'treemap'
				},
				title: {
					text: 'Total de Transacciones de Vivienda por CC.AA. y Provincia (Todos los años acumulados)'
				},
				subtitle: {
					text: 'Fuente: <a href="https://sos2425-21.onrender.com/api/v1/home-buying-selling-stats" target="_blank">API SOS2425-21</a>. El tamaño representa el total de transacciones.'
				},
				series: [
					{
						type: 'treemap',
						name: 'Total Transacciones',
						allowTraversingTree: true,
						alternateStartingDirection: true,
						layoutAlgorithm: 'sliceAndDice',
						dataLabels: {
							enabled: true,
							style: {
								textOutline: 'none'
							}
						},
						borderColor: '#ffffff',
						borderRadius: 3,
						nodeSizeBy: 'leaf',
						levels: [
							{
								level: 1,
								layoutAlgorithm: 'sliceAndDice',
								groupPadding: 3,
								dataLabels: {
									enabled: true,
									align: 'left',
									verticalAlign: 'top',
									style: {
										fontSize: '13px',
										fontWeight: 'bold'
									}
								},
								borderWidth: 3
							},
							{
								level: 2,
								dataLabels: {
									enabled: true,
									format: '{point.name}: {point.value:,.0f} transacciones',
									style: {
										fontSize: '10px',
										fontWeight: 'normal'
									}
								}
							}
						],
						data: chartData
					}
				],
				tooltip: {
					useHTML: true,
					headerFormat: '',
					pointFormat: '<b>{point.name}</b><br>Total Transacciones: {point.value:,.0f}'
				},
				credits: {
					enabled: false
				}
			});
			console.log('[Render] Gráfico Treemap CREADO con éxito.');
		} catch (e) {
			console.error('[RenderChartError] Error al crear la instancia de Highcharts:', e);
			error = 'Error al renderizar el gráfico: ' + e.message;
			// No es necesario llamar a tick aquí, el template debería reaccionar al cambio de `error`.
		}
	}

	onMount(() => {
		console.log('[onMount] Componente montado. Llamando a fetchDataAndPrepareChart.');
		fetchDataAndPrepareChart();
		return () => {
			console.log('[onMount] Componente será desmontado.');
			if (chartInstance) {
				console.log('[onMount] Destruyendo instancia de gráfico en desmontaje.');
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Treemap de Compra-Venta de Viviendas</title>
</svelte:head>

{#if isLoading}
	<p>Cargando datos y gráfico treemap...</p>
{:else if error}
	<p class="error-message">Error: {error}</p>
	<p>
		Asegúrate de que la API
		<a
			href="https://sos2425-21.onrender.com/api/v1/home-buying-selling-stats"
			target="_blank"
			rel="noopener noreferrer"
		>
			https://sos2425-21.onrender.com/api/v1/home-buying-selling-stats
		</a>
		está accesible y devuelve un array de datos JSON con los campos esperados (ej.
		<code>province</code>, <code>transaction_total</code>, <code>year</code>). Verifica también tu
		conexión a internet y que las librerías Highcharts se hayan cargado. Revisa la consola del
		navegador para más detalles si el problema persiste.
	</p>
{:else if chartData.length === 0}
	<p>
		No se encontraron datos válidos para mostrar en el treemap. La API puede no haber devuelto
		registros, los registros existentes podrían no tener datos de comunidad/provincia/ventas
		válidos, o los datos procesados resultaron vacíos.
	</p>
{:else}
	<div
		id={chartContainerId}
		style="width:100%; min-height:500px; height:auto; max-height:80vh; margin-top: 20px;"
	></div>
{/if}

<style>
	p {
		font-family: 'Arial', sans-serif;
		text-align: center;
		margin: 20px 10px;
		line-height: 1.5;
	}
	.error-message {
		color: #c0392b;
		background-color: #fdedec;
		border: 1px solid #e74c3c;
		padding: 15px;
		border-radius: 5px;
		font-weight: bold;
	}
	:global(div[id^='treemap-chart-container-g21']) {
		border: 1px solid #ddd;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
		background-color: #fdfdfd;
	}
	a {
		color: #3498db;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
</style>
