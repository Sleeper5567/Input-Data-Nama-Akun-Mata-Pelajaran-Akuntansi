import { db, auth, appId, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from './firebase.js';
import { collection, addDoc, onSnapshot, doc, query, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { renderPracticePage, renderResultsPage, renderHeaderAndFooter, attachCommonEventListeners } from './ui.js';

// --- MASTER DATA ---
const ACCOUNT_MASTER_LIST = {
    'Kas': 'Harta Lancar', 'Kas Kecil': 'Harta Lancar', 'Bank': 'Harta Lancar', 'Piutang Usaha': 'Harta Lancar', 'Perlengkapan Kantor': 'Harta Lancar', 'Sewa Dibayar di Muka': 'Harta Lancar',
    'Peralatan Kantor': 'Harta Tetap', 'Akumulasi Penyusutan Peralatan': 'Harta Tetap', 'Kendaraan': 'Harta Tetap', 'Akumulasi Penyusutan Kendaraan': 'Harta Tetap', 'Gedung': 'Harta Tetap',
    'Utang Usaha': 'Utang Usaha', 'Utang Gaji': 'Utang Usaha', 'Utang Bank Jangka Pendek': 'Utang Bank', 'Utang Bank Jangka Panjang': 'Utang Bank',
    'Modal Pemilik': 'Modal', 'Prive': 'Modal',
    'Pendapatan Jasa': 'Pendapatan Usaha', 'Pendapatan Komisi': 'Pendapatan Usaha', 'Pendapatan Bunga': 'Pendapatan di Luar Usaha',
    'Beban Gaji': 'Beban Usaha', 'Beban Sewa': 'Beban Usaha', 'Beban Listrik & Air': 'Beban Usaha', 'Beban Iklan': 'Beban Usaha', 'Beban Penyusutan Peralatan': 'Beban Usaha', 'Beban Bunga': 'Beban di Luar Usaha', 'Beban Administrasi Bank': 'Beban di Luar Usaha',
};
export const ACCOUNT_NAMES = Object.keys(ACCOUNT_MASTER_LIST);
export const ACCOUNT_CATEGORIES = ['Harta Lancar', 'Harta Tetap', 'Utang Usaha', 'Utang Bank', 'Modal', 'Pendapatan Usaha', 'Pendapatan di Luar Usaha', 'Beban Usaha', 'Beban di Luar Usaha'];

// --- APPLICATION STATE ---
export let state = {
    currentPage: 'practice',
    classifications: [],
    classifiedAccounts: new Set(),
    companyName: '',
    selectedAccount: ACCOUNT_NAMES[0],
    selectedCategory: ACCOUNT_CATEGORIES[0],
    isLoading: true,
    isProcessing: false,
    error: null,
    userId: null,
};

const appContainer = document.getElementById('app');

// --- MAIN RENDER FUNCTION ---
export function mainRender() {
    if (!state.userId) {
        appContainer.innerHTML = `<p class="text-center text-gray-500">Menunggu otentikasi...</p>`;
        return;
    }

    const { header, footer } = renderHeaderAndFooter(state);
    let pageContent = '';

    if (state.currentPage === 'practice') {
        pageContent = renderPracticePage(state);
    } else {
        pageContent = renderResultsPage(state, ACCOUNT_MASTER_LIST);
    }
    appContainer.innerHTML = header + pageContent + footer;
    attachEventListeners();
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    attachCommonEventListeners(state, handleCompanyNameChange);

    if (state.currentPage === 'practice') {
        const classificationForm = document.getElementById('classification-form');
        if (classificationForm) classificationForm.addEventListener('submit', handleSubmitClassification);

        const viewResultsBtn = document.getElementById('view-results-btn');
        if (viewResultsBtn) viewResultsBtn.addEventListener('click', () => {
            state.currentPage = 'results';
            mainRender();
        });
    } else {
        const startNewSessionBtn = document.getElementById('start-new-session-btn');
        if (startNewSessionBtn) startNewSessionBtn.addEventListener('click', handleStartNewSession);
    }
}

// --- EVENT HANDLERS (LOGIC) ---
async function handleCompanyNameChange(newName) {
    state.companyName = newName;
    if (db && state.userId) {
        const settingsDocPath = `artifacts/${appId}/users/${state.userId}/settings/companyProfile`;
        await setDoc(doc(db, settingsDocPath), { name: newName }).catch(() => {
            state.error = "Gagal menyimpan nama perusahaan.";
            mainRender();
        });
    }
}

async function handleSubmitClassification(e) {
    e.preventDefault();
    if (state.classifiedAccounts.has(state.selectedAccount)) {
        alert(`Akun "${state.selectedAccount}" sudah ditambahkan.`);
        return;
    }
    const newClassification = {
        accountName: state.selectedAccount,
        category: state.selectedCategory,
        createdAt: new Date(),
    };
    const collectionPath = `artifacts/${appId}/users/${state.userId}/classifications`;
    await addDoc(collection(db, collectionPath), newClassification).catch(() => {
        state.error = "Gagal menyimpan klasifikasi.";
        mainRender();
    });
}

async function handleStartNewSession() {
    if (!db || !state.userId) return;
    const confirmation = window.confirm("Apakah Anda yakin ingin memulai sesi baru? Semua data saat ini akan dihapus.");
    if (confirmation) {
        state.isProcessing = true;
        mainRender(); // Show processing state

        const collectionPath = `artifacts/${appId}/users/${state.userId}/classifications`;
        const collectionRef = collection(db, collectionPath);
        try {
            const querySnapshot = await getDocs(collectionRef);
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            // The onSnapshot listener will clear the local data.
            // We now explicitly set the page and re-render.
            state.currentPage = 'practice';
        } catch (err) {
            state.error = "Gagal memulai sesi baru. Silakan coba lagi.";
        } finally {
            state.isProcessing = false;
            mainRender(); // Render the final state (empty practice page or error)
        }
    }
}

// --- INITIALIZATION ---
function initialize() {
    if (!db || !auth) {
        state.error = "Gagal menginisialisasi Firebase. Silakan periksa konsol.";
        mainRender();
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            state.userId = user.uid;
            setupFirestoreListeners();
        } else {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (authError) {
                state.error = "Gagal melakukan otentikasi.";
                mainRender();
            }
        }
    });
}

function setupFirestoreListeners() {
    if (!state.userId) return;

    // Listener for classifications
    const classCollectionPath = `artifacts/${appId}/users/${state.userId}/classifications`;
    onSnapshot(query(collection(db, classCollectionPath)), (querySnapshot) => {
        const data = [];
        const accounts = new Set();
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            data.push({ id: doc.id, ...docData });
            accounts.add(docData.accountName);
        });
        state.classifications = data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        state.classifiedAccounts = accounts;
        state.isLoading = false;
        mainRender();
    });

    // Listener for company name
    const settingsDocPath = `artifacts/${appId}/users/${state.userId}/settings/companyProfile`;
    onSnapshot(doc(db, settingsDocPath), (doc) => {
        const newName = doc.exists() ? doc.data().name || '' : '';
        if (newName !== state.companyName) {
            state.companyName = newName;
            mainRender();
        }
    });
}

// Start the application
initialize();