import { WebFolderPickerService } from './folder-picker.service';

describe('WebFolderPickerService', () => {
  it('opens the browsing surface and resolves the pick with the chosen path', async () => {
    const service = new WebFolderPickerService();
    expect(service.browsing()).toBe(false);
    const pending = service.pick();
    expect(service.browsing()).toBe(true);
    service.resolve('C:\\roms');
    await expect(pending).resolves.toBe('C:\\roms');
    expect(service.browsing()).toBe(false);
  });

  it('resolves null when cancelled', async () => {
    const service = new WebFolderPickerService();
    const pending = service.pick();
    service.resolve(null);
    await expect(pending).resolves.toBeNull();
  });

  it('cancels a previous pending pick when pick is called again', async () => {
    const service = new WebFolderPickerService();
    const first = service.pick();
    const second = service.pick();
    service.resolve('C:\\roms');
    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toBe('C:\\roms');
  });
});
