<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    let chartDataPoints = []; // Array de objetos {x, y, label, arrested}
    let chartTitle = 'Cargando datos de ciberdelincuencia...';
    let dataIsReadyForChart = false;
    let dataYear = null;

    const API_URL = 'https://sos2425-14.onrender.com/api/v1/cybercrime-data';

    async function fetchCybercrimeData() {
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
                throw new Error(`Error al cargar datos de la API G14: ${response.status} ${response.statusText}`);
            }
            const rawData = await response.json();

            if (!rawData || rawData.length === 0) {
                error = 'No se recibieron datos de la API G14.';
                chartTitle = error;
                dataIsReadyForChart = true;
                return;
            }

            const years = [...new Set(rawData.map(item => parseInt(item.year)).filter(year => !isNaN(year)))];
            if (years.length === 0) {
                error = 'No hay años válidos en los datos recibidos.';
                chartTitle = error;
                dataIsReadyForChart = true;
                return;
            }
            dataYear = Math.max(...years);

            prepareChartData(rawData, dataYear);

        } catch (err) {
            console.error('Error en fetchCybercrimeData:', err);
            error = err.message;
            chartTitle = error;
            dataIsReadyForChart = true;
        } finally {
            isLoading = false;
        }
    }

    function prepareChartData(rawData, yearToProcess) {
        console.log(`[G14 SCATTER PREPARE] Preparando datos para el año ${yearToProcess}`);
        const yearData = rawData.filter(item => parseInt(item.year) === yearToProcess && item.autonomous_community !== 'TOTAL');

        if (yearData.length === 0) {
            chartDataPoints = [];
            chartTitle = `No hay datos de ciberdelincuencia para el año ${yearToProcess} (excluyendo TOTAL).`;
            dataIsReadyForChart = true;
            return;
        }

        chartDataPoints = yearData.map(item => ({
            x: parseFloat(item.criminal_ofense) || 0,
            y: parseFloat(item.cybersecurity) || 0,
            label: item.autonomous_community,
            arrested: parseFloat(item.arrested_investigated) || 0
        }));
        
        chartTitle = `Ciberdelincuencia vs Delitos Totales por CC.AA. (${yearToProcess})`;
        dataIsReadyForChart = true;
        console.log(`[G14 SCATTER PREPARE] Datos preparados: ${chartDataPoints.length} puntos.`);
    }

    $: if (browser && canvasElement && dataIsReadyForChart && !isLoading && !error && typeof Chart !== 'undefined') {
        console.log('[G14 SCATTER REACTIVE RENDER] Condiciones cumplidas. Renderizando gráfico.');
        renderScatterChart();
    }

    function renderScatterChart() {
        if (!canvasElement || typeof Chart === 'undefined') return;

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (chartDataPoints.length === 0) {
            console.warn('[G14 SCATTER RENDER] No hay puntos de datos para renderizar.');
            // El HTML mostrará el chartTitle apropiado
            return;
        }

        const data = {
            datasets: [{
                label: `Comunidades Autónomas - ${dataYear}`,
                data: chartDataPoints,
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Color para los puntos
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        const config = {
            type: 'scatter',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: { size: 16 }
                    },
                    legend: {
                        display: true, // Puede ser útil si se añade más de un dataset en el futuro
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return `${point.label}: (${point.x.toLocaleString()}, ${point.y.toLocaleString()}) - Arrestados: ${point.arrested.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear', // Asegurar que es lineal para scatter
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Total Delitos (Criminal Ofense)'
                        },
                        ticks: {
                            callback: function(value) { return value.toLocaleString(); }
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Delitos de Ciberseguridad (Cybersecurity)'
                        },
                        ticks: {
                            callback: function(value) { return value.toLocaleString(); }
                        }
                    }
                }
            }
        };
        try {
            chartInstance = new Chart(canvasElement, config);
            console.log('[G14 SCATTER RENDER] Gráfico de Dispersión creado.');
        } catch (e) {
            console.error('[G14 SCATTER RENDER] Error al crear Chart:', e);
            error = 'Error al renderizar el gráfico de dispersión.';
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
                    fetchCybercrimeData();
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
    <title>Integración G14 - Ciberdelincuencia (Dispersión)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="chart-container-g14">
    {#if isLoading}
        <p>{chartTitle}</p>
    {:else if error}
        <p style="color: red;">{error}</p>
        {#if typeof Chart !== 'undefined'}
            <button on:click={fetchCybercrimeData}>Reintentar Carga</button>
        {/if}
    {:else}
        <canvas bind:this={canvasElement} style:display={chartInstance && chartDataPoints.length > 0 ? 'block' : 'none'}></canvas>
        {#if !chartInstance || (chartDataPoints.length === 0 && !isLoading)}
            <p>{chartTitle}</p>
        {/if}
    {/if}
</div>

<style>
    .chart-container-g14 {
        position: relative;
        margin: 1em auto;
        height: 70vh;
        width: 90vw;
        max-width: 900px;
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
    .chart-container-g14 p {
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