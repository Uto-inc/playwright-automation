import { Client } from '@notionhq/client';
import { PageObjectResponse, BlockObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export interface NotionConfig {
  apiKey: string;
  rootPageId?: string;
}

export class NotionReader {
  private notion: Client;
  private rootPageId?: string;

  constructor(config: NotionConfig) {
    this.notion = new Client({
      auth: config.apiKey,
    });
    this.rootPageId = config.rootPageId;
  }

  /**
   * ページの内容を取得
   */
  async getPage(pageId: string): Promise<PageObjectResponse | null> {
    try {
      const response = await this.notion.pages.retrieve({ page_id: pageId });
      return response as PageObjectResponse;
    } catch (error) {
      console.error(`ページ取得エラー (${pageId}):`, error);
      return null;
    }
  }

  /**
   * ページのブロック内容を取得
   */
  async getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
    try {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });
      return response.results as BlockObjectResponse[];
    } catch (error) {
      console.error(`ブロック取得エラー (${pageId}):`, error);
      return [];
    }
  }

  /**
   * ページをマークダウン形式で取得
   */
  async getPageAsMarkdown(pageId: string): Promise<string> {
    const page = await this.getPage(pageId);
    if (!page) return '';

    const blocks = await this.getPageBlocks(pageId);
    
    let markdown = '';
    
    // ページタイトル
    if (page.properties?.title && 'title' in page.properties.title) {
      const title = page.properties.title.title
        .map((t: any) => t.plain_text)
        .join('');
      markdown += `# ${title}\n\n`;
    }

    // ブロック内容を変換
    for (const block of blocks) {
      markdown += await this.blockToMarkdown(block);
    }

    return markdown;
  }

  /**
   * ブロックをマークダウンに変換
   */
  private async blockToMarkdown(block: BlockObjectResponse): Promise<string> {
    if (!block || !('type' in block)) return '';

    switch (block.type) {
      case 'paragraph':
        const paragraph = block.paragraph;
        return this.richTextToMarkdown(paragraph.rich_text) + '\n\n';
      
      case 'heading_1':
        return `# ${this.richTextToMarkdown(block.heading_1.rich_text)}\n\n`;
      
      case 'heading_2':
        return `## ${this.richTextToMarkdown(block.heading_2.rich_text)}\n\n`;
      
      case 'heading_3':
        return `### ${this.richTextToMarkdown(block.heading_3.rich_text)}\n\n`;
      
      case 'bulleted_list_item':
        return `- ${this.richTextToMarkdown(block.bulleted_list_item.rich_text)}\n`;
      
      case 'numbered_list_item':
        return `1. ${this.richTextToMarkdown(block.numbered_list_item.rich_text)}\n`;
      
      case 'to_do':
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        return `${checked} ${this.richTextToMarkdown(block.to_do.rich_text)}\n`;
      
      case 'code':
        const language = block.code.language || '';
        const code = this.richTextToMarkdown(block.code.rich_text);
        return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      
      case 'quote':
        return `> ${this.richTextToMarkdown(block.quote.rich_text)}\n\n`;
      
      case 'callout':
        const icon = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : '';
        return `> ${icon} ${this.richTextToMarkdown(block.callout.rich_text)}\n\n`;
      
      default:
        return '';
    }
  }

  /**
   * リッチテキストをプレーンテキストに変換
   */
  private richTextToMarkdown(richText: any[]): string {
    if (!richText) return '';
    
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
   * 子ページ一覧を取得
   */
  async getChildPages(pageId: string): Promise<{ id: string; title: string; url: string }[]> {
    const blocks = await this.getPageBlocks(pageId);
    const childPages: { id: string; title: string; url: string }[] = [];

    for (const block of blocks) {
      if (block.type === 'child_page' && 'child_page' in block) {
        childPages.push({
          id: block.id,
          title: block.child_page.title,
          url: `https://www.notion.so/${block.id.replace(/-/g, '')}`,
        });
      }
    }

    return childPages;
  }

  /**
   * データベースの検索
   */
  async searchDatabase(databaseId: string, query?: string): Promise<any[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter: query ? {
          property: 'Title',
          rich_text: {
            contains: query,
          },
        } : undefined,
      });
      
      return response.results;
    } catch (error) {
      console.error(`データベース検索エラー (${databaseId}):`, error);
      return [];
    }
  }

  /**
   * ページのタイトルを取得
   */
  async getPageTitle(pageId: string): Promise<string> {
    const page = await this.getPage(pageId);
    if (!page || !page.properties) return '';

    // Title プロパティを探す
    for (const [key, value] of Object.entries(page.properties)) {
      if (value.type === 'title' && 'title' in value) {
        return value.title.map((t: any) => t.plain_text).join('');
      }
    }

    return '';
  }

  /**
   * ワークスペース全体を検索
   */
  async searchWorkspace(query: string): Promise<{ pages: any[]; databases: any[] }> {
    try {
      const response = await this.notion.search({
        query,
        page_size: 20,
      });

      const pages = response.results.filter(item => item.object === 'page');
      const databases = response.results.filter(item => item.object === 'database');

      return { pages, databases };
    } catch (error) {
      console.error(`ワークスペース検索エラー:`, error);
      return { pages: [], databases: [] };
    }
  }
}