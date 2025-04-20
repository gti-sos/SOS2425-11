<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Importar goto para la navegación

	// URL de la API
	const API_URL = '/api/v1/autonomy-dependence-applications';

	let resources = [];
	let isLoading = true;
	let apiError = null; // Renombrado para diferenciar de errores de operación
	let successMessage = null;
	let errorMessage = null; // Para errores específicos de operaciones (Crear, Borrar)

	// Estado para el formulario de creación
	let newResource = {
		place: '',
		year: null,
		population: null,
		dependent_population: null,
		request: null
	};

	// Estado para los filtros de búsqueda
	let searchFilters = {
		place: '',
		year: null, // Búsqueda exacta por año
		populationOver: null,
		populationUnder: null,
		dependentPopulationOver: null,
		dependentPopulationUnder: null,
		requestOver: null,
		requestUnder: null
	};

	// Datos de ejemplo actualizados con la estructura real
	const exampleResources = [
		{
			place: 'Andalucía (Ejemplo)',
			year: 2025,
			population: 8500000,
			dependent_population: 1000000,
			request: 420000
		},
		{
			place: 'Cataluña (Ejemplo)',
			year: 2025,
			population: 7900000,
			dependent_population: 1040000,
			request: 380000
		}
	];

	// --- Funciones de API ---
	async function fetchResources(searchParams = '') {
		isLoading = true;
		apiError = null; // Limpiar error de API anterior
		successMessage = null; // Limpiar mensajes anteriores
		errorMessage = null;
		try {
			const response = await fetch(`${API_URL}${searchParams}`);
			if (!response.ok) {
				if (response.status === 404) {
					// Si no hay query, y da 404, puede que la BD esté vacía -> redirigir a loadInitialData? No, mejor mostrar mensaje.
					if (!searchParams) {
						apiError =
							'La base de datos parece estar vacía o no se pudo conectar. Mostrando datos de ejemplo.';
						resources = exampleResources;
					} else {
						apiError =
							'No se encontraron recursos con los criterios de búsqueda especificados. Mostrando datos de ejemplo.';
						resources = exampleResources;
					}
					console.warn(apiError);
				} else {
					throw new Error(`Error ${response.status}: ${response.statusText}`);
				}
			} else {
				const data = await response.json();
				resources = Array.isArray(data) ? data : [data]; // Asegurarse de que siempre sea un array
				if (resources.length === 0 && !searchParams) {
					apiError =
						'No hay datos disponibles. Puedes añadir nuevos recursos o cargar datos iniciales si es posible.';
				}
			}
		} catch (err) {
			apiError = `Error al cargar los recursos: ${err.message}. Mostrando datos de ejemplo.`;
			console.error(apiError);
			resources = exampleResources;
		} finally {
			isLoading = false;
		}
	}

	async function handleCreate(event) {
		event.preventDefault(); // Prevenir recarga de página por defecto del form
		errorMessage = null;
		successMessage = null;
		isLoading = true;
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...newResource,
					// Asegurarse de que los números son números
					year: parseInt(newResource.year) || null,
					population: parseInt(newResource.population) || null,
					dependent_population: parseInt(newResource.dependent_population) || null,
					request: parseInt(newResource.request) || null
				})
			});
			if (response.status === 201) {
				successMessage = 'Recurso creado correctamente.';
				// Limpiar formulario
				newResource = {
					place: '',
					year: null,
					population: null,
					dependent_population: null,
					request: null
				};
				await fetchResources(); // Recargar la lista
			} else if (response.status === 400) {
				errorMessage = 'Error al crear: Datos inválidos o faltantes.';
				console.error('Error 400:', await response.text());
			} else if (response.status === 409) {
				errorMessage = 'Error al crear: El recurso (Comunidad y Año) ya existe.';
			} else {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
		} catch (err) {
			errorMessage = `Error al crear el recurso: ${err.message}`;
			console.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete(place, year) {
		errorMessage = null;
		successMessage = null;
		if (
			window.confirm(
				`¿Estás seguro de que quieres borrar el registro de ${place} para el año ${year}?`
			)
		) {
			isLoading = true;
			try {
				const response = await fetch(`${API_URL}/${encodeURIComponent(place)}/${year}`, {
					method: 'DELETE'
				});
				if (response.status === 204) {
					successMessage = `Recurso de ${place} (${year}) borrado correctamente.`;
					await fetchResources(); // Recargar la lista
				} else if (response.status === 404) {
					errorMessage = 'Error al borrar: El recurso no fue encontrado.';
				} else {
					throw new Error(`Error ${response.status}: ${response.statusText}`);
				}
			} catch (err) {
				errorMessage = `Error al borrar el recurso: ${err.message}`;
				console.error(errorMessage);
			} finally {
				isLoading = false;
			}
		}
	}

	async function handleDeleteAll() {
		errorMessage = null;
		successMessage = null;
		if (
			window.confirm(
				'¿Estás seguro de que quieres borrar TODOS los recursos? Esta acción no se puede deshacer.'
			)
		) {
			isLoading = true;
			try {
				const response = await fetch(API_URL, {
					method: 'DELETE'
				});
				if (response.status === 204) {
					successMessage = 'Todos los recursos han sido borrados correctamente.';
					await fetchResources(); // Recargar la lista (debería estar vacía)
				} else {
					// La API devuelve 404 si no hay nada que borrar, tratarlo como éxito parcial?
					if (response.status === 404) {
						errorMessage = 'No se encontraron recursos para borrar.';
					} else {
						throw new Error(`Error ${response.status}: ${response.statusText}`);
					}
				}
			} catch (err) {
				errorMessage = `Error al borrar todos los recursos: ${err.message}`;
				console.error(errorMessage);
			} finally {
				isLoading = false;
			}
		}
	}

	function handleEdit(place, year) {
		// Navegar a la página de edición (asumiendo que existe)
		goto(`/ALM/edit/${encodeURIComponent(place)}/${year}`);
	}

	// --- Funciones de Búsqueda ---
	function handleSearch() {
		errorMessage = null;
		successMessage = null;

		const params = new URLSearchParams();

		// Añadir parámetros solo si tienen valor
		if (searchFilters.place) params.set('place', searchFilters.place.trim());
		if (searchFilters.year) params.set('year', searchFilters.year);
		if (searchFilters.populationOver) params.set('populationOver', searchFilters.populationOver);
		if (searchFilters.populationUnder) params.set('populationUnder', searchFilters.populationUnder);
		if (searchFilters.dependentPopulationOver)
			params.set('dependentPopulationOver', searchFilters.dependentPopulationOver);
		if (searchFilters.dependentPopulationUnder)
			params.set('dependentPopulationUnder', searchFilters.dependentPopulationUnder);
		if (searchFilters.requestOver) params.set('requestOver', searchFilters.requestOver);
		if (searchFilters.requestUnder) params.set('requestUnder', searchFilters.requestUnder);

		const queryString = params.toString() ? `?${params.toString()}` : '';
		console.log(`Buscando con query: ${queryString}`);
		fetchResources(queryString);
	}

	function clearSearch() {
		// Resetear todos los filtros
		searchFilters = {
			place: '',
			year: null,
			populationOver: null,
			populationUnder: null,
			dependentPopulationOver: null,
			dependentPopulationUnder: null,
			requestOver: null,
			requestUnder: null
		};
		errorMessage = null; // Limpiar mensajes
		successMessage = null;
		fetchResources(); // Cargar todos los recursos
	}

	// Cargar los recursos iniciales cuando el componente se monta
	onMount(() => fetchResources());
</script>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Solicitudes de Dependencia por Autonomía</h1>

	<!-- Mensajes de Feedback -->
	{#if successMessage}
		<div
			class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700"
			role="alert"
		>
			<span class="block sm:inline">{successMessage}</span>
		</div>
	{/if}
	{#if errorMessage}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{errorMessage}</span>
		</div>
	{/if}
	{#if apiError}
		<div
			class="relative mb-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700"
			role="alert"
		>
			<strong class="font-bold">Aviso:</strong>
			<span class="block sm:inline">{apiError}</span>
		</div>
	{/if}

	<!-- Formulario de Creación -->
	<form on:submit={handleCreate} class="mb-6 rounded border bg-gray-50 p-4">
		<h2 class="mb-3 text-xl font-semibold">Añadir Nuevo Recurso</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="place" class="block text-sm font-medium text-gray-700">Comunidad Autónoma</label
				>
				<input
					type="text"
					id="place"
					bind:value={newResource.place}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="year" class="block text-sm font-medium text-gray-700">Año</label>
				<input
					type="number"
					id="year"
					bind:value={newResource.year}
					required
					placeholder="YYYY"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="population" class="block text-sm font-medium text-gray-700">Población</label>
				<input
					type="number"
					id="population"
					bind:value={newResource.population}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="dependent_population" class="block text-sm font-medium text-gray-700"
					>Población Dependiente</label
				>
				<input
					type="number"
					id="dependent_population"
					bind:value={newResource.dependent_population}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="request" class="block text-sm font-medium text-gray-700">Solicitudes</label>
				<input
					type="number"
					id="request"
					bind:value={newResource.request}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div class="flex items-end justify-end md:col-span-3">
				<button
					type="submit"
					class="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
					disabled={isLoading}
				>
					{#if isLoading}
						Creando...
					{:else}
						Crear Recurso
					{/if}
				</button>
			</div>
		</div>
	</form>

	<!-- Sección de Búsqueda y Controles -->
	<div class="mb-6 rounded border bg-gray-100 p-4">
		<h2 class="mb-3 text-xl font-semibold">Buscar Recursos</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			<!-- Filtro Place -->
			<div>
				<label for="search_place" class="block text-sm font-medium text-gray-700"
					>Comunidad Autónoma</label
				>
				<input
					type="text"
					id="search_place"
					bind:value={searchFilters.place}
					class="input-style mt-1 block w-full"
					placeholder="Ej: Andalucía"
				/>
			</div>
			<!-- Filtro Year -->
			<div>
				<label for="search_year" class="block text-sm font-medium text-gray-700">Año (Exacto)</label
				>
				<input
					type="number"
					id="search_year"
					bind:value={searchFilters.year}
					class="input-style mt-1 block w-full"
					placeholder="Ej: 2024"
				/>
			</div>
			<!-- Filtro Population -->
			<div>
				<label class="block text-sm font-medium text-gray-700">Población</label>
				<div class="mt-1 flex gap-2">
					<input
						type="number"
						bind:value={searchFilters.populationOver}
						class="input-style block w-full"
						placeholder="Mín."
					/>
					<input
						type="number"
						bind:value={searchFilters.populationUnder}
						class="input-style block w-full"
						placeholder="Máx."
					/>
				</div>
			</div>
			<!-- Filtro Dependent Population -->
			<div>
				<label class="block text-sm font-medium text-gray-700">Pob. Dependiente</label>
				<div class="mt-1 flex gap-2">
					<input
						type="number"
						bind:value={searchFilters.dependentPopulationOver}
						class="input-style block w-full"
						placeholder="Mín."
					/>
					<input
						type="number"
						bind:value={searchFilters.dependentPopulationUnder}
						class="input-style block w-full"
						placeholder="Máx."
					/>
				</div>
			</div>
			<!-- Filtro Request -->
			<div>
				<label class="block text-sm font-medium text-gray-700">Solicitudes</label>
				<div class="mt-1 flex gap-2">
					<input
						type="number"
						bind:value={searchFilters.requestOver}
						class="input-style block w-full"
						placeholder="Mín."
					/>
					<input
						type="number"
						bind:value={searchFilters.requestUnder}
						class="input-style block w-full"
						placeholder="Máx."
					/>
				</div>
			</div>

			<!-- Botones de Búsqueda -->
			<div class="flex items-end gap-2 sm:col-span-2 md:col-span-1 lg:col-span-1">
				<button
					class="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					on:click={handleSearch}
					disabled={isLoading}
				>
					Buscar
				</button>
				<button
					class="w-full rounded bg-gray-400 px-4 py-2 font-bold text-white hover:bg-gray-600"
					on:click={clearSearch}
					disabled={isLoading}
					title="Limpiar búsqueda y mostrar todos"
				>
					Limpiar
				</button>
			</div>
		</div>
		<div class="mt-4 flex justify-end">
			<button
				class="ml-auto rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
				on:click={handleDeleteAll}
				disabled={isLoading}
			>
				Borrar Todos los Recursos
			</button>
		</div>
	</div>

	{#if isLoading && !apiError && !errorMessage && !successMessage}
		<p class="my-4 text-center">Cargando recursos...</p>
	{/if}

	<!-- Tabla de Recursos -->
	<div class="overflow-x-auto rounded-lg shadow-md">
		<table class="min-w-full border border-gray-200 bg-white">
			<thead class="bg-gray-100">
				<tr>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Comunidad Autónoma</th
					>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Año</th
					>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Población</th
					>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Población Dependiente</th
					>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Solicitudes</th
					>
					<th
						class="border-b px-4 py-3 text-left text-sm font-semibold tracking-wider text-gray-600 uppercase"
						>Acciones</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each resources as resource (resource.place + resource.year)}
					<tr class="hover:bg-gray-50">
						<td class="border-b px-4 py-3 text-sm text-gray-700">{resource.place}</td>
						<td class="border-b px-4 py-3 text-sm text-gray-700">{resource.year}</td>
						<td class="border-b px-4 py-3 text-sm text-gray-700"
							>{resource.population?.toLocaleString('es-ES') || '-'}</td
						>
						<td class="border-b px-4 py-3 text-sm text-gray-700"
							>{resource.dependent_population?.toLocaleString('es-ES') || '-'}</td
						>
						<td class="border-b px-4 py-3 text-sm text-gray-700"
							>{resource.request?.toLocaleString('es-ES') || '-'}</td
						>
						<td class="border-b px-4 py-3 text-sm whitespace-nowrap text-gray-700">
							<button
								class="mr-1 rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white hover:bg-yellow-700"
								on:click={() => handleEdit(resource.place, resource.year)}
								disabled={isLoading}
								title="Editar {resource.place} ({resource.year})"
							>
								Editar
							</button>
							<button
								class="rounded bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
								on:click={() => handleDelete(resource.place, resource.year)}
								disabled={isLoading}
								title="Borrar {resource.place} ({resource.year})"
							>
								Borrar
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="py-4 px-4 text-center text-gray-500">
							{#if !isLoading}
								No hay recursos para mostrar.
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>

<style>
	/* Estilos reutilizados para inputs */
</style>
