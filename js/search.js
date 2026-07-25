import { mapInstance } from './map.js';

let currentAbortController = null;

export const setupSearch = () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    let timeoutId = null;

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(timeoutId);
        if (query.length < 3) {
            resultsContainer.classList.add('hidden');
            return;
        }
        timeoutId = setTimeout(() => performSearch(query, resultsContainer), 500);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) resultsContainer.classList.add('hidden');
    });
};

const performSearch = async (query, resultsContainer) => {
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
            signal: currentAbortController.signal 
        });
        const data = await res.json();
        
        resultsContainer.innerHTML = ''; 
        if (data.length > 0) {
            const fragment = document.createDocumentFragment();
            data.forEach(place => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `<span class="material-symbols-outlined">location_on</span> ${place.display_name}`;
                div.addEventListener('click', () => {
                    const lat = parseFloat(place.lat);
                    const lon = parseFloat(place.lon);
                    mapInstance.flyTo([lat, lon], 16);
                    L.marker([lat, lon]).addTo(mapInstance).bindPopup(place.name || 'Hasil Pencarian').openPopup();
                    resultsContainer.classList.add('hidden');
                });
                fragment.appendChild(div);
            });
            resultsContainer.appendChild(fragment); 
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.innerHTML = '<div class="search-item">Tidak ditemukan</div>';
            resultsContainer.classList.remove('hidden');
        }
    } catch (error) {
        if (error.name !== 'AbortError') console.error(error);
    }
};
