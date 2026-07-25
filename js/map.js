export let mapInstance = null;
export let userMarker = null;

export const initMap = () => {
    mapInstance = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
        wheelDebounceTime: 40,
        zoomAnimationThreshold: 4
    }).setView([-0.7893, 113.9213], 5);

    const tileOptions = { updateWhenIdle: true, keepBuffer: 2, maxZoom: 19 };

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        ...tileOptions, attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        ...tileOptions, attribution: '&copy; Esri'
    });

    L.control.layers({ "Standard": osmLayer, "Satelit": esriLayer }, null, { position: 'bottomleft' }).addTo(mapInstance);

    const locateBtn = document.getElementById('btn-locate');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (!navigator.geolocation) return alert("Browser tidak mendukung GPS.");
            
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    if (userMarker) mapInstance.removeLayer(userMarker);
                    userMarker = L.marker([lat, lng]).addTo(mapInstance).bindPopup("Lokasi Anda").openPopup();
                    mapInstance.flyTo([lat, lng], 15);
                },
                (err) => alert("Gagal mendapatkan lokasi GPS."),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
    return mapInstance;
};
