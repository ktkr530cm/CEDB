document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 定数・初期設定
    // -------------------------------------------------------------
    const STORAGE_KEY = 'ce_db_worklogs';

    // 12名のスタッフリスト
    const STAFF_LIST = [
        '笹岡', '野村', '下平', '高橋',
        '阿部', '北原', '唐澤', '片桐',
        '名取', '今井', '小牧', '有賀'
    ];

    // -------------------------------------------------------------
    // 画面遷移ロジック
    // -------------------------------------------------------------
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }

    // ボタンのイベントリスナー設定
    document.getElementById('btn-to-worklog')?.addEventListener('click', () => {
        renderTables();
        showPage('worklog-page');
    });

    document.getElementById('btn-back-main')?.addEventListener('click', () => showPage('main-page'));
    document.getElementById('btn-to-past-worklog')?.addEventListener('click', () => showPage('past-worklog-page'));
    document.getElementById('btn-back-worklog-from-past')?.addEventListener('click', () => showPage('worklog-page'));
    document.getElementById('btn-back-worklog')?.addEventListener('click', () => showPage('worklog-page'));
    document.getElementById('btn-cancel-form')?.addEventListener('click', () => showPage('worklog-page'));

    document.getElementById('btn-to-form')?.addEventListener('click', () => {
        resetForm();
        document.getElementById('form-title').innerText = '連絡事項 新規登録';
        // デフォルト日付を本日に設定
        document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
        showPage('worklog-form-page');
    });

    // ダミー・未実装機能用アラート
    ['btn-to-equipment', 'btn-to-trouble', 'btn-to-purchase', 'btn-to-performance',
        'btn-to-duty', 'btn-to-lending', 'btn-to-inspection', 'btn-to-daily-report',
        'btn-to-annual-report', 'btn-to-training'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {
                alert('こちらの機能は現在準備中です。');
            });
        });

    // -------------------------------------------------------------
    // 記入者プルダウンの初期化（STAFF_LISTから生成）
    // -------------------------------------------------------------
    function initAuthorSelect() {
        const authorSelect = document.getElementById('log-author');
        if (!authorSelect) return;

        authorSelect.innerHTML = '<option value="">(選択なし)</option>';
        STAFF_LIST.forEach(staff => {
            const opt = document.createElement('option');
            opt.value = staff;
            opt.textContent = staff;
            authorSelect.appendChild(opt);
        });
    }

    // -------------------------------------------------------------
    // ローカルストレージ操作
    // -------------------------------------------------------------
    function getLogs() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveLogs(logs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    // -------------------------------------------------------------
    // フォーム送信用処理（新規・更新）
    // -------------------------------------------------------------
    const worklogForm = document.getElementById('worklog-form');
    worklogForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const logId = document.getElementById('log-id').value;
        const date = document.getElementById('log-date').value;
        const category = document.getElementById('log-category').value;
        const priority = document.getElementById('log-priority').value;
        const author = document.getElementById('log-author').value;
        const details = document.getElementById('log-details').value;

        let logs = getLogs();

        if (logId) {
            // 既存データの更新
            logs = logs.map(item => {
                if (item.id === Number(logId)) {
                    return { ...item, date, category, priority, author, details };
                }
                return item;
            });
        } else {
            // 新規データの追加
            const initialStatus = {};
            STAFF_LIST.forEach(staff => { initialStatus[staff] = false; });

            const newLog = {
                id: Date.now(),
                date,
                category,
                priority,
                author,
                details,
                status: initialStatus
            };
            logs.unshift(newLog); // 先頭に追加
        }

        saveLogs(logs);
        renderTables();
        showPage('worklog-page');
    });

    function resetForm() {
        document.getElementById('log-id').value = '';
        document.getElementById('log-date').value = '';
        document.getElementById('log-category').value = '臨床';
        document.getElementById('log-priority').value = '通常';
        document.getElementById('log-author').value = '';
        document.getElementById('log-details').value = '';
    }

    // -------------------------------------------------------------
    // 確認チェックボックス切り替え処理
    // -------------------------------------------------------------
    window.toggleCheck = function (logId, staffName) {
        let logs = getLogs();
        logs = logs.map(item => {
            if (item.id === logId) {
                item.status[staffName] = !item.status[staffName];
            }
            return item;
        });
        saveLogs(logs);
        renderTables();
    };

    // -------------------------------------------------------------
    // 削除・編集処理
    // -------------------------------------------------------------
    window.deleteLog = function (logId) {
        if (confirm('本当に削除しますか？')) {
            let logs = getLogs();
            logs = logs.filter(item => item.id !== logId);
            saveLogs(logs);
            renderTables();
        }
    };

    window.editLog = function (logId) {
        const logs = getLogs();
        const target = logs.find(item => item.id === logId);
        if (!target) return;

        document.getElementById('log-id').value = target.id;
        document.getElementById('log-date').value = target.date;
        document.getElementById('log-category').value = target.category || '臨床';
        document.getElementById('log-priority').value = target.priority || '通常';
        document.getElementById('log-author').value = target.author || '';
        document.getElementById('log-details').value = target.details;

        document.getElementById('form-title').innerText = '連絡事項 編集';
        showPage('worklog-form-page');
    };

    // -------------------------------------------------------------
    // テーブル描画処理（ダブルクリックイベント付き）
    // -------------------------------------------------------------
    function renderTables() {
        const logs = getLogs();
        const activeTableBody = document.getElementById('log-table-body');
        const completedTableBody = document.getElementById('completed-log-table-body');

        if (!activeTableBody || !completedTableBody) return;

        activeTableBody.innerHTML = '';
        completedTableBody.innerHTML = '';

        logs.forEach(log => {
            // 全員確認済みかチェック
            const isAllChecked = STAFF_LIST.every(staff => log.status && log.status[staff]);

            // 重要度バッジの生成
            let priorityBadge = '<span class="badge badge-low">通常</span>';
            if (log.priority === '重要') {
                priorityBadge = '<span class="badge badge-med">重要</span>';
            } else if (log.priority === '緊急') {
                priorityBadge = '<span class="badge badge-high">緊急</span>';
            }

            // チェックボックスグリッドHTML作成
            let gridHtml = '<div class="staff-grid">';
            STAFF_LIST.forEach(staff => {
                const isChecked = log.status && log.status[staff];
                gridHtml += `
                    <label class="staff-checkbox-item ${isChecked ? 'checked' : ''}">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="toggleCheck(${log.id}, '${staff}')">
                        ${staff}
                    </label>
                `;
            });
            gridHtml += '</div>';

            // 行HTML作成
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.title = 'ダブルクリックで編集';

            tr.innerHTML = `
                <td>${log.date || ''}</td>
                <td>${log.category || ''}</td>
                <td>${priorityBadge}</td>
                <td>${log.author || '-'}</td>
                <td style="white-space: pre-wrap;">${log.details || ''}</td>
                <td>${gridHtml}</td>
                <td>
                  <button class="btn-delete" onclick="deleteLog(${log.id})">削除</button>
                </td>
            `;

            // ダブルクリック時に編集画面を開く処理
            tr.addEventListener('dblclick', (e) => {
                const targetTag = e.target.tagName.toLowerCase();
                if (targetTag === 'button' || targetTag === 'input' || targetTag === 'label') {
                    return;
                }
                editLog(log.id);
            });

            // アーカイブと未完了テーブルへ振り分け
            if (isAllChecked) {
                completedTableBody.appendChild(tr);
            } else {
                activeTableBody.appendChild(tr);
            }
        });
    }

    // 初期起動処理
    initAuthorSelect();
    renderTables();
});