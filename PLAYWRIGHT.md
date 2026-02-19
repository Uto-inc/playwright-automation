# Playwright - ブラウザ自動化ツール 🎭

愛ちゃん用のPlaywright環境が構築完了しました！

## ✅ 導入完了項目

- **@playwright/test** インストール完了
- **Chromium** ブラウザ設定完了（ヘッドレス）
- **テストファイル** 動作確認済み
- **CLIツール** 操作用スクリプト完備
- **ヘルパークラス** プログラム用ライブラリ完備

## 🚀 基本的な使い方

### 1. テスト実行
```bash
# 全テスト実行
npx playwright test

# 特定ファイル実行
npx playwright test tests/simple.spec.ts

# レポート表示
npx playwright show-report
```

### 2. CLIツール
```bash
# スクリーンショット取得
npx tsx playwright-cli.ts screenshot https://example.com

# 簡易テスト実行
npx tsx playwright-cli.ts quick https://example.com

# デモ実行
npx tsx playwright-cli.ts demo

# ヘルプ表示
npx tsx playwright-cli.ts help
```

### 3. プログラムから使用
```typescript
import { PlaywrightHelper } from './playwright-helpers';

const helper = new PlaywrightHelper();
await helper.launch();
await helper.goto('https://example.com');
const title = await helper.getTitle();
await helper.screenshot('test.png');
await helper.close();
```

## 📁 ファイル構成

```
├── playwright.config.ts      # Playwright設定
├── playwright-helpers.ts     # ヘルパークラス
├── playwright-cli.ts         # CLIツール
├── tests/
│   ├── simple.spec.ts        # 基本テスト（動作確認済み）
│   ├── example.spec.ts       # 詳細テスト例
│   └── screenshots/          # テスト用スクリーンショット
└── screenshots/              # CLI用スクリーンショット
```

## 💡 実用例

### Web UI自動テスト
```typescript
test('ログイン機能テスト', async ({ page }) => {
  await page.goto('https://your-app.com/login');
  await page.fill('#username', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('#login-button');
  await expect(page.locator('.welcome')).toBeVisible();
});
```

### スクレイピング
```typescript
const helper = new PlaywrightHelper();
await helper.launch();
await helper.goto('https://news.site.com');
const headlines = await helper.evaluate(() => 
  Array.from(document.querySelectorAll('.headline')).map(el => el.textContent)
);
```

### フォーム自動入力
```typescript
await helper.goto('https://form.example.com');
await helper.fill('#name', '愛ちゃん');
await helper.fill('#email', 'ai@example.com');
await helper.click('#submit');
```

## 🔧 設定

### playwright.config.ts
- **ブラウザ**: Chromium（ヘッドレス）
- **タイムアウト**: 30秒
- **レポート**: HTML形式
- **スクリーンショット**: エラー時のみ
- **トレース**: 失敗時のリトライで記録

## 🎯 既存ツールとの使い分け

| ツール | 用途 |
|--------|------|
| **OpenClaw browser** | ページ閲覧・簡単操作・スナップショット |
| **Playwright** | 複雑なテストシナリオ・自動化ワークフロー・UI操作 |

## ⚡ パフォーマンス

- **ヘッドレス実行**: 高速動作
- **並列テスト**: 複数ワーカーで実行
- **スクリーンショット**: 失敗時のみで軽量化

---

**🎭 Playwright環境が整いました！**
自動テスト・UI操作・スクレイピングなど、ブラウザ系の作業が大幅に効率化されます〜✨