// main画面の読み込み
fetch('../html/main.html')
    .then(response => {
        if (!response.ok) throw new Error('main.htmlの取得に失敗しました');
        return response.text();
    })
    .then(data => {
        // ★ main-page ではなく main-container に入れる
        const container = document.getElementById('main-container');
        if (container) {
            container.innerHTML = data;
        }
    })
    .catch(error => console.error("main画面読み込みエラー:", error));