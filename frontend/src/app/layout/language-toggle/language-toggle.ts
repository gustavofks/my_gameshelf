import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { LANG_STORAGE_KEY } from '../../core/i18n/lang';

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
    // The initial language is resolved at bootstrap (see core/i18n/lang.ts);
    // here we only mirror changes so every toggle instance stays in sync.
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((lang) => this.active.set(lang));
  }

  setLang(lang: string) {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }
}
