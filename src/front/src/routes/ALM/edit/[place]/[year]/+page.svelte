<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores'; // Para acceder a los parámetros de la ruta
	import { goto } from '$app/navigation';

	const API_URL = '/api/v1/autonomy-dependence-applications';

	let resource = null;
	let isLoading = true;
	let errorMessage = null;
	let successMessage = null;

	let place = $page.params.place;
	let year = $page.params.year;

	async function fetchResource() {
		isLoading = true;
		errorMessage = null;
		try {
			const response = await fetch(`${API_URL}/${encodeURIComponent(place)}/${year}`);
			if (!response.ok) {
				if (response.status === 404) {
					errorMessage = `No se encontró ningún registro para ${decodeURIComponent(place)} en el año ${year}.`;
					console.warn(`Resource not found for ${place}/${year}`);
				} else {
					const errorText = await response.text();
					errorMessage = `Error al cargar el registro: Problema de comunicación con el servidor (Código: ${response.status}).`;
					console.error(
						`HTTP Error ${response.status}: ${response.statusText}. Body: ${errorText}`
					);
				}
				resource = {}; // Poner un objeto vacío para evitar errores en el binding del form
			} else {
				resource = await response.json();
				// Asegurarse de que los campos numéricos son números si vienen como string
				resource.year = parseInt(resource.year);
				resource.population = parseInt(resource.population);
				resource.dependent_population = parseInt(resource.dependent_population);
				resource.request = parseInt(resource.request);
			}
		} catch (err) {
			errorMessage = `Error al cargar el registro: No se pudo conectar con el servidor o procesar la respuesta.`;
			console.error('Fetch resource error:', err);
			resource = {}; // Poner un objeto vacío para evitar errores en el binding del form
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdate(event) {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;
		isLoading = true;

		// Asegurar que no se envíen place y year si no deben modificarse (según API)
		const dataToUpdate = { ...resource };
		// Removemos place y year porque la API los toma de la URL y valida contra ellos.
		delete dataToUpdate.place;
		delete dataToUpdate.year;

		// Convertir a números para asegurar el tipo correcto antes de enviar
		dataToUpdate.population = parseInt(dataToUpdate.population) || 0;
		dataToUpdate.dependent_population = parseInt(dataToUpdate.dependent_population) || 0;
		dataToUpdate.request = parseInt(dataToUpdate.request) || 0;

		// Validar que los campos numéricos no sean NaN después de la conversión
		if (
			isNaN(dataToUpdate.population) ||
			isNaN(dataToUpdate.dependent_population) ||
			isNaN(dataToUpdate.request)
		) {
			errorMessage =
				'Error al actualizar: Los campos numéricos (Población, Pob. Dependiente, Solicitudes) deben contener valores válidos.';
			isLoading = false;
			return;
		}

		// Descomentamos y usamos la Lógica PUT real:
		try {
			const response = await fetch(`${API_URL}/${encodeURIComponent(place)}/${year}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				// Enviamos solo los campos modificables
				body: JSON.stringify(dataToUpdate)
			});

			if (response.ok) {
				// O response.status === 200
				successMessage = 'Registro actualizado correctamente.';
				// Esperar un poco para que el usuario vea el mensaje y volver a la lista
				await new Promise((resolve) => setTimeout(resolve, 1500));
				goto('/ALM'); // Volver a la página principal (la lista)
			} else if (response.status === 400) {
				const errorBody = await response.text(); // Leer el cuerpo del error para logging
				errorMessage = `Error al actualizar: Los datos proporcionados no son válidos. Por favor, revísalos.`;
				console.error('Error 400 - Bad Request:', errorBody);
			} else if (response.status === 404) {
				errorMessage =
					'Error al actualizar: El registro no se encontró en el servidor. Puede que haya sido eliminado.';
				console.warn(`PUT request for ${place}/${year} returned 404`);
			} else {
				const errorText = await response.text();
				errorMessage = `Error al actualizar: Problema inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo.`;
				console.error(`Error ${response.status}: ${response.statusText}. Body: ${errorText}`);
			}
		} catch (err) {
			errorMessage = `Error al actualizar: Ocurrió un problema de conexión al intentar guardar los cambios. Inténtalo de nuevo más tarde.`;
			console.error('Update error:', err);
		} finally {
			isLoading = false;
		}
	}

	// Cargar datos al montar el componente
	onMount(fetchResource);
</script>

<svelte:head>
	<title>Editar Registro de Solicitudes - {decodeURIComponent(place)} ({year})</title>
	<meta
		name="description"
		content={`Página para editar el registro de dependencia de ${decodeURIComponent(place)} para el año ${year}.`}
	/>
</svelte:head>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Editar Registro de Solicitudes</h1>
	<h2 class="mb-3 text-xl">{decodeURIComponent(place)} - {year}</h2>

	<!-- Mensajes -->
	{#if successMessage}
		<div
			class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700"
			role="alert"
		>
			{successMessage}
		</div>
	{/if}
	{#if errorMessage}
		<div
			class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<strong class="font-bold">Error:</strong>
			{errorMessage}
			<button
				on:click={() => (errorMessage = null)}
				class="absolute top-0 right-0 bottom-0 px-4 py-3"
				aria-label="Cerrar">&times;</button
			>
		</div>
	{/if}

	{#if isLoading && !resource}
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
			Cargando datos del registro...
		</div>
	{:else if resource && Object.keys(resource).length > 0}
		<form on:submit={handleUpdate} class="rounded border bg-gray-50 p-4">
			<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="population" class="block text-sm font-medium text-gray-700">Población</label>
					<input
						type="number"
						id="population"
						bind:value={resource.population}
						required
						class="input-style mt-1 block w-full"
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
						bind:value={resource.dependent_population}
						required
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					/>
				</div>
				<div>
					<label for="request" class="block text-sm font-medium text-gray-700">Solicitudes</label>
					<input
						type="number"
						id="request"
						bind:value={resource.request}
						required
						class="input-style mt-1 block w-full"
						disabled={isLoading}
					/>
				</div>
				<!-- Mostrar place y year pero no permitir edición si la API no lo soporta -->
				<div
					class="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-100 p-3 md:col-span-2"
				>
					<p class="text-sm">
						<span class="font-medium text-gray-700">Comunidad Autónoma:</span>
						<span class="ml-2 font-semibold text-gray-900"
							>{resource.place || decodeURIComponent(place)}</span
						>
					</p>
					<p class="mt-1 text-sm">
						<span class="font-medium text-gray-700">Año:</span>
						<span class="ml-2 font-semibold text-gray-900">{resource.year || year}</span>
					</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-3 border-t pt-4">
				<a
					href="/ALM"
					class="inline-block rounded bg-gray-500 px-4 py-2 text-center font-bold text-white hover:bg-gray-700"
					>Cancelar</a
				>
				<button
					type="submit"
					class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					disabled={isLoading}
				>
					{#if isLoading}
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
						Guardando...
					{:else}
						Guardar Cambios
					{/if}
				</button>
			</div>
		</form>
	{:else if !isLoading}
		<!-- Show only if not loading and resource is empty or fetch failed -->
		<p class="text-center text-gray-500">No se pudieron cargar los datos del registro.</p>
		<div class="mt-4 text-center">
			<a href="/ALM" class="text-blue-600 hover:underline">Volver a la lista</a>
		</div>
	{/if}
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
