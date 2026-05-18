import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { fsPromisesMock, unlinkMock } = vi.hoisted(() => {
  const mock = {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    writeFile: vi.fn(),
  };

  return {
    fsPromisesMock: mock,
    unlinkMock: mock.unlink,
  };
});

vi.mock('node:fs/promises', () => ({
  ...fsPromisesMock,
  default: fsPromisesMock,
}));

const originalStorageRoot = process.env.AUDIO_STORAGE_ROOT;
const storageRoot = path.join('/tmp', 'estateos-photo-storage');

async function loadDeleteObjectPhotoFile() {
  const { deleteObjectPhotoFile } = await import('@/lib/audio-storage');
  return deleteObjectPhotoFile;
}

describe('deleteObjectPhotoFile', () => {
  beforeEach(() => {
    vi.resetModules();
    unlinkMock.mockReset();
    process.env.AUDIO_STORAGE_ROOT = storageRoot;
  });

  afterAll(() => {
    if (originalStorageRoot === undefined) {
      delete process.env.AUDIO_STORAGE_ROOT;
    } else {
      process.env.AUDIO_STORAGE_ROOT = originalStorageRoot;
    }
  });

  it('unlinks object photos under the configured storage root', async () => {
    unlinkMock.mockResolvedValue(undefined);
    const deleteObjectPhotoFile = await loadDeleteObjectPhotoFile();

    await deleteObjectPhotoFile('/audio/objects/foo/bar.jpg');

    expect(unlinkMock).toHaveBeenCalledTimes(1);
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join(storageRoot, 'objects', 'foo', 'bar.jpg')
    );
  });

  it('ignores URLs outside the managed /audio namespace', async () => {
    const deleteObjectPhotoFile = await loadDeleteObjectPhotoFile();

    await expect(deleteObjectPhotoFile('/etc/passwd')).resolves.toBeUndefined();

    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it('rejects path traversal inside the managed /audio namespace', async () => {
    const deleteObjectPhotoFile = await loadDeleteObjectPhotoFile();

    await expect(
      deleteObjectPhotoFile('/audio/objects/foo/../../../etc/passwd')
    ).rejects.toThrow('Path escape detected');

    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it('surfaces unlink failures such as missing files', async () => {
    const missingFileError = new Error('ENOENT');
    unlinkMock.mockRejectedValue(missingFileError);
    const deleteObjectPhotoFile = await loadDeleteObjectPhotoFile();

    await expect(deleteObjectPhotoFile('/audio/objects/foo/missing.jpg')).rejects.toThrow(
      'ENOENT'
    );
  });
});
