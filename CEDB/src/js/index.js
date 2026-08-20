/**
 * タブ切り替え処理
 * @param {string} pageId - 表示するページのID
 */
function switchTab(pageId) {
    // すべてのタブの active クラスを解除
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));

    // クリックされたタブをアクティブ化（実装に合わせて調整）
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // 表示エリアの切り替え処理をここに記述
    console.log(`ページ切替: ${pageId}`);
}