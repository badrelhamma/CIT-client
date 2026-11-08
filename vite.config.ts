import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://backend-d4f1.onrender.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/jspdf-autotable"))
            return "pdf-vendor";
          if (id.includes("node_modules/exceljs"))
            return "excel-vendor";
          if (id.includes("node_modules/motion"))
            return "motion-vendor";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/scheduler"))
            return "react-vendor";
          if (id.includes("node_modules"))
            return "vendor";
        },
      },
    },
  },
});
