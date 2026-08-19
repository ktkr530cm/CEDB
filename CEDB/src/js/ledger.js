// --- 機器台帳データ用ストレージキー ---
const LEDGER_STORAGE_KEY = 'ledger_data_list';

// --- LocalStorageからデータ取得 ---
function getStoredLedgers() {
    const json = localStorage.getItem(LEDGER_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
}

// --- LocalStorageへデータ保存 ---
function saveStoredLedgers(data) {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(data));
}

// --- 新規登録フォームを開く ---
function openNewLedgerForm() {
    document.getElementById('ledger-form').reset();
    document.getElementById('ledger-id').value = '';
    document.getElementById('form-title').textContent = '機器台帳 新規登録';
    openTab('ledger-form-page', '📦 機器台帳登録');
}

// --- 編集フォームを開く ---
function editLedger(id) {
    const data = getStoredLedgers();
    const item = data.find(d => d.id === id);
    if (!item) return;

    document.getElementById('ledger-id').value = item.id;
    document.getElementById('ce-number').value = item.ceNumber || '';
    document.getElementById('device-category').value = item.deviceCategory || '';
    document.getElementById('model-name').value = item.modelName || '';
    document.getElementById('manufacturer').value = item.manufacturer || '';
    document.getElementById('dept').value = item.dept || '';
    document.getElementById('location').value = item.location || '';
    document.getElementById('operating-status').value = item.operatingStatus || '稼働';
    document.getElementById('serial-number').value = item.serialNumber || '';
    document.getElementById('asset-number').value = item.assetNumber || '';
    document.getElementById('ch-number').value = item.chNumber || '';
    document.getElementById('barcode').value = item.barcode || '';
    document.getElementById('gs1-128').value = item.gs1 || '';
    document.getElementById('reg-date').value = item.regDate || '';
    document.getElementById('delivery-staff').value = item.deliveryStaff || '';
    document.getElementById('maint-status').value = item.maintStatus || '契約あり';
    document.getElementById('repair-contact').value = item.repairContact || '';
    document.getElementById('disposal-date').value = item.disposalDate || '';
    document.getElementById('disposal-staff').value = item.disposalStaff || '';
    document.getElementById('remarks').value = item.remarks || '';

    document.getElementById('form-title').textContent = '機器台帳 編集';
    openTab('ledger-form-page', '✏️ 機器台帳編集');
}

// --- キャンセルして一覧に戻る ---
function cancelLedgerForm() {
    const formTab = document.getElementById('tab-btn-ledger-form-page');
    if (formTab) formTab.remove();
    openTab('ledger-page', '機器台帳');
}

// --- 保存処理 ---
function saveLedger() {
    const ceNumber = document.getElementById('ce-number').value;
    const modelName = document.getElementById('model-name').value;

    if (!ceNumber || !modelName) {
        alert('CE番号と機種名は必須です');
        return;
    }

    const id = document.getElementById('ledger-id').value || Date.now().toString();

    const record = {
        id,
        ceNumber,
        deviceCategory: document.getElementById('device-category').value,
        modelName,
        manufacturer: document.getElementById('manufacturer').value,
        dept: document.getElementById('dept').value,
        location: document.getElementById('location').value,
        operatingStatus: document.getElementById('operating-status').value,
        serialNumber: document.getElementById('serial-number').value,
        assetNumber: document.getElementById('asset-number').value,
        chNumber: document.getElementById('ch-number').value,
        barcode: document.getElementById('barcode').value,
        gs1: document.getElementById('gs1-128').value,
        regDate: document.getElementById('reg-date').value,
        deliveryStaff: document.getElementById('delivery-staff').value,
        maintStatus: document.getElementById('maint-status').value,
        repairContact: document.getElementById('repair-contact').value,
        disposalDate: document.getElementById('disposal-date').value,
        disposalStaff: document.getElementById('disposal-staff').value,
        remarks: document.getElementById('remarks').value,
    };

    let data = getStoredLedgers();
    const existingIndex = data.findIndex(d => d.id === id);
    if (existingIndex >= 0) {
        data[existingIndex] = record;
    } else {
        data.unshift(record);
    }

    saveStoredLedgers(data);
    renderLedgerTable();
    cancelLedgerForm();
}

// --- 削除処理 ---
function deleteLedger(id) {
    if (confirm('この機器情報を削除してもよろしいですか？')) {
        let data = getStoredLedgers();
        data = data.filter(d => d.id !== id);
        saveStoredLedgers(data);
        renderLedgerTable();
    }
}

// --- 一覧テーブル描画 ---
function renderLedgerTable() {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const data = getStoredLedgers();
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.ceNumber}</td>
            <td>${item.deviceCategory}</td>
            <td>${item.modelName}</td>
            <td>${item.manufacturer}</td>
            <td>${item.location}</td>
            <td>${item.operatingStatus}</td>
            <td>${item.maintStatus}</td>
            <td>
                <button class="btn-sub" style="width:auto; padding:4px 10px;" onclick="editLedger('${item.id}')">編集</button>
                <button class="btn-delete" style="margin-left:4px;" onclick="deleteLedger('${item.id}')">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 初期化 ---
function initLedger() {
    renderLedgerTable();
}

// --- ページ読み込み時：ledger.html をfetchして流し込む ---
document.addEventListener("DOMContentLoaded", () => {
    fetch('./ledger.html')
        .then(response => {
            if (!response.ok) throw new Error('ledger.htmlの読み込みに失敗しました: ' + response.status);
            return response.text();
        })
        .then(data => {
            const container = document.getElementById('ledger-container');
            if (container) {
                container.innerHTML = data;
                initLedger();
            }
        })
        .catch(err => {
            console.error("機器台帳の読み込みエラー:", err);
        });
});

// --- 一覧テーブル描画（絞り込み対応版） ---
function renderLedgerTable(filterText = '') {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let data = getStoredLedgers();

    if (filterText) {
        const keyword = filterText.trim().toLowerCase();
        data = data.filter(item => {
            return (item.ceNumber || '').toLowerCase().includes(keyword)
                || (item.modelName || '').toLowerCase().includes(keyword)
                || (item.manufacturer || '').toLowerCase().includes(keyword)
                || (item.location || '').toLowerCase().includes(keyword);
        });
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#999; padding: 20px;">該当する機器が見つかりません</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.ceNumber}</td>
            <td>${item.deviceCategory}</td>
            <td>${item.modelName}</td>
            <td>${item.manufacturer}</td>
            <td>${item.location}</td>
            <td>${item.operatingStatus}</td>
            <td>${item.maintStatus}</td>
            <td>
                <button class="btn-sub" style="width:auto; padding:4px 10px;" onclick="editLedger('${item.id}')">編集</button>
                <button class="btn-delete" style="margin-left:4px;" onclick="deleteLedger('${item.id}')">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 検索実行 ---
function searchLedger() {
    const input = document.getElementById('ledger-search-input');
    const keyword = input ? input.value : '';
    renderLedgerTable(keyword);
}

// --- 検索クリア ---
function clearLedgerSearch() {
    const input = document.getElementById('ledger-search-input');
    if (input) input.value = '';
    renderLedgerTable();
}