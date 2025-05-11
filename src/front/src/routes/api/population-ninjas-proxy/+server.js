import {env} from '$env/dynamic/private'; // Para acceder a variables de entorno privadas

export async function GET({ fetch }) {
    const apiNinjasUrl = `https://api.api-ninjas.com/v1/population?country=Spain`;
    
    const apiKey = env.API_NINJAS_KEY;

    if (!apiKey) {
        console.error('API_NINJAS_KEY no está configurada en las variables de entorno.');
        return new Response(JSON.stringify({ message: 'Error de configuración del servidor: API Key no encontrada.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(apiNinjasUrl, {
            headers: {
                'X-Api-Key': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`API Ninjas Error (${response.status}): ${errorData}`);
            return new Response(errorData, {
                status: response.status,
                statusText: response.statusText
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error proxying API Ninjas Population API:', error);
        return new Response(JSON.stringify({ message: 'Error al contactar la API de Población (API Ninjas)' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}