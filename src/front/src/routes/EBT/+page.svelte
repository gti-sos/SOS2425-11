<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation'; // Importar goto para la navegación

    // URL de la API actualizada
    const API_URL = '/api/v1/social-pension-payrolls';

    let resources = [];
    let isLoading = true;
    let apiError = null; // Renombrado para diferenciar de errores de operación
    let successMessage = null;
    let errorMessage = null; // Para errores específicos de operaciones (Crear, Borrar)

    // Estado para el formulario de creación actualizado
    let newResource = {
        place: '',
        year: null,
        retirement_amount: null,
        disability_amount: null,
        retirement_number: null,
        disability_number: null
    };

    // Estado para los filtros de búsqueda actualizado
    let searchFilters = {
        place: '',
        year: null, // Búsqueda exacta por año
		from: null,
		to: null,
        retirement_amountOver: null,
        retirement_amountUnder: null,
        disability_amountOver: null,
        disability_amountUnder: null,
        retirement_numberOver: null,
        retirement_numberUnder: null,
        disability_numberOver: null,
        disability_numberUnder: null
    };

    // Datos de ejemplo actualizados con la estructura real
    const exampleResources = [
        {
            place: 'Andalucía (Ejemplo)',
            year: 2025,
            retirement_amount: 410000000.0,
            disability_amount: 310000000.0,
            retirement_number: 56000,
            disability_number: 37000
        },
        {
            place: 'Cataluña (Ejemplo)',
            year: 2025,
            retirement_amount: 350000000.0,
            disability_amount: 290000000.0,
            retirement_number: 54000,
            disability_number: 38000
        }
    ];

    // --- Funciones de API ---
    async function fetchResources(searchParams = '') {
        isLoading = true;
        apiError = null; // Limpiar error de API anterior
        successMessage = null; // Limpiar mensajes anteriores
        errorMessage = null;
        try {
            const response = await fetch(`${API_URL}${searchParams}`);
            if (!response.ok) {
                if (response.status === 404) {
                    // Si no hay query, y da 404, puede que la BD esté vacía -> redirigir a loadInitialData? No, mejor mostrar mensaje.
                    if (!searchParams) {
                        apiError =
                            'La base de datos parece estar vacía o no se pudo conectar. Mostrando datos de ejemplo.';
                        resources = exampleResources;
                    } else {
                        apiError =
                            'No se encontraron recursos con los criterios de búsqueda especificados. Mostrando datos de ejemplo.';
                        resources = exampleResources;
                    }
                    console.warn(apiError);
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } else {
                const data = await response.json();
                resources = Array.isArray(data) ? data : [data]; // Asegurarse de que siempre sea un array
                if (resources.length === 0 && !searchParams) {
                    apiError =
                        'No hay datos disponibles. Puedes añadir nuevos recursos o cargar datos iniciales si es posible.';
                }
            }
        } catch (err) {
            apiError = `Error al cargar los recursos: ${err.message}. Mostrando datos de ejemplo.`;
            console.error(apiError);
            resources = exampleResources;
        } finally {
            isLoading = false;
        }
    }

    async function handleCreate(event) {
        event.preventDefault(); // Prevenir recarga de página por defecto del form
        errorMessage = null;
        successMessage = null;
        isLoading = true;
        try {
            // Convertir a números o null
            const payload = {
                ...newResource,
                year: parseInt(newResource.year) || null,
                retirement_amount: parseFloat(newResource.retirement_amount) || null,
                disability_amount: parseFloat(newResource.disability_amount) || null,
                retirement_number: parseInt(newResource.retirement_number) || null,
                disability_number: parseInt(newResource.disability_number) || null
            };

            // Validar que los campos requeridos no sean null después de la conversión
            if (
                !payload.place ||
                payload.year === null ||
                payload.retirement_amount === null ||
                payload.disability_amount === null ||
                payload.retirement_number === null ||
                payload.disability_number === null
            ) {
                errorMessage = 'Error al crear: Todos los campos son obligatorios y deben ser válidos.';
                isLoading = false;
                return;
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 201) {
                successMessage = 'Recurso creado correctamente.';
                // Limpiar formulario
                newResource = {
                    place: '',
                    year: null,
                    retirement_amount: null,
                    disability_amount: null,
                    retirement_number: null,
                    disability_number: null
                };
                await fetchResources(); // Recargar la lista
            } else if (response.status === 400) {
                const errorData = await response.json();
                errorMessage = `Error al crear: ${errorData.error || 'Datos inválidos o faltantes.'}`;
                console.error('Error 400:', errorData);
            } else if (response.status === 409) {
                errorMessage = 'Error al crear: El recurso (Comunidad y Año) ya existe.';
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            errorMessage = `Error al crear el recurso: ${err.message}`;
            console.error(errorMessage);
        } finally {
            isLoading = false;
        }
    }

    async function handleDelete(place, year) {
        errorMessage = null;
        successMessage = null;
        if (
            window.confirm(
                `¿Estás seguro de que quieres borrar el registro de ${place} para el año ${year}?`
            )
        ) {
            isLoading = true;
            try {
                const response = await fetch(`${API_URL}/${encodeURIComponent(place)}/${year}`, {
                    method: 'DELETE'
                });
                if (response.status === 204) {
                    successMessage = `Recurso de ${place} (${year}) borrado correctamente.`;
                    await fetchResources(); // Recargar la lista
                } else if (response.status === 404) {
                    errorMessage = 'Error al borrar: El recurso no fue encontrado.';
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } catch (err) {
                errorMessage = `Error al borrar el recurso: ${err.message}`;
                console.error(errorMessage);
            } finally {
                isLoading = false;
            }
        }
    }

    async function handleDeleteAll() {
        errorMessage = null;
        successMessage = null;
        if (
            window.confirm(
                '¿Estás seguro de que quieres borrar TODOS los recursos? Esta acción no se puede deshacer.'
            )
        ) {
            isLoading = true;
            try {
                const response = await fetch(API_URL, {
                    method: 'DELETE'
                });
                if (response.status === 204) {
                    successMessage = 'Todos los recursos han sido borrados correctamente.';
                    await fetchResources(); // Recargar la lista (debería estar vacía)
                } else {
                    // La API devuelve 404 si no hay nada que borrar, tratarlo como éxito parcial?
                    if (response.status === 404) {
                        errorMessage = 'No se encontraron recursos para borrar.';
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                }
            } catch (err) {
                errorMessage = `Error al borrar todos los recursos: ${err.message}`;
                console.error(errorMessage);
            } finally {
                isLoading = false;
            }
        }
    }

    function handleEdit(place, year) {
        // Navegar a la página de edición (asumiendo que existe una ruta /EBT/edit/...)
        goto(`/EBT/edit/${encodeURIComponent(place)}/${year}`);
    }

    // --- Funciones de Búsqueda ---
    function handleSearch() {
        errorMessage = null;
        successMessage = null;

        const params = new URLSearchParams();

        // Añadir parámetros solo si tienen valor
        if (searchFilters.place) params.set('place', searchFilters.place.trim());
        if (searchFilters.year) params.set('year', searchFilters.year);
        if (searchFilters.retirement_amountOver)
            params.set('retirement_amountOver', searchFilters.retirement_amountOver);
        if (searchFilters.retirement_amountUnder)
            params.set('retirement_amountUnder', searchFilters.retirement_amountUnder);
        if (searchFilters.disability_amountOver)
            params.set('disability_amountOver', searchFilters.disability_amountOver);
        if (searchFilters.disability_amountUnder)
            params.set('disability_amountUnder', searchFilters.disability_amountUnder);
        if (searchFilters.retirement_numberOver)
            params.set('retirement_numberOver', searchFilters.retirement_numberOver);
        if (searchFilters.retirement_numberUnder)
            params.set('retirement_numberUnder', searchFilters.retirement_numberUnder);
        if (searchFilters.disability_numberOver)
            params.set('disability_numberOver', searchFilters.disability_numberOver);
        if (searchFilters.disability_numberUnder)
            params.set('disability_numberUnder', searchFilters.disability_numberUnder);
		if (searchFilters.from) params.set('from', searchFilters.from);
		if (searchFilters.to) params.set('to', searchFilters.to);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        console.log(`Buscando con query: ${queryString}`);
        fetchResources(queryString);
    }

    function clearSearch() {
        // Resetear todos los filtros
        searchFilters = {
            place: '',
            year: null,
            retirement_amountOver: null,
			from: null,
			to: null,
            retirement_amountUnder: null,
            disability_amountOver: null,
            disability_amountUnder: null,
            retirement_numberOver: null,
            retirement_numberUnder: null,
            disability_numberOver: null,
            disability_numberUnder: null
        };
        errorMessage = null; // Limpiar mensajes
        successMessage = null;
        fetchResources(); // Cargar todos los recursos
    }

    // Cargar los recursos iniciales cuando el componente se monta
    onMount(() => fetchResources());
</script>
<main class="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 p-4 md:p-8">
    <div class="container mx-auto max-w-7xl">
        <h1 class="mb-6 text-center text-4xl font-extrabold text-gray-800 tracking-tight">
            Gestión de Nóminas de Pensiones Sociales
        </h1>

        <!-- Mensajes de Feedback -->
        {#if successMessage}
            <div
                class="relative mb-6 rounded-lg border-l-4 border-green-600 bg-green-100 p-4 text-green-800 shadow-md"
                role="alert"
            >
                <strong class="font-bold">Éxito:</strong>
                <span class="block sm:inline">{successMessage}</span>
            </div>
        {/if}
        {#if errorMessage}
            <div
                class="relative mb-6 rounded-lg border-l-4 border-red-600 bg-red-100 p-4 text-red-800 shadow-md"
                role="alert"
            >
                <strong class="font-bold">Error:</strong>
                <span class="block sm:inline">{errorMessage}</span>
            </div>
        {/if}
        {#if apiError}
            <div
                class="relative mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 text-yellow-800 shadow-md"
                role="alert"
            >
                <strong class="font-bold">Aviso:</strong>
                <span class="block sm:inline">{apiError}</span>
            </div>
        {/if}

        <!-- Formulario de Creación -->
        <form
            on:submit={handleCreate}
            class="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl"
        >
            <h2 class="mb-5 text-2xl font-semibold text-gray-700">Añadir Nuevo Registro</h2>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                    <label for="place" class="block text-sm font-medium text-gray-600">Comunidad Autónoma</label
                    >
                    <input
                        type="text"
                        id="place"
                        bind:value={newResource.place}
                        required
                        class="input-style mt-1 block w-full"
                        placeholder="Ej: Andalucía"
                    />
                </div>
                <div>
                    <label for="year" class="block text-sm font-medium text-gray-600">Año</label>
                    <input
                        type="number"
                        id="year"
                        bind:value={newResource.year}
                        required
                        placeholder="YYYY"
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <div>
                    <label for="retirement_amount" class="block text-sm font-medium text-gray-600"
                        >Importe Jubilación (€)</label
                    >
                    <input
                        type="number"
                        step="0.01"
                        id="retirement_amount"
                        bind:value={newResource.retirement_amount}
                        required
                        class="input-style mt-1 block w-full"
                        placeholder="Ej: 410000000.00"
                    />
                </div>
                <div>
                    <label for="disability_amount" class="block text-sm font-medium text-gray-600"
                        >Importe Invalidez (€)</label
                    >
                    <input
                        type="number"
                        step="0.01"
                        id="disability_amount"
                        bind:value={newResource.disability_amount}
                        required
                        class="input-style mt-1 block w-full"
                        placeholder="Ej: 310000000.00"
                    />
                </div>
                <div>
                    <label for="retirement_number" class="block text-sm font-medium text-gray-600"
                        >Nº Pensiones Jubilación</label
                    >
                    <input
                        type="number"
                        id="retirement_number"
                        bind:value={newResource.retirement_number}
                        required
                        class="input-style mt-1 block w-full"
                        placeholder="Ej: 56000"
                    />
                </div>
                <div>
                    <label for="disability_number" class="block text-sm font-medium text-gray-600"
                        >Nº Pensiones Invalidez</label
                    >
                    <input
                        type="number"
                        id="disability_number"
                        bind:value={newResource.disability_number}
                        required
                        class="input-style mt-1 block w-full"
                        placeholder="Ej: 37000"
                    />
                </div>
                <div class="flex items-end justify-end md:col-span-3">
                    <button
                        type="submit"
                        class="transform rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <svg
                                class="mr-2 inline h-4 w-4 animate-spin text-white"
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
                            Creando...
                        {:else}
                            Crear Registro
                        {/if}
                    </button>
                </div>
            </div>
        </form>

        <!-- Sección de Búsqueda y Controles -->
        <div
            class="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl"
        >
            <h2 class="mb-5 text-2xl font-semibold text-gray-700">Buscar y Filtrar Registros</h2>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <!-- Filtro Place -->
                <div>
                    <label for="search_place" class="block text-sm font-medium text-gray-600"
                        >Comunidad Autónoma</label
                    >
                    <select
                        id="search_place"
                        bind:value={searchFilters.place}
                        class="input-style mt-1 block w-full"
                    >
                        <option value="">-- Todas --</option>
                        {#each [...new Set(resources.map((r) => r.place))].sort() as place}
                            <option value={place}>{place}</option>
                        {/each}
                    </select>
                </div>
                <!-- Filtro Year -->
                <div>
                    <label for="search_year" class="block text-sm font-medium text-gray-600"
                        >Año (Exacto)</label
                    >
                    <select
                        id="search_year"
                        bind:value={searchFilters.year}
                        class="input-style mt-1 block w-full"
                    >
                        <option value={null}>-- Todos --</option>
                        {#each [...new Set(resources.map((r) => r.year))].sort((a, b) => a - b) as year}
                            <option value={year}>{year}</option>
                        {/each}
                    </select>
                </div>
                <!-- Filtro From Year -->
                <div>
                    <label for="search_from" class="block text-sm font-medium text-gray-600">Desde Año</label>
                    <input
                        type="number"
                        id="search_from"
                        bind:value={searchFilters.from}
                        placeholder="YYYY"
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <!-- Filtro To Year -->
                <div>
                    <label for="search_to" class="block text-sm font-medium text-gray-600">Hasta Año</label>
                    <input
                        type="number"
                        id="search_to"
                        bind:value={searchFilters.to}
                        placeholder="YYYY"
                        class="input-style mt-1 block w-full"
                    />
                </div>
                <!-- Filtro Importe Jubilación -->
                <fieldset class="rounded-md border border-gray-300 p-3">
                    <legend class="px-1 text-sm font-medium text-gray-600">Importe Jubilación (€)</legend>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            step="0.01"
                            bind:value={searchFilters.retirement_amountOver}
                            class="input-style block w-full"
                            placeholder="Mín."
                        />
                        <input
                            type="number"
                            step="0.01"
                            bind:value={searchFilters.retirement_amountUnder}
                            class="input-style block w-full"
                            placeholder="Máx."
                        />
                    </div>
                </fieldset>
                <!-- Filtro Importe Invalidez -->
                <fieldset class="rounded-md border border-gray-300 p-3">
                    <legend class="px-1 text-sm font-medium text-gray-600">Importe Invalidez (€)</legend>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            step="0.01"
                            bind:value={searchFilters.disability_amountOver}
                            class="input-style block w-full"
                            placeholder="Mín."
                        />
                        <input
                            type="number"
                            step="0.01"
                            bind:value={searchFilters.disability_amountUnder}
                            class="input-style block w-full"
                            placeholder="Máx."
                        />
                    </div>
                </fieldset>
                <!-- Filtro Nº Pensiones Jubilación -->
                <fieldset class="rounded-md border border-gray-300 p-3">
                    <legend class="px-1 text-sm font-medium text-gray-600">Nº Pensiones Jubilación</legend>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            bind:value={searchFilters.retirement_numberOver}
                            class="input-style block w-full"
                            placeholder="Mín."
                        />
                        <input
                            type="number"
                            bind:value={searchFilters.retirement_numberUnder}
                            class="input-style block w-full"
                            placeholder="Máx."
                        />
                    </div>
                </fieldset>
                <!-- Filtro Nº Pensiones Invalidez -->
                <fieldset class="rounded-md border border-gray-300 p-3">
                    <legend class="px-1 text-sm font-medium text-gray-600">Nº Pensiones Invalidez</legend>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            bind:value={searchFilters.disability_numberOver}
                            class="input-style block w-full"
                            placeholder="Mín."
                        />
                        <input
                            type="number"
                            bind:value={searchFilters.disability_numberUnder}
                            class="input-style block w-full"
                            placeholder="Máx."
                        />
                    </div>
                </fieldset>

                <!-- Botones de Búsqueda -->
                <div
                    class="flex flex-col items-stretch gap-3 sm:col-span-2 md:col-span-3 lg:col-span-4 lg:flex-row lg:items-end lg:justify-start"
                >
                    <button
                        class="transform rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        on:click={handleSearch}
                        disabled={isLoading}
                    >
                        Buscar
                    </button>
                    <button
                        class="transform rounded-lg bg-gray-500 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                        on:click={clearSearch}
                        disabled={isLoading}
                        title="Limpiar búsqueda y mostrar todos"
                    >
                        Limpiar Filtros
                    </button>
                    <button
                        class="ml-auto transform rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out hover:scale-105 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 lg:ml-auto"
                        on:click={handleDeleteAll}
                        disabled={isLoading}
                    >
                        Borrar Todos
                    </button>
                </div>
            </div>
        </div>

        {#if isLoading && !apiError && !errorMessage && !successMessage}
            <div class="my-8 flex items-center justify-center text-center text-lg text-gray-600">
                <svg
                    class="mr-3 h-6 w-6 animate-spin text-blue-500"
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
                Cargando registros...
            </div>
        {/if}

        <!-- Tabla de Recursos -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gradient-to-r from-gray-100 to-gray-200">
                        <tr>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Comunidad Autónoma</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Año</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Importe Jubilación (€)</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Importe Invalidez (€)</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Nº Pensiones Jubilación</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Nº Pensiones Invalidez</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700"
                                >Acciones</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                        {#each resources as resource (resource.place + resource.year)}
                            <tr class="transition duration-150 ease-in-out hover:bg-blue-50">
                                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
                                    >{resource.place}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{resource.year}</td>
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
                                    >{resource.retirement_amount?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
                                    >{resource.disability_amount?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
                                    >{resource.retirement_number?.toLocaleString('es-ES') || '-'}</td
                                >
                                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
                                    >{resource.disability_number?.toLocaleString('es-ES') || '-'}</td
                                >
                                <td
                                    class="whitespace-nowrap px-6 py-4 text-center text-sm font-medium"
                                >
                                    <button
                                        class="mr-2 transform rounded-md bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow transition duration-150 ease-in-out hover:scale-110 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 disabled:opacity-50"
                                        on:click={() => handleEdit(resource.place, resource.year)}
                                        disabled={isLoading}
                                        title="Editar {resource.place} ({resource.year})"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        class="transform rounded-md bg-red-500 px-3 py-1 text-xs font-bold text-white shadow transition duration-150 ease-in-out hover:scale-110 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                                        on:click={() => handleDelete(resource.place, resource.year)}
                                        disabled={isLoading}
                                        title="Borrar {resource.place} ({resource.year})"
                                    >
                                        Borrar
                                    </button>
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                                    {#if !isLoading}
                                        No hay registros para mostrar. Puede añadir nuevos registros o cargar datos
                                        iniciales si la opción está disponible.
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</main>

<style>
    /* Estilos reutilizados para inputs y selects */
    .input-style {
        border-radius: 0.375rem; /* rounded-md */
        border-width: 1px;
        border-color: #d1d5db; /* border-gray-300 */
        padding: 0.5rem 0.75rem; /* py-2 px-3 */
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        font-size: 0.875rem; /* text-sm */
        line-height: 1.25rem;
        transition:
            border-color 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
        appearance: none; /* Remove default styling for select */
        background-color: white;
    }
    .input-style:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
        border-color: #6366f1; /* focus:border-indigo-500 */
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3); /* focus:ring-indigo-500 focus:ring-opacity-50 */
    }
    /* Add dropdown arrow for selects using this style */
    select.input-style {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem; /* Make space for the arrow */
    }
    /* Style disabled state */
    .input-style:disabled, button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
    button:disabled {
        transform: none !important; /* Disable hover scale effect */
    }

    /* Improve fieldset legend styling */
    fieldset {
        transition: border-color 0.2s ease-in-out;
    }
    fieldset:focus-within {
        border-color: #6366f1; /* Highlight fieldset when child input is focused */
    }
    legend {
        color: #4b5563; /* gray-600 */
    }
</style>