// --- タブ制御用関数 ---

function openTab(pageId, tabTitle) {
    const tabBar = document.getElementById('tab-bar');
    let existingTab = document.getElementById(`tab-btn-${pageId}`);

    if (!existingTab) {
        // ★ tabTitle が未指定の場合、IDに応じてタイトルを自動割り当て
        let defaultTitle = '画面';
        if (pageId === 'worklog-form-page') defaultTitle = '📝 連絡事項入力';
        if (pageId === 'ledger-page') defaultTitle = '機器台帳';
        if (pageId === 'past-worklog-page') defaultTitle = '過去アーカイブ';

        const displayTitle = tabTitle || defaultTitle;

        const newTab = document.createElement('button');
        newTab.className = 'tab-item';
        newTab.id = `tab-btn-${pageId}`;

        // ★ ${tabTitle} を ${displayTitle} に変更
        newTab.innerHTML = `${displayTitle} <span class="tab-close-btn" onclick="event.stopPropagation(); closeTab('${pageId}')">×</span>`;
        newTab.onclick = () => switchTab(pageId);
        if (tabBar) tabBar.appendChild(newTab);
    }

    switchTab(pageId);
}


function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const targetTab = document.getElementById(`tab-btn-${pageId}`) || document.querySelector('.tab-bar .tab-item:first-child');
    if (targetTab) targetTab.classList.add('active');
}

function closeTab(pageId) {
    const tabBtn = document.getElementById(`tab-btn-${pageId}`);
    if (tabBtn) tabBtn.remove();

    const targetPage = document.getElementById(pageId);
    if (targetPage && targetPage.classList.contains('active')) {
        switchTab('main-page');
    }
}