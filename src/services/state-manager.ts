import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { AppState } from '../types';
import { logger } from '../utils/logger';

interface UserState {
  lastSeenPostId: string | null;
  lastSeenTimestamp: number | null;
  lastCheckTime: number;
}

export class StateManager {
  private stateFilePath: string;
  private state: AppState;

  constructor(stateFilePath: string) {
    this.stateFilePath = stateFilePath;
    this.state = {
      users: {},
    };
  }

  async load(): Promise<void> {
    try {
      if (existsSync(this.stateFilePath)) {
        const data = await readFile(this.stateFilePath, 'utf-8');
        const loadedState: unknown = JSON.parse(data);
        
        // Handle migration from old format
        if (this.isOldFormat(loadedState)) {
          logger.info('Migrating from old state format');
          this.state = { users: {} };
        } else if (this.isValidAppState(loadedState)) {
          this.state = loadedState;
        } else {
          logger.warn('Invalid state format, starting fresh');
          this.state = { users: {} };
        }
        
        logger.info('State loaded from file', {
          userCount: Object.keys(this.state.users as Record<string, unknown>).length,
        });
      } else {
        logger.info('No existing state file found, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load state file', { error });
      logger.info('Starting with empty state');
    }
  }

  private isOldFormat(obj: unknown): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'lastSeenPostId' in obj
    );
  }

  private isValidAppState(obj: unknown): obj is AppState {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    const candidate = obj as { users?: unknown };
    return (
      'users' in candidate &&
      typeof candidate.users === 'object' &&
      candidate.users !== null
    );
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

  private getUserState(uid: string): UserState {
    const users = this.state.users as Record<string, UserState | undefined>;
    let userState = users[uid];
    if (!userState) {
      userState = {
        lastSeenPostId: null,
        lastSeenTimestamp: null,
        lastCheckTime: 0,
      };
      users[uid] = userState;
    }
    return userState;
  }

  getLastSeenPostId(uid: string): string | null {
    return this.getUserState(uid).lastSeenPostId;
  }

  getLastSeenTimestamp(uid: string): number | null {
    return this.getUserState(uid).lastSeenTimestamp;
  }

  getLastCheckTime(uid: string): number {
    return this.getUserState(uid).lastCheckTime;
  }

  async updateLastSeenPost(uid: string, postId: string, timestamp: number): Promise<void> {
    const userState = this.getUserState(uid);
    userState.lastSeenPostId = postId;
    userState.lastSeenTimestamp = timestamp;
    userState.lastCheckTime = Date.now();
    await this.save();
  }

  async updateLastCheckTime(uid: string): Promise<void> {
    const userState = this.getUserState(uid);
    userState.lastCheckTime = Date.now();
    await this.save();
  }

  isNewPost(uid: string, postId: string, timestamp: number): boolean {
    const userState = this.getUserState(uid);
    
    // If we haven't seen any posts yet, don't treat existing posts as new
    if (userState.lastSeenPostId === null) {
      return false;
    }

    // Check if this post ID is different from the last seen one
    if (postId !== userState.lastSeenPostId) {
      // Also verify the timestamp is newer or equal
      if (
        userState.lastSeenTimestamp === null ||
        timestamp >= userState.lastSeenTimestamp
      ) {
        return true;
      }
    }

    return false;
  }
}

