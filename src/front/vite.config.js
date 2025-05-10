import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			'/api/v1': {
				target: 'http://localhost:16078',
				changeOrigin: true,
				// secure: false,
				// rewrite: (path) => path.replace(/^\/api\/v1/, ''),
			}
		}
	},
	// Configuración para que Highcharts funcione correctamente con SSR (Server-Side Rendering) 
	ssr: {
		noExternal: ['highcharts']
	}
});
