export let mapInstance = null;
export let userMarker = null;

export const initMap = () => {
    // 1. Inisialisasi Peta dengan Optimasi Performa (Canvas & Debouncing)
    mapInstance = L.map('map', {
        zoomControl: false,          // Matikan kontrol bawaan untuk kustomisasi UI
        preferCanvas: true,          // Menggambar marker/vektor dengan Canvas API (sangat hemat RAM)
        wheelDebounceTime: 40,       // Mencegah patah-patah saat scroll zoom
        zoomAnimationThreshold: 4    // Menonaktifkan animasi jika perpindahan zoom terlalu jauh
    }).setView([-0.7893, 113.9213], 5); // Pusat default Indonesia

    // 2. Opsi Penghemat Memori & Network untuk Tile Layer
    const tileOptions = {
        updateWhenIdle: true, // Hanya download tile baru saat peta berhenti digeser
        keepBuffer: 2,         // Hanya simpan 2 layer tile di luar layar (mencegah memori HP bengkak)
        maxZoom: 19
    };

    // Layer Standard (OSM)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        ...tileOptions,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    // Layer Satelit (Esri)
    const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        ...tileOptions,
        attribution: 'Tiles &copy; Esri'
    });

    // Set OSM sebagai layer aktif pertama kali
    osmLayer.addTo(mapInstance);

    // Layer Control (Standard & Satelit) di pojok kiri bawah
    const baseMaps = {
        "Standard (OSM)": osmLayer,
        "Satelit (Esri)": esriLayer
    };
    L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(mapInstance);

    // 3. Geolocation API HTML5 (Dengan Penanganan Aman & Presisi Tinggi)
    const locateBtn = document.getElementById('btn-locate');
    
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Browser Anda tidak mendukung fitur Geolocation.");
                return;
            }

            // Opsi Geolocation untuk hasil posisi yang presisi
            const geoOptions = {
                enableHighAccuracy: true, // Gunakan GPS HP jika tersedia
                timeout: 10000,           // Batas waktu tunggu 10 detik
                maximumAge: 0             // Selalu ambil posisi terbaru, bukan dari cache
            };

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;

                    // Hapus marker lokasi lama jika sudah ada
                    if (userMarker) {
                        mapInstance.removeLayer(userMarker);
                    }

                    // Tambahkan marker lokasi baru
                    userMarker = L.marker([lat, lng]).addTo(mapInstance)
                        .bindPopup("<b>Lokasi Anda saat ini</b>")
                        .openPopup();

                    // Animasi perpindahan kamera peta yang halus
                    mapInstance.flyTo([lat, lng], 15, {
                        animate: true,
                        duration: 1.5
                    });
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    alert("Gagal mendapatkan lokasi. Pastikan izin GPS/Lokasi sudah diaktifkan.");
                },
                geoOptions
            );
        });
    }

    return mapInstance;
};
