import { showToast } from './utils.js';

let routingControl = null;
let isRoutingMode = false;
let routeWaypoints = [];
let panelDOM = null;

// Helper: Ubah tipe manuver OSRM menjadi ikon Material
const getManeuverIcon = (type, modifier) => {
    if (type === 'Turn') {
        if (modifier.includes('left')) return 'turn_left';
        if (modifier.includes('right')) return 'turn_right';
    }
    if (type === 'Roundabout') return 'roundabout_right';
    if (type === 'Depart') return 'trip_origin';
    if (type === 'DestinationReached') return 'location_on';
    if (modifier === 'uturn') return 'u_turn_left';
    return 'arrow_upward'; // Straight default
};

// Helper: Format jarak m/km
const formatDistance = (meters) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
};

// Helper: Format waktu detik ke menit/jam
const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} jam ${mins} mnt`;
    return `${mins} mnt`;
};

export const initRouting = (map) => {
    const routeBtn = document.getElementById('btn-route');
    
    // 1. Buat Container untuk Panel Navigasi
    panelDOM = document.createElement('div');
    panelDOM.className = 'custom-routing-panel';
    document.body.appendChild(panelDOM);

    // 2. Tombol Utama (Aktifkan Mode Pilih Rute)
    routeBtn.addEventListener('click', () => {
        if (routingControl) {
            // Mode Batal (Hapus rute jika sudah ada)
            clearRouting(map, routeBtn);
            return;
        }

        isRoutingMode = !isRoutingMode;
        if (isRoutingMode) {
            routeWaypoints = [];
            showToast("Mode Rute: Klik peta untuk titik AWAL.");
            routeBtn.classList.add('active-route');
            routeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
            map.getContainer().style.cursor = 'crosshair';
        } else {
            // Batal pilih
            cancelRoutingMode(map, routeBtn);
        }
    });

    // 3. Event Klik Peta untuk menentukan Titik A dan B
    map.on('click', (e) => {
        if (!isRoutingMode) return;

        routeWaypoints.push(e.latlng);
        
        // Tambahkan marker visual sementara
        L.marker(e.latlng).addTo(map);

        if (routeWaypoints.length === 1) {
            showToast("Titik awal dipilih. Sekarang klik peta untuk titik TUJUAN.");
        } else if (routeWaypoints.length === 2) {
            // Mulai kalkulasi rute
            isRoutingMode = false;
            map.getContainer().style.cursor = '';
            showToast("Menghitung rute terbaik...");
            
            calculateRoute(map, routeWaypoints[0], routeWaypoints[1]);
        }
    });
};

// Fungsi menghitung dan merender rute
const calculateRoute = (map, startLatLng, endLatLng) => {
    // Bersihkan rute lama jika ada (safety check)
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [ startLatLng, endLatLng ],
        router: L.Routing.osrmv1({
            language: 'id', // Bahasa Indonesia dari OSRM
            profile: 'car'  // Opsi: 'car', 'bike', 'foot'
        }),
        lineOptions: {
            styles: [{ color: '#1a73e8', opacity: 0.8, weight: 6 }] // Garis Biru Modern
        },
        createMarker: function(i, wp, nWps) {
            // Kustomisasi marker A dan B bawaan LRM
            const label = (i === 0) ? 'A' : (i === nWps - 1) ? 'B' : '';
            return L.marker(wp.latLng, {
                icon: L.divIcon({
                    className: 'custom-map-marker',
                    html: `<div class="marker-pin" style="background:#1a73e8;"><span style="color:white; font-weight:bold; transform:rotate(45deg); display:block; margin-top:8px;">${label}</span></div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 36]
                })
            });
        }
    }).addTo(map);

    // EVENT LISTENER: Saat rute ditemukan
    routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        const summary = routes[0].summary; // Total Jarak & Waktu
        const instructions = routes[0].instructions; // Array langkah belokan

        renderCustomPanel(summary, instructions, map);
    });

    // EVENT LISTENER: Jika rute gagal (misal seberang pulau tanpa kapal feri)
    routingControl.on('routingerror', () => {
        showToast("Rute tidak dapat ditemukan.");
        clearRouting(map, document.getElementById('btn-route'));
    });
};

// Fungsi Render UI Panel Navigasi
const renderCustomPanel = (summary, instructions, map) => {
    let stepsHTML = '';

    instructions.forEach((step, index) => {
        // Skip instruksi kosong (biasanya indeks terakhir)
        if (!step.text) return;
        
        const iconName = getManeuverIcon(step.type, step.modifier);
        const distanceStr = formatDistance(step.distance);

        stepsHTML += `
            <div class="step-item">
                <span class="material-symbols-outlined step-icon">${iconName}</span>
                <div class="step-text">${step.text}</div>
                <div class="step-dist">${step.distance > 0 ? distanceStr : ''}</div>
            </div>
        `;
    });

    panelDOM.innerHTML = `
        <div class="routing-header">
            <button class="close-route-btn" id="btn-close-panel"><span class="material-symbols-outlined">close</span></button>
            <h2 id="route-time">${formatTime(summary.totalTime)}</h2>
            <p id="route-dist">${formatDistance(summary.totalDistance)} • via Rute Tercepat</p>
        </div>
        <div class="routing-steps">
            ${stepsHTML}
        </div>
    `;

    panelDOM.classList.add('show');

    // Event Tutup Panel
    document.getElementById('btn-close-panel').addEventListener('click', () => {
        clearRouting(map, document.getElementById('btn-route'));
    });
};

// Helper: Bersihkan semua rute dari layar
const clearRouting = (map, routeBtn) => {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    // Hapus marker sementara (titik klik) dengan melakukan refresh layer bawaan
    // atau jika Anda menyimpan referensi marker A/B, hapus disini.
    
    panelDOM.classList.remove('show');
    cancelRoutingMode(map, routeBtn);
    showToast("Rute dibersihkan.");
};

// Helper: Batal mode
const cancelRoutingMode = (map, routeBtn) => {
    isRoutingMode = false;
    routeWaypoints = [];
    map.getContainer().style.cursor = '';
    routeBtn.classList.remove('active-route');
    routeBtn.innerHTML = '<span class="material-symbols-outlined">directions</span>';
};
