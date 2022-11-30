/* eslint-disable import/extensions */
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader, { replaceUrls } from '../src/index.js';
import copyResourses from '../src/copyResourses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);

const url = 'https://ru.hexlet.io/courses';

const server = () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/courses.html'), {
      'Content-Type': 'text/html',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/professions/nodejs.png')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/node.png'), {
      'Content-Type': 'image/png',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/coursesResult.html'), {
      'Content-Type': 'text/html',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/application.css')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/otherResourses.html'), {
      'Content-Type': 'text/html',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/otherResourses.html'), {
      'Content-Type': 'text/html',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/professions/nodejs.png')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/otherResourses.html'), {
      'Content-Type': 'image/png',
    });
  nock('https://ru.hexlet.io')
    .persist()
    .get('/packs/js/runtime.js')
    .replyWithFile(200, path.join(__dirname, '..', '__fixtures__/otherResourses.html'), {
      'Content-Type': 'text/html',
    });
};

server();

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(() => {
  tempDir = null;
});

test('download page', async () => {
  const link = await pageLoader(url, tempDir);
  const expected = `Page was successfully downloaded into ${tempDir}/ru-hexlet-io-courses.html`;
  expect(link).toEqual(expected);
});

test('fails with error when no url provided', async () => {
  await expect(pageLoader('', tempDir)).rejects.toThrow('no request url provided');
});

test('invalid directory', async () => {
  await expect(pageLoader(url, '/sys/site-com-blog-about_files/site-com-photos-me.jpg')).rejects.toThrow('directory does not exist');
});

test('invalid request url', async () => {
  await expect(pageLoader('https://site.com/blog/about ', tempDir)).rejects.toThrow('invalid request url');
});

test('originalUrl and replaceUrls with attributes', async () => {
  const data = await fs.readFile(getFixturePath('otherResourses.html'), 'utf-8');
  const link = await copyResourses(url, tempDir, data);
  const expected = {
    '/assets/application.css': {
      attr: 'href',
      newPath: 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css',
    },
    '/assets/professions/nodejs.png': {
      attr: 'src',
      newPath: 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
    },
    '/courses': {
      attr: 'href',
      newPath: 'ru-hexlet-io-courses_files/ru-hexlet-io-courses.html',
    },
    'https://ru.hexlet.io/packs/js/runtime.js': {
      attr: 'src',
      newPath: 'ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js',
    },
  };
  expect(link).toEqual(expected);
});

test('change urls in courses html file', async () => {
  const data = await fs.readFile(getFixturePath('courses.html'), 'utf-8');
  const imagePaths = await copyResourses(url, tempDir, data);
  const actual = replaceUrls(data, imagePaths);
  const expected = await fs.readFile(getFixturePath('coursesResult.html'), 'utf-8');
  expect(actual).toEqual(expected);
});

test('change urls in otherResourses html file', async () => {
  const data = await fs.readFile(getFixturePath('otherResourses.html'), 'utf-8');
  const imagePaths = await copyResourses(url, tempDir, data);
  const actual = replaceUrls(data, imagePaths);
  const expected = await fs.readFile(getFixturePath('otherResoursesResult.html'), 'utf-8');
  expect(actual).toEqual(expected);
});
