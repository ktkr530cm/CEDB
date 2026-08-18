// main画面の読み込み
fetch('../html/main.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('main-page').innerHTML = data;
    });
