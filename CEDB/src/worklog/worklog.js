// --- スタッフリスト定義 ---
const staffList = ["笹岡", "野村", "下平", "高橋", "阿部", "北原", "唐澤", "片桐", "名取", "今井", "小牧", "有賀"];

// ローカルストレージ用のキー名
const STORAGE_KEY = 'worklog_data_list';

// --- タブ（画面）切替関数 ---
function switchWorklogTab(pageId, title) {
    if (typeof window.openTab === 'function') {
        window.openTab(pageId, title);
    } else {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
    }
}

// 日本時間の「今日の日付（yyyy-mm-dd）」を取得する共通関数
function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- LocalStorage からデータ取得 ---
function getStoredLogs() {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
}

// --- LocalStorage へデータ保存 ---
function saveStoredLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// --- スタッフチェックボックス描画関数 ---
function renderStaffCheckboxes(logId, confirmedStaffArray = []) {
    let html = '<div class="staff-grid">';
    staffList.forEach(staff => {
        const isChecked = confirmedStaffArray.includes(staff) ? 'checked' : '';
        html += `
            <label class="staff-checkbox-item">
                <input type="checkbox" data-log-id="${logId}" data-staff="${staff}" ${isChecked} onchange="toggleStaffConfirm('${logId}', '${staff}')">
                <span>${staff}</span>
            </label>
        `;
    });
    html += '</div>';
    return html;
}

// --- 新規登録ボタン用関数 ---
function openNewWorklogForm() {
    editWorklog('', '', '臨床', '通常', '', '');
}

// --- 行ダブルクリック時のID経由の編集処理 ---
function editWorklogById(id) {
    const logs = getStoredLogs();
    const log = logs.find(item => item.id === id);
    if (log) {
        editWorklog(log.id, log.date, log.category, log.priority, log.author, log.details);
    }
}

// 外部呼び出し用にグローバル展開
window.editWorklogById = editWorklogById;

// --- 行ダブルクリック（編集）および新規作成の共通処理 ---
function editWorklog(id, date, category, priority, author, details) {
    const formTitle = document.getElementById("form-title");
    const idInput = document.getElementById("log-id");
    const dateInput = document.getElementById("log-date");
    const categoryInput = document.getElementById("log-category");
    const priorityInput = document.getElementById("log-priority");
    const authorInput = document.getElementById("log-author");
    const detailsInput = document.getElementById("log-details");

    const today = getTodayString();

    if (idInput) idInput.value = id || "";

    if (dateInput) {
        if (date && typeof date === 'string' && date.trim() !== "") {
            dateInput.value = date.replace(/\//g, '-');
        } else {
            dateInput.value = today;
        }
    }

    if (categoryInput) categoryInput.value = category || "臨床";
    if (priorityInput) priorityInput.value = priority || "通常";
    if (authorInput) authorInput.value = author || "";
    if (detailsInput) detailsInput.value = details || "";

    if (formTitle) formTitle.textContent = id ? "連絡事項 編集" : "連絡事項 新規登録";

    const titleText = id ? "📝連絡事項 編集" : "📝連絡事項 新規登録";
          switchWorklogTab('worklog-form-page', titleText);
}

// --- フォームリセット処理 ---
function resetWorklogForm() {
    if (document.getElementById("log-id")) document.getElementById("log-id").value = "";
    if (document.getElementById("log-date")) document.getElementById("log-date").value = getTodayString();
    if (document.getElementById("log-category")) document.getElementById("log-category").value = "臨床";
    if (document.getElementById("log-priority")) document.getElementById("log-priority").value = "通常";
    if (document.getElementById("log-author")) document.getElementById("log-author").value = "";
    if (document.getElementById("log-details")) document.getElementById("log-details").value = "";

    const formTitle = document.getElementById("form-title");
    if (formTitle) formTitle.textContent = "連絡事項 新規登録";
}

// --- 保存ボタンを押した時の処理 ---
function saveWorklog() {
    const id = document.getElementById("log-id") ? document.getElementById("log-id").value : "";
    const dateVal = document.getElementById("log-date") ? document.getElementById("log-date").value : "";
    const category = document.getElementById("log-category") ? document.getElementById("log-category").value : "";
    const priority = document.getElementById("log-priority") ? document.getElementById("log-priority").value : "";
    const author = document.getElementById("log-author") ? document.getElementById("log-author").value : "";
    const details = document.getElementById("log-details") ? document.getElementById("log-details").value : "";

    if (!dateVal || !details || !author) {
        alert("「日付」「記入者」「連絡事項」を入力してください。");
        return;
    }

    const formattedDate = dateVal.replace(/-/g, '/');
    const logId = id || Date.now().toString();

    let logs = getStoredLogs();
    const existingIndex = logs.findIndex(item => item.id === logId);

    if (existingIndex >= 0) {
        logs[existingIndex].date = formattedDate;
        logs[existingIndex].category = category;
        logs[existingIndex].priority = priority;
        logs[existingIndex].author = author;
        logs[existingIndex].details = details;
    } else {
        logs.unshift({
            id: logId,
            date: formattedDate,
            category: category,
            priority: priority,
            author: author,
            details: details,
            confirmedStaff: [author]
        });
    }

    saveStoredLogs(logs);
    renderAllLogs();
    resetWorklogForm();
    switchWorklogTab('worklog-page');
}

// --- 削除処理 ---
function deleteWorklog(logId) {
    if (confirm('この連絡事項を削除してもよろしいですか？')) {
        let logs = getStoredLogs();
        logs = logs.filter(item => item.id !== logId);
        saveStoredLogs(logs);
        renderAllLogs();
    }
}

// --- キャンセルボタンを押した時の処理 ---
function cancelWorklogForm() {
    resetWorklogForm();
    switchWorklogTab('worklog-page');
}

// --- スタッフチェック切り替え処理 ---
function toggleStaffConfirm(logId, staff) {
    let logs = getStoredLogs();
    const targetLog = logs.find(item => item.id === logId);
 
    if (targetLog) {
        if (!targetLog.confirmedStaff) targetLog.confirmedStaff = [];
 
        const index = targetLog.confirmedStaff.indexOf(staff);
        if (index >= 0) {
            targetLog.confirmedStaff.splice(index, 1);
        } else {
            targetLog.confirmedStaff.push(staff);
        }
 
        saveStoredLogs(logs);
 
        const isAllChecked = staffList.every(s => targetLog.confirmedStaff.includes(s));
 
        if (isAllChecked) {
            // 全員チェック済みになった瞬間は、即座に移動させず
            // 一旦その場で緑色に変化するアニメーションを見せてから移動する
            animateCompletionThenRender(logId);
        } else {
            renderAllLogs();
        }
    }
}
 
// --- 全員確認済みになった行を、緑に変化させてから一覧を再描画（＝アーカイブへ移動）する ---
function animateCompletionThenRender(logId) {
    const row = document.querySelector(`tr[data-log-id="${logId}"]`);
 
    if (row) {
        // アニメーション用クラスを付与（CSS側のtransitionでなめらかに緑化）
        row.classList.add('record-complete-animate');
 
        // アニメーションが視認できる時間だけ待ってから、実際の移動（再描画）を行う
        setTimeout(() => {
            renderAllLogs();
        }, 300);
    } else {
        renderAllLogs();
    }
}
 

// --- 画面上のすべてのデータ行を描画・復元する ---
function renderAllLogs() {
    const mainTableBody = document.getElementById("log-table-body");
    const completedTableBody = document.getElementById("completed-log-table-body");

    if (!mainTableBody || !completedTableBody) return;

    mainTableBody.innerHTML = "";
    completedTableBody.innerHTML = "";

    const logs = getStoredLogs();

    logs.forEach(log => {
        let badgeHtml = log.priority === '至急'
            ? '<span class="badge badge-high">至急</span>'
            : '<span class="badge badge-low">通常</span>';

        const confirmedStaff = log.confirmedStaff || [];
        const isAllChecked = staffList.every(s => confirmedStaff.includes(s));

        // HTML表示用にエスケープ処理（改行は \n のまま保持）
        const safeDisplayDetails = (log.details || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 1. 行要素 (tr) を作成
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.dataset.logId = log.id;
        tr.classList.add('record-row');
        if (isAllChecked) {
            tr.classList.add('record-complete');
        }

        // 2. ダブルクリックイベントを直接JavaScriptで設定（これで改行が消えません）
        tr.addEventListener('dblclick', () => {
            editWorklogById(log.id);
        });

         // 3. 中身のセルを作成（確認状況セルは1つだけ）
        tr.innerHTML = `
            <td>${log.date}</td>
            <td>${log.category}</td>
            <td>${badgeHtml}</td>
            <td>${log.author}</td>
            <td class="details-cell">${safeDisplayDetails}</td>
            <td class="staff-cell" onclick="event.stopPropagation();">${renderStaffCheckboxes(log.id, confirmedStaff)}</td>
            <td onclick="event.stopPropagation();">
       　　　　<div class="delete-cell-wrap">
           　　　<button type="button" class="btn-delete" onclick="deleteWorklog('${log.id}')">削除</button>
       　　　　</div>
   　　　　　</td>
        `;

        // 4. テーブルに追加
        if (isAllChecked) {
            completedTableBody.appendChild(tr);
        } else {
            mainTableBody.appendChild(tr);
        }
    });
}

// --- 初期化処理 ---
function initWorklog() {
    const authorSelect = document.getElementById("log-author");
    if (authorSelect) {
        authorSelect.innerHTML = '<option value="">(選択なし)</option>';
        staffList.forEach(staff => {
            const opt = document.createElement("option");
            opt.value = staff;
            opt.textContent = staff;
            authorSelect.appendChild(opt);
        });
    }

    renderAllLogs();
}

// --- ページ読み込み時の処理 ---

// 関数を外部（メインタブ）から呼び出せるようにグローバル公開
window.initWorklog = initWorklog;
window.renderAllLogs = renderAllLogs;
window.editWorklogById = editWorklogById;

// 単体起動・動的読み込み両対応の実行判定
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWorklog();
} else {
    document.addEventListener("DOMContentLoaded", initWorklog);
}