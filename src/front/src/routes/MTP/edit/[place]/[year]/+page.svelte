<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores'; // Para acceder a los parámetros de la ruta
    import { goto } from '$app/navigation';

    // Actualizar la URL de la API
    const API_URL = '/api/v1/management-evolutions';

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
            resource.age = parseInt(resource.age);
            resource.legal_residence = parseInt(resource.legal_residence);
            resource.economical_resource = parseInt(resource.economical_resource);
            resource.incompatible_benefit = parseInt(resource.incompatible_benefit);
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
            age: parseInt(resource.age) || 0,
            legal_residence: parseInt(resource.legal_residence) || 0,
            economical_resource: parseInt(resource.economical_resource) || 0,
            incompatible_benefit: parseInt(resource.incompatible_benefit) || 0
        };

        // Validar que los campos numéricos no sean NaN
        if (
            isNaN(dataToUpdate.age) ||
            isNaN(dataToUpdate.legal_residence) ||
            isNaN(dataToUpdate.economical_resource) ||
            isNaN(dataToUpdate.incompatible_benefit)
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
                goto('/MTP'); // Volver a la página de la lista MTP
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

<svelte:head>
    <title>Editar Gestión de Pensión - {decodeURIComponent(place)} ({year})</title>
    <meta name="description" content="Página para editar los detalles de una nómina de pensión social específica." />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
    <div class="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <h1 class="mb-2 text-3xl font-bold text-gray-800">Editar Gestión de Ayudas Sociales</h1>
        <h2 class="mb-6 text-xl font-semibold text-indigo-600">
            {decodeURIComponent(place)} - {year}
        </h2>

        <!-- Mensajes -->
        {#if successMessage}
            <div
                class="relative mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700 shadow-sm"
                role="alert"
            >
                <span class="block sm:inline">{successMessage}</span>
            </div>
        {/if}
        {#if errorMessage}
            <div
                class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow-sm"
                role="alert"
            >
                <strong class="font-bold">Error:</strong>
                <span class="block sm:inline">{errorMessage}</span>
            </div>
        {/if}

        {#if isLoading && !resource}
            <div class="flex items-center justify-center py-10">
                <svg
                    class="mr-3 h-8 w-8 animate-spin text-indigo-500"
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
                <p class="text-lg text-gray-600">Cargando datos del recurso...</p>
            </div>
        {:else if resource}
            <form on:submit={handleUpdate} class="space-y-6 rounded-md border border-gray-200 bg-gray-50/50 p-6">
                <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                    <!-- Campo Edad -->
                    <div>
                        <label for="age" class="block text-sm font-medium leading-6 text-gray-900"
                            >Edad</label
                        >
                        <div class="mt-1">
                            <input
                                type="number"
                                step="0.01"
                                id="age"
                                bind:value={resource.age}
                                required
                                class="input-style block w-full"
                                placeholder="Ej: 15000.50"
                            />
                        </div>
                    </div>
                    <!-- Campo Lugar de Residencia -->
                    <div>
                        <label for="legal_residence" class="block text-sm font-medium leading-6 text-gray-900"
                            >Lugar de Residencia</label
                        >
                        <div class="mt-1">
                            <input
                                type="number"
                                step="0.01"
                                id="legal_residence"
                                bind:value={resource.legal_residence}
                                required
                                class="input-style block w-full"
                                placeholder="Ej: 8000.75"
                            />
                        </div>
                    </div>
                    <!-- Campo Renta -->
                    <div>
                        <label for="economical_resource" class="block text-sm font-medium leading-6 text-gray-900"
                            >Renta</label
                        >
                        <div class="mt-1">
                            <input
                                type="number"
                                id="economical_resource"
                                bind:value={resource.economical_resource}
                                required
                                class="input-style block w-full"
                                placeholder="Ej: 1200"
                            />
                        </div>
                    </div>
                    <!-- Campo Incompatibilidad de Subvenciones -->
                    <div>
                        <label for="incompatible_benefit" class="block text-sm font-medium leading-6 text-gray-900"
                            >Incompatibilidad de Subvenciones</label
                        >
                        <div class="mt-1">
                            <input
                                type="number"
                                id="incompatible_benefit"
                                bind:value={resource.incompatible_benefit}
                                required
                                class="input-style block w-full"
                                placeholder="Ej: 350"
                            />
                        </div>
                    </div>

                    <!-- Mostrar place y year pero no permitir edición -->
                    <div class="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-100 p-4 md:col-span-2">
                        <p class="text-sm">
                            <span class="font-medium text-gray-700">Comunidad Autónoma:</span>
                            <span class="ml-2 font-semibold text-gray-900">{resource.place || decodeURIComponent(place)}</span>
                        </p>
                        <p class="mt-1 text-sm">
                            <span class="font-medium text-gray-700">Año:</span>
                            <span class="ml-2 font-semibold text-gray-900">{resource.year || year}</span>
                        </p>
                    </div>
                </div>

                <div class="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-900/10 pt-6">
                    <a
                        href="/MTP"
                        class="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition duration-150 ease-in-out hover:bg-gray-300"
                        >Cancelar</a
                    >
                    <button
                        type="submit"
                        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <div class="flex items-center">
                                <svg
                                    class="-ml-1 mr-2 h-5 w-5 animate-spin text-white"
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
                            </div>
                        {:else}
                            Guardar Cambios
                        {/if}
                    </button>
                </div>
            </form>
        {/if}
    </div>
</main>

<style>
    /* Estilos reutilizados y mejorados para inputs */
    .input-style {
        border-radius: 0.375rem; /* rounded-md */
        border: 1px solid #d1d5db; /* border-gray-300 */
        padding: 0.5rem 0.75rem; /* px-3 py-2 */
        background-color: white;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        font-size: 0.875rem; /* text-sm */
        line-height: 1.25rem;
        color: #111827; /* text-gray-900 */
        transition:
            border-color 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
    }
    .input-style::placeholder {
        color: #9ca3af; /* placeholder-gray-400 */
    }
    .input-style:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
        border-color: #4f46e5; /* focus:border-indigo-600 */
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3); /* focus:ring-indigo-600/30 */
    }
    /* Remove spinners from number inputs */
    .input-style[type='number']::-webkit-inner-spin-button,
    .input-style[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>