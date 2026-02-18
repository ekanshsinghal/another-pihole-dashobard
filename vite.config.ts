import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [react()],
		server: {
			port: Number(env.VITE_PORT) || 5173,
			proxy: {
				'/api': {
					target: env.PIHOLE,
					changeOrigin: true,
					secure: false,
					// rewrite: (path) => path.replace(/^\/api/, ''), // Optional: strip /api prefix if backend expects / directly
				},
			},
		},
	};
});
