import { TestBed } from '@angular/core/testing';
import { ScanIssues } from './scan-issues';
import { ScanIssue } from '../../../core/api/api.types';

const issues: ScanIssue[] = [
  {
    severity: 'ERROR',
    code: 'UNREADABLE_FILE',
    filePath: 'roms/broken.bin',
    message: 'File could not be read',
  },
  {
    severity: 'WARNING',
    code: 'UNKNOWN_EXTENSION',
    filePath: null,
    message: 'Unknown file extension',
  },
];

describe('ScanIssues', () => {
  async function create(list: ScanIssue[]) {
    await TestBed.configureTestingModule({
      imports: [ScanIssues],
    }).compileComponents();
    const fixture = TestBed.createComponent(ScanIssues);
    fixture.componentRef.setInput('issues', list);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the message of each issue', async () => {
    const fixture = await create(issues);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('File could not be read');
    expect(text).toContain('Unknown file extension');
  });

  it('colors rows by severity', async () => {
    const fixture = await create(issues);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(rows[0].classList.contains('text-danger')).toBe(true);
    expect(rows[1].classList.contains('text-warn')).toBe(true);
  });

  it('renders nothing for an empty list', async () => {
    const fixture = await create([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('ul')).toBeNull();
  });
});
