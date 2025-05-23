<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Importar goto para la navegación
	import { page } from '$app/stores'; // Importar store de página para leer query params

	// URL de la API actualizada
	const API_URL = '/api/v1/management-evolutions';

	let resources = [];
	let isLoading = true;
	let apiError = null; // Para errores generales de carga o conexión
	let successMessage = null; // Para mensajes de éxito de operaciones
	let errorMessage = null; // Para errores específicos de operaciones (Crear, Borrar, Editar)

	// Estado para el formulario de creación actualizado
	let newResource = {
		year: null,
		place: '',
		age: null,
		legal_residence: null,
		economical_resource: null,
		incompatible_benefit: null
	};

	// Estado para los filtros de búsqueda actualizado
	let searchFilters = {
		year: null, // Búsqueda exacta por año
		place: '',
		ageOver: null,
		ageUnder: null,
		legal_residenceOver: null,
		legal_residenceUnder: null,
		economical_resourceOver: null,
		economical_resourceUnder: null,
		incompatible_benefitOver: null,
		incompatible_benefitUnder: null
	};
	// Datos de ejemplo actualizados con la estructura real
	/*const exampleResources = [
            {
                year: 2024,
                place: "Sevilla (Ejemplo)", 
                age: 279, 
                legal_residence: 127, 
                economical_resource: 1927, 
                incompatible_benefit: 7 
            },
            { 
                year: 2023, 
                place: "Teruel (Ejemplo)", 
                age: 15, 
                legal_residence: 33, 
                economical_resource: 74, 
                incompatible_benefit: 0
            }
        ];
        */

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
							'No se encontraron registros que coincidan con tu búsqueda. Se muestran datos de ejemplo.';
						resources = exampleResources;
					}
					console.warn(`API returned 404 for ${API_URL}${searchParams}`);
				} else {
					// Otro tipo de error HTTP
					apiError = `Error al cargar: Problema de comunicación con el servidor (Código: ${response.status}). Se muestran datos de ejemplo.`;
					console.error(`HTTP Error ${response.status}: ${response.statusText}`);
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
			// Error de red o al procesar la respuesta
			apiError =
				'Error al cargar los datos: No se pudo conectar con el servidor o procesar la respuesta. Se muestran datos de ejemplo.';
			console.error('Fetch error:', err);
			resources = exampleResources;
		} finally {
			isLoading = false;
		}
	}

	    async function handleLoadInitialData() {
        errorMessage = null;
        successMessage = null;
        apiError = null; // Limpia también el error general de la API
        isLoading = true; // Indica que se está cargando

        try {
            // Realiza la llamada al endpoint de carga inicial.
            // Según tus tests de Newman, es una petición GET y espera un 201.
            const response = await fetch(`${API_URL}/loadInitialData`, {
                method: 'GET' // O 'POST' si el backend está configurado para esperar POST
            });

            // Manejo de la respuesta del servidor
            // 201 Created (según tus tests exitosos de Newman) o 200 OK son respuestas de éxito esperadas.
            if (response.status === 201 || response.status === 200) {
                successMessage = 'Datos iniciales cargados correctamente.'; // Mensaje de éxito
                // Importante: Recargar los recursos para mostrar los datos recién añadidos
                // Pasamos 'undefined' para no aplicar filtros y 'true' para preservar el mensaje de éxito actual.
                await fetchResources(undefined, true);
            } else if (response.status === 409) {
                // Si el endpoint devuelve 409 Conflict, significa que los datos ya existen
                errorMessage = 'Error al cargar: Los datos iniciales ya existen o ya han sido cargados.';
            } else {
                // Cualquier otro código de estado inesperado del servidor
                errorMessage = `Error al cargar datos iniciales: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
                console.error(`Load Initial Data Error ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            // Manejo de errores de red (servidor no accesible, problema de conexión, etc.)
            errorMessage =
                'Error al cargar datos iniciales: Ocurrió un problema de conexión. Inténtalo de nuevo más tarde.';
            console.error('Load Initial Data Fetch error:', err); // Loguea el error técnico en la consola
        } finally {
            // Finaliza el estado de carga, pero solo si NO se estableció un mensaje de éxito.
            // Si hubo éxito, fetchResources ya manejará la carga y su finalización.
            if (!successMessage) {
                isLoading = false;
            }
        }
    }


	async function handleCreate(event) {
		event.preventDefault(); // Prevenir recarga de página por defecto del form
		errorMessage = null;
		successMessage = null;
		isLoading = true;
		try {
			// Convertir a números o null
			const payload = {
				...newResource,
				year: parseInt(newResource.year) || null,
				age: parseInt(newResource.age) || null,
				legal_residence: parseInt(newResource.legal_residence) || null,
				economical_resource: parseInt(newResource.economical_resource) || null,
				incompatible_benefit: parseInt(newResource.incompatible_benefit) || null
			};

			// Validar que los campos requeridos no sean null después de la conversión
			if (
				!payload.place ||
				payload.year === null ||
				payload.age === null ||
				payload.legal_residence === null ||
				payload.economical_resource === null ||
				payload.incompatible_benefit === null
			) {
				errorMessage =
					'Error al añadir: Por favor, asegúrate de que todos los campos estén completos y sean correctos.';
				isLoading = false;
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
				successMessage = 'El registro se ha añadido correctamente.'; // Set message FIRST
				// Limpiar formulario
				newResource = {
					year: null,
					place: '',
					age: null,
					incompatible_benefit: null,
					economical_resource: null,
					legal_residence: null
				};
				await fetchResources(undefined, true); // Recargar la lista, PRESERVING the message
			} else if (response.status === 400) {
				errorMessage =
					'Error al añadir: Los datos proporcionados no son válidos. Por favor, revísalos.';
				console.error('Error 400 - Bad Request:', await response.text());
			} else if (response.status === 409) {
				errorMessage =
					'Error al añadir: Ya existe un registro para esa Comunidad Autónoma y ese año.';
			} else {
				errorMessage = `Error al añadir: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
				console.error(`Error ${response.status}: ${response.statusText}`);
			}
		} catch (err) {
			errorMessage =
				'Error al añadir: Ocurrió un problema de conexión al intentar guardar el registro. Inténtalo de nuevo más tarde.';
			console.error('Create error:', err);
		} finally {
			// Only set isLoading to false if no success message was set,
			// otherwise fetchResources will handle it after reloading.
			// This prevents the create button from being briefly re-enabled before reload starts.
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
					// 200 OK is also common for DELETE
					successMessage = `El registro de ${place} (${year}) se ha borrado correctamente.`; // Set message FIRST
					await fetchResources(undefined, true); // Recargar la lista, PRESERVING the message
				} else if (response.status === 404) {
					errorMessage = 'Error al borrar: No se pudo encontrar el registro que intentas eliminar.';
				} else {
					errorMessage = `Error al borrar: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
					console.error(`Error ${response.status}: ${response.statusText}`);
				}
			} catch (err) {
				errorMessage =
					'Error al borrar: Ocurrió un problema de conexión al intentar eliminar el registro. Inténtalo de nuevo más tarde.';
				console.log('Delete error:', err);
			} finally {
				// Only set isLoading to false if no success message was set.
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
				}).catch((err) => {
					console.error('Network error during DELETE request:', err);
					throw err; // Re-throw to handle it in the catch block
				});
				if (response.status === 204 || response.status === 200) {
					successMessage = 'Todos los registros se han borrado correctamente.'; // Set message FIRST
					await fetchResources(undefined, true); // Recargar la lista, PRESERVING the message
				} else if (response.status === 404) {
					// Consider this informational rather than an error.
					successMessage = 'No había registros para borrar.';
					await fetchResources(); // Fetch again to show empty state correctly
				} else {
					errorMessage = `Error al borrar todo: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
					console.error(`Error ${response.status}: ${response.statusText}`);
				}
				console.error('Delete All error:', err);
				alert('Error: Unable to connect to the server. Please check your network or API endpoint.');
				errorMessage =
					'Error al borrar todo: Ocurrió un problema de conexión al intentar eliminar todos los registros. Inténtalo de nuevo más tarde.';
				console.log('Delete All error:', err);
			} finally {
				// Only set isLoading to false if no success message was set.
				if (!successMessage) {
					isLoading = false;
				}
			}
		}
	}

	// Navega a la página de edición
	function handleEdit(place, year) {
		// Clear messages before navigating away
		successMessage = null;
		errorMessage = null;
		apiError = null;
		goto(`/MTP/edit/${encodeURIComponent(place)}/${year}`);
	}

	// --- Funciones de Búsqueda ---
	function handleSearch() {
		// Clear previous messages when starting a new search
		errorMessage = null;
		successMessage = null;
		apiError = null;

		const params = new URLSearchParams();

		// Añadir parámetros solo si tienen valor
		if (searchFilters.year) params.set('year', searchFilters.year);
		if (searchFilters.place) params.set('place', searchFilters.place.trim());
		if (searchFilters.ageOver) params.set('ageOver', searchFilters.ageOver);
		if (searchFilters.ageUnder) params.set('ageUnder', searchFilters.ageUnder);
		if (searchFilters.legal_residenceOver)
			params.set('legal_residenceOver', searchFilters.legal_residenceOver);
		if (searchFilters.legal_residenceUnder)
			params.set('legal_residenceUnder', searchFilters.legal_residenceUnder);
		if (searchFilters.economical_resourceOver)
			params.set('economical_resourceOver', searchFilters.economical_resourceOver);
		if (searchFilters.economical_resourceUnder)
			params.set('economical_resourceUnder', searchFilters.economical_resourceUnder);
		if (searchFilters.incompatible_benefitOver)
			params.set('incompatible_benefitOver', searchFilters.incompatible_benefitOver);
		if (searchFilters.incompatible_benefitUnder)
			params.set('incompatible_benefitUnder', searchFilters.incompatible_benefitUnder);

		const queryString = params.toString() ? `?${params.toString()}` : '';
		console.log(`Buscando con query: ${queryString}`);
		fetchResources(queryString); // Don't preserve messages on manual search
	}

	function clearSearch() {
		// Resetear todos los filtros
		searchFilters = {
			year: null,
			place: '',
			ageOver: null,
			ageUnder: null,
			legal_residenceOver: null,
			legal_residenceUnder: null,
			economical_resourceOver: null,
			economical_resourceUnder: null,
			incompatible_benefitOver: null,
			incompatible_benefitUnder: null
		};
		// Clear messages when clearing search
		errorMessage = null;
		successMessage = null;
		apiError = null;
		fetchResources(); // Cargar todos los recursos
	}

	// Cargar los recursos iniciales y chequear mensajes de query params
	onMount(() => {
		let messageSetFromUrl = false;
		// Check for messages passed via query parameters (e.g., after edit)
		const urlParams = $page.url.searchParams;
		const messageCode = urlParams.get('message');
		const placeParam = urlParams.get('place');
		const yearParam = urlParams.get('year');

		if (messageCode === 'edit_success' && placeParam && yearParam) {
			successMessage = `El registro de ${decodeURIComponent(placeParam)} (${yearParam}) se ha actualizado correctamente.`;
			messageSetFromUrl = true;
		} else if (messageCode === 'edit_error') {
			errorMessage = `Hubo un error al intentar actualizar el registro de ${decodeURIComponent(placeParam)} (${yearParam}).`;
			messageSetFromUrl = true;
		}

		// Clean the URL query parameters if a message was processed
		if (messageSetFromUrl) {
			const cleanUrl = $page.url.pathname; // Get path without query string
			// Use replaceState to avoid adding to browser history
			history.replaceState(history.state, '', cleanUrl);
		}

		// Fetch initial data, preserving the message if it was just set from the URL
		fetchResources('', messageSetFromUrl);
	});
</script>

<svelte:head>
	<title>MTP Data</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 p-4 md:p-8">
	<div class="container mx-auto max-w-7xl">
		<h1 class="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-800">
			Gestión de Ayudas Sociales
		</h1>

		<!-- Mensajes de Feedback -->
		{#if successMessage}
			<div
				class="relative mb-6 rounded-lg border-l-4 border-green-600 bg-green-100 p-4 text-green-800 shadow-md"
				role="alert"
			>
				<strong class="font-bold">Éxito:</strong>
				<span class="block sm:inline">{successMessage}</span>
				<button
					on:click={() => (successMessage = null)}
					class="absolute top-2 right-2 text-green-800 hover:text-green-900"
					aria-label="Cerrar mensaje"
				>
					&times;
				</button>
			</div>
		{/if}
		{#if errorMessage}
			<div
				class="relative mb-6 rounded-lg border-l-4 border-red-600 bg-red-100 p-4 text-red-800 shadow-md"
				role="alert"
			>
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline">{errorMessage}</span>
				<button
					on:click={() => (errorMessage = null)}
					class="absolute top-2 right-2 text-red-800 hover:text-red-900"
					aria-label="Cerrar mensaje"
				>
					&times;
				</button>
			</div>
		{/if}
		{#if apiError}
			<div
				class="relative mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 text-yellow-800 shadow-md"
				role="alert"
			>
				<strong class="font-bold">Aviso:</strong>
				<span class="block sm:inline">{apiError}</span>
				<button
					on:click={() => (apiError = null)}
					class="absolute top-2 right-2 text-yellow-800 hover:text-yellow-900"
					aria-label="Cerrar mensaje"
				>
					&times;
				</button>
			</div>
		{/if}

		<!-- Formulario de Creación -->
		<form
			on:submit={handleCreate}
			class="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl"
		>
			<h2 class="mb-5 text-2xl font-semibold text-gray-700">Añadir Nuevo Registro</h2>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<div>
					<label for="place" class="block text-sm font-medium text-gray-600"
						>Comunidad Autónoma</label
					>
					<input
						type="text"
						id="place"
						bind:value={newResource.place}
						required
						class="input-style mt-1 block w-full"
						placeholder="Ej: Andalucía"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="year" class="block text-sm font-medium text-gray-600">Año</label>
					<input
						type="number"
						id="year"
						bind:value={newResource.year}
						required
						placeholder="YYYY"
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="age" class="block text-sm font-medium text-gray-600"
						>Rechazados por: Edad</label
					>
					<input
						type="number"
						step="0.01"
						id="age"
						bind:value={newResource.age}
						required
						class="input-style mt-1 block w-full"
						placeholder="Ej: 500"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="legal_residence" class="block text-sm font-medium text-gray-600"
						>Rechazados por: Lugar de Residencia</label
					>
					<input
						type="number"
						step="0.01"
						id="legal_residence"
						bind:value={newResource.legal_residence}
						required
						class="input-style mt-1 block w-full"
						placeholder="Ej: 310000000.00"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="economical_resource" class="block text-sm font-medium text-gray-600"
						>Rechazados por: Renta</label
					>
					<input
						type="number"
						id="economical_resource"
						bind:value={newResource.economical_resource}
						required
						class="input-style mt-1 block w-full"
						placeholder="Ej: 56000"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="incompatible_benefit" class="block text-sm font-medium text-gray-600"
						>Rechazados por: Incompatibilidad de Subvenciones</label
					>
					<input
						type="number"
						id="incompatible_benefit"
						bind:value={newResource.incompatible_benefit}
						required
						class="input-style mt-1 block w-full"
						placeholder="Ej: 37000"
						disabled={isLoading}
					/>
				</div>
				<!-- Contenedor de botones: uno a la izquierda, otro a la derecha -->
				<div class="flex items-end justify-between md:col-span-3">
					<!-- Cambiado a justify-between y quitado gap-4 -->

					<!-- Botón Cargar Registros (Aparece primero = IZQUIERDA) -->
					<button
						type="button"
						class="transform rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						on:click={handleLoadInitialData}
						disabled={isLoading}
						title="Cargar los datos iniciales"
					>
						{#if isLoading && !successMessage && !errorMessage && !apiError}
							<svg
								class="mr-2 inline h-4 w-4 animate-spin text-white"
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
							Cargando...
						{:else}
							Cargar Registros
						{/if}
					</button>

					<!-- Botón Crear Registro (Aparece segundo = DERECHA) -->
					<button
						type="submit"
						class="transform rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						disabled={isLoading}
					>
						{#if isLoading && !successMessage && !errorMessage && !apiError}
							<svg
								class="mr-2 inline h-4 w-4 animate-spin text-white"
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
							Crear Registro
						{/if}
					</button>
				</div>
			</div>
		</form>

		<!-- Sección de Búsqueda y Controles -->
		<div
			class="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl"
		>
			<h2 class="mb-5 text-2xl font-semibold text-gray-700">Buscar y Filtrar Registros</h2>
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				<!-- Filtro Place -->
				<div>
					<label for="search_place" class="block text-sm font-medium text-gray-600"
						>Comunidad Autónoma</label
					>
					<select
						id="search_place"
						bind:value={searchFilters.place}
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					>
						<option value="">-- Todas --</option>
						{#each [...new Set(resources.map((r) => r.place))].sort() as place}
							<option value={place}>{place}</option>
						{/each}
					</select>
				</div>
				<!-- Filtro Year -->
				<div>
					<label for="search_year" class="block text-sm font-medium text-gray-600"
						>Año (Exacto)</label
					>
					<select
						id="search_year"
						bind:value={searchFilters.year}
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					>
						<option value={null}>-- Todos --</option>
						{#each [...new Set(resources.map((r) => r.year))].sort((a, b) => a - b) as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>
				<!-- Filtro From Year -->
				<div>
					<label for="search_from" class="block text-sm font-medium text-gray-600">Desde Año</label>
					<input
						type="number"
						id="search_from"
						bind:value={searchFilters.from}
						placeholder="YYYY"
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					/>
				</div>
				<!-- Filtro To Year -->
				<div>
					<label for="search_to" class="block text-sm font-medium text-gray-600">Hasta Año</label>
					<input
						type="number"
						id="search_to"
						bind:value={searchFilters.to}
						placeholder="YYYY"
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					/>
				</div>
				<!-- Filtro Importe Jubilación -->
				<fieldset class="rounded-md border border-gray-300 p-3">
					<legend class="px-1 text-sm font-medium text-gray-600">Edad</legend>
					<div class="flex gap-2">
						<input
							type="number"
							step="0.01"
							bind:value={searchFilters.ageOver}
							class="input-style block w-full"
							placeholder="Mín."
							disabled={isLoading}
						/>
						<input
							type="number"
							step="0.01"
							bind:value={searchFilters.ageUnder}
							class="input-style block w-full"
							placeholder="Máx."
							disabled={isLoading}
						/>
					</div>
				</fieldset>
				<!-- Filtro Importe Invalidez -->
				<fieldset class="rounded-md border border-gray-300 p-3">
					<legend class="px-1 text-sm font-medium text-gray-600">Lugar de Residencia</legend>
					<div class="flex gap-2">
						<input
							type="number"
							step="0.01"
							bind:value={searchFilters.legal_residenceOver}
							class="input-style block w-full"
							placeholder="Mín."
							disabled={isLoading}
						/>
						<input
							type="number"
							step="0.01"
							bind:value={searchFilters.legal_residenceUnder}
							class="input-style block w-full"
							placeholder="Máx."
							disabled={isLoading}
						/>
					</div>
				</fieldset>
				<!-- Filtro Nº Pensiones Jubilación -->
				<fieldset class="rounded-md border border-gray-300 p-3">
					<legend class="px-1 text-sm font-medium text-gray-600">Renta</legend>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={searchFilters.economical_resourceOver}
							class="input-style block w-full"
							placeholder="Mín."
							disabled={isLoading}
						/>
						<input
							type="number"
							bind:value={searchFilters.economical_resourceUnder}
							class="input-style block w-full"
							placeholder="Máx."
							disabled={isLoading}
						/>
					</div>
				</fieldset>
				<!-- Filtro Nº Pensiones Invalidez -->
				<fieldset class="rounded-md border border-gray-300 p-3">
					<legend class="px-1 text-sm font-medium text-gray-600"
						>Incompatibilidad de Subvenciones</legend
					>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={searchFilters.incompatible_benefitOver}
							class="input-style block w-full"
							placeholder="Mín."
							disabled={isLoading}
						/>
						<input
							type="number"
							bind:value={searchFilters.incompatible_benefitUnder}
							class="input-style block w-full"
							placeholder="Máx."
							disabled={isLoading}
						/>
					</div>
				</fieldset>

				<!-- Botones de Búsqueda -->
				<div
					class="flex flex-col items-stretch gap-3 sm:col-span-2 md:col-span-3 lg:col-span-4 lg:flex-row lg:items-end lg:justify-start"
				>
					<button
						class="transform rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						on:click={handleSearch}
						disabled={isLoading}
					>
						Buscar
					</button>
					<button
						class="transform rounded-lg bg-gray-500 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						on:click={clearSearch}
						disabled={isLoading}
						title="Limpiar búsqueda y mostrar todos"
					>
						Limpiar Filtros
					</button>
					<button
						class="ml-auto transform rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-red-600 hover:to-rose-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 lg:ml-auto"
						on:click={handleDeleteAll}
						disabled={isLoading}
					>
						Borrar Todos
					</button>
				</div>
			</div>
		</div>

		{#if isLoading && !apiError && !errorMessage && !successMessage}
			<!-- Show general loading indicator only when no other message is present -->
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
				Cargando registros...
			</div>
		{/if}

		<!-- Tabla de Recursos -->
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gradient-to-r from-gray-100 to-gray-200">
						<tr>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Comunidad Autónoma</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Año</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Edad</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Lugar de Residencia</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Renta</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Incompatibilidad de Subvenciones</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-center text-xs font-semibold tracking-wider text-gray-700 uppercase"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each resources as resource (resource.place + resource.year)}
							<tr class="transition duration-150 ease-in-out hover:bg-blue-50">
								<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
									>{resource.place}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600"> {resource.year}</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600"
									>{resource.age?.toLocaleString('es-ES') || '-'}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600"
									>{resource.legal_residence?.toLocaleString('es-ES') || '-'}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600"
									>{resource.economical_resource?.toLocaleString('es-ES') || '-'}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600"
									>{resource.incompatible_benefit?.toLocaleString('es-ES') || '-'}</td
								>
								<td class="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
									<button
										class="mr-2 transform rounded-md bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow transition duration-150 ease-in-out hover:scale-110 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50"
										on:click={() => handleEdit(resource.place, resource.year)}
										disabled={isLoading}
										title="Editar {resource.place} ({resource.year})"
									>
										Editar
									</button>
									<button
										class="transform rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white shadow transition duration-150 ease-in-out hover:scale-110 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50"
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
								<td colspan="7" class="px-6 py-10 text-center text-gray-500">
									{#if !isLoading && !apiError && !successMessage && !errorMessage}
										<!-- Show this only if not loading and no other messages are displayed -->
										No hay registros para mostrar. Puede añadir nuevos registros o buscar con otros criterios.
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</main>

<style>
	/* Estilos reutilizados para inputs y selects */
	.input-style {
		border-radius: 0.375rem; /* rounded-md */
		border-width: 1px;
		border-color: #d1d5db; /* border-gray-300 */
		padding: 0.5rem 0.75rem; /* py-2 px-3 */
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
		font-size: 0.875rem; /* text-sm */
		line-height: 1.25rem;
		transition:
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
		appearance: none; /* Remove default styling for select */
		background-color: white;
	}
	.input-style:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: #6366f1; /* focus:border-indigo-500 */
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3); /* focus:ring-indigo-500 focus:ring-opacity-50 */
	}
	/* Add dropdown arrow for selects using this style */
	select.input-style {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem; /* Make space for the arrow */
	}
	td {
		text-align: center;
	}
	/* Style disabled state */
	.input-style:disabled,
	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.input-style:disabled {
		background-color: #f3f4f6; /* bg-gray-100 */
	}
	button:disabled {
		transform: none !important; /* Disable hover scale effect */
	}

	/* Improve fieldset legend styling */
	fieldset {
		transition: border-color 0.2s ease-in-out;
	}
	fieldset:focus-within {
		border-color: #6366f1; /* Highlight fieldset when child input is focused */
	}
	legend {
		color: #4b5563; /* gray-600 */
	}
</style>
