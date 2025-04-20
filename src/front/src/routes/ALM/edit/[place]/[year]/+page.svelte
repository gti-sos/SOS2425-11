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
					throw new Error(`No se encontró el recurso para ${place} (${year}).`);
				} else {
					throw new Error(`Error ${response.status}: ${response.statusText}`);
				}
			}
			resource = await response.json();
			// Asegurarse de que los campos numéricos son números si vienen como string
			resource.year = parseInt(resource.year);
			resource.population = parseInt(resource.population);
			resource.dependent_population = parseInt(resource.dependent_population);
			resource.request = parseInt(resource.request);
		} catch (err) {
			errorMessage = `Error al cargar el recurso: ${err.message}`;
			console.error(errorMessage);
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
				successMessage = 'Recurso actualizado correctamente.';
				// Esperar un poco para que el usuario vea el mensaje y volver a la lista
				await new Promise((resolve) => setTimeout(resolve, 1500));
				goto('/'); // Volver a la página principal (la lista)
			} else if (response.status === 400) {
				const errorBody = await response.text(); // Leer el cuerpo del error
				errorMessage = `Error al actualizar: Datos inválidos o faltantes. ${errorBody}`;
				console.error('Error 400:', errorBody);
			} else if (response.status === 404) {
				errorMessage = 'Error al actualizar: Recurso no encontrado en el servidor.';
			} else {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
		} catch (err) {
			errorMessage = `Error al actualizar el recurso: ${err.message}`;
			console.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	// Cargar datos al montar el componente
	onMount(fetchResource);
</script>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Editar Recurso</h1>
	<h2 class="mb-3 text-xl">{place} - {year}</h2>

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
		</div>
	{/if}

	{#if isLoading && !resource}
		<p>Cargando datos del recurso...</p>
	{:else if resource}
		<form on:submit={handleUpdate} class="rounded border bg-gray-50 p-4">
			<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="population" class="block text-sm font-medium text-gray-700">Población</label>
					<input
						type="number"
						id="population"
						bind:value={resource.population}
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
						bind:value={resource.dependent_population}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="request" class="block text-sm font-medium text-gray-700">Solicitudes</label>
					<input
						type="number"
						id="request"
						bind:value={resource.request}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<!-- Mostrar place y year pero no permitir edición si la API no lo soporta -->
				<div class="mt-4">
					<span class="text-sm font-medium text-gray-700">Comunidad Autónoma:</span>
					<span class="ml-2 text-gray-900">{resource.place || place}</span>
				</div>
				<div class="mt-1">
					<span class="text-sm font-medium text-gray-700">Año:</span>
					<span class="ml-2 text-gray-900">{resource.year || year}</span>
				</div>
			</div>

			<div class="mt-4 flex justify-end gap-3">
				<a
					href="/"
					class="inline-block rounded bg-gray-500 px-4 py-2 text-center font-bold text-white hover:bg-gray-700"
					>Cancelar</a
				>
				<button
					type="submit"
					class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
					disabled={isLoading}
				>
					{#if isLoading}
						Guardando...
					{:else}
						Guardar Cambios
					{/if}
				</button>
			</div>
		</form>
	{/if}
</main>

<style>
	/* Estilos si son necesarios */
</style>
