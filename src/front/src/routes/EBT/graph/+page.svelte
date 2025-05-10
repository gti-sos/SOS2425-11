<script>
    import { onMount, tick } from 'svelte'; // Import tick
    import { browser } from '$app/environment'; // Para asegurar que Highcharts se carga en el navegador

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
            const response = await fetch('/api/v1/social-pension-payrolls?limit=200'); // Obtener datos de tu API
            if (!response.ok) {
                throw new Error(`Error al cargar datos: ${response.status} ${response.statusText}`);
            }
            const rawData = await response.json();

            if (!rawData || rawData.length === 0) {
                throw new Error('No se recibieron datos de la API o los datos están vacíos.');
            }

            // 2. Procesar los datos para Highcharts
            // Agrupamos por 'place' y luego preparamos las series por año
            const places = {};
            const years = new Set(); // Para el eje X (categorías)

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
            const firstYear = sortedYears.length > 0 ? sortedYears[0] : new Date().getFullYear(); // Año de inicio para plotOptions

            const series = [];
            for (const placeName in places) {
                series.push({
                    name: `${placeName} - Jubilación`,
                    data: sortedYears.map(year => places[placeName].retirement[year] || 0) // Rellenar con 0 si no hay dato
                });
                series.push({
                    name: `${placeName} - Discapacidad`,
                    data: sortedYears.map(year => places[placeName].disability[year] || 0) // Rellenar con 0 si no hay dato
                });
            }
            
            if (series.length === 0) {
                throw new Error('No se pudieron generar series para el gráfico a partir de los datos recibidos.');
            }

            chartData = series;
            isLoading = false;

            // Esperar a que Svelte actualice el DOM y el div#container esté disponible
            await tick(); 
            
            renderChart(chartData, sortedYears, firstYear);

        } catch (err) {
            console.error('Error al procesar datos para el gráfico:', err);
            error = err.message;
            isLoading = false;
        }
    }

    // 3. Renderizar el gráfico con los datos
    function renderChart(seriesData, categories, startYear) {
        if (!browser || !document.getElementById('container')) return;

        if (chartInstance) {
            chartInstance.destroy(); // Destruir instancia previa si existe
        }

        chartInstance = Highcharts.chart('container', {
            chart: {
                type: 'area' // Gráfico de áreas
            },
            title: {
                text: 'Gasto en Pensiones Sociales (Jubilación y Discapacidad)'
            },
            subtitle: {
                text: 'Fuente: API Social Pension Payrolls'
            },
            xAxis: {
                categories: categories, // Años en el eje X
                title: {
                    text: 'Año'
                }
            },
            yAxis: {
                title: {
                    useHTML: true,
                    text: 'Millones de Euros (aproximado)' // Ajusta la unidad según tus datos
                },
                min: 0 // Asegurar que el eje Y empiece en 0
            },
            tooltip: {
                shared: true,
                headerFormat: '<span style="font-size:12px"><b>Año {point.key}</b></span><br>'
                // pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:,.2f}</b><br/>' // Formato para los valores
            },
            plotOptions: {
                series: {
                    // pointStart: startYear, // No es necesario si xAxis.categories está definido
                    marker: {
                        enabled: true,
                        radius: 3
                    }
                },
                area: {
                    stacking: 'normal', // Apilar las áreas
                    lineColor: '#666666',
                    lineWidth: 1,
                    marker: {
                        lineWidth: 1,
                        lineColor: '#666666'
                    }
                }
            },
            series: seriesData // Aquí van los datos procesados de tu API
        });
    }

    onMount(async () => {
        if (browser) {
            // Asegurarse de que Highcharts esté cargado
            if (typeof Highcharts === 'undefined') {
                console.error('Highcharts no está cargado. Asegúrate de que el script esté en <svelte:head>.');
                error = 'Error al cargar la librería de gráficos.';
                isLoading = false;
                return;
            }
            await fetchDataAndPrepareChart();

        }
    });
</script>

<svelte:head>
    <title>Gráfico EBT - Pensiones</title>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
</svelte:head>

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
    #container {
        height: 500px; /* Aumentar un poco la altura */
    }

    .highcharts-figure,
    .highcharts-data-table table {
        min-width: 310px;
        max-width: 90%; /* Hacerlo más responsivo */
        margin: 1em auto;
    }

    .highcharts-data-table table {
        font-family: Verdana, sans-serif;
        border-collapse: collapse;
        border: 1px solid #ebebeb;
        margin: 10px auto;
        text-align: center;
        width: 100%;
        max-width: 600px; /* Ajustar ancho máximo de la tabla */
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
</style>
