export async function GET() {
    return new Response(JSON.stringify({ message: 'Hola desde el endpoint de prueba!' }), {
        headers: { 'Content-Type': 'application/json' }
    });
} 