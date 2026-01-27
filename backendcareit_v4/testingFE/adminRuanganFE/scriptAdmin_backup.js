// Configuration
const API_BASE = 'http://localhost:8081';
let billingData = [];
let currentEditingBilling = null;
let inacbgCodes = [];
let tarifCache = {}; // Cache for tarif data

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
                <td colspan="4" class="text-center text-muted">Tidak ada data billing</td>
            </tr>
        `;
        return;
    }

    billingData.forEach(billing => {
        const row = document.createElement('tr');
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);
        const badgeColor = getBillingSignColor(billing.billing_sign);

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
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
    switch (billingSign) {
        case 'hijau':
            return '#28a745';
        case 'kuning':
            return '#ffc107';
        case 'merah':
        case 'created':
            return '#dc3545';
        default:
            return '#6c757d';
    }
}

function getBillingSignBadgeClass(billingSign) {
    switch (billingSign) {
        case 'hijau':
            return 'hijau';
        case 'kuning':
            return 'kuning';
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
                <td colspan="4" class="text-center text-muted">Tidak ada data untuk ruangan ini</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(billing => {
        const row = document.createElement('tr');
        const badgeColor = getBillingSignColor(billing.billing_sign);
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
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
    document.getElementById('modalTindakan').value = (currentEditingBilling.tindakan_rs || []).join(', ') || '';
    document.getElementById('modalTotalTarif').value = currentEditingBilling.total_tarif_rs || '';
    document.getElementById('modalICD9').value = (currentEditingBilling.icd9 || []).join(', ') || '';
    document.getElementById('modalICD10').value = (currentEditingBilling.icd10 || []).join(', ') || '';

    // Reset INACBG form
    inacbgCodes = [];
    document.getElementById('inacbgCode').value = '';
    document.getElementById('inacbgCode').disabled = true;
    document.getElementById('inacbgCode').innerHTML = '<option value="">-- Pilih Tipe INACBG Dulu --</option>';
    document.getElementById('tipeInacbg').value = '';
    document.getElementById('totalKlaim').value = '';
    document.getElementById('codeList').innerHTML = '';
    document.getElementById('formAlert').classList.add('d-none');

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
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

// Add INACBG code
async function addInacbgCode() {
    const codeSelect = document.getElementById('inacbgCode');
    const selectedOption = codeSelect.options[codeSelect.selectedIndex];
    const code = codeSelect.value.trim();
    const codeText = selectedOption.textContent.trim();
    const tipe = document.getElementById('tipeInacbg').value;

    if (!code) {
        alert('Pilih kode INACBG terlebih dahulu');
        return;
    }

    if (inacbgCodes.some(c => c.value === code)) {
        alert('Kode sudah ditambahkan');
        return;
    }

    // Get tarif for this code
    let tarif = 0;
    const tarifData = tarifCache[tipe] || [];
    const tarifItem = tarifData.find(item => (item.KodeINA || item.kodeINA) === code);

    if (tarifItem) {
        if (tipe === 'RI') {
            // Get tarif based on patient class
            const kelas = currentEditingBilling.Kelas;
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

    inacbgCodes.push({ value: code, text: codeText, tarif: tarif });
    codeSelect.value = '';
    renderCodeList();
    calculateTotalKlaim(); // Update total after adding code
}

// Render code list
function renderCodeList() {
    const codeList = document.getElementById('codeList');
    codeList.innerHTML = '';

    if (inacbgCodes.length === 0) {
        codeList.innerHTML = '<p class="text-muted small">Belum ada kode</p>';
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

// Calculate total klaim from selected codes
function calculateTotalKlaim() {
    const total = inacbgCodes.reduce((sum, code) => sum + (code.tarif || 0), 0);
    document.getElementById('totalKlaim').value = total.toFixed(0);
}

// Remove INACBG code
function removeInacbgCode(index) {
    inacbgCodes.splice(index, 1);
    renderCodeList();
    calculateTotalKlaim(); // Update total after removing code
}

// Submit INACBG form
async function submitInacbgForm(e) {
    e.preventDefault();

    const tipeInacbg = document.getElementById('tipeInacbg').value.trim();
    const totalKlaim = parseFloat(document.getElementById('totalKlaim').value) || 0;

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

    if (totalKlaim === 0) {
        showAlert('danger', 'Total klaim tidak boleh 0');
        return;
    }

    // Prepare payload
    const payload = {
        id_billing: currentEditingBilling.id_billing,
        tipe_inacbg: tipeInacbg,
        kode_inacbg: inacbgCodes.map(c => c.value), // Extract just the codes
        total_klaim: totalKlaim,
        billing_sign: 'created' // or any status you want
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
                <td colspan="4" class="text-center text-muted">Tidak ada hasil pencarian</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(billing => {
        const row = document.createElement('tr');
        const badgeColor = getBillingSignColor(billing.billing_sign);
        const badgeClass = getBillingSignBadgeClass(billing.billing_sign);

        row.innerHTML = `
            <td>${billing.id_pasien || '-'}</td>
            <td>
                <a href="#" class="text-primary text-decoration-none" onclick="openEditModal(${billing.id_billing}); return false;">
                    ${billing.nama_pasien || '-'}
                </a>
            </td>
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
