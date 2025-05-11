<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    let allEmigrationData = [];
    let dataYear = null;
    let dataQuarter = null;

    // Para PolarArea
    let preparedChartLabels = []; // Comunidades
    let preparedChartData = [];   // Total emigrantes por comunidad
    let preparedBackgroundColors = []; // Colores para cada segmento

    let chartTitle = 'Cargando datos de emigración...';
    let dataIsReadyForChart = false;

    const API_URL = 'https://sos2425-16.onrender.com/api/v1/emigration-stats/';

    // Paleta de colores para las comunidades en el gráfico polar
    const colorPalette = [
        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(102, 255, 83, 0.7)',
        'rgba(255, 83, 102, 0.7)', 'rgba(46, 204, 113, 0.7)', 'rgba(241, 196, 15, 0.7)',
        'rgba(230, 126, 34, 0.7)', 'rgba(149, 165, 166, 0.7)', 'rgba(52, 73, 94, 0.7)'
        // Añade más colores si tienes muchas comunidades
    ];


    async function loadAndProcessApiData() {
        if (!browser) return;
        isLoading = true;
        error = null;
        dataIsReadyForChart = false;
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        console.log('[G16 EMIGRATION POLAR] Iniciando carga y procesamiento de datos de la API...');

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error API G16: ${response.status} ${response.statusText}`);
            }
            allEmigrationData = await response.json();
            console.log('[G16 EMIGRATION POLAR] Datos recibidos (primeros 5):', allEmigrationData.slice(0, 5));

            if (!allEmigrationData || allEmigrationData.length === 0) {
                error = 'No se recibieron datos de emigración o están vacíos.';
                chartTitle = error;
                dataIsReadyForChart = true; // Para que la UI actualice
                return;
            }

            const years = [...new Set(allEmigrationData.map(item => item.year).filter(y => y != null))];
            if (years.length === 0) {
                error = 'No hay años válidos en los datos.';
                chartTitle = error;
                dataIsReadyForChart = true;
                return;
            }
            dataYear = Math.max(...years.map(Number));

            const quartersForLatestYear = [...new Set(
                allEmigrationData
                    .filter(item => item.year === dataYear && item.quarter != null)
                    .map(item => item.quarter)
            )];

            if (quartersForLatestYear.length === 0) {
                error = `No hay trimestres válidos para el año más reciente (${dataYear}).`;
                chartTitle = error;
                dataIsReadyForChart = true;
                return;
            }
            quartersForLatestYear.sort((a, b) => b.localeCompare(a));
            dataQuarter = quartersForLatestYear[0];

            console.log(`[G16 EMIGRATION POLAR] Año más reciente: ${dataYear}, Trimestre más reciente: ${dataQuarter}`);
            prepareChartData(dataYear, dataQuarter);

        } catch (errCatch) {
            console.error('[G16 EMIGRATION POLAR] Error al cargar o procesar datos:', errCatch);
            error = errCatch.message;
            chartTitle = 'Error al cargar datos de emigración.';
            dataIsReadyForChart = true;
        } finally {
            isLoading = false;
        }
    }

    function prepareChartData(yearToProcess, quarterToProcess) {
        if (!yearToProcess || !quarterToProcess || allEmigrationData.length === 0) {
            console.warn('[G16 POLAR PREPARE] Año, trimestre no válido o sin datos base.');
            preparedChartLabels = [];
            preparedChartData = [];
            preparedBackgroundColors = [];
            chartTitle = 'Datos insuficientes para generar el gráfico.';
            dataIsReadyForChart = true;
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }

        dataIsReadyForChart = false;
        console.log(`[G16 POLAR PREPARE] Preparando datos para Año: ${yearToProcess}, Trimestre: ${quarterToProcess}`);

        const filteredData = allEmigrationData.filter(item =>
            item.year === yearToProcess && item.quarter === quarterToProcess
        );

        if (filteredData.length === 0) {
            chartTitle = `No hay datos de emigración para ${yearToProcess} - ${quarterToProcess}.`;
            preparedChartLabels = [];
            preparedChartData = [];
            preparedBackgroundColors = [];
        } else {
            const dataByCommunity = {};
            filteredData.forEach(item => {
                if (!item.autonomic_community) return; // Saltar si no hay comunidad
                if (!dataByCommunity[item.autonomic_community]) {
                    dataByCommunity[item.autonomic_community] = 0;
                }
                const totalForEntry = (parseFloat(item.between_20_24_yo) || 0) +
                                      (parseFloat(item.between_25_29_yo) || 0) +
                                      (parseFloat(item.between_30_34_yo) || 0);
                dataByCommunity[item.autonomic_community] += totalForEntry;
            });

            preparedChartLabels = Object.keys(dataByCommunity).sort();
            preparedChartData = preparedChartLabels.map(community => dataByCommunity[community]);
            preparedBackgroundColors = preparedChartLabels.map((_, index) => colorPalette[index % colorPalette.length]);
            
            chartTitle = `Total Emigrantes por Comunidad - ${yearToProcess} ${quarterToProcess.toUpperCase()}`;
        }
        console.log(`[G16 POLAR PREPARE] Datos preparados - Etiquetas (${preparedChartLabels.length}), Datos (${preparedChartData.length})`);
        dataIsReadyForChart = true;
    }

    $: if (browser && canvasElement && dataIsReadyForChart && !isLoading && !error && typeof Chart !== 'undefined') {
        console.log('[G16 POLAR REACTIVE RENDER] Condiciones cumplidas. Renderizando gráfico Polar Area.');
        renderPolarAreaChart(preparedChartLabels, preparedChartData, preparedBackgroundColors, chartTitle);
    } else if (browser && dataIsReadyForChart && !isLoading && !error && !canvasElement) {
        console.warn('[G16 POLAR REACTIVE RENDER] Datos listos, pero canvasElement aún no está definido.');
    }

    function renderPolarAreaChart(labels, dataValues, backgroundColors, title) {
        if (!canvasElement || typeof Chart === 'undefined') return;
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (!labels || labels.length === 0 || !dataValues || dataValues.length === 0 || dataValues.every(d => d === 0)) {
            console.warn('[G16 POLAR RENDER] No hay etiquetas o datos significativos para renderizar.');
            return;
        }

        const data = {
            labels: labels,
            datasets: [{
                label: 'Total Emigrantes', // Este label aparece en el tooltip
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        };

        const config = {
            type: 'polarArea', // Cambiado a polarArea
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: title, font: { size: 16 } },
                    legend: { 
                        position: 'top',
                        labels: { padding: 10 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.raw !== null) { label += context.raw.toLocaleString(); }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    r: { // Configuración para la escala radial
                        beginAtZero: true,
                        ticks: { backdropPadding: 0 }
                    }
                },
                layout: { padding: 10 }
            }
        };

        try {
            chartInstance = new Chart(canvasElement, config);
            console.log('[G16 POLAR RENDER] Gráfico de Área Polar creado.');
        } catch (e) {
            console.error('[G16 POLAR RENDER] Error al crear Chart:', e);
            error = 'Error al renderizar el gráfico.';
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
                    loadAndProcessApiData();
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
    <title>Integración G16 - Emigración (Área Polar - Más Reciente)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="chart-container-g16-emigration">
    {#if isLoading}
        <p>{chartTitle}</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        {#if typeof Chart !== 'undefined'}
            <button on:click={loadAndProcessApiData}>Reintentar Carga</button>
        {/if}
    {:else}
        <canvas bind:this={canvasElement} style:display={chartInstance && preparedChartLabels.length > 0 ? 'block' : 'none'}></canvas>
        {#if !chartInstance || (preparedChartLabels.length === 0 && !isLoading)}
            <p>{chartTitle}</p>
        {/if}
    {/if}
</div>

<style>
    .chart-container-g16-emigration {
        position: relative;
        margin: 1em auto;
        height: 70vh; 
        width: 80vw; 
        max-width: 700px; 
        border: 1px solid #dee2e6;
        padding: 20px;
        background-color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
    .chart-container-g16-emigration p {
        margin: 0;
        font-size: 1.2em;
        color: #495057;
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
        transition: background-color 0.2s;
    }
    button:hover {
        background-color: #0056b3;
    }
</style>