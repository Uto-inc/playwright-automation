# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### Notion - 双方向連携

#### **2段階セキュリティ設計**
- **読み取り用APIキー**: Uto inc HQ全体アクセス（検索・参照）
- **書き込み用APIキー**: 小島あい作業Workspace限定（セキュア出力）
- **親ページID:** 30a4351de9468003a586fecc31127c90
- **親ページURL:** https://www.notion.so/Workspace-30a4351de9468003a586fecc31127c90

#### **⚠️ 重要：1依頼1ページルール**
- **絶対守る**: 1つの依頼には1つの最終成果物ページのみ作成
- **中間成果物は作らない**: 試行錯誤の過程で複数ページを作成しない
- **更新方式**: 同じページを更新するか、最初から最終版を作成する
- **親階層整理**: 依頼完了後は不要な中間ページを必ず削除

#### **ワークフロー:**
1. Slack入力（URL/自然言語/検索クエリ） 
2. 読み取りAPI → HQ全体から情報収集
3. AI分析 → サマリー・レポート作成  
4. **🚨 1ページのみ作成** → 制限エリアに保存
5. Slack返信 → サマリー + NotionページURL（1つだけ）

#### **入力（新設）- V2改善版**
- **Notion Reader V2:** セキュア・高性能版読み取り機能
- **CLIツール:** `npx tsx notion-cli-v2.ts`
- **改善点:** 環境変数管理・ページネーション・リトライ機構
- **用途:** 過去の資料確認・ワークスペース検索・大量データ対応

#### セキュリティ設定:
```bash
# 推奨: 環境変数管理
export NOTION_API_KEY=your_key_here
export NOTION_ROOT_PAGE_ID=your_page_id_here

# または .env ファイル作成
npx tsx notion-cli-v2.ts setup
```

#### 使い分け:
- **「あのページ見て」** → Notion Reader V2（読み取り・セキュア）
- **「調査結果まとめて」** → 既存API（書き込み・維持）

### Google Drive - 愛ちゃん専用Workspace

- **Root Folder**: https://drive.google.com/drive/folders/1YNtC6JP6-71kzh5MssGpMysJcXeJfbp8
- **Account**: ai_kojima@uto-inc.com
- **権限**: チーム全体で共有済み

#### フォルダ構造:
```
📁 愛ちゃん専用Workspace (1YNtC6JP6-71kzh5MssGpMysJcXeJfbp8)
├── 📊 Presentations (1LUBmWrdQlVLeoSQW4plY1ZvCTTyCJJyX)
│   ├── DX Strategy (1KcUrteudBTRbwFzdgK6VTZww4moZoXt4)
│   ├── Product Development (1r7FcIUrYnuz7TW60YKsCJwQR_oa29tqo)  
│   ├── Client Proposals (1B5eOErRXfq3mNSwNmrYtcOJlHj8OKRdx)
│   └── Technical Research (1NSo1rISUezzRr1n6ZlmMrKgMyipK5v8s)
├── 📝 Documents (1I-72susk__g6r0BP4H3RYc6G55fRn6Wm)
├── 🔍 Research (1lv-sJwKGSbheYQWDnxOFFr2-M7ZRNWHe)
├── 📊 Data & Analysis (1OcjOmKrOxRdKFSreKnhrWa3-hVr9rEx3)
└── 🗃️ Archives (1UUt4QefkdTUkqT9rna7cVaZw4TVPGIGq)
```

#### 使用例:
- DX戦略スライド → `/Presentations/DX Strategy/`
- クライアント提案 → `/Presentations/Client Proposals/`
- 技術調査資料 → `/Presentations/Technical Research/`
- 調査データ → `/Research/`

### GitHub - UTO Inc. Organization

- **Organization**: `Uto-inc` 
- **権限**: リポジトリ作成・プッシュ可能
- **推奨作成コマンド**: `gh repo create Uto-inc/REPO_NAME --public --source=. --remote=origin --push --description "DESCRIPTION"`
- **注意**: 個人アカウント（ai-kojima-uto）ではなく、必ずOrganization配下に作成する

### システム開発ワークフロー（🚨必須）

#### 🎯 標準5ステップ（絶対に守る）

**社長指示**: システム作成依頼があったら必ずこの順序で進める

1. **📝 要件ヒアリング** - 目的、機能、制約、納期、技術要件を明確化
   - 何を作るのか？（目的・ゴール）
   - 誰が使うのか？（ターゲット・ペルソナ）
   - どんな機能が必要？（Must have / Nice to have）
   - いつまでに？（スケジュール・マイルストーン）
   - 技術制約は？（環境・既存システム連携）

2. **🗺️ プラン策定** - 設計・技術選定・実装手順を決定
   - システム全体設計
   - 技術スタック選定（Vite + React + Tailwind推奨）
   - 実装フェーズ分け
   - リスク分析
   - 成功基準定義

3. **⚙️ Claude Code実装** - 環境構築→開発→テスト
   - 技術環境セットアップ
   - コンポーネント・機能実装
   - 基本動作確認

4. **📋 Codexクロスバリデーション** - 品質保証（必須！）
   ```bash
   codex exec --full-auto 'クロスバリデーション: [アプリ概要]のコード品質レビュー
   - セキュリティ: XSS、インジェクション対策
   - パフォーマンス: React最適化、メモリリーク
   - ベストプラクティス: コンポーネント設計、state管理
   - アクセシビリティ: ARIA、keyboard navigation
   - TypeScript移行推奨事項
   - テスト推奨構成
   完了後: openclaw system event --text "Done: Codexクロスバリデーション完了" --mode now'
   ```

5. **🐙 GitHub配信** - Uto-inc Organization に公開・共有

#### ⚠️ 忘れやすいポイント
- **Codexレビューは必須** - セキュリティ・アクセシビリティのチェック
- **GitHub Organization** - `Uto-inc/REPO_NAME` 形式で作成
- **PostCSS設定** - Tailwind使用時は `postcss.config.js` が必要

### 🚀 愛ちゃん専門エージェント軍団（2024年2月配備）

**重要**: Slack開発案件では必ず以下を活用！

#### **Claude専門エージェント** (~/.claude/agents/)
- **🏗️ architect** - システム設計・Docker構成最適化
- **📋 planner** - 詳細実装プラン・リスク分析  
- **🔍 code-reviewer** - 品質・保守性・A評価レベル判定
- **🔒 security-reviewer** - 脆弱性0・セキュリティスコア95+

#### **高速コマンド** (~/.claude/commands/)
```bash
claude /plan "タスク詳細"           # 実装プラン作成
claude /code-review --latest       # 多角的品質レビュー
```

#### **品質保証システム** (~/.claude/rules/)
- **security.md** - 機密情報・SQLi・XSS対策必須
- **testing.md** - TDD・80%カバレッジ強制

#### **自動監視Hook** (~/.claude/settings.json)
- セキュリティスキャン（リアルタイム）
- テストファイル作成リマインダー
- console.log本番環境警告

**everything-claude-code準拠**: ハッカソン優勝者レベルの開発システム🏆

### 🎭 Playwright - ブラウザ自動化

- **環境**: `@playwright/test` + Chromiumヘッドレス
- **リポジトリ**: https://github.com/Uto-inc/playwright-automation
- **用途**: 自動テスト、UI操作、スクレイピング、スクリーンショット

#### 基本コマンド:
```bash
# テスト実行
npx playwright test

# スクリーンショット取得
npx tsx playwright-cli.ts screenshot <URL>

# 簡易テスト
npx tsx playwright-cli.ts quick <URL>
```

#### 既存ツールとの使い分け:
- **OpenClaw browser** → ページ閲覧・簡単操作
- **Playwright** → 複雑なテストシナリオ・自動化ワークフロー

---

Add whatever helps you do your job. This is your cheat sheet.
