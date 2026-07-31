import { inject, Injectable } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { GamesApiService } from '../../core/api/games-api.service';
import { PlatformsApiService } from '../../core/api/platforms-api.service';

@Injectable()
export class LibraryStore {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gamesApi = inject(GamesApiService);
  private platformsApi = inject(PlatformsApiService);

  readonly platform = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.route.firstChild?.snapshot.paramMap.get('platformSlug') ?? null),
    ),
    { initialValue: null },
  );

  readonly search = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('search') ?? '')),
    { initialValue: '' },
  );

  readonly platforms = rxResource({
    stream: () => this.platformsApi.list(),
  });

  readonly games = rxResource({
    params: () => ({ platform: this.platform(), search: this.search() }),
    stream: ({ params }) =>
      this.gamesApi.list({
        platform: params.platform ?? undefined,
        search: params.search || undefined,
      }),
  });
}
