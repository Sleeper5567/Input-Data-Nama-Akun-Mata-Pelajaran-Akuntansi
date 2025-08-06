import { ACCOUNT_NAMES, ACCOUNT_CATEGORIES } from './app.js';

export function renderHeaderAndFooter(state) {
    const header = `
        <header class="text-center mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900">${state.companyName || 'Nama Perusahaan Anda'}</h1>
            <p class="text-md text-gray-600 mt-2">Aplikasi Validasi Klasifikasi Akun</p>
        </header>
        ${state.error ? `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">${state.error}</div>` : ''}
    `;
    const footer = `
        <footer class="text-center mt-8 text-sm text-gray-500">
            <p>Sesi latihan Anda disimpan secara otomatis. ID Pengguna: <span class="font-mono bg-gray-200 px-2 py-1 rounded">${state.userId || 'Menunggu...'}</span></p>
        </footer>
    `;
    return { header, footer };
}

export function renderPracticePage(state) {
    const tableRows = state.classifications.map(item => `
        <tr class="bg-white">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.accountName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${item.category}</td>
        </tr>
    `).join('');

    const table = state.isLoading ? `<p class="text-center text-gray-500 py-4">Memuat...</p>` : state.classifications.length > 0 ? `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Akun</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klasifikasi Anda</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    ` : `<p class="text-center text-gray-500 py-4">Mulai sesi Anda dengan menambahkan klasifikasi.</p>`;

    return `
        <div class="bg-white p-6 rounded-xl shadow-md mb-8">
            <div class="mb-6">
                <label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                <input id="companyName" type="text" value="${state.companyName}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
            </div>
            <hr class="my-6"/>
            <h2 class="text-2xl font-semibold mb-4 text-gray-800">Lakukan Klasifikasi</h2>
            <form id="classification-form" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label for="accountName" class="block text-sm font-medium text-gray-700 mb-1">Pilih Nama Akun</label>
                    <select id="accountName" class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                        ${ACCOUNT_NAMES.map(name => `<option value="${name}" ${state.selectedAccount === name ? 'selected' : ''}>${name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Pilih Kategori Akun</label>
                    <select id="category" class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
                        ${ACCOUNT_CATEGORIES.map(cat => `<option value="${cat}" ${state.selectedCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all">
                    Tambah
                </button>
            </form>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
             <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 class="text-2xl font-semibold text-gray-800">Daftar Klasifikasi</h2>
                <button id="view-results-btn" ${state.classifications.length === 0 ? 'disabled' : ''} class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all">
                    Selesai & Lihat Hasil
                </button>
             </div>
             <div class="overflow-x-auto">${table}</div>
        </div>
    `;
}

export function renderResultsPage(state, masterList) {
    const tableRows = state.classifications.map(item => {
        const correctAnswer = masterList[item.accountName];
        const isCorrect = correctAnswer === item.category;
        return `
            <tr class="transition-colors duration-300 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.accountName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    ${item.category}
                    ${!isCorrect ? `<span class="block text-xs text-red-700 font-semibold mt-1">(Seharusnya: ${correctAnswer})</span>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
                        ${isCorrect ? 'Benar' : 'Salah'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="bg-white p-6 rounded-xl shadow-md">
             <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 class="text-2xl font-semibold text-gray-800">Laporan Hasil</h2>
                <button id="start-new-session-btn" ${state.isProcessing ? 'disabled' : ''} class="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all">
                    ${state.isProcessing ? 'Memproses...' : 'Mulai Sesi Baru'}
                </button>
             </div>
             <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Akun</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klasifikasi Anda</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
             </div>
        </div>
    `;
}

export function attachCommonEventListeners(state, companyNameHandler) {
    const companyNameInput = document.getElementById('companyName');
    if (companyNameInput) {
        companyNameInput.addEventListener('input', (e) => companyNameHandler(e.target.value));
    }

    const accountNameSelect = document.getElementById('accountName');
    if (accountNameSelect) {
        accountNameSelect.addEventListener('change', e => { state.selectedAccount = e.target.value; });
    }

    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', e => { state.selectedCategory = e.target.value; });
    }
}