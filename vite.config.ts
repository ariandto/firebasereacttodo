// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa'; // Import VitePWA

export default defineConfig({
  plugins: [
    tailwindcss(), // Plugin Tailwind CSS Anda
    VitePWA({
      registerType: 'autoUpdate', // Mengatur tipe pendaftaran service worker
      injectRegister: 'auto',    // Mengatur injeksi kode pendaftaran service worker
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,gif,json}'], // Pola file yang akan di-cache
      },
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        // Tambahkan aset lain yang perlu di-cache di sini
      ],
      manifest: {
        name: 'To do List App', // Nama lengkap aplikasi
        short_name: 'ToDoApp',    // Nama singkat aplikasi (muncul di layar HP)
        description: 'to do List App - Your own task',
        theme_color: '#ffffff',    // Warna tema untuk browser/status bar
        background_color: '#ffffff', // Warna latar belakang splash screen
        display: 'standalone',     // Mode tampilan (penting untuk PWA)
        scope: '/',                // Lingkup PWA
        start_url: '/',            // URL awal saat aplikasi diluncurkan
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // Untuk mendukung berbagai bentuk ikon di Android
          },
          // Anda bisa menambahkan ukuran ikon lain di sini (misal: 144x144, 256x256)
        ],
      },
      // Aktifkan devOptions jika Anda ingin menguji PWA saat development
      devOptions: {
        enabled: true,
      },
    }),
  ],
});