// ------------------------------------------------------------
// 画面切り替え制御（タブなし・シングルビュー版）
// ------------------------------------------------------------
// フォルダ構成: main フォルダと同じ階層に各画面フォルダを配置
//
// ※タブ機能（開く/切替/閉じる/履歴）は tabs.js に分離済み。
//   このファイルは「クリックしたら画面がそのまま切り替わる」だけの
//   シンプルな挙動になっています。

const pageRoutes = {
    'worklog-page': '../worklog/worklog.html',
    'ledger-page': '../ledger/ledger.html'
};

// メイン画面のボタンクリック時のハンドラー関数
function handleMenuClick(button) {
    const target = button.dataset.target;
    const label = button.textContent.trim();

    if (target) {
        showPage(target);
    } else {
        alert(`${label}画面は準備中です`);
    }
}

// 取得したページの CSS をメインの <head> に動的追加する関数
function loadPageStyles(fetchedDoc, pagePath) {
    const pageAbsoluteUrl = new URL(pagePath, document.baseURI);
    const links = fetchedDoc.querySelectorAll('link[rel="stylesheet"]');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const resolvedHref = new URL(href, pageAbsoluteUrl).href;

        if (document.querySelector(`link[data-loaded-href="${resolvedHref}"]`)) return;

        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        // ↓ 開発中は毎回キャッシュを回避するため、タイムスタンプを付与
        newLink.href = resolvedHref + '?t=' + Date.now();
        newLink.dataset.loadedHref = resolvedHref;
        document.head.appendChild(newLink);
    });
}

// 指定した画面を読み込んで表示する（タブは作らず、常に1画面だけ表示）
async function showPage(pageId) {
    let pageDiv = document.getElementById(pageId);

    if (!pageDiv) {
        const container = document.getElementById('main-container');
        const path = pageRoutes[pageId];

        if (path) {
            try {
                const res = await fetch(path, { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await res.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                loadPageStyles(doc, path);

                // <script>タグはappendChildしても実行されないため、
                // 別扱いにして後でcreateElementし直す
                const scriptEls = [];
                Array.from(doc.body.children).forEach(child => {
                    if (child.tagName === 'SCRIPT') {
                        scriptEls.push(child);
                    } else {
                        container.appendChild(child);
                    }
                });

                // スクリプトを新規に作り直して実行させる
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

                // 各画面の初期化は各画面のJS（例: worklog.js）側の
                // 自己実行ロジック（DOMContentLoaded / readyStateチェック）に任せる。

                pageDiv = document.getElementById(pageId);

                if (!pageDiv) {
                    pageDiv = document.createElement('div');
                    pageDiv.id = pageId;
                    pageDiv.className = 'page';
                    pageDiv.innerHTML = `<p>内容が見つかりませんでした</p>`;
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
            pageDiv.innerHTML = `<p>画面は準備中です</p>`;
            container.appendChild(pageDiv);
        }
    }

    // タブバーは使わず、常に1画面だけを表示する
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    pageDiv.classList.add('active');
}

// ------------------------------------------------------------
// 既存のHTMLボタン要素に対するイベントリスナーの紐付けと属性の設定
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 画面遷移ターゲットの定義マップ
    const buttonConfig = {
        '連絡事項': { target: 'worklog-page' },
        '機器台帳': { target: 'ledger-page' }
    };

    // main-btn-group および sub-btn-group 内のすべてのボタンを取得
    const buttons = document.querySelectorAll('.main-btn-group button, .sub-btn-group button');

    buttons.forEach(btn => {
        const label = btn.textContent.trim();

        // 設定マップに存在するボタンには dataset 属性を付与
        if (buttonConfig[label]) {
            btn.dataset.target = buttonConfig[label].target;
        }

        // クリックイベントのリスナーを設定
        btn.addEventListener('click', () => handleMenuClick(btn));
    });
});