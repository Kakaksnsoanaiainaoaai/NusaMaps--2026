import { showToast } from './utils.js';

let routingControl = null;
let isRoutingMode = false;
let waypoints = [];
let panelDOM = null;

export const initRouting = (map) => {
    const routeBtn = document.getElementById('btn-route');
    
    panelDOM = document.createElement('div');
    panelDOM.className = 'custom-routing-panel';
    document.body.appendChild(panelDOM);

    routeBtn.addEventListener('click', () => {
        if (routingControl) {
            clearRouting(map, routeBtn);
            return;
        }
        isRoutingMode = !isRoutingMode;
        if (isRoutingMode) {
            waypoints = [];
            showToast("Klik peta untuk titik AWAL.");
            routeBtn.style.background = '#ea4335';
            routeBtn.style.color = 'white';
            routeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
            map.getContainer().style.cursor = 'crosshair';
        } else {
            cancelRouting(map, routeBtn);
        }
    });

    map.on('click', (e) => {
        if (!isRoutingMode) return;
        waypoints.push(e.latlng);
        L.marker(e.latlng).addTo(map);

        if (waypoints.length === 1) {
            showToast("Titik awal dipilih. Klik untuk TUJUAN.");
        } else if (waypoints.length === 2) {
            isRoutingMode = false;
            map.getContainer().style.cursor = '';
            showToast("Menghitung rute...");
            calculateRoute(map, waypoints[0], waypoints[1]);
        }
    });
};

const calculateRoute = (map, start, end) => {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [start, end],
        router: L.Routing.osrmv1({ language: 'id', profile: 'car' }),
        lineOptions: { styles: [{ color: '#1a73e8', weight: 6 }] },
        createMarker: () => null // Hide default LRM markers
    }).addTo(map);

    routingControl.on('routesfound', (e) => renderPanel(e.routes[0], map));
    routingControl.on('routingerror', () => showToast("Rute tidak ditemukan."));
};

const renderPanel = (route, map) => {
    const time = Math.floor(route.summary.totalTime / 60);
    const dist = (route.summary.totalDistance / 1000).toFixed(1);
    
    let html = `
        <div class="routing-header">
            <button class="close-route-btn" id="close-panel"><span class="material-symbols-outlined">close</span></button>
            <h2>${time > 60 ? Math.floor(time/60) + ' jam ' + (time%60) : time} mnt</h2>
            <p>${dist} km via Rute Tercepat</p>
        </div>
        <div class="routing-steps">
    `;

    route.instructions.forEach(step => {
        if (step.text) {
            html += `<div class="step-item">
                <span class="material-symbols-outlined step-icon">turn_right</span>
                <div style="flex:1; font-size:14px;">${step.text}</div>
                <div class="step-dist">${step.distance > 0 ? Math.round(step.distance) + ' m' : ''}</div>
            </div>`;
        }
    });

    panelDOM.innerHTML = html + `</div>`;
    panelDOM.classList.add('show');
    
    document.getElementById('close-panel').addEventListener('click', () => clearRouting(map, document.getElementById('btn-route')));
};

const clearRouting = (map, btn) => {
    if (routingControl) map.removeControl(routingControl);
    panelDOM.classList.remove('show');
    cancelRouting(map, btn);
};

const cancelRouting = (map, btn) => {
    isRoutingMode = false;
    waypoints = [];
    map.getContainer().style.cursor = '';
    btn.style.background = 'white';
    btn.style.color = '#333';
    btn.innerHTML = '<span class="material-symbols-outlined">directions</span>';
};
