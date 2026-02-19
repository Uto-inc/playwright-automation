import { test, expect } from '@playwright/test';

test('基本ページアクセステスト', async ({ page }) => {
  // Example.comにアクセス
  await page.goto('https://example.com');
  
  // タイトル確認
  await expect(page).toHaveTitle(/Example Domain/);
  
  // H1要素確認
  await expect(page.locator('h1')).toHaveText('Example Domain');
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/example-domain.png' });
  
  console.log('✅ Example.com テスト完了');
});

test('HTTPBinテスト', async ({ page }) => {
  // HTTPBin GETリクエスト
  await page.goto('https://httpbin.org/get');
  
  // JSON形式のレスポンス確認
  await expect(page.locator('pre')).toContainText('"url": "https://httpbin.org/get"');
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/httpbin-get.png' });
  
  console.log('✅ HTTPBin テスト完了');
});

test('要素操作テスト', async ({ page }) => {
  // Simple HTML5 test page
  await page.setContent(`
    <html>
      <head><title>テストページ</title></head>
      <body>
        <h1>Playwright テスト</h1>
        <input id="name" placeholder="名前を入力">
        <button id="submit">送信</button>
        <div id="result">結果がここに表示されます</div>
        
        <script>
          document.getElementById('submit').onclick = function() {
            const name = document.getElementById('name').value;
            document.getElementById('result').textContent = 'こんにちは、' + name + 'さん！';
          };
        </script>
      </body>
    </html>
  `);
  
  // フォーム操作
  await page.fill('#name', '愛ちゃん');
  await page.click('#submit');
  
  // 結果確認
  await expect(page.locator('#result')).toHaveText('こんにちは、愛ちゃんさん！');
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/form-interaction.png' });
  
  console.log('✅ 要素操作テスト完了');
});