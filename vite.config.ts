import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        contentScript: "src/contentScript.ts",
        main: "index.html",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Use a custom name for the contentScript script bundle
          if (chunkInfo.name === "contentScript") {
            return "contentScript.bundle.js";
          }
          // Default naming scheme for other assets
          return "assets/[name].[hash].js";
        },
        dir: "dist", // Output directory
      },
    },
  },
});
