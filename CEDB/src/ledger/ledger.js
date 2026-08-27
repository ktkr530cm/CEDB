// --- 機器画像プレビュー ---
function updateDeviceImagePreview() {
    const modelNameEl = document.getElementById('model-name');
    const img = document.getElementById('device-image');
    const placeholder = document.getElementById('device-image-placeholder');
    if (!modelNameEl || !img || !placeholder) return;

    const modelName = modelNameEl.value.trim();

    if (!modelName) {
        img.classList.remove('is-active');
        img.removeAttribute('src');
        placeholder.classList.add('is-active');
        placeholder.textContent = '機種名を入力すると画像を表示します';
        return;
    }

    const encodedName = encodeURIComponent(modelName);
    const jpgUrl = DEVICE_IMAGE_BASE + encodedName + '.jpg';
    const pngUrl = DEVICE_IMAGE_BASE + encodedName + '.png';

    placeholder.classList.remove('is-active');
    img.classList.remove('is-active');

    img.onload = function () {
        img.classList.add('is-active');
        placeholder.classList.remove('is-active');
    };
    img.onerror = function () {
        if (img.src === jpgUrl) {
            img.src = pngUrl;
        } else {
            img.classList.remove('is-active');
            placeholder.classList.add('is-active');
            placeholder.textContent = '画像が見つかりません（' + modelName + '）';
        }
    };
    img.src = jpgUrl;
}

// --- 機器台帳データ用ストレージキー ---
const LEDGER_STORAGE_KEY = 'ledger_data_list';
const LEDGER_COLUMN_ORDER_KEY = 'ledger_column_order';

// --- 一覧列の定義 ---
// --- 機器台帳の全項目定義（項目の追加・削除・並び替えはここだけを編集） ---
const LEDGER_COLUMNS = [
    { key: 'ceNumber',        label: 'CE番号',    formId: 'ce-number' },
    { key: 'operatingStatus', label: '稼働状況',  formId: 'operating-status' },
    { key: 'deviceCategory',  label: '機器分類',  formId: 'device-category' },
    { key: 'modelName',       label: '機種名',    formId: 'model-name' },
    { key: 'manufacturer',    label: 'メーカー',  formId: 'manufacturer' },
    { key: 'dept',            label: '部署',      formId: 'dept' },
    { key: 'prevDept',        label: '前部署',    formId: 'prev-dept' },
    { key: 'location',        label: '配置場所',  formId: 'location' },
    { key: 'serialNumber',    label: 'シリアル',  formId: 'serial-number' },
    { key: 'assetNumber',     label: '資産番号',  formId: 'asset-number' },
    { key: 'chNumber',        label: 'CH番号',    formId: 'ch-number' },
    { key: 'barcode',         label: 'バーコード',formId: 'barcode' },
    { key: 'gs1',             label: 'GS1-128',   formId: 'gs1-128' },
    { key: 'maintStatus',     label: '保守状況',  formId: 'maint-status' },
    { key: 'repairContact',   label: '修理連絡先',formId: 'repair-contact' },
    { key: 'inspectionMonth', label: '点検月',    formId: 'inspection-month' },
    { key: 'inspectionWeek',  label: '点検週',    formId: 'inspection-week' },
    { key: 'regDate',         label: '登録日',    formId: 'reg-date' },
    { key: 'deliveryStaff',   label: '納品担当',  formId: 'delivery-staff' },
    { key: 'yearsInUse',      label: '耐用年数',  formId: 'years-in-use' },
    { key: 'disposalDate',    label: '廃棄日',    formId: 'disposal-date' },
    { key: 'disposalStaff',   label: '廃棄担当',  formId: 'disposal-staff' },
    { key: 'disposalReason',  label: '廃棄理由',  formId: 'disposal-reason' },
    { key: 'remarks',         label: '備考',      formId: 'remarks' }
];

const LEDGER_COLUMN_KEYS = LEDGER_COLUMNS.map(function(c) { return c.key; });

// --- 列の並び順を取得 ---
function getLedgerColumnOrder() {
    try {
        const saved = JSON.parse(localStorage.getItem(LEDGER_COLUMN_ORDER_KEY) || 'null');
        if (Array.isArray(saved)) {
            const valid = saved.filter(function(key) { return LEDGER_COLUMN_KEYS.includes(key); });
            const missing = LEDGER_COLUMN_KEYS.filter(function(key) { return !valid.includes(key); });
            return valid.concat(missing);
        }
    } catch (e) {}
    return LEDGER_COLUMN_KEYS.slice();
}

let ledgerDragColumnKey = null;

// --- ヘッダー行描画（ドラッグ&ドロップ対応） ---
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

    // 操作列
    const opTh = document.createElement('th');
    opTh.textContent = '操作';
    opTh.className = 'col-action';
    headRow.appendChild(opTh);
}

// --- LocalStorage操作 ---
function getStoredLedgers() {
    const json = localStorage.getItem(LEDGER_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
}

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

function cancelLedgerForm() {
    const formTab = document.getElementById('tab-btn-ledger-form-page');
    if (formTab) formTab.remove();
    openTab('ledger-page', '機器台帳');
}

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
    let data = getStoredLedgers();
    const existingIndex = data.findIndex(function(d) { return String(d.id) === String(id); });

    // 新規作成時は空オブジェクト、編集時は既存レコードをコピーして基礎を作成
    const record = existingIndex >= 0 ? Object.assign({}, data[existingIndex]) : {};
    
    // IDを確定
    record.id = id;

    // フォーム上の最新値で更新
    LEDGER_COLUMNS.forEach(function(col) {
        if (col.formId) {
            record[col.key] = getFieldValue(col.formId);
        }
    });

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
function renderLedgerTable(filterText) {
    if (filterText === undefined) filterText = '';
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let data = getStoredLedgers();
    const order = getLedgerColumnOrder();
    const colCount = order.length + 1;

    if (filterText) {
        const keyword = filterText.trim().toLowerCase();
        data = data.filter(function(item) {
            return (item.ceNumber || '').toLowerCase().indexOf(keyword) !== -1
                || (item.modelName || '').toLowerCase().indexOf(keyword) !== -1
                || (item.manufacturer || '').toLowerCase().indexOf(keyword) !== -1
                || (item.location || '').toLowerCase().indexOf(keyword) !== -1;
        });
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + colCount + '" class="no-data" style="text-align:center; padding: 20px;">該当する機器が見つかりません</td></tr>';
        return;
    }

    data.forEach(function(item) {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.className = 'clickable-row';
        tr.style.cursor = 'pointer';
        tr.title = 'ダブルクリックで編集';

        tr.ondblclick = function() {
            editLedger(item.id);
        };

        // order（並び順）通りにデータセルを動的生成してズレを防止
        const cellsHtml = order.map(function(key) {
            const val = (item[key] !== undefined && item[key] !== null) ? item[key] : '';
            return '<td>' + val + '</td>';
        }).join('');
        
        tr.innerHTML = cellsHtml + '<td><button class="btn-delete" onclick="event.stopPropagation(); deleteLedger(\'' + item.id + '\')">削除</button></td>';
        tbody.appendChild(tr);
    });
}

// --- 編集フォームを開いてデータセット ---
// 編集フォームを開いてデータセット
function editLedger(id) {
    if (typeof openTab === 'function') {
        openTab('ledger-form-page', '✏️ 機器台帳編集');
    }

    const data = getStoredLedgers();
    const item = data.find(function(d) { return String(d.id) === String(id); });
    if (!item) {
        alert('指定されたデータが見つかりませんでした。');
        return;
    }

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = '機器台帳 編集';

    // IDをセット
    setFieldValue('ledger-id', item.id);

    // ★ LEDGER_COLUMNS に基づいて全フィールドへ自動セット
    LEDGER_COLUMNS.forEach(function(col) {
        if (col.formId) {
            setFieldValue(col.formId, item[col.key]);
        }
    });
}

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

function searchLedger() {
    const input = document.getElementById('ledger-search-input');
    const keyword = input ? input.value : '';
    renderLedgerTable(keyword);
}


// --- 画面読み込み時の処理（エラーによる白紙化を防ぐ） ---
document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById('ledger-container');
    if (container) {
        fetch('./ledger.html')
            .then(function(response) {
                if (!response.ok) throw new Error();
                return response.text();
            })
            .then(function(data) {
                container.innerHTML = data;
                initLedger();
            })
            .catch(function() {
                initLedger(); // エラー時も止めずにテーブルを描画
            });
    } else {
        initLedger();
    }
});

// 描画を実行する初期化関数
function initLedger() {
    if (typeof renderLedgerTableHeader === 'function') {
        renderLedgerTableHeader();
    }
    if (typeof renderLedgerTable === 'function') {
        renderLedgerTable();
    }
}

// ledger.jsが読み込まれた際にも自動実行
initLedger();

// --- 一覧テーブルの描画関数 ---
// 一覧テーブルの描画関数
function renderLedgerTable() {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;

    // LocalStorage からデータ取得
    const rawData = localStorage.getItem('ledger_data_list');
    const list = rawData ? JSON.parse(rawData) : [];

    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">データがありません</td></tr>';
        return;
    }

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', item.id || '');
        
        // ダブルクリックで編集画面を開く
        tr.ondblclick = () => {
            if (typeof editLedger === 'function') {
                editLedger(item.id);
            }
        };
        tr.style.cursor = 'pointer';

        // ★HTMLの <th> の並び順と完全に一致するように <td> を配置
        tr.innerHTML = `
            <td>${item.ceNumber || ''}</td>
            <td>${item.operatingStatus || ''}</td>
            <td>${item.deviceCategory || ''}</td>
            <td>${item.modelName || ''}</td>
            <td>${item.manufacturer || ''}</td>
            <td>${item.dept || ''}</td>
            <td>${item.location || ''}</td>
            <td>${item.serialNumber || ''}</td>
            <td>${item.assetNumber || ''}</td>
            <td>${item.maintStatus || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}
// --- 編集画面を開いてデータをフォームにセットする関数 ---
async function editLedger(id) {
    // 1. まず入力フォーム画面（ledger-form-page）のタブを開く
    if (typeof openTab === 'function') {
        await openTab('ledger-form-page', '機器登録・編集');
    }

    // 2. LocalStorageから対象のデータを検索
    const rawData = localStorage.getItem('ledger_data_list');
    const list = rawData ? JSON.parse(rawData) : [];
    const target = list.find(item => String(item.id) === String(id));

    if (!target) {
        alert('指定されたデータが見つかりませんでした。');
        return;
    }

    // 3. タイトルを「編集」に変更
    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = '機器台帳 編集';

    // 4. 各フォーム項目に値をセット
    setInputValue('ledger-id', target.id);
    setInputValue('ce-number', target.ceNumber);
    setInputValue('operating-status', target.operatingStatus);
    setInputValue('device-category', target.deviceCategory);
    setInputValue('model-name', target.modelName);
    setInputValue('manufacturer', target.manufacturer);
    
    setInputValue('dept', target.dept);
    setInputValue('prev-dept', target.prevDept);
    setInputValue('location', target.location);
    
    setInputValue('serial-number', target.serialNumber);
    setInputValue('asset-number', target.assetNumber);
    setInputValue('ch-number', target.chNumber);
    setInputValue('barcode', target.barcode);
    
    setInputValue('maint-status', target.maintStatus);
    setInputValue('repair-contact', target.repairContact);
    setInputValue('inspection-month', target.inspectionMonth);
    setInputValue('inspection-week', target.inspectionWeek);
    setInputValue('reg-date', target.regDate);
    setInputValue('delivery-staff', target.deliveryStaff);
    setInputValue('years-in-use', target.yearsInUse);
    
    setInputValue('disposal-date', target.disposalDate);
    setInputValue('disposal-staff', target.disposalStaff);
    setInputValue('disposal-reason', target.disposalReason);
    
    setInputValue('remarks', target.remarks);

    // 画像プレビューの更新関数があれば実行
    if (typeof updateDeviceImagePreview === 'function') {
        updateDeviceImagePreview();
    }
}

// ヘルパー関数: IDが存在すれば値をセット
function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) {
        el.value = val !== undefined && val !== null ? val : '';
    }
}

// --- 新規登録ボタン用（フォームのクリア） ---
async function openNewLedgerForm() {
    if (typeof openTab === 'function') {
        await openTab('ledger-form-page', '機器登録・編集');
    }

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = '機器台帳 新規登録';

    const form = document.getElementById('ledger-form');
    if (form) form.reset();

    const hiddenId = document.getElementById('ledger-id');
    if (hiddenId) hiddenId.value = '';

    if (typeof updateDeviceImagePreview === 'function') {
        updateDeviceImagePreview();
    }
}

