import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader, { replaceUrls } from '../src/index';
import copyImages from '../src/copyImage';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (name) => path.join(dirname, '..', '__fixtures__', name);

// const files = [
//   ['filepath1.json', 'filepath2.json', 'stylish'],
//   ['filepath1.json', 'filepath2.json', 'json'],
//   ['filepath1.json', 'filepath2.json', 'plain'],
//   ['filepath1.yml', 'filepath2.yaml'],
// ];

let tempDir;

const url = 'https://ru.hexlet.io/courses';

const server = () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, path.join(dirname, '..', '__fixtures__/courses.html'), {
      'Content-Type': 'text/html',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/professions/nodejs.png')
    .replyWithFile(200, path.join(dirname, '..', '__fixtures__/node.png'), {
      'Content-Type': 'image/png',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .replyWithFile(200, path.join(dirname, '..', '__fixtures__/coursesResult.html'), {
      'Content-Type': 'text/html',
    });
};

server();

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(() => {
  tempDir = null;
});

test('download page', async () => {
  const link = await pageLoader(tempDir, url);
  const expected = [
    `Page was successfully downloaded into ${tempDir}/ru-hexlet-io-courses.html`,
  ];
  expect(link).toEqual(expected);
});

test('change urls', async () => {
  const data = await fs.readFile(getFixturePath('courses.html'), 'utf-8');
  const link = await copyImages(url, data, tempDir);
  const expected = {
    '/assets/professions/nodejs.png': 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
  };
  expect(link).toEqual(expected);
});

test('change url in html file', async () => {
  const data = await fs.readFile(getFixturePath('courses.html'), 'utf-8');
  const imagePaths = await copyImages(url, data, tempDir);
  const actual = replaceUrls(data, imagePaths);
  const expected = await fs.readFile(getFixturePath('coursesResult.html'), 'utf-8');
  expect(actual).toEqual(expected);
});
