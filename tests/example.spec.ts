import { test, expect } from '@playwright/test';

test('基本的なページ検証', async ({ page }) => {
  // ページに移動
  await page.goto('https://example.com');
  
  // タイトルが正しいことを確認
  await expect(page).toHaveTitle(/Example Domain/);
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/example.png' });
});

test('GitHub検索テスト', async ({ page }) => {
  await page.goto('https://github.com');
  
  // 検索ボックスにテキスト入力
  await page.fill('[aria-label="Search GitHub"], [placeholder*="Search"]', 'playwright');
  
  // Enterキーを押す
  await page.press('[aria-label="Search GitHub"], [placeholder*="Search"]', 'Enter');
  
  // 検索結果のリポジトリリンクが表示されるまで待機
  await expect(page.locator('[data-testid="results-list"]')).toBeVisible({ timeout: 10000 });
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/github-search.png' });
});

test('Wikipedia記事テスト', async ({ page }) => {
  await page.goto('https://ja.wikipedia.org/wiki/JavaScript');
  
  // ページタイトル確認
  await expect(page).toHaveTitle(/JavaScript/);
  
  // 目次が存在することを確認
  await expect(page.locator('#toc')).toBeVisible();
  
  // 最初の段落が表示されていることを確認
  await expect(page.locator('.mw-parser-output > p').first()).toBeVisible();
  
  // スクリーンショット取得
  await page.screenshot({ path: 'tests/screenshots/wikipedia-javascript.png' });
});