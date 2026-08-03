import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/error/http-error.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { initLanguage } from './core/i18n/lang';
import {
  FolderPickerService,
  WebFolderPickerService,
} from './features/scan/folder-picker/folder-picker.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pt'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(initLanguage),
    { provide: FolderPickerService, useClass: WebFolderPickerService },
  ],
};
