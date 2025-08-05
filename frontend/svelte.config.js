import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
   preprocess: vitePreprocess(),
   compilerOptions: {
      runes: true,
   },
   // Disable inspector to avoid module resolution issues
   vitePlugin: {
      inspector: false,
   },
};
