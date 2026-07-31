import { Component } from '@angular/core';
import { WipPlaceholder } from '../../../shared/ui/wip-placeholder/wip-placeholder';

@Component({
  selector: 'app-backlog-page',
  standalone: true,
  imports: [WipPlaceholder],
  template: `<app-wip-placeholder title="Backlog" />`,
})
export class BacklogPage {}
