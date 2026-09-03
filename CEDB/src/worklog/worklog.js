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
    if (detailsInput) detailsInput.innerHTML = details || "";   // ★ .value → .innerHTML に変更

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
    if (document.getElementById("log-details")) document.getElementById("log-details").innerHTML = "";   // ★ .value → .innerHTML に変更

    const formTitle = document.getElementById("form-title");
    if (formTitle) formTitle.textContent = "連絡事項 新規登録";
}

// --- 保存ボタンを押した時の処理 ---
function saveWorklog() {
    const id = document.getElementById("log-id") ? document.getElementById("log-id").value : "";
    const dateVal = document.getElementById("log-date") ? document.getElementById("log-date").value : "";
    const priority = document.getElementById("log-priority") ? document.getElementById("log-priority").value : "";
    const author = document.getElementById("log-author") ? document.getElementById("log-author").value : "";

    // ★ ここから変更：innerHTML（書式付き）とtextContent（バリデーション用の文字列）を分けて取得
    const detailsEl = document.getElementById("log-details");
    const details = detailsEl ? detailsEl.innerHTML : "";
    const detailsText = detailsEl ? detailsEl.textContent.trim() : "";
    // ★ ここまで変更

    if (!dateVal || !detailsText || !author) {   // ★ !details → !detailsText に変更
        alert("「日付」「記入者」「連絡事項」を入力してください。");
        return;
    }

    const formattedDate = dateVal.replace(/-/g, '/');
    const logId = id || Date.now().toString();

    let logs = getStoredLogs();
    const existingIndex = logs.findIndex(item => item.id === logId);

    if (existingIndex >= 0) {
        logs[existingIndex].date = formattedDate;
        logs[existingIndex].priority = priority;
        logs[existingIndex].author = author;
        logs[existingIndex].details = details;
    } else {
        logs.unshift({
            id: logId,
            date: formattedDate,
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
function toggleStaffCheck(logId, staff) {
    let logs = getStoredLogs();
    const targetLog = logs.find(item => item.id === logId);
 
    if (targetLog) {
        if (!Array.isArray(targetLog.confirmedStaff)) {
            targetLog.confirmedStaff = [];
        }
 
        const index = targetLog.confirmedStaff.indexOf(staff);
        if (index >= 0) {
            targetLog.confirmedStaff.splice(index, 1);
        } else {
            targetLog.confirmedStaff.push(staff);
        }
 
        saveStoredLogs(logs);
 
        const currentStaffList = (typeof staffList !== 'undefined') ? staffList : [];
        const isAllChecked = currentStaffList.length > 0 && currentStaffList.every(s => targetLog.confirmedStaff.includes(s));
 
        if (isAllChecked) {
            // アニメーション関数が存在すれば実行、なければ即時再描画してアーカイブ移動
            if (typeof animateCompletionThenRender === 'function') {
                animateCompletionThenRender(logId);
            } else {
                renderAllLogs();
            }
        } else {
            renderAllLogs();
        }
    }
}

// 互換性維持のためエイリアス（別名）としても定義
const toggleStaffConfirm = toggleStaffCheck;
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
        tr.dataset.logId = log.id;
        tr.classList.add('record-row');
        if (isAllChecked) {
            tr.classList.add('record-complete');
        }

        // 2. ダブルクリックイベントを直接JavaScriptで設定（これで改行が消えません）
        // ★過去アーカイブ（全員確認済み＝isAllChecked）の行は編集不可にする
        if (isAllChecked) {
            tr.style.cursor = 'default';
            tr.title = '確認済みのため編集できません';
        } else {
            tr.style.cursor = 'pointer';
            tr.title = 'ダブルクリックで編集';
            tr.addEventListener('dblclick', () => {
                editWorklogById(log.id);
            });
        }

         // 3. 中身のセルを作成（確認状況セルは1つだけ）
tr.innerHTML = `
    <td>${log.date || ''}</td>
    <td><span class="badge ${log.priority === '至急' ? 'badge-high' : 'badge-low'}">${log.priority || '通常'}</span></td>
    <td>${log.author || ''}</td>
    <td class="details-cell">${log.details || ''}</td>
    <td>${renderCheckboxesHTML(log)}</td>
    <td>${renderDeleteBtnHTML(log)}</td>
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



// 確認状況のチェックボックスHTMLを生成する関数
function renderCheckboxesHTML(log) {
    // 上部で定義されている staffList を安全に参照
    const currentStaffList = (typeof staffList !== 'undefined') ? staffList : [];
    const confirmedStaff = log.confirmedStaff || log.checks || [];

    if (currentStaffList.length === 0) {
        return `<span style="color: #999; font-size: 11px;">スタッフ未設定</span>`;
    }

    return `<div class="staff-grid">` + currentStaffList.map(staff => {
        const isChecked = Array.isArray(confirmedStaff) 
            ? confirmedStaff.includes(staff) 
            : !!confirmedStaff[staff];

        return `
            <label class="staff-checkbox-item">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleStaffCheck('${log.id}', '${staff}')">
                <span>${staff}</span>
            </label>
        `;
    }).join('') + `</div>`;
}

// 操作（削除ボタンなど）のHTMLを生成する関数
function renderDeleteBtnHTML(log) {
    return `
        <div class="delete-cell-wrap">
            <button class="btn-delete" onclick="deleteWorklog('${log.id}')">削除</button>
        </div>
    `;
}

// --- リッチテキスト編集用 ---
// --- リッチテキスト編集用 ---
let savedRange = null;

function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const editor = document.getElementById('log-details');
        if (editor && editor.contains(range.commonAncestorContainer)) {
            savedRange = range.cloneRange();
        }
    }
}

function restoreSelection() {
    if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
    }
}

function focusEditor() {
    const editor = document.getElementById('log-details');
    if (editor) {
        editor.focus();
        restoreSelection();
    }
}

function toggleFormat(command) {
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
        // 選択範囲がない場合はそのまま実行（カーソル位置調整は不要）
        document.execCommand(command, false, null);
        saveSelection();
        return;
    }

    applyFormatWithCursorFix(range, () => {
        document.execCommand(command, false, null);
    });
}

function applyFontColor(color) {
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
        saveSelection();
        return;
    }

    applyFormatWithCursorFix(range, () => {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
    });
}

function applyFontFamily(fontFamily) {
    if (!fontFamily) return;
    focusEditor();
    const sel = window.getSelection();

    if (sel.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('fontName', false, fontFamily);
            saveSelection();
        } else {
            applyFormatWithCursorFix(range, () => {
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('fontName', false, fontFamily);
            });
        }
    }

    const select = document.getElementById('log-font-family');
    if (select) select.value = '';
}

function applyFontSize(sizePx) {
    if (!sizePx) return;
    focusEditor();
    const editor = document.getElementById('log-details');
    const sel = window.getSelection();

    const applySizeCommand = () => {
        document.execCommand('styleWithCSS', false, false);
        document.execCommand('fontSize', false, '7');
        if (editor) {
            editor.querySelectorAll('font[size="7"]').forEach(el => {
                el.removeAttribute('size');
                el.style.fontSize = sizePx + 'px';
            });
        }
    };

    if (sel.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
            applySizeCommand();
            saveSelection();
        } else {
            applyFormatWithCursorFix(range, applySizeCommand);
        }
    }

    const select = document.getElementById('log-font-size');
    if (select) select.value = '';
}

function clearFormat() {
    const editor = document.getElementById('log-details');
    const sel = window.getSelection();
    if (!editor || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) return;

    const selectedText = range.toString();
    range.deleteContents();
    const textNode = document.createTextNode(selectedText);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);

    saveSelection();
}

// 選択範囲の変化を常に検知して保存する
document.addEventListener('selectionchange', () => {
    saveSelection();
});

// ★ 追加：選択範囲の右端にマーカーを置き、書式適用処理の後にその位置へカーソルを戻す共通処理
function applyFormatWithCursorFix(range, applyFn) {
    const editor = document.getElementById('log-details');
    const sel = window.getSelection();

    // 選択範囲の右端（終端）に目印用の一時マーカーを挿入
    const marker = document.createElement('span');
    marker.id = '__format-cursor-marker__';
    marker.appendChild(document.createTextNode('\u200B'));

    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(marker);

    // 実際の書式適用処理（execCommand呼び出し）を実行
    applyFn();

    // 空になった書式タグの残骸を掃除（マーカー自体は対象外）
    editor.querySelectorAll('b, i, u, font, span, strong, em').forEach(el => {
        if (el.id !== '__format-cursor-marker__' && el.textContent === '') {
            el.remove();
        }
    });

    // マーカーの位置を探してカーソルを合わせ、マーカーを削除する
    const foundMarker = document.getElementById('__format-cursor-marker__');
    const newRange = document.createRange();

    if (foundMarker) {
        newRange.setStartBefore(foundMarker);
        newRange.collapse(true);
        foundMarker.remove();
    } else {
        newRange.selectNodeContents(editor);
        newRange.collapse(false);
    }

    editor.normalize();
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedRange = newRange.cloneRange();
}

function clearFormat() {
    const editor = document.getElementById('log-details');
    const sel = window.getSelection();
    if (!editor || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) return;

    // 選択範囲の右端（終端）に、目印用の一時マーカーを挿入しておく
    const marker = document.createElement('span');
    marker.id = '__clear-format-cursor-marker__';
    marker.appendChild(document.createTextNode('\u200B')); // 幅を持たない透明な文字

    const endRange = range.cloneRange();
    endRange.collapse(false); // 選択範囲の右端（終わり）に位置を絞る
    endRange.insertNode(marker);

    // ブラウザ標準のremoveFormatを実行。
    // 部分選択でも書式タグの分割を内部で正しく処理してくれる。
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('removeFormat', false, null);

    // 中身が空になった書式タグの残骸があれば掃除（マーカー自体は対象外）
    editor.querySelectorAll('b, i, u, font, span, strong, em').forEach(el => {
        if (el.id !== '__clear-format-cursor-marker__' && el.textContent === '') {
            el.remove();
        }
    });
    editor.normalize();

    // マーカーの位置を探してカーソルを合わせ、マーカーを削除する
    const foundMarker = document.getElementById('__clear-format-cursor-marker__');
    const newRange = document.createRange();

    if (foundMarker) {
        newRange.setStartBefore(foundMarker);
        newRange.collapse(true);
        foundMarker.remove();
    } else {
        // 保険：マーカーが見つからなければエディタ末尾に置く
        newRange.selectNodeContents(editor);
        newRange.collapse(false);
    }

    editor.normalize();
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedRange = newRange.cloneRange();
}
