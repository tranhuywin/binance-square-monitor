import { loadConfig } from './config';
import { BinanceClient } from './services/binance-client';
import { NotificationService } from './services/notification-service';
import { StateManager } from './services/state-manager';
import { PollService } from './services/poll-service';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('=== Binance Square Monitor ===');
    logger.info('Starting application...');

    // Load configuration
    const config = loadConfig();

    // Initialize services
    const stateManager = new StateManager(config.stateFilePath);
    await stateManager.load();

    const binanceClient = new BinanceClient(config);
    const notificationService = new NotificationService();

    const pollService = new PollService(
      config,
      binanceClient,
      notificationService,
      stateManager
    );

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      pollService.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      pollService.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
    });

    // Start polling
    await pollService.start();

    logger.info('Application started successfully');
    logger.info(`Monitoring user: ${config.targetUid}`);
    logger.info(`Polling interval: ${config.pollingIntervalMs}ms`);
    logger.info('Press Ctrl+C to stop');
  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// Start the application
void main();

