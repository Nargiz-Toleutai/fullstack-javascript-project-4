/* eslint-disable no-undef */
import os from 'os';
import nock from 'nock';
import { fileURLToPath } from 'url';
import path from 'path';
import fsp from 'fs/promises';
import downloadPage from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmpFilePath = path.join(os.tmpdir());
const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);

let data;
let changeData;
let imagedata;
let cssData;
let jsData;

nock.disableNetConnect();

beforeAll(async () => {
  data = await fsp.readFile(path.join(getFixturePath('ru-hexlet-io-courses_files'), 'ru-hexlet-io-courses.html'), 'utf-8');
  imagedata = await fsp.readFile(path.join(getFixturePath('ru-hexlet-io-courses_files'), 'ru-hexlet-io-assets-professions-nodejs.png'), 'utf-8');
  changeData = await fsp.readFile(path.join(getFixturePath('ru-hexlet-io-courses.html')), 'utf-8');
  cssData = await fsp.readFile(path.join(getFixturePath('ru-hexlet-io-courses_files'), 'ru-hexlet-io-assets-application.css'), 'utf-8');
  jsData = await fsp.readFile(path.join(getFixturePath('ru-hexlet-io-courses_files'), 'ru-hexlet-io-packs-js-runtime.js'), 'utf-8');
});

afterAll(async () => {
  await fsp.unlink(path.join(tmpFilePath, 'ru-hexlet-io-courses.html'));
  await fsp.rm(path.join(tmpFilePath, 'ru-hexlet-io-courses_files'), { recursive: true, force: true });
});

let receivedDirname;
beforeEach(async () => {
  receivedDirname = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('Positive download', () => {
  test('Download page', async () => {
    nock(/ru\.hexlet\.io/)
      .get(/\/courses/)
      .reply(200, data)
      .get(/\/assets\/professions\/nodejs\.png/)
      .reply(200, imagedata)
      .get(/\/assets\/application\.css/)
      .reply(200, cssData)
      .get(/\/packs\/js\/runtime\.js/)
      .reply(200, jsData)
      .get(/\/courses/)
      .reply(200, data);
    const actualChangeData = changeData;
    const actualImageData = imagedata;
    const actualCssData = cssData;
    const actualjsData = jsData;
    await downloadPage('https://ru.hexlet.io/courses', tmpFilePath);
    const expectedChangedata = await fsp.readFile(path.join(tmpFilePath, 'ru-hexlet-io-courses.html'), 'utf-8');
    const expectedJsData = await fsp.readFile(path.join(tmpFilePath, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-packs-js-runtime.js'), 'utf-8');
    const expectedImageData = await fsp.readFile(path.join(tmpFilePath, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-professions-nodejs.png'), 'utf-8');
    const expectedCssData = await fsp.readFile(path.join(tmpFilePath, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-application.css'), 'utf-8');
    expect(expectedChangedata).toEqual(actualChangeData);
    expect(expectedImageData).toEqual(actualImageData);
    expect(expectedCssData).toEqual(actualCssData);
    expect(expectedJsData).toEqual(actualjsData);
  });
});

describe('Throwed exceptions', () => {
  test('Http errors', async () => {
    nock('https://foo.bar.baz')
      .get(/no-response/)
      .replyWithError('getaddrinfo ENOTFOUND foo.bar.baz')
      .get(/404/)
      .reply(404)
      .get(/500/)
      .reply(500);

    await expect(downloadPage('https://foo.bar.baz/no-response', receivedDirname)).rejects.toThrow('getaddrinfo ENOTFOUND foo.bar.baz');
    await expect(downloadPage('https://foo.bar.baz/404', receivedDirname)).rejects.toThrow('Request failed with status code 404');
    await expect(downloadPage('https://foo.bar.baz/500', receivedDirname)).rejects.toThrow('Request failed with status code 500');
  });

  test('Fs errors', async () => {
    nock(/example.com/)
      .get('/')
      .twice()
      .reply(200);

    await expect(downloadPage('https://example.com', '/sys')).rejects.toThrow("EACCES: permission denied, mkdir '/sys/example-com_files'");
    await expect(downloadPage('https://example.com', '/notExistingFolder')).rejects.toThrow("EACCES: permission denied, mkdir '/notExistingFolder'");
  });
});
