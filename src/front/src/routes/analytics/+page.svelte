<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // Variables para almacenar datos
    let combinedData = [];
    let isLoading = true;
    let error = null;
    let year = 2024; // Año más reciente por defecto

    // Función para obtener y combinar datos de ambas APIs
    async function fetchAndCombineData() {
        try {
            // Obtener datos de ambas APIs con límite alto para asegurar todos los datos
            const [almResponse, ebtResponse, mtpResponse] = await Promise.all([
                fetch(`/api/v1/autonomy-dependence-applications?limit=100`),
                fetch(`/api/v1/social-pension-payrolls?limit=100`),
                fetch(`/api/v1/management-evolutions?limit=100`)
            ]);

            if (!almResponse.ok || !ebtResponse.ok || !mtpResponse.ok) {
                throw new Error("Error al obtener datos de las APIs");
            }

            // Convertir respuestas a JSON
            const almData = await almResponse.json();
            const ebtData = await ebtResponse.json();
            const mtpData = await mtpResponse.json();

            // Filtrar por el año más reciente
            const almFiltered = almData.filter(item => item.year === year);
            const ebtFiltered = ebtData.filter(item => item.year === year);
            const mtpFiltered = mtpData.filter(item => item.year === year);

            // Crear mapeo de nombres para normalizar entre APIs
            const placeMapping = {
                "Andalucía": "Andalucía",
                "Aragón": "Aragón",
                "Asturias, Principado de": "Asturias",
                "Balears, Illes": "Islas Baleares",
                "Canarias": "Canarias",
                "Cantabria": "Cantabria",
                "Castilla y León": "Castilla y León",
                "Castilla - La Mancha": "Castilla-La Mancha",
                "Cataluña": "Cataluña",
                "Comunitat Valenciana": "Comunitat Valenciana",
                "Extremadura": "Extremadura",
                "Galicia": "Galicia",
                "Madrid, Comunidad de": "Madrid",
                "Murcia, Región de": "Murcia",
                "Navarra, Comunidad Foral de": "Navarra",
                "País Vasco": "País Vasco",
                "Rioja, La": "La Rioja",
                "Ceuta y Melilla": "Ceuta y Melilla"
            };

            // Crear un mapa para almacenar datos combinados
            const dataMap = new Map();

            // Procesar datos de ALM
            almFiltered.forEach(item => {
                const standardPlace = placeMapping[item.place] || item.place;
                
                dataMap.set(standardPlace, {
                    place: standardPlace,
                    dependent_population: item.dependent_population,
                    request_count: item.request,
                    disability_number: 0, // Valores iniciales
                    disability_amount: 0,  // Se actualizarán con datos de EBT
                    legal_residence: 0, // Valores iniciales
                    economical_resource: 0 // Se actualizarán con datos de MTP
                });
            });

            // Integrar datos de EBT
            ebtFiltered.forEach(item => {
                const standardPlace = item.place;
                
                if (dataMap.has(standardPlace)) {
                    // Actualizar datos existentes
                    const existingData = dataMap.get(standardPlace);
                    existingData.disability_number = item.disability_number;
                    existingData.disability_amount = item.disability_amount;
                } else {
                    // Crear nueva entrada si no existe
                    dataMap.set(standardPlace, {
                        place: standardPlace,
                        dependent_population: 0, // No hay datos de ALM
                        request_count: 0,        // No hay datos de ALM
                        disability_number: item.disability_number,
                        disability_amount: item.disability_amount,
                        legal_residence: 0, 
                        economical_resource: 0 
                    });
                }
            });

            // Integrar datos de MTP
            mtpFiltered.forEach(item => {
                const standardPlace = item.place;
                
                if (dataMap.has(standardPlace)) {
                    // Actualizar datos ya existentes
                    const existingData = dataMap.get(standardPlace);
                    existingData.legal_residence = item.legal_residence;
                    existingData.economical_resource = item.economical_resource;
                } else {
                    // Crear nueva entrada si no existe
                    dataMap.set(standardPlace, {
                        place: standardPlace,
                        dependent_population: 0, // No hay datos de ALM
                        request_count: 0,        // No hay datos de ALM
                        disability_number: 0,    // No hay datos de EBT
                        disability_amount: 0,    // No hay datos de EBT
                        legal_residence: item.legal_residence,
                        economical_resource: item.economical_resource
                    });
                }
            });

            // Convertir mapa a array
            combinedData = Array.from(dataMap.values());
            
            console.log("Datos combinados:", combinedData);
            
            isLoading = false;
        } catch (err) {
            console.error("Error al combinar datos:", err);
            error = err.message;
            isLoading = false;
        }
    }

    // Función para crear el gráfico Marimekko con D3
    function createMarimekkoChart() {
        if (!browser || !window.d3 || combinedData.length === 0) return;

        // Limpiar contenedor
        const container = document.getElementById('chart-container');
        container.innerHTML = '';

        const d3 = window.d3;
        
        // Dimensiones del gráfico
        const width = 1100;
        const height = 700;
        const margin = { top: 60, right: 200, bottom: 100, left: 220 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Preparar datos para el gráfico
        // Limitar a 10 comunidades para mejor visualización
        const topCommunities = [...combinedData]
            .sort((a, b) => b.dependent_population - a.dependent_population)
            .slice(0, 12);

        // Preparar datos para el formato Marimekko
        const formattedData = [];
        
        // Definir categorías y sus valores
        const categories = [
            {
                name: "Población Potencialmente Dependiente",
                property: "dependent_population",
                color: "#34A853" // Verde Google
            },
            {
                name: "Solicitudes",
                property: "request_count",
                color: "#4285F4" // Azul Google
            },
            {
                name: "Discapacitados",
                property: "disability_number",
                color: "#EA4335" // Rojo Google
            },
            {
                name: "Ayuda (Millones €)",
                property: "disability_amount",
                color: "#FBBC05", // Amarillo Google
                formatter: (value) => (value / 1000000).toFixed(0)
            },            {
                name: "Residencia Legal",
                property: "legal_residence",
                color: "#f5f542" // Amarillo 
            },
            {
                name: "Recursos Económicos",
                property: "economical_resource",
                color: "#c517cf" // Morado
            }
        ];
        
        // Calcular totales por categoría para dimensionar correctamente
        const categoryTotals = {};
        categories.forEach(cat => {
            categoryTotals[cat.property] = d3.sum(topCommunities, d => d[cat.property]);
        });
        
        // Crear el SVG
        const svg = d3.select('#chart-container')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
            
        // Añadir título
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .text("Dependencia y Ayudas por Comunidad Autónoma (" + year + ")");
        
        // Crear grupo principal con márgenes
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas para posicionar los elementos
        // Escala X para las categorías
        const xScale = d3.scaleBand()
            .domain(categories.map(cat => cat.name))
            .range([0, innerWidth])
            .padding(0.1);
            
        // Escala Y para las comunidades
        const yScale = d3.scaleBand()
            .domain(topCommunities.map(d => d.place))
            .range([0, innerHeight])
            .padding(0.1);
            
        // Escala de color
        const colorScale = d3.scaleOrdinal()
            .domain(categories.map(cat => cat.name))
            .range(categories.map(cat => cat.color));
            
        // Escalas para el tamaño de los rectángulos
        // Cada categoría tiene su propia escala basada en sus valores máximos
        const sizeScales = {};
        categories.forEach(cat => {
            const maxValue = d3.max(topCommunities, d => d[cat.property]);
            sizeScales[cat.property] = d3.scaleLinear()
                .domain([0, maxValue])
                .range([0, xScale.bandwidth()]);
        });
        
        // Ejes X e Y
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);
        
        // Añadir ejes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "bold");
            
        g.append('g')
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "13px")
            .style("font-weight", "bold");
            
        // Crear rectángulos para cada comunidad y categoría
        topCommunities.forEach(community => {
            const y = yScale(community.place);
            
            categories.forEach((category, i) => {
                const x = xScale(category.name);
                const value = community[category.property];
                
                // Calcular tamaño proporcional al valor
                const rectSize = sizeScales[category.property](value);
                
                // Dibujar rectángulo
                g.append("rect")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("width", rectSize)
                    .attr("height", yScale.bandwidth())
                    .attr("fill", category.color)
                    .attr("stroke", "white")
                    .attr("stroke-width", 1)
                    .on("mouseover", function(event) {
                        // Destacar el rectángulo al pasar el mouse
                        d3.select(this)
                            .attr("stroke", "#333")
                            .attr("stroke-width", 2);
                        
                        // Mostrar tooltip
                        const formatted = category.formatter ? 
                            category.formatter(value) : 
                            value.toLocaleString('es-ES');
                        
                        const tooltip = d3.select("#tooltip");
                        tooltip.style("display", "block")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 25) + "px")
                            .html(`
                                <div class="tooltip-content">
                                    <strong>${community.place}</strong><br>
                                    ${category.name}: ${formatted}
                                </div>
                            `);
                    })
                    .on("mouseout", function() {
                        // Restaurar estilo normal
                        d3.select(this)
                            .attr("stroke", "white")
                            .attr("stroke-width", 1);
                        
                        // Ocultar tooltip
                        d3.select("#tooltip").style("display", "none");
                    });
                
                // Si el rectángulo es lo suficientemente grande, mostrar el valor dentro
                if (rectSize > 50) {
                    g.append("text")
                        .attr("x", x + rectSize / 2)
                        .attr("y", y + yScale.bandwidth() / 2)
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .style("fill", "white")
                        .style("font-size", "14px")
                        .style("font-weight", "bold")
                        .style("pointer-events", "none")
                        .text(category.formatter ? 
                            category.formatter(value) : 
                            value >= 10000 ? (value / 1000).toFixed(0) + "k" : value);
                }
            });
        });
        
        // Añadir leyenda
        const legend = svg.append('g')
            .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
            
        categories.forEach((category, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);
                
            legendRow.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', category.color);
                
            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .text(category.name);
        });
        
        // Añadir texto para explicar el gráfico
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-style", "italic")
            .text("El ancho de las barras es proporcional al valor de cada categoría");
    }

    // Cargar biblioteca D3.js desde CDN
    function loadD3() {
        if (!browser) return Promise.resolve();
        
        if (window.d3) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Error cargando D3.js'));
            document.head.appendChild(script);
        });
    }

    onMount(async () => {
        try {
            // Cargar D3.js
            await loadD3();
            
            // Obtener datos
            await fetchAndCombineData();
            
            // Crear gráfico
            if (!error && combinedData.length > 0) {
                createMarimekkoChart();
            }
        } catch (err) {
            console.error("Error en la inicialización:", err);
            error = "Error en la inicialización: " + err.message;
        }
    });
</script>

<svelte:head>
    <title>Análisis integrado de dependencia</title>
</svelte:head>

<main class="container">
    <h1>Análisis integrado de población dependiente</h1>
    <p class="subtitle">Visualización conjunta de datos de dependencia y ayudas por Comunidad Autónoma</p>
    
    <div class="navigation-links">
        <a href="/ALM/graph" class="nav-link">Ver gráfico de tendencias</a>
        <a href="/ALM/cartogram" class="nav-link">Ver cartograma</a>
    </div>
    
    {#if isLoading}
        <div class="loading">Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else if combinedData.length === 0}
        <div class="error">No hay datos disponibles para visualizar</div>
    {:else}
        <div id="chart-container" class="chart-container"></div>
        <div id="tooltip"></div>
        
        <div class="explanation">
            <h2>Interpretación del gráfico</h2>
            <p>Este gráfico Marimekko muestra la distribución de la población dependiente por comunidad autónoma del año {year}:</p>
            <ul>
                <li><strong>Ancho de las barras:</strong> Proporcional al valor de cada categoría para cada comunidad autónoma.</li>
                <li><strong>Secciones de color:</strong>
                    <ul>
                        <li><span class="color-box green"></span> <strong>Población Potencialmente Dependiente:</strong> Personas que por edad o condición son consideradas potencialmente dependientes.</li>
                        <li><span class="color-box blue"></span> <strong>Solicitudes:</strong> Personas que han solicitado ayudas de dependencia.</li>
                        <li><span class="color-box red"></span> <strong>Discapacitados:</strong> Personas que reciben prestaciones por discapacidad.</li>
                        <li><span class="color-box yellow"></span> <strong>Ayuda (Millones €):</strong> Importe económico de las ayudas en millones de euros.</li>
                        <li><span class="color-box light-yellow"></span> <strong>Residencia Legal:</strong> Número de solicitudes rechazadas a causa de la residencia legal del solicitante.</li>
                        <li><span class="color-box purple"></span> <strong>Recursos económicos:</strong> Número de solicitudes rechazadas a causa de los recursos económicos del solicitante.</li>
                    </ul>
                </li>
            </ul>
            <p>Los datos combinan información de las APIs de aplicaciones de dependencia (ALM), nóminas de pensiones sociales (EBT) y gestión de ayudas sociales (MTP), permitiendo comparar la proporción entre la población potencialmente dependiente, las solicitudes realizadas, y las ayudas finalmente concedidas.</p>
        </div>
    {/if}
</main>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    }
    
    h1 {
        color: #333;
        text-align: center;
        margin-bottom: 10px;
    }
    
    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 30px;
        font-style: italic;
    }
    
    .navigation-links {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .nav-link {
        display: inline-block;
        padding: 10px 20px;
        background-color: #1976d2;
        color: #fff;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.2s;
    }
    
    .nav-link:hover {
        background-color: #125ea2;
    }
    
    .loading {
        text-align: center;
        padding: 50px;
        font-style: italic;
        color: #666;
    }
    
    .error {
        text-align: center;
        padding: 50px;
        color: #d32f2f;
        font-weight: bold;
    }
    
    .chart-container {
        width: 100%;
        overflow-x: auto;
        margin-bottom: 40px;
        min-height: 700px;
    }
    
    .explanation {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 5px;
        margin-top: 20px;
    }
    
    .explanation h2 {
        color: #333;
        margin-top: 0;
    }
    
    .color-box {
        display: inline-block;
        width: 15px;
        height: 15px;
        margin-right: 5px;
        vertical-align: middle;
    }
    
    .blue { background-color: #4285F4; }
    .red { background-color: #EA4335; }
    .yellow { background-color: #FBBC05; }
    .green { background-color: #34A853; }
    .light-yellow { background-color: #f5f542; }
    .purple { background-color: #c517cf; }
    
    /* Estilos para tooltips más bonitos */
    #tooltip {
        position: absolute;
        display: none;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    }
    
    .tooltip-content {
        max-width: 200px;
    }
</style> 