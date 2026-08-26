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

// 外部CSSをロードし、所有画面IDを記録する
function loadPageStyles(fetchedDoc, pagePath, pageId) {
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
        newLink.dataset.ownerPage = pageId; // 画面判別用属性を追加
        document.head.appendChild(newLink);
    });
}

// タブを切り替え＆他画面のCSSを無効化
function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const targetTab = document.getElementById(`tab-btn-${pageId}`) || document.querySelector('.tab-bar .tab-item:first-child');
    if (targetTab) targetTab.classList.add('active');

    // ★重要: 非表示画面のCSSを無効化（disabled）してメイン画面への干渉を防ぐ
    document.querySelectorAll('link[data-owner-page]').forEach(link => {
        if (link.dataset.ownerPage === pageId) {
            link.disabled = false; // アクティブ画面のCSSのみ有効
        } else {
            link.disabled = true;  // 非アクティブ画面のCSSは無効
        }
    });

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
            pageDiv = document.createElement('div');
            pageDiv.id = pageId;
            pageDiv.className = 'page';

            try {
                const res = await fetch(path);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await res.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // ★重要: pageId を渡して読み込み元を識別させる
                loadPageStyles(doc, path, pageId);

                const scriptEls = [];
                Array.from(doc.body.children).forEach(child => {
                    if (child.tagName === 'SCRIPT') {
                        scriptEls.push(child);
                    } else {
                        pageDiv.appendChild(child.cloneNode(true));
                    }
                });

                container.appendChild(pageDiv);

                const scriptBaseUrl = new URL(path, document.baseURI);
                scriptEls.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    if (oldScript.hasAttribute('src')) {
                        newScript.src = new URL(oldScript.getAttribute('src'), scriptBaseUrl).href;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    document.body.appendChild(newScript);
                });

            } catch (err) {
                pageDiv.innerHTML = `<p>読み込みに失敗しました（${err.message}）</p>`;
                container.appendChild(pageDiv);
            }
        } 
        // HTML内に元々存在する要素、あるいは定義なし画面の場合
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

    switchTab(pageId);
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
        '機器台帳': { target: 'ledger-page', title: '機器台帳' }
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

// 例：タブ移動時にボタンを再描画・生成している処理
function renderToolbar() {
    const toolbar = document.getElementById('toolbar');
    
    // ボタンのHTMLを生成する際、'btn btn-primary' を確実に指定する
    toolbar.innerHTML = `
        <button type="button" class="btn btn-primary" id="add-btn">追加</button>
        <button type="button" class="btn btn-primary" id="export-btn">出力</button>
    `;
}

// または DOM要素を動的に作成している場合
function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    
    // 1. 正しいクラス名を付与する (青色ボタン: btn-primary)
    button.className = 'btn btn-primary'; 
    
    // 2. もし動的に style (height や background) が直接入っている場合はクリアする
    button.style.height = '';
    button.style.backgroundColor = '';
    
    return button;
}