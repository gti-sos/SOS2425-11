<script>
	let searchTerm = '';
	let searchResults = [];
	let isLoading = false;
	let error = null;

	async function searchImages() {
		if (!searchTerm.trim()) {
			searchResults = [];
			error = 'Por favor, introduce un término de búsqueda.';
			return;
		}

		isLoading = true;
		error = null;
		searchResults = []; // Limpiar resultados anteriores

		try {
			const response = await fetch(
				`https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=image`
			);
			if (!response.ok) {
				throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
			}
			const data = await response.json();

			if (data.collection && data.collection.items) {
				searchResults = data.collection.items.filter(
					(item) => item.links && item.links.length > 0 && item.data && item.data.length > 0
				);
				if (searchResults.length === 0) {
					error = 'No se encontraron imágenes para tu búsqueda.';
				}
			} else {
				searchResults = [];
				error = 'No se encontraron imágenes o el formato de la respuesta no es el esperado.';
			}
		} catch (err) {
			console.error('Error al buscar imágenes:', err);
			error = err.message || 'Ocurrió un error al buscar las imágenes.';
			searchResults = [];
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Buscador de Imágenes NASA</title>
</svelte:head>

<div class="container">
	<h1>Buscador de Imágenes de la NASA</h1>

	<div class="search-form">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="Ej: Apollo 11, Mars Rover..."
			on:keypress={(e) => e.key === 'Enter' && searchImages()}
		/>
		<button on:click={searchImages} disabled={isLoading}>
			{isLoading ? 'Buscando...' : 'Buscar'}
		</button>
	</div>

	{#if error}
		<p class="error-message">{error}</p>
	{/if}

	{#if isLoading && searchResults.length === 0 && !error}
		<p>Cargando...</p>
	{/if}

	<div class="results-grid">
		{#each searchResults as item (item.data[0].nasa_id)}
			<div class="result-item">
				{#if item.links && item.links.find((link) => link.rel === 'preview')}
					<img
						src={item.links.find((link) => link.rel === 'preview').href}
						alt={item.data[0].title}
						loading="lazy"
					/>
				{/if}
				<h3>{item.data[0].title || 'Título no disponible'}</h3>
				<p>
					{item.data[0].description_508 || item.data[0].description || 'Descripción no disponible'}
				</p>
				{#if item.data[0].date_created}
					<small>Fecha: {new Date(item.data[0].date_created).toLocaleDateString()}</small>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 1rem;
		font-family: sans-serif;
		color: #333;
	}

	h1 {
		text-align: center;
		color: #0b3d91; /* NASA Blue */
		margin-bottom: 2rem;
	}

	.search-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.search-form input[type='text'] {
		flex-grow: 1;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.search-form button {
		padding: 0.75rem 1.5rem;
		background-color: #0b3d91; /* NASA Blue */
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.search-form button:hover {
		background-color: #002266; /* Darker NASA Blue */
	}

	.search-form button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		text-align: center;
	}

	.result-item {
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 1rem;
		background-color: #f9f9f9;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
		display: flex;
		flex-direction: column;
	}

	.result-item:hover {
		transform: translateY(-5px);
	}

	.result-item img {
		width: 100%;
		height: auto;
		max-height: 200px; /* Limitar altura para uniformidad */
		object-fit: cover; /* Asegurar que la imagen cubra el área sin distorsionarse */
		border-radius: 4px;
		margin-bottom: 0.75rem;
	}

	.result-item h3 {
		font-size: 1.1rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
		color: #333;
		flex-grow: 1; /* Para que el título empuje la descripción y fecha hacia abajo */
	}

	.result-item p {
		font-size: 0.9rem;
		color: #666;
		line-height: 1.4;
		margin-bottom: 0.5rem;
		/* Limitar descripción a X líneas */
		display: -webkit-box;
		-webkit-line-clamp: 3; /* Número de líneas a mostrar */
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		min-height: calc(0.9rem * 1.4 * 3); /* Altura mínima para 3 líneas */
	}

	.result-item small {
		font-size: 0.8rem;
		color: #888;
		margin-top: auto; /* Empujar la fecha al final del contenedor */
	}

	.error-message {
		color: #d9534f; /* Bootstrap danger color */
		background-color: #f2dede;
		border: 1px solid #ebccd1;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		text-align: center;
	}
</style>
