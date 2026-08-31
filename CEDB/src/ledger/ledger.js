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
    { key: 'ceNumber',          label: 'CE番号',    formId: 'ce-number' },
    { key: 'operatingStatus',   label: '稼働状況',  formId: 'operating-status' },
    { key: 'deviceCategory',    label: '機器分類',  formId: 'device-category' },
    { key: 'modelName',         label: '機種名',    formId: 'model-name' },
    { key: 'manufacturer',      label: 'メーカー',  formId: 'manufacturer' },
    { key: 'dept',              label: '部署',      formId: 'dept' },
    { key: 'prevDept',          label: '前部署',    formId: 'prev-dept' },
    { key: 'location',          label: '配置場所',  formId: 'location' },
    { key: 'serialNumber',      label: 'シリアル',  formId: 'serial-number' },
    { key: 'assetNumber',       label: '資産番号',  formId: 'asset-number' },
    { key: 'chNumber',          label: 'CH番号',    formId: 'ch-number' },
    { key: 'barcode',           label: 'バーコード',formId: 'barcode' },
    { key: 'gs1',               label: 'GS1-128',   formId: 'gs1-128' },
    { key: 'maintStatus',       label: '保守状況',  formId: 'maint-status' },
    { key: 'repairContact',     label: '修理連絡先',formId: 'repair-contact' },
    { key: 'bimonthlyInspection', label: '点検頻度',formId: 'bimonthly-inspection' },
    { key: 'inspectionMonth',   label: '点検月',    formId: 'inspection-month' },
    { key: 'inspectionWeek',    label: '点検週',    formId: 'inspection-week' },
    { key: 'regDate',           label: '登録日',    formId: 'reg-date' },
    { key: 'deliveryStaff',     label: '納品担当',  formId: 'delivery-staff' },
    { key: 'yearsInUse',        label: '耐用年数',  formId: 'years-in-use' },
    { key: 'disposalDate',      label: '廃棄日',    formId: 'disposal-date' },
    { key: 'disposalStaff',     label: '廃棄担当',  formId: 'disposal-staff' },
    { key: 'disposalReason',    label: '廃棄理由',  formId: 'disposal-reason' },
    { key: 'remarks',           label: '備考',      formId: 'remarks' }
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

// --- 列の並び順を保存 ---
function saveLedgerColumnOrder(order) {
    localStorage.setItem(LEDGER_COLUMN_ORDER_KEY, JSON.stringify(order));
}

// --- 列の並び順をリセット（HTML側の「列順リセット」ボタンから呼ばれる） ---
function resetLedgerColumnOrder() {
    localStorage.removeItem(LEDGER_COLUMN_ORDER_KEY);
    renderLedgerTableHeader();
    renderLedgerTable();
}

let ledgerDragColumnKey = null;

// --- ヘッダー行描画（ドラッグ&ドロップ対応） ---
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

        // ★追加: 各列の最小幅をJSで直接固定（文字が潰れるのを防ぐ）
        // 項目によって長さを変えたい場合は switch 文等で分岐可能
        if (key === 'modelName' || key === 'remarks') {
            th.style.minWidth = '180px'; // 長めの項目
        } else if (key === 'ceNumber' || key === 'operatingStatus') {
            th.style.minWidth = '100px'; // 短めの項目
        } else {
            th.style.minWidth = '130px'; // 標準幅
        }

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
    opTh.style.minWidth = '80px'; // ★操作列の幅も固定
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

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
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

// --- 一覧テーブル描画（カンマ区切り＝OR、スペース区切り＝AND対応） ---
function renderLedgerTable(filterText) {
    if (filterText === undefined) filterText = '';
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let data = getStoredLedgers();
    const order = getLedgerColumnOrder();
    const colCount = order.length + 1;

    if (filterText) {
        // 全角スペースを半角スペースに置換し、前後の余白を除去して小文字化
        const normalizedInput = filterText.replace(/ /g, ' ').trim().toLowerCase();

        // 1. スペースで区切って「ANDグループ」を作成
        const andGroups = normalizedInput.split(/\s+/).filter(Boolean);

        if (andGroups.length > 0) {
            data = data.filter(function(item) {
                // すべてのANDグループを満たしているかチェック
                return andGroups.every(function(group) {
                    // 2. カンマ（半角 , または 全角 、）で区切って「ORキーワード」を作成
                    const orKeywords = group.split(/,|、/).filter(Boolean);

                    // 3. ORキーワードのうち「少なくとも1つ」が含まれているかチェック
                    return orKeywords.some(function(kw) {
                        // 全項目のうち「いずれかのフィールド」に該当キーワードが含まれているか
                        return LEDGER_COLUMNS.some(function(col) {
                            const val = item[col.key];
                            return val !== undefined && val !== null && String(val).toLowerCase().includes(kw);
                        });
                    });
                });
            });
        }
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

        const cellsHtml = order.map(function(key) {
            const val = (item[key] !== undefined && item[key] !== null) ? item[key] : '';
            return '<td>' + val + '</td>';
        }).join('');
        
        tr.innerHTML = cellsHtml + '<td><button class="btn-delete" onclick="event.stopPropagation(); deleteLedger(\'' + item.id + '\')">削除</button></td>';
        tbody.appendChild(tr);
    });
}

// --- 編集フォームを開いてデータセット ---
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

// --- 検索クリア処理 ---
function clearLedgerSearch() {
    const input = document.getElementById('ledger-search-input');
    if (input) {
        input.value = ''; // 入力欄をクリア
    }
    renderLedgerTable(''); // 検索キーワード空でテーブルを再描画
}

// 検索入力欄に対するリアルタイム検索イベントのバインド
function bindLedgerSearchEvent() {
    const input = document.getElementById('ledger-search-input');
    if (!input || input.dataset.searchBound) return;

    // 文字入力のたびに即時検索を実行
    input.addEventListener('input', function() {
        searchLedger();
    });
    input.dataset.searchBound = 'true';
}

// 描画を実行する初期化関数
function initLedger() {
    if (typeof renderLedgerTableHeader === 'function') {
        renderLedgerTableHeader();
    }
    if (typeof renderLedgerTable === 'function') {
        renderLedgerTable();
    }
    // 検索入力イベントを登録
    bindLedgerSearchEvent();
}

// ledger.jsが読み込まれた際にも自動実行
initLedger();
//削除（）；

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

// 各セレクトボックスの選択肢定義を一括管理
const SELECT_OPTIONS_CONFIG = {
    'device-category': [
        '生体情報モニタ', '送信機', '輸液ポンプ', 'シリンジポンプ', 
        '人工呼吸器', 'フットポンプ', '除細動器', 'その他'
    ],
    'operating-status': [
        '稼働中', '貸出中', '点検中', '修理中', '廃棄'
    ]
    // 部署やメーカー等もここに追加可能
};

// 設定に基づいてすべてのセレクトボックスを初期化
function initAllSelectOptions() {
    Object.keys(SELECT_OPTIONS_CONFIG).forEach(function(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const options = SELECT_OPTIONS_CONFIG[selectId];
        select.innerHTML = '<option value="">選択してください</option>';

        options.forEach(function(optText) {
            const opt = document.createElement('option');
            opt.value = optText;
            opt.textContent = optText;
            select.appendChild(opt);
        });
    });
}

// --- 1. 各項目ごとのタグ保存用データストア ---
const tagStore = {
    operatingStatus: [],   // 稼働状況
    deviceCategory: [],    // 機器分類
    modelName: [],         // 機種名
    manufacturer: [],      // メーカー
    deliveryStaff: [],     // 搬入担当者
    maintenanceStatus: [], // 保守状況
    repairVendor: []       // 修理連絡先
};

// ページ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', function() {
    initTagInputs();
});

// --- 2. タグ入力欄のイベント設定（datalist連動対応） ---
function initTagInputs() {
    const inputs = document.querySelectorAll('.tag-input');

    inputs.forEach(function(input) {
        const key = input.dataset.key;
        if (!key || !tagStore.hasOwnProperty(key)) return;

        // datalistの選択肢が選ばれた時（またはフォーカスが外れた時）
        input.addEventListener('change', function() {
            addTagFromInput(input, key);
        });

        // キー入力（Enter / カンマ / 読点）でタグ化
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',' || e.key === '、') {
                e.preventDefault();
                addTagFromInput(input, key);
            } 
            // 空の状態でBackspaceを押すと直前のタグを削除
            else if (e.key === 'Backspace' && input.value === '' && tagStore[key].length > 0) {
                removeTag(key, tagStore[key].length - 1);
            }
        });
    });
}

// --- 3. 入力値／選択値をタグとして追加する共通処理 ---
function addTagFromInput(input, key) {
    const value = input.value.trim().replace(/,/g, ''); // カンマを除去
    if (!value) return;

    // 重複登録の防止（必要に応じて解除可）
    if (!tagStore[key].includes(value)) {
        tagStore[key].push(value);
        renderTags(key);
    }

    // 入力欄をクリア
    input.value = '';

    // 機種名が変更された場合は画像プレビューを更新
    if (key === 'modelName' && typeof updateDeviceImagePreview === 'function') {
        updateDeviceImagePreview();
    }
}

// --- 4. タグの描画処理（DOM生成） ---
function renderTags(key) {
    const container = document.getElementById('tag-container-' + key);
    if (!container) return;

    // 既存のタグ要素（.tag）のみ削除（<input>や<datalist>は残す）
    const existingTags = container.querySelectorAll('.tag');
    existingTags.forEach(function(tag) { tag.remove(); });

    const input = container.querySelector('.tag-input');

    // データストア内の配列からタグを1つずつ生成
    tagStore[key].forEach(function(text, index) {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.innerHTML = `${text} <button type="button" class="tag-remove" onclick="removeTag('${key}', ${index})">&times;</button>`;
        
        // input要素の前に挿入
        container.insertBefore(tagSpan, input);
    });
}

// --- 5. タグの削除処理 ---
function removeTag(key, index) {
    if (tagStore[key] && tagStore[key][index] !== undefined) {
        tagStore[key].splice(index, 1);
        renderTags(key);

        // 機種名タグ削除時の画像プレビュー連動
        if (key === 'modelName' && typeof updateDeviceImagePreview === 'function') {
            updateDeviceImagePreview();
        }
    }
}

// --- 6. データを保存用のオブジェクト/文字列として一括取得 ---
function getTagValues() {
    const result = {};
    Object.keys(tagStore).forEach(function(key) {
        // カンマ区切りの文字列で返す場合（例: "稼働, 廃棄待ち"）
        result[key] = tagStore[key].join(', ');
        
        // 配列として取得したい場合は result[key] = [...tagStore[key]]; を使用
    });
    return result;
}

// --- 7. 既存データを編集画面でタグとして一括復元（セット） ---
function setTagValues(data) {
    if (!data) return;

    Object.keys(tagStore).forEach(function(key) {
        const val = data[key];
        if (Array.isArray(val)) {
            tagStore[key] = [...val];
        } else if (typeof val === 'string' && val.trim() !== '') {
            tagStore[key] = val.split(/,|、/).map(s => s.trim()).filter(Boolean);
        } else {
            tagStore[key] = [];
        }
        renderTags(key);
    });
}

// --- 8. 入力フォームのリセット処理 ---
function resetTagInputs() {
    Object.keys(tagStore).forEach(function(key) {
        tagStore[key] = [];
        renderTags(key);
    });
}