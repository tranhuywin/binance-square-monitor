export interface BinanceSquarePost {
  id: string;
  contentId: string;
  title?: string;
  summary?: string;
  content?: string;
  createTime: number;
  updateTime: number;
  author?: {
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface BinanceApiResponse {
  code: string;
  message: string | null;
  messageDetail: string | null;
  data: {
    contents?: Array<{
      id: number;
      title?: string;
      bodyTextOnly?: string;
      body?: string;
      createTime: number;
      updateTime: number;
      displayName?: string;
      username?: string;
      avatar?: string;
      webLink?: string;
    }>;
    userProfileDataDTOS?: Array<{
      id: string;
      contentId: string;
      title?: string;
      summary?: string;
      content?: string;
      createTime: number;
      updateTime: number;
      author?: {
        nickname?: string;
        avatarUrl?: string;
      };
    }>;
    total?: number;
    timeOffset?: number;
  };
  success: boolean;
}

export interface AppConfig {
  targetUids: string[];
  pollingIntervalMs: number;
  requestTimeoutMs: number;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  stateFilePath: string;
  userAgent?: string;
  cookies?: string;
  csrfToken?: string;
  deviceInfo?: string;
  fvideoId?: string;
  fvideoToken?: string;
  bncUuid?: string;
}

export interface UserState {
  lastSeenPostId: string | null;
  lastSeenTimestamp: number | null;
  lastCheckTime: number;
}

export interface AppState {
  users: {
    [uid: string]: UserState;
  };
}

export interface NotificationOptions {
  title: string;
  message: string;
  sound?: boolean;
  wait?: boolean;
  open?: string;
}

