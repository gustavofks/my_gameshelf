import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformSummary } from './api.types';

@Injectable({ providedIn: 'root' })
export class PlatformsApiService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<PlatformSummary[]>('/platforms');
  }
}
