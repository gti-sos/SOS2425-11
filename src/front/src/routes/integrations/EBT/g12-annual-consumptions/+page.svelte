<script>
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement; // Ligado al <canvas> con bind:this

    let chartTitle = 'Cargando...';

    // Estado para los datos preparados para el gráfico
    let preparedLabels = [];
    let preparedDataValues = [];
    let preparedTitle = '';
    let dataIsReadyForChart = false; // Flag para indicar que los datos están listos

    const METRIC_TO_DISPLAY = 'total_consumption';
    const API_URL = 'https://sos2425-12.onrender.com/api/v1/annual-consumptions';

    async function fetchDataAndPrepare() { // Renombrado para claridad
        if (!browser) return;
        isLoading = true;
        error = null;
        chartTitle = 'Cargando...';
        dataIsReadyForChart = false; // Resetear flag
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        console.log('[ULTRA-SIMPLE] Iniciando carga y preparación de datos...');

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error API G12: ${response.status} ${response.statusText}`);
            }
            const allData = await response.json();
            console.log('[ULTRA-SIMPLE] Datos recibidos (primeros 5):', JSON.parse(JSON.stringify(allData.slice(0, 5))));

            if (!allData || allData.length === 0) {
                error = 'No se recibieron datos o los datos están vacíos.';
                console.warn(`[ULTRA-SIMPLE] ${error}`);
                chartTitle = 'No hay datos disponibles';
                return; // isLoading se pondrá a false en finally
            }

            let targetYear = null;
            // Descomenta la siguiente línea para fijar el año a 2018
            targetYear = 2018; 
            if(targetYear === null){ // Si no se fijó, buscar el primer año
                 for(const item of allData){
                    if(item && item.year != null){
                        targetYear = parseInt(item.year);
                        break;
                    }
                }
            }


            if (targetYear === null) {
                error = 'No se encontró un año válido en los datos.';
                console.warn(`[ULTRA-SIMPLE] ${error}`);
                chartTitle = 'No hay datos de año válidos';
                return; // isLoading se pondrá a false en finally
            }
            
            console.log(`[ULTRA-SIMPLE] Usando año: ${targetYear}`);
            const currentChartTitle = `Comparativa de ${METRIC_TO_DISPLAY.replace(/_/g, ' ')} por CCAA - Año ${targetYear}`;

            const yearData = allData.filter(item => {
                return item && typeof item.year !== 'undefined' && item.year !== null && parseInt(item.year) === targetYear;
            });

            if (yearData.length === 0) {
                chartTitle = `No hay datos para el año ${targetYear}.`;
                console.warn(`[ULTRA-SIMPLE] ${chartTitle}`);
                // No hay datos para graficar, dataIsReadyForChart seguirá false
                return; // isLoading se pondrá a false en finally
            }
            
            // Preparar datos para la declaración reactiva
            preparedLabels = yearData.map(item => item.aacc || 'Desconocido');
            preparedDataValues = yearData.map(item => parseFloat(item[METRIC_TO_DISPLAY]) || 0);
            preparedTitle = currentChartTitle;
            dataIsReadyForChart = true; // Indicar que los datos están listos

            console.log(`[ULTRA-SIMPLE] Datos preparados - Etiquetas (${preparedLabels.length}), Valores (${preparedDataValues.length})`);
            
            // Ya no llamamos a renderFixedChart directamente aquí
            // La declaración reactiva se encargará cuando canvasElement esté listo

        } catch (errCatch) {
            console.error('[ULTRA-SIMPLE] Error en fetchDataAndPrepare:', errCatch);
            error = errCatch.message;
            chartTitle = 'Error al cargar datos';
        } finally {
            isLoading = false; // Muy importante: actualizar isLoading
            // Svelte reaccionará a isLoading=false, renderizará el canvas,
            // y luego la declaración reactiva $: podrá actuar.
        }
    }

    // Declaración reactiva para renderizar el gráfico cuando todo esté listo
    $: if (browser && canvasElement && dataIsReadyForChart && !isLoading && !error && typeof Chart !== 'undefined') {
        console.log('[REACTIVE RENDER] Condiciones cumplidas. Renderizando gráfico con título:', preparedTitle);
        renderFixedChart(preparedLabels, preparedDataValues, preparedTitle);
        // Opcional: resetear dataIsReadyForChart si no quieres que se re-renderice
        // automáticamente en cada cambio menor (aunque aquí no debería haber muchos)
        // dataIsReadyForChart = false; 
    } else if (browser && !isLoading && !error && dataIsReadyForChart && !canvasElement) {
        // Este log es para depurar si los datos están listos pero el canvas no
        console.warn('[REACTIVE RENDER] Datos listos, pero canvasElement aún no está definido.');
    }


    function renderFixedChart(labels = [], dataValues = [], title = 'Gráfico') {
        console.log('[RENDER] Entrando a renderFixedChart. Canvas Element:', canvasElement ? 'Definido' : 'UNDEFINED', 'ChartJS defined:', typeof Chart !== 'undefined');
        
        // Las comprobaciones de browser, Chart, canvasElement ya están en la declaración reactiva,
        // pero es bueno mantenerlas por si se llama a esta función desde otro lugar.
        if (!browser || typeof Chart === 'undefined' || !canvasElement) {
            console.warn('[RENDER] Prerrequisitos no cumplidos para renderizar (browser, ChartJS, o canvasElement).');
            if (chartInstance) { // Si había uno, y ahora no se puede renderizar, destrúyelo.
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }
        
        if (chartInstance) {
            console.log('[RENDER] Destruyendo instancia de gráfico existente.');
            chartInstance.destroy();
            chartInstance = null;
        }

        if (labels.length === 0 || dataValues.length === 0) {
            console.warn('[RENDER] No hay etiquetas o valores para renderizar. Título actual:', title);
            chartTitle = title; // Asegurar que el título refleje "No hay datos..."
            return; 
        }
        console.log('[RENDER] Preparando para crear nuevo Chart. Labels count:', labels.length, 'Data count:', dataValues.length);
        chartTitle = title; // Actualizar el título global que se muestra si no hay gráfico

        const data = {
            labels: labels, 
            datasets: [{
                label: METRIC_TO_DISPLAY.replace(/_/g, ' '),
                data: dataValues,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: title },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    x: { title: { display: true, text: 'Comunidad Autónoma' } },
                    y: { title: { display: true, text: METRIC_TO_DISPLAY.replace(/_/g, ' ') }, beginAtZero: true }
                }
            }
        };
        try {
            console.log('[RENDER] Intentando crear new Chart().');
            chartInstance = new Chart(canvasElement, config);
            console.log('[RENDER] Nueva instancia de Chart CREADA:', chartInstance ? 'Éxito' : 'Fallo (null)');
        } catch (e) {
            console.error('[RENDER] Error al crear instancia de Chart:', e);
            error = 'Error al renderizar el gráfico.';
            chartTitle = error;
            chartInstance = null;
        }
    }
    
    onMount(() => {
        if (browser) {
            let attempts = 0;
            const maxAttempts = 50;
            const checkChartInterval = setInterval(() => {
                attempts++;
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChartInterval);
                    fetchDataAndPrepare(); 
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkChartInterval);
                    error = 'No se pudo cargar la librería Chart.js desde el CDN.';
                    isLoading = false;
                    chartTitle = 'Error de librería de gráficos';
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Integración G12 - Consumo (Simple)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="chart-container-g12-ultra-simple">
    {#if isLoading}
        <p>{chartTitle}</p>
    {:else if error}
        <p style="color: red;">{error}</p>
        <button on:click={fetchDataAndPrepare}>Reintentar</button>
    {:else}
        <!-- El canvas siempre está presente en el DOM si no hay error/isLoading, para que bind:this funcione -->
        <canvas bind:this={canvasElement} style:display={chartInstance ? 'block' : 'none'}></canvas>
        {#if !chartInstance}
            <!-- Muestra el título (que puede ser "No hay datos..." o "Cargando..." si la preparación falló sutilmente) -->
            <p>{chartTitle}</p>
        {/if}
    {/if}
</div>

<style>
    .chart-container-g12-ultra-simple {
        position: relative;
        margin: 2em auto;
        height: 65vh; 
        width: 90vw;
        max-width: 950px; 
        border: 1px solid #ccc;
        padding: 20px;
        background-color: #fafafa;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
    .chart-container-g12-ultra-simple p {
        margin: 0;
        font-size: 1.2em;
        color: #444;
    }
    button {
        display: block;
        margin: 20px auto;
        padding: 10px 20px;
        font-size: 1em;
        cursor: pointer;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
    }
    button:hover {
        background-color: #0056b3;
    }
</style>