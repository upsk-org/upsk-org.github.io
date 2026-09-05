import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        tutors: resolve(import.meta.dirname, "tutors.html"),
        booking: resolve(import.meta.dirname, "booking.html")
      }
    }
  }
});
