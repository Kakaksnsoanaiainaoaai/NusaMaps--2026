/**
 * Modul Drawing Tools menggunakan Leaflet Draw
 * Fitur: Menggambar Polygon, Circle, Rectangle, Polyline, Marker.
 * Termasuk kalkulasi Jarak dan Luas Area.
 */

export const initDraw = (map) => {
    // 1. Buat FeatureGroup khusus untuk menampung semua hasil gambar (agar bisa diedit/dihapus)
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // 2. Kustomisasi teks tooltips menjadi Bahasa Indonesia (Opsional, agar sesuai UI)
    L.drawLocal.draw.handlers.polygon.tooltip.start = 'Klik untuk mulai menggambar poligon.';
    L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Klik untuk melanjutkan poligon.';
    L.drawLocal.draw.handlers.polygon.tooltip.end = 'Klik titik awal untuk menyelesaikan poligon.';
    L.drawLocal.draw.handlers.polyline.tooltip.start = 'Klik untuk mulai menggambar garis.';
    
    // 3. Konfigurasi UI Kontrol Leaflet Draw
    const drawControl = new L.Control.Draw({
        position: 'topright', // Posisikan di kanan atas agar tidak bentrok dengan zoom/layer control
        edit: {
            featureGroup: drawnItems, // Arahkan fitur edit dan hapus ke grup yang sudah dibuat
            remove: true
        },
        draw: {
            polyline: {
                shapeOptions: { color: '#1a73e8', weight: 4 }, // Warna Material Blue
                metric: true, // Gunakan meter/km
            },
            polygon: {
                allowIntersection: false, // Tidak boleh garis menyilang
                showArea: true,
                metric: true,
                shapeOptions: { color: '#34a853' } // Warna Material Green
            },
            circle: {
                shapeOptions: { color: '#fbbc05' }, // Warna Material Yellow
                metric: true
            },
            rectangle: {
                shapeOptions: { color: '#ea4335' }, // Warna Material Red
                metric: true
            },
            marker: true,
            circlemarker: false // Matikan karena jarang digunakan untuk UI standar
        }
    });

    map.addControl(drawControl);

    // 4. Event Listener saat user selesai menggambar
    map.on(L.Draw.Event.CREATED, (e) => {
        const type = e.layerType;
        const layer = e.layer;
        let popupContent = '';

        // Hitung Luas Area (Poligon & Persegi Panjang)
        if (type === 'polygon' || type === 'rectangle') {
            // L.GeometryUtil.geodesicArea bawaan Leaflet Draw untuk akurasi kurvatur bumi
            const latlngs = layer.getLatLngs()[0];
            const area = L.GeometryUtil.geodesicArea(latlngs);
            
            const areaStr = area > 10000 
                ? `${(area / 1000000).toFixed(2)} km²` 
                : `${area.toFixed(2)} m²`;
                
            popupContent = `
                <div style="font-family: 'Segoe UI', sans-serif;">
                    <b style="color:var(--text-color);">Tipe:</b> ${type === 'polygon' ? 'Poligon (Area)' : 'Persegi Panjang'}<br>
                    <b style="color:var(--primary-color);">Luas Area:</b> ${areaStr}
                </div>`;
        } 
        
        // Hitung Luas Lingkaran (π * r²)
        else if (type === 'circle') {
            const radius = layer.getRadius();
            const area = Math.PI * Math.pow(radius, 2);
            
            const radiusStr = radius > 1000 ? `${(radius/1000).toFixed(2)} km` : `${radius.toFixed(2)} m`;
            const areaStr = area > 10000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toFixed(2)} m²`;
            
            popupContent = `
                <div style="font-family: 'Segoe UI', sans-serif;">
                    <b style="color:var(--text-color);">Tipe:</b> Lingkaran<br>
                    <b style="color:var(--primary-color);">Radius Jari-jari:</b> ${radiusStr}<br>
                    <b style="color:var(--primary-color);">Perkiraan Luas:</b> ${areaStr}
                </div>`;
        } 
        
        // Hitung Total Jarak Garis (Polyline)
        else if (type === 'polyline') {
            const latlngs = layer.getLatLngs();
            let distance = 0;
            
            // Loop kalkulasi jarak antar titik
            for (let i = 0; i < latlngs.length - 1; i++) {
                distance += latlngs[i].distanceTo(latlngs[i + 1]);
            }
            
            const distStr = distance > 1000 
                ? `${(distance / 1000).toFixed(2)} km` 
                : `${distance.toFixed(2)} meter`;
                
            popupContent = `
                <div style="font-family: 'Segoe UI', sans-serif;">
                    <b style="color:var(--text-color);">Tipe:</b> Garis Rute / Pengukuran<br>
                    <b style="color:var(--primary-color);">Total Jarak:</b> ${distStr}
                </div>`;
        }
        
        // Marker Biasa
        else if (type === 'marker') {
            const latlng = layer.getLatLng();
            popupContent = `
                <div style="font-family: 'Segoe UI', sans-serif;">
                    <b style="color:var(--text-color);">Pin Point</b><br>
                    Lat: ${latlng.lat.toFixed(5)}<br>
                    Lng: ${latlng.lng.toFixed(5)}
                </div>`;
        }

        // Tambahkan elemen ke map
        drawnItems.addLayer(layer);
        
        // Tampilkan Popup kalkulasi
        if (popupContent) {
            layer.bindPopup(popupContent).openPopup();
        }
    });

    // Event saat diedit (opsional, untuk memastikan data selalu konsisten jika Anda ingin menyimpannya ke database nanti)
    map.on(L.Draw.Event.EDITED, (e) => {
        // e.layers.eachLayer((layer) => { ... update kalkulasi jika perlu ... });
        console.log("Layer berhasil diedit.");
    });
};
