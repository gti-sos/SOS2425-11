<script>
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    let allStatsData = [];
    let chartLabels = []; // Provincias (serán los ejes del radar)
    let chartDatasets = []; // Datos para cada tipo de registro
    let chartTitle = 'Cargando datos...';
    let dataIsReadyForChart = false; 
    let dataYear = null; 

    const API_URL = 'https://sos2425-10.onrender.com/api/v1/registrations-stats';

    async function fetchExternalApiData() {
        if (!browser) return;
        isLoading = true;
        error = null;
        dataIsReadyForChart = false;
        chartTitle = 'Cargando datos...';
        dataYear = null;

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error al cargar datos de la API externa: ${response.status} ${response.statusText}`);
            }
            allStatsData = await response.json();

            if (!allStatsData || allStatsData.length === 0) {
                error = 'No se recibieron datos de la API externa.';
                chartTitle = error;
                dataIsReadyForChart = true; 
                return; 
            }

            const years = [...new Set(allStatsData.map(item => item.year).filter(year => year != null))];
            if (years.length === 0) {
                error = 'No hay años válidos en los datos recibidos.';
                chartTitle = error;
                dataIsReadyForChart = true;
                return;
            }
            dataYear = Math.max(...years.map(Number)); 

            prepareChartDataForYear(dataYear); 

        } catch (err) {
            console.error('Error en fetchExternalApiData:', err);
            error = err.message;
            chartTitle = error;
            dataIsReadyForChart = true; 
        } finally {
            isLoading = false;
        }
    }

    function prepareChartDataForYear(yearToProcess) { 
        if (!allStatsData || allStatsData.length === 0 || yearToProcess === null) {
            chartLabels = [];
            chartDatasets = [];
            chartTitle = 'No hay datos disponibles para procesar.';
            dataIsReadyForChart = true; 
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }
        
        dataIsReadyForChart = false; 
        console.log(`[G10 PREPARE RADAR] Preparando datos para el año ${yearToProcess}`);
        const yearData = allStatsData.filter(item => item.year === yearToProcess);

        if (yearData.length === 0) {
            chartLabels = [];
            chartDatasets = [];
            chartTitle = `No hay datos de registros para el año ${yearToProcess}.`;
            dataIsReadyForChart = true;
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }

        // Para un radar, es mejor no tener demasiados ejes (provincias).
        // Considera filtrar o agregar si hay muchas. Por ahora, las usaremos todas.
        chartLabels = [...new Set(yearData.map(item => item.province))].sort();
        if (chartLabels.length > 15) { // Limitar para legibilidad del radar
            console.warn(`[G10 PREPARE RADAR] Demasiadas provincias (${chartLabels.length}) para un gráfico de radar legible. Considera filtrar.`);
            // Podrías truncar chartLabels aquí si es necesario, o mostrar un mensaje.
        }


        const nationalData = [];
        const importData = [];
        const auctionData = [];

        chartLabels.forEach(province => {
            const provinceData = yearData.find(item => item.province === province);
            nationalData.push(provinceData ? (parseFloat(provinceData.total_general_national) || 0) : 0);
            importData.push(provinceData ? (parseFloat(provinceData.total_general_import) || 0) : 0);
            auctionData.push(provinceData ? (parseFloat(provinceData.total_general_auction) || 0) : 0);
        });

        chartDatasets = [
            {
                label: 'Total Nacional',
                data: nationalData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)', // Color con transparencia para radar
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                fill: true // Para rellenar el área del radar
            },
            {
                label: 'Total Importación',
                data: importData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // Color con transparencia para radar
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                fill: true
            },
            {
                label: 'Total Subasta',
                data: auctionData,
                backgroundColor: 'rgba(255, 206, 86, 0.2)', // Color con transparencia para radar
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 206, 86, 1)',
                fill: true
            }
        ];
        
        chartTitle = `Estadísticas de Registros (Radar) - Año ${yearToProcess}`;
        dataIsReadyForChart = true; 
        console.log(`[G10 PREPARE RADAR] Datos preparados. Labels: ${chartLabels.length}, Datasets: ${chartDatasets.length}`);
    }

    $: if (browser && canvasElement && dataIsReadyForChart && !isLoading && !error && typeof Chart !== 'undefined') {
        console.log('[G10 REACTIVE RENDER RADAR] Condiciones cumplidas. Renderizando gráfico de Radar.');
        renderRadarChart();
    } else if (browser && dataIsReadyForChart && !isLoading && !error && !canvasElement) {
        console.warn('[G10 REACTIVE RENDER RADAR] Datos listos, pero canvasElement aún no está definido.');
    }

    function renderRadarChart() { 
        if (!canvasElement || typeof Chart === 'undefined') return;

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (chartLabels.length === 0 || chartDatasets.length === 0 || chartDatasets.every(ds => ds.data.every(val => val === 0))) {
            console.warn('[G10 RENDER RADAR] No hay datos significativos para renderizar el gráfico.');
            return;
        }

        const data = {
            labels: chartLabels, // Provincias en los ejes del radar
            datasets: chartDatasets
        };

        const config = {
            type: 'radar', // Cambiado a 'radar'
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle 
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index', 
                        intersect: false
                    }
                },
                scales: {
                    r: { // Configuración para la escala radial del radar
                        angleLines: {
                            display: true // Líneas que van del centro a los puntos
                        },
                        suggestedMin: 0, // Empezar la escala en 0
                        // suggestedMax: podría ser útil si los valores varían mucho
                        pointLabels: { // Etiquetas para cada eje (provincias)
                            font: {
                                size: 10 // Ajustar tamaño si hay muchas etiquetas
                            }
                        },
                        ticks: { // Marcas en la escala radial
                           backdropColor: 'transparent', // Para que no oculte las líneas de la cuadrícula
                           // stepSize: podría ser útil para controlar los incrementos
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3 // Grosor de las líneas de cada dataset
                    }
                }
            }
        };
        try {
            chartInstance = new Chart(canvasElement, config);
            console.log('[G10 RENDER RADAR] Gráfico de Radar creado.');
        } catch (e) {
            console.error('[G10 RENDER RADAR] Error al crear Chart:', e);
            error = 'Error al renderizar el gráfico de radar.';
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
                    fetchExternalApiData(); 
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkChartInterval);
                    error = 'No se pudo cargar la librería Chart.js desde el CDN.';
                    isLoading = false; 
                    chartTitle = error;
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Integración G10 - Registrations Stats (Radar)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="chart-container-g10">
    {#if isLoading}
        <p>{chartTitle}</p>
    {:else if error}
        <p style="color: red;">{error}</p>
        {#if typeof Chart !== 'undefined'} 
            <button on:click={fetchExternalApiData}>Reintentar Carga</button>
        {/if}
    {:else}
        <canvas bind:this={canvasElement} style:display={chartInstance && chartLabels.length > 0 ? 'block' : 'none'}></canvas>
        {#if !chartInstance || chartLabels.length === 0 && !isLoading}
            <p>{chartTitle}</p>
        {/if}
    {/if}
</div>

<style>
    .chart-container-g10 { 
        position: relative;
        margin: 1em auto;
        height: 75vh; /* Radar charts pueden necesitar más espacio vertical */
        width: 80vw;
        max-width: 800px; /* Ajustar según sea necesario */
        border: 1px solid #ddd;
        padding: 15px;
        background-color: #f9f9f9;
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
    p { 
        margin: 0; 
        font-size: 1.1em;
        color: #333;
    }

    button {
        display: block;
        margin: 20px auto;
        padding: 10px 18px;
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