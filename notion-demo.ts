#!/usr/bin/env npx tsx

// API接続なしでNotion Reader の基本機能をデモ

interface MockPage {
  id: string;
  title: string;
  content: string;
  children: MockPage[];
}

const mockWorkspace: MockPage = {
  id: '30a4351de9468003a586fecc31127c90',
  title: 'Workspace',
  content: `# Workspace

愛ちゃん専用のワークスペースへようこそ！

## 📊 プロジェクト進行中
- DX戦略プロジェクト
- クライアント提案準備
- 技術調査案件

## 🔍 最近の活動
最新の調査結果や提案内容をこちらで管理しています。`,
  children: [
    {
      id: '1001',
      title: 'DX Strategy',
      content: `# DX Strategy

## 現状分析
- レガシーシステムの課題
- デジタル化の進捗状況
- 競合他社との比較

## 提案内容
1. **クラウドマイグレーション**
   - AWS基盤への移行
   - コスト30%削減見込み
   
2. **業務プロセス改善**
   - 自動化ツール導入
   - 作業効率向上

## 実装スケジュール
- Phase 1: 基盤構築（3ヶ月）
- Phase 2: アプリ移行（6ヶ月）
- Phase 3: 最適化（3ヶ月）`,
      children: []
    },
    {
      id: '1002',
      title: 'Client Proposals',
      content: `# Client Proposals

## A社向け提案
- **案件**: Webシステム刷新
- **予算**: 800万円
- **期間**: 6ヶ月

## B社向け提案
- **案件**: DX推進支援
- **予算**: 1200万円
- **期間**: 12ヶ月

## 提案状況
- A社: 最終調整中（成約率80%）
- B社: 初回提案完了（成約率60%）`,
      children: []
    },
    {
      id: '1003',
      title: 'Technical Research',
      content: `# Technical Research

## 最新技術調査

### AI・機械学習
- GPT-4 API活用事例
- 自動化ツール比較
- ROI分析結果

### インフラ技術
- Kubernetes vs Docker Swarm
- マイクロサービス設計
- セキュリティベストプラクティス

### 開発ツール
- GitHub Copilot効果測定
- CI/CDパイプライン改善
- テスト自動化戦略`,
      children: []
    }
  ]
};

class NotionDemo {
  private workspace: MockPage;

  constructor() {
    this.workspace = mockWorkspace;
  }

  async getPageInfo(pageId: string): Promise<void> {
    const page = this.findPage(pageId);
    if (!page) {
      console.log('❌ ページが見つかりません');
      return;
    }

    console.log('✅ ページ情報:');
    console.log(`タイトル: ${page.title}`);
    console.log(`URL: https://www.notion.so/${pageId.replace(/-/g, '')}`);
    console.log(`子ページ数: ${page.children.length}件`);
  }

  async getChildPages(pageId: string): Promise<void> {
    const page = this.findPage(pageId);
    if (!page) {
      console.log('❌ ページが見つかりません');
      return;
    }

    console.log(`✅ 子ページ: ${page.children.length}件`);
    
    for (const child of page.children) {
      console.log(`- ${child.title} (${child.id})`);
      console.log(`  https://www.notion.so/${child.id.replace(/-/g, '')}`);
    }
  }

  async getPageAsMarkdown(pageId: string): Promise<void> {
    const page = this.findPage(pageId);
    if (!page) {
      console.log('❌ ページが見つかりません');
      return;
    }

    console.log('✅ Markdown内容:');
    console.log('---');
    console.log(page.content);
    console.log('---');
  }

  async searchWorkspace(query: string): Promise<void> {
    console.log(`🔍 検索中... "${query}"`);
    
    const results = this.searchInWorkspace(query);
    
    console.log(`✅ 検索結果: ${results.length}件`);
    
    for (const result of results) {
      console.log(`- ${result.title} (${result.id})`);
      console.log(`  マッチ内容: ${this.getMatchingContent(result, query)}`);
    }
  }

  private findPage(pageId: string): MockPage | null {
    if (this.workspace.id === pageId) return this.workspace;
    
    for (const child of this.workspace.children) {
      if (child.id === pageId) return child;
    }
    
    return null;
  }

  private searchInWorkspace(query: string): MockPage[] {
    const results: MockPage[] = [];
    const searchTerm = query.toLowerCase();

    // ルートページ検索
    if (this.workspace.title.toLowerCase().includes(searchTerm) || 
        this.workspace.content.toLowerCase().includes(searchTerm)) {
      results.push(this.workspace);
    }

    // 子ページ検索
    for (const child of this.workspace.children) {
      if (child.title.toLowerCase().includes(searchTerm) || 
          child.content.toLowerCase().includes(searchTerm)) {
        results.push(child);
      }
    }

    return results;
  }

  private getMatchingContent(page: MockPage, query: string): string {
    const lines = page.content.split('\n');
    const searchTerm = query.toLowerCase();
    
    for (const line of lines) {
      if (line.toLowerCase().includes(searchTerm)) {
        return line.trim().substring(0, 100) + '...';
      }
    }
    
    return page.title;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const demo = new NotionDemo();

  console.log('🎭 Notion Reader デモモード');
  console.log('（実際のAPI接続なしで機能確認）\n');

  switch (command) {
    case 'info':
      await demo.getPageInfo(args[1] || '30a4351de9468003a586fecc31127c90');
      break;

    case 'children':
      await demo.getChildPages(args[1] || '30a4351de9468003a586fecc31127c90');
      break;

    case 'markdown':
      await demo.getPageAsMarkdown(args[1] || '1001');
      break;

    case 'search':
      await demo.searchWorkspace(args[1] || 'DX');
      break;

    default:
      console.log(`
📝 Notion Reader デモ

使用方法:
  npx tsx notion-demo.ts <command> [options]

コマンド:
  info [PAGE_ID]       ページ情報表示
  children [PAGE_ID]   子ページ一覧表示  
  markdown [PAGE_ID]   Markdown表示
  search <QUERY>       ワークスペース検索

例:
  npx tsx notion-demo.ts children
  npx tsx notion-demo.ts search "DX戦略"
  npx tsx notion-demo.ts markdown 1001
      `);
      break;
  }
}

main().catch(console.error);