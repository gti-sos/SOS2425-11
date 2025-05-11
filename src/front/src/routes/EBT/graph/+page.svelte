<script>
    import { onMount, tick } from 'svelte'; // Import tick
    import { browser } from '$app/environment'; // Para asegurar que Highcharts se carga en el navegador
    import { goto } from '$app/navigation'; // Importar goto para navegación

    let chartData = [];
    let isLoading = true;
    let error = null;
    let chartInstance = null; // Para mantener una referencia al gráfico

    // 1. Obtener datos de la API
    async function fetchDataAndPrepareChart() {
        if (!browser) return; // Solo ejecutar en el navegador

        isLoading = true;
        error = null;
        try {
            // Ajusta el límite según necesites, o implementa paginación si son muchos datos
            const response = await fetch('/api/v1/social-pension-payrolls?limit=200');
            if (!response.ok) {
                throw new Error(`Error al cargar datos: ${response.status} ${response.statusText}`);
            }
            const rawData = await response.json();

            if (!rawData || rawData.length === 0) {
                // Considerar si esto es un error o simplemente no hay datos
                // Para este ejemplo, lo trataremos como "no hay datos para mostrar"
                chartData = [];
                isLoading = false;
                if (chartInstance) { // Limpiar gráfico anterior si existe
                    chartInstance.destroy();
                    chartInstance = null;
                }
                return; // Salir si no hay datos
            }

            // 2. Procesar los datos para Highcharts
            const places = {};
            const years = new Set();

            rawData.forEach((item) => {
                if (!item.place || item.year === undefined || item.retirement_amount === undefined || item.disability_amount === undefined) {
                    console.warn('Saltando item con datos incompletos:', item);
                    return;
                }
                if (!places[item.place]) {
                    places[item.place] = {
                        retirement: {},
                        disability: {}
                    };
                }
                places[item.place].retirement[item.year] = (places[item.place].retirement[item.year] || 0) + parseFloat(item.retirement_amount);
                places[item.place].disability[item.year] = (places[item.place].disability[item.year] || 0) + parseFloat(item.disability_amount);
                years.add(item.year);
            });

            const sortedYears = Array.from(years).sort((a, b) => a - b);
            // const firstYear = sortedYears.length > 0 ? sortedYears[0] : new Date().getFullYear(); // No se usa directamente en este tipo de gráfico

            const series = [];
            for (const placeName in places) {
                series.push({
                    name: `${placeName} - Jubilación`,
                    data: sortedYears.map(year => places[placeName].retirement[year] || 0)
                });
                series.push({
                    name: `${placeName} - Discapacidad`,
                    data: sortedYears.map(year => places[placeName].disability[year] || 0)
                });
            }
            
            if (series.length === 0 && rawData.length > 0) { // Si había rawData pero no se generaron series
                throw new Error('No se pudieron generar series para el gráfico a partir de los datos recibidos, aunque había datos iniciales.');
            }

            chartData = series;
            isLoading = false;

            await tick(); // Esperar a que Svelte actualice el DOM y el div#container esté disponible
            
            // Solo renderizar si hay datos y el contenedor existe
            if (chartData.length > 0 && document.getElementById('container')) {
                renderChart(chartData, sortedYears);
            } else if (chartData.length === 0 && chartInstance) {
                // Si no hay datos pero había un gráfico, limpiarlo
                chartInstance.destroy();
                chartInstance = null;
            }


        } catch (err) {
            console.error('Error al procesar datos para el gráfico:', err);
            error = err.message;
            isLoading = false;
        }
    }

    // 3. Renderizar el gráfico con los datos
    function renderChart(seriesData, categories) { // Removido startYear, no es necesario para xAxis.categories
        if (!browser || !document.getElementById('container')) {
            console.warn("Contenedor del gráfico no encontrado, no se puede renderizar.");
            return;
        }

        if (chartInstance) {
            chartInstance.destroy(); 
        }
        
        // Asegurarse de que Highcharts esté cargado
        if (typeof Highcharts === 'undefined') {
            error = 'Highcharts no está cargado. Asegúrate de que el script esté en <svelte:head>.';
            console.error(error);
            isLoading = false; // Para que se muestre el error
            return;
        }


        chartInstance = Highcharts.chart('container', {
            chart: {
                type: 'area' 
            },
            title: {
                text: 'Gasto en Pensiones Sociales (Jubilación y Discapacidad)'
            },
            subtitle: {
                text: 'Fuente: API Social Pension Payrolls'
            },
            xAxis: {
                categories: categories, 
                title: {
                    text: 'Año'
                }
            },
            yAxis: {
                title: {
                    useHTML: true,
                    text: 'Millones de Euros (aproximado)' 
                },
                min: 0 
            },
            tooltip: {
                shared: true,
                headerFormat: '<span style="font-size:12px"><b>Año {point.key}</b></span><br>'
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: true,
                        radius: 3
                    }
                },
                area: {
                    stacking: 'normal', 
                    lineColor: '#666666',
                    lineWidth: 1,
                    marker: {
                        lineWidth: 1,
                        lineColor: '#666666'
                    }
                }
            },
            series: seriesData 
        });
    }

    onMount(async () => {
        if (browser) {
            // Esperar a que Highcharts esté disponible desde el CDN
            let attempts = 0;
            const maxAttempts = 50; // ~5 segundos
            const checkHighchartsInterval = setInterval(async () => {
                attempts++;
                if (typeof Highcharts !== 'undefined') {
                    clearInterval(checkHighchartsInterval);
                    await fetchDataAndPrepareChart();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkHighchartsInterval);
                    error = "No se pudo cargar Highcharts desde el CDN.";
                    isLoading = false;
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Gráfico EBT - Pensiones (Áreas)</title>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
</svelte:head>

<div class="navigation-buttons">
    <button on:click={() => goto('/EBT/doughnut')}>Ir a Gráfico Circular (Doughnut)</button>
</div>

{#if isLoading}
    <p>Cargando datos para el gráfico...</p>
{:else if error}
    <p style="color: red;">Error: {error}</p>
    <button on:click={fetchDataAndPrepareChart}>Reintentar</button>
{:else if chartData.length > 0}
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description">
            Este gráfico muestra la evolución del gasto en pensiones de jubilación y discapacidad por comunidad autónoma a lo largo de los años.
        </p>
    </figure>
{:else}
    <p>No hay datos disponibles para mostrar en el gráfico.</p>
    <button on:click={fetchDataAndPrepareChart}>Cargar Datos</button>
{/if}


<style>
    .navigation-buttons {
        text-align: center;
        margin-bottom: 15px;
    }
    .navigation-buttons button {
        padding: 8px 15px;
        font-size: 0.9em;
        margin: 0 5px;
        cursor: pointer;
    }
    #container {
        height: 500px;
    }
    .highcharts-figure,
    .highcharts-data-table table {
        min-width: 310px;
        max-width: 90%;
        margin: 1em auto;
    }
    .highcharts-data-table table {
        font-family: Verdana, sans-serif;
        border-collapse: collapse;
        border: 1px solid #ebebeb;
        margin: 10px auto;
        text-align: center;
        width: 100%;
        max-width: 600px;
    }
    .highcharts-data-table caption {
        padding: 1em 0;
        font-size: 1.2em;
        color: #555;
    }
    .highcharts-data-table th {
        font-weight: 600;
        padding: 0.5em;
    }
    .highcharts-data-table td,
    .highcharts-data-table th,
    .highcharts-data-table caption {
        padding: 0.5em;
    }
    .highcharts-data-table thead tr,
    .highcharts-data-table tbody tr:nth-child(even) {
        background: #f8f8f8;
    }
    .highcharts-data-table tr:hover {
        background: #f1f7ff;
    }
    .highcharts-description {
        margin: 0.3rem 10px;
        text-align: center;
    }
    p { /* Estilo general para párrafos de estado */
        text-align: center;
        margin-top: 20px;
    }
    button { /* Estilo general para botones de acción */
        display: block;
        margin: 10px auto;
        padding: 8px 15px;
        cursor: pointer;
    }
</style>