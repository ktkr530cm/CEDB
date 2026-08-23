// ------------------------------------------------------------
// タブ制御
// ------------------------------------------------------------
// フォルダ構成: main フォルダと同じ階層に各画面フォルダを配置

const pageRoutes = {
    'worklog-page': '../worklog/worklog.html',
    'ledger-page': '../ledger/ledger.html'
};

// 閲覧履歴の記録
let tabHistory = ['main-page'];

// pageIdからデフォルトのタブタイトルを割り当てる（tabTitle省略時のフォールバック）
const defaultTabTitles = {
    'worklog-page': '📋連絡事項一覧',
    'worklog-form-page': '📝連絡事項入力',
    'past-worklog-page': '過去アーカイブ',
    'ledger-page': '機器台帳'
};

// メイン画面のボタンクリック時のハンドラー関数
function handleMenuClick(button) {
    const target = button.dataset.target;
    const title = button.dataset.title;
    const label = button.textContent.trim();

    if (target && title) {
        openTab(target, title);
    } else {
        alert(`${label}画面は準備中です`);
    }
}

// 取得したページの CSS をメインの <head> に動的追加する関数
function loadPageStyles(fetchedDoc, pagePath) {
    // pagePathを絶対URLに変換してから、それを基準にhrefを解決する
    const pageAbsoluteUrl = new URL(pagePath, document.baseURI);

    const links = fetchedDoc.querySelectorAll('link[rel="stylesheet"]');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const resolvedHref = new URL(href, pageAbsoluteUrl).href;

        if (document.querySelector(`link[data-loaded-href="${resolvedHref}"]`)) return;

        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = resolvedHref;
        newLink.dataset.loadedHref = resolvedHref;
        document.head.appendChild(newLink);
    });
}

async function openTab(pageId, tabTitle) {
    const displayTitle = tabTitle || defaultTabTitles[pageId] || '画面';
    const tabBar = document.getElementById('tab-bar');
    let existingTab = document.getElementById(`tab-btn-${pageId}`);

    if (!existingTab) {
        let pageDiv = document.getElementById(pageId);
        if (!pageDiv) {
            const container = document.getElementById('main-container');
            const path = pageRoutes[pageId];

            if (path) {
                try {
                    const res = await fetch(path);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const html = await res.text();

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    loadPageStyles(doc, path);

                    Array.from(doc.body.children).forEach(child => {
                        container.appendChild(child);
                    });

                    // 各画面の初期化は各画面のJS（例: worklog.js）側の
                    // 自己実行ロジック（DOMContentLoaded / readyStateチェック）に任せる。
                    // ここで window.initWorklog() を呼ぶと、タブを閉じて再度開いた際に
                    // 古い関数参照が先に呼ばれ、新しく読み込まれたスクリプトの
                    // 自己初期化と二重に実行されてしまうため削除。

                    pageDiv = document.getElementById(pageId);

                    if (!pageDiv) {
                        pageDiv = document.createElement('div');
                        pageDiv.id = pageId;
                        pageDiv.className = 'page';
                        pageDiv.innerHTML = `<p>${displayTitle}の内容が見つかりませんでした</p>`;
                        container.appendChild(pageDiv);
                    }
                } catch (err) {
                    pageDiv = document.createElement('div');
                    pageDiv.id = pageId;
                    pageDiv.className = 'page';
                    pageDiv.innerHTML = `<p>読み込みに失敗しました（${err.message}）</p>`;
                    container.appendChild(pageDiv);
                }
            } else {
                pageDiv = document.createElement('div');
                pageDiv.id = pageId;
                pageDiv.className = 'page';
                pageDiv.innerHTML = `<p>${displayTitle}画面は準備中です</p>`;
                container.appendChild(pageDiv);
            }
        }

        // タブボタンを新規作成
        const newTab = document.createElement('button');
        newTab.className = 'tab-item';
        newTab.id = `tab-btn-${pageId}`;
        newTab.innerHTML = `${displayTitle} <span class="tab-close-btn" onclick="event.stopPropagation(); closeTab('${pageId}')">×</span>`;
        newTab.onclick = () => switchTab(pageId);
        if (tabBar) tabBar.appendChild(newTab);
    }

    switchTab(pageId);
}

// 1. タブ切り替え関数
function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const targetTab = document.getElementById(`tab-btn-${pageId}`) || document.querySelector('.tab-bar .tab-item:first-child');
    if (targetTab) targetTab.classList.add('active');

    if (tabHistory[tabHistory.length - 1] !== pageId) {
        tabHistory.push(pageId);
    }
}

// 2. タブを閉じる関数（直前に見ていたタブに戻る：tabHistory方式）
function closeTab(pageId) {
    const tabBtn = document.getElementById(`tab-btn-${pageId}`);
    if (tabBtn) tabBtn.remove();

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.remove();

    tabHistory = tabHistory.filter(id => id !== pageId);

    const previousTab = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : 'main-page';

    if (document.getElementById(previousTab)) {
        switchTab(previousTab);
    } else {
        switchTab('main-page');
    }
}

// ------------------------------------------------------------
// 既存のHTMLボタン要素に対するイベントリスナーの紐付けと属性の設定
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 画面遷移ターゲットとタイトルの定義マップ
    const buttonConfig = {
        '連絡事項': { target: 'worklog-page', title: '📋連絡事項一覧' },
        '機器台帳': { target: 'ledger-page', title: '機器台帳' }
    };

    // main-btn-group および sub-btn-group 内のすべてのボタンを取得
    const buttons = document.querySelectorAll('.main-btn-group button, .sub-btn-group button');

    buttons.forEach(btn => {
        const label = btn.textContent.trim();

        // 設定マップに存在するボタンには dataset 属性を付与
        if (buttonConfig[label]) {
            btn.dataset.target = buttonConfig[label].target;
            btn.dataset.title = buttonConfig[label].title;
        }

        // クリックイベントのリスナーを設定
        btn.addEventListener('click', () => handleMenuClick(btn));
    });
});