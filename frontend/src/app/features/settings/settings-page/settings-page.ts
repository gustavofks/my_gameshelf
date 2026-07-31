import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageToggle } from '../../../layout/language-toggle/language-toggle';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [TranslocoDirective, LanguageToggle],
  template: `
    <div class="p-6" *transloco="let t">
      <h2 class="mb-4 font-display text-lg uppercase tracking-widest text-accent">
        {{ t('nav.settings') }}
      </h2>
      <div class="flex items-center gap-3">
        <span class="font-sans text-sm text-fg">{{ t('settings.language') }}</span>
        <app-language-toggle />
      </div>
    </div>
  `,
})
export class SettingsPage {}
