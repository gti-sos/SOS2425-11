<svelte:head>
	<title>Seleccionar Integración</title>
</svelte:head>

<div class="integrations-nav-container">
	<h2>Selecciona una Integración</h2>
	<div class="integrations-options">
		<a href="/integrations/ALM" class="integration-card">
			<h3>Integraciones y Usos de ALM</h3>
			<p>
				Visualiza e interactúa con el conjunto de APIs externas y de distintos compañeros integradas
				por ALM.
			</p>
		</a>
		<a href="/integrations/EBT" class="integration-card">
			<h3>Integraciones y Usos de EBT</h3>
			<p>
				Visualiza e interactúa con el conjunto de APIs externas y de distintos compañeros integradas
				por EBT.
			</p>
		</a>
		<!-- Puedes añadir más tarjetas aquí para futuras integraciones -->
	</div>
</div>

<style>
	.integrations-nav-container {
		padding: 2rem;
		text-align: center;
	}

	.integrations-nav-container h2 {
		margin-bottom: 2rem;
		font-size: 1.8rem;
		color: #333;
	}

	.integrations-options {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap; /* Para que se adapte en pantallas pequeñas */
	}

	.integration-card {
		display: block;
		background-color: #f9f9f9;
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 2rem;
		width: 300px; /* Ancho fijo o min-width/max-width */
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease-in-out,
			box-shadow 0.2s ease-in-out;
	}

	.integration-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.integration-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #0b3d91; /* Un color principal, como el azul NASA que usamos antes */
	}

	.integration-card p {
		font-size: 0.9rem;
		color: #555;
	}
</style>
