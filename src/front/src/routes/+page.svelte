<script>
	import { goto } from '$app/navigation';
	import Header from './Header.svelte';
</script>

<Header />

<div class="hero">
	<h1>Bienvenidos al Grupo 11</h1>
	<p>
		Somos estudiantes de la asignatura <strong>Servicios Orientados a Servicios</strong>
		de la titulación <strong>Ingeniería Informática TI</strong>. Nuestro objetivo es aprender y
		desarrollar soluciones innovadoras basadas en servicios.
	</p>
	<p>Este proyecto es una muestra de nuestro esfuerzo, dedicación y pasión por la tecnología.</p>
	<a class="cta-button" href="/about" on:click|preventDefault={() => goto('/about')}>
		Conócenos más
	</a>
</div>

<style>
	.hero {
		text-align: center;
		padding: 2rem;
		background: linear-gradient(135deg, #4facfe, #00f2fe);
		color: white;
		border-radius: 8px;
		margin: 2rem auto;
		max-width: 800px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.hero h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.hero p {
		font-size: 1.2rem;
		line-height: 1.6;
	}

	.cta-button {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 0.8rem 1.5rem;
		font-size: 1rem;
		color: white;
		background-color: #0078d4;
		border: none;
		border-radius: 4px;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.cta-button:hover {
		background-color: #005a9e;
	}
</style>
