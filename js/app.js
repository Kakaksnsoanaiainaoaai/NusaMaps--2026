// WAJIB MENGGUNAKAN .js PADA IMPORT DI GITHUB PAGES
import { initMap, mapInstance } from './map.js';
import { setupSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');

    try {
        // 1. Eksekusi Inti
        initMap();
        setupSearch();
    } catch (err) {
        console.error("Kesalahan saat inisialisasi:", err);
    } finally {
        // 2. Apapun yang terjadi, hilangkan loading setelah 1.5 detik
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }
        }, 1500);
    }

    // 3. Lazy Load Navigasi Routing
    const routeBtn = document.getElementById('btn-route');
    if (routeBtn) {
        routeBtn.addEventListener('click', async (e) => {
            if (!routeBtn.hasAttribute('data-loaded')) {
                e.preventDefault();
                const iconBefore = routeBtn.innerHTML;
                routeBtn.innerHTML = '<span class="material-symbols-outlined spin">sync</span>';
                
                try {
                    const { initRouting } = await import('./routing.js');
                    initRouting(mapInstance);
                    routeBtn.setAttribute('data-loaded', 'true');
                    routeBtn.innerHTML = iconBefore;
                    routeBtn.click(); // Trigger ulang otomatis
                } catch (err) {
                    console.error("Gagal meload routing.js:", err);
                    routeBtn.innerHTML = iconBefore;
                }
            }
        });
    }
});

// 4. Registrasi Service Worker (Aman dengan Path ./)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log("SW Registered!"))
        .catch(err => console.error("SW Failed:", err));
}
