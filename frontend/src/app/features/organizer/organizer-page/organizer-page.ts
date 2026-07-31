import { Component } from '@angular/core';
import { WipPlaceholder } from '../../../shared/ui/wip-placeholder/wip-placeholder';

@Component({
  selector: 'app-organizer-page',
  standalone: true,
  imports: [WipPlaceholder],
  template: `<app-wip-placeholder title="Organizer" />`,
})
export class OrganizerPage {}
