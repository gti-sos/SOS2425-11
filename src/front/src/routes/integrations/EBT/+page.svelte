<script>
    // import { path } from 'express/lib/application'; // Eliminada esta línea
    import { onMount } from 'svelte';

    // Define aquí las integraciones específicas de tu carpeta EBT
    const otherIntegrations = [
        {
            name: 'G10 - Estadísticas de Registros (Radar con chart.js)',
            path: '/integrations/EBT/g10-registration-stats'
        },
        {
            name: 'G16 - Estadísticas de Emigración (Área Polar con chart.js)',
            path: '/integrations/EBT/g16-emigration-stats'
        },
        {
            name: 'G12 - Estadísticas de consumo (Barras con chart.js)',
            path: '/integrations/EBT/g12-annual-consumptions'
        },
        {
            name: 'G13 - Estadísticas de parques nacionales (Burbujas con chart.js)',
            path: '/integrations/EBT/g13-national-parks'
        },
        {
            name: 'G14 - Estadísticas de delitos cibernéticos (Dispersión con chart.js)',
            path: '/integrations/EBT/g14-cybercrime-data'
        },
        {
            name: 'Población española (API Ninjas, Oauth, Proxy, Barras con Plotly)',
            path: '/integrations/EBT/api-ninjas-ebt-correlation'
        }
        
    ];

</script>

<main>
    <h1>Portal de Integraciones EBT</h1>
    <p>
        Esta página sirve como punto de acceso para las visualizaciones de datos desarrolladas en el contexto de EBT.
    </p>

    {#if otherIntegrations.length > 0}
        <h2>Integraciones EBT Disponibles</h2>
        <p>Selecciona una integración de la lista para ver sus detalles:</p>
        <ul>
            {#each otherIntegrations as integration}
                <li>
                    <a href="{integration.path}">{integration.name}</a>
                </li>
            {/each}
        </ul>
    {:else}
        <h2>Integraciones EBT</h2>
        <p>No hay integraciones configuradas para mostrar en esta carpeta. Edita el array 'otherIntegrations' en el script de esta página para añadir enlaces.</p>
    {/if}


</main>

<style>
    main {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        padding: 20px 30px;
        max-width: 800px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h1 {
        color: #1a2b48; /* Azul oscuro */
        text-align: center;
        margin-bottom: 25px;
        font-size: 2em;
    }

    h2 {
        color: #2c3e50; /* Azul grisáceo */
        margin-top: 35px;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #eaecee; /* Gris claro */
        font-size: 1.5em;
    }

    p {
        line-height: 1.65;
        color: #333333;
        margin-bottom: 15px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin-bottom: 10px;
        background-color: #f8f9fa; /* Gris muy claro */
        border-radius: 6px;
        transition: background-color 0.2s ease-in-out;
    }

    li:hover {
        background-color: #e9ecef; /* Gris un poco más oscuro al pasar el ratón */
    }

    a {
        display: block;
        padding: 12px 18px;
        text-decoration: none;
        color: #007bff; /* Azul brillante */
        font-weight: 500;
        font-size: 1.1em;
        transition: color 0.2s ease-in-out;
    }

    a:hover {
        color: #0056b3; /* Azul más oscuro al pasar el ratón */
    }
</style>