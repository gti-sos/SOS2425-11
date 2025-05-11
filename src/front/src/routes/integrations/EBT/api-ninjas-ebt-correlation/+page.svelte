<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let plotElement; 

    let traceDataForPlot = null;
    let layoutForPlot = null;

    const PROXY_POPULATION_URL = '/api/population-ninjas-proxy?country=Spain';

    async function fetchDataAndPrepareChartData() {
        if (!browser) { 
            error = "No estamos en el navegador.";
            isLoading = false;
            return;
        }
        isLoading = true;
        error = null;
        traceDataForPlot = null; 
        layoutForPlot = null;

        try {
            const populationResponse = await fetch(PROXY_POPULATION_URL);

            if (!populationResponse.ok) {
                const errText = await populationResponse.text();
                console.error("Proxy response error text:", errText);
                throw new Error(`Error fetching Population (API Ninjas) data: ${populationResponse.status} - ${errText}`);
            }

            const populationApiData = await populationResponse.json();
            console.log("Datos recibidos de API Ninjas (populationApiData):", JSON.stringify(populationApiData, null, 2));

            let actualDataArray = null;

            if (Array.isArray(populationApiData)) {
                actualDataArray = populationApiData;
            } else if (typeof populationApiData === 'object' && populationApiData !== null) {
                for (const key in populationApiData) {
                    if (Object.prototype.hasOwnProperty.call(populationApiData, key) && Array.isArray(populationApiData[key])) {
                        const potentialArray = populationApiData[key];
                        if (potentialArray.length > 0 && 
                            typeof potentialArray[0] === 'object' && 
                            potentialArray[0].hasOwnProperty('year') && 
                            potentialArray[0].hasOwnProperty('population')) {
                            actualDataArray = potentialArray;
                            console.log(`Array de datos encontrado bajo la clave: '${key}'`);
                            break; 
                        } else if (potentialArray.length === 0 && !actualDataArray) {
                            actualDataArray = potentialArray;
                            console.log(`Array vacío encontrado bajo la clave: '${key}'. Se usará este.`);
                        }
                    }
                }
            }

            const years = [];
            const populations = [];

            if (actualDataArray && Array.isArray(actualDataArray)) {
                actualDataArray.sort((a, b) => parseInt(a.year) - parseInt(b.year));
                actualDataArray.forEach(item => {
                    if (item && typeof item === 'object' && item.year != null && item.population != null) {
                        const year = parseInt(item.year);
                        const pop = parseFloat(item.population);
                        if (!isNaN(year) && !isNaN(pop)) {
                            years.push(year);
                            populations.push(pop);
                        } else {
                            console.warn("Item con año/población no numéricos:", item);
                        }
                    } else {
                        console.warn("Item inválido o faltan propiedades year/population:", item);
                    }
                });
            }
            
            if (years.length === 0) {
                console.log("Objeto original 'populationApiData':", JSON.stringify(populationApiData, null, 2));
                console.log("Array que se intentó procesar 'actualDataArray':", JSON.stringify(actualDataArray, null, 2));
                throw new Error("No se encontraron datos de población válidos de API Ninjas (el array 'years' está vacío después del procesamiento).");
            }

            // --- CAMBIO AQUÍ: Definición de la traza para un gráfico de barras ---
            const populationTrace = {
                x: years,
                y: populations,
                name: 'Población España (API Ninjas)',
                type: 'bar' // Cambiado de 'scatter' a 'bar'
                // Ya no necesitamos 'mode: lines+markers' para el tipo 'bar'
            };

            const newLayout = { 
                title: 'Población en España por Año (Datos de API Ninjas)', // Título ligeramente ajustado
                xaxis: { 
                    title: 'Año',
                    type: 'category' // Mantenemos el eje X como categórico para los años
                },
                yaxis: { 
                    title: 'Población Total (Personas)',
                    titlefont: {color: '#1f77b4'},
                    tickfont: {color: '#1f77b4'}
                },
                legend: { x: 0.1, y: 1.1, orientation: 'h' }
            };
            
            traceDataForPlot = [populationTrace]; 
            layoutForPlot = newLayout;

        } catch (errCatch) { 
            console.error("Error en fetchDataAndPrepareChartData:", errCatch);
            error = errCatch.message;
        } finally {
            isLoading = false; 
        }
    }

    onMount(() => {
        if (browser) {
            fetchDataAndPrepareChartData();
        }
    });

    $: if (browser && !isLoading && !error && plotElement && traceDataForPlot && layoutForPlot && typeof Plotly !== 'undefined') {
        console.log("Renderizando gráfico de barras con Plotly...");
        try {
            Plotly.newPlot(plotElement, traceDataForPlot, layoutForPlot);
            console.log("Gráfico de barras renderizado.");
        } catch (plotlyError) {
            console.error("Error al renderizar con Plotly.newPlot:", plotlyError);
            error = "Error al mostrar el gráfico: " + plotlyError.message;
        }
    } else if (browser && !isLoading && !error && plotElement && (!traceDataForPlot || !layoutForPlot) && typeof Plotly !== 'undefined') {
        console.log("Div de Plotly listo, pero no hay datos de traza/layout para dibujar.");
    }

</script>

<svelte:head>
    <title>Población España (API Ninjas) - Gráfico de Barras</title>
    <script src="https://cdn.plot.ly/plotly-2.32.0.min.js" 
            on:load={() => { 
                if (browser) {
                    console.log('Plotly.js cargado desde CDN.');
                }
            }}
            on:error={() => {
                if (browser) {
                    console.error('Error al cargar Plotly.js desde CDN.');
                    error = 'No se pudo cargar la librería de gráficos (Plotly.js).';
                    isLoading = false; 
                }
            }}
    ></script>
</svelte:head>

<main>
    <h1>Visualización de Datos de Población (API Ninjas) - Gráfico de Barras</h1>

    {#if isLoading}
        <p>Cargando datos y generando gráfico...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        <button on:click={fetchDataAndPrepareChartData}>Reintentar</button>
    {:else if !traceDataForPlot || !layoutForPlot}
        <p>No hay datos disponibles para mostrar en el gráfico.</p>
         <button on:click={fetchDataAndPrepareChartData}>Reintentar Carga</button>
    {:else}
        <div bind:this={plotElement} id="plotlyChartDiv" style="width:100%;height:500px;"></div>
        <p>
            Este gráfico de barras muestra la población total de España para cada año,
            según los datos proporcionados por API Ninjas.
        </p>
    {/if}
</main>

<style>
    main {
        padding: 1em;
        max-width: 1000px;
        margin: 0 auto;
        font-family: sans-serif;
    }
    h1 {
        color: #333;
        text-align: center;
    }
    p {
        line-height: 1.6;
    }
    button {
        padding: 0.5em 1em;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
    }
    button:hover {
        background-color: #0056b3;
    }
</style>