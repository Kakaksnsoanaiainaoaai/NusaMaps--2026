/**
 * js/utils.js - Fungsi pembantu global (Notifikasi, Format Waktu, dll)
 */

export const showToast = (message) => {
    // Buat kontainer jika belum ada
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">info</span> ${message}`;
    container.appendChild(toast);

    // Animasi masuk
    setTimeout(() => toast.classList.add('show'), 10);

    // Hilang otomatis setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Tunggu transisi selesai
    }, 3000);
};
