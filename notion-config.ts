import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface NotionConfig {
  apiKey: string;
  rootPageId?: string;
}

export interface NotionConfigResult {
  config: NotionConfig;
  source: 'env' | 'tools.md';
  warnings: string[];
}

/**
 * セキュアなNotion設定取得
 * 優先度: 環境変数 > TOOLS.md（フォールバック）
 */
export function getSecureNotionConfig(): NotionConfigResult {
  // .env読み込み
  dotenv.config();
  
  const warnings: string[] = [];
  
  // 1. 環境変数から取得を試行
  const envApiKey = process.env.NOTION_API_KEY;
  const envRootPageId = process.env.NOTION_ROOT_PAGE_ID;
  
  if (envApiKey) {
    // 環境変数が利用可能
    return {
      config: {
        apiKey: envApiKey,
        rootPageId: envRootPageId,
      },
      source: 'env',
      warnings: envRootPageId ? [] : ['NOTION_ROOT_PAGE_IDが設定されていません（オプション）'],
    };
  }
  
  // 2. フォールバック：TOOLS.mdから取得
  warnings.push('⚠️ セキュリティ警告: 環境変数NOTION_API_KEYが未設定、TOOLS.mdから取得します');
  
  try {
    const toolsPath = path.join(__dirname, 'TOOLS.md');
    const toolsContent = fs.readFileSync(toolsPath, 'utf-8');
    
    // [REDACTED]を除外してAPI Secretを探す
    const apiSecretMatch = toolsContent.match(/API Secret:\s*([^[\s\n]+)/);
    const rootPageMatch = toolsContent.match(/親ページID:\s*([^[\s\n]+)/);
    
    if (!apiSecretMatch || apiSecretMatch[1] === '[REDACTED]') {
      throw new Error('TOOLS.mdからNotionのAPI Secretが見つかりません（[REDACTED]以外）');
    }
    
    return {
      config: {
        apiKey: apiSecretMatch[1],
        rootPageId: rootPageMatch?.[1] !== '[REDACTED]' ? rootPageMatch?.[1] : undefined,
      },
      source: 'tools.md',
      warnings: [
        ...warnings,
        'セキュリティ改善推奨: .envファイルでNOTION_API_KEY=your_key_here を設定してください',
      ],
    };
  } catch (error) {
    throw new Error(`Notion設定取得エラー: ${error instanceof Error ? error.message : String(error)}\n\n` +
      '解決方法:\n' +
      '1. 環境変数設定: export NOTION_API_KEY=your_key_here\n' +
      '2. .envファイル作成: NOTION_API_KEY=your_key_here\n' +
      '3. TOOLS.md更新: API Secret行を正しく設定'
    );
  }
}

/**
 * 開発用：.envファイルのテンプレート作成
 */
export function createEnvTemplate(): void {
  const envTemplate = `# Notion API 設定
# https://www.notion.so/my-integrations で取得
NOTION_API_KEY=your_notion_integration_token_here

# ルートページID（オプション）
# ページURLの最後の32文字のハイフン区切り
NOTION_ROOT_PAGE_ID=your_root_page_id_here

# セキュリティ注意:
# - このファイルは.gitignoreに追加してください
# - 本番環境では環境変数で直接設定してください
`;

  const envPath = '.env.example';
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log(`✅ ${envPath} テンプレートを作成しました`);
    console.log('📝 実際の.envファイルを作成して、API keyを設定してください');
  } else {
    console.log(`ℹ️ ${envPath} は既に存在します`);
  }
}