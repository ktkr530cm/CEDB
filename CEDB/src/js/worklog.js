// --- スタッフリスト定義 ---
const staffList = ["笹岡", "野村", "下平", "高橋", "阿部", "北原", "唐澤", "片桐", "名取", "今井", "小牧", "有賀"];

// ローカルストレージ用のキー名
const STORAGE_KEY = 'worklog_data_list';

// --- タブ切替関数のフォールバック ---
if (typeof window.openTab !== 'function') {
    window.openTab = function (pageId, tabTitle) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        const tabBar = document.getElementById('tab-bar');
        if (tabBar) {
            let existingTab = document.getElementById(`tab-btn-${pageId}`);
            if (!existingTab) {
                const displayTitle = tabTitle || (pageId === 'worklog-form-page' ? '📝 新規登録' : '画面');
                const newTab = document.createElement('button');
                newTab.className = 'tab-item';
                newTab.id = `tab-btn-${pageId}`;
                newTab.innerHTML = `${displayTitle} <span class="tab-close-btn" onclick="event.stopPropagation(); closeTab('${pageId}')">×</span>`;
                newTab.onclick = () => switchTab(pageId);
                tabBar.appendChild(newTab);
            }
            if (typeof window.switchTab === 'function') {
                window.switchTab(pageId);
            }
        }
    };
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

// --- 行ダブルクリック（編集）および新規作成の共通処理 ---
function editWorklog(id, date, category, priority, author, details) {
    const formTitle = document.getElementById("form-title");
    if (formTitle) {
        formTitle.textContent = id ? "連絡事項 編集" : "連絡事項 新規登録";
    }

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

    openTab('worklog-form-page', id ? '✏️ 編集' : '📝 新規登録');
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
        // 既存データの更新
        logs[existingIndex].date = formattedDate;
        logs[existingIndex].category = category;
        logs[existingIndex].priority = priority;
        logs[existingIndex].author = author;
        logs[existingIndex].details = details;
    } else {
        // 新規データの追加（記入者には自動チェック [author]）
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

    // LocalStorage に永続保存
    saveStoredLogs(logs);

    // 一覧の再描画
    renderAllLogs();

    resetWorklogForm();
    cancelWorklogForm();
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
    const formTab = document.getElementById('tab-btn-worklog-form-page');
    if (formTab) formTab.remove();
    openTab('worklog-page', '連絡事項一覧');
}

// --- スタッフチェック切り替え処理 ---
function toggleStaffConfirm(logId, staff) {
    let logs = getStoredLogs();
    const targetLog = logs.find(item => item.id === logId);

    if (targetLog) {
        if (!targetLog.confirmedStaff) targetLog.confirmedStaff = [];

        const index = targetLog.confirmedStaff.indexOf(staff);
        if (index >= 0) {
            targetLog.confirmedStaff.splice(index, 1); // チェック解除
        } else {
            targetLog.confirmedStaff.push(staff); // チェック追加
        }

        // 状態保存
        saveStoredLogs(logs);

        // DOMでの移動処理（アニメーション連動）
        const checkbox = document.querySelector(`input[data-log-id="${logId}"][data-staff="${staff}"]`);
        if (checkbox) {
            const tr = checkbox.closest('tr');
            if (tr) {
                const isAllChecked = staffList.every(s => targetLog.confirmedStaff.includes(s));
                if (isAllChecked) {
                    archiveLog(tr);
                } else {
                    unarchiveLog(tr);
                }
            }
        }
    }
}

// --- アーカイブ（過去の連絡事項へ移動）処理 ---
function archiveLog(trElement) {
    const completedTableBody = document.getElementById("completed-log-table-body");
    if (!completedTableBody) return;

    trElement.style.transition = "background-color 0.4s ease";
    trElement.style.backgroundColor = "#c8f7dc";

    setTimeout(() => {
        completedTableBody.insertBefore(trElement, completedTableBody.firstChild);
        trElement.style.backgroundColor = "#e8f8f5";
    }, 300);
}

// --- 未完了に戻す（メイン一覧へ戻す）処理 ---
function unarchiveLog(trElement) {
    const mainTableBody = document.getElementById("log-table-body");
    const completedTableBody = document.getElementById("completed-log-table-body");

    if (completedTableBody && completedTableBody.contains(trElement)) {
        if (!mainTableBody) return;

        mainTableBody.insertBefore(trElement, mainTableBody.firstChild);
        trElement.style.transition = "background-color 0.6s ease";
        trElement.style.backgroundColor = "#e8f8f5";

        void trElement.offsetHeight; // 強制リフロー
        trElement.style.backgroundColor = "white";
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
        let badgeHtml = '';
        if (log.priority === '至急') {
            badgeHtml = '<span class="badge badge-high">至急</span>';
  
        } else {
            badgeHtml = '<span class="badge badge-low">通常</span>';
        }

        const safeDetails = (log.details || "").replace(/'/g, "\\'").replace(/\n/g, " ");
        const confirmedStaff = log.confirmedStaff || [];

        // 全員チェック済みかどうか判断
        const isAllChecked = staffList.every(s => confirmedStaff.includes(s));

        const rowHtml = `
            <tr style="cursor: pointer; ${isAllChecked ? 'background-color: #e8f8f5;' : ''}" ondblclick="editWorklog('${log.id}', '${log.date}', '${log.category}', '${log.priority}', '${log.author}', '${safeDetails}')">
                <td>${log.date}</td>
                <td>${log.category}</td>
                <td>${badgeHtml}</td>
                <td>${log.author}</td>
                <td>${log.details}</td>
                <td onclick="event.stopPropagation();">${renderStaffCheckboxes(log.id, confirmedStaff)}</td>
                <td onclick="event.stopPropagation();">
                    <button class="btn-delete" onclick="deleteWorklog('${log.id}')">削除</button>
                </td>
            </tr>
        `;

        if (isAllChecked) {
            completedTableBody.insertAdjacentHTML('beforeend', rowHtml);
        } else {
            mainTableBody.insertAdjacentHTML('beforeend', rowHtml);
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

    // 保存されているデータを描画
    renderAllLogs();
}

// --- ページ読み込み時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    fetch('./worklog.html')
        .then(response => {
            if (!response.ok) throw new Error('HTMLファイルの読み込みに失敗しました: ' + response.status);
            return response.text();
        })
        .then(data => {
            const container = document.getElementById('worklog-container');
            if (container) {
                container.innerHTML = data;
                initWorklog();
            }
        })
        .catch(err => {
            console.error("エラーが発生しました:", err);
        });
});

