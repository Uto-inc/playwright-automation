#!/usr/bin/env npx tsx

import { NotionReaderV2 } from './notion-reader-v2';
import { getSecureNotionConfig, createEnvTemplate } from './notion-config';
import * as fs from 'fs';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'setup':
        await setupCommand();
        break;

      case 'get':
        if (!args[1]) {
          console.error('❌ ページIDを指定してください: notion-cli-v2.ts get <PAGE_ID>');
          process.exit(1);
        }
        await getPageCommand(args[1]);
        break;

      case 'search':
        if (!args[1]) {
          console.error('❌ 検索クエリを指定してください: notion-cli-v2.ts search <QUERY>');
          process.exit(1);
        }
        await searchCommand(args[1]);
        break;

      case 'children':
        if (!args[1]) {
          console.error('❌ ページIDを指定してください: notion-cli-v2.ts children <PAGE_ID>');
          process.exit(1);
        }
        await childrenCommand(args[1]);
        break;

      case 'root':
        await rootCommand();
        break;

      case 'root-children':
        await rootChildrenCommand();
        break;

      case 'markdown':
        if (!args[1]) {
          console.error('❌ ページIDを指定してください: notion-cli-v2.ts markdown <PAGE_ID> [OUTPUT_FILE]');
          process.exit(1);
        }
        await markdownCommand(args[1], args[2]);
        break;

      case 'test':
        await testCommand();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(`❌ コマンド実行エラー: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function setupCommand() {
  console.log('🔧 Notion Reader セットアップ');
  createEnvTemplate();
  
  console.log('\n📝 次のステップ:');
  console.log('1. .env ファイルを作成してAPI keyを設定');
  console.log('2. npx tsx notion-cli-v2.ts test で接続確認');
}

async function getPageCommand(pageId: string) {
  console.log(`📄 ページ情報取得中... (${pageId})`);
  
  const { reader } = await createReader();
  const page = await reader.getPage(pageId);
  const title = await reader.getPageTitle(pageId);
  
  console.log('✅ ページ情報:');
  console.log(`タイトル: ${title}`);
  console.log(`URL: https://www.notion.so/${pageId.replace(/-/g, '')}`);
  console.log(`作成日時: ${page.created_time}`);
  console.log(`更新日時: ${page.last_edited_time}`);
}

async function searchCommand(query: string) {
  console.log(`🔍 検索中... "${query}"`);
  
  const { reader } = await createReader();
  const results = await reader.searchAllWorkspace(query);
  
  console.log('✅ 検索結果:');
  console.log(`ページ: ${results.pages.length}件`);
  console.log(`データベース: ${results.databases.length}件`);
  
  if (results.pages.length > 0) {
    console.log('\n📄 ページ:');
    // N+1問題を回避：レスポンスオブジェクトから直接タイトルを取得
    for (const page of results.pages.slice(0, 10)) {
      const title = extractTitleFromSearchResult(page) || page.id;
      console.log(`- ${title} (${page.id})`);
      console.log(`  https://www.notion.so/${page.id.replace(/-/g, '')}`);
    }
    
    if (results.pages.length > 10) {
      console.log(`  ... 他 ${results.pages.length - 10} 件`);
    }
  }
  
  if (results.databases.length > 0) {
    console.log('\n🗂️ データベース:');
    for (const db of results.databases.slice(0, 5)) {
      const title = extractTitleFromSearchResult(db) || db.id;
      console.log(`- ${title} (${db.id})`);
    }
    
    if (results.databases.length > 5) {
      console.log(`  ... 他 ${results.databases.length - 5} 件`);
    }
  }
}

function extractTitleFromSearchResult(result: any): string {
  // 検索結果オブジェクトから直接タイトルを抽出（N+1回避）
  if (result.properties) {
    for (const [key, value] of Object.entries(result.properties)) {
      if ((value as any).type === 'title' && 'title' in (value as any)) {
        return (value as any).title.map((t: any) => t.plain_text).join('');
      }
    }
  }
  
  // フォールバック
  if (result.title && Array.isArray(result.title)) {
    return result.title.map((t: any) => t.plain_text || t.text?.content || '').join('');
  }
  
  return '';
}

async function childrenCommand(pageId: string) {
  console.log(`👶 子ページ一覧取得中... (${pageId})`);
  
  const { reader } = await createReader();
  const children = await reader.getAllChildPages(pageId);
  
  console.log(`✅ 子ページ: ${children.length}件`);
  
  for (const child of children) {
    console.log(`- ${child.title} (${child.id})`);
    console.log(`  ${child.url}`);
  }
}

async function rootCommand() {
  const { config } = await createReader();
  
  if (!config.rootPageId) {
    console.error('❌ ルートページIDが設定されていません');
    console.log('💡 解決方法: NOTION_ROOT_PAGE_ID環境変数を設定してください');
    process.exit(1);
  }
  
  await getPageCommand(config.rootPageId);
}

async function rootChildrenCommand() {
  const { config } = await createReader();
  
  if (!config.rootPageId) {
    console.error('❌ ルートページIDが設定されていません');
    console.log('💡 解決方法: NOTION_ROOT_PAGE_ID環境変数を設定してください');
    process.exit(1);
  }
  
  await childrenCommand(config.rootPageId);
}

async function markdownCommand(pageId: string, outputFile?: string) {
  console.log(`📝 Markdown変換中... (${pageId})`);
  
  const { reader } = await createReader();
  const markdown = await reader.getPageAsMarkdown(pageId);
  
  if (outputFile) {
    fs.writeFileSync(outputFile, markdown);
    console.log(`✅ Markdownファイル保存: ${outputFile}`);
    console.log(`📊 ファイルサイズ: ${Math.round(markdown.length / 1024 * 100) / 100} KB`);
  } else {
    console.log('✅ Markdown内容:');
    console.log('---');
    console.log(markdown.substring(0, 2000)); // 長すぎる場合は切り詰め
    if (markdown.length > 2000) {
      console.log(`\n... (切り詰め表示: 残り ${markdown.length - 2000} 文字)`);
    }
    console.log('---');
  }
}

async function testCommand() {
  console.log('🧪 接続テスト実行中...');
  
  try {
    const { reader, source, warnings } = await createReader();
    
    console.log(`✅ 設定読み込み成功 (${source})`);
    
    if (warnings.length > 0) {
      console.log('⚠️ 警告:');
      warnings.forEach(w => console.log(`  ${w}`));
    }
    
    // 軽量なAPI呼び出しでテスト
    const results = await reader.searchAllWorkspace('test');
    console.log(`✅ API接続成功 (検索結果: ${results.pages.length + results.databases.length}件)`);
    
    console.log('\n🎉 セットアップ完了！利用可能なコマンド:');
    console.log('- npx tsx notion-cli-v2.ts search "検索クエリ"');
    console.log('- npx tsx notion-cli-v2.ts root-children');
    console.log('- npx tsx notion-cli-v2.ts markdown <PAGE_ID>');
    
  } catch (error) {
    console.log(`❌ 接続テスト失敗: ${error instanceof Error ? error.message : String(error)}`);
    console.log('\n🔧 トラブルシューティング:');
    console.log('1. npx tsx notion-cli-v2.ts setup で環境設定');
    console.log('2. .env ファイルでNOTION_API_KEYを確認');
    console.log('3. NotionでIntegrationの権限を確認');
    process.exit(1);
  }
}

async function createReader(): Promise<{
  reader: NotionReaderV2;
  config: any;
  source: string;
  warnings: string[];
}> {
  const result = getSecureNotionConfig();
  
  const reader = new NotionReaderV2(result.config, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
  });
  
  // 警告を表示（初回のみ）
  if (result.warnings.length > 0 && !process.env.NOTION_WARNINGS_SHOWN) {
    console.log('⚠️ 設定警告:');
    result.warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
    process.env.NOTION_WARNINGS_SHOWN = 'true';
  }
  
  return {
    reader,
    config: result.config,
    source: result.source,
    warnings: result.warnings,
  };
}

function showHelp() {
  console.log(`
📝 Notion Reader CLI v2 for 愛ちゃん (セキュア版)

使用方法:
  npx tsx notion-cli-v2.ts <command> [options]

セットアップ:
  setup                 環境設定ガイド＆.envテンプレート作成
  test                  API接続テスト

コマンド:
  get <PAGE_ID>         指定ページの詳細情報取得
  search <QUERY>        ワークスペース全体検索（ページネーション対応）
  children <PAGE_ID>    子ページ一覧取得（全件対応）
  root                  ルートページの詳細情報取得
  root-children         ルートページの子ページ一覧取得
  markdown <PAGE_ID>    ページをMarkdown形式で取得
  help                  このヘルプ表示

セキュリティ改善:
  - 環境変数でAPI Key管理（NOTION_API_KEY）
  - リトライ機構付き（429/5xx対応）
  - ページネーション完全対応
  - 詳細エラー情報

例:
  npx tsx notion-cli-v2.ts setup
  npx tsx notion-cli-v2.ts test
  npx tsx notion-cli-v2.ts root-children
  npx tsx notion-cli-v2.ts search "DX戦略"
  npx tsx notion-cli-v2.ts markdown <PAGE_ID> output.md
      `);
}

main().catch(console.error);