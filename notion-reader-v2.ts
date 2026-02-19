import { Client } from '@notionhq/client';
import { 
  PageObjectResponse, 
  BlockObjectResponse, 
  QueryDatabaseResponse 
} from '@notionhq/client/build/src/api-endpoints';

export interface NotionConfig {
  apiKey: string;
  rootPageId?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

export class NotionReaderV2 {
  private notion: Client;
  private rootPageId?: string;
  private retryConfig: RetryConfig;

  constructor(config: NotionConfig, retryConfig?: Partial<RetryConfig>) {
    this.notion = new Client({
      auth: config.apiKey,
    });
    this.rootPageId = config.rootPageId;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      ...retryConfig,
    };
  }

  /**
   * リトライ付きAPI呼び出し
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryConfig.maxRetries) {
          throw new Error(`${operationName}失敗 (${attempt + 1}回試行): ${lastError.message}`);
        }
        
        // リトライ対象エラーかチェック
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        
        console.warn(`${operationName}リトライ ${attempt + 1}/${this.retryConfig.maxRetries} (${delay}ms後)`);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    // 429 (Rate Limit), 5xx (Server Error), ネットワークエラー
    const statusCode = error?.status || error?.code;
    return (
      statusCode === 429 ||
      (statusCode >= 500 && statusCode < 600) ||
      error?.code === 'ECONNRESET' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ページ取得（改善版）
   */
  async getPage(pageId: string): Promise<PageObjectResponse> {
    return await this.withRetry(async () => {
      const response = await this.notion.pages.retrieve({ page_id: pageId });
      
      if (response.object !== 'page') {
        throw new Error(`取得したオブジェクトがページではありません: ${response.object}`);
      }
      
      return response as PageObjectResponse;
    }, `ページ取得(${pageId})`);
  }

  /**
   * ページネーション対応ブロック取得
   */
  async getAllPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
    const allBlocks: BlockObjectResponse[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.withRetry(async () => {
        return await this.notion.blocks.children.list({
          block_id: pageId,
          page_size: 100,
          start_cursor: cursor,
        });
      }, `ブロック取得(${pageId})`);

      const blocks = result.results as BlockObjectResponse[];
      allBlocks.push(...blocks);
      
      hasMore = result.has_more;
      cursor = result.next_cursor || undefined;
    }

    return allBlocks;
  }

  /**
   * ページをマークダウン形式で取得（改善版）
   */
  async getPageAsMarkdown(pageId: string): Promise<string> {
    try {
      const page = await this.getPage(pageId);
      const blocks = await this.getAllPageBlocks(pageId);
      
      let markdown = '';
      
      // ページタイトル
      const title = this.extractPageTitle(page);
      if (title) {
        markdown += `# ${title}\n\n`;
      }

      // ブロック内容を変換
      for (const block of blocks) {
        markdown += await this.blockToMarkdown(block);
      }

      return markdown;
    } catch (error) {
      throw new Error(`Markdown変換エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ページタイトル抽出（型安全）
   */
  private extractPageTitle(page: PageObjectResponse): string {
    if (!page.properties) return '';

    for (const [key, value] of Object.entries(page.properties)) {
      if (value.type === 'title' && 'title' in value) {
        return value.title.map((t: any) => t.plain_text).join('');
      }
    }

    return '';
  }

  /**
   * ブロックをマークダウンに変換（改善版）
   */
  private async blockToMarkdown(block: BlockObjectResponse): Promise<string> {
    if (!block || !('type' in block)) return '';

    try {
      switch (block.type) {
        case 'paragraph':
          return this.richTextToMarkdown((block as any).paragraph.rich_text) + '\n\n';
        
        case 'heading_1':
          return `# ${this.richTextToMarkdown((block as any).heading_1.rich_text)}\n\n`;
        
        case 'heading_2':
          return `## ${this.richTextToMarkdown((block as any).heading_2.rich_text)}\n\n`;
        
        case 'heading_3':
          return `### ${this.richTextToMarkdown((block as any).heading_3.rich_text)}\n\n`;
        
        case 'bulleted_list_item':
          return `- ${this.richTextToMarkdown((block as any).bulleted_list_item.rich_text)}\n`;
        
        case 'numbered_list_item':
          return `1. ${this.richTextToMarkdown((block as any).numbered_list_item.rich_text)}\n`;
        
        case 'to_do':
          const checked = (block as any).to_do.checked ? '[x]' : '[ ]';
          return `${checked} ${this.richTextToMarkdown((block as any).to_do.rich_text)}\n`;
        
        case 'code':
          const language = (block as any).code.language || '';
          const code = this.richTextToMarkdown((block as any).code.rich_text);
          return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        
        case 'quote':
          return `> ${this.richTextToMarkdown((block as any).quote.rich_text)}\n\n`;
        
        case 'callout':
          const icon = (block as any).callout.icon?.type === 'emoji' ? (block as any).callout.icon.emoji : '';
          return `> ${icon} ${this.richTextToMarkdown((block as any).callout.rich_text)}\n\n`;
        
        default:
          return '';
      }
    } catch (error) {
      console.warn(`ブロック変換警告 (${block.id}): ${error instanceof Error ? error.message : String(error)}`);
      return `<!-- ブロック変換エラー: ${block.type} -->\n`;
    }
  }

  /**
   * リッチテキストをマークダウンに変換
   */
  private richTextToMarkdown(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    
    return richText.map(text => {
      let result = text.plain_text || '';
      
      if (text.annotations?.bold) result = `**${result}**`;
      if (text.annotations?.italic) result = `*${result}*`;
      if (text.annotations?.code) result = `\`${result}\``;
      if (text.annotations?.strikethrough) result = `~~${result}~~`;
      if (text.href) result = `[${result}](${text.href})`;
      
      return result;
    }).join('');
  }

  /**
   * ページネーション対応子ページ取得
   */
  async getAllChildPages(pageId: string): Promise<{ id: string; title: string; url: string }[]> {
    const blocks = await this.getAllPageBlocks(pageId);
    const childPages: { id: string; title: string; url: string }[] = [];

    for (const block of blocks) {
      if (block.type === 'child_page' && 'child_page' in block) {
        childPages.push({
          id: block.id,
          title: (block as any).child_page.title,
          url: `https://www.notion.so/${block.id.replace(/-/g, '')}`,
        });
      }
    }

    return childPages;
  }

  /**
   * ページネーション対応データベース検索
   */
  async searchAllDatabase(databaseId: string, query?: string): Promise<any[]> {
    const allResults: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.withRetry(async () => {
        return await this.notion.databases.query({
          database_id: databaseId,
          page_size: 100,
          start_cursor: cursor,
          filter: query ? {
            property: 'Title',
            rich_text: {
              contains: query,
            },
          } : undefined,
        });
      }, `データベース検索(${databaseId})`);

      allResults.push(...result.results);
      
      hasMore = result.has_more;
      cursor = result.next_cursor || undefined;
    }

    return allResults;
  }

  /**
   * ワークスペース全体検索（ページネーション対応）
   */
  async searchAllWorkspace(query: string): Promise<{ pages: any[]; databases: any[] }> {
    const allPages: any[] = [];
    const allDatabases: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.withRetry(async () => {
        return await this.notion.search({
          query,
          page_size: 100,
          start_cursor: cursor,
        });
      }, `ワークスペース検索(${query})`);

      const pages = result.results.filter(item => item.object === 'page');
      const databases = result.results.filter(item => item.object === 'database');
      
      allPages.push(...pages);
      allDatabases.push(...databases);
      
      hasMore = result.has_more;
      cursor = result.next_cursor || undefined;
    }

    return { pages: allPages, databases: allDatabases };
  }

  /**
   * ページタイトル取得（改善版）
   */
  async getPageTitle(pageId: string): Promise<string> {
    try {
      const page = await this.getPage(pageId);
      return this.extractPageTitle(page);
    } catch (error) {
      throw new Error(`ページタイトル取得エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}