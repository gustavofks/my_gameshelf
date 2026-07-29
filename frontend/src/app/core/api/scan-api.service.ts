import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScanJob } from './api.types';

@Injectable({ providedIn: 'root' })
export class ScanApiService {
  private http = inject(HttpClient);

  start(rootPath?: string) {
    const body = rootPath ? { rootPath } : {};
    return this.http.post<{ id: string; status: string }>('/scans', body);
  }

  status(id: string) {
    return this.http.get<ScanJob>(`/scans/${id}`);
  }
}
