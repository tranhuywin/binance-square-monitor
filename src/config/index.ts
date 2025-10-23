import dotenv from 'dotenv';
import { AppConfig } from '../types';
import { logger } from '../utils/logger';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`Invalid number for ${key}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  // Parse TARGET_UIDS - support both comma-separated and single UID for backward compatibility
  const targetUidsEnv = process.env.TARGET_UIDS || process.env.TARGET_UID;
  if (!targetUidsEnv) {
    throw new Error('TARGET_UIDS (or TARGET_UID for single user) is required');
  }
  
  const targetUids = targetUidsEnv
    .split(',')
    .map(uid => uid.trim())
    .filter(uid => uid.length > 0);

  if (targetUids.length === 0) {
    throw new Error('At least one target UID must be provided');
  }

  const config: AppConfig = {
    targetUids,
    pollingIntervalMs: getEnvNumber('POLLING_INTERVAL_MS', 60000), // Default: 1 minute
    requestTimeoutMs: getEnvNumber('REQUEST_TIMEOUT_MS', 10000), // Default: 10 seconds
    maxRetries: getEnvNumber('MAX_RETRIES', 3),
    initialBackoffMs: getEnvNumber('INITIAL_BACKOFF_MS', 1000), // Default: 1 second
    maxBackoffMs: getEnvNumber('MAX_BACKOFF_MS', 60000), // Default: 60 seconds
    stateFilePath: getEnvVar('STATE_FILE_PATH', './state.json'),
    userAgent: process.env.USER_AGENT,
    cookies: process.env.COOKIES,
    csrfToken: process.env.CSRF_TOKEN,
    deviceInfo: process.env.DEVICE_INFO,
    fvideoId: process.env.FVIDEO_ID,
    fvideoToken: process.env.FVIDEO_TOKEN,
    bncUuid: process.env.BNC_UUID,
  };

  if (config.pollingIntervalMs < 5000) {
    logger.warn('Polling interval is less than 5 seconds, this may trigger rate limiting');
  }

  logger.info('Configuration loaded successfully', {
    targetUids: config.targetUids.join(', '),
    targetCount: config.targetUids.length,
    pollingIntervalMs: config.pollingIntervalMs,
    maxRetries: config.maxRetries,
  });

  return config;
}

