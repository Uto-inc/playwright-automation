#!/usr/bin/env npx tsx

import { PlaywrightHelper, quickTest } from './playwright-helpers';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'test':
      console.log('🎭 Playwrightテスト実行...');
      const { execSync } = require('child_process');
      execSync('npx playwright test', { stdio: 'inherit' });
      break;

    case 'screenshot':
      if (!args[1]) {
        console.error('❌ URLを指定してください: playwright-cli.ts screenshot <URL>');
        process.exit(1);
      }
      console.log(`📸 ${args[1]} のスクリーンショット取得中...`);
      const result = await quickTest(args[1]);
      console.log(`✅ 完了: ${result.screenshotPath}`);
      break;

    case 'quick':
      if (!args[1]) {
        console.error('❌ URLを指定してください: playwright-cli.ts quick <URL>');
        process.exit(1);
      }
      console.log(`🚀 ${args[1]} の簡易テスト実行中...`);
      const quickResult = await quickTest(args[1]);
      console.log('📋 結果:', JSON.stringify(quickResult, null, 2));
      break;

    case 'demo':
      console.log('🎭 デモ実行中...');
      await demoAutomation();
      break;

    case 'help':
    default:
      console.log(`
🎭 Playwright CLI for 愛ちゃん

使用方法:
  npx tsx playwright-cli.ts <command> [options]

コマンド:
  test              テストファイル実行 (npx playwright test)
  screenshot <URL>  指定URLのスクリーンショット取得
  quick <URL>       指定URLの簡易テスト実行
  demo              デモ自動化実行
  help              このヘルプ表示

例:
  npx tsx playwright-cli.ts screenshot https://example.com
  npx tsx playwright-cli.ts quick https://google.com
  npx tsx playwright-cli.ts demo
      `);
      break;
  }
}

async function demoAutomation() {
  const helper = new PlaywrightHelper();
  
  try {
    console.log('🌐 ブラウザ起動中...');
    await helper.launch();

    console.log('📄 Example.comにアクセス...');
    await helper.goto('https://example.com');
    await helper.screenshot('demo-example.png');

    console.log('🔍 Googleで検索...');
    await helper.goto('https://google.com');
    await helper.fill('[name="q"]', 'Playwright automation');
    await helper.click('[name="btnK"]');
    
    // 結果ページの読み込み待ち
    await helper.waitForSelector('#search');
    await helper.screenshot('demo-google-search.png');

    console.log('✅ デモ完了！');
    console.log('📸 スクリーンショット:');
    console.log('  - demo-example.png');
    console.log('  - demo-google-search.png');

  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await helper.close();
  }
}

main().catch(console.error);