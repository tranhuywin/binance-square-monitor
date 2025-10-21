import axios, { AxiosError, AxiosInstance } from 'axios';
import { AppConfig, BinanceApiResponse, BinanceSquarePost } from '../types';
import { logger } from '../utils/logger';

export class BinanceClient {
  private client: AxiosInstance;
  private config: AppConfig;
  private baseUrl = 'https://www.binance.com';

  constructor(config: AppConfig) {
    this.config = config;
    
    const headers: Record<string, string> = {
      'User-Agent':
        config.userAgent ||
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      clienttype: 'web',
      lang: 'en',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    };

    // Add optional headers from config
    if (config.cookies) headers.Cookie = config.cookies;
    if (config.csrfToken) headers.csrftoken = config.csrfToken;
    if (config.deviceInfo) headers['device-info'] = config.deviceInfo;
    if (config.fvideoId) headers['fvideo-id'] = config.fvideoId;
    if (config.fvideoToken) headers['fvideo-token'] = config.fvideoToken;
    if (config.bncUuid) headers['bnc-uuid'] = config.bncUuid;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.requestTimeoutMs,
      headers,
    });
  }

  async fetchLatestPosts(): Promise<BinanceSquarePost[]> {
    const url = '/bapi/composite/v1/friendly/pgc/content/queryUserProfilePageContentsWithFilter';
    const params = {
      targetSquareUid: this.config.targetUid,
      timeOffset: -1,
      filterType: 'ALL',
    };

    let lastError: Error | null = null;
    let backoffMs = this.config.initialBackoffMs;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.debug(`Fetching posts (attempt ${attempt + 1}/${this.config.maxRetries + 1})`);

        const response = await this.client.get<BinanceApiResponse>(url, { params });

        if (!response.data.success) {
          throw new Error(
            `API returned error: ${response.data.message || 'Unknown error'}`
          );
        }

        const posts = this.parsePosts(response.data);
        logger.debug(`Successfully fetched ${posts.length} posts`);
        return posts;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          const status = axiosError.response.status;
          logger.warn(`HTTP error ${status}`, {
            attempt: attempt + 1,
            url,
          });

          // Handle rate limiting
          if (status === 429) {
            const retryAfter = axiosError.response.headers['retry-after'];
            if (retryAfter) {
              backoffMs = parseInt(retryAfter, 10) * 1000;
              logger.info(`Rate limited, retry after ${backoffMs}ms`);
            }
          }

          // Don't retry on client errors (except 429)
          if (status >= 400 && status < 500 && status !== 429) {
            logger.error('Client error, not retrying', { status });
            throw error;
          }
        } else if (axiosError.request) {
          logger.warn('No response received', { attempt: attempt + 1 });
        } else {
          logger.warn('Request setup error', {
            attempt: attempt + 1,
            error: axiosError.message,
          });
        }

        // If we have retries left, wait and try again
        if (attempt < this.config.maxRetries) {
          logger.info(`Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
          // Exponential backoff with cap
          backoffMs = Math.min(backoffMs * 2, this.config.maxBackoffMs);
        }
      }
    }

    // All retries exhausted
    logger.error('All retry attempts exhausted', { error: lastError });
    throw lastError || new Error('Failed to fetch posts after all retries');
  }

  private parsePosts(response: BinanceApiResponse): BinanceSquarePost[] {
    // New API format uses 'contents' array
    if (response.data.contents && response.data.contents.length > 0) {
      return response.data.contents.map((post) => ({
        id: String(post.id),
        contentId: String(post.id),
        title: post.title,
        summary: post.bodyTextOnly,
        content: post.body,
        createTime: post.createTime,
        updateTime: post.updateTime,
        author: {
          nickname: post.displayName,
          avatarUrl: post.avatar,
        },
      }));
    }

    // Old API format uses 'userProfileDataDTOS' array
    if (response.data.userProfileDataDTOS && response.data.userProfileDataDTOS.length > 0) {
      return response.data.userProfileDataDTOS.map((post) => ({
        id: post.id,
        contentId: post.contentId,
        title: post.title,
        summary: post.summary,
        content: post.content,
        createTime: post.createTime,
        updateTime: post.updateTime,
        author: post.author,
      }));
    }

    return [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getPostUrl(contentId: string): string {
    return `${this.baseUrl}/en/square/post/${contentId}`;
  }
}

