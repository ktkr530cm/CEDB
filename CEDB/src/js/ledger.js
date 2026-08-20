// --- 機器画像(共有フォルダ参照) ---
// \\10.42.8.3\me\データベース\機器画像\機種名.jpg or .png
const DEVICE_IMAGE_BASE =
    'file://10.42.8.3/me/' + encodeURIComponent('データベース') + '/' + encodeURIComponent('機器画像') + '/';

function updateDeviceImagePreview() {
    const modelNameEl = document.getElementById('model-name');
    const img = document.getElementById('device-image');
    const placeholder = document.getElementById('device-image-placeholder');
    if (!modelNameEl || !img || !placeholder) return;

    const modelName = modelNameEl.value.trim();

    if (!modelName) {
        img.style.display = 'none';
        img.removeAttribute('src');
        placeholder.style.display = 'block';
        placeholder.textContent = '機種名を入力すると画像を表示します';
        return;
    }

    const encodedName = encodeURIComponent(modelName);
    const jpgUrl = DEVICE_IMAGE_BASE + encodedName + '.jpg';
    const pngUrl = DEVICE_IMAGE_BASE + encodedName + '.png';

    placeholder.style.display = 'none';
    img.style.display = 'none';

    img.onload = function () {
        img.style.display = 'block';
        placeholder.style.display = 'none';
    };
    img.onerror = function () {
        if (img.src === jpgUrl) {
            // jpgが無ければpngを試す
            img.src = pngUrl;
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'block';
            placeholder.textContent = '画像が見つかりません（' + modelName + '）';
        }
    };
    img.src = jpgUrl;
}

// --- 機器台帳データ用ストレージキー ---
const LEDGER_STORAGE_KEY = 'ledger_data_list';
const LEDGER_COLUMN_ORDER_KEY = 'ledger_column_order';

// --- 一覧列の定義(key, 表示名, 初期幅) ---
const LEDGER_COLUMNS = [
    { key: 'ceNumber', label: 'CE番号', width: '3%' },
    { key: 'deviceCategory', label: '機器分類', width: '10%' },
    { key: 'modelName', label: '機種名', width: '10%' },
    { key: 'manufacturer', label: 'メーカー', width: '8%' },
    { key: 'location', label: '配置場所', width: '10%' },
    { key: 'operatingStatus', label: '稼働状況', width: '5%' },
    { key: 'maintStatus', label: '保守状況', width: '15%' },
];
const LEDGER_COLUMN_KEYS = LEDGER_COLUMNS.map(c => c.key);

// --- 列の並び順を取得(保存されていなければ初期順) ---
function getLedgerColumnOrder() {
    try {
        const saved = JSON.parse(localStorage.getItem(LEDGER_COLUMN_ORDER_KEY) || 'null');
        if (Array.isArray(saved)) {
            // 定義済みの列だけを残し、新しく追加された列は末尾に補完する
            const valid = saved.filter(key => LEDGER_COLUMN_KEYS.includes(key));
            const missing = LEDGER_COLUMN_KEYS.filter(key => !valid.includes(key));
            return [...valid, ...missing];
        }
    } catch (e) {
        // 破損データは無視して初期順にフォールバック
    }
    return [...LEDGER_COLUMN_KEYS];
}

// --- 列の並び順を保存 ---
function saveLedgerColumnOrder(order) {
    localStorage.setItem(LEDGER_COLUMN_ORDER_KEY, JSON.stringify(order));
}

// --- 列順を初期状態に戻す ---
function resetLedgerColumnOrder() {
    localStorage.removeItem(LEDGER_COLUMN_ORDER_KEY);
    renderLedgerTableHeader();
    renderLedgerTable();
}

let ledgerDragColumnKey = null;

// --- ヘッダー行を並び順に沿って描画(ドラッグ&ドロップ対応) ---
function renderLedgerTableHeader() {
    const headRow = document.getElementById('ledger-table-head-row');
    if (!headRow) return;

    const order = getLedgerColumnOrder();
    const colsByKey = Object.fromEntries(LEDGER_COLUMNS.map(c => [c.key, c]));

    headRow.innerHTML = '';

    order.forEach(key => {
        const col = colsByKey[key];
        if (!col) return;
        const th = document.createElement('th');
        th.textContent = col.label;
        th.style.width = col.width;
        th.className = 'draggable-col';
        th.draggable = true;
        th.dataset.colKey = key;
        th.title = 'ドラッグで列の順番を変更できます';

        th.addEventListener('dragstart', (e) => {
            ledgerDragColumnKey = key;
            th.classList.add('col-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        th.addEventListener('dragend', () => {
            th.classList.remove('col-dragging');
            headRow.querySelectorAll('th').forEach(el => el.classList.remove('col-drag-over'));
        });
        th.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (key !== ledgerDragColumnKey) th.classList.add('col-drag-over');
        });
        th.addEventListener('dragleave', () => {
            th.classList.remove('col-drag-over');
        });
        th.addEventListener('drop', (e) => {
            e.preventDefault();
            th.classList.remove('col-drag-over');
            if (!ledgerDragColumnKey || ledgerDragColumnKey === key) return;

            const currentOrder = getLedgerColumnOrder();
            const fromIndex = currentOrder.indexOf(ledgerDragColumnKey);
            const toIndex = currentOrder.indexOf(key);
            if (fromIndex === -1 || toIndex === -1) return;

            currentOrder.splice(fromIndex, 1);
            currentOrder.splice(toIndex, 0, ledgerDragColumnKey);

            saveLedgerColumnOrder(currentOrder);
            ledgerDragColumnKey = null;
            renderLedgerTableHeader();
            renderLedgerTable();
        });

        headRow.appendChild(th);
    });

    // 操作列は並び替え対象外で常に右端固定
    const opTh = document.createElement('th');
    opTh.textContent = '操作';
    opTh.style.width = '3%';
    headRow.appendChild(opTh);
}

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
    updateDeviceImagePreview();
    openTab('ledger-form-page', '📦 機器台帳登録');
}

// --- フォーム要素に値をセット(存在しない場合は無視) ---
function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

// --- 編集フォームを開く ---
function editLedger(id) {
    const data = getStoredLedgers();
    const item = data.find(d => d.id === id);
    if (!item) return;

    setFieldValue('ledger-id', item.id);
    setFieldValue('ce-number', item.ceNumber || '');
    setFieldValue('device-category', item.deviceCategory || '');
    setFieldValue('model-name', item.modelName || '');
    setFieldValue('manufacturer', item.manufacturer || '');
    setFieldValue('dept', item.dept || '');
    setFieldValue('location', item.location || '');
    setFieldValue('operating-status', item.operatingStatus || '稼働');
    setFieldValue('serial-number', item.serialNumber || '');
    setFieldValue('asset-number', item.assetNumber || '');
    setFieldValue('ch-number', item.chNumber || '');
    setFieldValue('barcode', item.barcode || '');
    setFieldValue('gs1-128', item.gs1 || '');
    setFieldValue('reg-date', item.regDate || '');
    setFieldValue('delivery-staff', item.deliveryStaff || '');
    setFieldValue('maint-status', item.maintStatus || '契約あり');
    setFieldValue('repair-contact', item.repairContact || '');
    setFieldValue('disposal-date', item.disposalDate || '');
    setFieldValue('disposal-staff', item.disposalStaff || '');
    setFieldValue('remarks', item.remarks || '');

    document.getElementById('form-title').textContent = '機器台帳 編集';
    updateDeviceImagePreview();
    openTab('ledger-form-page', '✏️ 機器台帳編集');
}

// --- キャンセルして一覧に戻る ---
function cancelLedgerForm() {
    const formTab = document.getElementById('tab-btn-ledger-form-page');
    if (formTab) formTab.remove();
    openTab('ledger-page', '機器台帳');
}

// --- フォーム要素の値を取得(存在しない場合は空文字) ---
function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// --- 保存処理 ---
function saveLedger() {
    const ceNumber = getFieldValue('ce-number');
    const modelName = getFieldValue('model-name');

    if (!ceNumber || !modelName) {
        alert('CE番号と機種名は必須です');
        return;
    }

    const id = getFieldValue('ledger-id') || Date.now().toString();

    const record = {
        id,
        ceNumber,
        deviceCategory: getFieldValue('device-category'),
        modelName,
        manufacturer: getFieldValue('manufacturer'),
        dept: getFieldValue('dept'),
        location: getFieldValue('location'),
        operatingStatus: getFieldValue('operating-status'),
        serialNumber: getFieldValue('serial-number'),
        assetNumber: getFieldValue('asset-number'),
        chNumber: getFieldValue('ch-number'),
        barcode: getFieldValue('barcode'),
        gs1: getFieldValue('gs1-128'),
        regDate: getFieldValue('reg-date'),
        deliveryStaff: getFieldValue('delivery-staff'),
        maintStatus: getFieldValue('maint-status'),
        repairContact: getFieldValue('repair-contact'),
        disposalDate: getFieldValue('disposal-date'),
        disposalStaff: getFieldValue('disposal-staff'),
        remarks: getFieldValue('remarks'),
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

// --- 一覧テーブル描画（絞り込み対応・ダブルクリックで編集・列並び替え対応） ---
function renderLedgerTable(filterText = '') {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let data = getStoredLedgers();
    const order = getLedgerColumnOrder();
    const colCount = order.length + 1; // +操作列

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
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color:#999; padding: 20px;">該当する機器が見つかりません</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.style.cursor = 'pointer';
        tr.title = 'ダブルクリックで編集';

        const cellsHtml = order.map(key => `<td>${item[key] ?? ''}</td>`).join('');
        tr.innerHTML = `
            ${cellsHtml}
            <td>
                <button class="btn-delete" style="width:auto; padding:4px 10px;" onclick="event.stopPropagation(); deleteLedger('${item.id}')">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 一覧テーブルのダブルクリックで編集画面へ（イベント委譲：1回だけ登録） ---
function bindLedgerTableEvents() {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody || tbody.dataset.dblclickBound) return;

    tbody.addEventListener('dblclick', (e) => {
        const tr = e.target.closest('tr');
        if (tr && tr.dataset.id) {
            editLedger(tr.dataset.id);
        }
    });
    tbody.dataset.dblclickBound = 'true';
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

// --- 初期化 ---
function initLedger() {
    renderLedgerTableHeader();
    bindLedgerTableEvents();
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