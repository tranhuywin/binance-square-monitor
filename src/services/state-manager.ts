import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { AppState } from '../types';
import { logger } from '../utils/logger';

export class StateManager {
  private stateFilePath: string;
  private state: AppState;

  constructor(stateFilePath: string) {
    this.stateFilePath = stateFilePath;
    this.state = {
      lastSeenPostId: null,
      lastSeenTimestamp: null,
      lastCheckTime: 0,
    };
  }

  async load(): Promise<void> {
    try {
      if (existsSync(this.stateFilePath)) {
        const data = await readFile(this.stateFilePath, 'utf-8');
        this.state = JSON.parse(data) as AppState;
        logger.info('State loaded from file', {
          lastSeenPostId: this.state.lastSeenPostId,
          lastSeenTimestamp: this.state.lastSeenTimestamp,
        });
      } else {
        logger.info('No existing state file found, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load state file', { error });
      logger.info('Starting with empty state');
    }
  }

  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.state, null, 2);
      await writeFile(this.stateFilePath, data, 'utf-8');
      logger.debug('State saved to file');
    } catch (error) {
      logger.error('Failed to save state file', { error });
      throw error;
    }
  }

  getLastSeenPostId(): string | null {
    return this.state.lastSeenPostId;
  }

  getLastSeenTimestamp(): number | null {
    return this.state.lastSeenTimestamp;
  }

  getLastCheckTime(): number {
    return this.state.lastCheckTime;
  }

  async updateLastSeenPost(postId: string, timestamp: number): Promise<void> {
    this.state.lastSeenPostId = postId;
    this.state.lastSeenTimestamp = timestamp;
    this.state.lastCheckTime = Date.now();
    await this.save();
  }

  async updateLastCheckTime(): Promise<void> {
    this.state.lastCheckTime = Date.now();
    await this.save();
  }

  isNewPost(postId: string, timestamp: number): boolean {
    // If we haven't seen any posts yet, don't treat existing posts as new
    if (this.state.lastSeenPostId === null) {
      return false;
    }

    // Check if this post ID is different from the last seen one
    if (postId !== this.state.lastSeenPostId) {
      // Also verify the timestamp is newer or equal
      if (
        this.state.lastSeenTimestamp === null ||
        timestamp >= this.state.lastSeenTimestamp
      ) {
        return true;
      }
    }

    return false;
  }
}

