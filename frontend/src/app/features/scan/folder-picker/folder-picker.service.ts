import { Injectable, Signal, signal } from '@angular/core';

/**
 * How a folder gets picked is platform-specific: the web build browses the
 * backend's filesystem inline; a desktop shell can call a native dialog.
 * The scan page depends only on this contract.
 */
export abstract class FolderPickerService {
  /** True while an inline picking surface should be rendered. */
  abstract readonly browsing: Signal<boolean>;
  /** Resolves with an absolute path, or null when picking is cancelled. */
  abstract pick(): Promise<string | null>;
  /** Reports the outcome from the picking surface. */
  abstract resolve(path: string | null): void;
}

@Injectable()
export class WebFolderPickerService implements FolderPickerService {
  private readonly _browsing = signal(false);
  readonly browsing = this._browsing.asReadonly();
  private pending?: (path: string | null) => void;

  pick(): Promise<string | null> {
    this.pending?.(null);
    this._browsing.set(true);
    return new Promise((resolve) => (this.pending = resolve));
  }

  resolve(path: string | null): void {
    this.pending?.(path);
    this.pending = undefined;
    this._browsing.set(false);
  }
}
