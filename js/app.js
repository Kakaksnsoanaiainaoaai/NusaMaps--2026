import { initMap, mapInstance } from './map.js';
import { setupSearch } from './search.js';
// PERHATIKAN: Kita TIDAK import routing.js di sini!

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load fitur esensial langsung
    initMap();
    setupSearch();

    // 2. Setup Lazy Loading untuk fitur berat
    const routeBtn = document.getElementById('btn-route');
    
    if (routeBtn) {
        routeBtn.addEventListener('click', async (e) => {
            // Cek apakah modul sudah pernah di-load
            if (!routeBtn.hasAttribute('data-loaded')) {
                // Tahan default click sejenak
                e.preventDefault();
                
                const btnIcon = routeBtn.innerHTML;
                routeBtn.innerHTML = '<span class="material-symbols-outlined spin">sync</span>'; // Loading icon

                try {
                    // DYNAMIC IMPORT: Browser baru download routing.js sekarang
                    const { initRouting } = await import('./routing.js');
                    const { showToast } = await import('./utils.js');
                    
                    initRouting(mapInstance);
                    routeBtn.setAttribute('data-loaded', 'true');
                    routeBtn.innerHTML = btnIcon; // Kembalikan ikon awal
                    
                    showToast("Fitur navigasi siap!");
                    
                    // Trigger ulang klik-nya agar langsung jalan
                    routeBtn.click(); 
                } catch (err) {
                    console.error("Gagal meload modul routing:", err);
                    routeBtn.innerHTML = btnIcon;
                }
            }
        });
    }

    // 3. Daftarkan Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(err => console.error('SW Registration Failed', err));
    }
});
