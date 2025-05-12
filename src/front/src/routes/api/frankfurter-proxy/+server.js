export async function GET({ fetch }) {
    // URL base de la API de Frankfurter
    const frankfurterApiBaseUrl = 'https://api.frankfurter.app';

    // --- Definir la solicitud fija aquí ---
    const baseCurrency = 'EUR';
    const targetCurrencies = ['USD', 'GBP'];

    // Calcular fechas para los últimos 30 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const getFormattedDate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formattedStartDate = getFormattedDate(startDate);
    const formattedEndDate = getFormattedDate(endDate);

    const fixedApiEndpoint = `${formattedStartDate}..${formattedEndDate}?from=${baseCurrency}&to=${targetCurrencies.join(',')}`;
    const targetUrl = `${frankfurterApiBaseUrl}/${fixedApiEndpoint}`;


    console.log(`[SvelteKit Fixed Proxy] Forwarding request to Frankfurter API: ${targetUrl}`);

    try {
        const response = await fetch(targetUrl);
        const responseBody = await response.text(); 

        if (!response.ok) {
            console.error(`[SvelteKit Fixed Proxy] Error from Frankfurter API (${response.status}) for ${targetUrl}: ${responseBody}`);
        } else {
            console.log(`[SvelteKit Fixed Proxy] Successfully fetched data from Frankfurter API (${response.status}) for ${targetUrl}.`);
        }
        
        const headers = new Headers();
        if (response.headers.has('Content-Type')) {
            headers.set('Content-Type', response.headers.get('Content-Type'));
        }

        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });

    } catch (error) {
        console.error(`[SvelteKit Fixed Proxy] Network or other error proxying Frankfurter API for ${targetUrl}:`, error);
        return new Response(JSON.stringify({ message: 'Error interno del proxy al contactar la API de Frankfurter' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}