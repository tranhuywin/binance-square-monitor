import notifier from 'node-notifier';
import { NotificationOptions } from '../types';
import { logger } from '../utils/logger';

export class NotificationService {
  async send(options: NotificationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Sending notification');
      logger.info('Message:');
      logger.info(options.message);

      notifier.notify(
        {
          title: options.title,
          message: 'you got a new message',
          sound: true,
          wait: true,
          timeout: false,
          ...(options.open && { open: options.open }),
        },
        (error, response) => {
          if (error) {
            logger.error('Failed to send notification', { error });
            reject(error);
          } else {
            logger.debug('Notification sent successfully', { response });
            resolve();
          }
        }
      );
    });
  }

  async sendNewPostNotification(
    authorName: string,
    postTitle: string,
    postUrl: string
  ): Promise<void> {
    const title = `🔔 New Binance Square Post from ${authorName}`;
    const message = postTitle || 'Click to view the post';

    await this.send({
      title,
      message,
      sound: true,
      open: postUrl,
    });
  }

  async sendErrorNotification(errorMessage: string): Promise<void> {
    await this.send({
      title: '⚠️ Binance Monitor Error',
      message: errorMessage,
      sound: false,
    });
  }

  async sendStartNotification(targetUids: string[]): Promise<void> {
    const userList = targetUids.length <= 3 
      ? targetUids.join(', ')
      : `${targetUids.slice(0, 3).join(', ')} and ${targetUids.length - 3} more`;
    
    await this.send({
      title: '✅ Binance Square Monitor Started',
      message: `Monitoring ${targetUids.length} user(s): ${userList}`,
      sound: false,
    });
  }
}

