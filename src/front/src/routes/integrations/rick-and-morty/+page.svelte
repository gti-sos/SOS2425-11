<script>
	import { onMount } from 'svelte';

	let characters = [];
	let isLoading = true;
	let error = null;
	const RICK_AND_MORTY_API_PROXY_URL = '/api/rickandmorty-proxy/character'; // Ejemplo para obtener personajes

	async function fetchRickAndMortyCharacters() {
		isLoading = true;
		error = null;
		try {
			const response = await fetch(RICK_AND_MORTY_API_PROXY_URL);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(
					`Error al obtener datos de Rick and Morty: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`
				);
			}
			const data = await response.json();
			characters = data.results || []; // La API de Rick and Morty devuelve los personajes en un array 'results'
			console.log('Personajes de Rick and Morty cargados:', characters.length);
		} catch (err) {
			console.error('Error fetching Rick and Morty characters:', err);
			error = err.message;
			characters = [];
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchRickAndMortyCharacters();
	});
</script>

<main>
	<h1>Integración con The Rick and Morty API</h1>

	{#if isLoading}
		<div class="loading">
			<p>Cargando personajes de Rick and Morty...</p>
			<div class="spinner"></div>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button on:click={fetchRickAndMortyCharacters}>Reintentar</button>
		</div>
	{:else if characters.length === 0}
		<p>No se encontraron personajes o la llamada a la API no devolvió resultados.</p>
		<button on:click={fetchRickAndMortyCharacters}>Reintentar Carga</button>
	{:else}
		<div class="info">
			<p>
				Mostrando los primeros {characters.length} personajes obtenidos de
				<a href="https://rickandmortyapi.com/" target="_blank">The Rick and Morty API</a>.
			</p>
			<p>
				Esta integración utiliza un <a href="/api/rickandmorty-proxy/character" target="_blank"
					>endpoint proxy local</a
				> para evitar problemas de CORS y gestionar la comunicación con la API externa.
			</p>
		</div>
		<div class="characters-grid">
			{#each characters as character (character.id)}
				<div class="character-card">
					<img src={character.image} alt={character.name} />
					<h3>{character.name}</h3>
					<p><strong>Especie:</strong> {character.species}</p>
					<p><strong>Estado:</strong> {character.status}</p>
					<p><strong>Origen:</strong> {character.origin?.name || 'Desconocido'}</p>
				</div>
			{/each}
		</div>
	{/if}
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
		border-bottom: 2px solid #4caf50; /* Verde Rick and Morty temático */
		padding-bottom: 1rem;
	}

	.info {
		background-color: #f0f8ff; /* Azul claro AliceBlue */
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border-left: 4px solid #4caf50;
	}

	.info p {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.characters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.character-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		background-color: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease-in-out;
	}

	.character-card:hover {
		transform: translateY(-5px);
	}

	.character-card img {
		width: 100%;
		max-width: 150px;
		height: auto;
		border-radius: 50%;
		margin-bottom: 1rem;
		border: 3px solid #4caf50;
	}

	.character-card h3 {
		margin: 0.5rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.character-card p {
		font-size: 0.9rem;
		color: #555;
		margin: 0.25rem 0;
	}

	.loading,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		text-align: center;
	}

	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #4caf50; /* Verde Rick and Morty temático */
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
		color: #e74c3c;
		padding: 1rem;
		border: 1px solid #e74c3c;
		border-radius: 4px;
	}

	.error button,
	main button {
		background-color: #4caf50;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		margin-top: 1rem;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s ease;
	}

	.error button:hover,
	main button:hover {
		background-color: #388e3c;
	}

	a {
		color: #4caf50;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
