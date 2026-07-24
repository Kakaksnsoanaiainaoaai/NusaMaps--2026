/**
 * Modul LocalStorage untuk menyimpan Marker, Favorit, dan Riwayat
 */

const MARKER_KEY = 'geomaps_saved_markers';
const HISTORY_KEY = 'geomaps_search_history';

// --- MARKER STORAGE ---
export const saveLocation = (data) => {
    const saved = getSavedLocations();
    // Gunakan timestamp sebagai ID unik
    data.id = Date.now().toString();
    saved.push(data);
    localStorage.setItem(MARKER_KEY, JSON.stringify(saved));
    return data.id;
};

export const getSavedLocations = () => {
    const data = localStorage.getItem(MARKER_KEY);
    return data ? JSON.parse(data) : [];
};

export const deleteLocation = (id) => {
    let saved = getSavedLocations();
    saved = saved.filter(item => item.id !== id);
    localStorage.setItem(MARKER_KEY, JSON.stringify(saved));
};

// --- HISTORY STORAGE ---
export const saveSearchHistory = (query) => {
    let history = getSearchHistory();
    // Hindari duplikasi berurutan
    if (history[0] !== query) {
        history.unshift(query);
        // Batasi maksimal 10 riwayat
        if (history.length > 10) history.pop();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
};

export const getSearchHistory = () => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
};
