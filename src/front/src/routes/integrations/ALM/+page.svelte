<script>
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';

	// Variables para almacenar los datos
	let employmentData = [];
	let dependencyData = [];
	let selectedYear = 2024;
	let isLoading = true;
	let error = null;
	let years = [2021, 2022, 2023, 2024];
	let chart;

	// Función para obtener datos de la API externa de empleo
	async function fetchEmploymentData() {
		try {
			const yearsToFetch = [2023, 2024];
			const fetchPromises = yearsToFetch.map((year) =>
				fetch(`https://sos2425-14.onrender.com/api/v1/employment-data?year=${year}`)
			);

			const responses = await Promise.all(fetchPromises);
			let combinedData = [];

			for (const response of responses) {
				if (!response.ok) {
					const yearFromUrl = new URL(response.url).searchParams.get('year');
					throw new Error(
						`Error al obtener datos de empleo para el año ${yearFromUrl || 'desconocido'}: ${response.status}`
					);
				}
				const data = await response.json();
				combinedData = combinedData.concat(data);
			}

			console.log('Datos de empleo para 2023 y 2024 obtenidos:', combinedData.length);
			return combinedData;
		} catch (err) {
			console.error('Error fetching employment data:', err);
			error = err.message;
			return [];
		}
	}

	// Función para obtener datos de dependencia desde nuestra API
	const fetchDependenceData = async () => {
		try {
			const response = await fetch('/api/v1/autonomy-dependence-applications?limit=100');
			if (!response.ok) {
				throw new Error(`Error al obtener datos de dependencia: ${response.status}`);
			}
			const data = await response.json();
			console.log('Datos de dependencia obtenidos:', data.length);
			return data;
		} catch (err) {
			console.error('Error al obtener datos de dependencia:', err);
			error = 'Error al cargar datos de dependencia: ' + err.message;
			return []; // Devolver array vacío en caso de error
		}
	};

	// Mapeo de nombres para asegurar coincidencia entre APIs
	const communityMapping = {
		Madrid: 'Madrid, Comunidad de',
		Andalucía: 'Andalucía',
		Cataluña: 'Cataluña',
		'Comunitat Valenciana': 'Comunitat Valenciana',
		Galicia: 'Galicia',
		'Castilla y León': 'Castilla y León',
		'País Vasco': 'País Vasco',
		Canarias: 'Canarias',
		'Castilla-La Mancha': 'Castilla - La Mancha',
		Murcia: 'Murcia, Región de',
		Aragón: 'Aragón',
		Asturias: 'Asturias, Principado de',
		Extremadura: 'Extremadura',
		Baleares: 'Balears, Illes',
		Navarra: 'Navarra, Comunidad Foral de',
		Cantabria: 'Cantabria',
		'La Rioja': 'Rioja, La',
		'Ceuta y Melilla': 'Ceuta y Melilla'
	};

	// Función para procesar los datos para el gráfico con drilldown
	const processDataForDrilldown = (year) => {
		try {
			console.log(`Procesando datos para el año ${year}...`);

			const employmentDataForYear = employmentData.filter((d) => d.year === parseInt(year));
			const dependenceDataForYear = dependencyData.filter((d) => d.year === parseInt(year));

			if (!employmentDataForYear.length) {
				console.warn(`No hay datos de empleo para el año ${year}. El gráfico estará vacío.`);
				return { mainSeries: [], drilldownSeries: [] };
			}

			console.log(`Datos filtrados por año: ${year}`, {
				employment: employmentDataForYear.length,
				dependence: dependenceDataForYear.length
			});

			const communityData = {};

			// Procesar datos de empleo
			console.log('--- Iniciando procesamiento de datos de EMPLEO ---');
			employmentDataForYear.forEach((item) => {
				if (typeof item.autonomous_community !== 'string' || !item.autonomous_community.trim()) {
					console.warn(
						'EMPLEO: Registro con nombre de comunidad inválido o ausente, saltando:',
						item
					);
					return;
				}
				if (item.autonomous_community === 'TOTAL') {
					console.log('EMPLEO: Registro "TOTAL" a nivel nacional ignorado:', item);
					return;
				}

				const empCommunityName = item.autonomous_community;
				const canonicalCommunityName = communityMapping[empCommunityName] || empCommunityName;
				console.log(
					`EMPLEO: Procesando '${empCommunityName}', mapeado a CANONICAL '${canonicalCommunityName}'`
				);

				if (!communityData[canonicalCommunityName]) {
					console.log(
						`EMPLEO: Creando entrada nueva en communityData para CANONICAL '${canonicalCommunityName}'`
					);
					communityData[canonicalCommunityName] = {
						name: canonicalCommunityName,
						educationLevels: {
							INF: { unemployment_rate_api: null },
							SEC: { unemployment_rate_api: null },
							SUP: { unemployment_rate_api: null },
							TOTAL: { unemployment_rate_api: null }
						},
						dependencyRequests: 0
					};
				} else {
					console.log(
						`EMPLEO: Entrada ya existente en communityData para CANONICAL '${canonicalCommunityName}'`
					);
				}

				const rateFromApi = parseFloat(item.unemployment_rate);
				if (isNaN(rateFromApi)) {
					console.warn(
						`EMPLEO: Tasa de desempleo inválida para ${canonicalCommunityName}, nivel ${item.education_level}: ${item.unemployment_rate}`,
						item
					);
					return;
				}

				if (item.education_level === 'INF') {
					communityData[canonicalCommunityName].educationLevels.INF.unemployment_rate_api =
						rateFromApi;
				} else if (item.education_level === 'SEC') {
					communityData[canonicalCommunityName].educationLevels.SEC.unemployment_rate_api =
						rateFromApi;
				} else if (item.education_level === 'SUP') {
					communityData[canonicalCommunityName].educationLevels.SUP.unemployment_rate_api =
						rateFromApi;
				} else if (item.education_level === 'TOTAL') {
					communityData[canonicalCommunityName].educationLevels.TOTAL.unemployment_rate_api =
						rateFromApi;
				}
			});
			console.log('--- Fin procesamiento de datos de EMPLEO ---');
			console.log('communityData DESPUÉS de EMPLEO:', JSON.parse(JSON.stringify(communityData))); // Para ver el estado

			// Añadir datos de dependencia
			console.log('--- Iniciando procesamiento de datos de DEPENDENCIA ---');
			dependenceDataForYear.forEach((item) => {
				if (typeof item.place !== 'string' || !item.place.trim()) {
					console.warn(
						'DEPENDENCIA: Registro con nombre de comunidad (place) inválido o ausente, saltando:',
						item
					);
					return;
				}
				const depCommunityName = item.place;
				console.log(
					`DEPENDENCIA: Intentando encontrar y actualizar '${depCommunityName}' en communityData`
				);

				if (communityData[depCommunityName]) {
					communityData[depCommunityName].dependencyRequests = parseFloat(item.request) || 0;
					console.log(
						`DEPENDENCIA: '${depCommunityName}' ENCONTRADA. Solicitudes actualizadas a: ${communityData[depCommunityName].dependencyRequests}`
					);
				} else {
					console.warn(
						`DEPENDENCIA: Comunidad '${depCommunityName}' (de API dependencia) NO ENCONTRADA en communityData (claves actuales: ${Object.keys(communityData).join(', ')}). No se añadirán solicitudes.`
					);
				}
			});
			console.log('--- Fin procesamiento de datos de DEPENDENCIA ---');
			console.log(
				'communityData DESPUÉS de DEPENDENCIA:',
				JSON.parse(JSON.stringify(communityData))
			);

			// Crear series para el gráfico principal
			const mainSeries = Object.values(communityData)
				.filter(
					(community) =>
						community.educationLevels.TOTAL.unemployment_rate_api !== null &&
						!isNaN(community.educationLevels.TOTAL.unemployment_rate_api)
				)
				.map((community) => ({
					name: community.name,
					y: parseFloat(community.educationLevels.TOTAL.unemployment_rate_api.toFixed(2)),
					drilldown: community.name, // Usar el nombre canónico para el ID del drilldown
					dependencyRequests: community.dependencyRequests
				}))
				.sort((a, b) => b.y - a.y);

			// Crear series para el drilldown
			const drilldownSeries = Object.values(communityData)
				.filter((community) => community.educationLevels.TOTAL.unemployment_rate_api !== null) // Asegurar que la comunidad es válida para el gráfico
				.map((community) => {
					const drilldownData = [];
					if (
						community.educationLevels.INF.unemployment_rate_api !== null &&
						!isNaN(community.educationLevels.INF.unemployment_rate_api)
					) {
						drilldownData.push({
							name: 'Sin Educación Secundaria (INF)',
							y: parseFloat(community.educationLevels.INF.unemployment_rate_api.toFixed(2)),
							dependencyRequests: community.dependencyRequests,
							color: '#FF9999'
						});
					}
					if (
						community.educationLevels.SEC.unemployment_rate_api !== null &&
						!isNaN(community.educationLevels.SEC.unemployment_rate_api)
					) {
						drilldownData.push({
							name: 'Educación Secundaria (SEC)',
							y: parseFloat(community.educationLevels.SEC.unemployment_rate_api.toFixed(2)),
							dependencyRequests: community.dependencyRequests,
							color: '#99CCFF'
						});
					}
					if (
						community.educationLevels.SUP.unemployment_rate_api !== null &&
						!isNaN(community.educationLevels.SUP.unemployment_rate_api)
					) {
						drilldownData.push({
							name: 'Educación Superior (SUP)',
							y: parseFloat(community.educationLevels.SUP.unemployment_rate_api.toFixed(2)),
							dependencyRequests: community.dependencyRequests,
							color: '#99FF99'
						});
					}

					return {
						id: community.name, // ID debe coincidir con 'drilldown' en mainSeries
						name: `${community.name} - Tasa Desempleo por Nivel Educativo`,
						data: drilldownData
					};
				})
				.filter((series) => series.data.length > 0); // Solo incluir series de drilldown que tengan datos

			console.log('Datos procesados para el gráfico:', {
				mainSeries: mainSeries,
				drilldownSeries: drilldownSeries
			});

			if (mainSeries.length === 0) {
				console.warn(
					`No se generaron datos para la serie principal del gráfico para el año ${year}. El gráfico podría aparecer vacío.`
				);
				error = `No hay datos de empleo suficientes o válidos para mostrar en el gráfico para el año ${year}. Pruebe con otro año si está disponible o verifique las fuentes de datos.`;
				return { mainSeries: [], drilldownSeries: [] }; // Asegurar que se devuelve vacío
			}

			return { mainSeries, drilldownSeries };
		} catch (err) {
			console.error('Error al procesar datos para el gráfico:', err);
			error = 'Error crítico al procesar los datos para el gráfico: ' + err.message;
			return { mainSeries: [], drilldownSeries: [] };
		}
	};

	const loadHighcharts = async () => {
		try {
			console.log('Intentando cargar Highcharts...');

			// Verificar si Highcharts ya está cargado
			if (window.Highcharts) {
				console.log('Highcharts ya está cargado');

				// Verificar si el módulo drilldown ya está cargado
				if (!window.Highcharts.seriesTypes.pie?.prototype.animateDrilldown) {
					console.log('Cargando módulo drilldown...');
					return new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.src = 'https://code.highcharts.com/modules/drilldown.js';
						script.async = true;
						script.onload = () => {
							console.log('Módulo drilldown cargado correctamente');
							resolve(window.Highcharts);
						};
						script.onerror = (error) => {
							console.error('Error al cargar el módulo drilldown:', error);
							reject(error);
						};
						document.head.appendChild(script);
					});
				}

				// Si Highcharts y drilldown ya están cargados, devolver Highcharts
				return window.Highcharts;
			}

			// Si Highcharts no está cargado, cargarlo primero
			return new Promise((resolve, reject) => {
				console.log('Cargando Highcharts desde CDN...');
				const script = document.createElement('script');
				script.src = 'https://code.highcharts.com/highcharts.js';
				script.async = true;
				script.onload = () => {
					console.log('Highcharts cargado correctamente, cargando drilldown...');

					// Ahora cargar el módulo drilldown
					const drilldownScript = document.createElement('script');
					drilldownScript.src = 'https://code.highcharts.com/modules/drilldown.js';
					drilldownScript.async = true;
					drilldownScript.onload = () => {
						console.log('Módulo drilldown cargado correctamente');
						resolve(window.Highcharts);
					};
					drilldownScript.onerror = (error) => {
						console.error('Error al cargar el módulo drilldown:', error);
						reject(error);
					};
					document.head.appendChild(drilldownScript);
				};
				script.onerror = (error) => {
					console.error('Error al cargar Highcharts:', error);
					reject(error);
				};
				document.head.appendChild(script);
			});
		} catch (err) {
			console.error('Error en la función loadHighcharts:', err);
			throw err;
		}
	};

	const createChart = async () => {
		try {
			console.log('Iniciando creación del gráfico...');

			// Verificar que el elemento contenedor exista
			const container = document.getElementById('chart-container');
			if (!container) {
				console.error('El contenedor del gráfico no existe en el DOM');
				error = 'El contenedor del gráfico no está disponible';
				return;
			}

			// Verificar que existan datos para visualizar
			if (!employmentData.length || !dependencyData.length) {
				console.error('No hay datos disponibles para mostrar en el gráfico');
				error = 'No hay datos disponibles para visualizar';
				return;
			}

			// Asegurarse de que Highcharts esté cargado
			const Highcharts = await loadHighcharts();
			if (!Highcharts) {
				console.error('No se pudo cargar Highcharts');
				error = 'Error al cargar la biblioteca de gráficos';
				return;
			}

			console.log('Procesando datos para el gráfico...');
			const processedData = processDataForDrilldown(selectedYear);

			console.log('Datos procesados:', processedData);

			// Configurar el gráfico
			Highcharts.chart('chart-container', {
				chart: {
					type: 'pie',
					style: {
						fontFamily: 'Arial, sans-serif'
					},
					events: {
						drilldown: function (e) {
							this.setTitle({
								text: `Desempleo y Dependencia por nivel educativo en ${e.point.name}`
							});
						},
						drillup: function () {
							this.setTitle({
								text: `Tasa de Desempleo por Comunidad Autónoma (${selectedYear})`
							});
						}
					}
				},
				title: {
					text: 'Tasa de desempleo por comunidad autónoma y nivel educativo',
					style: {
						fontSize: '20px',
						fontWeight: 'bold'
					}
				},
				subtitle: {
					text: `Año: ${selectedYear} - Haz clic en cada comunidad para ver desglose por nivel educativo`,
					style: {
						fontSize: '14px'
					}
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						borderRadius: 5,
						depth: 35,
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b>: {point.y:.1f}%'
						}
					}
				},
				tooltip: {
					headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
					pointFormat:
						'<span style="color:{point.color}">{point.name}</span><br>' +
						'Tasa de desempleo: <b>{point.y:.2f}%</b><br>' +
						'Solicitudes de dependencia: <b>{point.dependencyRequests:,.0f}</b>'
				},
				series: [
					{
						name: 'Comunidades',
						colorByPoint: true,
						data: processedData.mainSeries
					}
				],
				drilldown: {
					series: processedData.drilldownSeries,
					activeDataLabelStyle: {
						textDecoration: 'none',
						fontWeight: 'bold'
					},
					drillUpButton: {
						relativeTo: 'spacingBox',
						position: {
							y: 0,
							x: 0
						},
						theme: {
							fill: '#f7f7f7',
							'stroke-width': 1,
							stroke: '#cccccc',
							r: 3,
							states: {
								hover: {
									fill: '#e6e6e6'
								}
							}
						}
					}
				}
			});

			console.log('Gráfico creado correctamente');
		} catch (err) {
			console.error('Error al crear el gráfico:', err);
			error = 'Error al crear el gráfico: ' + err.message;
		}
	};

	const updateYear = async () => {
		// Destruir el gráfico si estaba visible y Highcharts está cargado
		if (!isLoading && !error) {
			const container = document.getElementById('chart-container');
			if (container && window.Highcharts && window.Highcharts.charts) {
				const chartInstance = window.Highcharts.charts.find((c) => c && c.renderTo === container);
				if (chartInstance) {
					chartInstance.destroy();
				}
			}
		}

		isLoading = true;
		error = null;
		await tick(); // Permitir que el estado de carga (spinner) se renderice

		try {
			// selectedYear ya está actualizado por el bind:value del select.
			// createChart() usará el nuevo selectedYear para procesar y dibujar.

			isLoading = false;
			await tick(); // Esperar a que el DOM se actualice y #chart-container esté disponible

			await createChart();
		} catch (err) {
			console.error('Error al actualizar el año:', err);
			error = 'Error al actualizar los datos: ' + err.message;
			isLoading = false;
			await tick(); // Asegurar que el mensaje de error se renderice
		}
	};

	// Cargar datos y crear gráfico al montar el componente
	onMount(async () => {
		try {
			isLoading = true;
			error = null; // Limpiar errores previos

			// Cargar datos de empleo y dependencia
			const [empData, depData] = await Promise.all([fetchEmploymentData(), fetchDependenceData()]);

			// Asignar los datos a las variables
			employmentData = empData;
			dependencyData = depData;

			// Verificar que se hayan cargado los datos
			if (!employmentData.length || !dependencyData.length) {
				throw new Error('No se pudieron cargar los datos necesarios');
			}

			console.log('Datos cargados:', {
				employment: employmentData.length,
				dependency: dependencyData.length
			});

			// Extraer años disponibles de los datos, ordenarlos y seleccionar el más reciente
			years = [2023, 2024]; // Mostrar solo 2023 y 2024
			selectedYear = 2024; // Seleccionar 2024 por defecto

			isLoading = false; // Indicar que la carga ha terminado
			await tick(); // Esperar a que Svelte actualice el DOM (importante para que #chart-container exista)

			// Crear el gráfico ahora que el DOM está listo
			await createChart();
		} catch (err) {
			console.error('Error en onMount:', err);
			error = 'Error al inicializar: ' + err.message;
			isLoading = false; // Asegurar que isLoading se ponga a false en caso de error
			await tick(); // Esperar que el DOM se actualice para mostrar el error
		}
	});

	// Importar el nuevo componente de integración
	import EnergyPopulationIntegration from './EnergyPopulationIntegration.svelte';

	// Definición de las integraciones que se mostrarán con iframes
	const iframeIntegrations = [
		{
			title: 'Estadísticas ERTE por Sector (G18)',
			path: '/integrations/ALM/g18-dana-erte-stats?embedded=true',
			description:
				'Visualización polar (barras radiales) que muestra el total de trabajadores con contrato suspendido, agrupados por sector económico, según los datos de ERTE relacionados con DANA.'
		},
		{
			title: 'Accidentes con Animales por Provincia (G20)',
			path: '/integrations/ALM/g20-accidents-with-animals?embedded=true',
			description:
				'Gráfico de área que representa el número total de accidentes de tráfico con implicación de animales, agregados por provincia.'
		},
		{
			title: 'Compra-Venta de Viviendas (G21)',
			path: '/integrations/ALM/g21-home-buying-selling-stats?embedded=true',
			description:
				'Treemap que ilustra las estadísticas de compra-venta de viviendas, mostrando el volumen por Comunidades Autónomas y Provincias (datos acumulados de todos los años).'
		},
		{
			title: 'Gestión de Contactos de HubSpot (Externa)',
			path: '/integrations/ALM/hubspot?embedded=true',
			description:
				'Interfaz para visualizar, crear, actualizar y eliminar contactos de HubSpot a través de un proxy local. Permite la gestión de contactos directamente desde esta página.'
		},
		{
			title: 'Buscador de Imágenes de la NASA (Externa)',
			path: '/integrations/ALM/nasa?embedded=true',
			description:
				'Herramienta de búsqueda que permite explorar la vasta colección de imágenes de la NASA. Introduce un término para descubrir fotografías e ilustraciones del espacio.'
		},
		{
			title: 'Personajes de Rick and Morty (Externa)',
			path: '/integrations/ALM/rick-and-morty?embedded=true',
			description:
				'Visualización de personajes de la popular serie Rick and Morty, obtenidos a través de su API pública mediante un proxy local. Muestra imágenes e información de los personajes.'
		}
		// Puedes añadir más aquí si es necesario
	];
</script>

<main>
	<h1>Integración de Datos de Empleo y Dependencia</h1>

	<div class="controls">
		<label for="year-select">Seleccionar Año:</label>
		<select id="year-select" bind:value={selectedYear} on:change={updateYear}>
			{#each years as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	</div>

	{#if isLoading}
		<div class="loading">
			<p>Cargando datos...</p>
			<div class="spinner"></div>
		</div>
	{:else if error}
		<div class="error">
			<p>Error: {error}</p>
			<button on:click={() => window.location.reload()}>Reintentar</button>
		</div>
	{:else}
		<div id="chart-container" class="chart-container"></div>

		<div class="explanation">
			<h2>Interpretación del gráfico</h2>
			<p>Este gráfico muestra la tasa de desempleo por comunidad autónoma y nivel educativo:</p>
			<ul>
				<li>
					<strong>Gráfico principal:</strong> Muestra las comunidades autónomas ordenadas por tasa de
					desempleo total.
				</li>
				<li>
					<strong>Drilldown:</strong> Al hacer clic en una comunidad, se muestra el desglose por nivel
					educativo:
				</li>
				<ul>
					<li><strong>INF:</strong> Personas sin educación secundaria</li>
					<li><strong>SEC:</strong> Personas con educación secundaria</li>
					<li><strong>SUP:</strong> Personas con educación superior</li>
				</ul>
				<li>
					Para cada nivel, se muestra tanto la tasa de desempleo como el número de solicitudes de
					dependencia en esa comunidad.
				</li>
			</ul>
			<p>
				Este análisis permite observar cómo el nivel educativo afecta a la tasa de desempleo y su
				posible relación con las solicitudes de ayudas por dependencia.
			</p>
			<p><strong>Fuentes de datos:</strong></p>
			<ul>
				<li>
					Datos de empleo: <a
						href="https://sos2425-14.onrender.com/api/v1/employment-data"
						target="_blank">API de empleo (SOS2425-14)</a
					>
				</li>
				<li>Datos de dependencia: API interna de solicitudes de dependencia</li>
			</ul>
		</div>
	{/if}

	<!-- Nueva sección para la integración de Energía y Población -->
	<hr class="section-divider" />
	<section class="integration-section">
		<h2>Integración: Energía Vendida por Tecnología y Población (2024)</h2>
		<EnergyPopulationIntegration />
		<div class="explanation">
			<h3>Interpretación del gráfico</h3>
			<p>
				Este gráfico muestra una combinación de datos de energía y población para las Comunidades
				Autónomas de España en el año 2024:
			</p>
			<ul>
				<li>
					<strong>Columnas:</strong> Representan la cantidad de energía vendida (en GWh) para cada tipo
					de tecnología (Solar FV, Eólica, Biomasa, etc.) en cada comunidad.
				</li>
				<li>
					<strong>Línea Naranja:</strong> Muestra la energía total vendida (en GWh) acumulada de todas
					las tecnologías para cada comunidad.
				</li>
				<li>
					<strong>Tooltip:</strong> Al pasar el cursor sobre una comunidad, se muestra un resumen con
					la población de la comunidad, la energía vendida por cada tecnología y la energía total vendida.
				</li>
			</ul>
			<p>
				Este análisis permite comparar la producción energética por diferentes fuentes entre
				comunidades y relacionarla visualmente con su población a través del tooltip.
			</p>
			<p><strong>Fuentes de datos:</strong></p>
			<ul>
				<li>
					Datos de energía vendida: <a
						href="https://sos2425-12.onrender.com/api/v1/annual-evolutions?year=2024"
						target="_blank">API Externa (SOS2425-12 - annual-evolutions)</a
					>
				</li>
				<li>Datos de población: API interna de este proyecto (autonomy-dependence-applications)</li>
			</ul>
		</div>
	</section>

	<!-- Nueva sección para las integraciones G18, G20, G21 con iframes -->
	<hr class="section-divider" />
	<section class="iframe-integrations-container">
		<h2>Otras Integraciones (Visualizaciones Individuales)</h2>
		<p class="intro-text-iframe">
			Las siguientes visualizaciones se cargan desde sus páginas dedicadas y se muestran aquí para
			una vista previa. Haz clic en el título de cada una para abrirla en una nueva pestaña con
			funcionalidad completa.
		</p>

		{#if iframeIntegrations.length === 0}
			<p>No hay otras integraciones para mostrar en este momento.</p>
		{:else}
			{#each iframeIntegrations as integration (integration.path)}
				<div class="integration-item">
					<h3>
						<a href={integration.path} target="_blank" rel="noopener noreferrer">
							{integration.title}
						</a>
					</h3>
					<p class="description-iframe">{integration.description}</p>
					<div class="iframe-wrapper">
						<iframe
							src={integration.path}
							title="Previsualización de {integration.title}"
							width="100%"
							height="550"
							frameborder="0"
							loading="lazy"
							sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
						></iframe>
					</div>
				</div>
			{/each}
		{/if}
	</section>
</main>

<style>
	main {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: Arial, sans-serif;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 2rem;
		font-size: 2rem;
		border-bottom: 2px solid #6a82fb;
		padding-bottom: 1rem;
	}

	.controls {
		margin-bottom: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	select {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		background-color: white;
		font-size: 1rem;
		cursor: pointer;
	}

	select:hover {
		border-color: #6a82fb;
	}

	.chart-container {
		width: 100%;
		height: 600px;
		margin: 0 auto 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		background-color: #fff;
	}

	.explanation {
		background-color: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
		border-left: 4px solid #6a82fb;
	}

	.explanation h2 {
		color: #333;
		margin-top: 0;
		font-size: 1.5rem;
	}

	.explanation h3 {
		color: #333;
		margin-top: 0;
		margin-bottom: 0.5rem;
		font-size: 1.3rem;
	}

	.explanation p,
	.explanation li {
		line-height: 1.6;
		color: #444;
	}

	.explanation ul {
		margin-left: 1.5rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
	}

	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #6a82fb;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error {
		text-align: center;
		color: #e74c3c;
		margin: 2rem;
		padding: 1rem;
		border: 1px solid #e74c3c;
		border-radius: 4px;
	}

	.error button {
		background-color: #e74c3c;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		margin-top: 1rem;
		cursor: pointer;
	}

	.error button:hover {
		background-color: #c0392b;
	}

	a {
		color: #6a82fb;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	/* Separador entre secciones de integración */
	.section-divider {
		border: none;
		height: 1px;
		background-color: #ddd; /* Color suave para el separador */
		margin-top: 3rem;
		margin-bottom: 3rem;
	}

	.integration-section {
		margin-bottom: 2rem; /* Espacio debajo de cada sección de integración */
	}

	.integration-section h2 {
		text-align: center;
		color: #333;
		margin-bottom: 1.5rem;
		font-size: 1.8rem;
		border-bottom: 2px solid #4caf50; /* Un color diferente para el subtítulo de la nueva integración */
		padding-bottom: 0.8rem;
	}

	/* ESTILOS PARA LA NUEVA SECCIÓN DE IFRAMES */
	.iframe-integrations-container h2 {
		text-align: center;
		color: #2c3e50; /* Un color diferente para distinguir secciones */
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		font-size: 2em; /* Ligeramente más pequeño que el H1 principal */
		border-bottom: 2px solid #3498db; /* Color de borde diferente */
		padding-bottom: 0.8rem;
	}

	.intro-text-iframe {
		text-align: center;
		font-size: 1.05em;
		color: #555;
		margin-bottom: 30px;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.integration-item {
		background-color: #ffffff; /* Fondo blanco para cada item de iframe */
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 30px; /* Espacio entre items */
		padding: 20px;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.04);
		transition: box-shadow 0.3s ease;
	}

	.integration-item:hover {
		box-shadow: 0 5px 10px rgba(0, 0, 0, 0.08);
	}

	.integration-item h3 {
		/* Usamos H3 para los títulos de iframes */
		margin-top: 0;
		margin-bottom: 8px;
		font-size: 1.6em;
	}

	.integration-item h3 a {
		text-decoration: none;
		color: #2980b9; /* Un azul diferente para estos enlaces */
		transition: color 0.3s ease;
	}

	.integration-item h3 a:hover {
		color: #1f618d;
		text-decoration: underline;
	}

	.description-iframe {
		font-size: 0.95em;
		color: #666;
		margin-bottom: 15px;
		line-height: 1.5;
	}

	.iframe-wrapper {
		/* Cambiado de .iframe-container para evitar colisión */
		border: 1px dashed #d0d0d0;
		padding: 8px;
		border-radius: 4px;
		background-color: #fdfdfd;
		overflow: hidden;
	}

	.iframe-wrapper iframe {
		display: block;
		border-radius: 3px;
	}
</style>
