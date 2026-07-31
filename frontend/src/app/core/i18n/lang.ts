import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export const LANG_STORAGE_KEY = 'gameshelf.lang';

/**
 * Resolves the initial language (localStorage → browser → EN) once at
 * bootstrap. Doing this in a component constructor re-enters view creation
 * when the component lives inside a `*transloco` container (NG0200).
 */
export function initLanguage(): void {
  const transloco = inject(TranslocoService);
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  const lang = saved ?? (navigator.language?.startsWith('pt') ? 'pt' : 'en');
  transloco.setActiveLang(lang);
}
