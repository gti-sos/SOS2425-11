import { HUBSPOT_ACCESS_TOKEN } from '$env/static/private';
const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

export async function GET({ fetch }) {
    console.log('Proxy: Recibida solicitud GET para contactos de HubSpot');
    try {
        const apiResponse = await fetch(HUBSPOT_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error('Proxy: Error de la API de HubSpot:', errorData);
            // Devolvemos una respuesta con el mismo código de estado y mensaje que la API de HubSpot
            return new Response(JSON.stringify(errorData), {
                status: apiResponse.status,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const data = await apiResponse.json();
        console.log('Proxy: Datos recibidos de HubSpot, enviando al cliente.');
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Proxy: Error interno en el proxy:', error);
        return new Response(JSON.stringify({ message: 'Error interno en el servidor proxy', details: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function POST({ request, fetch }) {
    console.log('Proxy: Recibida solicitud POST para crear contacto en HubSpot');
    try {
        const contactProperties = await request.json(); // ej: { "properties": { "email": "nuevo@ejemplo.com", "firstname": "Nuevo" } }

        const apiResponse = await fetch(HUBSPOT_API_URL, { // HUBSPOT_API_URL es el base para POST
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactProperties),
        });

        const responseData = await apiResponse.json(); // POST devuelve el objeto creado

        if (!apiResponse.ok) {
            console.error('Proxy: Error de la API de HubSpot al crear:', responseData);
            return new Response(JSON.stringify(responseData), {
                status: apiResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('Proxy: Contacto creado exitosamente en HubSpot.');
        return new Response(JSON.stringify(responseData), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Proxy: Error interno en el proxy al crear:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ message: 'Error interno en el servidor proxy', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}