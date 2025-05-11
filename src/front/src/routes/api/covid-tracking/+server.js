export async function GET({ fetch }) {
    const covidApiUrl = `https://api.covidtracking.com/v1/us/daily.json`;

    try {
        const response = await fetch(covidApiUrl);

        if (!response.ok) {
            const errorData = await response.text();
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
        console.error('Error proxying COVID Tracking API:', error);
        return new Response(JSON.stringify({ message: 'Error al contactar la API de COVID Tracking' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}