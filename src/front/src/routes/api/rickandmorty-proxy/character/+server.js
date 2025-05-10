export async function GET({ fetch }) {
    const rickAndMortyApiUrl = `https://rickandmortyapi.com/api/character`;

    try {
        const response = await fetch(rickAndMortyApiUrl);

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
        console.error('Error proxying Rick and Morty API (character endpoint):', error);
        return new Response(JSON.stringify({ message: 'Error al contactar la API de Rick and Morty (character endpoint)' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 