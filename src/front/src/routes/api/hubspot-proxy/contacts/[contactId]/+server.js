import { HUBSPOT_ACCESS_TOKEN } from '$env/static/private';
const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

/**
 * @param {{ params: { contactId: any; }; request: any; fetch: any; }} RequestEvent
 */
export async function DELETE({ params, fetch }) {
    const { contactId } = params;
    console.log(`Proxy: Recibida solicitud DELETE para contacto ID: ${contactId}`);

    try {
        const apiResponse = await fetch(`${HUBSPOT_API_BASE_URL}/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
            },
        });

        if (!apiResponse.ok) {
            // Si HubSpot devuelve un cuerpo de error en JSON, lo pasamos.
            // A veces para DELETE con error puede no haber cuerpo o no ser JSON.
            try {
                const errorData = await apiResponse.json();
                console.error('Proxy: Error de la API de HubSpot al eliminar:', errorData);
                return new Response(JSON.stringify(errorData), {
                    status: apiResponse.status,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (e) {
                // Si no hay cuerpo JSON o falla el parseo, devolvemos el estado y texto.
                console.error('Proxy: Error de la API de HubSpot al eliminar (sin JSON):', apiResponse.statusText);
                return new Response(apiResponse.statusText, { status: apiResponse.status });
            }
        }

        console.log(`Proxy: Contacto ID: ${contactId} eliminado exitosamente.`);
        // HubSpot devuelve 204 No Content para DELETE exitoso, lo replicamos.
        return new Response(null, { status: 204 });

    } catch (error) {
        console.error('Proxy: Error interno en el proxy al eliminar:', error);
        return new Response(JSON.stringify({ message: 'Error interno en el servidor proxy', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

/**
 * @param {{ params: { contactId: any; }; request: any; fetch: any; }} RequestEvent
 */
export async function PATCH({ params, request, fetch }) {
    const { contactId } = params;
    console.log(`Proxy: Recibida solicitud PATCH para contacto ID: ${contactId}`);

    try {
        const propertiesToUpdate = await request.json();

        const apiResponse = await fetch(`${HUBSPOT_API_BASE_URL}/${contactId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(propertiesToUpdate), // HubSpot espera un objeto, ej: { "properties": { "firstname": "NuevoNombre" } }
        });

        const responseData = await apiResponse.json(); // PATCH devuelve el objeto actualizado

        if (!apiResponse.ok) {
            console.error('Proxy: Error de la API de HubSpot al actualizar:', responseData);
            return new Response(JSON.stringify(responseData), {
                status: apiResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log(`Proxy: Contacto ID: ${contactId} actualizado exitosamente.`);
        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Proxy: Error interno en el proxy al actualizar:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ message: 'Error interno en el servidor proxy', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 