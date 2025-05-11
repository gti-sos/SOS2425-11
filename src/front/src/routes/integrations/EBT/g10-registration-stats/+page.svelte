<script>
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';
    // Chart.js se cargará desde CDN

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    let allStatsData = []; // Almacenar todos los datos de la API externa
    let availableYears = [];
    let selectedYear = null; // Se seleccionará el más reciente por defecto

    let chartLabels = []; // Provincias
    let chartDatasets = []; // Datos para las barras apiladas

    const API_URL = 'https://sos2425-10.onrender.com/api/v1/registrations-stats';

    async function fetchExternalApiData() {
        if (!browser) return;
        isLoading = true;
        error = null;

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error al cargar datos de la API externa: ${response.status} ${response.statusText}`);
            }
            allStatsData = await response.json();

            if (!allStatsData || allStatsData.length === 0) {
                isLoading = false;
                console.log('No se recibieron datos de la API externa.');
                return;
            }

            const yearsSet = new Set(allStatsData.map(item => item.year).filter(year => year != null));
            availableYears = Array.from(yearsSet).sort((a, b) => b - a); // Ordenar descendente

            if (availableYears.length > 0) {
                selectedYear = availableYears[0]; // Seleccionar el año más reciente por defecto
            } else {
                selectedYear = new Date().getFullYear(); // Fallback si no hay años
            }

            prepareChartDataForYear();

        } catch (err) {
            console.error('Error en fetchExternalApiData:', err);
            error = err.message;
            isLoading = false;
        }
    }

    function prepareChartDataForYear() {
        if (!allStatsData || allStatsData.length === 0 || selectedYear === null) {
            chartLabels = [];
            chartDatasets = [];
            isLoading = false;
            if (chartInstance) chartInstance.destroy();
            return;
        }

        isLoading = true;
        const yearData = allStatsData.filter(item => item.year === parseInt(selectedYear));

        if (yearData.length === 0) {
            chartLabels = [];
            chartDatasets = [];
            isLoading = false;
            if (chartInstance) chartInstance.destroy();
            tick().then(renderChart); // Asegurar que se limpie el canvas si estaba dibujado
            return;
        }

        chartLabels = [...new Set(yearData.map(item => item.province))].sort(); // Provincias únicas y ordenadas

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
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            },
            {
                label: 'Total Importación',
                data: importData,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Total Subasta',
                data: auctionData,
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }
        ];
        
        isLoading = false;
        tick().then(renderChart);
    }

    function renderChart() {
        if (!browser || !canvasElement || typeof Chart === 'undefined') {
            if (chartInstance) chartInstance.destroy();
            return;
        }
        if (chartLabels.length === 0) { // Si no hay datos para el año, limpiar
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }


        if (chartInstance) {
            chartInstance.destroy();
        }

        const data = {
            labels: chartLabels,
            datasets: chartDatasets
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Estadísticas de Registros por Provincia - Año ${selectedYear}`
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Provincia'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Total Registros'
                        },
                        beginAtZero: true
                    }
                }
            }
        };
        chartInstance = new Chart(canvasElement, config);
    }

    // Reactividad para el cambio de año
    $: if (browser && selectedYear && allStatsData.length > 0) {
        prepareChartDataForYear();
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
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Integración G10 - Registrations Stats</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="controls">
    {#if availableYears.length > 0}
        <label for="year-select-g10">Selecciona un año:</label>
        <select id="year-select-g10" bind:value={selectedYear}>
            {#each availableYears as year}
                <option value={year}>{year}</option>
            {/each}
        </select>
    {:else if !isLoading && !error}
        <p>No hay años disponibles en los datos.</p>
    {/if}
</div>

<div class="chart-container-g10">
    {#if isLoading}
        <p>Cargando datos y gráfico...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        {#if typeof Chart !== 'undefined'}
            <button on:click={fetchExternalApiData}>Reintentar Carga</button>
        {/if}
    {:else}
        {#if chartLabels.length > 0}
            <canvas bind:this={canvasElement}></canvas>
        {:else}
            <p>No hay datos de registros disponibles para el año {selectedYear}.</p>
        {/if}
    {/if}
</div>

<style>
    .controls {
        text-align: center;
        margin-bottom: 20px;
        margin-top: 15px;
    }
    .controls label {
        margin-right: 10px;
    }
    .controls select {
        padding: 8px;
        font-size: 1em;
        border-radius: 4px;
    }
    .chart-container-g10 { /* Nombre de clase único para evitar conflictos */
        position: relative;
        margin: 1em auto;
        height: 70vh; /* Un poco más alto para barras */
        width: 90vw;
        max-width: 1000px; /* Más ancho para barras */
        border: 1px solid #ddd;
        padding: 15px;
        background-color: #f9f9f9;
    }
    canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
    p {
        text-align: center;
        margin-top: 20px;
        font-size: 1.1em;
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