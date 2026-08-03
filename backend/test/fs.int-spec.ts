import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';

interface DirectoryListingBody {
  path: string;
  parent: string | null;
  dirs: Array<{ name: string; path: string }>;
}

function body(response: request.Response): DirectoryListingBody {
  return response.body as DirectoryListingBody;
}

describe('GET /fs/directories', () => {
  let app: INestApplication;
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'gameshelf-fs-'));
    await mkdir(join(root, 'snes'));
    await mkdir(join(root, 'gba'));
    await writeFile(join(root, 'notes.txt'), 'not a dir');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('lists only subdirectories, sorted, with path and parent', async () => {
    const response = await request(app.getHttpServer())
      .get('/fs/directories')
      .query({ path: root })
      .expect(200);

    expect(body(response).path).toBe(root);
    expect(body(response).parent).not.toBeNull();
    expect(body(response).dirs.map((d) => d.name)).toEqual(['gba', 'snes']);
    expect(body(response).dirs[0].path).toBe(join(root, 'gba'));
  });

  it('rejects a nonexistent path with 400', async () => {
    await request(app.getHttpServer())
      .get('/fs/directories')
      .query({ path: join(root, 'nope') })
      .expect(400);
  });

  it('rejects a file path with 400', async () => {
    await request(app.getHttpServer())
      .get('/fs/directories')
      .query({ path: join(root, 'notes.txt') })
      .expect(400);
  });
});
