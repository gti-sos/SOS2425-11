<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isLoading = true;
    let error = null;
    let chartInstance = null;
    let canvasElement;

    // Variables para los datos preparados y el título
    let preparedDatasets = [];
    let preparedTitle = 'Cargando Parques Nacionales...';
    let dataIsReadyForChart = false;

    const API_URL = 'https://sos2425-13.onrender.com/api/v2/national-parks';

    const colorPalette = [
        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(102, 255, 83, 0.7)',
        'rgba(255, 83, 102, 0.7)'
    ];
    let communityColorMap = new Map();
    let colorIndex = 0;

    function getCommunityColor(community) {
        if (!communityColorMap.has(community)) {
            communityColorMap.set(community, colorPalette[colorIndex % colorPalette.length]);
            colorIndex++;
        }
        return communityColorMap.get(community);
    }

    async function fetchDataAndPrepare() {
        if (!browser) return;
        isLoading = true;
        error = null;
        dataIsReadyForChart = false; // Reset
        preparedTitle = 'Cargando Parques Nacionales...';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        console.log('[G13 PARKS] Fetching data from:', API_URL);

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const parksData = await response.json();
            console.log('[G13 PARKS] Data received (first 5):', parksData.slice(0, 5));

            if (!parksData || parksData.length === 0) {
                preparedTitle = 'No hay datos de parques nacionales disponibles.';
                error = preparedTitle; 
                preparedDatasets = [];
                dataIsReadyForChart = true; 
                return;
            }

            const datasetsByCommunity = {};
            communityColorMap.clear(); 
            colorIndex = 0;

            parksData.forEach(park => {
                if (!park.autonomous_community || park.declaration_date == null || park.current_area == null || park.initial_area == null) {
                    console.warn('[G13 PARKS] Skipping park with missing data:', park);
                    return;
                }

                const community = park.autonomous_community;
                if (!datasetsByCommunity[community]) {
                    datasetsByCommunity[community] = {
                        label: community,
                        data: [],
                        backgroundColor: getCommunityColor(community),
                        borderColor: getCommunityColor(community).replace('0.7', '1'),
                        borderWidth: 1
                    };
                }
                
                const radiusScaleFactor = 50; 
                // AJUSTE AQUÍ: Cambiado el multiplicador para reducir el tamaño de las burbujas
                const bubbleRadius = Math.max(5, Math.sqrt(park.initial_area) / radiusScaleFactor * 8);


                datasetsByCommunity[community].data.push({
                    x: park.declaration_date,
                    y: park.current_area,
                    r: bubbleRadius,
                    name: park.national_park,
                    initialArea: park.initial_area,
                    currentArea: park.current_area,
                    community: park.autonomous_community,
                    declarationDate: park.declaration_date
                });
            });

            preparedDatasets = Object.values(datasetsByCommunity);
            
            if (preparedDatasets.length === 0) {
                preparedTitle = 'No hay datos válidos para mostrar en el gráfico.';
            } else {
                preparedTitle = 'Parques Nacionales: Año Declaración vs Área Actual (Tamaño por Área Inicial)';
            }
            dataIsReadyForChart = true; 

        } catch (errCatch) {
            console.error('[G13 PARKS] Error fetching or processing data:', errCatch);
            error = errCatch.message;
            preparedTitle = 'Error al cargar los datos de Parques Nacionales.';
            preparedDatasets = []; 
            dataIsReadyForChart = true; 
        } finally {
            isLoading = false;
        }
    }
    
    // Declaración reactiva para renderizar el gráfico
    $: if (browser && canvasElement && dataIsReadyForChart && !isLoading && !error && typeof Chart !== 'undefined') {
        console.log('[G13 PARKS REACTIVE RENDER] Condiciones cumplidas. Renderizando gráfico.');
        renderBubbleChart(preparedDatasets, preparedTitle);
    } else if (browser && dataIsReadyForChart && !isLoading && !error && !canvasElement) {
        console.warn('[G13 PARKS REACTIVE RENDER] Datos listos, pero canvasElement aún no está definido.');
    }


    function renderBubbleChart(datasets, title) { 
        if (!canvasElement || typeof Chart === 'undefined') { 
            console.error('[G13 PARKS RENDER] Canvas o Chart.js no disponible en renderBubbleChart.');
            return;
        }
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (!datasets || datasets.length === 0) {
            console.warn('[G13 PARKS RENDER] No hay datasets para renderizar.');
            return;
        }

        const data = {
            datasets: datasets
        };

        const config = {
            type: 'bubble',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // AJUSTE AQUÍ: Añadido padding al layout
                layout: {
                    padding: {
                        top: 10,
                        right: 15, 
                        bottom: 10,
                        left: 10
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title, 
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = context.raw;
                                return [
                                    `${item.name} (${item.community})`,
                                    `Año Declaración: ${item.declarationDate}`,
                                    `Área Inicial: ${item.initialArea.toLocaleString()} ha (Burbuja r=${context.element.r.toFixed(1)})`,
                                    `Área Actual: ${item.currentArea.toLocaleString()} ha`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Año de Declaración'
                        },
                        type: 'linear',
                        ticks: {
                            stepSize: 5 
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Área Actual (hectáreas)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        };

        try {
            chartInstance = new Chart(canvasElement, config);
            console.log('[G13 PARKS RENDER] Gráfico de burbujas creado.');
        } catch (e) {
            console.error('[G13 PARKS RENDER] Error al crear Chart:', e);
            error = 'Error al renderizar el gráfico de burbujas.';
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
                    preparedTitle = 'Error de librería de gráficos';
                    console.error(error);
                }
            }, 100);
        }
    });
</script>

<svelte:head>
    <title>Integración G13 - Parques Nacionales (Burbujas)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="chart-container-g13-parks">
    {#if isLoading}
        <p>{preparedTitle}</p> 
    {:else if error}
        <p style="color: red;">{error}</p> 
        <button on:click={fetchDataAndPrepare}>Reintentar</button>
    {:else}
        <canvas bind:this={canvasElement} style:display={chartInstance && preparedDatasets.length > 0 ? 'block' : 'none'}></canvas>
        {#if !chartInstance || (preparedDatasets.length === 0 && !isLoading)} 
            <p>{preparedTitle}</p>
        {/if}
    {/if}
</div>

<style>
    .chart-container-g13-parks {
        position: relative;
        margin: 1.5em auto;
        height: 75vh; 
        width: 90vw;
        max-width: 1000px; 
        border: 1px solid #ddd;
        padding: 15px;
        background-color: #fdfdfd;
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
    .chart-container-g13-parks p {
        margin: 0;
        font-size: 1.2em;
        color: #333;
    }
    button {
        display: block;
        margin: 20px auto;
        padding: 10px 20px;
        font-size: 1em;
        cursor: pointer;
        background-color: #28a745; 
        color: white;
        border: none;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    button:hover {
        background-color: #218838;
    }
</style>