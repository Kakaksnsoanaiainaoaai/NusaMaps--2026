import { mapInstance } from './map.js';

let currentAbortController = null;

export const setupSearch = () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    let timeoutId = null;

    if (!searchInput || !resultsContainer) return;

    // 1. Event listener saat user mengetik di kotak pencarian
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(timeoutId);
        
        // Jangan eksekusi API jika karakter kurang dari 3
        if (query.length < 3) {
            resultsContainer.classList.add('hidden');
            return;
        }

        // Debounce 500ms
        timeoutId = setTimeout(() => {
            performSearch(query, resultsContainer);
        }, 500);
    });

    // 2. Sembunyikan hasil dropdown saat user mengklik di luar area search box
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            resultsContainer.classList.add('hidden');
        }
    });
};

const performSearch = async (query, resultsContainer) => {
    // BATALKAN request API sebelumnya jika user mengetik lagi sebelum request lama selesai
    if (currentAbortController) {
        currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
            signal: currentAbortController.signal 
        });
        
        const data = await res.json();
        
        resultsContainer.innerHTML = ''; 

        if (data.length > 0) {
            // DOM BATCHING: Buat elemen di memori dulu agar tidak berat di HP
            const fragment = document.createDocumentFragment();

            data.forEach(place => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `<span class="material-symbols-outlined">location_on</span> ${place.display_name}`;
                
                div.addEventListener('click', () => {
                    const lat = parseFloat(place.lat);
                    const lon = parseFloat(place.lon);

                    // Terbang ke lokasi hasil pencarian
                    mapInstance.flyTo([lat, lon], 16);

                    // Tambahkan marker titik lokasi
                    L.marker([lat, lon]).addTo(mapInstance)
                        .bindPopup(`<b>${place.name || 'Hasil Pencarian'}</b><br>${place.display_name}`)
                        .openPopup();

                    resultsContainer.classList.add('hidden');
                });
                
                fragment.appendChild(div);
            });

            // Tembak ke layar sekaligus (1x Reflow/Repaint)
            resultsContainer.appendChild(fragment); 
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.innerHTML = '<div class="search-item">Lokasi tidak ditemukan</div>';
            resultsContainer.classList.remove('hidden');
        }
    } catch (error) {
        // Abaikan error jika itu adalah AbortError (karena ditimpa pencarian baru)
        if (error.name !== 'AbortError') {
            console.error("Nominatim Search Error:", error);
        }
    }
};
