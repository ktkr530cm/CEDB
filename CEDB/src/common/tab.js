// ------------------------------------------------------------
// タブ制御（tabs.js）
// ------------------------------------------------------------

const pageRoutes = {
    'worklog-page': '../worklog/worklog.html',
    'ledger-page': '../ledger/ledger.html'
};

// 閲覧履歴の記録
let tabHistory = ['main-page'];

// pageIdからデフォルトのタブタイトルを割り当てる（tabTitle省略時のフォールバック）
const defaultTabTitles = {
    'worklog-page': '🖊️連絡事項一覧',
    'worklog-form-page': '📝連絡事項入力',
    'past-worklog-page': '📜過去アーカイブ',
    'ledger-page': '📒機器台帳'
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

// 外部CSSをロードし、読み込み完了を待てるようにする
function loadPageStyles(fetchedDoc, pagePath, pageId) {
    const pageAbsoluteUrl = new URL(pagePath, document.baseURI);
    const links = fetchedDoc.querySelectorAll('link[rel="stylesheet"]');
    const loadPromises = [];

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const resolvedHref = new URL(href, pageAbsoluteUrl).href;

        // 既に読み込み済みのCSSであればスキップ
        if (document.querySelector(`link[data-loaded-href="${resolvedHref}"]`)) return;

        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = resolvedHref;
        newLink.dataset.loadedHref = resolvedHref;

        // ★読み込み完了(またはエラー)を待てるようPromise化
        const p = new Promise((resolve) => {
            newLink.onload = resolve;
            newLink.onerror = resolve; // エラーでも処理を止めない
        });
        loadPromises.push(p);

        document.head.appendChild(newLink);
    });

    return Promise.all(loadPromises);
}

// タブ切り替え関数
function switchTab(pageId) {
    // 1. 全画面と全タブから active クラスを外す
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));

    // 2. 該当する画面とタブに active クラスを付与
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const targetTab = document.getElementById(`tab-btn-${pageId}`);
    if (targetTab) targetTab.classList.add('active');

    // ★CSSの disabled 切り替えロジックは全削除（常に有効化）★

    // 履歴更新
    if (tabHistory[tabHistory.length - 1] !== pageId) {
        tabHistory.push(pageId);
    }
}

// タブを開く
async function openTab(pageId, tabTitle) {
    const displayTitle = tabTitle || defaultTabTitles[pageId] || '画面';
    const tabBar = document.getElementById('tab-bar');
    let existingTab = document.getElementById(`tab-btn-${pageId}`);

    if (!existingTab) {
        let pageDiv = document.getElementById(pageId);
        const path = pageRoutes[pageId];

        // 外部ファイルロードが必要な場合
        if (path && !pageDiv) {
    const container = document.getElementById('main-container');

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        await loadPageStyles(doc, path, pageId);

        const scriptEls = [];
        Array.from(doc.body.children).forEach(child => {
            if (child.tagName === 'SCRIPT') {
                scriptEls.push(child);
            } else {
                // ラッパーを作らず、元のidのままコンテナ直下に追加
                container.appendChild(child.cloneNode(true));
            }
        });

        pageDiv = document.getElementById(pageId);

        const scriptBaseUrl = new URL(path, document.baseURI);
        const scriptPromises = [];

        scriptEls.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            if (oldScript.hasAttribute('src')) {
                const scriptUrl = new URL(oldScript.getAttribute('src'), scriptBaseUrl).href;
                newScript.src = scriptUrl;
                const p = new Promise((resolve) => {
                    newScript.onload = resolve;
                    newScript.onerror = resolve;
                });
                scriptPromises.push(p);
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
        });

        await Promise.all(scriptPromises);

    } catch (err) {
        if (!document.getElementById(pageId)) {
            const errDiv = document.createElement('div');
            errDiv.id = pageId;
            errDiv.className = 'page';
            errDiv.innerHTML = `<p>読み込みに失敗しました（${err.message}）</p>`;
            container.appendChild(errDiv);
        }
    }
}
        else if (!pageDiv) {
            const container = document.getElementById('main-container');
            pageDiv = document.createElement('div');
            pageDiv.id = pageId;
            pageDiv.className = 'page';
            pageDiv.innerHTML = `<p>${displayTitle}画面は準備中です</p>`;
            container.appendChild(pageDiv);
        }

        // タブボタンを作成
        const newTab = document.createElement('button');
        newTab.className = 'tab-item';
        newTab.id = `tab-btn-${pageId}`;
        newTab.innerHTML = `${displayTitle} <span class="tab-close-btn" onclick="event.stopPropagation(); closeTab('${pageId}')">×</span>`;
        newTab.onclick = () => switchTab(pageId);
        if (tabBar) tabBar.appendChild(newTab);
    }

    // タブ切り替え表示
    switchTab(pageId);

    // ★画面切り替え完了後に、機器台帳の初期化・再描画を実行
    if (pageId === 'ledger-page' || pageId === 'ledger-form-page') {
        if (typeof initLedger === 'function') {
            initLedger();
        } else if (typeof renderLedgerTable === 'function') {
            renderLedgerTable();
        }
    }
}

// グローバル関数として開示（worklog.js等から呼び出せるようにする）
window.openTab = openTab;

// タブを閉じる
function closeTab(pageId) {
    if (pageId === 'main-page') return;

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
// イベントリスナーの紐付け
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const buttonConfig = {
        '連絡事項': { target: 'worklog-page', title: '📋連絡事項一覧' },
        '機器台帳': { target: 'ledger-page', title: '📒機器台帳' }
    };

    const buttons = document.querySelectorAll('.main-btn-group button, .sub-btn-group button');

    buttons.forEach(btn => {
        const label = btn.textContent.trim();

        if (buttonConfig[label]) {
            btn.dataset.target = buttonConfig[label].target;
            btn.dataset.title = buttonConfig[label].title;
        }

        btn.addEventListener('click', () => handleMenuClick(btn));
    });
});

