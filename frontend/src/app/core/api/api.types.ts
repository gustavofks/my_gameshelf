export interface GamePlatform {
  slug: string;
  name: string;
}

export interface Game {
  id: string;
  title: string;
  region: string | null;
  filePath: string;
  fileSize: string;
  crc32: string | null;
  discNumber: number | null;
  revision: string | null;
  isMissing: boolean;
  platform: GamePlatform;
}

export interface GameList {
  total: number;
  page: number;
  pageSize: number;
  items: Game[];
}

export interface PlatformSummary {
  slug: string;
  name: string;
  gameCount: number;
}

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ScanIssue {
  severity: 'WARNING' | 'ERROR';
  code: string;
  filePath: string | null;
  message: string;
}

export interface ScanJob {
  id: string;
  status: ScanStatus;
  filesFound: number;
  filesProcessed: number;
  errorMessage: string | null;
  issues: ScanIssue[];
}

export interface GameListQuery {
  platform?: string;
  search?: string;
  page?: number;
}
