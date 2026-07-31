import { TestBed } from '@angular/core/testing';
import { ScanProgress } from './scan-progress';

describe('ScanProgress', () => {
  it('renders the percentage from processed/found', async () => {
    await TestBed.configureTestingModule({ imports: [ScanProgress] }).compileComponents();
    const fixture = TestBed.createComponent(ScanProgress);
    fixture.componentRef.setInput('found', 4);
    fixture.componentRef.setInput('processed', 2);
    fixture.componentRef.setInput('status', 'RUNNING');
    fixture.detectChanges();
    const bar = (fixture.nativeElement as HTMLElement).querySelector('[data-bar]') as HTMLElement;
    expect(bar.style.width).toBe('50%');
  });
});
