<script>
	import { onMount } from 'svelte';

	// La URL ahora apunta a nuestro endpoint del proxy SvelteKit
	const PROXY_API_URL = '/api/hubspot-proxy/contacts';

	let contacts = [];
	let error = null;
	let isLoading = true;
	// globalUserMessage es un objeto para manejar texto y tipo (para clases CSS)
	let globalUserMessage = { text: '', type: 'info' };

	async function displayUserMessage(message, type = 'success', duration = 3000) {
		globalUserMessage = { text: message, type: type };
		// clase para colorear el mensaje (success/error)
		setTimeout(() => {
			globalUserMessage = { text: '', type: 'info' };
		}, duration);
	}

	async function fetchContacts() {
		isLoading = true;
		error = null;
		try {
			// Ya no se necesita el token aquí, el proxy lo maneja.
			const response = await fetch(PROXY_API_URL, {
				method: 'GET',
				headers: {
					// Ya no se envía 'Authorization' desde el cliente
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errData = await response.json();
				throw new Error(errData.message || `Error ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			contacts = data.results || [];
		} catch (err) {
			console.error('Error fetching contacts via proxy:', err);
			error = err.message;
			contacts = [];
			displayUserMessage(`Error al cargar: ${err.message}`, 'error');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchContacts();
	});

	async function createContact() {
		const firstname = prompt('Nombre del nuevo contacto:');
		if (!firstname) return;
		const lastname = prompt('Apellido del nuevo contacto:');
		if (!lastname) return;
		const email = prompt('Email del nuevo contacto:');
		if (!email) return;

		isLoading = true;
		try {
			const response = await fetch(PROXY_API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ properties: { firstname, lastname, email } })
			});
			const newContact = await response.json();
			if (!response.ok) {
				throw new Error(newContact.message || `Error ${response.status} al crear`);
			}
			contacts = [newContact, ...contacts]; // hace que la UI se actualice inmediatamente con el nuevo contacto que devolvió el servidor
			displayUserMessage('Contacto creado exitosamente!', 'success');
		} catch (err) {
			console.error('Error creating contact:', err);
			displayUserMessage(`Error al crear: ${err.message}`, 'error');
		} finally {
			isLoading = false;
		}
	}

	async function updateContact(contactId) {
		const contactToUpdate = contacts.find((c) => c.id === contactId);
		if (!contactToUpdate) return;

		const newFirstname = prompt('Nuevo nombre:', contactToUpdate.properties.firstname || '');
		if (newFirstname === null) return; // Usuario canceló
		const newLastname = prompt('Nuevo apellido:', contactToUpdate.properties.lastname || '');
		if (newLastname === null) return; // Usuario canceló

		// Solo actualizamos si hay cambios o si el campo estaba vacío y ahora tiene valor
		const properties = {};
		if (newFirstname !== (contactToUpdate.properties.firstname || ''))
			properties.firstname = newFirstname;
		if (newLastname !== (contactToUpdate.properties.lastname || ''))
			properties.lastname = newLastname;

		if (Object.keys(properties).length === 0) {
			displayUserMessage('No se realizaron cambios.', 'info');
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`${PROXY_API_URL}/${contactId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ properties }) // Solo enviamos las propiedades que cambiaron
			});
			const updatedContact = await response.json();
			if (!response.ok) {
				throw new Error(updatedContact.message || `Error ${response.status} al actualizar`);
			}
			// Actualizar la lista local
			contacts = contacts.map((c) => (c.id === contactId ? updatedContact : c));
			displayUserMessage('Contacto actualizado exitosamente!', 'success');
		} catch (err) {
			console.error('Error updating contact:', err);
			displayUserMessage(`Error al actualizar: ${err.message}`, 'error');
		} finally {
			isLoading = false;
		}
	}

	async function deleteContact(contactId) {
		if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

		isLoading = true;
		try {
			const response = await fetch(`${PROXY_API_URL}/${contactId}`, {
				method: 'DELETE'
			});
			// DELETE exitoso no devuelve contenido (204)
			if (!response.ok && response.status !== 204) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(errorData.message || `Error ${response.status} al eliminar`);
			}
			contacts = contacts.filter((c) => c.id !== contactId);
			displayUserMessage('Contacto eliminado exitosamente!', 'success');
		} catch (err) {
			console.error('Error deleting contact:', err);
			displayUserMessage(`Error al eliminar: ${err.message}`, 'error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>HubSpot Contacts Integration</title>
</svelte:head>

<div class="container">
	<h1>Contactos de HubSpot (via Proxy)</h1>

	<!-- Mensaje de usuario con clase dinámica basada en el tipo -->
	{#if globalUserMessage.text}
		<p class="user-message {globalUserMessage.type}">{globalUserMessage.text}</p>
	{/if}

	<div>
		<button on:click={createContact} disabled={isLoading} class="btn-primary">
			{#if isLoading && !contacts.length}Creando...{:else}Crear Nuevo Contacto{/if}
		</button>
	</div>

	{#if isLoading && contacts.length === 0 && !error}
		<p>Cargando contactos...</p>
	{:else if error}
		<p class="user-message error">Error al cargar contactos: {error}</p>
	{:else if contacts.length === 0}
		<p>No se encontraron contactos. ¡Intenta crear uno!</p>
	{:else}
		<ul>
			{#each contacts as contact (contact.id)}
				<li>
					<span>
						{contact.properties.firstname || ''}
						{contact.properties.lastname || ''}
						({contact.properties.email || 'Sin email'})
					</span>
					<div>
						<button
							on:click={() => updateContact(contact.id)}
							disabled={isLoading}
							class="btn-secondary">Actualizar</button
						>
						<button
							on:click={() => deleteContact(contact.id)}
							disabled={isLoading}
							class="btn-danger">Eliminar</button
						>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	:root {
		--hubspot-orange: #ff7a59;
		--hubspot-orange-dark: #e0684b;
		--hubspot-orange-light: #fff0ed;
		--hubspot-text-on-orange: #ffffff;
		--hubspot-text-color: #33475b; /* Un color de texto oscuro de HubSpot */
		--hubspot-secondary-button-bg: #dee5ed;
		--hubspot-secondary-button-text: #33475b;
		--hubspot-secondary-button-hover-bg: #cdd7e1;
		--danger-color: #d92b2b;
		--danger-color-light: #fae9e9;
		--success-color: #00a382; /* Un verde de HubSpot */
		--success-color-light: #e3f4f0;
		--info-color: #7c98b6;
		--info-color-light: #f0f5fa;
		--border-color: #cbd6e2;
	}

	.container {
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		max-width: 800px;
		margin: 2em auto;
		padding: 1.5em;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background-color: #f5f8fa; /* Un fondo claro general */
		color: var(--hubspot-text-color);
	}

	h1 {
		color: var(--hubspot-orange);
		text-align: center;
		margin-bottom: 1em;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.75em 0.5em;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1em;
	}

	li span {
		flex-grow: 1;
	}

	li div {
		display: flex;
		gap: 0.5em;
	}

	li:last-child {
		border-bottom: none;
	}

	button {
		padding: 0.6em 1em;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--hubspot-orange);
		color: var(--hubspot-text-on-orange);
	}
	.btn-primary:hover:not(:disabled) {
		background-color: var(--hubspot-orange-dark);
	}

	.btn-secondary {
		background-color: var(--hubspot-secondary-button-bg);
		color: var(--hubspot-secondary-button-text);
	}
	.btn-secondary:hover:not(:disabled) {
		background-color: var(--hubspot-secondary-button-hover-bg);
	}

	.btn-danger {
		background-color: var(--danger-color);
		color: var(--hubspot-text-on-orange);
	}
	.btn-danger:hover:not(:disabled) {
		background-color: #b82424; /* Darker red */
	}

	.user-message {
		padding: 0.75em 1em;
		margin-bottom: 1em;
		border-radius: 4px;
		border: 1px solid transparent;
	}
	.user-message.success {
		background-color: var(--success-color-light);
		border-color: var(--success-color);
		color: var(--success-color);
	}
	.user-message.error {
		background-color: var(--danger-color-light);
		border-color: var(--danger-color);
		color: var(--danger-color);
	}
	.user-message.info {
		background-color: var(--info-color-light);
		border-color: var(--info-color);
		color: var(--info-color);
	}
</style>
