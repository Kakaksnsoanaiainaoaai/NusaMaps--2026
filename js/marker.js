import { saveLocation, getSavedLocations, deleteLocation } from './storage.js';
import { showToast } from './utils.js';

// Konfigurasi Ikon Kategori menggunakan Material Symbols
const categoryConfig = {
    'default': { icon: 'place', class: 'marker-default', color: '#1a73e8' },
    'rumah': { icon: 'home', class: 'marker-rumah', color: '#34a853' },
    'sekolah': { icon: 'school', class: 'marker-sekolah', color: '#fbbc05' },
    'rs': { icon: 'local_hospital', class: 'marker-rs', color: '#ea4335' },
    'masjid': { icon: 'mosque', class: 'marker-masjid', color: '#009688' },
    'kantor': { icon: 'business_center', class: 'marker-kantor', color: '#607d8b' },
    'restoran': { icon: 'restaurant', class: 'marker-restoran', color: '#ff9800' }
};

// Fungsi pembuat ikon kustom (L.divIcon)
export const createCustomIcon = (category = 'default') => {
    const config = categoryConfig[category] || categoryConfig['default'];
    return L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-pin" style="background:${config.color};"><span class="material-symbols-outlined">${config.icon}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

// State global untuk popup sementara saat peta diklik
let tempMarker = null;

export const initMarkerEvents = (map) => {
    // 1. Render marker yang sudah tersimpan di LocalStorage saat aplikasi dimuat
    renderSavedMarkers(map);

    // 2. Event Klik Kiri untuk Info Lokasi (Reverse Geocoding)
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Hapus marker sementara jika ada
        if (tempMarker) map.removeLayer(tempMarker);

        // Tambahkan marker loading
        tempMarker = L.marker([lat, lng], { icon: createCustomIcon('default') }).addTo(map);
        tempMarker.bindPopup("<div style='padding:5px;'><i>Mencari informasi lokasi...</i></div>").openPopup();

        try {
            // Reverse Geocoding via Nominatim API
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            
            const address = data.display_name || "Alamat tidak diketahui";
            const city = data.address?.city || data.address?.town || data.address?.county || "-";
            const zip = data.address?.postcode || "-";

            // Buat HTML untuk Popup
            const popupHTML = `
                <div class="info-popup" style="min-width: 220px; font-family: 'Segoe UI', sans-serif;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color:var(--text-color);">Info Lokasi</h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; line-height: 1.4;">${address}</p>
                    <div style="font-size: 12px; margin-bottom: 15px; background: var(--hover-bg); padding: 8px; border-radius: 6px;">
                        <b>Kota:</b> ${city} <br>
                        <b>Kode Pos:</b> ${zip} <br>
                        <b>Koordinat:</b> ${lat.toFixed(5)}, ${lng.toFixed(5)}
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="font-size:12px; font-weight:bold;">Kategori Simpan:</label><br>
                        <select id="kategori-simpan" style="width:100%; padding:5px; margin-top:3px; border-radius:4px; border:1px solid var(--border-color);">
                            <option value="default">Umum / Pin</option>
                            <option value="rumah">Rumah</option>
                            <option value="kantor">Kantor</option>
                            <option value="restoran">Restoran</option>
                            <option value="masjid">Masjid</option>
                            <option value="rs">Rumah Sakit</option>
                            <option value="sekolah">Sekolah</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button id="btn-save-loc" style="flex:1; background:var(--primary-color); color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold;">Simpan</button>
                        <button id="btn-share-loc" style="flex:1; background:#5f6368; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold;">Share</button>
                    </div>
                </div>
            `;

            tempMarker.setPopupContent(popupHTML);

            // Pasang event listener pada tombol di dalam popup DOM
            setTimeout(() => {
                const btnSave = document.getElementById('btn-save-loc');
                if(btnSave) {
                    btnSave.addEventListener('click', () => {
                        const selectElement = document.getElementById('kategori-simpan');
                        const selectedCategory = selectElement ? selectElement.value : 'default';
                        
                        const locData = { lat, lng, address, category: selectedCategory };
                        saveLocation(locData);
                        
                        showToast("Lokasi berhasil disimpan!");
                        map.removeLayer(tempMarker);
                        renderSavedMarkers(map); 
                    });
                }

                const btnShare = document.getElementById('btn-share-loc');
                if(btnShare) {
                    btnShare.addEventListener('click', () => {
                        const url = `${window.location.origin}${window.location.pathname}?lat=${lat}&lng=${lng}`;
                        navigator.clipboard.writeText(url)
                            .then(() => showToast("Link koordinat berhasil disalin!"))
                            .catch(() => showToast("Gagal menyalin link."));
                    });
                }
            }, 100);

        } catch (error) {
            console.error("Geocoding Error:", error);
            tempMarker.setPopupContent("<div style='padding:5px; color:#ea4335;'><b>Gagal mengambil data lokasi.</b><br>Periksa koneksi internet Anda.</div>");
        }
    });
};

export const renderSavedMarkers = (map) => {
    // Pastikan grup layer tersedia untuk mempermudah hapus/render ulang
    if(window.savedMarkersGroup) {
        window.savedMarkersGroup.clearLayers();
    } else {
        window.savedMarkersGroup = L.layerGroup().addTo(map);
    }

    const savedLocs = getSavedLocations();
    
    savedLocs.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], {
            icon: createCustomIcon(loc.category)
        });

        marker.bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 180px;">
                <b style="color:var(--text-color); font-size:15px;">Lokasi Tersimpan</b><br>
                <div style="font-size:12px; color:#666; margin: 8px 0; line-height: 1.4;">${loc.address}</div>
                <button onclick="window.hapusMarker('${loc.id}')" style="background:#ea4335; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; width:100%; font-weight:bold; margin-top:5px;">
                    Hapus Lokasi
                </button>
            </div>
        `);
        window.savedMarkersGroup.addLayer(marker);
    });
};

// Fungsi global yang diekspos ke window object agar bisa diakses dari atribut onclick di string HTML Popup
window.hapusMarker = (id) => {
    if(confirm("Apakah Anda yakin ingin menghapus lokasi ini dari daftar tersimpan?")) {
        deleteLocation(id);
        if (window.mapInstance) {
            renderSavedMarkers(window.mapInstance); // Render ulang otomatis
        }
        showToast("Lokasi berhasil dihapus dari sistem.");
    }
};
