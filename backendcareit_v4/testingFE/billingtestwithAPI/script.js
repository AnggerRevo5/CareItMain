// ============= CONFIGURATION =============
const API_BASE = "http://192.168.1.2:8081";
const FETCH_TIMEOUT = 10000;

// ============= UTILITY FUNCTIONS =============
function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============= SEARCHABLE DROPDOWN FUNCTIONS =============
function initSearchableDropdown(selectId) {
    const wrapper = document.getElementById(`wrapper_${selectId}`);
    const input = document.getElementById(selectId);
    const inputField = document.getElementById(`input_${selectId}`) || input;
    const dropdown = document.getElementById(`dropdown_${selectId}`);
    const searchInput = document.getElementById(`search_${selectId}`);
    const optionsContainer = document.getElementById(`options_${selectId}`);
    const hiddenSelect = document.getElementById(`select_${selectId}`);
    
    if (!wrapper || !input || !dropdown || !searchInput || !optionsContainer) return;
    
    const isMultiSelect = wrapper.classList.contains('multi-select');
    let allOptions = [];
    let filteredOptions = [];
    let selectedIndex = -1;
    let selectedValues = new Set();
    
    // Toggle dropdown
    input.addEventListener('click', function(e) {
        // Don't open if clicking on chip remove button
        if (e.target.classList.contains('chip-remove')) return;
        e.stopPropagation();
        const isOpen = wrapper.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) {
            openDropdown();
        }
    });
    
    // For multi-select, also handle input field click and search
    if (isMultiSelect && inputField) {
        inputField.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                openDropdown();
            }
        });
        
        // Allow typing in input field for multi-select
        inputField.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            if (keyword) {
                const isOpen = wrapper.classList.contains('open');
                if (!isOpen) {
                    openDropdown();
                }
                searchInput.value = keyword;
                filterOptions(keyword);
            }
        });
    }
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        filterOptions(keyword);
    });
    
    // Prevent dropdown close when clicking inside
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Keyboard navigation
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!wrapper.classList.contains('open')) {
                openDropdown();
            }
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightNext();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightPrev();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selectHighlighted();
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });
    
    function openDropdown() {
        wrapper.classList.add('open');
        dropdown.classList.add('show');
        if (!isMultiSelect) {
            input.classList.add('searching');
        }
        searchInput.value = '';
        searchInput.focus();
        filterOptions('');
    }
    
    function closeDropdown() {
        wrapper.classList.remove('open');
        dropdown.classList.remove('show');
        if (!isMultiSelect) {
            input.classList.remove('searching');
        }
        selectedIndex = -1;
    }
    
    function closeAllDropdowns() {
        document.querySelectorAll('.searchable-select-wrapper').forEach(w => {
            w.classList.remove('open');
            w.querySelector('.searchable-select-dropdown').classList.remove('show');
            w.querySelector('.searchable-select-input').classList.remove('searching');
        });
    }
    
    function filterOptions(keyword) {
        filteredOptions = keyword === '' 
            ? allOptions 
            : allOptions.filter(opt => opt.text.toLowerCase().includes(keyword));
        
        renderOptions();
    }
    
    function renderOptions() {
        optionsContainer.innerHTML = '';
        selectedIndex = -1;
        
        if (filteredOptions.length === 0) {
            optionsContainer.innerHTML = '<div class="searchable-select-no-results">Tidak ada hasil</div>';
            return;
        }
        
        filteredOptions.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'searchable-select-option';
            div.textContent = option.text;
            div.dataset.value = option.value;
            div.dataset.index = index;
            
            // Check if selected (for multi-select)
            if (isMultiSelect && selectedValues.has(option.value)) {
                div.classList.add('selected');
            } else if (!isMultiSelect) {
                const currentInput = document.getElementById(`input_${selectId}`) || input;
                if (currentInput && currentInput.value === option.text) {
                    div.classList.add('selected');
                }
            }
            
            div.addEventListener('click', function() {
                selectOption(option.value, option.text);
            });
            
            div.addEventListener('mouseenter', function() {
                highlightOption(index);
            });
            
            optionsContainer.appendChild(div);
        });
    }
    
    function renderChips() {
        if (!isMultiSelect) return;
        
        // Clear input container
        input.innerHTML = '';
        
        // Add chips for selected items
        selectedValues.forEach(value => {
            const option = allOptions.find(opt => opt.value === value);
            if (option) {
                const chip = document.createElement('span');
                chip.className = 'selected-chip';
                chip.innerHTML = `
                    <span>${option.text}</span>
                    <span class="chip-remove" data-value="${value}">×</span>
                `;
                chip.querySelector('.chip-remove').addEventListener('click', function(e) {
                    e.stopPropagation();
                    removeSelection(value);
                });
                input.appendChild(chip);
            }
        });
        
        // Add input field
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.id = `input_${selectId}`;
        inputEl.placeholder = selectedValues.size === 0 ? input.getAttribute('placeholder') || '-- Pilih --' : '';
        inputEl.autocomplete = 'off';
        input.appendChild(inputEl);
        
        // Add event listeners to new input field
        inputEl.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                openDropdown();
            }
        });
        
        inputEl.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            if (keyword) {
                const isOpen = wrapper.classList.contains('open');
                if (!isOpen) {
                    openDropdown();
                }
                searchInput.value = keyword;
                filterOptions(keyword);
            }
        });
    }
    
    function highlightOption(index) {
        document.querySelectorAll(`#options_${selectId} .searchable-select-option`).forEach((opt, i) => {
            opt.classList.remove('highlighted');
            if (i === index) {
                opt.classList.add('highlighted');
                selectedIndex = index;
            }
        });
    }
    
    function highlightNext() {
        if (selectedIndex < filteredOptions.length - 1) {
            selectedIndex++;
            highlightOption(selectedIndex);
            scrollToHighlighted();
        }
    }
    
    function highlightPrev() {
        if (selectedIndex > 0) {
            selectedIndex--;
            highlightOption(selectedIndex);
            scrollToHighlighted();
        }
    }
    
    function scrollToHighlighted() {
        const highlighted = document.querySelector(`#options_${selectId} .searchable-select-option.highlighted`);
        if (highlighted) {
            highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    function selectHighlighted() {
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            const option = filteredOptions[selectedIndex];
            selectOption(option.value, option.text);
        }
    }
    
    function selectOption(value, text) {
        if (isMultiSelect) {
            // Toggle selection for multi-select
            if (selectedValues.has(value)) {
                removeSelection(value);
            } else {
                selectedValues.add(value);
                if (hiddenSelect) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    option.selected = true;
                    hiddenSelect.appendChild(option);
                }
                renderChips();
                renderOptions(); // Update checkmarks
            }
            // Keep dropdown open for multi-select
            searchInput.focus();
        } else {
            // Single select behavior
            inputField.value = text;
            input.classList.remove('searching');
            if (hiddenSelect) {
                hiddenSelect.value = value;
            }
            closeDropdown();
        }
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        if (hiddenSelect) hiddenSelect.dispatchEvent(event);
        
        // Jika ini adalah tarif_rs, hitung ulang total
        if (selectId === 'tarif_rs') {
            calculateTotalTarifRS();
        }
    }
    
    function removeSelection(value) {
        selectedValues.delete(value);
        if (hiddenSelect) {
            const option = hiddenSelect.querySelector(`option[value="${value}"]`);
            if (option) option.remove();
        }
        renderChips();
        renderOptions(); // Update checkmarks
        
        // Jika ini adalah tarif_rs, hitung ulang total
        if (selectId === 'tarif_rs') {
            calculateTotalTarifRS();
        }
    }
    
    // Public function to set options
    return {
        setOptions: function(options) {
            allOptions = options;
            filteredOptions = options;
            if (isMultiSelect) {
                renderChips();
            }
            renderOptions();
        },
        getValue: function() {
            if (isMultiSelect) {
                return Array.from(selectedValues);
            }
            return hiddenSelect ? hiddenSelect.value : '';
        },
        setValue: function(value) {
            if (isMultiSelect) {
                // For multi-select, value should be an array
                if (Array.isArray(value)) {
                    selectedValues = new Set(value);
                    if (hiddenSelect) {
                        hiddenSelect.innerHTML = '';
                        value.forEach(val => {
                            const option = allOptions.find(opt => opt.value === val);
                            if (option) {
                                const optEl = document.createElement('option');
                                optEl.value = option.value;
                                optEl.textContent = option.text;
                                optEl.selected = true;
                                hiddenSelect.appendChild(optEl);
                            }
                        });
                    }
                    renderChips();
                    renderOptions();
                }
                
                // Jika ini adalah tarif_rs, hitung ulang total setelah set value
                if (selectId === 'tarif_rs') {
                    setTimeout(() => calculateTotalTarifRS(), 100);
                }
            } else {
                // Untuk single-select, cari option berdasarkan value atau text
                let option = allOptions.find(opt => opt.value === value || opt.value === value.toString());
                
                // Jika tidak ditemukan berdasarkan value, coba cari berdasarkan text
                if (!option) {
                    option = allOptions.find(opt => opt.text === value || opt.text === value.toString());
                }
                
                if (option) {
                    // Update input element langsung
                    input.value = option.text;
                    if (hiddenSelect) {
                        hiddenSelect.value = option.value;
                    }
                    console.log(`[${selectId}] setValue: Set to "${option.text}" (value: "${option.value}")`);
                } else {
                    // Jika option tidak ditemukan, coba set langsung ke input sebagai fallback
                    console.warn(`[${selectId}] setValue: Option not found for value "${value}", setting directly to input`);
                    input.value = value;
                    if (hiddenSelect) {
                        // Coba cari di hidden select
                        const hiddenOption = Array.from(hiddenSelect.options).find(opt => 
                            opt.text === value || opt.value === value || opt.text === value.toString() || opt.value === value.toString()
                        );
                        if (hiddenOption) {
                            hiddenSelect.value = hiddenOption.value;
                        }
                    }
                }
                
                // Jika ini adalah tarif_rs, hitung ulang total setelah set value
                if (selectId === 'tarif_rs') {
                    setTimeout(() => calculateTotalTarifRS(), 100);
                }
            }
        }
    };
}

// Store dropdown instances
const dropdownInstances = {};

// ============= LOADER DROPDOWN =============
async function loadSelect(url, selectId, labelField) {
    const input = document.getElementById(selectId);
    const hiddenSelect = document.getElementById(`select_${selectId}`);
    if (!input && !hiddenSelect) return;
    
    // Initialize searchable dropdown if not already
    if (!dropdownInstances[selectId]) {
        dropdownInstances[selectId] = initSearchableDropdown(selectId);
    }
    
    // Show loading
    if (input) {
        input.value = 'Memuat...';
        input.disabled = true;
    }

    try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        // Debug: log struktur data untuk troubleshooting
        if (data.length > 0) {
            console.log(`[${selectId}] Data structure:`, Object.keys(data[0]));
            console.log(`[${selectId}] Looking for field: "${labelField}"`);
            console.log(`[${selectId}] First item:`, data[0]);
        }

        // Helper function untuk mendapatkan field value (case-insensitive dan flexible)
        function getFieldValue(item, fieldName) {
            // KHUSUS untuk tarif_rs: HANYA gunakan "Deskripsi", JANGAN pakai "KodeRS" (ID)
            if (selectId === 'tarif_rs') {
                // Coba langsung "Deskripsi"
                if (item['Deskripsi'] !== undefined && item['Deskripsi'] !== null && item['Deskripsi'] !== '') {
                    return item['Deskripsi'];
                }
                
                // Coba case-insensitive untuk "Deskripsi"
                const keys = Object.keys(item);
                const deskripsiKey = keys.find(k => k.toLowerCase() === 'deskripsi');
                if (deskripsiKey && item[deskripsiKey] !== null && item[deskripsiKey] !== '') {
                    return item[deskripsiKey];
                }
                
                // JANGAN fallback ke field lain untuk tarif_rs (terutama KodeRS)
                return null;
            }
            
            // KHUSUS untuk ruangan: tampilkan hanya Nama_Ruangan
            if (selectId === 'ruangan') {
                const namaRuangan = item['Nama_Ruangan'] || '';
                return namaRuangan || null;
            }
            
            // Untuk dropdown lain, gunakan logic normal
            // Coba langsung
            if (item[fieldName] !== undefined && item[fieldName] !== null && item[fieldName] !== '') {
                return item[fieldName];
            }
            
            // Coba case-insensitive
            const lowerField = fieldName.toLowerCase();
            const keys = Object.keys(item);
            const foundKey = keys.find(k => k.toLowerCase() === lowerField);
            if (foundKey && item[foundKey] !== null && item[foundKey] !== '') {
                return item[foundKey];
            }
            
            // Coba partial match (jika fieldName adalah "Tindakan_RS", cari yang mengandung "tindakan")
            const partialMatch = keys.find(k => {
                const kLower = k.toLowerCase();
                const fieldLower = lowerField.replace(/_/g, '');
                return kLower.includes(fieldLower) || fieldLower.includes(kLower);
            });
            if (partialMatch && item[partialMatch] !== null && item[partialMatch] !== '') {
                console.log(`[${selectId}] Using partial match: "${partialMatch}" instead of "${fieldName}"`);
                return item[partialMatch];
            }
            
            // Jika tidak ditemukan, coba ambil field pertama yang ada value
            const firstValidKey = keys.find(k => item[k] !== null && item[k] !== '' && item[k] !== undefined);
            if (firstValidKey) {
                console.warn(`[${selectId}] Field "${fieldName}" not found, using "${firstValidKey}" instead`);
                return item[firstValidKey];
            }
            
            return null;
        }

        // Build options array untuk searchable dropdown
        const options = [];
        
        // Clear ruanganDataList jika ini adalah load ruangan
        if (selectId === 'ruangan') {
            ruanganDataList = [];
        }
        
        // Clear tarifRSDataList jika ini adalah load tarif_rs
        if (selectId === 'tarif_rs') {
            tarifRSDataList = [];
        }
        
        data.forEach(item => {
            const value = getFieldValue(item, labelField);
            
            // Skip jika value kosong/null
            if (!value || value.toString().trim() === '') {
                return;
            }
            
            const valueStr = value.toString().trim();
            options.push({
                value: valueStr,
                text: valueStr
            });
            
            // KHUSUS untuk ruangan: store data asli untuk lookup (dengan ID_Ruangan)
            if (selectId === 'ruangan') {
                ruanganDataList.push(item);
                console.log(`[ruangan] Stored ruangan data:`, item);
            }
            
            // KHUSUS untuk tarif_rs: store data asli untuk lookup harga
            if (selectId === 'tarif_rs') {
                tarifRSDataList.push(item);
                console.log(`[tarif_rs] Stored tarif RS data:`, item);
            }
        });
        
        if (options.length === 0) {
            console.warn(`[${selectId}] No valid data found! Field "${labelField}" may not exist.`);
            if (input) {
                input.value = 'Data tidak tersedia';
                input.disabled = true;
            }
        } else {
            // Set options ke searchable dropdown
            if (dropdownInstances[selectId]) {
                dropdownInstances[selectId].setOptions(options);
            }
            
            // Set options ke hidden select juga
            if (hiddenSelect) {
                hiddenSelect.innerHTML = '<option value="">-- Pilih --</option>';
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    hiddenSelect.appendChild(option);
                });
            }
            
            if (input) {
                input.value = '';
                input.disabled = false;
                input.placeholder = '-- Pilih --';
            }
            
            console.log(`[${selectId}] Loaded ${options.length} items`);
            
            // Jika ini adalah load ruangan dan ada pending ruangan ID, set sekarang
            if (selectId === 'ruangan' && pendingRuanganId) {
                console.log('Ruangan selesai di-load, setting pending ruangan ID:', pendingRuanganId);
                setTimeout(() => {
                    setRuanganFromId(pendingRuanganId);
                    pendingRuanganId = null; // Clear pending
                }, 100);
            }
            
            // Jika ini adalah load tarif_rs, hitung total setelah load selesai
            if (selectId === 'tarif_rs') {
                setTimeout(() => {
                    calculateTotalTarifRS();
                }, 200);
            }
        }
    } catch (error) {
        console.error(`Error loading ${selectId}:`, error);
        if (input) {
            input.value = 'Error memuat data';
            input.disabled = true;
        }
    }
}

// ============= LOAD SEMUA DROPDOWN =============
async function loadAllSelects() {
    // Load semua dropdown secara paralel untuk performa lebih baik
    await Promise.all([
        loadSelect(`${API_BASE}/dokter`, 'nama_dokter', 'Nama_Dokter'),
        // Untuk tarif_rs: gunakan field "Deskripsi" dari JSON response (bukan KodeRS/ID)
        loadSelect(`${API_BASE}/tarifRS`, 'tarif_rs', 'Deskripsi'),
        loadSelect(`${API_BASE}/icd9`, 'icd9', 'Prosedur'),
        loadSelect(`${API_BASE}/icd10`, 'icd10', 'Diagnosa'),
        loadSelect(`${API_BASE}/ruangan`, 'ruangan', 'Nama_Ruangan')
    ]);
}

// Initialize all searchable dropdowns
function initAllDropdowns() {
    const dropdownIds = ['nama_dokter', 'tarif_rs', 'icd9', 'icd10', 'ruangan'];
    dropdownIds.forEach(id => {
        if (!dropdownInstances[id]) {
            dropdownInstances[id] = initSearchableDropdown(id);
        }
    });
}

// ============= CALCULATE TOTAL TARIF RS =============
function calculateTotalTarifRS() {
    const totalInput = document.getElementById('total_tarif_rs');
    if (!totalInput) {
        console.warn('total_tarif_rs input tidak ditemukan');
        return;
    }
    
    // Ambil semua tindakan yang dipilih dari dropdown tarif_rs
    const selectedTindakan = [];
    if (dropdownInstances['tarif_rs']) {
        const selectedValues = dropdownInstances['tarif_rs'].getValue();
        if (Array.isArray(selectedValues)) {
            selectedTindakan.push(...selectedValues);
        }
    }
    
    // Jika tidak ada tindakan yang dipilih, set total ke 0
    if (selectedTindakan.length === 0) {
        totalInput.value = '0';
        return;
    }
    
    // Hitung total dari setiap tindakan
    let total = 0;
    selectedTindakan.forEach(tindakan => {
        // Cari data tarif RS berdasarkan Deskripsi (tindakan) - case insensitive
        const tarifData = tarifRSDataList.find(t => {
            const deskripsi = t.Deskripsi || t.deskripsi || t.Tindakan_RS || t.tindakan_rs || '';
            return deskripsi.toString().trim().toLowerCase() === tindakan.toString().trim().toLowerCase();
        });
        
        if (tarifData) {
            // Ambil harga - coba berbagai kemungkinan field name
            // Dari model: Harga int `gorm:"column:Tarif_RS"`
            // Jadi di JSON response kemungkinan fieldnya adalah "Tarif_RS" atau "Harga"
            const harga = tarifData.Tarif_RS || 
                         tarifData.tarif_rs ||
                         tarifData.TarifRS ||
                         tarifData.tarifRS ||
                         tarifData.Harga || 
                         tarifData.harga ||
                         0;
            
            // Convert ke number
            const hargaNum = parseInt(harga) || 0;
            total += hargaNum;
            
            console.log(`Tindakan "${tindakan}": Rp ${hargaNum.toLocaleString('id-ID')}`);
        } else {
            console.warn(`Harga tidak ditemukan untuk tindakan: "${tindakan}"`);
            console.log('Available tarif RS data (first 3):', tarifRSDataList.slice(0, 3).map(t => ({
                Deskripsi: t.Deskripsi,
                Tarif_RS: t.Tarif_RS,
                Harga: t.Harga,
                allKeys: Object.keys(t)
            })));
        }
    });
    
    // Format angka dengan pemisah ribuan (format Indonesia)
    totalInput.value = total.toLocaleString('id-ID');
    
    console.log(`Total Tarif RS: Rp ${total.toLocaleString('id-ID')}`);
}

// ============= AUTOCOMPLETE PASIEN =============
const inputPasien = document.getElementById('nama_pasien');
const listPasien = document.getElementById('list_pasien');
let searchTimeout;
let currentSearchAbortController = null;

async function searchPasien(keyword) {
    // Cancel previous request jika masih pending
    if (currentSearchAbortController) {
        currentSearchAbortController.abort();
    }
    
    if (keyword.length < 2) {
        listPasien.innerHTML = '';
        listPasien.classList.remove('show');
        return;
    }

    // Tampilkan loading
    listPasien.innerHTML = '<div class="autocomplete-item text-center"><span class="spinner-border spinner-border-sm me-2"></span>Mencari...</div>';
    listPasien.classList.add('show');

    try {
        // Buat AbortController untuk cancel request
        currentSearchAbortController = new AbortController();
        
        const res = await fetchWithTimeout(
            `${API_BASE}/pasien/search?nama=${encodeURIComponent(keyword)}`,
            { signal: currentSearchAbortController.signal }
        );
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const response = await res.json();
        
        // Handle response format: bisa array langsung atau {data: [], status: "success"}
        const data = Array.isArray(response) ? response : (response.data || []);

        // Optimasi: gunakan DocumentFragment untuk batch DOM updates
        listPasien.innerHTML = '';
        if (data.length === 0) {
            listPasien.innerHTML = '<div class="autocomplete-item text-muted">Tidak ada hasil</div>';
        } else {
            const fragment = document.createDocumentFragment();
            data.forEach(p => {
                const div = document.createElement('div');
                div.classList.add('autocomplete-item');
                div.textContent = p.Nama_Pasien;
                div.onclick = () => fillPasien(p);
                fragment.appendChild(div);
            });
            listPasien.appendChild(fragment);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            // Request dibatalkan, ignore
            return;
        }
        console.error('Error searching pasien:', error);
        listPasien.innerHTML = '<div class="autocomplete-item text-danger">Error: Gagal memload data</div>';
    }
}

// Debounce autocomplete dengan delay 300ms
const debouncedSearchPasien = debounce(searchPasien, 300);

inputPasien.addEventListener('input', function () {
    debouncedSearchPasien(this.value.trim());
});

// Hide autocomplete saat klik di luar
document.addEventListener('click', function(e) {
    if (!inputPasien.contains(e.target) && !listPasien.contains(e.target)) {
        listPasien.classList.remove('show');
    }
});

let lastSelectedPasienName = null;
let ruanganDataList = []; // Store semua data ruangan untuk lookup
let pendingRuanganId = null; // Store ruangan ID yang perlu di-set setelah load selesai
let tarifRSDataList = []; // Store semua data tarif RS untuk lookup harga

// ============= RIWAYAT BILLING AKTIF (TINDAKAN & ICD) =============
function clearBillingHistory() {
    const infoEl = document.getElementById('billing_history_info');
    const ulTindakan = document.getElementById('history_tindakan_rs');
    const ulICD9 = document.getElementById('history_icd9');
    const ulICD10 = document.getElementById('history_icd10');

    if (infoEl) {
        infoEl.textContent = 'Belum ada data yang dimuat. Pilih pasien untuk melihat riwayat.';
        infoEl.classList.remove('text-danger');
        infoEl.classList.add('text-muted');
    }
    if (ulTindakan) ulTindakan.innerHTML = '';
    if (ulICD9) ulICD9.innerHTML = '';
    if (ulICD10) ulICD10.innerHTML = '';
}

async function loadBillingAktifHistory(namaPasien) {
    const infoEl = document.getElementById('billing_history_info');
    const ulTindakan = document.getElementById('history_tindakan_rs');
    const ulICD9 = document.getElementById('history_icd9');
    const ulICD10 = document.getElementById('history_icd10');

    if (!namaPasien || !infoEl || !ulTindakan || !ulICD9 || !ulICD10) {
        return;
    }

    ulTindakan.innerHTML = '';
    ulICD9.innerHTML = '';
    ulICD10.innerHTML = '';
    infoEl.textContent = 'Memuat riwayat billing aktif...';
    infoEl.classList.remove('text-muted', 'text-danger');

    try {
        const res = await fetchWithTimeout(
            `${API_BASE}/billing/aktif?nama_pasien=${encodeURIComponent(namaPasien)}`
        );

        if (res.status === 404) {
            infoEl.textContent = 'Tidak ada billing aktif untuk pasien ini.';
            infoEl.classList.remove('text-danger');
            infoEl.classList.add('text-muted');
            return;
        }

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const body = await res.json().catch(() => ({}));
        const data = body.data || {};

        const tindakan = Array.isArray(data.tindakan_rs) ? data.tindakan_rs : [];
        const icd9 = Array.isArray(data.icd9) ? data.icd9 : [];
        const icd10 = Array.isArray(data.icd10) ? data.icd10 : [];

        if (tindakan.length === 0 && icd9.length === 0 && icd10.length === 0) {
            infoEl.textContent = 'Belum ada tindakan atau ICD yang tercatat pada billing aktif.';
            infoEl.classList.remove('text-danger');
            infoEl.classList.add('text-muted');
            return;
        }

        infoEl.textContent = 'Menampilkan riwayat dari billing aktif pasien ini.';
        infoEl.classList.remove('text-danger', 'text-muted');

        tindakan.forEach(t => {
            const li = document.createElement('li');
            li.className = 'list-group-item py-1';
            li.textContent = t;
            ulTindakan.appendChild(li);
        });

        icd9.forEach(i => {
            const li = document.createElement('li');
            li.className = 'list-group-item py-1';
            li.textContent = i;
            ulICD9.appendChild(li);
        });

        icd10.forEach(i => {
            const li = document.createElement('li');
            li.className = 'list-group-item py-1';
            li.textContent = i;
            ulICD10.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading billing history:', error);
        infoEl.textContent = 'Error memuat riwayat billing. Coba lagi.';
        infoEl.classList.remove('text-muted');
        infoEl.classList.add('text-danger');
    }
}

// Helper function untuk set ruangan dari ID atau Nama
function setRuanganFromId(ruanganIdOrNama) {
    console.log('setRuanganFromId called with:', ruanganIdOrNama);
    console.log('ruanganDataList length:', ruanganDataList.length);
    
    if (!ruanganIdOrNama) {
        console.warn('ruanganIdOrNama is empty');
        return;
    }
    
    if (ruanganDataList.length === 0) {
        console.warn('ruanganDataList masih kosong');
        return;
    }
    
    const searchValue = ruanganIdOrNama.toString().trim();
    console.log('Mencari ruangan dengan value:', searchValue);
    
    // PRIORITAS 1: Cari berdasarkan NAMA RUANGAN dulu (karena p.Ruangan sekarang adalah nama, bukan ID)
    // Coba exact match dulu (case-insensitive)
    let ruanganFound = ruanganDataList.find(r => {
        const namaRuangan = r.Nama_Ruangan || r.nama_ruangan || r.NamaRuangan || r.Nama || r.nama || '';
        const namaRuanganTrimmed = namaRuangan.toString().trim();
        return namaRuanganTrimmed.toLowerCase() === searchValue.toLowerCase();
    });
    
    if (ruanganFound) {
        console.log('✓ Found ruangan by NAMA (exact match):', ruanganFound);
    } else {
        // Coba partial match (nama ruangan mengandung searchValue atau sebaliknya)
        console.log('Tidak ditemukan exact match, mencoba partial match...');
        ruanganFound = ruanganDataList.find(r => {
            const namaRuangan = r.Nama_Ruangan || r.nama_ruangan || r.NamaRuangan || r.Nama || r.nama || '';
            const namaRuanganTrimmed = namaRuangan.toString().trim();
            const searchLower = searchValue.toLowerCase();
            const namaLower = namaRuanganTrimmed.toLowerCase();
            
            // Cek apakah searchValue ada di nama ruangan atau sebaliknya
            return namaLower.includes(searchLower) || searchLower.includes(namaLower);
        });
        
        if (ruanganFound) {
            console.log('✓ Found ruangan by NAMA (partial match):', ruanganFound);
        } else {
            // PRIORITAS 2: Jika tidak ditemukan berdasarkan nama, cari berdasarkan ID
            console.log('Tidak ditemukan berdasarkan nama, mencoba berdasarkan ID...');
            ruanganFound = ruanganDataList.find(r => {
                // Coba ID_Ruangan (case-insensitive comparison)
                if (r.ID_Ruangan && r.ID_Ruangan.toString().trim() === searchValue) {
                    return true;
                }
                // Coba ID (case-insensitive)
                if (r.ID && r.ID.toString().trim() === searchValue) {
                    return true;
                }
                // Coba id (lowercase)
                if (r.id && r.id.toString().trim() === searchValue) {
                    return true;
                }
                // Coba Ruangan_ID atau field lain yang mungkin
                const keys = Object.keys(r);
                const idKey = keys.find(k => {
                    const kLower = k.toLowerCase();
                    return (kLower.includes('id') && kLower.includes('ruangan')) ||
                           (kLower === 'id_ruangan');
                });
                if (idKey && r[idKey] && r[idKey].toString().trim() === searchValue) {
                    return true;
                }
                return false;
            });
            
            if (ruanganFound) {
                console.log('✓ Found ruangan by ID:', ruanganFound);
            }
        }
    }
    
    if (ruanganFound) {
        console.log('Found ruangan:', ruanganFound); // Debug
        
        // Ambil nama ruangan - coba berbagai kemungkinan field name
        const namaRuangan = ruanganFound.Nama_Ruangan || 
                           ruanganFound.nama_ruangan || 
                           ruanganFound.NamaRuangan ||
                           ruanganFound.Nama ||
                           ruanganFound.nama ||
                           null;
        
        if (namaRuangan) {
            console.log('Setting ruangan nama:', namaRuangan);
            
            // Set langsung ke input field sebagai fallback utama
            const inputRuangan = document.getElementById('ruangan');
            if (inputRuangan) {
                inputRuangan.value = namaRuangan;
                console.log('Input ruangan langsung di-set ke:', namaRuangan);
            }
            
            // Set ke hidden select juga
            const selectEl = document.getElementById('select_ruangan');
            if (selectEl) {
                // Cari option yang match dengan namaRuangan
                const options = selectEl.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].text === namaRuangan || options[i].value === namaRuangan) {
                        selectEl.value = options[i].value;
                        console.log('Hidden select di-set ke:', options[i].value);
                        break;
                    }
                }
            }
            
            // Pastikan dropdown instance sudah ready dan set value
            if (dropdownInstances['ruangan']) {
                // Gunakan setTimeout untuk memastikan DOM sudah siap
                setTimeout(() => {
                    try {
                        dropdownInstances['ruangan'].setValue(namaRuangan);
                        console.log('setValue called for ruangan:', namaRuangan);
                        
                        // Double check - jika setelah setValue input masih kosong, set lagi
                        setTimeout(() => {
                            const checkInput = document.getElementById('ruangan');
                            if (checkInput && !checkInput.value) {
                                console.warn('Input masih kosong setelah setValue, setting lagi...');
                                checkInput.value = namaRuangan;
                            }
                        }, 200);
                    } catch (error) {
                        console.error('Error calling setValue:', error);
                        // Fallback: set langsung ke input
                        if (inputRuangan) {
                            inputRuangan.value = namaRuangan;
                        }
                    }
                }, 100);
            } else {
                console.warn('dropdownInstances[ruangan] belum ada, menggunakan fallback');
            }
        } else {
            console.warn('Nama ruangan tidak ditemukan di data:', ruanganFound);
            console.log('Available fields:', Object.keys(ruanganFound));
        }
    } else {
        console.warn('Ruangan dengan ID/Nama', searchValue, 'tidak ditemukan di ruanganDataList');
        console.log('Mencari ruangan dengan nama yang mengandung:', searchValue);
        
        // Coba partial match sebagai fallback
        const partialMatch = ruanganDataList.find(r => {
            const namaRuangan = r.Nama_Ruangan || r.nama_ruangan || r.NamaRuangan || r.Nama || r.nama || '';
            return namaRuangan.toString().toLowerCase().includes(searchValue.toLowerCase()) ||
                   searchValue.toLowerCase().includes(namaRuangan.toString().toLowerCase());
        });
        
        if (partialMatch) {
            console.log('Found ruangan dengan partial match:', partialMatch);
            const namaRuangan = partialMatch.Nama_Ruangan || partialMatch.nama_ruangan || partialMatch.NamaRuangan || partialMatch.Nama || partialMatch.nama || '';
            if (namaRuangan) {
                const inputRuangan = document.getElementById('ruangan');
                if (inputRuangan) {
                    inputRuangan.value = namaRuangan;
                }
                if (dropdownInstances['ruangan']) {
                    setTimeout(() => {
                        dropdownInstances['ruangan'].setValue(namaRuangan);
                    }, 100);
                }
                return;
            }
        }
        
        console.log('Available ruangan data (first 5):', ruanganDataList.slice(0, 5).map(r => ({
            ID_Ruangan: r.ID_Ruangan,
            Nama_Ruangan: r.Nama_Ruangan
        })));
    }
}

function fillPasien(p) {
    console.log('=== FILLING PASIEN ===');
    console.log('Full pasien data:', JSON.stringify(p, null, 2)); // Debug - log full structure
    console.log('Pasien Ruangan field:', p.Ruangan, 'Type:', typeof p.Ruangan); // Debug
    console.log('RuanganDataList length:', ruanganDataList.length); // Debug
    if (ruanganDataList.length > 0) {
        console.log('Sample ruangan data (first item):', ruanganDataList[0]); // Debug
        console.log('Sample ruangan ID_Ruangan:', ruanganDataList[0].ID_Ruangan); // Debug
        console.log('Sample ruangan Nama_Ruangan:', ruanganDataList[0].Nama_Ruangan); // Debug
    }
    
    inputPasien.value = p.Nama_Pasien;
    lastSelectedPasienName = p.Nama_Pasien; // Track nama yang dipilih
    listPasien.innerHTML = '';
    listPasien.classList.remove('show');

    document.getElementById('id_pasien').value = p.ID_Pasien;
    document.getElementById('jenis_kelamin').value = p.Jenis_Kelamin || '';
    document.getElementById('usia').value = p.Usia || '';
    
    // Set Kelas
    if (p.Kelas) {
        console.log('Setting kelas:', p.Kelas); // Debug
        document.getElementById('kelas').value = p.Kelas;
    }
    
    // Set Ruangan - setRuanganFromId sekarang bisa handle baik ID maupun Nama
    if (p.Ruangan) {
        console.log('=== SETTING RUANGAN ===');
        console.log('Pasien punya Ruangan:', p.Ruangan, 'Type:', typeof p.Ruangan); // Debug
        
        // Jika ruanganDataList masih kosong, simpan sebagai pending dan tunggu load selesai
        if (ruanganDataList.length === 0) {
            console.log('RuanganDataList masih kosong, menyimpan sebagai pending...');
            pendingRuanganId = p.Ruangan;
            
            // Juga coba retry beberapa kali sebagai fallback
            let retryCount = 0;
            const maxRetries = 10;
            
            const retrySetRuangan = () => {
                retryCount++;
                if (ruanganDataList.length > 0) {
                    console.log('RuanganDataList sudah terisi, setting ruangan...');
                    setRuanganFromId(p.Ruangan);
                    pendingRuanganId = null; // Clear pending
                } else if (retryCount < maxRetries) {
                    console.log(`Retry ${retryCount}/${maxRetries} untuk set ruangan...`);
                    setTimeout(retrySetRuangan, 200);
                } else {
                    console.warn('RuanganDataList masih kosong setelah beberapa retry');
                }
            };
            
            setTimeout(retrySetRuangan, 200);
        } else {
            // Langsung set karena ruanganDataList sudah terisi
            // setRuanganFromId akan otomatis cari berdasarkan nama dulu, lalu ID
            setRuanganFromId(p.Ruangan);
        }
    }

    // Setelah pasien dipilih, muat riwayat billing aktif (tindakan & ICD sebelumnya)
    loadBillingAktifHistory(p.Nama_Pasien);
}

// Deteksi jika user mengubah nama pasien - clear ID jika berbeda
inputPasien.addEventListener('change', function() {
    // Jika nama sekarang berbeda dengan yang dipilih, clear ID dan field terkait
    if (lastSelectedPasienName && this.value.trim() !== lastSelectedPasienName) {
        document.getElementById('id_pasien').value = '';
        // Clear juga field ruangan dan kelas
        if (dropdownInstances['ruangan']) {
            dropdownInstances['ruangan'].setValue('');
        }
        document.getElementById('kelas').value = '';
        clearBillingHistory();
    }
});

// Load saat DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initAllDropdowns();
        loadAllSelects();
        initBillingFormSubmission();
    });
} else {
    initAllDropdowns();
    loadAllSelects();
    initBillingFormSubmission();
}

// ============= FORM SUBMISSION =============
function initBillingFormSubmission() {
    const form = document.getElementById('bpjsForm');
    if (!form) return;

    const alertBox = document.getElementById('formAlert');
    const submitBtn = form.querySelector('button[type="submit"]');

    function showFormAlert(type, message) {
        if (!alertBox) return;
        alertBox.className = `alert alert-${type}`;
        alertBox.innerHTML = message;
        alertBox.classList.remove('d-none');
    }

    function hideFormAlert() {
        if (!alertBox) return;
        alertBox.classList.add('d-none');
        alertBox.textContent = '';
    }

    function getDropdownValue(id) {
        if (dropdownInstances[id]) {
            const value = dropdownInstances[id].getValue();
            if (Array.isArray(value)) {
                return value
                    .map(v => (v || '').toString().trim())
                    .filter(Boolean);
            }
            return (value || '').toString().trim();
        }
        const input = document.getElementById(id);
        return input ? input.value.trim() : '';
    }

    function parseInteger(value) {
        if (typeof value !== 'string') {
            return Number.isFinite(value) ? value : 0;
        }
        const numeric = value.replace(/[^\d]/g, '');
        return numeric ? parseInt(numeric, 10) : 0;
    }

    // Draft storage key
    const DRAFT_KEY = 'billingDraft_v1';

    function getFormDataForDraft() {
        return {
            nama_dokter: getDropdownValue('nama_dokter'),
            nama_pasien: (document.getElementById('nama_pasien')?.value || '').trim(),
            jenis_kelamin: (document.getElementById('jenis_kelamin')?.value || '').trim(),
            usia: parseInteger(document.getElementById('usia')?.value || '0'),
            ruangan: getDropdownValue('ruangan'),
            kelas: (document.getElementById('kelas')?.value || '').trim(),
            tindakan_rs: getDropdownValue('tarif_rs'),
            // tanggal_keluar sekarang diisi Admin Billing, tidak perlu disimpan di draft FE dokter
            tanggal_keluar: '',
            icd9: getDropdownValue('icd9'),
            icd10: getDropdownValue('icd10'),
            cara_bayar: (document.getElementById('cara_bayar')?.value || '').trim(),
            total_tarif_rs: parseInteger(document.getElementById('total_tarif_rs')?.value || '0'),
        };
    }

    function saveDraftToStorage() {
        try {
            const data = getFormDataForDraft();
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            updateDraftStatus('Draft disimpan');
            return true;
        } catch (e) {
            console.error('Gagal menyimpan draft:', e);
            updateDraftStatus('Gagal menyimpan draft');
            return false;
        }
    }

    function clearDraftStorage() {
        localStorage.removeItem(DRAFT_KEY);
        updateDraftStatus('Draft dihapus');
    }

    function loadDraftFromStorage() {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Draft parsing error:', e);
            return null;
        }
    }

    function updateDraftStatus(msg) {
        const el = document.getElementById('draftStatus');
        if (el) el.textContent = msg;
    }

    function applyDraftToForm(draft) {
        if (!draft) return;

        // Simple fields
        document.getElementById('nama_pasien').value = draft.nama_pasien || '';
        document.getElementById('jenis_kelamin').value = draft.jenis_kelamin || '';
        document.getElementById('usia').value = draft.usia || '';
        document.getElementById('kelas').value = draft.kelas || '';
        document.getElementById('cara_bayar').value = draft.cara_bayar || '';
        document.getElementById('total_tarif_rs').value = draft.total_tarif_rs ? draft.total_tarif_rs.toLocaleString('id-ID') : document.getElementById('total_tarif_rs').value;

        // Dropdowns / multi-selects - may require retries until dropdownInstances loaded
        const attempts = { count: 0 };
        const tryApply = () => {
            attempts.count++;
            // nama_dokter
            if (dropdownInstances['nama_dokter'] && draft.nama_dokter) {
                try { dropdownInstances['nama_dokter'].setValue(draft.nama_dokter); } catch (e) { console.warn(e); }
            }
            // ruangan
            if (dropdownInstances['ruangan'] && draft.ruangan) {
                try { dropdownInstances['ruangan'].setValue(draft.ruangan); } catch (e) { console.warn(e); }
            }
            // tarif_rs (multi)
            if (dropdownInstances['tarif_rs'] && Array.isArray(draft.tindakan_rs)) {
                try { dropdownInstances['tarif_rs'].setValue(draft.tindakan_rs); } catch (e) { console.warn(e); }
            }
            // icd9, icd10
            if (dropdownInstances['icd9'] && Array.isArray(draft.icd9)) {
                try { dropdownInstances['icd9'].setValue(draft.icd9); } catch (e) { console.warn(e); }
            }
            if (dropdownInstances['icd10'] && Array.isArray(draft.icd10)) {
                try { dropdownInstances['icd10'].setValue(draft.icd10); } catch (e) { console.warn(e); }
            }

            // If some dropdowns are not ready, retry a few times
            const allReady = (!draft.nama_dokter || dropdownInstances['nama_dokter']) && (!draft.ruangan || dropdownInstances['ruangan']) && (!draft.tindakan_rs || dropdownInstances['tarif_rs']);
            if (!allReady && attempts.count < 10) {
                setTimeout(tryApply, 200);
            } else {
                updateDraftStatus('Draft dimuat');
            }
        };
        tryApply();
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        hideFormAlert();

        const payload = {
            nama_dokter: getDropdownValue('nama_dokter'),
            nama_pasien: (document.getElementById('nama_pasien')?.value || '').trim(),
            jenis_kelamin: (document.getElementById('jenis_kelamin')?.value || '').trim(),
            usia: parseInteger(document.getElementById('usia')?.value || '0'),
            ruangan: getDropdownValue('ruangan'),
            kelas: (document.getElementById('kelas')?.value || '').trim(),
            tindakan_rs: getDropdownValue('tarif_rs'),
            // tanggal_keluar tidak dikirim dari FE dokter
            tanggal_keluar: '',
            icd9: getDropdownValue('icd9'),
            icd10: getDropdownValue('icd10'),
            cara_bayar: (document.getElementById('cara_bayar')?.value || '').trim(),
            total_tarif_rs: parseInteger(document.getElementById('total_tarif_rs')?.value || '0'),
        };

        const errors = [];
        if (!payload.nama_dokter) errors.push('Nama Dokter wajib dipilih.');
        if (!payload.nama_pasien) errors.push('Nama Pasien wajib diisi.');
        if (!payload.jenis_kelamin) errors.push('Jenis Kelamin wajib diisi.');
        if (!payload.usia) errors.push('Usia wajib diisi.');
        if (!payload.ruangan) errors.push('Ruangan wajib dipilih.');
        if (!payload.kelas) errors.push('Kelas wajib dipilih.');
        if (!Array.isArray(payload.tindakan_rs) || payload.tindakan_rs.length === 0) errors.push('Pilih minimal satu Tindakan RS.');
        if (!Array.isArray(payload.icd9) || payload.icd9.length === 0) errors.push('Pilih minimal satu ICD 9.');
        if (!Array.isArray(payload.icd10) || payload.icd10.length === 0) errors.push('Pilih minimal satu ICD 10.');
        if (!payload.cara_bayar) errors.push('Cara Bayar wajib dipilih.');

        if (errors.length > 0) {
            showFormAlert('danger', `<ul class="mb-0"><li>${errors.join('</li><li>')}</li></ul>`);
            return;
        }

        let originalBtnHtml = '';
        if (submitBtn) {
            originalBtnHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE}/billing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.status !== 'success') {
                const message = result?.error || result?.message || 'Gagal menyimpan data billing.';
                throw new Error(message);
            }

            showFormAlert('success', result.message || 'Billing berhasil dibuat.');
        } catch (error) {
            console.error('Error submitting billing form:', error);
            showFormAlert('danger', error.message || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml || '💾 Simpan Data';
            }
        }
    });

    // Setup draft buttons
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const clearDraftBtn = document.getElementById('clearDraftBtn');

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            if (saveDraftToStorage()) {
                showFormAlert('success', 'Draft berhasil disimpan.');
            } else {
                showFormAlert('danger', 'Gagal menyimpan draft. Cek console.');
            }
        });
    }

    if (clearDraftBtn) {
        clearDraftBtn.addEventListener('click', function() {
            clearDraftStorage();
            showFormAlert('info', 'Draft dihapus.');
            // optionally clear form fields as well
        });
    }

    // Load draft on init
    const existingDraft = loadDraftFromStorage();
    if (existingDraft) {
        applyDraftToForm(existingDraft);
    } else {
        updateDraftStatus('Tidak ada draft');
    }
}

