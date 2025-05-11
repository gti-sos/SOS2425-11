<script>
	import '../../app.css';
	import Header from '../Header.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const isEmbedded = $derived($page.url.searchParams.get('embedded') === 'true');
</script>

{#if !isEmbedded}
	<Header />
{/if}

{@render children()}

<style>
	/* Estilos globales o específicos del layout que quieras mantener aquí */
	/* Los estilos de las tarjetas se han movido a +page.svelte */
</style>
