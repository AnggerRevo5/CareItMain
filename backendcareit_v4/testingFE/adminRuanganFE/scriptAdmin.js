// Configuration
const API_BASE = 'http://localhost:8081';
let billingData = [];
let currentEditingBilling = null;
let inacbgCodes = [];
let tarifCache = {}; // Cache for tarif data
let isManualInacbgMode = false; // Track if user is in manual input mode

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    loadBillingData();
    setupEventListeners();
});

// Update current date
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('id-ID', options);
    document.getElementById('currentDate').textContent = today;
}

// Load billing data from API
async function loadBillingData() {
    try {
        const res = await fetch(`${API_BASE}/admin/billing`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        billingData = data.data || [];
        console.log('Billing data loaded:', billingData);
        // Debug: cek apakah total_klaim ada di response
        if (billingData.length > 0) {
            console.log('Sample billing item:', billingData[0]);
            console.log('Total klaim dari sample:', billingData[0].total_klaim);
        }

        renderBillingTable();
        renderRuanganSidebar();
    } catch (err) {
        console.error('Error loading billing data:', err);
        document.getElementById('billingTableBody').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">Gagal memuat data: ${err.message}</td>
            </tr>
        `;
    }
}

// Render billing table
function renderBillingTable() {
    const tbody = document.getElementById('billingTableBody');
    tbody.innerHTML = '';

    if (billingData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Tidak ada data billing</td>
            </tr>
        `;
        return;
    }

    billingData.forEach(billing => {
        const row = document.createElement('tr');
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);
        const badgeColor = getBillingSignColor(billing.billing_sign);

        const totalTarif = billing.total_tarif_rs || 0;
        const totalKlaim = billing.total_klaim || 0;

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
            <td>Rp ${Number(totalTarif).toLocaleString('id-ID')}</td>
            <td>Rp ${Number(totalKlaim).toLocaleString('id-ID')}</td>
            <td>
                <span class="billing-sign-badge ${badgeClass}" style="background-color: ${badgeColor};" title="${billing.billing_sign}"></span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditModal(${billing.id_billing})">
                    ✎ Edit
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get billing sign badge class and color
function getBillingSignColor(billingSign) {
    const normalizedSign = (billingSign || '').toString().toLowerCase();
    switch (normalizedSign) {
        case 'hijau':
            return '#28a745';
        case 'kuning':
            return '#ffc107';
        case 'orange':
            return '#fd7e14';
        case 'merah':
        case 'created':
            return '#dc3545';
        default:
            return '#6c757d';
    }
}

function getBillingSignBadgeClass(billingSign) {
    const normalizedSign = (billingSign || '').toString().toLowerCase();
    switch (normalizedSign) {
        case 'hijau':
            return 'hijau';
        case 'kuning':
            return 'kuning';
        case 'orange':
            return 'orange';
        case 'merah':
            return 'merah';
        case 'created':
            return 'created';
        default:
            return 'created';
    }
}

// Render ruangan sidebar
function renderRuanganSidebar() {
    const uniqueRuangans = [...new Set(billingData.map(b => b.ruangan))];
    const ruanganList = document.getElementById('ruanganList');
    ruanganList.innerHTML = '';

    if (uniqueRuangans.length === 0) {
        ruanganList.innerHTML = '<p class="text-muted">Tidak ada ruangan</p>';
        return;
    }

    uniqueRuangans.forEach((ruangan, index) => {
        const item = document.createElement('div');
        item.className = 'ruangan-item';
        item.textContent = ruangan || `Ruangan ${index + 1}`;
        item.onclick = () => filterByRuangan(ruangan);
        ruanganList.appendChild(item);
    });
}

// Filter billing by ruangan
function filterByRuangan(ruangan) {
    const filtered = billingData.filter(b => b.ruangan === ruangan);
    const tbody = document.getElementById('billingTableBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Tidak ada data untuk ruangan ini</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(billing => {
        const row = document.createElement('tr');
        const badgeColor = getBillingSignColor(billing.billing_sign);
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);

        const totalTarif = billing.total_tarif_rs || 0;
        const totalKlaim = billing.total_klaim || 0;

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
            <td>Rp ${Number(totalTarif).toLocaleString('id-ID')}</td>
            <td>Rp ${Number(totalKlaim).toLocaleString('id-ID')}</td>
            <td>
                <span class="billing-sign-badge ${badgeClass}" style="background-color: ${badgeColor};" title="${billing.billing_sign}"></span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditModal(${billing.id_billing})">
                    ✎ Edit
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Open edit modal
function openEditModal(billingId) {
    currentEditingBilling = billingData.find(b => b.id_billing === billingId);
    if (!currentEditingBilling) {
        alert('Data billing tidak ditemukan');
        return;
    }

    // Populate modal with billing data
    document.getElementById('modalNamaPasien').value = currentEditingBilling.nama_pasien || '';
    document.getElementById('modalIdPasien').value = currentEditingBilling.id_pasien || '';
    document.getElementById('modalKelas').value = currentEditingBilling.Kelas || '';
    
    // Tampilkan dokter yang menangani pasien
    const dokterList = currentEditingBilling.nama_dokter || [];
    const dokterListEl = document.getElementById('dokterList');
    if (dokterList.length > 0) {
        dokterListEl.innerHTML = dokterList.map(dokter => 
            `<span class="badge bg-info me-2 mb-1">${dokter}</span>`
        ).join('');
    } else {
        dokterListEl.innerHTML = '<span class="text-muted">Belum ada data dokter</span>';
    }
    
    // Total tarif & total klaim kumulatif
    // Handle berbagai kemungkinan nama field (case-insensitive)
    const totalTarif = Number(currentEditingBilling.total_tarif_rs || currentEditingBilling.Total_Tarif_RS || 0);
    const totalKlaimLama = Number(currentEditingBilling.total_klaim || currentEditingBilling.Total_Klaim || currentEditingBilling.total_klaim_lama || 0);
    document.getElementById('modalTotalTarif').value = totalTarif.toLocaleString('id-ID');
    
    // Tindakan RS - semua yang ada sekarang = "lama" (karena tidak ada cara membedakan mana yang baru)
    const tindakanLama = currentEditingBilling.tindakan_rs || [];
    document.getElementById('tindakanLama').textContent = tindakanLama.length > 0 ? tindakanLama.join(', ') : 'Tidak ada';
    document.getElementById('tindakanBaru').textContent = 'Belum ada data baru';
    
    // ICD9 & ICD10 - semua yang ada sekarang = "lama"
    const icd9Lama = currentEditingBilling.icd9 || [];
    const icd10Lama = currentEditingBilling.icd10 || [];
    document.getElementById('icd9Lama').textContent = icd9Lama.length > 0 ? icd9Lama.join(', ') : 'Tidak ada';
    document.getElementById('icd10Lama').textContent = icd10Lama.length > 0 ? icd10Lama.join(', ') : 'Tidak ada';
    document.getElementById('icd9Baru').textContent = 'Belum ada data baru';
    document.getElementById('icd10Baru').textContent = 'Belum ada data baru';

    // INACBG Lama
    const existingRI = currentEditingBilling.inacbg_ri || [];
    const existingRJ = currentEditingBilling.inacbg_rj || [];
    const inacbgRILamaEl = document.getElementById('inacbgRILama');
    const inacbgRJLamaEl = document.getElementById('inacbgRJLama');
    const totalKlaimLamaEl = document.getElementById('totalKlaimLama');
    
    // Debug: log untuk cek data yang diterima
    console.log('=== DEBUG TOTAL KLAIM LAMA ===');
    console.log('Current editing billing:', currentEditingBilling);
    console.log('total_klaim:', currentEditingBilling.total_klaim);
    console.log('Total_Klaim:', currentEditingBilling.Total_Klaim);
    console.log('total_klaim_lama:', currentEditingBilling.total_klaim_lama);
    console.log('Total klaim lama (processed):', totalKlaimLama);
    console.log('All keys in billing object:', Object.keys(currentEditingBilling));
    console.log('================================');
    
    if (existingRI.length > 0) {
        inacbgRILamaEl.innerHTML = `<strong>RI:</strong> ${existingRI.join(', ')}`;
    } else {
        inacbgRILamaEl.textContent = 'RI: Tidak ada';
    }
    
    if (existingRJ.length > 0) {
        inacbgRJLamaEl.innerHTML = `<strong>RJ:</strong> ${existingRJ.join(', ')}`;
    } else {
        inacbgRJLamaEl.textContent = 'RJ: Tidak ada';
    }
    
    // Tampilkan total klaim lama (selalu tampilkan, meskipun 0)
    totalKlaimLamaEl.textContent = `Total Klaim Lama: Rp ${totalKlaimLama.toLocaleString('id-ID')}`;
    
    // Set total klaim lama di input
    document.getElementById('totalKlaimLamaInput').value = totalKlaimLama.toFixed(0);
    
    // Set tanggal keluar jika ada
    // (akan diisi oleh admin, jadi kosong dulu)
    document.getElementById('tanggalKeluar').value = '';

    // Reset INACBG form
    inacbgCodes = [];
    isManualInacbgMode = false;
    document.getElementById('inacbgCode').value = '';
    document.getElementById('inacbgCode').disabled = true;
    document.getElementById('inacbgCode').classList.remove('d-none');
    document.getElementById('inacbgCodeManual').value = '';
    document.getElementById('inacbgCodeManual').classList.add('d-none');
    document.getElementById('inacbgCode').innerHTML = '<option value="">-- Pilih Tipe INACBG Dulu --</option>';
    document.getElementById('tipeInacbg').value = '';
    document.getElementById('totalKlaim').value = '0';
    document.getElementById('codeList').innerHTML = '<small class="text-muted">Belum ada kode baru</small>';
    document.getElementById('totalKlaimAkhir').value = totalKlaimLama.toFixed(0);
    document.getElementById('formAlert').classList.add('d-none');
    
    // Update billing sign display awal
    updateBillingSignDisplay();

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// Toggle between dropdown and manual input
function toggleInacbgInput() {
    isManualInacbgMode = !isManualInacbgMode;
    const codeSelect = document.getElementById('inacbgCode');
    const codeManual = document.getElementById('inacbgCodeManual');
    
    if (isManualInacbgMode) {
        // Switch to manual input
        codeSelect.classList.add('d-none');
        codeManual.classList.remove('d-none');
        codeManual.focus();
        codeManual.value = '';
    } else {
        // Switch back to dropdown
        codeSelect.classList.remove('d-none');
        codeManual.classList.add('d-none');
        codeManual.value = '';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tipe INACBG change
    document.getElementById('tipeInacbg').addEventListener('change', loadInacbgCodes);

    // Add code button
    document.getElementById('addCodeBtn').addEventListener('click', addInacbgCode);

    // INACBG form submit
    document.getElementById('inacbgForm').addEventListener('submit', submitInacbgForm);

    // Search input
    document.getElementById('searchInput').addEventListener('input', searchBilling);

    // Manual input enter key
    document.getElementById('inacbgCodeManual').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addInacbgCode();
        }
    });
}

// Load INACBG codes based on tipe
async function loadInacbgCodes() {
    const tipe = document.getElementById('tipeInacbg').value;
    const codeSelect = document.getElementById('inacbgCode');

    if (!tipe) {
        codeSelect.disabled = true;
        codeSelect.innerHTML = '<option value="">-- Pilih Tipe INACBG Dulu --</option>';
        return;
    }

    const endpoint = tipe === 'RI' ? '/tarifBPJSRawatInap' : '/tarifBPJSRawatJalan';

    try {
        codeSelect.disabled = true;
        codeSelect.innerHTML = '<option value="">Memuat...</option>';

        // Check cache first
        if (!tarifCache[tipe]) {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            tarifCache[tipe] = await res.json();
        }

        const data = tarifCache[tipe] || [];
        const items = Array.isArray(data) ? data : [];

        codeSelect.innerHTML = '<option value="">-- Pilih Kode --</option>';
        codeSelect.disabled = false;

        items.forEach(item => {
            const option = document.createElement('option');
            // Use KodeINA as value and Deskripsi as display text
            option.value = item.KodeINA || item.kodeINA || item.KodeINA || '';
            option.textContent = item.Deskripsi || item.deskripsi || item.Deskripsi || '';
            
            // If value is empty but we have other fields, try alternatives
            if (!option.value) {
                option.value = item.KodeINA_RJ || item.kodeINA_RJ || item.KodeINA_RI || item.kodeINA_RI || '';
            }
            
            codeSelect.appendChild(option);
        });

        console.log(`Loaded ${items.length} INACBG codes for type ${tipe}`);
    } catch (err) {
        console.error('Error loading INACBG codes:', err);
        codeSelect.disabled = true;
        codeSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

// Get tarif for a code from cache or return 0
function getTarifForCode(code, tipe, kelas = null) {
    let tarif = 0;
    const tarifData = tarifCache[tipe] || [];
    const tarifItem = tarifData.find(item => (item.KodeINA || item.kodeINA) === code);

    if (tarifItem) {
        if (tipe === 'RI') {
            // Get tarif based on patient class
            if (!kelas) kelas = currentEditingBilling.Kelas;
            if (kelas === '1') {
                tarif = tarifItem.Kelas1 || 0;
            } else if (kelas === '2') {
                tarif = tarifItem.Kelas2 || 0;
            } else if (kelas === '3') {
                tarif = tarifItem.Kelas3 || 0;
            }
        } else if (tipe === 'RJ') {
            // Get tarif directly from TarifINACBG field
            tarif = tarifItem.TarifINACBG || tarifItem.tarif_inacbg || 0;
        }
    }

    return tarif;
}

// Add INACBG code (from dropdown or manual input)
async function addInacbgCode() {
    const tipe = document.getElementById('tipeInacbg').value;

    if (!tipe) {
        alert('Pilih tipe INACBG terlebih dahulu');
        return;
    }

    let code = '';
    let codeText = '';

    if (isManualInacbgMode) {
        // Manual input mode
        const manualInput = document.getElementById('inacbgCodeManual').value.trim().toUpperCase();
        if (!manualInput) {
            alert('Masukkan kode INACBG');
            return;
        }
        code = manualInput;
        codeText = manualInput; // Manual input, use code as text
    } else {
        // Dropdown mode
        const codeSelect = document.getElementById('inacbgCode');
        const selectedOption = codeSelect.options[codeSelect.selectedIndex];
        code = codeSelect.value.trim();
        codeText = selectedOption.textContent.trim();

        if (!code) {
            alert('Pilih kode INACBG terlebih dahulu');
            return;
        }
    }

    if (inacbgCodes.some(c => c.value === code)) {
        alert('Kode sudah ditambahkan');
        return;
    }

    // Get tarif for this code
    const tarif = getTarifForCode(code, tipe);

    inacbgCodes.push({ value: code, text: codeText, tarif: tarif });
    
    // Clear input/select
    if (isManualInacbgMode) {
        document.getElementById('inacbgCodeManual').value = '';
    } else {
        document.getElementById('inacbgCode').value = '';
    }
    
    renderCodeList();
    calculateTotalKlaim(); // Update total after adding code
}

// Render code list
function renderCodeList() {
    const codeList = document.getElementById('codeList');
    codeList.innerHTML = '';

    if (inacbgCodes.length === 0) {
        codeList.innerHTML = '<small class="text-muted">Belum ada kode baru</small>';
        return;
    }

    inacbgCodes.forEach((codeObj, index) => {
        const badge = document.createElement('span');
        badge.className = 'code-badge';
        const tarifDisplay = codeObj.tarif ? `(Rp${codeObj.tarif.toLocaleString('id-ID')})` : '';
        badge.innerHTML = `
            ${codeObj.text || codeObj.value} ${tarifDisplay}
            <span class="remove-btn" onclick="removeInacbgCode(${index})">×</span>
        `;
        codeList.appendChild(badge);
    });
}

// Calculate total klaim dari kode baru SAJA (lama sudah tercatat di total_klaim backend)
function calculateTotalKlaim() {
    const totalBaru = inacbgCodes.reduce((sum, code) => sum + (code.tarif || 0), 0);
    document.getElementById('totalKlaim').value = totalBaru.toFixed(0);
    
    // Hitung total klaim akhir = lama + baru
    const totalKlaimLama = parseFloat(document.getElementById('totalKlaimLamaInput').value) || 0;
    const totalKlaimAkhir = totalKlaimLama + totalBaru;
    document.getElementById('totalKlaimAkhir').value = totalKlaimAkhir.toFixed(0);

    // Update billing sign display berdasarkan total tarif RS kumulatif vs total klaim akhir
    updateBillingSignDisplay();
}

// Remove INACBG code
function removeInacbgCode(index) {
    inacbgCodes.splice(index, 1);
    renderCodeList();
    calculateTotalKlaim(); // Update total after removing code
}

// Hitung billing sign berdasarkan rumus:
// persentase = (total_tarif_rs / total_klaim_akhir) * 100
function calculateBillingSign() {
    // totalTarifRs sudah kumulatif (lama + baru) dari backend
    const totalTarifRsStr = document.getElementById('modalTotalTarif').value.replace(/[^\d]/g, '');
    const totalTarifRs = parseFloat(totalTarifRsStr) || 0;

    // total klaim akhir = lama + baru
    const totalKlaimAkhir = parseFloat(document.getElementById('totalKlaimAkhir').value) || 0;

    if (totalTarifRs <= 0 || totalKlaimAkhir <= 0) {
        return { sign: null, percentage: 0 };
    }

    const percentage = (totalTarifRs / totalKlaimAkhir) * 100;
    let sign = 'hijau';

    if (percentage <= 25) {
        sign = 'hijau';
    } else if (percentage >= 26 && percentage <= 50) {
        sign = 'kuning';
    } else if (percentage >= 51 && percentage <= 75) {
        sign = 'orange';
    } else if (percentage >= 76) {
        sign = 'merah';
    }

    return { sign, percentage };
}

// Update tampilan billing sign di modal
function updateBillingSignDisplay() {
    const container = document.getElementById('billingSignContainer');
    const badgeEl = document.getElementById('billingSignBadge');
    const textEl = document.getElementById('billingSignText');

    if (!container || !badgeEl || !textEl) return;

    const { sign, percentage } = calculateBillingSign();

    if (!sign) {
        badgeEl.className = 'badge bg-secondary';
        badgeEl.textContent = '-';
        textEl.textContent = '';
        return;
    }

    const color = getBillingSignColor(sign);
    badgeEl.className = 'badge';
    badgeEl.style.backgroundColor = color;
    badgeEl.textContent = sign.toUpperCase();

    const roundedPct = percentage.toFixed(2);
    textEl.textContent = `Tarif RS ≈ ${roundedPct}% dari BPJS`;
}

// Format billing sign ke Title Case agar sesuai enum di DB
function formatBillingSignValue(sign) {
    if (!sign) return '';
    const lower = sign.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Submit INACBG form
async function submitInacbgForm(e) {
    e.preventDefault();

    const tipeInacbg = document.getElementById('tipeInacbg').value.trim();
    // total klaim BARU (tambahan); lama sudah tersimpan di backend
    const totalKlaimBaru = parseFloat(document.getElementById('totalKlaim').value) || 0;

    // Validation
    if (!currentEditingBilling) {
        showAlert('danger', 'Data billing tidak ditemukan');
        return;
    }

    if (inacbgCodes.length === 0) {
        showAlert('danger', 'Tambahkan minimal satu kode INACBG');
        return;
    }

    if (!tipeInacbg) {
        showAlert('danger', 'Pilih tipe INACBG');
        return;
    }

    if (totalKlaimBaru === 0) {
        showAlert('danger', 'Total klaim tambahan tidak boleh 0');
        return;
    }

    // Hitung billing sign berdasarkan total tarif RS dan total klaim
    const { sign: billingSign } = calculateBillingSign();
    const formattedBillingSign = formatBillingSignValue(billingSign);

    // Ambil tanggal keluar jika diisi
    const tanggalKeluar = document.getElementById('tanggalKeluar').value.trim();

    // Prepare payload
    const payload = {
        id_billing: currentEditingBilling.id_billing,
        tipe_inacbg: tipeInacbg,
        kode_inacbg: inacbgCodes.map(c => c.value), // Extract just the codes
        total_klaim: totalKlaimBaru, // Total klaim BARU saja (akan ditambahkan ke yang lama di backend)
        billing_sign: formattedBillingSign, // kirim billing sign sesuai enum DB
        tanggal_keluar: tanggalKeluar || '' // Tanggal keluar diisi oleh admin
    };

    try {
        const res = await fetch(`${API_BASE}/admin/inacbg`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || result.message || 'Gagal menyimpan INACBG');
        }

        showAlert('success', 'INACBG berhasil disimpan');
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            loadBillingData();
        }, 1500);

    } catch (err) {
        console.error('Error:', err);
        showAlert('danger', err.message);
    }
}

// Show alert in modal
function showAlert(type, message) {
    const alert = document.getElementById('formAlert');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.classList.remove('d-none');
}

// Search billing
function searchBilling(e) {
    const keyword = e.target.value.toLowerCase().trim();

    if (keyword === '') {
        renderBillingTable();
        return;
    }

    const filtered = billingData.filter(b =>
        (b.nama_pasien && b.nama_pasien.toLowerCase().includes(keyword)) ||
        (b.id_pasien && b.id_pasien.toString().includes(keyword))
    );

    const tbody = document.getElementById('billingTableBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Tidak ada hasil pencarian</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(billing => {
        const row = document.createElement('tr');
        const badgeColor = getBillingSignColor(billing.billing_sign);
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);

        const totalTarif = billing.total_tarif_rs || 0;
        const totalKlaim = billing.total_klaim || 0;

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
            <td>Rp ${Number(totalTarif).toLocaleString('id-ID')}</td>
            <td>Rp ${Number(totalKlaim).toLocaleString('id-ID')}</td>
            <td>
                <span class="billing-sign-badge ${badgeClass}" style="background-color: ${badgeColor};" title="${billing.billing_sign}"></span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditModal(${billing.id_billing})">
                    ✎ Edit
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
