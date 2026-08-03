import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DirectoryListing } from './api.types';

@Injectable({ providedIn: 'root' })
export class FsApiService {
  private http = inject(HttpClient);

  directories(path?: string) {
    let params = new HttpParams();
    if (path) params = params.set('path', path);
    return this.http.get<DirectoryListing>('/fs/directories', { params });
  }
}
