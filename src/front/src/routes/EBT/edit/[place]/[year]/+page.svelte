<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores'; // Para acceder a los parámetros de la ruta
    import { goto } from '$app/navigation';

    // Actualizar la URL de la API
    const API_URL = '/api/v1/social-pension-payrolls';

    let resource = null;
    let isLoading = true;
    let errorMessage = null;
    let successMessage = null;

    // Obtener place y year de los parámetros de la ruta
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
            // Asegurarse de que los campos numéricos son números
            resource.year = parseInt(resource.year);
            resource.retirement_amount = parseFloat(resource.retirement_amount);
            resource.disability_amount = parseFloat(resource.disability_amount);
            resource.retirement_number = parseInt(resource.retirement_number);
            resource.disability_number = parseInt(resource.disability_number);
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

        // Crear el objeto con los datos a actualizar
        const dataToUpdate = {
            retirement_amount: parseFloat(resource.retirement_amount) || 0,
            disability_amount: parseFloat(resource.disability_amount) || 0,
            retirement_number: parseInt(resource.retirement_number) || 0,
            disability_number: parseInt(resource.disability_number) || 0
        };

        // Validar que los campos numéricos no sean NaN
        if (
            isNaN(dataToUpdate.retirement_amount) ||
            isNaN(dataToUpdate.disability_amount) ||
            isNaN(dataToUpdate.retirement_number) ||
            isNaN(dataToUpdate.disability_number)
        ) {
            errorMessage = 'Error al actualizar: Todos los campos numéricos deben ser válidos.';
            isLoading = false;
            return;
        }

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
                goto('/EBT'); // Volver a la página de la lista EBT
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
    <h1 class="mb-4 text-2xl font-bold">Editar Nómina de Pensión Social</h1>
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
        </div>
    {/if}

    {#if isLoading && !resource}
        <p>Cargando datos del recurso...</p>
    {:else if resource}
        <form on:submit={handleUpdate} class="rounded border bg-gray-50 p-4">
            <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <!-- Campo Importe Jubilación -->
                <div>
                    <label for="retirement_amount" class="block text-sm font-medium text-gray-700"
                        >Importe Jubilación (€)</label
                    >
                    <input
                        type="number"
                        step="0.01"
                        id="retirement_amount"
                        bind:value={resource.retirement_amount}
                        required
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <!-- Campo Importe Invalidez -->
                <div>
                    <label for="disability_amount" class="block text-sm font-medium text-gray-700"
                        >Importe Invalidez (€)</label
                    >
                    <input
                        type="number"
                        step="0.01"
                        id="disability_amount"
                        bind:value={resource.disability_amount}
                        required
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <!-- Campo Nº Pensiones Jubilación -->
                <div>
                    <label for="retirement_number" class="block text-sm font-medium text-gray-700"
                        >Nº Pensiones Jubilación</label
                    >
                    <input
                        type="number"
                        id="retirement_number"
                        bind:value={resource.retirement_number}
                        required
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <!-- Campo Nº Pensiones Invalidez -->
                <div>
                    <label for="disability_number" class="block text-sm font-medium text-gray-700"
                        >Nº Pensiones Invalidez</label
                    >
                    <input
                        type="number"
                        id="disability_number"
                        bind:value={resource.disability_number}
                        required
                        class="input-style mt-1 block w-full"
                    />
                </div>

                <!-- Mostrar place y year pero no permitir edición -->
                <div class="mt-4 md:col-span-2">
                    <p>
                        <span class="text-sm font-medium text-gray-700">Comunidad Autónoma:</span>
                        <span class="ml-2 text-gray-900">{resource.place || decodeURIComponent(place)}</span>
                    </p>
                    <p class="mt-1">
                        <span class="text-sm font-medium text-gray-700">Año:</span>
                        <span class="ml-2 text-gray-900">{resource.year || year}</span>
                    </p>
                </div>
            </div>

            <div class="mt-4 flex justify-end gap-3">
                <a
                    href="/EBT"
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
    /* Estilos reutilizados para inputs */
    .input-style {
        border-radius: 0.375rem; /* rounded-md */
        border: 1px solid rgb(209 213 219); /* border border-gray-300 */
        padding: 0.5rem 0.75rem; /* px-3 py-2 */
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
        font-size: 0.875rem; /* text-sm */
        line-height: 1.25rem; /* text-sm */
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    .input-style:focus {
        outline: 2px solid transparent; /* focus:outline-none */
        outline-offset: 2px;
        border-color: rgb(99 102 241); /* focus:border-indigo-500 */
        /* Simulate focus:ring-indigo-500 with box-shadow */
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
    }
</style>