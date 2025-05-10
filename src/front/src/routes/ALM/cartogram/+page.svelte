<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let autonomyData = [];
	let isLoading = true;
	let error = null;
	let width = 960;
	let height = 600;
	let svg;
	let selectedVariable = 'request'; // Variable por defecto para mostrar

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

	// Función para manejar el cambio de variable
	function handleVariableChange(event) {
		selectedVariable = event.target.value;
		initCartogram(); // Redibujar el cartograma con la nueva variable
	}

	// Procesar datos para el cartograma
	function processDataForCartogram() {
		// Agrupar datos por lugar (Comunidad Autónoma)
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

		// Obtener los datos más recientes para cada lugar
		const latestData = Object.entries(placeGroups).map(([place, data]) => {
			// Obtener el registro más reciente
			const latestRecord = data.reduce(
				(latest, current) => (current.year > latest.year ? current : latest),
				data[0]
			);

			return {
				id: place,
				name: place,
				value: latestRecord[selectedVariable], // Usar la variable seleccionada
				population: latestRecord.population,
				dependent_population: latestRecord.dependent_population,
				request: latestRecord.request,
				year: latestRecord.year
			};
		});

		return latestData;
	}

	// Cargar las bibliotecas verificando que estén disponibles
	async function waitForLibraries() {
		if (!browser) return;

		return new Promise((resolve, reject) => {
			// Función para comprobar si las bibliotecas están cargadas
			const checkLibrariesLoaded = () => {
				if (window.d3 && typeof window.d3.select === 'function' && window.topojson && window.d3.geoConicConformalSpain) {
					console.log('D3, TopoJSON y d3-composite-projections cargados correctamente');
					resolve();
					return true;
				}
				return false;
			};

			// Comprobar inmediatamente
			if (checkLibrariesLoaded()) return;

			// Si no están cargadas, esperar y comprobar cada 100ms
			let attempts = 0;
			const maxAttempts = 300; // 30 segundos máximo
			const interval = setInterval(() => {
				attempts++;
				if (checkLibrariesLoaded()) {
					clearInterval(interval);
				} else if (attempts >= maxAttempts) {
					clearInterval(interval);
					const error = new Error('Tiempo de espera agotado esperando las bibliotecas');
					console.error(error);
					reject(error);
				}
			}, 100);
		});
	}

	// Inicializar el cartograma
	async function initCartogram() {
		if (!browser) {
			console.error('No estamos en un navegador');
			return;
		}

		try {
			// Asegurarnos de que d3 y topojson estén disponibles
			await waitForLibraries();

			console.log('Inicializando cartograma...');
			// Obtener referencias explícitas a las bibliotecas cargadas
			const d3 = window.d3;
			const topojson = window.topojson;
			
			// Comprobación adicional para d3.geoConicConformalSpain
			if (!d3.geoConicConformalSpain) {
				const err = new Error('La proyección d3.geoConicConformalSpain no está disponible');
				console.error(err);
				error = err.message;
				return;
			}
			
			const processedData = processDataForCartogram();
			
			console.log('Datos procesados:', processedData);
			console.log('Objeto d3:', d3);

			// Comprobar que d3.select está disponible
			if (typeof d3.select !== 'function') {
				console.error('d3.select no es una función!', d3);
				error = 'Error: La función d3.select no está disponible. Posiblemente la biblioteca D3 no se cargó correctamente.';
				return;
			}

			// Obtener el elemento SVG
			try {
				svg = d3.select('#cartogram');
				if (!svg.node()) {
					console.error('No se pudo encontrar el elemento SVG #cartogram');
					error = 'Error: No se pudo encontrar el elemento SVG';
					return;
				}
			} catch (err) {
				console.error('Error al seleccionar SVG:', err);
				error = 'Error al seleccionar el elemento SVG: ' + err.message;
				return;
			}

			// Limpiar SVG
			svg.selectAll('*').remove();

			try {
				// Cargar el mapa TopoJSON de España con las Comunidades Autónomas desde es-atlas
				const response = await fetch('https://unpkg.com/es-atlas@0.6.0/es/autonomous_regions.json');
				const spainMap = await response.json();
				
				if (!spainMap || !spainMap.objects || !spainMap.objects.autonomous_regions) {
					console.error('El archivo de mapa no tiene el formato esperado:', spainMap);
					error = 'Error: El archivo de mapa no tiene el formato correcto';
					return;
				}

				// Crear proyección para España
				const projection = d3.geoConicConformalSpain()
					.scale(2500)
					.translate([width / 2, height / 2]);

				// Crear el path generator
				const path = d3.geoPath().projection(projection);

				// Convertir TopoJSON a GeoJSON
				const regions = topojson.feature(spainMap, spainMap.objects.autonomous_regions);

				// Mapear datos a regiones
				const regionData = new Map();
				
				// Crear un mapa de nombres normalizados a los nombres exactos del dataset
				// Mapeo bidireccional para cubrir ambas direcciones
				const mapToDataNames = {
					'Andalucía': 'Andalucía',
					'Aragón': 'Aragón',
					'Principado de Asturias': 'Asturias, Principado de',
					'Illes Balears': 'Balears, Illes',
					'Canarias': 'Canarias',
					'Cantabria': 'Cantabria',
					'Castilla y León': 'Castilla y León',
					'Castilla-La Mancha': 'Castilla - La Mancha',
					'Cataluña/Catalunya': 'Cataluña',
					'Comunitat Valenciana': 'Comunitat Valenciana',
					'Extremadura': 'Extremadura',
					'Galicia': 'Galicia',
					'Comunidad de Madrid': 'Madrid, Comunidad de',
					'Región de Murcia': 'Murcia, Región de',
					'Comunidad Foral de Navarra': 'Navarra, Comunidad Foral de',
					'País Vasco/Euskadi': 'País Vasco',
					'La Rioja': 'Rioja, La',
					'Ciudad Autónoma de Ceuta': 'Ceuta y Melilla',
					'Ciudad Autónoma de Melilla': 'Ceuta y Melilla'
					// Gibraltar no lo tenemos en los datos
				};
				
				// Mapeo inverso para buscar desde nombres de API a nombres de mapa
				const dataToMapNames = {};
				for (const [mapName, dataName] of Object.entries(mapToDataNames)) {
					dataToMapNames[dataName] = mapName;
				}
				
				// Imprimir nombres de las regiones del mapa para depuración
				console.log("Nombres de regiones en el mapa:", regions.features.map(f => f.properties.name));
				
				// Imprimir nombres de regiones en los datos
				console.log("Nombres de regiones en los datos:", processedData.map(d => d.name));
				
				// Hacer la asignación entre datos y regiones
				processedData.forEach(d => {
					// Añadir directamente con el nombre original
					regionData.set(d.name, d);
					
					// Intentar encontrar el nombre del mapa correspondiente
					const mapName = dataToMapNames[d.name];
					if (mapName) {
						regionData.set(mapName, d);
						console.log(`Mapeado ${d.name} a ${mapName}`);
					} else {
						console.log(`No se encontró correspondencia para ${d.name}`);
					}
				});
				
				// Crear grupo para el mapa
				const mapGroup = svg.append('g').attr('class', 'map-group');

				// Crear el mapa base
				const regionPaths = mapGroup
					.selectAll('path')
					.data(regions.features)
					.enter()
					.append('path')
					.attr('d', path)
					.attr('class', 'region')
					.attr('fill', d => {
						const regionName = d.properties.name;
						// Intentar obtener los datos directamente
						let data = regionData.get(regionName);
						
						if (data) {
							// Escala de color basada en el valor
							const colorScale = d3.scaleLinear()
								.domain([0, d3.max(processedData, d => d.value)])
								.range(['#f7fbff', '#08519c']);
							return colorScale(data.value);
						}
						console.log(`No hay datos para la región: ${regionName}`);
						return '#ccc';
					})
					.attr('stroke', '#fff')
					.attr('stroke-width', 0.5);

				// Añadir bordes de proyección
				mapGroup.append('path')
					.attr('d', projection.getCompositionBorders())
					.attr('fill', 'none')
					.attr('stroke', '#888')
					.attr('stroke-width', 0.5)
					.attr('stroke-dasharray', '2,2');

				// Crear centroide para cada región
				const centroids = regions.features.map(d => {
					const centroid = path.centroid(d);
					const regionName = d.properties.name;

					// Intentar obtener los datos directamente
					let data = regionData.get(regionName);

					return {
						x: centroid[0],
						y: centroid[1],
						r: data ? Math.sqrt(data.value) / 10 : 5,
						name: regionName,
						originalName: data ? data.name : null,
						data: data
					};
				});

				// Simulación para el cartograma
				const simulation = d3.forceSimulation(centroids)
					.force('x', d3.forceX(d => d.x).strength(0.1))
					.force('y', d3.forceY(d => d.y).strength(0.1))
					.force('collide', d3.forceCollide(d => d.r + 2).strength(0.7))
					.stop();
				
				// Ejecutar la simulación
				for (let i = 0; i < 300; ++i) simulation.tick();

				// Crear círculos para el cartograma
				const circles = mapGroup.selectAll('circle')
					.data(centroids)
					.enter()
					.append('circle')
					.attr('cx', d => d.x)
					.attr('cy', d => d.y)
					.attr('r', d => d.r)
					.attr('fill', d => {
						if (d.data) {
							const colorScale = d3.scaleLinear()
								.domain([0, d3.max(processedData, d => d.value)])
								.range(['#f7fbff', '#08519c']);
							return colorScale(d.data.value);
						}
						return '#ccc';
					})
					.attr('stroke', '#fff')
					.attr('stroke-width', 0.5)
					.attr('opacity', 0)
					.on('mouseover', function(event, d) {
						if (d.data) {
							d3.select('#tooltip')
								.style('display', 'block')
								.style('left', (event.pageX + 10) + 'px')
								.style('top', (event.pageY + 10) + 'px')
								.html(`
									<strong>${d.name}</strong>
									${d.originalName && d.originalName !== d.name ? `<br><em>(${d.originalName})</em>` : ''}
									<br>
									<strong>Año:</strong> ${d.data.year}<br>
									<strong>Solicitudes:</strong> ${d.data.request.toLocaleString('es-ES')}<br>
									<strong>Población:</strong> ${d.data.population.toLocaleString('es-ES')}<br>
									<strong>Población Dependiente:</strong> ${d.data.dependent_population.toLocaleString('es-ES')}
								`);
						} else {
							d3.select('#tooltip')
								.style('display', 'block')
								.style('left', (event.pageX + 10) + 'px')
								.style('top', (event.pageY + 10) + 'px')
								.html(`
									<strong>${d.name}</strong><br>
									<em>No hay datos disponibles</em>
								`);
						}
					})
					.on('mouseout', function() {
						d3.select('#tooltip').style('display', 'none');
					});

				// Añadir etiquetas de texto
				const labels = mapGroup.selectAll('text')
					.data(centroids)
					.enter()
					.append('text')
					.attr('x', d => d.x)
					.attr('y', d => d.y)
					.attr('dy', '0.3em')
					.attr('text-anchor', 'middle')
					.attr('font-size', d => Math.min(d.r * 0.5, 10))
					.attr('fill', '#fff')
					.attr('pointer-events', 'none')
					.attr('opacity', 0)
					.text(d => d.name.substring(0, 3));

				// Botón para alternar entre mapa y cartograma
				const buttonGroup = svg.append('g')
					.attr('transform', `translate(${width - 180}, 20)`);

				buttonGroup.append('rect')
					.attr('width', 160)
					.attr('height', 40)
					.attr('rx', 5)
					.attr('fill', '#f0f0f0')
					.attr('stroke', '#ccc');

				buttonGroup.append('text')
					.attr('x', 80)
					.attr('y', 25)
					.attr('text-anchor', 'middle')
					.attr('font-size', 14)
					.text('Cambiar a cartograma');

				// Variable para controlar el estado
				let showCartogram = false;

				// Añadir evento de clic para alternar
				buttonGroup.on('click', function() {
					showCartogram = !showCartogram;
					
					buttonGroup.select('text')
						.text(showCartogram ? 'Cambiar a mapa' : 'Cambiar a cartograma');
					
					if (showCartogram) {
						// Transición al cartograma
						regionPaths.transition()
							.duration(1000)
							.attr('opacity', 0);
						
						circles.transition()
							.duration(1000)
							.attr('opacity', 1);
						
						labels.transition()
							.duration(1000)
							.attr('opacity', 1);
					} else {
						// Transición al mapa
						regionPaths.transition()
							.duration(1000)
							.attr('opacity', 1);
						
						circles.transition()
							.duration(1000)
							.attr('opacity', 0);
						
						labels.transition()
							.duration(1000)
							.attr('opacity', 0);
					}
				});

				// Agregar tooltip para regiones
				regionPaths
					.on('mouseover', function(event, d) {
						const regionName = d.properties.name;
						// Intentar obtener los datos directamente
						let data = regionData.get(regionName);
						
						if (data) {
							// Crear tooltip
							d3.select('#tooltip')
								.style('display', 'block')
								.style('left', (event.pageX + 10) + 'px')
								.style('top', (event.pageY + 10) + 'px')
								.html(`
									<strong>${regionName}</strong>
									${data.name && data.name !== regionName ? `<br><em>(${data.name})</em>` : ''}
									<br>
									<strong>Año:</strong> ${data.year}<br>
									<strong>Solicitudes:</strong> ${data.request.toLocaleString('es-ES')}<br>
									<strong>Población:</strong> ${data.population.toLocaleString('es-ES')}<br>
									<strong>Población Dependiente:</strong> ${data.dependent_population.toLocaleString('es-ES')}
								`);
						} else {
							// Mostrar tooltip con mensaje de que no hay datos
							d3.select('#tooltip')
								.style('display', 'block')
								.style('left', (event.pageX + 10) + 'px')
								.style('top', (event.pageY + 10) + 'px')
								.html(`
									<strong>${regionName}</strong><br>
									<em>No hay datos disponibles</em>
								`);
						}
					})
					.on('mouseout', function() {
						d3.select('#tooltip').style('display', 'none');
					});
				
			} catch (err) {
				console.error('Error al cargar el mapa:', err);
				error = 'Error al cargar el mapa de España: ' + err.message;
			}
		} catch (err) {
			console.error('Error en initCartogram:', err);
			error = `Error en el cartograma: ${err.message}`;
		}
	}

	onMount(async () => {
		try {
			console.log('Iniciando carga de datos...');
			await fetchData();
			console.log('Datos cargados correctamente:', autonomyData);

			console.log('Esperando a que las bibliotecas estén disponibles...');
			await waitForLibraries();
			console.log('Todas las bibliotecas cargadas correctamente');
			
			// Verificar que D3 se ha cargado correctamente
			if (browser) {
				console.log('Verificando D3:', window.d3);
				if (!window.d3 || typeof window.d3.select !== 'function') {
					console.error('D3 no está disponible o no tiene la función select');
					error = 'Error: D3 no se cargó correctamente';
					return;
				}
				
				// Verificar que d3.geoConicConformalSpain está disponible
				if (!window.d3.geoConicConformalSpain) {
					console.error('La proyección d3.geoConicConformalSpain no está disponible');
					error = 'Error: La proyección d3.geoConicConformalSpain no está disponible';
					return;
				}
			}

			// Iniciar el cartograma después de cargar las bibliotecas
			console.log('Iniciando renderizado del cartograma...');
			initCartogram();
		} catch (err) {
			console.error('Error en la inicialización:', err);
			error = `Error al inicializar la aplicación: ${err.message}`;
		}
	});
</script>

<svelte:head>
	<title>Cartograma de Aplicaciones de Dependencia por Comunidades Autónomas</title>
	<!-- Cargar D3 y bibliotecas relacionadas directamente en el head -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
	<script src="https://unpkg.com/d3-composite-projections@1.4.0"></script>
</svelte:head>

<main class="container">
	<h1>Cartograma de Aplicaciones de Dependencia por Comunidades Autónomas</h1>
	<h2>
		Tamaño proporcional a {selectedVariable === 'request'
			? 'Solicitudes'
			: selectedVariable === 'population'
				? 'Población Total'
				: 'Población Dependiente'}
	</h2>

	{#if isLoading}
		<p>Cargando datos...</p>
	{:else if error}
		<p class="error">Error: {error}</p>
	{:else}
		<div class="controls">
			<div class="control-group">
				<label for="variable">Mostrar por:</label>
				<select id="variable" value={selectedVariable} on:change={handleVariableChange}>
					<option value="request">Solicitudes</option>
					<option value="population">Población Total</option>
					<option value="dependent_population">Población Dependiente</option>
				</select>
			</div>
		</div>

		<div class="map-container">
			<svg id="cartogram" {width} {height}></svg>
			<div id="tooltip" class="tooltip"></div>
		</div>

		<div class="legend">
			<p>
				El tamaño de cada comunidad autónoma es proporcional al valor de <strong
					>{selectedVariable === 'request'
						? 'Solicitudes'
						: selectedVariable === 'population'
							? 'Población Total'
							: 'Población Dependiente'}</strong
				>.
			</p>
			<p>Los colores indican la intensidad del valor seleccionado.</p>
		</div>
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

	.map-container {
		position: relative;
		margin: 0 auto;
		text-align: center;
	}

	.tooltip {
		position: absolute;
		display: none;
		background-color: rgba(255, 255, 255, 0.9);
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 10px;
		font-size: 12px;
		pointer-events: none;
		z-index: 1000;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.controls {
		margin-bottom: 20px;
		text-align: center;
	}

	.control-group {
		display: inline-block;
		margin-right: 20px;
	}

	.control-group label {
		margin-right: 5px;
		font-weight: bold;
	}

	.control-group select {
		padding: 5px;
		border-radius: 3px;
		border: 1px solid #ccc;
	}

	.legend {
		margin-top: 20px;
		text-align: center;
		font-style: italic;
		color: #666;
	}

	.error {
		color: red;
		font-weight: bold;
		text-align: center;
	}

	.region {
		transition: fill 0.3s;
	}

	.region:hover {
		stroke: #333;
		stroke-width: 1.5;
		cursor: pointer;
	}
</style>