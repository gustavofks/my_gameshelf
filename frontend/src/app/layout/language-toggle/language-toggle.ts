import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

const STORAGE_KEY = 'gameshelf.lang';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  template: `
    <div class="flex gap-1">
      @for (lang of langs; track lang) {
        <button
          type="button"
          (click)="setLang(lang)"
          class="rounded-full px-3 py-1 font-display text-xs uppercase tracking-widest
            transition-colors duration-150 ease-out"
          [class.bg-accent]="active() === lang"
          [class.text-ink]="active() === lang"
          [class.text-fg]="active() !== lang"
          [class.opacity-60]="active() !== lang"
          [class.hover:bg-panel]="active() !== lang"
          [class.hover:opacity-100]="active() !== lang"
          [attr.aria-pressed]="active() === lang"
        >
          {{ lang }}
        </button>
      }
    </div>
  `,
})
export class LanguageToggle {
  private transloco = inject(TranslocoService);
  readonly langs = ['en', 'pt'];
  readonly active = signal(this.transloco.getActiveLang());

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ?? this.browserLang();
    this.setLang(initial);
    // Keep every toggle instance in sync (sidebar + settings render one each).
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((lang) => this.active.set(lang));
  }

  setLang(lang: string) {
    this.transloco.setActiveLang(lang);
    this.active.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  private browserLang(): string {
    return navigator.language?.startsWith('pt') ? 'pt' : 'en';
  }
}
