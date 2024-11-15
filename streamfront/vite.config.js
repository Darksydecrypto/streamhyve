import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src")
		}
	},
	esbuild: {
		loader: "jsx",
		include: /src\/.*\.jsx?$/
	},
	optimizeDeps: {
		esbuildOptions: {
			loader: {
				".js": "jsx"
			}
		}
	}
});
