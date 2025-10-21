import { BinanceClient } from './binance-client';
import { NotificationService } from './notification-service';
import { StateManager } from './state-manager';
import { AppConfig } from '../types';
import { logger } from '../utils/logger';

export class PollService {
  private binanceClient: BinanceClient;
  private notificationService: NotificationService;
  private stateManager: StateManager;
  private config: AppConfig;
  private isRunning = false;
  private pollTimeout: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 5;

  constructor(
    config: AppConfig,
    binanceClient: BinanceClient,
    notificationService: NotificationService,
    stateManager: StateManager
  ) {
    this.config = config;
    this.binanceClient = binanceClient;
    this.notificationService = notificationService;
    this.stateManager = stateManager;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Poll service is already running');
      return;
    }

    this.isRunning = true;
    this.consecutiveErrors = 0;
    logger.info('Starting poll service', {
      pollingIntervalMs: this.config.pollingIntervalMs,
    });

    // Send start notification
    try {
      await this.notificationService.sendStartNotification(this.config.targetUid);
    } catch (error) {
      logger.error('Failed to send start notification', { error });
    }

    // Run first poll immediately
    await this.poll();
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn('Poll service is not running');
      return;
    }

    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    logger.info('Poll service stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.debug('Starting poll cycle');
      const posts = await this.binanceClient.fetchLatestPosts();

      if (posts.length === 0) {
        logger.info('No posts found for user');
      } else {
        // Sort posts by timestamp (newest first)
        posts.sort((a, b) => b.createTime - a.createTime);
        const latestPost = posts[0];

        logger.debug('Latest post', {
          id: latestPost.id,
          timestamp: latestPost.createTime,
          title: latestPost.title?.substring(0, 50),
        });

        // Check if this is a new post
        if (this.stateManager.isNewPost(latestPost.id, latestPost.createTime)) {
          logger.info('New post detected!', {
            postId: latestPost.id,
            title: latestPost.title,
          });

          // Send notification
          const authorName =
            latestPost.author?.nickname || `UID ${this.config.targetUid}`;
          const postTitle =
            latestPost.title ||
            latestPost.summary?.substring(0, 100) ||
            'Untitled Post';
          const postUrl = this.binanceClient.getPostUrl(latestPost.contentId);

          try {
            await this.notificationService.sendNewPostNotification(
              authorName,
              postTitle,
              postUrl
            );
          } catch (error) {
            logger.error('Failed to send new post notification', { error });
          }
        }

        // Update state with the latest post
        await this.stateManager.updateLastSeenPost(
          latestPost.id,
          latestPost.createTime
        );
      }

      // Reset error counter on success
      this.consecutiveErrors = 0;

      // Update last check time
      await this.stateManager.updateLastCheckTime();
    } catch (error) {
      this.consecutiveErrors++;
      logger.error('Error during poll cycle', {
        error,
        consecutiveErrors: this.consecutiveErrors,
      });

      // If too many consecutive errors, send notification and stop
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        logger.error('Maximum consecutive errors reached, stopping poll service');
        try {
          await this.notificationService.sendErrorNotification(
            `Monitor stopped after ${this.maxConsecutiveErrors} consecutive errors. Check logs.`
          );
        } catch (notifError) {
          logger.error('Failed to send error notification', { error: notifError });
        }
        this.stop();
        return;
      }
    }

    // Schedule next poll with exponential backoff on errors
    if (this.isRunning) {
      let nextPollMs = this.config.pollingIntervalMs;

      if (this.consecutiveErrors > 0) {
        // Apply exponential backoff on errors
        const backoffMultiplier = Math.pow(2, this.consecutiveErrors - 1);
        nextPollMs = Math.min(
          nextPollMs * backoffMultiplier,
          this.config.maxBackoffMs
        );
        logger.info(`Next poll in ${nextPollMs}ms (error backoff applied)`);
      } else {
        logger.debug(`Next poll in ${nextPollMs}ms`);
      }

      this.pollTimeout = setTimeout(() => {
        void this.poll();
      }, nextPollMs);
    }
  }
}

