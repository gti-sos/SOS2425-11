<script>
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation'; // Importar goto para navegación

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    let allRawData = []; // Almacenar todos los datos de la API
    let availableYears = []; // Años únicos para el selector
    let selectedYear = 'all'; // Año seleccionado, 'all' para mostrar datos agregados

    let processedLabels = [];
    let processedDataValues = [];

    async function initialFetch() {
        if (!browser) return;
        isLoading = true;
        error = null;

        try {
            const response = await fetch('/api/v1/social-pension-payrolls?limit=500'); // Obtener suficientes datos
            if (!response.ok) {
                throw new Error(`Error al cargar datos: ${response.status} ${response.statusText}`);
            }
            allRawData = await response.json();

            if (!allRawData || allRawData.length === 0) {
                isLoading = false;
                return;
            }

            // Extraer años únicos
            const yearsSet = new Set();
            allRawData.forEach(item => {
                if (item.year !== undefined) {
                    yearsSet.add(item.year);
                }
            });
            availableYears = ['all', ...Array.from(yearsSet).sort((a, b) => b - a)]; // 'all' primero, luego años descendentes

            prepareChartData(); // Preparar datos para el estado inicial ('all' o el primer año)

        } catch (err) {
            console.error('Error en initialFetch:', err);
            error = err.message;
            isLoading = false;
        }
    }

    function prepareChartData() {
        if (!allRawData || allRawData.length === 0) {
            processedLabels = [];
            processedDataValues = [];
            isLoading = false;
            if (chartInstance) chartInstance.destroy(); // Limpiar gráfico si no hay datos
            return;
        }

        isLoading = true; // Indicar que estamos procesando
        processedLabels = [];
        processedDataValues = [];

        let dataToProcess = allRawData;

        if (selectedYear !== 'all') {
            dataToProcess = allRawData.filter(item => item.year === parseInt(selectedYear));
        }

        const amountsByPlace = {};
        dataToProcess.forEach((item) => {
            if (item.place && typeof item.retirement_amount === 'number') {
                amountsByPlace[item.place] = (amountsByPlace[item.place] || 0) + item.retirement_amount;
            } else if (item.place && typeof item.retirement_amount === 'string') {
                const amount = parseFloat(item.retirement_amount);
                if (!isNaN(amount)) {
                    amountsByPlace[item.place] = (amountsByPlace[item.place] || 0) + amount;
                }
            }
        });

        processedLabels = Object.keys(amountsByPlace);
        processedDataValues = Object.values(amountsByPlace);
        
        isLoading = false; // Termina la carga/procesamiento

        tick().then(() => {
            if (typeof Chart !== 'undefined') {
                if (processedLabels.length > 0 && canvasElement) {
                    renderChart();
                } else if (processedLabels.length > 0 && !canvasElement) {
                    console.error('Error: Canvas element no está disponible después de tick, aunque hay datos.');
                    error = 'Fallo al inicializar el área del gráfico (canvas no encontrado).';
                } else {
                    if (chartInstance) chartInstance.destroy();
                }
            } else {
                error = 'Chart.js no se ha cargado correctamente.';
                console.error(error);
            }
        });
    }

    function renderChart() {
        if (!browser || !canvasElement || typeof Chart === 'undefined' || processedLabels.length === 0) {
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
            labels: processedLabels,
            datasets: [
                {
                    label: `Gasto en Jubilación (${selectedYear === 'all' ? 'Todos los años' : selectedYear})`,
                    data: processedDataValues,
                    backgroundColor: ['rgba(255, 99, 132, 0.7)','rgba(54, 162, 235, 0.7)','rgba(255, 206, 86, 0.7)','rgba(75, 192, 192, 0.7)','rgba(153, 102, 255, 0.7)','rgba(255, 159, 64, 0.7)','rgba(199, 199, 199, 0.7)','rgba(83, 102, 255, 0.7)','rgba(40, 159, 64, 0.7)','rgba(210, 99, 132, 0.7)','rgba(255, 138, 101, 0.7)','rgba(100, 181, 246, 0.7)','rgba(255, 241, 118, 0.7)','rgba(129, 212, 250, 0.7)','rgba(179, 157, 219, 0.7)'],
                    borderColor: ['rgba(255, 99, 132, 1)','rgba(54, 162, 235, 1)','rgba(255, 206, 86, 1)','rgba(75, 192, 192, 1)','rgba(153, 102, 255, 1)','rgba(255, 159, 64, 1)','rgba(199, 199, 199, 1)','rgba(83, 102, 255, 1)','rgba(40, 159, 64, 1)','rgba(210, 99, 132, 1)','rgba(255, 138, 101, 1)','rgba(100, 181, 246, 1)','rgba(255, 241, 118, 1)','rgba(129, 212, 250, 1)','rgba(179, 157, 219, 1)'],
                    borderWidth: 1,
                    hoverOffset: 4
                }
            ]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: `Distribución del Gasto en Jubilación por C.A. (${selectedYear === 'all' ? 'Agregado' : selectedYear})` },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        };
        chartInstance = new Chart(canvasElement, config);
    }

    // Cuando cambia el año seleccionado, reprocesar los datos
    $: if (browser && selectedYear && allRawData.length > 0) {
        prepareChartData();
    }

    onMount(() => {
        if (browser) {
            let attempts = 0;
            const maxAttempts = 50;
            const checkChartInterval = setInterval(() => {
                attempts++;
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChartInterval);
                    initialFetch(); // Cargar datos iniciales y años
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkChartInterval);
                    error = 'No se pudo cargar la librería de gráficos (Chart.js) desde el CDN.';
                    isLoading = false;
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Gráfico Donut EBT - Pensiones por Año</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="navigation-buttons">
    <button on:click={() => goto('/EBT/graph')}>Ir a Gráfico de Áreas</button>
</div>

<div class="controls">
    <label for="year-select">Selecciona un año:</label>
    <select id="year-select" bind:value={selectedYear}>
        {#each availableYears as year}
            <option value={year}>{year === 'all' ? 'Todos los años (Agregado)' : year}</option>
        {/each}
    </select>
</div>

<div class="chart-container">
    {#if isLoading}
        <p>Cargando datos y gráfico...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        {#if typeof Chart !== 'undefined'}
            <button on:click={initialFetch}>Reintentar Carga</button>
        {/if}
    {:else}
        {#if processedLabels.length > 0}
            <canvas bind:this={canvasElement}></canvas>
        {:else}
            <p>No hay datos disponibles para el año seleccionado ({selectedYear === 'all' ? 'agregado' : selectedYear}).</p>
        {/if}
    {/if}
</div>

<style>
    .navigation-buttons { /* Estilo para el contenedor de botones de navegación */
        text-align: center;
        margin-bottom: 15px;
    }
    .navigation-buttons button { /* Estilo para los botones de navegación */
        padding: 8px 15px;
        font-size: 0.9em;
        margin: 0 5px; /* Espacio entre botones si añades más */
        cursor: pointer;
    }
    .controls {
        text-align: center;
        margin-bottom: 20px;
    }
    .controls label {
        margin-right: 10px;
    }
    .controls select {
        padding: 5px;
        font-size: 1em;
    }
    .chart-container {
        position: relative;
        margin: 1em auto;
        height: 60vh;
        width: 80vw;
        max-width: 700px;
        max-height: 500px;
        border: 1px solid #eee;
        padding: 10px;
    }
    canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
    p {
        text-align: center;
        margin-top: 20px;
    }
    button { /* Estilo general para botones, el de navegación puede sobreescribir o complementar */
        display: block;
        margin: 10px auto;
        padding: 8px 15px;
        cursor: pointer;
    }
</style>