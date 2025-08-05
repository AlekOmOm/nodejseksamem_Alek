// vite config
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// env-file loading
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
   // Load env file based on mode
   const env = loadEnv(mode, process.cwd(), "");

   return {
      root: "./src",
      plugins: [
         svelte({
            compilerOptions: {
               runes: true,
            },
         }),
         tailwindcss(),
      ],
      resolve: {
         alias: {
            $lib: path.resolve("./src/lib"),
         },
      },
      define: {
         // Expose env vars to frontend
         __VITE_API_URL__: JSON.stringify(
            env.VITE_API_URL || "http://localhost:3000"
         ),
      },
      server: {
         port: env.VITE_PORT || 5174,
         proxy: {
            "/api": env.VITE_API_URL || "http://localhost:3000",
            "/socket.io": {
               target: env.VITE_API_URL || "http://localhost:3000",
               ws: true,
            },
         },
      },
   };
});
