import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Source - https://stackoverflow.com/a/76819565
  // Posted by 20BCS055_Ankur Mishra
  // Retrieved 2026-02-03, License - CC BY-SA 4.0

  define: {
    global: {},
  },
  build: {
    outDir: "dist", // This must match Render's "Publish Directory"
    chunkSizeWarningLimit: 2000, // Optional: silence large JS chunk warnings
    rollupOptions: {
      output: {
        manualChunks: {
          zego: ["@zegocloud/zego-uikit-prebuilt"], // Split large library into separate chunk
        },
      },
    },
  },
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],

//   define: {
//     global: {}, // needed for some UI kits like Zego
//   },

//   // build: {
//   //   outDir: "dist", // This must match Render's "Publish Directory"
//   //   chunkSizeWarningLimit: 2000, // Optional: silence large JS chunk warnings
//   //   rollupOptions: {
//   //     output: {
//   //       manualChunks: {
//   //         zego: ["@zegocloud/zego-uikit-prebuilt"], // Split large library into separate chunk
//   //       },
//   //     },
//   //   },
//   // },
// });
