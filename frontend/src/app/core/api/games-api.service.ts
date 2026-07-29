import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GameList, GameListQuery } from './api.types';

@Injectable({ providedIn: 'root' })
export class GamesApiService {
  private http = inject(HttpClient);

  list(query: GameListQuery) {
    let params = new HttpParams();
    if (query.platform) params = params.set('platform', query.platform);
    if (query.search) params = params.set('search', query.search);
    if (query.page !== undefined) params = params.set('page', String(query.page));
    return this.http.get<GameList>('/games', { params });
  }
}
