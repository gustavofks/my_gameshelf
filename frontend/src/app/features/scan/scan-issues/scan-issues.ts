import { Component, input } from '@angular/core';
import { ScanIssue } from '../../../core/api/api.types';

@Component({
  selector: 'app-scan-issues',
  standalone: true,
  template: `
    @if (issues().length > 0) {
      <ul class="mt-4 divide-y divide-line rounded border border-line bg-panel">
        @for (issue of issues(); track $index) {
          <li
            class="px-3 py-2 font-sans text-sm"
            [class.text-danger]="issue.severity === 'ERROR'"
            [class.text-warn]="issue.severity === 'WARNING'"
          >
            {{ issue.message }}
            @if (issue.filePath) {
              <span class="opacity-60">— {{ issue.filePath }}</span>
            }
          </li>
        }
      </ul>
    }
  `,
})
export class ScanIssues {
  issues = input.required<ScanIssue[]>();
}
