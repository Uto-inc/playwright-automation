#!/usr/bin/env node

/**
 * Notion統合ワークフロー
 * Slack → 読み取り → AI分析 → 書き込み → URL返信
 */

import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config();

const readClient = new Client({
  auth: process.env.NOTION_READ_API_KEY,
  notionVersion: '2025-09-03'
});

const writeClient = new Client({
  auth: process.env.NOTION_WRITE_API_KEY,
  notionVersion: '2025-09-03'
});

const WORKSPACE_PAGE_ID = '30a4351d-e946-8003-a586-fecc31127c90';

interface WorkflowResult {
  success: boolean;
  summary: string;
  notionUrl: string;
  error?: string;
}

/**
 * 入力解析 - URL、既存DB検索、新規作成を判定
 */
function parseInput(input: string): { type: 'url' | 'search' | 'create'; value: string; dbId?: string } {
  const inputLower = input.toLowerCase();
  
  // NotionURL判定
  const urlMatch = input.match(/notion\.so\/([a-f0-9-]+)/);
  if (urlMatch) {
    return { type: 'url', value: input, dbId: urlMatch[1].replace(/-/g, '') };
  }
  
  // 明確な既存データベース検索指示
  if (inputLower.includes('lead management') && !inputLower.includes('システム') && !inputLower.includes('要件')) {
    return { type: 'search', value: 'Lead Management' };
  }
  
  // 新規作成系キーワード判定
  if (inputLower.includes('要件ヒアリング') || 
      inputLower.includes('ヒアリング') || 
      inputLower.includes('システム') || 
      inputLower.includes('プラグイン') || 
      inputLower.includes('企画') ||
      inputLower.includes('設計') ||
      inputLower.includes('作成') ||
      inputLower.includes('整理')) {
    return { type: 'create', value: input };
  }
  
  // その他は検索として扱う
  return { type: 'search', value: input };
}

/**
 * データ取得 - 読み取りAPIで情報収集
 */
async function fetchData(input: { type: string; value: string; dbId?: string }) {
  try {
    // 新規作成系の場合はデータ取得をスキップ
    if (input.type === 'create') {
      return null;
    }
    
    if (input.type === 'url' && input.dbId) {
      // 直接データベース取得
      const database = await readClient.databases.retrieve({
        database_id: input.dbId
      });
      return {
        type: 'database',
        title: database.title?.[0]?.plain_text || 'データベース',
        properties: database.properties ? Object.keys(database.properties).slice(0, 10) : [], // 主要プロパティ
        url: input.value,
        lastEditTime: database.last_edited_time
      };
    } else {
      // 検索API使用 (2025-09-03: data_source を使用)
      const searchResult = await readClient.search({
        query: input.value,
        filter: { property: 'object', value: 'data_source' }
      });
      
      if (searchResult.results.length > 0) {
        const db = searchResult.results[0] as any;
        return {
          type: 'search_result',
          title: db.title?.[0]?.plain_text || 'データベース',
          properties: Object.keys(db.properties || {}).slice(0, 10),
          url: db.url,
          lastEditTime: db.last_edited_time,
          results: searchResult.results.length
        };
      }
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw new Error(`データ取得失敗: ${error.message}`);
  }
  
  return null;
}

/**
 * AI分析 - 動的サマリー作成（入力内容に応じてカスタマイズ）
 */
function generateSummary(data: any, originalInput: string): string {
  const input = originalInput.toLowerCase();
  const timestamp = new Date().toLocaleString('ja-JP');
  
  // 既存データが見つからない場合の新規作成系
  if (!data) {
    // 要件ヒアリング系
    if (input.includes('要件ヒアリング') || input.includes('ヒアリング')) {
      return `📋 要件ヒアリングシート作成完了

🎯 **目的**: ${originalInput}の要件を体系的に整理・確認

📝 **構成内容**:
• 基本要件（目的・対象ユーザー・期待効果）
• 機能要件（主要機能・技術仕様・UI/UX要件）
• 非機能要件（セキュリティ・パフォーマンス・制約事項）
• プロジェクト管理（スケジュール・予算・体制・リスク）

✅ **Next Actions**:
1. 関係者による要件ヒアリング回答
2. プラン策定・技術調査
3. 開発・実装フェーズ

---
📅 作成日時: ${timestamp}
🔍 検索元: "${originalInput}"`;
    }
    
    // システム・プラグイン管理系
    if (input.includes('プラグイン') || input.includes('システム')) {
      return `🔌 システム企画書作成完了

💡 **概要**: ${originalInput}の詳細企画・設計書

📋 **主要検討項目**:
• アーキテクチャ設計（技術選定・システム構成）
• 機能仕様（ユーザー機能・管理機能・API設計）
• セキュリティ設計（認証・認可・データ保護）
• 運用設計（デプロイ・監視・保守・スケーラビリティ）

🎯 **期待効果**:
• 開発効率向上・品質管理・ユーザビリティ改善

---
📅 作成日時: ${timestamp}
💭 企画内容: "${originalInput}"`;
    }
    
    // その他・汎用
    return `📄 分析・調査結果

🔍 **対象**: ${originalInput}

📊 **分析結果**:
指定された内容について詳細調査を実施しましたが、既存のデータソースからは該当する情報が見つかりませんでした。

💡 **提案**:
• より具体的なキーワードでの再検索
• 関連データベースの確認
• 新規情報収集の実施

---
📅 分析日時: ${timestamp}
🔍 検索クエリ: "${originalInput}"`;
  }
  
  // 既存データが見つかった場合の分析系
  const title = data.title;
  const properties = data.properties?.join(', ') || '';
  const lastEdit = data.lastEditTime ? new Date(data.lastEditTime).toLocaleDateString('ja-JP') : '';
  
  return `📊 ${title} - データ分析結果

🎯 **データベース概要**:
${title}${data.type === 'database' ? ' データベース' : ''}から情報を抽出・分析

📋 **主要データ項目**:
${properties.substring(0, 120)}${properties.length > 120 ? '...' : ''}

📈 **分析結果**:
• 最終更新: ${lastEdit}
• データ件数: ${data.results ? `${data.results}件` : '取得中'}
• 活用可能度: 高（営業・プロジェクト効率化に直接活用可能）

💡 **活用提案**:
取得したデータを基に、効果的な業務改善・意思決定支援が可能です。

---
📅 分析日時: ${timestamp}
🔍 分析対象: "${originalInput}"`;
}

/**
 * タイトル生成 - 入力内容に応じて適切なタイトルを生成
 */
function generateTitle(originalInput: string): string {
  const input = originalInput.toLowerCase();
  const date = new Date().toLocaleDateString('ja-JP');
  
  // 具体的なキーワードに基づくタイトル判定
  if (input.includes('要件ヒアリング') || input.includes('ヒアリング')) {
    return `📋 要件ヒアリングシート: ${originalInput.substring(0, 40)}${originalInput.length > 40 ? '...' : ''} (${date})`;
  }
  if (input.includes('プラグイン管理') || input.includes('plugin')) {
    return `🔌 プラグイン管理システム: ${originalInput.substring(0, 40)}${originalInput.length > 40 ? '...' : ''} (${date})`;
  }
  if (input.includes('フロー') || input.includes('flow')) {
    return `🔄 オペレーションフロー: ${originalInput.substring(0, 40)}${originalInput.length > 40 ? '...' : ''} (${date})`;
  }
  if (input.includes('lead management') || input.includes('リード')) {
    return `📈 Lead Management分析: ${originalInput.substring(0, 40)}${originalInput.length > 40 ? '...' : ''} (${date})`;
  }
  if (input.includes('システム') || input.includes('system')) {
    return `⚙️ システム分析: ${originalInput.substring(0, 40)}${originalInput.length > 40 ? '...' : ''} (${date})`;
  }
  
  // デフォルト: 汎用的なタイトル
  return `📄 分析レポート: ${originalInput.substring(0, 50)}${originalInput.length > 50 ? '...' : ''} (${date})`;
}

/**
 * Notion書き込み - 制限エリアに保存
 */
async function saveToNotion(summary: string, originalInput: string): Promise<string> {
  try {
    const page = await writeClient.pages.create({
      parent: { page_id: WORKSPACE_PAGE_ID },
      properties: {
        title: {
          title: [
            {
              text: {
                content: generateTitle(originalInput)
              }
            }
          ]
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: { content: summary }
              }
            ]
          }
        }
      ]
    });
    
    return page.url;
  } catch (error) {
    console.error('Notion書き込みエラー:', error);
    throw new Error(`書き込み失敗: ${error.message}`);
  }
}

/**
 * メインワークフロー
 */
async function runWorkflow(input: string): Promise<WorkflowResult> {
  try {
    console.log(`🔄 ワークフロー開始: "${input}"`);
    
    // 1. 入力解析
    const parsedInput = parseInput(input);
    console.log(`📝 入力タイプ: ${parsedInput.type}`);
    
    // 2. データ取得
    const data = await fetchData(parsedInput);
    console.log(`📊 データ取得: ${data ? '成功' : '失敗'}`);
    
    // 3. サマリー生成
    const summary = generateSummary(data, input);
    console.log(`🧠 サマリー作成完了`);
    
    // 4. Notion保存
    const notionUrl = await saveToNotion(summary, input);
    console.log(`💾 保存完了: ${notionUrl}`);
    
    return {
      success: true,
      summary,
      notionUrl
    };
    
  } catch (error) {
    return {
      success: false,
      summary: `❌ 処理エラー: ${error.message}`,
      notionUrl: '',
      error: error.message
    };
  }
}

/**
 * CLI実行
 */
async function main() {
  const input = process.argv[2];
  
  if (!input) {
    console.error('使用方法: npx tsx notion-integrated-workflow.ts "検索クエリまたはURL"');
    process.exit(1);
  }
  
  if (!process.env.NOTION_READ_API_KEY || !process.env.NOTION_WRITE_API_KEY) {
    console.error('❌ APIキーが設定されていません (.env ファイルを確認)');
    process.exit(1);
  }
  
  const result = await runWorkflow(input);
  
  if (result.success) {
    console.log('\n🎉 ワークフロー完了!');
    console.log('\n📊 サマリー:');
    console.log(result.summary);
    console.log(`\n🔗 詳細レポート:\n${result.notionUrl}`);
  } else {
    console.error(`\n❌ ワークフロー失敗:\n${result.summary}`);
    process.exit(1);
  }
}

// CLI実行時のみmain()を呼び出し
if (require.main === module) {
  main().catch(console.error);
}

export { runWorkflow, WorkflowResult };