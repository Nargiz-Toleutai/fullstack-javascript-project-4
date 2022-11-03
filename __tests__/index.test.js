import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import pageLoader from '../src/index';

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

test('test1', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const link = await pageLoader(tempDir, url);
  const expected = [
    `Page was successfully downloaded into ${tempDir}/ru-hexlet-io-courses.html`,
  ];
  expect(link).toEqual(expected);
});
