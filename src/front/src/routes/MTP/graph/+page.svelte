<script>
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';
    import { onDestroy } from 'svelte';

    // URL de la API para MTP
    const API_URL = '/api/v1/management-evolutions'; // Ajusta si es diferente

    let chartData = null;
    let isLoading = true;
    let error = null;
    let chartInstance = null;

    // Definir los nombres de las métricas para las categorías y tooltips
    const metricNames = {
         age: 'Rechazados por Edad',
         legal_residence: 'Lugar de Residencia',
         economical_resource: 'Renta',
         incompatible_benefit: 'Incompatibilidad Subvenciones'
    };
    const metrics = Object.keys(metricNames); // ['age', 'legal_residence', ...]


    // 1. Obtener datos de la API y preparar para Highcharts (Radial Apilado)
    async function fetchDataAndPrepareChart() {
        if (!browser) return; // Solo ejecutar en el navegador

        isLoading = true;
        error = null;
        // Limpiar gráfico anterior si existe antes de cargar
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        chartData = null; // Limpiar datos previos

        try {
            const response = await fetch(`${API_URL}`); // Obtener todos los datos disponibles
            if (!response.ok) {
                throw new Error(`Error al cargar datos de la API: ${response.status} ${response.statusText}`);
            }
            const rawData = await response.json();

            if (!rawData || rawData.length === 0) {
                error = "No hay datos disponibles para mostrar en el gráfico.";
                isLoading = false;
                return; // Salir si no hay datos
            }

            // --- 2. Procesar los datos para Highcharts (Radial Apilado) ---
            // Objetivo: Sumar las 4 métricas para cada PLACE a lo largo de todos los años
            const placesMetricsSum = {}; // { "Andalucía": { age: sum, legal_residence: sum, ... }, ... }

            rawData.forEach(item => {
                 // Validar item y place/métricas
                if (!item.place || item.year === undefined) {
                     // console.warn('Saltando item incompleto para procesamiento radial:', item);
                     return;
                }

                if (!placesMetricsSum[item.place]) {
                    placesMetricsSum[item.place] = {};
                    metrics.forEach(m => placesMetricsSum[item.place][m] = 0);
                }

                metrics.forEach(m => {
                    const value = parseFloat(item[m]);
                    if (!isNaN(value)) {
                         placesMetricsSum[item.place][m] += value; // Sumar el valor de la métrica
                    }
                });
            });

            // Ahora formatear para las series de Highcharts (cada métrica es una serie, los lugares son categorías)
            const seriesData = [];
            const chartCategories = Object.keys(placesMetricsSum).sort(); // Nombres de los lugares como categorías del eje X (angular)

            // Crear una serie por cada MÉTRICA
            metrics.forEach(metricKey => {
                 const metricName = metricNames[metricKey];
                 const dataPoints = chartCategories.map(placeName => {
                     // Obtener el valor sumado de esta métrica para este lugar
                     return placesMetricsSum[placeName] ? placesMetricsSum[placeName][metricKey] : 0;
                 });

                 seriesData.push({
                     name: metricName, // El nombre de la serie es el nombre de la métrica
                     data: dataPoints // Los puntos son los valores de esta métrica para cada lugar
                 });
            });

            // Ordenar las series para que aparezcan en un orden consistente (opcional, por nombre de métrica)
            seriesData.sort((a, b) => a.name.localeCompare(b.name));


            if (seriesData.length === 0 || chartCategories.length === 0) {
                 error = "No se pudieron generar series o categorías para el gráfico a partir de los datos recibidos.";
                 isLoading = false;
                 return;
             }

            chartData = {
                 series: seriesData,
                 categories: chartCategories // Guardamos las categorías (lugares)
            };
            // --- Fin Procesamiento ---

            isLoading = false;

            await tick();

            const containerElement = document.getElementById('container-radial');

            if (chartData && containerElement) {
                renderChart(chartData.series, chartData.categories, containerElement);
            } else {
                 console.error("Elemento contenedor #container-radial no encontrado después de tick() o chartData es nulo.");
                 if (!error) {
                     error = "Error interno: No se pudo encontrar el área para dibujar el gráfico después de actualizar el DOM.";
                 }
            }


        } catch (err) {
            console.error('Error al cargar o procesar datos para el gráfico:', err);
            error = err.message;
            isLoading = false;
        }
    }

    // 3. Renderizar el gráfico con los datos (usando Highcharts Radial Apilado)
    function renderChart(seriesData, categories, containerElement) {
        if (!browser || !containerElement) {
            console.warn("No se puede renderizar: No en el navegador o elemento contenedor no proporcionado.");
            return;
        }

        if (typeof Highcharts === 'undefined' || !Highcharts.Chart) {
            error = 'Highcharts no está cargado. Asegúrate de que el script esté en <svelte:head>.';
            console.error(error);
            isLoading = false;
            return;
        }

         if (chartInstance) {
             chartInstance.destroy();
             chartInstance = null;
         }

        chartInstance = Highcharts.chart(containerElement, {
            chart: {
                polar: true, // Habilitar coordenadas polares
                type: 'column' // Usar tipo columna para los segmentos
                 // Puedes añadir opciones de renderizado aquí si necesitas ajustar algo visual
            },
            title: {
                text: 'Total de Rechazados por Categoría y Comunidad Autónoma'
            },
             subtitle: {
                text: 'Suma de datos de todos los años por Comunidad Autónoma'
            },
            pane: { // Configuración del área circular
                size: '85%', // Tamaño del panel polar
                innerSize: '20%' // Tamaño del agujero central (opcional)
            },
            xAxis: { // Eje angular (las categorías, ahora son los LUGARES)
                 categories: categories, // Los nombres de los lugares
                tickmarkPlacement: 'on',
                lineWidth: 0
            },
            yAxis: { // Eje radial (los valores apilados)
                 // Este eje representa los valores de las métricas apiladas.
                 // El jsfiddle original no muestra ticks en este eje, solo las categorías radiales (nombres de países/lugares).
                 // Para ocultar los ticks y etiquetas del eje Y (radial):
                 labels: { enabled: false }, // Oculta las etiquetas de valor
                 tickAmount: 0, // No genera ticks
                 min: 0, // Es probable que quieras que empiece en 0
                gridLineInterpolation: 'polygon', // Dibuja la red como un polígono (radio)
                lineWidth: 0 // Sin línea de eje principal
                // Puedes añadir un título al eje Y si quieres, aunque no es común en este tipo de gráfico radial
                // title: { text: 'Valor Sumado' }
                 // Configuración de los ticks si necesitas controlar el rango o los pasos
                 // tickInterval: 50, // Ejemplo: si los valores son grandes y quieres mostrar ticks
                 // showFirstLabel: false, // Oculta la primera etiqueta (en 0) si el min es 0
            },
            tooltip: {
                 shared: true, // Importante para mostrar todos los segmentos de una columna (lugar)
                 // Formato del tooltip al pasar el ratón sobre una columna (lugar)
                 formatter: function() {
                     let tooltip = `<b>${this.x}</b><br/>`; // El nombre del lugar (Eje X)
                     this.points.forEach(point => {
                        // point.series.name es el nombre de la métrica (nombre de la serie)
                         tooltip += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: ${Highcharts.numberFormat(point.y, 0)}<br/>`; // Formato número sin decimales
                     });
                     return tooltip;
                 }
            },
            series: seriesData, // Tus datos formateados (cada métrica es una serie)
             // Opciones específicas para las series de columnas en gráfico polar
            plotOptions: {
                column: {
                    stacking: 'normal', // Apila los segmentos de métrica en cada columna (lugar)
                    borderWidth: 0, // Eliminar bordes entre segmentos apilados
                    pointPadding: 0, // Controla el espacio ENTRE COLUMNAS (lugares)
                    groupPadding: 0.05 // Controla el espacio entre grupos (mínimo espacio para que se vean separadas las columnas/líneas)
                     // Puedes ajustar el ancho de las "líneas" radiales si usas pointWidth o columnIndex/groupPadding
                     // pointWidth: 20 // Ancho fijo en píxeles, ajusta según prefieras
                },
                 // Si quieres colores específicos para cada métrica (serie), añádelos en la definición de la serie
                 // O puedes usar un mapa de colores global si Highcharts lo permite para este tipo específico
                 // colors: ['#FFC107', '#9E9E9E', '#FF5722', '#795548'] // Ejemplo de colores para las 4 métricas (si se definen globalmente)
            },
             // Puedes añadir opciones globales como colores por defecto aquí
             // colors: ['#FFC107', '#9E9E9E', '#FF5722', '#795548', '#2196F3', '#4CAF50', '#FF9800'] // Un set de colores más amplio
        });
    }

    // Cargar datos y renderizar al montar el componente
    onMount(async () => {
         if (browser) {
             // Esperar a que Highcharts esté disponible desde el CDN
             let attempts = 0;
             const maxAttempts = 50; // Espera hasta 5 segundos
             const checkHighchartsInterval = setInterval(async () => {
                 attempts++;
                 // Highcharts y sus módulos se cargan en el objeto global 'Highcharts'
                 // También verifica HighchartsMore para estar seguros si se necesita
                 if (typeof Highcharts !== 'undefined' && Highcharts.Chart && Highcharts.seriesTypes.column) {
                     clearInterval(checkHighchartsInterval);
                     console.log("Highcharts loaded.");
                     await fetchDataAndPrepareChart();
                 } else if (attempts >= maxAttempts) {
                     clearInterval(checkHighchartsInterval);
                     error = "No se pudo cargar Highcharts o sus módulos necesarios desde el CDN.";
                     isLoading = false;
                     console.error(error);
                 }
             }, 100);
         }
    });

    // Limpiar el gráfico al destruir el componente para liberar recursos
    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

</script>

<svelte:head>
    <title>Gráfico MTP - Ayudas Sociales Radial</title>
    <!-- Importa Highcharts y módulos necesarios desde CDN -->
    <script src="https://code.highcharts.com/highcharts.js"></script>
     <!-- Necesitas este módulo para gráficos polares/radiales y de tipo 'column' en polar -->
    <script src="https://code.highcharts.com/highcharts-more.js"></script>
     <!-- Opcionales: exportación, datos, accesibilidad -->
     <!-- <script src="https://code.highcharts.com/modules/exporting.js"></script> -->
     <!-- <script src="https://code.highcharts.com/modules/export-data.js"></script> -->
     <!-- <script src="https://code.highcharts.com/modules/accessibility.js"></script> -->
</svelte:head>

<main>
    <h1 style="text-align: center; margin-bottom: 20px;">Gráfico: Total Rechazados por Categoría y Comunidad Autónoma</h1>

    {#if isLoading}
        <p>Cargando datos para el gráfico...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
        <button on:click={fetchDataAndPrepareChart}>Reintentar</button>
    {:else if chartData}
        <!-- Contenedor para el gráfico Highcharts -->
        <!-- Usar un div con estilos en línea para el tamaño como en el jsfiddle original -->
        <div id="container-radial" style="min-width: 310px; max-width: 600px; height: 400px; margin: 0 auto">
        </div>
        <p style="text-align: center; margin-top: 10px; font-size: 0.9em;">Cada línea curva representa una Comunidad Autónoma. Los segmentos de la línea muestran la suma total de rechazos por cada categoría (Edad, Lugar de Residencia, Renta, Incompatibilidad de Subvenciones) para esa comunidad a lo largo de todos los años.</p>

    {:else}
        <p>No hay datos disponibles para mostrar en el gráfico.</p>
         <button on:click={fetchDataAndPrepareChart}>Cargar Datos</button>
    {/if}
</main>

<style>
    /* Puedes añadir estilos adicionales aquí si es necesario */
     main {
        padding: 20px;
     }
     p {
        text-align: center;
        margin-top: 10px;
     }
     button {
        display: block;
        margin: 10px auto;
        padding: 8px 15px;
        cursor: pointer;
     }
      /* Si no usas estilos en línea en el HTML para el tamaño del contenedor */
     /* #container-radial {
         min-width: 310px;
         max-width: 600px;
         height: 400px;
         margin: 0 auto;
     } */
</style>
