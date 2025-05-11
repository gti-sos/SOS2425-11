<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let plotElement; 

    let layoutForPlot = null;
    let traceDataForPlot = null;

    // Estas constantes ahora son más para la descripción o si quieres mostrarlas en el UI,
    // ya que el proxy define qué se solicita.
    const BASE_CURRENCY_DISPLAY = 'EUR';
    const TARGET_CURRENCIES_DISPLAY = ['USD', 'GBP', 'JPY']; 
    
    // getFormattedDate ya no es necesaria aquí si el proxy maneja las fechas

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
            // URL del proxy de SvelteKit con la solicitud fija
            const svelteKitProxyUrl = `/api/frankfurter-proxy`; // Apunta a tu nuevo proxy fijo
            
            console.log("Solicitando a SvelteKit Fixed Proxy para Frankfurter:", svelteKitProxyUrl);
            const response = await fetch(svelteKitProxyUrl); 

            if (!response.ok) {
                const errText = await response.text();
                let detail = errText;
                try {
                    const errJson = JSON.parse(errText);
                    detail = errJson.message || errText;
                } catch(e) { /* no es json */ }
                console.error("SvelteKit Fixed Proxy (Frankfurter) response error text:", detail);
                throw new Error(`Error fetching currency data via SvelteKit fixed proxy: ${response.status} - ${detail}`);
            }

            const currencyData = await response.json();
            console.log("Datos recibidos de Frankfurter API (via SvelteKit Fixed Proxy):", currencyData);

            if (!currencyData.rates || Object.keys(currencyData.rates).length === 0) {
                throw new Error("No se recibieron datos de tasas de cambio de la API.");
            }

            const dates = Object.keys(currencyData.rates).sort();
            const traces = [];

            // Asumimos que el proxy devuelve las monedas que esperamos (USD, GBP, JPY)
            // Si el proxy cambia las monedas, esta parte necesitaría ser más dinámica
            // o simplemente usar TARGET_CURRENCIES_DISPLAY si coincide con lo que el proxy pide.
            const actualTargetCurrencies = currencyData.rates[dates[0]] ? Object.keys(currencyData.rates[dates[0]]) : TARGET_CURRENCIES_DISPLAY;


            actualTargetCurrencies.forEach(currency => {
                // Verificar que la moneda exista en los datos para cada fecha
                const ratesForCurrency = dates.map(date => currencyData.rates[date]?.[currency]).filter(rate => rate !== undefined);
                if (ratesForCurrency.length === dates.length) { // Solo añadir traza si tenemos todos los datos
                    traces.push({
                        x: dates,
                        y: ratesForCurrency,
                        type: 'scatter', 
                        mode: 'lines',
                        name: `${currencyData.base || BASE_CURRENCY_DISPLAY} a ${currency}`
                    });
                } else {
                    console.warn(`Datos incompletos o faltantes para la moneda ${currency}`);
                }
            });
            
            if (traces.length === 0) {
                throw new Error("No se pudieron generar trazas para el gráfico. Verifique los datos de la API y las monedas solicitadas.");
            }

            traceDataForPlot = traces; 
            layoutForPlot = {
                title: `Tasas de Cambio (Últimos 30 Días - Proxy Fijo)`, // Título ajustado
                xaxis: {
                    title: 'Fecha',
                    type: 'date' 
                },
                yaxis: {
                    title: 'Tasa de Cambio'
                },
                legend: {
                    orientation: 'h',
                    yanchor: 'bottom',
                    y: 1.02,
                    xanchor: 'right',
                    x: 1
                },
                height: 500,
                margin: { t: 80, b: 50, l: 60, r: 30 }
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
        console.log("Renderizando gráfico de tasas de cambio con Plotly...");
        try {
            Plotly.newPlot(plotElement, traceDataForPlot, layoutForPlot);
            console.log("Gráfico de tasas de cambio renderizado.");
        } catch (plotlyError) {
            console.error("Error al renderizar con Plotly.newPlot:", plotlyError);
            error = "Error al mostrar el gráfico de tasas de cambio: " + plotlyError.message;
        }
    } else if (browser && !isLoading && !error && plotElement && (!traceDataForPlot || !layoutForPlot) && typeof Plotly !== 'undefined') {
        console.log("Div de Plotly listo, pero no hay datos de traza/layout para dibujar el gráfico de tasas de cambio.");
    }

</script>

<svelte:head>
    <title>Tasas de Cambio (Frankfurter - Proxy Fijo)</title>
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
    <h1>Evolución de Tasas de Cambio (Datos Fijos de Frankfurter API)</h1>

    {#if isLoading}
        <p>Cargando datos y generando gráfico...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        <button on:click={fetchDataAndPrepareChartData}>Reintentar</button>
    {:else if !traceDataForPlot || !layoutForPlot}
        <p>No hay datos disponibles para mostrar el gráfico.</p>
         <button on:click={fetchDataAndPrepareChartData}>Reintentar Carga</button>
    {:else}
        <div bind:this={plotElement} id="plotlyChartDiv" style="width:100%; min-height:500px;"></div>
        <p>
            Este gráfico muestra la evolución de las tasas de cambio para un conjunto fijo de monedas
            (generalmente {BASE_CURRENCY_DISPLAY} frente a {TARGET_CURRENCIES_DISPLAY.join(', ')}) durante los últimos 30 días,
            utilizando datos de la API de Frankfurter.dev (a través de un proxy de SvelteKit con solicitud fija).
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