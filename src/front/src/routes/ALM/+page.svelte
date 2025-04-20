<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Importar goto para la navegación

	// URL de la API
	const API_URL = '/api/v1/autonomy-dependence-applications';

	let resources = [];
	let isLoading = true;
	let apiError = null; // Para errores generales de carga o conexión
	let successMessage = null; // Para mensajes de éxito de operaciones
	let errorMessage = null; // Para errores específicos de operaciones (Crear, Borrar, Editar)

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
	async function fetchResources(searchParams = '', preserveMessages = false) {
		isLoading = true;
		// Clear general API error unless preserving messages from a previous action
		if (!preserveMessages) {
			apiError = null;
			// Also clear action-specific messages if not preserving
			successMessage = null;
			errorMessage = null;
		} else {
			// If preserving, clear only the general apiError,
			// let success/error messages from actions persist for this render cycle.
			apiError = null;
		}

		try {
			const response = await fetch(`${API_URL}${searchParams}`);
			if (!response.ok) {
				// If fetch fails now, clear any preserved success message
				if (preserveMessages) successMessage = null;
				if (response.status === 404) {
					if (!searchParams) {
						apiError =
							'No se pudieron cargar los datos. Es posible que no haya registros o haya un problema de conexión. Se muestran datos de ejemplo.';
						resources = exampleResources;
					} else {
						apiError =
							'No se encontraron registros que coincidan con tu búsqueda, prueba otra distinta.';
					}
					console.warn(`API returned 404 for ${API_URL}${searchParams}`);
				} else {
					const errorText = await response.text();
					apiError = `Error al cargar: Problema de comunicación con el servidor (Código: ${response.status}). Se muestran datos de ejemplo.`;
					console.error(
						`HTTP Error ${response.status}: ${response.statusText}. Body: ${errorText}`
					);
					resources = exampleResources; // Mostrar ejemplos en caso de error
				}
			} else {
				// If fetch succeeds now, clear any preserved error message
				if (preserveMessages) errorMessage = null;
				const data = await response.json();
				resources = Array.isArray(data) ? data : [data]; // Asegurarse de que siempre sea un array
				if (resources.length === 0 && !searchParams) {
					// Don't overwrite a success/error message if we are preserving it
					if (!preserveMessages) {
						apiError = 'No hay registros disponibles. Puedes empezar añadiendo uno nuevo.';
					}
				} else if (resources.length === 0 && searchParams) {
					// Mensaje específico si la búsqueda no devuelve resultados pero la conexión fue OK
					if (!preserveMessages) {
						apiError = 'No se encontraron registros que coincidan con los filtros aplicados.';
					}
				}
			}
		} catch (err) {
			// If fetch fails due to network/parsing, clear any preserved success message
			if (preserveMessages) successMessage = null;
			apiError = `Error al cargar los datos: No se pudo conectar con el servidor o procesar la respuesta. Se muestran datos de ejemplo.`;
			console.error('Fetch error:', err);
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
			const payload = {
				...newResource,
				// Asegurarse de que los números son números o null si están vacíos
				year: parseInt(newResource.year) || null,
				population: parseInt(newResource.population) || null,
				dependent_population: parseInt(newResource.dependent_population) || null,
				request: parseInt(newResource.request) || null
			};

			// Validar que los campos requeridos no sean null después de la conversión
			if (
				!payload.place ||
				payload.year === null ||
				payload.population === null ||
				payload.dependent_population === null ||
				payload.request === null
			) {
				errorMessage =
					'Error al añadir: Por favor, asegúrate de que todos los campos estén completos y sean correctos.';
				isLoading = false; // Detener aquí
				return;
			}

			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			if (response.status === 201) {
				successMessage = 'Registro añadido correctamente.'; // Establecer mensaje PRIMERO
				// Limpiar formulario
				newResource = {
					place: '',
					year: null,
					population: null,
					dependent_population: null,
					request: null
				};
				await fetchResources('', true); // Recargar la lista, CONSERVANDO el mensaje
			} else if (response.status === 400) {
				const errorBody = await response.text();
				errorMessage =
					'Error al añadir: Los datos proporcionados no son válidos. Por favor, revísalos.';
				console.error('Error 400 - Bad Request:', errorBody);
			} else if (response.status === 409) {
				errorMessage =
					'Error al añadir: Ya existe un registro para esa Comunidad Autónoma y ese año.';
			} else {
				const errorText = await response.text();
				errorMessage = `Error al añadir: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
				console.error(`Error ${response.status}: ${response.statusText}. Body: ${errorText}`);
			}
		} catch (err) {
			errorMessage = `Error al añadir: Ocurrió un problema de conexión al intentar guardar el registro. Inténtalo de nuevo más tarde.`;
			console.error('Create error:', err);
		} finally {
			// Solo poner isLoading a false si no hubo mensaje de éxito,
			// porque fetchResources se encargará si lo hubo.
			if (!successMessage) {
				isLoading = false;
			}
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
				if (response.status === 204 || response.status === 200) {
					// 200 OK también es válido para DELETE
					successMessage = `El registro de ${place} (${year}) se ha borrado correctamente.`; // Establecer mensaje PRIMERO
					await fetchResources('', true); // Recargar la lista, CONSERVANDO el mensaje
				} else if (response.status === 404) {
					errorMessage = 'Error al borrar: No se pudo encontrar el registro que intentas eliminar.';
					console.warn(`DELETE request for ${place}/${year} returned 404`);
				} else {
					const errorText = await response.text();
					errorMessage = `Error al borrar: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
					console.error(`Error ${response.status}: ${response.statusText}. Body: ${errorText}`);
				}
			} catch (err) {
				errorMessage = `Error al borrar: Ocurrió un problema de conexión al intentar eliminar el registro. Inténtalo de nuevo más tarde.`;
				console.error('Delete error:', err);
			} finally {
				// Solo poner isLoading a false si no hubo mensaje de éxito.
				if (!successMessage) {
					isLoading = false;
				}
			}
		}
	}

	async function handleDeleteAll() {
		errorMessage = null;
		successMessage = null;
		if (
			window.confirm(
				'¿Estás seguro de que quieres borrar TODOS los registros? Esta acción no se puede deshacer.'
			)
		) {
			isLoading = true;
			try {
				const response = await fetch(API_URL, {
					method: 'DELETE'
				});
				if (response.status === 204 || response.status === 200) {
					successMessage = 'Todos los registros se han borrado correctamente.'; // Establecer mensaje PRIMERO
					await fetchResources('', true); // Recargar la lista, CONSERVANDO el mensaje
				} else if (response.status === 404) {
					// Considerar esto informativo, no un error.
					successMessage = 'No había registros para borrar.';
					await fetchResources('', true); // Recargar para mostrar estado vacío correctamente, conservando mensaje
				} else {
					const errorText = await response.text();
					errorMessage = `Error al borrar todo: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
					console.error(`Error ${response.status}: ${response.statusText}. Body: ${errorText}`);
				}
			} catch (err) {
				errorMessage = `Error al borrar todo: Ocurrió un problema de conexión al intentar eliminar todos los registros. Inténtalo de nuevo más tarde.`;
				console.error('Delete All error:', err);
			} finally {
				// Solo poner isLoading a false si no hubo mensaje de éxito.
				if (!successMessage) {
					isLoading = false;
				}
			}
		}
	}

	// Navega a la página de edición
	function handleEdit(place, year) {
		// Limpiar mensajes antes de navegar
		successMessage = null;
		errorMessage = null;
		apiError = null;
		goto(`/ALM/edit/${encodeURIComponent(place)}/${year}`);
	}

	// --- Funciones de Búsqueda ---
	function handleSearch() {
		// Limpiar mensajes al iniciar una nueva búsqueda
		errorMessage = null;
		successMessage = null;
		apiError = null;

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
		fetchResources(queryString); // No preservar mensajes en búsqueda manual
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
		// Limpiar mensajes al limpiar búsqueda
		errorMessage = null;
		successMessage = null;
		apiError = null;
		fetchResources(); // Cargar todos los recursos
	}

	// Cargar los recursos iniciales cuando el componente se monta
	onMount(() => fetchResources());
</script>

<svelte:head>
	<title>Solicitudes de Dependencia por Autonomía</title>
	<meta
		name="description"
		content="Gestión de datos sobre solicitudes de dependencia por Comunidad Autónoma y año."
	/>
</svelte:head>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Solicitudes de Dependencia por Autonomía</h1>

	<!-- Mensajes de Feedback -->
	{#if successMessage}
		<div
			class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700"
			role="alert"
		>
			<span class="block sm:inline">{successMessage}</span>
			<button
				on:click={() => (successMessage = null)}
				class="absolute top-0 right-0 bottom-0 px-4 py-3"
				aria-label="Cerrar">&times;</button
			>
		</div>
	{/if}
	{#if errorMessage}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{errorMessage}</span>
			<button
				on:click={() => (errorMessage = null)}
				class="absolute top-0 right-0 bottom-0 px-4 py-3"
				aria-label="Cerrar">&times;</button
			>
		</div>
	{/if}
	{#if apiError}
		<div
			class="relative mb-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700"
			role="alert"
		>
			<strong class="font-bold">Aviso:</strong>
			<span class="block sm:inline">{apiError}</span>
			<button
				on:click={() => (apiError = null)}
				class="absolute top-0 right-0 bottom-0 px-4 py-3"
				aria-label="Cerrar">&times;</button
			>
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
					disabled={isLoading}
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
					disabled={isLoading}
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
					disabled={isLoading}
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
					disabled={isLoading}
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
					disabled={isLoading}
				/>
			</div>
			<div class="flex items-end justify-end md:col-span-3">
				<button
					type="submit"
					class="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
					disabled={isLoading}
				>
					{#if isLoading && !successMessage && !errorMessage && !apiError}
						<svg
							class="mr-2 -ml-1 inline h-4 w-4 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
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
					disabled={isLoading}
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
					disabled={isLoading}
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
						disabled={isLoading}
					/>
					<input
						type="number"
						bind:value={searchFilters.populationUnder}
						class="input-style block w-full"
						placeholder="Máx."
						disabled={isLoading}
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
						disabled={isLoading}
					/>
					<input
						type="number"
						bind:value={searchFilters.dependentPopulationUnder}
						class="input-style block w-full"
						placeholder="Máx."
						disabled={isLoading}
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
						disabled={isLoading}
					/>
					<input
						type="number"
						bind:value={searchFilters.requestUnder}
						class="input-style block w-full"
						placeholder="Máx."
						disabled={isLoading}
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
		<div class="my-8 flex items-center justify-center text-center text-lg text-gray-600">
			<svg
				class="mr-3 h-6 w-6 animate-spin text-blue-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			Cargando recursos...
		</div>
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
							{#if !isLoading && !apiError && !successMessage && !errorMessage}
								<!-- Mostrar solo si no está cargando y no hay otros mensajes -->
								No hay registros para mostrar. Puede añadir nuevos o buscar con otros criterios.
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
	.input-style {
		border-radius: 0.375rem; /* rounded-md */
		border: 1px solid #d1d5db; /* border-gray-300 */
		padding: 0.5rem 0.75rem; /* px-3 py-2 */
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
		font-size: 0.875rem; /* text-sm */
	}
	.input-style:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: #6366f1; /* focus:border-indigo-500 */
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3); /* focus:ring-indigo-500 focus:ring-opacity-50 */
	}
	/* Estilos para estado deshabilitado */
	input:disabled,
	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	input:disabled {
		background-color: #f3f4f6; /* bg-gray-100 */
	}
</style>
