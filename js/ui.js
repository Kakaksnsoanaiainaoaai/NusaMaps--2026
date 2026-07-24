import { showToast } from './utils.js';

export const setupUI = () => {
    // Ambil elemen-elemen DOM
    const themeBtn = document.getElementById('theme-toggle');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const mapContainer = document.getElementById('map-container');
    const loginBtn = document.querySelector('.login-btn');
    const voiceSearchBtn = document.querySelector('.search-container .icon-btn:last-child'); // Tombol mic

    // 1. Logika Dark/Light Mode
    if (themeBtn) {
        // Cek LocalStorage jika ada preferensi tema sebelumnya
        const savedTheme = localStorage.getItem('geomaps_theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
        }

        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                themeBtn.innerHTML = '<span class="material-symbols-outlined">dark_mode</span>';
                localStorage.setItem('geomaps_theme', 'light');
                showToast("Beralih ke Light Mode");
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeBtn.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
                localStorage.setItem('geomaps_theme', 'dark');
                showToast("Beralih ke Dark Mode");
            }
        });
    }

    // 2. Logika Sidebar Toggle
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Auto-collapse sidebar saat user mengklik area peta (Penting untuk mobile)
        mapContainer.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }

    // 3. Tombol Dummy Interaksi
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showToast("Fitur Login sedang dalam tahap pengembangan.");
        });
    }

    if (voiceSearchBtn) {
        voiceSearchBtn.addEventListener('click', () => {
            showToast("Fitur Voice Search membutuhkan izin mikrofon (Segera hadir).");
        });
    }

    // 4. Integrasi Fullscreen Map (Opsional: jika Anda ingin menambahkan tombol Fullscreen nanti)
    // Cukup panggil toggleFullscreen() pada event listener tombol Anda.
    window.toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                showToast(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
};
