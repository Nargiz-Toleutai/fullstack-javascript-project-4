import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import nock from 'nock';
import { createReadStream } from 'fs';
import { afterAll, beforeAll } from '@jest/globals';
import pageLoader from '../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);
const readFixtureFile = (filename) => fs.readFile(getFixturePath(filename), 'utf-8');

const url = 'https://ru.hexlet.io/courses';

let tempDir;

nock.disableNetConnect();

let data;
let changeData;
let imageData;
let htmlToResponse;
let expectedHtml;
let expectedCSS;
let expectedJS;
let expectedRelatedHtml;

beforeAll(async () => {
  data = await readFixtureFile('courses.html');
  changeData = await readFixtureFile('coursesResult.html');
  imageData = await readFixtureFile('nodejs.png');
  htmlToResponse = await readFixtureFile('otherResourses.html');
  expectedHtml = await readFixtureFile('otherResoursesResult.html');
  expectedCSS = await readFixtureFile('application.css');
  expectedJS = await readFixtureFile('runtime.js');
  expectedRelatedHtml = await readFixtureFile('otherResourses.html');
});

afterAll(async () => {
  nock.cleanAll();
  nock.enableNetConnect();
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('return correct path', () => {
  const filename = 'ru-hexlet-io-courses.html';
  test('in default directory', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, 'OK')
      .on('error', (err) => {
        console.error(err);
      });

    const tmpPageFilePath = path.join(tempDir, filename);
    const actual = await pageLoader(url, tempDir);

    expect(scope.isDone()).toBe(true);
    expect(actual).toBe(tmpPageFilePath);
  });

  test('in optional directory', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, 'OK')
      .on('error', (err) => {
        console.error(err);
      });
    const optionalDirectoryPath = '/var/tmp';
    const tmpPageDirpath = path.join(tempDir, optionalDirectoryPath);
    await fs.mkdir(tmpPageDirpath, { recursive: true });
    const tmpPageFilePath = path.join(tmpPageDirpath, filename);
    const result = await pageLoader(url, tmpPageDirpath);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(tmpPageFilePath);
  });
});

describe('checks files existence and its content', () => {
  test('in default directory', async () => {
    const expected = await readFixtureFile('ru-hexlet-io-courses.html');
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, data)
      .get('/assets/professions/nodejs.png')
      .reply(200, () => createReadStream(getFixturePath('nodejs.png')))
      .on('error', (err) => {
        console.error(err);
      });

    const result = await pageLoader(url, tempDir);
    const resultedHtml = await fs.readFile(result, 'utf-8');

    expect(scope.isDone()).toBe(true);
    expect(resultedHtml.trim()).toBe(expected.trim());
  });
  test('check downloading images', async () => {
    const imageFilename = 'ru-hexlet-io-assets-professions-nodejs.png';

    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, data)
      .get('/assets/professions/nodejs.png')
      .reply(200, () => createReadStream(getFixturePath('nodejs.png')))
      .on('error', (err) => {
        console.error(err);
      });

    const result = await pageLoader(url, tempDir);
    const resultedHtml = await fs.readFile(result, 'utf-8');
    const downloadedImagePath = path.join(tempDir, 'ru-hexlet-io-courses_files', imageFilename);
    const resultedImage = await fs.readFile(downloadedImagePath, 'utf-8');
    expect(scope.isDone()).toBe(true);
    expect(resultedImage.trim()).toBe(imageData.trim());
    expect(resultedHtml.trim()).toBe(changeData.trim());
  });
  test('check downloading links and scripts', async () => {
    const CSSFilename = 'ru-hexlet-io-assets-application.css';
    const relatedHtmlFilename = 'ru-hexlet-io-courses.html';
    const JSFilename = 'ru-hexlet-io-packs-js-runtime.js';

    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, htmlToResponse)
      .get('/assets/application.css')
      .replyWithFile(200, getFixturePath('application.css'), {
        'Cotent-Type': 'text/css',
      })
      .get('/courses')
      .reply(200, htmlToResponse)
      .get('/packs/js/runtime.js')
      .replyWithFile(200, getFixturePath('runtime.js'), {
        'Cotent-Type': 'text/javascript',
      })
      .get('/assets/professions/nodejs.png')
      .reply(200, () => createReadStream(getFixturePath('nodejs.png')))
      .on('error', (err) => {
        console.error(err);
      });

    const result = await pageLoader(url, tempDir);
    const resultedHtml = await fs.readFile(result, 'utf-8');
    const downloadedCSSPath = path.join(tempDir, 'ru-hexlet-io-courses_files', CSSFilename);
    const resultedCSS = await fs.readFile(downloadedCSSPath, 'utf-8');
    const downloadedRelatedHtmlPath = path.join(tempDir, 'ru-hexlet-io-courses_files', relatedHtmlFilename);

    const resultedRelatedHtml = await fs.readFile(downloadedRelatedHtmlPath, 'utf-8');
    const downloadedJSPath = path.join(tempDir, 'ru-hexlet-io-courses_files', JSFilename);
    const resultedJS = await fs.readFile(downloadedJSPath, 'utf-8');

    expect(scope.isDone()).toBe(true);
    expect(resultedHtml.trim()).toBe(expectedHtml.trim());
    expect(resultedCSS.trim()).toBe(expectedCSS.trim());
    expect(resultedRelatedHtml.trim()).toBe(expectedRelatedHtml.trim());
    expect(resultedJS.trim()).toBe(expectedJS.trim());
  });
});

//= == 3

describe('library throw errors', () => {
  test('throw network error', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('Network Error')
      .on('error', (err) => {
        console.error(err);
      });
    await expect(pageLoader(url, tempDir)).rejects.toThrow('Network Error');
    expect(scope.isDone()).toBe(true);
    expect.assertions(2);
  });
  test('network error (connection problem)', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('ENOTFOUND')
      .on('error', (err) => {
        console.error(err);
      });
    await expect(pageLoader(url, tempDir)).rejects.toThrow('ENOTFOUND');
    expect(scope.isDone()).toBe(true);
    expect.assertions(2);
  });
  test('more network error (loading resources)', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('Unathorized')
      .on('error', (err) => {
        console.error(err);
      });
    await expect(pageLoader(url, tempDir)).rejects.toThrow('Unathorized');
    expect(scope.isDone()).toBe(true);
    expect.assertions(2);
  });
  test('throw file system error', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('EACCES: permission denied')
      .on('error', (err) => {
        console.error(err);
      });
    const pathWithDeniedPermission = '/private/var/folders';
    await expect(pageLoader(url, pathWithDeniedPermission)).rejects.toThrow('EACCES: permission denied');
    expect(scope.isDone()).toBe(true);
    expect.assertions(2);
  });
  test('disallowed net connect', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .replyWithError('ENETUNREACH')
      .on('error', (err) => {
        console.error(err);
      });
    await expect(pageLoader(url, tempDir)).rejects.toThrow('ENETUNREACH');
    expect(scope.isDone()).toBe(true);
    expect.assertions(2);
  });
});

describe('Throwed exceptions', () => {
  test('Http errors', async () => {
    nock('https://foo.bar.baz')
      .get(/no-response/)
      .replyWithError('ENOTFOUND foo.bar.baz')
      .get(/404/)
      .reply(404)
      .get(/500/)
      .reply(500)
      .on('error', (err) => {
        console.error(err);
      });

    await expect(pageLoader('https://foo.bar.baz/no-response', tempDir)).rejects.toThrow('ENOTFOUND foo.bar.baz');
    await expect(pageLoader('https://foo.bar.baz/404', tempDir)).rejects.toThrow('Request failed with status code 404');
    await expect(pageLoader('https://foo.bar.baz/500', tempDir)).rejects.toThrow('Request failed with status code 500');
  });
  test('Fs errors', async () => {
    nock(/example.com/)
      .get('/')
      .twice()
      .reply(200);

    await expect(pageLoader('https://example.com', '/sys')).rejects.toThrow("EACCES: permission denied, open '/sys/example-com.html', open '/sys/example-com.html'");
    await expect(pageLoader('https://example.com', '/notExistingFolder')).rejects.toThrow("EACCES: permission denied, open '/sys/example-com.html', open '/notExistingFolder/example-com.html'");
  });
});
