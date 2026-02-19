import { chromium, Browser, Page } from 'playwright';

export class PlaywrightHelper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * ブラウザ起動
   */
  async launch(headless: boolean = true) {
    this.browser = await chromium.launch({ 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    return this.page;
  }

  /**
   * ページに移動
   */
  async goto(url: string) {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    await this.page.goto(url);
  }

  /**
   * スクリーンショット取得
   */
  async screenshot(path: string = `screenshots/${Date.now()}.png`) {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * テキスト入力
   */
  async fill(selector: string, text: string) {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    await this.page.fill(selector, text);
  }

  /**
   * クリック
   */
  async click(selector: string) {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    await this.page.click(selector);
  }

  /**
   * 要素の値取得
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    return await this.page.textContent(selector) || '';
  }

  /**
   * 要素が表示されるまで待機
   */
  async waitForSelector(selector: string, timeout: number = 30000) {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * JavaScript実行
   */
  async evaluate(script: string): Promise<any> {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    return await this.page.evaluate(script);
  }

  /**
   * ページタイトル取得
   */
  async getTitle(): Promise<string> {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    return await this.page.title();
  }

  /**
   * ページURL取得
   */
  async getCurrentUrl(): Promise<string> {
    if (!this.page) throw new Error('ブラウザが起動されていません');
    return this.page.url();
  }

  /**
   * リソース終了
   */
  async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// 使用例関数
export async function quickTest(url: string) {
  const helper = new PlaywrightHelper();
  try {
    await helper.launch();
    await helper.goto(url);
    const title = await helper.getTitle();
    const screenshotPath = await helper.screenshot();
    
    console.log(`✅ ページタイトル: ${title}`);
    console.log(`📸 スクリーンショット: ${screenshotPath}`);
    
    return { title, screenshotPath, url };
  } finally {
    await helper.close();
  }
}