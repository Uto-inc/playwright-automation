# Notion Reader - 読み取り専用アクセス 📝

愛ちゃん用のNotion読み取り環境が完成しました！

## ✅ 導入完了項目

- **@notionhq/client** インストール完了
- **読み取りヘルパークラス** 実装完了
- **CLIツール** 操作用スクリプト完備
- **デモ機能** 動作確認用モック完備
- **マークダウン変換** 対応済み

## 🎯 用途別使い分け

| 機能 | 用途 | ツール |
|------|------|--------|
| **読み取り** | 既存ページ内容確認・検索 | **Notion Reader**（新設） |
| **書き込み** | 調査結果の新規ページ作成 | **既存API連携**（維持） |

## 🚀 基本的な使い方

### 1. CLIツール（実際のAPI接続）
```bash
# ルートページの子ページ一覧
npx tsx notion-cli.ts root-children

# ワークスペース全体検索
npx tsx notion-cli.ts search "DX戦略"

# 指定ページをMarkdown形式で取得
npx tsx notion-cli.ts markdown <PAGE_ID> output.md

# ページの詳細情報取得
npx tsx notion-cli.ts get <PAGE_ID>
```

### 2. デモツール（API接続なし）
```bash
# 機能確認用（モックデータ）
npx tsx notion-demo.ts children
npx tsx notion-demo.ts search "DX"
npx tsx notion-demo.ts markdown 1001
```

### 3. プログラムから使用
```typescript
import { NotionReader } from './notion-reader';

const reader = new NotionReader({
  apiKey: 'your-api-key',
  rootPageId: 'your-root-page-id'
});

// ページをMarkdown形式で取得
const markdown = await reader.getPageAsMarkdown(pageId);

// ワークスペース検索
const results = await reader.searchWorkspace('検索クエリ');

// 子ページ一覧取得
const children = await reader.getChildPages(pageId);
```

## 📁 ファイル構成

```
├── notion-reader.ts         # メインライブラリ
├── notion-cli.ts           # CLIツール
├── notion-demo.ts          # デモ・テスト用
└── NOTION-READER.md        # このドキュメント
```

## 🔧 設定

### API認証設定
- **API Secret**: TOOLS.mdから自動取得
- **ルートページID**: TOOLS.mdから自動取得
- **権限**: 読み取り専用でOK

### 必要なNotion設定
1. **Integration作成**: https://www.notion.so/my-integrations
2. **ページ権限付与**: ワークスペースページでIntegrationに読み取り権限追加
3. **API Secret更新**: TOOLS.mdの設定を最新に更新

## 🛠️ トラブルシューティング

### API token is invalid エラー
- TOOLS.mdのAPI Secretが古い/無効
- NotionのIntegration設定を確認
- ページへのアクセス権限を確認

### Page not found エラー
- ページIDが間違っている
- Integrationにそのページの権限がない

## 💡 実用例

### 「前回のDX戦略資料見て」
```bash
npx tsx notion-cli.ts search "DX戦略"
# → 関連ページ一覧表示
npx tsx notion-cli.ts markdown <見つかったページID>
# → Markdown形式で内容表示
```

### 過去の提案内容を参考にした新規調査
1. `npx tsx notion-cli.ts search "クライアント提案"`
2. 関連ページの内容を確認
3. 既存API連携で新規ページ作成（従来通り）

### ワークスペース全体の構造確認
```bash
npx tsx notion-cli.ts root-children
# → トップレベルページ一覧

npx tsx notion-cli.ts children <子ページID>
# → さらに詳細階層確認
```

## 🎯 今後の拡張案

- **自動要約機能**: 長いページ内容をAIで要約
- **関連ページ推薦**: 検索結果から関連度の高いページ提示
- **定期同期**: 重要ページの変更を定期監視

---

**📝 Notion読み取り環境完成！**
これで「あのページ見て」「前回の資料確認して」みたいな指示に対応できます〜✨

## ⚠️ 現在の状況

**API認証エラー** により実際のNotionアクセスは未完了です。
以下を確認後、実運用開始予定：

1. TOOLS.mdのAPI Secretが最新か確認
2. NotionのIntegration設定確認  
3. ワークスペースへのアクセス権限確認

**デモ機能は正常動作中** - 基本的な仕組みは完成済みです！