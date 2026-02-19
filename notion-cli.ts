#!/usr/bin/env npx tsx

import { NotionReader } from './notion-reader';
import * as fs from 'fs';
import * as path from 'path';

// 設定取得（機密情報は直接書かない）
function getNotionConfig() {
  const toolsPath = path.join(__dirname, 'TOOLS.md');
  
  try {
    const toolsContent = fs.readFileSync(toolsPath, 'utf-8');
    const apiSecretMatch = toolsContent.match(/API Secret:\s*([^\s\n]+)/);
    const rootPageMatch = toolsContent.match(/親ページID:\s*([^\s\n]+)/);
    
    if (!apiSecretMatch) {
      throw new Error('TOOLS.mdからNotionのAPI Secretが見つかりません');
    }
    
    return {
      apiKey: apiSecretMatch[1],
      rootPageId: rootPageMatch?.[1],
    };
  } catch (error) {
    console.error('設定取得エラー:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const config = getNotionConfig();
  const reader = new NotionReader(config);

  switch (command) {
    case 'get':
      if (!args[1]) {
        console.error('❌ ページIDを指定してください: notion-cli.ts get <PAGE_ID>');
        process.exit(1);
      }
      await getPageCommand(reader, args[1]);
      break;

    case 'search':
      if (!args[1]) {
        console.error('❌ 検索クエリを指定してください: notion-cli.ts search <QUERY>');
        process.exit(1);
      }
      await searchCommand(reader, args[1]);
      break;

    case 'children':
      if (!args[1]) {
        console.error('❌ ページIDを指定してください: notion-cli.ts children <PAGE_ID>');
        process.exit(1);
      }
      await childrenCommand(reader, args[1]);
      break;

    case 'root':
      if (!config.rootPageId) {
        console.error('❌ TOOLS.mdに親ページIDが設定されていません');
        process.exit(1);
      }
      await getPageCommand(reader, config.rootPageId);
      break;

    case 'root-children':
      if (!config.rootPageId) {
        console.error('❌ TOOLS.mdに親ページIDが設定されていません');
        process.exit(1);
      }
      await childrenCommand(reader, config.rootPageId);
      break;

    case 'markdown':
      if (!args[1]) {
        console.error('❌ ページIDを指定してください: notion-cli.ts markdown <PAGE_ID> [OUTPUT_FILE]');
        process.exit(1);
      }
      await markdownCommand(reader, args[1], args[2]);
      break;

    case 'help':
    default:
      console.log(`
📝 Notion Reader CLI for 愛ちゃん

使用方法:
  npx tsx notion-cli.ts <command> [options]

コマンド:
  get <PAGE_ID>         指定ページの詳細情報取得
  search <QUERY>        ワークスペース全体検索
  children <PAGE_ID>    子ページ一覧取得
  root                  ルートページの詳細情報取得
  root-children         ルートページの子ページ一覧取得
  markdown <PAGE_ID>    ページをMarkdown形式で取得
  help                  このヘルプ表示

例:
  npx tsx notion-cli.ts root-children
  npx tsx notion-cli.ts search "DX戦略"
  npx tsx notion-cli.ts get 30a4351de9468003a586fecc31127c90
  npx tsx notion-cli.ts markdown 30a4351de9468003a586fecc31127c90 output.md
      `);
      break;
  }
}

async function getPageCommand(reader: NotionReader, pageId: string) {
  console.log(`📄 ページ情報取得中... (${pageId})`);
  
  const title = await reader.getPageTitle(pageId);
  const page = await reader.getPage(pageId);
  
  if (!page) {
    console.log('❌ ページが見つかりません');
    return;
  }
  
  console.log('✅ ページ情報:');
  console.log(`タイトル: ${title}`);
  console.log(`URL: https://www.notion.so/${pageId.replace(/-/g, '')}`);
  console.log(`作成日時: ${page.created_time}`);
  console.log(`更新日時: ${page.last_edited_time}`);
}

async function searchCommand(reader: NotionReader, query: string) {
  console.log(`🔍 検索中... "${query}"`);
  
  const results = await reader.searchWorkspace(query);
  
  console.log('✅ 検索結果:');
  console.log(`ページ: ${results.pages.length}件`);
  console.log(`データベース: ${results.databases.length}件`);
  
  if (results.pages.length > 0) {
    console.log('\n📄 ページ:');
    for (const page of results.pages.slice(0, 5)) {
      const title = await reader.getPageTitle(page.id);
      console.log(`- ${title} (${page.id})`);
      console.log(`  https://www.notion.so/${page.id.replace(/-/g, '')}`);
    }
  }
  
  if (results.databases.length > 0) {
    console.log('\n🗂️ データベース:');
    for (const db of results.databases.slice(0, 5)) {
      console.log(`- ${db.id}`);
    }
  }
}

async function childrenCommand(reader: NotionReader, pageId: string) {
  console.log(`👶 子ページ一覧取得中... (${pageId})`);
  
  const children = await reader.getChildPages(pageId);
  
  console.log(`✅ 子ページ: ${children.length}件`);
  
  for (const child of children) {
    console.log(`- ${child.title} (${child.id})`);
    console.log(`  ${child.url}`);
  }
}

async function markdownCommand(reader: NotionReader, pageId: string, outputFile?: string) {
  console.log(`📝 Markdown変換中... (${pageId})`);
  
  const markdown = await reader.getPageAsMarkdown(pageId);
  
  if (outputFile) {
    fs.writeFileSync(outputFile, markdown);
    console.log(`✅ Markdownファイル保存: ${outputFile}`);
  } else {
    console.log('✅ Markdown内容:');
    console.log('---');
    console.log(markdown);
    console.log('---');
  }
}

main().catch(console.error);