<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let plotElement; 

    let layoutForPlot = null;
    let traceDataForPlot = null;

    const PROXY_COVID_URL = '/api/covid-tracking'; 


    function formatDate(dateInt) {
        const dateStr = dateInt.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${day}/${month}/${year}`;
    }

    // Nueva función para obtener el nombre del mes
    function getMonthName(monthNumber) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return monthNames[monthNumber - 1]; // monthNumber es 1-12
    }

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
            const response = await fetch(PROXY_COVID_URL);

            if (!response.ok) {
                const errText = await response.text();
                let detail = errText;
                try {
                    const errJson = JSON.parse(errText);
                    detail = errJson.message || errText;
                } catch(e) { /* no es json */ }
                console.error("Proxy response error text:", detail);
                throw new Error(`Error fetching COVID Tracking data: ${response.status} - ${detail}`);
            }

            const covidData = await response.json();
            console.log("Datos recibidos de COVID Tracking API:", covidData);

            if (!Array.isArray(covidData) || covidData.length < 2) {
                throw new Error("Datos insuficientes de la API de COVID Tracking (se necesitan al menos 2 días).");
            }

            const latestData = covidData[0]; 
            const previousData = covidData[1]; 

            const indicators = [];
            const dateText = formatDate(latestData.date);

            // Extraer mes y año para el título
            const dateStr = latestData.date.toString();
            const year = dateStr.substring(0, 4);
            const monthNumber = parseInt(dateStr.substring(4, 6), 10);
            const monthName = getMonthName(monthNumber);
            const dynamicTitle = `Indicadores COVID-19 EEUU (${monthName} ${year})`;


            indicators.push({
                type: 'indicator',
                mode: 'gauge+number+delta',
                value: latestData.hospitalizedCurrently || 0,
                delta: { reference: previousData.hospitalizedCurrently || 0, increasing: { color: "RebeccaPurple" } },
                title: { text: `Hospitalizados<br><span style="font-size:0.8em;color:gray">${dateText}</span>` },
                gauge: {
                    axis: { range: [null, Math.max(latestData.hospitalizedCurrently || 0, previousData.hospitalizedCurrently || 0) * 1.2] },
                    bar: { color: "darkblue" },
                    steps: [
                        { range: [0, (previousData.hospitalizedCurrently || 0) * 0.8], color: 'lightgray' },
                        { range: [(previousData.hospitalizedCurrently || 0) * 0.8, (previousData.hospitalizedCurrently || 0) * 1.2], color: 'gray' }
                    ],
                },
                domain: { row: 0, column: 0 }
            });

            indicators.push({
                type: 'indicator',
                mode: 'gauge+number+delta',
                value: latestData.positiveIncrease || 0,
                delta: { reference: previousData.positiveIncrease || 0 },
                title: { text: `Nuevos Casos<br><span style="font-size:0.8em;color:gray">${dateText}</span>` },
                 gauge: {
                    axis: { range: [null, Math.max(latestData.positiveIncrease || 0, previousData.positiveIncrease || 0) * 1.2] },
                    bar: { color: "green" },
                     steps: [
                        { range: [0, (previousData.positiveIncrease || 0) * 0.8], color: 'lightgray' },
                        { range: [(previousData.positiveIncrease || 0) * 0.8, (previousData.positiveIncrease || 0) * 1.2], color: 'gray' }
                    ],
                },
                domain: { row: 0, column: 1 }
            });
            
            indicators.push({
                type: 'indicator',
                mode: 'gauge+number+delta',
                value: latestData.deathIncrease || 0,
                delta: { reference: previousData.deathIncrease || 0 },
                title: { text: `Nuevas Muertes<br><span style="font-size:0.8em;color:gray">${dateText}</span>` },
                gauge: {
                    axis: { range: [null, Math.max(latestData.deathIncrease || 0, previousData.deathIncrease || 0) * 1.2] },
                    bar: { color: "red" },
                    steps: [
                        { range: [0, (previousData.deathIncrease || 0) * 0.8], color: 'lightgray' },
                        { range: [(previousData.deathIncrease || 0) * 0.8, (previousData.deathIncrease || 0) * 1.2], color: 'gray' }
                    ],
                },
                domain: { row: 0, column: 2 }
            });
            
            traceDataForPlot = indicators; 
            layoutForPlot = {
                grid: { rows: 1, columns: 3, pattern: 'independent' },
                title: dynamicTitle, // Usar el título dinámico
                height: 350,
                margin: { t: 100, b: 50, l: 50, r: 50 }
            };

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
        console.log("Renderizando indicadores con Plotly...");
        try {
            Plotly.newPlot(plotElement, traceDataForPlot, layoutForPlot);
            console.log("Indicadores renderizados.");
        } catch (plotlyError) {
            console.error("Error al renderizar con Plotly.newPlot:", plotlyError);
            error = "Error al mostrar los indicadores: " + plotlyError.message;
        }
    } else if (browser && !isLoading && !error && plotElement && (!traceDataForPlot || !layoutForPlot) && typeof Plotly !== 'undefined') {
        console.log("Div de Plotly listo, pero no hay datos de traza/layout para dibujar los indicadores.");
    }

</script>

<svelte:head>
    <title>Indicadores COVID-19 EEUU</title>
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
    <h1>Widget de Indicadores COVID-19 (EEUU)</h1> 

    {#if isLoading}
        <p>Cargando datos y generando indicadores...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        <button on:click={fetchDataAndPrepareChartData}>Reintentar</button>
    {:else if !traceDataForPlot || !layoutForPlot}
        <p>No hay datos disponibles para mostrar los indicadores.</p>
         <button on:click={fetchDataAndPrepareChartData}>Reintentar Carga</button>
    {:else}
        <div bind:this={plotElement} id="plotlyChartDiv" style="width:100%; min-height:350px;"></div>
        <p>
            Este widget muestra indicadores clave sobre la situación de COVID-19 en EEUU,
            basados en los datos más recientes de The COVID Tracking Project.
            Se muestra el valor del último día y el cambio (delta) respecto al día anterior.
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
        margin-top: 1em;
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