<script>
	import '../../app.css';
	import Header from '../Header.svelte';

	let { children } = $props();
</script>

<Header />

{@render children()}

<style>
	/* Estilos globales o específicos del layout que quieras mantener aquí */
	/* Los estilos de las tarjetas se han movido a +page.svelte */
</style>
